import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LifeBuoy,
  ArrowLeft,
  Send,
  Mic,
  MicOff,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Utensils,
  MapPin,
  ShieldCheck,
  RotateCcw,
  Volume2,
  VolumeX,
  Radio,
  FileCheck,
  Compass,
  HeartPulse,
  Stethoscope,
  Activity
} from 'lucide-react';
import Header from './Header';
import { voiceService } from '../services/voiceService';
import {
  SURVIVAL_PROMPTS,
  generateSurvivalGuidance,
  isDistressQuery
} from '../agents/survival-kit-agent';
import {
  matchMedicalScenario,
  generateMedicalGuidance,
  getMedicalFallback
} from '../agents/medical-agent';

const MEDICAL_GREETINGS = {
  en: "🏥 Medical Mode Activated: Describe the injury, symptom, or emergency (e.g., 'someone having a seizure', 'deep cut bleeding', 'drowning', 'heatstroke', 'broken bone').",
  hi: "🏥 मेडिकल मोड सक्रिय: चोट, लक्षण या आपातकालीन स्थिति का वर्णन करें (उदा. 'दौरा पड़ रहा है', 'गहरा घाव', 'डूबना', 'लू लगना', 'हड्डी टूटना')।",
  ta: "🏥 மருத்துவ அவசர முறை செயல்படுத்தப்பட்டது: காயம் அல்லது அறிகுறிகளை விவரிக்கவும் (எ.கா. 'வலிப்பு வந்துள்ளது', 'ஆழமான வெட்டுக்காயம்', 'நீரில் மூழ்குதல்', 'வெப்பத் தாக்குதல்').",
  te: "🏥 మెడికల్ మోడ్ ప్రారంభించబడింది: గాయం లేదా అత్యవసర పరిస్థితిని వివరించండి (ఉదా. 'మూర్ఛ వచ్చింది', 'రక్తస్రావం', 'నీటిలో మునిగిపోవడం', 'వడదెబ్బ').",
  ml: "🏥 മെഡിക്കൽ മോഡ് സജീവമാക്കി: പരിക്കോ രോഗലക്ഷണമോ വ്യക്തമാക്കുക (ഉദാ: 'അപസ്മാരം/ഫിറ്റ്സ്', 'മുറിവ്/രക്തസ്രാവം', 'സൂര്യാഘാതം').",
  bn: "🏥 মেডিকেল মোড সক্রিয়: আঘাত বা লক্ষণ বর্ণনা করুন (যেমন 'খিঁচুনি হচ্ছে', 'রক্তপাত', 'জলে ডোবা', 'হিটস্ট্রোক')।"
};

export default function SurvivalKitView({
  currentUser,
  activeRole,
  setActiveRole,
  onLogout,
  selectedLang,
  setSelectedLang,
  uiDict,
  speechLang,
  userLocation,
  onToggleFeaturePhone,
  onOpenCatchReport
}) {
  const navigate = useNavigate();
  const ui = uiDict?.ui || {};

  // Mode: normal distress flow vs Medical Mode
  const [isMedicalMode, setIsMedicalMode] = useState(false);
  const [pendingMedicalScenario, setPendingMedicalScenario] = useState(null);

  // Steps for normal distress: 1 = Food, 2 = Water, 3 = Location, 4 = Complete
  const [step, setStep] = useState(1);
  const [foodText, setFoodText] = useState('');
  const [waterText, setWaterText] = useState('');
  const [locationText, setLocationText] = useState('');
  const [inputText, setInputText] = useState('');

  const [guidanceResult, setGuidanceResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Chat message history for the guided session
  const [dialogue, setDialogue] = useState([]);
  const messagesEndRef = useRef(null);

  const prompts = SURVIVAL_PROMPTS[selectedLang] || SURVIVAL_PROMPTS.en;

  // Initialize greeting prompt on mount or language change or mode change
  useEffect(() => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isMedicalMode) {
      const medGreeting = MEDICAL_GREETINGS[selectedLang] || MEDICAL_GREETINGS.en;
      setDialogue([
        { sender: 'bot', text: medGreeting, time: timeStr, isMedical: true }
      ]);
      if (!isMuted) {
        voiceService.speak(medGreeting, speechLang);
      }
    } else {
      if (step === 1) {
        const initialGreeting = prompts.concernGreeting;
        setDialogue([
          { sender: 'bot', text: initialGreeting, time: timeStr }
        ]);
        if (!isMuted) {
          voiceService.speak(initialGreeting, speechLang);
        }
      }
    }
  }, [selectedLang, isMedicalMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialogue, isProcessing]);

  const handleMicClick = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    voiceService.startListening({
      speechLang,
      onResult: (transcript) => {
        setInputText(transcript);
      },
      onError: (err) => {
        console.warn("Speech error:", err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  // Handle Medical Mode Queries
  const handleMedicalQuery = async (query) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const text = query || inputText;
    if (!text.trim() || isProcessing) return;

    setInputText('');
    setDialogue((prev) => [...prev, { sender: 'user', text, time: timeStr }]);
    setIsProcessing(true);

    try {
      // If we were waiting for missing age in a pending scenario (e.g. seizure):
      if (pendingMedicalScenario && pendingMedicalScenario.requiresAge) {
        const scenario = pendingMedicalScenario;
        setPendingMedicalScenario(null);

        const result = await generateMedicalGuidance({
          role: activeRole || 'Fisherman',
          scenario,
          ageText: text,
          locationText: userLocation?.name || 'Coastal Waters',
          lang: selectedLang
        });

        setGuidanceResult({
          severity: result.severity,
          matchedHarbor: { name: userLocation?.name || 'Nearest Shore Facility' },
          reportType: 'Medical'
        });

        setDialogue((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: result.guidanceText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isGuidance: true,
            severity: result.severity,
            isMedical: true
          }
        ]);

        if (!isMuted) {
          voiceService.speak(result.guidanceText, speechLang);
        }
        return;
      }

      // Match new medical scenario
      const scenario = matchMedicalScenario(text, selectedLang);

      if (!scenario) {
        // Safe fallback
        const fallback = getMedicalFallback(selectedLang);
        setDialogue((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `⚠️ ${fallback}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMedical: true
          }
        ]);
        if (!isMuted) {
          voiceService.speak(fallback, speechLang);
        }
        return;
      }

      // If scenario requires age (e.g., seizure), prompt user for age first:
      if (scenario.requiresAge) {
        // Check if user already provided age in query (e.g. "50 year old seizure" or "child seizure")
        const hasAgeNumber = /\b([0-9]{1,2})\b/.test(text) || text.includes('child') || text.includes('बच्चा') || text.includes('குழந்தை') || text.includes('old') || text.includes('elderly');
        if (!hasAgeNumber) {
          setPendingMedicalScenario(scenario);
          const ageQ = scenario.agePrompt[selectedLang] || scenario.agePrompt.en;
          setDialogue((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: `🚨 ${ageQ}`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMedical: true
            }
          ]);
          if (!isMuted) {
            voiceService.speak(ageQ, speechLang);
          }
          return;
        }
      }

      // Generate complete advice & auto-file
      const result = await generateMedicalGuidance({
        role: activeRole || 'Fisherman',
        scenario,
        ageText: text,
        locationText: userLocation?.name || 'Coastal Waters',
        lang: selectedLang
      });

      setGuidanceResult({
        severity: result.severity,
        matchedHarbor: { name: userLocation?.name || 'Nearest Shore Facility' },
        reportType: 'Medical'
      });

      setDialogue((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: result.guidanceText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isGuidance: true,
          severity: result.severity,
          isMedical: true
        }
      ]);

      if (!isMuted) {
        voiceService.speak(result.guidanceText, speechLang);
      }
    } catch (err) {
      console.error('Medical guidance processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextStep = async (userAnswer) => {
    if (isMedicalMode) {
      return handleMedicalQuery(userAnswer);
    }

    const answer = userAnswer || inputText;
    if (!answer.trim() || isProcessing) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setInputText('');

    if (step === 1) {
      setFoodText(answer);
      const nextPrompt = prompts.askWater;
      setDialogue((prev) => [
        ...prev,
        { sender: 'user', text: answer, time: timeStr },
        { sender: 'bot', text: nextPrompt, time: timeStr }
      ]);
      setStep(2);
      if (!isMuted) voiceService.speak(nextPrompt, speechLang);
    } else if (step === 2) {
      setWaterText(answer);
      const nextPrompt = prompts.askLocation;
      setDialogue((prev) => [
        ...prev,
        { sender: 'user', text: answer, time: timeStr },
        { sender: 'bot', text: nextPrompt, time: timeStr }
      ]);
      setStep(3);
      if (!isMuted) voiceService.speak(nextPrompt, speechLang);
    } else if (step === 3) {
      const finalLoc = answer;
      setLocationText(finalLoc);
      setDialogue((prev) => [
        ...prev,
        { sender: 'user', text: answer, time: timeStr }
      ]);
      setIsProcessing(true);

      try {
        const result = await generateSurvivalGuidance({
          role: activeRole || 'Fisherman',
          foodText: foodText,
          waterText: waterText,
          locationText: finalLoc,
          lang: selectedLang
        });

        setGuidanceResult({ ...result, reportType: 'Distress' });
        setStep(4);

        setDialogue((prev) => [
          ...prev,
          { sender: 'bot', text: result.guidanceText, time: timeStr, isGuidance: true, severity: result.severity }
        ]);

        if (!isMuted) {
          // Speak high-priority summary
          const audioSpeech = `${prompts.confirmation} ${result.waterRes?.text || ''}`;
          voiceService.speak(audioSpeech, speechLang);
        }
      } catch (err) {
        console.error('Survival guidance error:', err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleReset = () => {
    voiceService.stopSpeaking();
    setStep(1);
    setFoodText('');
    setWaterText('');
    setLocationText('');
    setInputText('');
    setPendingMedicalScenario(null);
    setGuidanceResult(null);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isMedicalMode) {
      const medGreeting = MEDICAL_GREETINGS[selectedLang] || MEDICAL_GREETINGS.en;
      setDialogue([
        { sender: 'bot', text: medGreeting, time: timeStr, isMedical: true }
      ]);
      if (!isMuted) voiceService.speak(medGreeting, speechLang);
    } else {
      const initialGreeting = prompts.concernGreeting;
      setDialogue([
        { sender: 'bot', text: initialGreeting, time: timeStr }
      ]);
      if (!isMuted) voiceService.speak(initialGreeting, speechLang);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ocean-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Progress & Protocol Status & Medical Mode Toggle */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Back to Menu & Status Card */}
          <div className="glass-panel p-5 rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-ocean-900/60 to-ocean-950 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-semibold transition-all group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Dashboard Menu</span>
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
                title="Reset Survival Protocol"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>
            </div>

            {/* Mode Header Banner */}
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg animate-pulse ${
                isMedicalMode
                  ? 'bg-rose-600/30 border border-rose-500/60 text-rose-300 shadow-rose-600/30'
                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-amber-500/20'
              }`}>
                {isMedicalMode ? <HeartPulse className="w-6 h-6 text-rose-400" /> : <LifeBuoy className="w-6 h-6 text-amber-400" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
                  <span>{isMedicalMode ? 'Medical First Aid Protocol' : 'Survival Kit Protocol'}</span>
                </h2>
                <p className="text-[11px] text-rose-400 font-semibold uppercase tracking-wider">
                  {isMedicalMode ? 'Emergency Medical Matcher' : 'Emergency State Machine'}
                </p>
              </div>
            </div>

            {/* MEDICAL MODE TOGGLE SWITCH */}
            <div className="mt-5 p-3 rounded-2xl bg-ocean-900/90 border border-rose-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${isMedicalMode ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-100">Medical Mode</div>
                  <div className="text-[10px] text-slate-400">
                    {isMedicalMode ? 'Triage, seizures, wounds, stings' : 'Switch for onboard medical emergencies'}
                  </div>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMedicalMode}
                  onChange={(e) => {
                    setIsMedicalMode(e.target.checked);
                    setPendingMedicalScenario(null);
                    setGuidanceResult(null);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            {/* Non-medical Mode: Step Progress Indicators */}
            {!isMedicalMode ? (
              <>
                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Emergency Protocol Status</span>
                    <span className="text-rose-400">
                      {step === 4 ? 'Guidance Active' : `Step ${step} of 3`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-rose-500 h-full transition-all duration-500 rounded-full"
                      style={{ width: `${step === 4 ? 100 : (step / 3) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Steps Checklist */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${step >= 2 ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : step === 1 ? 'bg-rose-950/60 border-rose-500/50 text-rose-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    <Utensils className="w-4 h-4 shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold">Step 1: Food Supplies</div>
                      <div className="text-[10px] opacity-80 truncate">{foodText ? `Reported: ${foodText}` : 'Awaiting input...'}</div>
                    </div>
                    {step >= 2 && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${step >= 3 ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : step === 2 ? 'bg-rose-950/60 border-rose-500/50 text-rose-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    <Droplets className="w-4 h-4 shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold">Step 2: Potable Water</div>
                      <div className="text-[10px] opacity-80 truncate">{waterText ? `Reported: ${waterText}` : 'Awaiting input...'}</div>
                    </div>
                    {step >= 3 && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${step >= 4 ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : step === 3 ? 'bg-rose-950/60 border-rose-500/50 text-rose-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    <MapPin className="w-4 h-4 shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold">Step 3: Location / Bay</div>
                      <div className="text-[10px] opacity-80 truncate">{locationText ? `Reported: ${locationText}` : 'Awaiting input...'}</div>
                    </div>
                    {step >= 4 && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4 p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-xs space-y-2">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>10 Predefined Marine Medical Scenarios</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Ask about seizures, near-drowning CPR, deep bleeding, fractures, heatstroke, hypothermia, hook injuries, jellyfish stings, unconsciousness, or dehydration.
                </p>
              </div>
            )}
          </div>

          {/* Automatic Dispatch Confirmation Box */}
          {guidanceResult && (
            <div className="glass-panel p-4 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 text-xs space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <FileCheck className="w-4 h-4" />
                <span>Coast Authority Report Filed</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span>Type: <strong className="text-cyan-300 font-semibold">{guidanceResult.reportType || 'Distress'}</strong></span>
                <span>•</span>
                <span>Severity: <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${guidanceResult.severity === 'HIGH' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-900'}`}>{guidanceResult.severity}</span></span>
              </div>
            </div>
          )}

          {/* Distress / Medical Safety Guidelines Card */}
          <div className="glass-panel p-4 rounded-3xl border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-rose-400" />
              <span>Emergency Maritime Radio Channels</span>
            </div>
            <ul className="space-y-1 text-[11px]">
              <li>• <span className="text-slate-300 font-medium">VHF Channel 16:</span> 156.8 MHz (Distress, Safety & Calling)</li>
              <li>• <span className="text-slate-300 font-medium">Medical Evacuation Pan-Pan:</span> VHF Ch 16</li>
              <li>• <span className="text-slate-300 font-medium">Indian Coast Guard MRCC:</span> 1554 (Toll-Free)</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Interactive Conversational Feed */}
        <div className="lg:col-span-8 flex flex-col h-[calc(100vh-8.5rem)] glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          {/* Feed Header */}
          <div className="p-3.5 border-b border-slate-800 bg-ocean-950/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isMedicalMode ? 'bg-rose-500' : 'bg-amber-400'} animate-ping`}></span>
              <span className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                {isMedicalMode ? (
                  <>
                    <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                    <span>Emergency Medical Response Channel</span>
                  </>
                ) : (
                  <>
                    <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Vessel Distress Protocol Channel</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newMute = !isMuted;
                  setIsMuted(newMute);
                  if (newMute) voiceService.stopSpeaking();
                }}
                className={`p-1.5 rounded-xl border text-xs transition-colors ${
                  isMuted ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                }`}
                title={isMuted ? "Unmute Voice Announcements" : "Mute Voice Announcements"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Dialogue Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {dialogue.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-md ${
                    msg.isMedical ? 'bg-rose-600/30 border-rose-500/50 text-rose-300' : 'bg-amber-600/30 border-amber-500/50 text-amber-300'
                  }`}>
                    {msg.isMedical ? <HeartPulse className="w-4 h-4" /> : <LifeBuoy className="w-4 h-4" />}
                  </div>
                )}

                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-rose-600/30 border border-rose-500/40 text-slate-100 rounded-tr-none shadow-md'
                      : msg.isGuidance
                      ? 'bg-ocean-900/95 border-2 border-rose-500/60 text-slate-100 rounded-tl-none shadow-2xl space-y-2'
                      : 'bg-ocean-850 border border-slate-700/80 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap font-sans">{msg.text}</p>

                  {/* Audio replay button inside message */}
                  {msg.sender === 'bot' && (
                    <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between">
                      <button
                        onClick={() => voiceService.speak(msg.text, speechLang)}
                        className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Replay Voice Guidance</span>
                      </button>
                      <span className="text-[10px] text-slate-500">{msg.time}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-3 text-xs text-rose-400 bg-rose-950/40 p-3 rounded-2xl border border-rose-500/30 animate-pulse">
                <HeartPulse className="w-4 h-4 animate-spin text-rose-400" />
                <span>Processing medical emergency protocol & filing incident report...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick preset chips */}
          <div className="px-4 py-2 border-t border-slate-800/80 bg-ocean-950/40 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Quick Presets:</span>
            {isMedicalMode ? (
              <>
                <button onClick={() => handleMedicalQuery('Someone is having a seizure')} className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25">Convulsing / Seizure</button>
                <button onClick={() => handleMedicalQuery('Person fell overboard, near drowning and water in lungs')} className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25">Drowning / CPR</button>
                <button onClick={() => handleMedicalQuery('Deep cut with severe bleeding')} className="px-2.5 py-1 rounded-lg bg-ocean-800 border border-slate-700 text-slate-200 hover:bg-slate-700">Severe Bleeding</button>
                <button onClick={() => handleMedicalQuery('Suspected broken bone in leg')} className="px-2.5 py-1 rounded-lg bg-ocean-800 border border-slate-700 text-slate-200 hover:bg-slate-700">Broken Bone</button>
                <button onClick={() => handleMedicalQuery('Crew member got stung by a jellyfish')} className="px-2.5 py-1 rounded-lg bg-ocean-800 border border-slate-700 text-slate-200 hover:bg-slate-700">Jellyfish Sting</button>
                <button onClick={() => handleMedicalQuery('Fish hook stuck deep in hand')} className="px-2.5 py-1 rounded-lg bg-ocean-800 border border-slate-700 text-slate-200 hover:bg-slate-700">Fish Hook Injury</button>
                <button onClick={() => handleMedicalQuery('Heatstroke and dizzy from extreme sun')} className="px-2.5 py-1 rounded-lg bg-ocean-800 border border-slate-700 text-slate-200 hover:bg-slate-700">Heatstroke</button>
              </>
            ) : (
              <>
                {step === 1 && (
                  <>
                    <button onClick={() => handleNextStep('No food left')} className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25">No food (0)</button>
                    <button onClick={() => handleNextStep('1 day biscuits & dry rations')} className="px-2.5 py-1 rounded-lg bg-ocean-800 border border-slate-700 text-slate-200 hover:bg-slate-700">1 Day Rations</button>
                    <button onClick={() => handleNextStep('3 days canned food & rice')} className="px-2.5 py-1 rounded-lg bg-ocean-800 border border-slate-700 text-slate-200 hover:bg-slate-700">3 Days Food</button>
                  </>
                )}
                {step === 2 && (
                  <>
                    <button onClick={() => handleNextStep('0.5 Litres (very little)')} className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25">&lt; 1 Litre (Critical)</button>
                    <button onClick={() => handleNextStep('2 Litres water')} className="px-2.5 py-1 rounded-lg bg-ocean-800 border border-slate-700 text-slate-200 hover:bg-slate-700">2 Litres</button>
                    <button onClick={() => handleNextStep('5 Litres potable water')} className="px-2.5 py-1 rounded-lg bg-ocean-800 border border-slate-700 text-slate-200 hover:bg-slate-700">5 Litres</button>
                  </>
                )}
                {step === 3 && (
                  <>
                    <button onClick={() => handleNextStep('Started from Chennai Fishing Harbour')} className="px-2.5 py-1 rounded-lg bg-ocean-800 border border-slate-700 text-slate-200 hover:bg-slate-700">Chennai Harbour</button>
                    <button onClick={() => handleNextStep('Offshore Kochi / Vypin Bay')} className="px-2.5 py-1 rounded-lg bg-ocean-800 border border-slate-700 text-slate-200 hover:bg-slate-700">Kochi Bay</button>
                    <button onClick={() => handleNextStep('Visakhapatnam Coast / Dolphin Nose')} className="px-2.5 py-1 rounded-lg bg-ocean-800 border border-slate-700 text-slate-200 hover:bg-slate-700">Vizag Coast</button>
                    <button onClick={() => handleNextStep('Near Rameswaram Jetty')} className="px-2.5 py-1 rounded-lg bg-ocean-800 border border-slate-700 text-slate-200 hover:bg-slate-700">Rameswaram</button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Voice Input & Text Input Bar */}
          {(isMedicalMode || step <= 3) ? (
            <form onSubmit={(e) => { e.preventDefault(); isMedicalMode ? handleMedicalQuery() : handleNextStep(); }} className="p-3.5 border-t border-slate-800 bg-ocean-950 shrink-0">
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`p-2.5 rounded-xl border transition-all shrink-0 ${
                    isListening
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                  }`}
                  title="Speak response"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isMedicalMode
                      ? pendingMedicalScenario
                        ? "Enter approximate age (e.g., '45 years old' or 'child')..."
                        : "Describe medical condition or emergency (e.g., 'seizure', 'severe cut')..."
                      : step === 1
                      ? "Enter food amount (e.g., '1 packet biscuits' or 'no food')..."
                      : step === 2
                      ? "Enter water in litres (e.g., '1.5 Litres' or 'none')..."
                      : "Enter location or departure bay (e.g., 'Chennai Harbour')..."
                  }
                  className="flex-1 bg-ocean-850 border border-slate-700/80 focus:border-rose-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isProcessing}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-40 text-white font-semibold transition-all shrink-0 shadow-md shadow-rose-600/20 flex items-center gap-1 text-xs"
                >
                  <span>Submit</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3.5 border-t border-slate-800 bg-ocean-950 flex items-center justify-between shrink-0">
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Emergency protocol completed & guidance locked.</span>
              </span>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>Start New Emergency Session</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
