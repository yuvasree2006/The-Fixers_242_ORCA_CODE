import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowLeft,
  Waves,
  Sparkles,
  Bot,
  User,
  Radio,
  MapPin,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import Header from './Header';
import MapView from './MapView';
import AgentActivityTrace from './AgentActivityTrace';
import ReasoningCard from './ReasoningCard';
import { voiceService } from '../services/voiceService';
import { COASTAL_REGIONS, FOREIGN_WATERS_ALERTS } from '../utils/coastalRegions';
import { matchIntent, getFallbackResponse, detectScriptLang } from '../agents/intent-matcher';
import { isDistressQuery } from '../agents/survival-kit-agent';
import {
  getPfzList,
  getWeatherLocal,
  getGeospatialLocal,
  computeRiskLocal,
  computeRouteLocal,
  buildAnswerText,
  buildMapLayers,
  buildPlanSteps,
} from '../agents/client-pipeline';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export default function VoiceAssistantView({
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
  onToggleFeaturePhone,
  onOpenCatchReport
}) {
  const navigate = useNavigate();
  const ui = uiDict?.ui || {};

  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `🎙️ Voice Assistant Active. Tap the microphone and speak your query in any coastal language. Current region: ${userLocation?.name || 'Chennai'}.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [planSteps, setPlanSteps] = useState([]);
  const [activeAgentIndex, setActiveAgentIndex] = useState(-1);
  const [weather, setWeather] = useState(null);
  const [geospatial, setGeospatial] = useState(null);
  const [risk, setRisk] = useState(null);
  const [explainability, setExplainability] = useState(null);
  const [mapLayers, setMapLayers] = useState(null);

  // Foreign-Waters Alert State
  const [foreignAlert, setForeignAlert] = useState(null);

  // Selected region tracker
  const selectedRegion = COASTAL_REGIONS.find(
    (r) => Math.abs(r.lat - userLocation.lat) < 0.2 && Math.abs(r.lng - userLocation.lng) < 0.2
  ) || COASTAL_REGIONS[0];

  // Initialize Map Layers on mount or region change
  useEffect(() => {
    const pfzList = getPfzList();
    const geo = getGeospatialLocal(userLocation.lat, userLocation.lng, pfzList);
    const route = computeRouteLocal(userLocation.lat, userLocation.lng, geo.nearestPfz);
    setMapLayers(buildMapLayers(userLocation, pfzList, geo, route));
  }, [userLocation]);

  const handleVoiceQuery = async (queryText) => {
    if (!queryText || !queryText.trim() || isLoading) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Distress intent check -> if detected, route or prompt handoff to survival kit
    if (isDistressQuery(queryText)) {
      navigate('/dashboard/survival-kit');
      return;
    }

    // Auto-detect language
    const autoLang = detectScriptLang(queryText);
    const effectiveLang = autoLang !== 'en' ? autoLang : selectedLang;
    if (autoLang !== 'en' && autoLang !== selectedLang) {
      setSelectedLang(autoLang);
    }

    setMessages((prev) => [...prev, { sender: 'user', text: queryText, time: timeStr }]);
    setIsLoading(true);
    setPlanSteps([]);
    setActiveAgentIndex(-1);

    // FOREIGN-WATERS ALERT RULE:
    // If selected region is non-Indian AND query is safety/venture/travel related
    const isForeign = !selectedRegion.isIndianRegion;
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
      const alertTemplate = FOREIGN_WATERS_ALERTS[effectiveLang] || FOREIGN_WATERS_ALERTS.en;
      setForeignAlert(alertTemplate);

      const alertBotText = `🛑 ${alertTemplate.title}\n\n${alertTemplate.description}`;
      setMessages((prev) => [...prev, { sender: 'bot', text: alertBotText, time: timeStr, isAlert: true }]);

      if (!isMuted) {
        voiceService.speak(alertTemplate.title, speechLang);
      }
      setIsLoading(false);
      return;
    } else {
      setForeignAlert(null);
    }

    try {
      const { intent } = matchIntent(queryText, effectiveLang);
      const resolvedIntent = intent || 'SAFETY_CHECK';

      const steps = buildPlanSteps(resolvedIntent, effectiveLang);
      setPlanSteps(steps);

      for (let i = 0; i < steps.length; i++) {
        setActiveAgentIndex(i);
        await delay(250);
      }
      setActiveAgentIndex(steps.length);

      const pfzList = getPfzList();
      const wxData = getWeatherLocal(userLocation.lat, userLocation.lng);
      const geoData = getGeospatialLocal(userLocation.lat, userLocation.lng, pfzList);
      const riskData = computeRiskLocal(wxData, geoData);
      const routeData = computeRouteLocal(userLocation.lat, userLocation.lng, geoData.nearestPfz);

      let botText;
      if (!intent) {
        botText = getFallbackResponse(effectiveLang);
      } else {
        botText = buildAnswerText(resolvedIntent, effectiveLang, wxData, geoData, riskData, routeData);
      }

      const layers = buildMapLayers(userLocation, pfzList, geoData, routeData);
      setWeather(wxData);
      setGeospatial(geoData);
      setRisk(riskData);
      setExplainability({ responseText: botText, intent: resolvedIntent, lang: effectiveLang });
      setMapLayers(layers);

      setMessages((prev) => [...prev, { sender: 'bot', text: botText, time: timeStr }]);

      if (!isMuted) {
        voiceService.speak(botText, speechLang);
      }
    } catch (err) {
      console.error('Voice pipeline error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    voiceService.startListening({
      speechLang,
      onResult: (resultText) => {
        setTranscript(resultText);
      },
      onError: (err) => {
        console.warn('Speech error:', err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
        if (transcript.trim()) {
          handleVoiceQuery(transcript.trim());
          setTranscript('');
        }
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-ocean-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <Header
        selectedLang={selectedLang}
        onLangChange={setSelectedLang}
        onToggleFeaturePhone={onToggleFeaturePhone}
        onOpenCatchReport={onOpenCatchReport}
        onNavigateHome={() => navigate('/')}
        onLogout={onLogout}
        currentUser={currentUser}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        uiDict={ui}
      />

      {/* Main Grid */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Dedicated Voice Terminal */}
        <div className="lg:col-span-5 flex flex-col gap-4 h-[calc(100vh-6.5rem)]">
          {/* Top Voice Header Card */}
          <div className="glass-panel p-5 rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-ocean-900/60 to-ocean-950 flex flex-col justify-between shrink-0">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-semibold transition-all group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Dashboard Menu</span>
              </button>

              {/* Coastal Region Dropdown */}
              <div className="flex items-center gap-1.5 bg-ocean-900 border border-cyan-500/40 rounded-xl px-2.5 py-1 text-xs shadow-inner">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <select
                  value={selectedRegion.id}
                  onChange={(e) => {
                    const reg = COASTAL_REGIONS.find((r) => r.id === e.target.value);
                    if (reg) {
                      setUserLocation({ lat: reg.lat, lng: reg.lng, name: reg.name });
                    }
                  }}
                  className="bg-transparent text-cyan-300 font-bold outline-none cursor-pointer text-xs"
                >
                  {COASTAL_REGIONS.map((reg) => (
                    <option key={reg.id} value={reg.id} className="bg-ocean-900 text-slate-100">
                      {reg.name} {!reg.isIndianRegion ? '🌍 (Foreign)' : '🇮🇳'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Central Voice Pulsing Ring */}
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="relative mb-3">
                {isListening && (
                  <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
                )}
                <button
                  onClick={toggleListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-105 ${
                    isListening
                      ? 'bg-rose-600 text-white ring-8 ring-rose-500/30 animate-pulse'
                      : 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white ring-4 ring-cyan-400/30'
                  }`}
                >
                  {isListening ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
                </button>
              </div>

              <h3 className="font-bold text-sm text-slate-100">
                {isListening ? "Listening... Speak clearly" : "Tap to Speak Voice Query"}
              </h3>
              <p className="text-[11px] text-cyan-400/90 mt-0.5">
                {transcript ? `"${transcript}"` : "Automatic speech-to-text & instant voice reasoning"}
              </p>
            </div>

            {/* Controls Bar */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-blue-400" />
                <span>Web Speech API (Key-Free)</span>
              </div>
              <button
                onClick={() => {
                  const newMute = !isMuted;
                  setIsMuted(newMute);
                  if (newMute) voiceService.stopSpeaking();
                }}
                className={`p-1.5 rounded-lg border text-xs ${
                  isMuted ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                }`}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Foreign-Waters Alert Banner if active */}
          {foreignAlert && (
            <div className="glass-panel p-4 rounded-3xl border-2 border-rose-500 bg-rose-950/40 text-rose-200 text-xs space-y-2 animate-shake shrink-0">
              <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
                <span>{foreignAlert.title}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-200">
                {foreignAlert.description}
              </p>
            </div>
          )}

          {/* Dialogue Feed */}
          <div className="flex-1 glass-panel rounded-3xl border border-slate-800 p-4 overflow-y-auto space-y-3 min-h-0">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-blue-300" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600/30 border border-blue-500/40 text-slate-100 rounded-tr-none'
                      : msg.isAlert
                      ? 'bg-rose-950/60 border border-rose-500/50 text-rose-200 rounded-tl-none font-medium'
                      : 'bg-ocean-850 border border-slate-700/80 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.sender === 'bot' && (
                    <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between">
                      <button
                        onClick={() => voiceService.speak(msg.text, speechLang)}
                        className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Replay Voice</span>
                      </button>
                      <span className="text-[10px] text-slate-500">{msg.time}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Spatial Dashboard & Live Ships */}
        <div className="lg:col-span-7 flex flex-col gap-4 h-[calc(100vh-6.5rem)] overflow-y-auto pr-1">
          <div className="h-[420px] w-full shrink-0">
            <MapView
              mapLayers={mapLayers}
              userLocation={userLocation}
              onLocationChange={setUserLocation}
            />
          </div>

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
    </div>
  );
}
