import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import VoiceNoticeBanner from './components/VoiceNoticeBanner';
import SidebarChat from './components/SidebarChat';
import MapView from './components/MapView';
import AgentActivityTrace from './components/AgentActivityTrace';
import ReasoningCard from './components/ReasoningCard';
import FeaturePhoneModal from './components/FeaturePhoneModal';
import CatchReportModal from './components/CatchReportModal';
import SafetyDashboard from './components/SafetyDashboard';

// New Features
import DashboardMenu from './components/DashboardMenu';
import SurvivalKitView from './components/SurvivalKitView';
import NearbyShipsView from './components/NearbyShipsView';
import CatchLogView from './components/CatchLogView';
import GuardianDashboard from './components/GuardianDashboard';
import AdminDashboard from './components/AdminDashboard';
import { COASTAL_REGIONS, FOREIGN_WATERS_ALERTS } from './utils/coastalRegions';
import { isDistressQuery } from './agents/survival-kit-agent';

// ──────────────────────────────────────────────────────────
//  CLIENT-SIDE PIPELINE (zero server calls for Q&A)
// ──────────────────────────────────────────────────────────
import { matchIntent, getFallbackResponse, detectScriptLang } from './agents/intent-matcher';
import {
  getPfzList,
  getWeatherLocal,
  getGeospatialLocal,
  computeRiskLocal,
  computeRouteLocal,
  buildAnswerText,
  buildMapLayers,
  buildPlanSteps,
} from './agents/client-pipeline';

import { voiceService } from './services/voiceService';
import { authService } from './services/authService';
import { LANGUAGE_OPTIONS } from './utils/languageDetector';
import { AlertTriangle, X } from 'lucide-react';

import enDict from '../data/i18n/en.json';
import hiDict from '../data/i18n/hi.json';
import taDict from '../data/i18n/ta.json';
import teDict from '../data/i18n/te.json';
import mlDict from '../data/i18n/ml.json';
import bnDict from '../data/i18n/bn.json';

const DICTIONARY_MAP = { en: enDict, hi: hiDict, ta: taDict, te: teDict, ml: mlDict, bn: bnDict };

/** Simulate short async delay for realistic agent activity trace animation */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Main Chatbot View (Tile 1 — Protected)
 */
function ChatbotView({
  currentUser,
  activeRole,
  setActiveRole,
  onLogout,
  selectedLang,
  setSelectedLang,
  uiDict,
  speechLang,
  userLocation,
  setUserLocation,
}) {
  const navigate = useNavigate();

  const getRoleGreeting = (role) => {
    switch (role) {
      case 'Commercial Operator':
        return "Welcome to ORCA — Commercial Operator Dashboard. Optimized for multi-day trawlers, offshore chlorophyll intelligence, and fuel-efficient fleet routing. All processing runs 100% locally in your browser.";
      case 'Society / Coastal Fisherman':
        return "Welcome to ORCA — Society & Coastal Community Dashboard. Real-time regional advisories, community vessel safety alerts, and crowdsourced catch reporting. 100% client-side execution.";
      case 'Port Authority':
        return "Welcome to ORCA — Port Authority Command Operations. Sea state approach monitoring, port closure guidance, and regulatory maritime boundary enforcement. 100% client-side execution.";
      case 'Fisherman':
      default:
        return "Welcome to ORCA — Fisherman Safety & Zone Assistant. Live wave forecasts, nearest PFZ fishing zones, harbor safety, and emergency guidelines. All processing runs 100% offline in your browser.";
    }
  };

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: getRoleGreeting(activeRole || 'Fisherman'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // When active role changes, notify user in chat
  useEffect(() => {
    setMessages((prev) => [
      ...prev,
      {
        sender: 'bot',
        text: `🔄 Active View Switched to: [${activeRole}] — ${getRoleGreeting(activeRole)}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [activeRole]);

  const [isLoading, setIsLoading] = useState(false);
  const [planSteps, setPlanSteps] = useState([]);
  const [activeAgentIndex, setActiveAgentIndex] = useState(-1);

  const [weather, setWeather] = useState(null);
  const [geospatial, setGeospatial] = useState(null);
  const [risk, setRisk] = useState(null);
  const [explainability, setExplainability] = useState(null);
  const [mapLayers, setMapLayers] = useState(null);

  const [isFeaturePhoneOpen, setIsFeaturePhoneOpen] = useState(false);
  const [isCatchReportOpen, setIsCatchReportOpen] = useState(false);
  const [isVoiceWarningDismissed, setIsVoiceWarningDismissed] = useState(false);

  // Foreign-Waters Alert State
  const [foreignAlertModal, setForeignAlertModal] = useState(null);

  // Selected Region
  const currentRegion = COASTAL_REGIONS.find(
    (r) => Math.abs(r.lat - userLocation.lat) < 0.2 && Math.abs(r.lng - userLocation.lng) < 0.2
  ) || COASTAL_REGIONS[0];

  // Initialize PFZ map layers on mount and region update
  useEffect(() => {
    const pfzList = getPfzList();
    const geo = getGeospatialLocal(userLocation.lat, userLocation.lng, pfzList);
    const route = computeRouteLocal(userLocation.lat, userLocation.lng, geo.nearestPfz);
    setMapLayers(buildMapLayers(userLocation, pfzList, geo, route));
  }, [userLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Chat Queries locally
  const handleSendMessage = async (queryText, isMuted = false) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Auto-detect language from script
    const autoLang = detectScriptLang(queryText);
    const effectiveLang = autoLang !== 'en' ? autoLang : selectedLang;
    if (autoLang !== 'en' && autoLang !== selectedLang) {
      setSelectedLang(autoLang);
    }

    // 1. Distress Intent Handoff: if user enters distress phrase in regular chat, route to Survival Kit
    if (isDistressQuery(queryText)) {
      navigate('/dashboard/survival-kit');
      return;
    }

    setMessages((prev) => [...prev, { sender: 'user', text: queryText, time: timeStr }]);
    setIsLoading(true);
    setPlanSteps([]);
    setActiveAgentIndex(-1);

    // 2. FOREIGN-WATERS ALERT RULE:
    // When selected region is a NON-INDIAN coastal location (Colombo, Chittagong, Karachi, etc.)
    // and user asks a venture-safety/travel/fishing question:
    const isForeign = !currentRegion.isIndianRegion;
    const lowerQuery = queryText.toLowerCase();
    const isTravelSafetyQuery =
      lowerQuery.includes('safe') ||
      lowerQuery.includes('travel') ||
      lowerQuery.includes('go') ||
      lowerQuery.includes('weather') ||
      lowerQuery.includes('venture') ||
      lowerQuery.includes('fish') ||
      lowerQuery.includes('surakshit') ||
      lowerQuery.includes('सुरक्षित') ||
      lowerQuery.includes('பாதுகாப்ப') ||
      lowerQuery.includes('சுற்றுலா');

    if (isForeign && isTravelSafetyQuery) {
      const alertData = FOREIGN_WATERS_ALERTS[effectiveLang] || FOREIGN_WATERS_ALERTS.en;
      setForeignAlertModal(alertData);

      const alertBotText = `🛑 ${alertData.title}\n\n${alertData.description}`;
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: alertBotText, time: timeStr }
      ]);

      if (!isMuted) {
        voiceService.speak(alertData.title, speechLang);
      }
      setIsLoading(false);
      return;
    }

    try {
      // ── AGENT 1 & 2: Intent + Language Detection + Planner ──
      const { intent } = matchIntent(queryText, effectiveLang);
      const resolvedIntent = intent || 'SAFETY_CHECK';

      const steps = buildPlanSteps(resolvedIntent, effectiveLang);
      setPlanSteps(steps);

      // Animate agent steps
      for (let i = 0; i < steps.length; i++) {
        setActiveAgentIndex(i);
        await delay(250);
      }
      setActiveAgentIndex(steps.length);

      // ── AGENTS 3 to 7: Marine, Weather, Geospatial, Risk, Route ──
      const pfzList = getPfzList();
      const wxData = getWeatherLocal(userLocation.lat, userLocation.lng);
      const geoData = getGeospatialLocal(userLocation.lat, userLocation.lng, pfzList);
      const riskData = computeRiskLocal(wxData, geoData);
      const routeData = computeRouteLocal(userLocation.lat, userLocation.lng, geoData.nearestPfz);

      // ── AGENT 8: NLG Response ──
      let botText;
      if (!intent) {
        botText = getFallbackResponse(effectiveLang);
      } else {
        botText = buildAnswerText(resolvedIntent, effectiveLang, wxData, geoData, riskData, routeData);
      }

      // ── AGENT 9: Map Layers ──
      const layers = buildMapLayers(userLocation, pfzList, geoData, routeData);

      setWeather(wxData);
      setGeospatial(geoData);
      setRisk(riskData);
      setExplainability({ responseText: botText, intent: resolvedIntent, lang: effectiveLang });
      setMapLayers(layers);

      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: botText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);

      if (!isMuted) {
        voiceService.speak(botText, speechLang);
      }
    } catch (err) {
      console.error('Client pipeline error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `⚠️ Local reasoning error: ${err.message}. Please try a different query.`,
          time: timeStr,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplayAudio = (text) => voiceService.speak(text, speechLang);

  const handleClearChat = () => {
    setMessages([
      {
        sender: 'bot',
        text: 'Conversation cleared. Ready for your next query.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setPlanSteps([]);
    setActiveAgentIndex(-1);
  };

  const handleCatchSubmitted = (confirmMsg) => {
    setMessages((prev) => [
      ...prev,
      { sender: 'bot', text: confirmMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
  };

  const lastBotMessage = [...messages].reverse().find((m) => m.sender === 'bot')?.text;

  return (
    <div className="min-h-screen flex flex-col bg-ocean-950 text-slate-100 font-sans">
      {!isVoiceWarningDismissed && (
        <VoiceNoticeBanner
          isSupported={voiceService.isSupported}
          onClose={() => setIsVoiceWarningDismissed(true)}
          warningText={uiDict.ui?.voiceNotSupported}
        />
      )}

      {/* Persistent Dashboard Top Bar */}
      <Header
        selectedLang={selectedLang}
        onLangChange={setSelectedLang}
        onToggleFeaturePhone={() => setIsFeaturePhoneOpen(true)}
        onOpenCatchReport={() => setIsCatchReportOpen(true)}
        onNavigateHome={() => navigate('/')}
        onBackToMenu={() => navigate('/dashboard')}
        onLogout={onLogout}
        currentUser={currentUser}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        selectedRegion={currentRegion}
        onRegionChange={(reg) => setUserLocation({ lat: reg.lat, lng: reg.lng, name: reg.name })}
        uiDict={uiDict.ui}
      />

      {/* Foreign-Waters Modal Alert */}
      {foreignAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel p-6 rounded-3xl border-2 border-rose-500 bg-ocean-900 max-w-lg w-full shadow-2xl relative space-y-4 animate-shake">
            <button
              onClick={() => setForeignAlertModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center animate-bounce">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 uppercase">
                  {foreignAlertModal.tag || "Restricted Advisory"}
                </span>
                <h3 className="text-base font-extrabold text-rose-300 leading-tight mt-1">
                  {foreignAlertModal.title}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed bg-rose-950/40 p-4 rounded-2xl border border-rose-500/30">
              {foreignAlertModal.description}
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setForeignAlertModal(null)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all"
              >
                Acknowledge Advisory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Split Grid Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 max-w-[1800px] w-full mx-auto">
        {/* Left: Chat Feed without chips */}
        <div className="lg:col-span-4 h-[calc(100vh-6.5rem)] rounded-2xl overflow-hidden shadow-2xl">
          <SidebarChat
            messages={messages}
            onSendMessage={handleSendMessage}
            selectedLang={selectedLang}
            speechLang={speechLang}
            uiDict={uiDict}
            isLoading={isLoading}
            onClearChat={handleClearChat}
            onReplayAudio={handleReplayAudio}
          />
        </div>

        {/* Right: Spatial Dashboard */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-[calc(100vh-6.5rem)] overflow-y-auto pr-1">
          <div className="h-[420px] w-full shrink-0">
            <MapView
              mapLayers={mapLayers}
              userLocation={userLocation}
              onLocationChange={setUserLocation}
            />
          </div>

          {/* Safety Dashboard Panel — below the map */}
          <SafetyDashboard
            risk={risk}
            weather={weather}
            geospatial={geospatial}
            selectedLang={selectedLang}
            selectedRegion={currentRegion}
          />

          {planSteps.length > 0 && (
            <AgentActivityTrace
              planSteps={planSteps}
              activeAgentIndex={activeAgentIndex}
              uiDict={uiDict}
            />
          )}

          <ReasoningCard
            explainability={explainability}
            weather={weather}
            geospatial={geospatial}
            risk={risk}
            uiDict={uiDict}
          />
        </div>
      </main>

      <FeaturePhoneModal
        isOpen={isFeaturePhoneOpen}
        onClose={() => setIsFeaturePhoneOpen(false)}
        lastResponse={lastBotMessage}
        uiDict={uiDict}
      />

      <CatchReportModal
        isOpen={isCatchReportOpen}
        onClose={() => setIsCatchReportOpen(false)}
        userLocation={userLocation}
        selectedLang={selectedLang}
        onCatchSubmitted={handleCatchSubmitted}
      />
    </div>
  );
}

/**
 * Root Application Routes with Strict Role-Based Route Guarding
 */
function AppRoutes() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRole, setActiveRole] = useState('Fisherman');
  const [selectedLang, setSelectedLang] = useState('en');
  const [uiDict, setUiDict] = useState(enDict);
  const [speechLang, setSpeechLang] = useState('en-US');
  const [userLocation, setUserLocation] = useState({ lat: 13.0827, lng: 80.2707, name: 'Chennai (India)' });

  const navigate = useNavigate();
  const location = useLocation();

  // Load current user from token on startup
  useEffect(() => {
    async function initUser() {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        if (user.role) setActiveRole(user.role);
      }
    }
    initUser();
  }, []);

  // Update activeRole when currentUser changes
  useEffect(() => {
    if (currentUser?.role) {
      setActiveRole(currentUser.role);
    }
  }, [currentUser]);

  // Sync dictionary when language changes
  useEffect(() => {
    const dict = DICTIONARY_MAP[selectedLang] || enDict;
    setUiDict(dict);
    const langOpt = LANGUAGE_OPTIONS.find((l) => l.code === selectedLang);
    if (langOpt) setSpeechLang(langOpt.speechLang);
  }, [selectedLang]);

  // Logout handler
  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    navigate('/', { replace: true });
  };

  const isAdmin = currentUser?.role === 'Admin';
  const isGuardian = currentUser?.role === 'Guardian';

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            selectedLang={selectedLang}
            onLangChange={setSelectedLang}
            currentUser={currentUser}
          />
        }
      />

      <Route
        path="/login"
        element={
          <LoginPage
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              if (user?.role) setActiveRole(user.role);
            }}
          />
        }
      />

      <Route
        path="/signup"
        element={
          <SignupPage
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              if (user?.role) setActiveRole(user.role);
            }}
          />
        }
      />

      {/* Admin Route Guarded strictly for Admin role */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute currentUser={currentUser} setCurrentUser={setCurrentUser}>
            {currentUser?.role === 'Admin' ? (
              <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/dashboard" replace />
            )}
          </ProtectedRoute>
        }
      />

      {/* Guardian Route Guarded strictly for Guardian role */}
      <Route
        path="/guardian"
        element={
          <ProtectedRoute currentUser={currentUser} setCurrentUser={setCurrentUser}>
            {currentUser?.role === 'Guardian' ? (
              <GuardianDashboard currentUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/dashboard" replace />
            )}
          </ProtectedRoute>
        }
      />

      {/* 4-Tile Dashboard Menu (Role Landing Screen) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute currentUser={currentUser} setCurrentUser={setCurrentUser}>
            {isAdmin ? (
              <Navigate to="/admin" replace />
            ) : isGuardian ? (
              <Navigate to="/guardian" replace />
            ) : (
              <DashboardMenu
                currentUser={currentUser}
                activeRole={activeRole}
                setActiveRole={setActiveRole}
                onLogout={handleLogout}
                selectedLang={selectedLang}
                setSelectedLang={setSelectedLang}
                uiDict={uiDict}
                onToggleFeaturePhone={() => {}}
                onOpenCatchReport={() => {}}
              />
            )}
          </ProtectedRoute>
        }
      />

      {/* Tile 1: Chatbot View */}
      <Route
        path="/dashboard/chat"
        element={
          <ProtectedRoute currentUser={currentUser} setCurrentUser={setCurrentUser}>
            {isAdmin ? (
              <Navigate to="/admin" replace />
            ) : isGuardian ? (
              <Navigate to="/guardian" replace />
            ) : (
              <ChatbotView
                currentUser={currentUser}
                activeRole={activeRole}
                setActiveRole={setActiveRole}
                onLogout={handleLogout}
                selectedLang={selectedLang}
                setSelectedLang={setSelectedLang}
                uiDict={uiDict}
                speechLang={speechLang}
                userLocation={userLocation}
                setUserLocation={setUserLocation}
              />
            )}
          </ProtectedRoute>
        }
      />

      {/* Tile 2: Survival Kit View */}
      <Route
        path="/dashboard/survival-kit"
        element={
          <ProtectedRoute currentUser={currentUser} setCurrentUser={setCurrentUser}>
            {isAdmin ? (
              <Navigate to="/admin" replace />
            ) : isGuardian ? (
              <Navigate to="/guardian" replace />
            ) : (
              <SurvivalKitView
                currentUser={currentUser}
                activeRole={activeRole}
                setActiveRole={setActiveRole}
                onLogout={handleLogout}
                selectedLang={selectedLang}
                setSelectedLang={setSelectedLang}
                uiDict={uiDict}
                speechLang={speechLang}
                userLocation={userLocation}
                onToggleFeaturePhone={() => {}}
                onOpenCatchReport={() => {}}
              />
            )}
          </ProtectedRoute>
        }
      />

      {/* Tile 3: Nearby Ships View */}
      <Route
        path="/dashboard/nearby-ships"
        element={
          <ProtectedRoute currentUser={currentUser} setCurrentUser={setCurrentUser}>
            {isAdmin ? (
              <Navigate to="/admin" replace />
            ) : isGuardian ? (
              <Navigate to="/guardian" replace />
            ) : (
              <NearbyShipsView
                currentUser={currentUser}
                activeRole={activeRole}
                setActiveRole={setActiveRole}
                onLogout={handleLogout}
                selectedLang={selectedLang}
                setSelectedLang={setSelectedLang}
                uiDict={uiDict}
                userLocation={userLocation}
                setUserLocation={setUserLocation}
                onToggleFeaturePhone={() => {}}
                onOpenCatchReport={() => {}}
              />
            )}
          </ProtectedRoute>
        }
      />

      {/* Tile 4: Catch Log View */}
      <Route
        path="/dashboard/catch-log"
        element={
          <ProtectedRoute currentUser={currentUser} setCurrentUser={setCurrentUser}>
            {isAdmin ? (
              <Navigate to="/admin" replace />
            ) : isGuardian ? (
              <Navigate to="/guardian" replace />
            ) : (
              <CatchLogView
                currentUser={currentUser}
                activeRole={activeRole}
                setActiveRole={setActiveRole}
                onLogout={handleLogout}
                selectedLang={selectedLang}
                setSelectedLang={setSelectedLang}
                uiDict={uiDict}
                speechLang={speechLang}
                userLocation={userLocation}
                setUserLocation={setUserLocation}
              />
            )}
          </ProtectedRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
