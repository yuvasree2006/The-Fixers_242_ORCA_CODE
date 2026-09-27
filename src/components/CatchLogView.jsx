import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fish,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Mic,
  MicOff,
  MapPin,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Scale,
  Sparkles,
  CheckCircle2,
  History,
  RefreshCw,
  FileText
} from 'lucide-react';
import Header from './Header';
import { voiceService } from '../services/voiceService';
import boundariesMock from '../../data/boundaries_mock.json' with { type: 'json' };
import { COASTAL_REGIONS } from '../utils/coastalRegions';

const CATCH_LOG_I18N = {
  en: {
    title: 'Marine Catch & Trip Log',
    subtitle: 'Trip Record, Species Accounting & Profit Tracker',
    newEntryTitle: 'Log New Fishing Trip Catch',
    speciesHeader: 'Target Species & Haul Quantities',
    addSpeciesBtn: '+ Add Another Species',
    speciesPlaceholder: 'e.g. Indian Mackerel, Sardines, Tuna',
    quantityPlaceholder: 'Quantity (e.g. 50 kg, 200 count)',
    locationLabel: 'Catch Location / GPS Coastal Point',
    detectingGps: 'Detecting GPS position...',
    dateLabel: 'Trip Date & Time',
    profitLossLabel: 'Economic Outcome',
    profit: 'Profit',
    loss: 'Loss',
    breakeven: 'Break-even',
    notesLabel: 'Trip Notes / Gear Used (Optional)',
    notesPlaceholder: 'e.g., Gillnet operated at 35m depth, calm sea',
    saveLogBtn: 'Save Catch Log',
    voiceFillBtn: 'Voice Fill Log',
    voiceFillPrompt: "Say something like: 'Log 50 kg of sardines and 20 kg mackerel at Chennai, it was a profit'",
    tripHistoryTitle: 'Your Trip History',
    noHistory: 'No trip logs recorded yet. Complete your first catch entry above!',
    savedSuccess: '✅ Trip catch log saved successfully!',
  },
  hi: {
    title: 'मछली पकड़ने का कैच लॉग',
    subtitle: 'यात्रा रिकॉर्ड, प्रजाति विवरण और लाभ-हानि ट्रैकर',
    newEntryTitle: 'नई मछली पकड़ने की यात्रा दर्ज करें',
    speciesHeader: 'मछली की प्रजाति और मात्रा',
    addSpeciesBtn: '+ अन्य प्रजाति जोड़ें',
    speciesPlaceholder: 'उदा. मैकेरल, सार्डिन, टूना',
    quantityPlaceholder: 'मात्रा (उदा. 50 किग्रा)',
    locationLabel: 'स्थान / तटीय जीपीएस बिंदु',
    detectingGps: 'जीपीएस स्थान का पता लगाया जा रहा है...',
    dateLabel: 'तारीख और समय',
    profitLossLabel: 'वित्तीय परिणाम',
    profit: 'लाभ (Profit)',
    loss: 'हानि (Loss)',
    breakeven: 'बराबर (Break-even)',
    notesLabel: 'अतिरिक्त विवरण / जाल का प्रकार',
    notesPlaceholder: 'उदा. गिलनेट 35 मीटर गहराई पर',
    saveLogBtn: 'कैच लॉग सुरक्षित करें',
    voiceFillBtn: 'बोलकर भरें',
    voiceFillPrompt: "बोलें: 'चेन्नई में 50 किलो सार्डिन दर्ज करें, यह लाभ था'",
    tripHistoryTitle: 'आपकी यात्रा का इतिहास',
    noHistory: 'अभी तक कोई कैच लॉग दर्ज नहीं है।',
    savedSuccess: '✅ कैच लॉग सफलतापूर्वक सहेजा गया!',
  },
  ta: {
    title: 'மீன்பிடி பதிவு & வரவு செலவு',
    subtitle: 'பயண விவரம், மீன் இனங்கள் & லாப-நஷ்ட கண்காணிப்பு',
    newEntryTitle: 'புதிய மீன்பிடிப் பதிவைச் சேர்க்கவும்',
    speciesHeader: 'மீன் இனங்கள் & எடை அளவு',
    addSpeciesBtn: '+ கூடுதல் மீன் இனம் சேர்க்கவும்',
    speciesPlaceholder: 'எ.கா. கானாங்கெளுத்தி, மத்தி, சூரை',
    quantityPlaceholder: 'அளவு (எ.கா. 50 கிலோ)',
    locationLabel: 'மீன்பிடித்த இடம் / ஜி.பி.எஸ் புள்ளி',
    detectingGps: 'ஜி.பி.எஸ் இருப்பிடம் அறியப்படுகிறது...',
    dateLabel: 'தேதி மற்றும் நேரம்',
    profitLossLabel: 'பொருளாதார முடிவு',
    profit: 'லாபம் (Profit)',
    loss: 'நஷ்டம் (Loss)',
    breakeven: 'சமம் (Break-even)',
    notesLabel: 'குறிப்புகள் / பயன்படுத்திய வலை',
    notesPlaceholder: 'எ.கா. 35 மீ ஆழத்தில் வலை வீசப்பட்டது',
    saveLogBtn: 'பதிவைச் சேமிக்கவும்',
    voiceFillBtn: 'குரல் மூலம் பதிவு',
    voiceFillPrompt: "பேசவும்: 'சென்னையில் 50 கிலோ மத்தி மீன், லாபம் கிடைத்தது'",
    tripHistoryTitle: 'உங்கள் பயண வரலாறு',
    noHistory: 'பதிவுகள் எதுவும் இல்லை.',
    savedSuccess: '✅ மீன்பிடிப் பதிவு வெற்றிகரமாகச் சேமிக்கப்பட்டது!',
  },
  te: {
    title: 'చేపల వేట లాగ్ & రికార్డు',
    subtitle: 'చేపల రకాలు, పరిమాణం & లాభనష్టాల వివరాలు',
    newEntryTitle: 'కొత్త చేపల వేట వివరాలు నమోదు చేయండి',
    speciesHeader: 'చేప రకాలు & పరిమాణం',
    addSpeciesBtn: '+ మరో చేప రకాన్ని జోడించండి',
    speciesPlaceholder: 'ఉదా. కవ్వళ్ళు, వంజరం, ట్యూనా',
    quantityPlaceholder: 'పరిమాణం (ఉదా. 50 కేజీలు)',
    locationLabel: 'ప్రదేశం / తీరప్రాంతం',
    detectingGps: 'జీపీఎస్ ప్రదేశాన్ని గుర్తిస్తోంది...',
    dateLabel: 'తేదీ మరియు సమయం',
    profitLossLabel: 'ఆర్థిక ఫలితం',
    profit: 'లాభం',
    loss: 'నష్టం',
    breakeven: 'సమం',
    notesLabel: 'వివరాలు / వాడిన వల',
    notesPlaceholder: 'ఉదా. 35 మీటర్ల లోతులో వేట',
    saveLogBtn: 'లాగ్ సేవ్ చేయండి',
    voiceFillBtn: 'వాయిస్ ద్వారా నింపండి',
    voiceFillPrompt: "వాయిస్ కమాండ్: '50 కేజీల చేపలు, లాభం వచ్చింది'",
    tripHistoryTitle: 'మీ గత వేట చరిత్ర',
    noHistory: 'ఇంకా ఎలాంటి రికార్డులు లేవు.',
    savedSuccess: '✅ వివరాలు విజయవంతంగా సేవ్ అయ్యాయి!',
  },
  ml: {
    title: 'മത്സ്യബന്ധന ക്യാച്ച് ലോഗ്',
    subtitle: 'മത്സ്യ ഇനങ്ങൾ, അളവ് & ലാഭനഷ്ട വിവരങ്ങൾ',
    newEntryTitle: 'പുതിയ ലോഗ് ചേർക്കുക',
    speciesHeader: 'മത്സ്യ ഇനങ്ങളും തൂക്കവും',
    addSpeciesBtn: '+ മറ്റൊരു ഇനം ചേർക്കുക',
    speciesPlaceholder: 'ഉദാ: അയല, മത്തി, ചൂര',
    quantityPlaceholder: 'അളവ് (ഉദാ: 50 kg)',
    locationLabel: 'ലൊക്കേഷൻ / തീരം',
    detectingGps: 'ജി.പി.എസ് കണ്ടെത്തുന്നു...',
    dateLabel: 'തീയതിയും സമയവും',
    profitLossLabel: 'സാമ്പത്തിക ഫലം',
    profit: 'ലാഭം',
    loss: 'നഷ്ടം',
    breakeven: 'തുല്യം',
    notesLabel: 'കുറിപ്പുകൾ',
    notesPlaceholder: 'ഉദാ: 35 മീറ്റർ ആഴത്തിൽ',
    saveLogBtn: 'ലോഗ് സേവ് ചെയ്യുക',
    voiceFillBtn: 'ശബ്ദം വഴി രേഖപ്പെടുത്തുക',
    voiceFillPrompt: "പറയുക: '50 കിലോ മത്തി, ലാഭമായിരുന്നു'",
    tripHistoryTitle: 'നിങ്ങളുടെ മുൻ ലോഗുകൾ',
    noHistory: 'ലോഗുകൾ ലഭ്യമല്ല.',
    savedSuccess: '✅ ക്യാച്ച് ലോഗ് വിജയകരമായി സേവ് ചെയ്തു!',
  },
  bn: {
    title: 'মাছ ধরার ট্রিপ ও ক্যাচ লগ',
    subtitle: 'মাছের প্রজাতি, পরিমাণ ও লাভ-ক্ষতির হিসাব',
    newEntryTitle: 'নতুন মাছ ধরার ট্রিপ রেকর্ড করুন',
    speciesHeader: 'মাছের প্রজাতি ও পরিমাণ',
    addSpeciesBtn: '+ আরও প্রজাতি যোগ করুন',
    speciesPlaceholder: 'যেমন: ইলিশ, পমফ্রেট, সার্ডিন',
    quantityPlaceholder: 'পরিমাণ (যেমন: ৫০ কেজি)',
    locationLabel: 'অবস্থান / জিপিএস উপকূলীয় পয়েন্ট',
    detectingGps: 'জিপিএস অবস্থান খোঁজা হচ্ছে...',
    dateLabel: 'তারিখ ও সময়',
    profitLossLabel: 'আর্থিক ফলাফল',
    profit: 'লাভ (Profit)',
    loss: 'ক্ষতি (Loss)',
    breakeven: 'সমান (Break-even)',
    notesLabel: 'অতিরিক্ত বিবরণ',
    notesPlaceholder: 'যেমন: ৩৫ মিটার গভীরতায় জাল ফেলা হয়েছে',
    saveLogBtn: 'ক্যাচ লগ সেভ করুন',
    voiceFillBtn: 'ভয়েসে পূরণ করুন',
    voiceFillPrompt: "বলুন: '৫০ কেজি সার্ডিন এবং লাভ হয়েছে'",
    tripHistoryTitle: 'আপনার পূর্ববর্তী ইতিহাস',
    noHistory: 'এখনও কোনো ক্যাচ লগ নেই।',
    savedSuccess: '✅ সফলভাবে সেভ করা হয়েছে!',
  }
};

export default function CatchLogView({
  currentUser,
  activeRole,
  setActiveRole,
  onLogout,
  selectedLang,
  setSelectedLang,
  uiDict,
  speechLang,
  userLocation,
  setUserLocation
}) {
  const navigate = useNavigate();
  const t = CATCH_LOG_I18N[selectedLang] || CATCH_LOG_I18N.en;

  // Form state: multiple species entries
  const [speciesList, setSpeciesList] = useState([
    { species: 'Indian Mackerel', quantity: '50 kg' }
  ]);
  const [locationStr, setLocationStr] = useState('Detecting GPS location...');
  const [dateTimeStr, setDateTimeStr] = useState(new Date().toISOString().slice(0, 16));
  const [profitLoss, setProfitLoss] = useState('Profit');
  const [notesStr, setNotesStr] = useState('');

  const [tripHistory, setTripHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Auto-fill location with browser Geolocation API mapped to nearest mock coastal point
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          // Find nearest mock harbor or coastal region
          let nearestName = 'Coastal Waters';
          let minD = Infinity;

          for (const reg of COASTAL_REGIONS) {
            const d = Math.hypot(reg.lat - lat, reg.lng - lng);
            if (d < minD) { minD = d; nearestName = reg.name; }
          }
          for (const h of boundariesMock.harbors || []) {
            const d = Math.hypot(h.lat - lat, h.lng - lng);
            if (d < minD) { minD = d; nearestName = `${h.name} (${h.region})`; }
          }

          setLocationStr(`${nearestName} (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`);
        },
        (err) => {
          console.warn("Geolocation fallback:", err.message);
          setLocationStr(userLocation?.name ? `${userLocation.name} (${userLocation.lat}°N, ${userLocation.lng}°E)` : 'Chennai Fishing Harbour (13.08°N, 80.29°E)');
        },
        { timeout: 4000 }
      );
    } else {
      setLocationStr('Chennai Fishing Harbour (13.08°N, 80.29°E)');
    }
  }, [userLocation]);

  // Load Catch history from SQLite server or localStorage
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/catches');
      const data = await res.json();
      if (data.success && data.catches) {
        setTripHistory(data.catches);
      } else {
        const local = localStorage.getItem('orca_catch_logs');
        if (local) setTripHistory(JSON.parse(local));
      }
    } catch (err) {
      console.warn("Fetch catches fallback to localStorage:", err);
      const local = localStorage.getItem('orca_catch_logs');
      if (local) setTripHistory(JSON.parse(local));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Multiple Species Handlers
  const handleAddSpecies = () => {
    setSpeciesList((prev) => [...prev, { species: '', quantity: '' }]);
  };

  const handleRemoveSpecies = (index) => {
    if (speciesList.length <= 1) return;
    setSpeciesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpeciesChange = (index, field, value) => {
    setSpeciesList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Voice fill handler: listens to voice input and extracts fields
  const handleVoiceFill = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    voiceService.startListening({
      speechLang,
      onResult: (transcript) => {
        const lower = transcript.toLowerCase();

        // 1. Extract Profit / Loss
        if (lower.includes('loss') || lower.includes('नुकसान') || lower.includes('நஷ்ட')) {
          setProfitLoss('Loss');
        } else if (lower.includes('break') || lower.includes('बराबर') || lower.includes('சமம்')) {
          setProfitLoss('Break-even');
        } else if (lower.includes('profit') || lower.includes('लाभ') || lower.includes('லாபம்') || lower.includes('gain')) {
          setProfitLoss('Profit');
        }

        // 2. Extract numbers & potential species
        const numberMatches = lower.match(/\b([0-9]+(?:\.[0-9]+)?)\s*(kg|kilos|kilograms|tons|ton|count|बास्केट)?\b/gi);
        
        const knownSpecies = [
          'sardines', 'mackerel', 'tuna', 'seer fish', 'prawns', 'shrimp', 'anchovy', 'pomfret', 'hilsa', 'squid', 'crab',
          'सार्डिन', 'मैकेरल', 'टूना', 'मछली', 'मथी', 'சூரை', 'மத்தி'
        ];

        let foundSpecies = knownSpecies.filter((s) => lower.includes(s));
        if (foundSpecies.length > 0) {
          const newRows = foundSpecies.map((sp, idx) => ({
            species: sp.charAt(0).toUpperCase() + sp.slice(1),
            quantity: numberMatches && numberMatches[idx] ? numberMatches[idx] : (numberMatches && numberMatches[0] ? numberMatches[0] : '40 kg')
          }));
          setSpeciesList(newRows);
        } else if (numberMatches && numberMatches.length > 0) {
          setSpeciesList([{ species: 'Mixed Catch', quantity: numberMatches[0] }]);
        }

        // 3. Extract potential location keywords
        for (const reg of COASTAL_REGIONS) {
          if (lower.includes(reg.name.toLowerCase().split(' ')[0])) {
            setLocationStr(`${reg.name} (${reg.lat}°N, ${reg.lng}°E)`);
            break;
          }
        }

        setNotesStr(`[Voice logged] "${transcript}"`);
      },
      onError: (err) => {
        console.warn("Speech error in catch log:", err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  // Submit Save Log
  const handleSaveLog = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const validSpecies = speciesList.filter(s => s.species.trim()).map(s => s.species.trim()).join(', ');
    const validQuantities = speciesList.filter(s => s.species.trim()).map(s => s.quantity.trim() || 'Unspecified').join(', ');

    const newEntry = {
      user_role: activeRole || 'Fisherman',
      species: validSpecies || 'Mixed Coastal Catch',
      quantities: validQuantities || '30 kg',
      location: locationStr || 'Coastal Sector',
      timestamp: dateTimeStr ? new Date(dateTimeStr).toISOString() : new Date().toISOString(),
      profit_loss_status: profitLoss,
      notes: notesStr || ''
    };

    try {
      const res = await fetch('/api/catches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });
      const data = await res.json();
      const savedRecord = data.success ? data.catch : { ...newEntry, id: Date.now() };

      setTripHistory((prev) => [savedRecord, ...prev]);

      // Save to localStorage for robust offline persistence
      const currentStored = JSON.parse(localStorage.getItem('orca_catch_logs') || '[]');
      localStorage.setItem('orca_catch_logs', JSON.stringify([savedRecord, ...currentStored]));

      setSaveSuccessMsg(t.savedSuccess);
      setTimeout(() => setSaveSuccessMsg(''), 4000);

      // Reset form slightly
      setSpeciesList([{ species: '', quantity: '' }]);
      setNotesStr('');
    } catch (err) {
      console.error("Save catch failed:", err);
      const fallbackRecord = { ...newEntry, id: Date.now() };
      setTripHistory((prev) => [fallbackRecord, ...prev]);
      const currentStored = JSON.parse(localStorage.getItem('orca_catch_logs') || '[]');
      localStorage.setItem('orca_catch_logs', JSON.stringify([fallbackRecord, ...currentStored]));
      setSaveSuccessMsg(t.savedSuccess);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ocean-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Header */}
      <Header
        selectedLang={selectedLang}
        onLangChange={setSelectedLang}
        onToggleFeaturePhone={() => {}}
        onOpenCatchReport={() => {}}
        onNavigateHome={() => navigate('/')}
        onBackToMenu={() => navigate('/dashboard')}
        onLogout={onLogout}
        currentUser={currentUser}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        uiDict={uiDict?.ui}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Navigation & Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Dashboard Menu</span>
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
                <Fish className="w-6 h-6 text-cyan-400" />
                <span>{t.title}</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVoiceFill}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all shadow-md ${
                isListening
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40 text-cyan-300'
              }`}
              title="Speak trip log details"
            >
              {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-cyan-400" />}
              <span>{isListening ? 'Listening...' : t.voiceFillBtn}</span>
            </button>
          </div>
        </div>

        {/* Voice Prompt Help Banner */}
        {isListening && (
          <div className="p-3.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-200 flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{t.voiceFillPrompt}</span>
          </div>
        )}

        {saveSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Main 2-Column Split: Form (Left) & Trip History (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form */}
          <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-ocean-900/90 via-ocean-900/60 to-ocean-950 shadow-2xl">
            <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <span>{t.newEntryTitle}</span>
              <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                SQLite Synced
              </span>
            </h2>

            <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
              {/* Species & Quantities Dynamic List */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-300 block">
                  {t.speciesHeader}
                </label>

                {speciesList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.species}
                      onChange={(e) => handleSpeciesChange(idx, 'species', e.target.value)}
                      placeholder={t.speciesPlaceholder}
                      className="flex-1 bg-ocean-850 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
                      required
                    />
                    <input
                      type="text"
                      value={item.quantity}
                      onChange={(e) => handleSpeciesChange(idx, 'quantity', e.target.value)}
                      placeholder={t.quantityPlaceholder}
                      className="w-32 bg-ocean-850 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
                      required
                    />
                    {speciesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecies(idx)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                        title="Remove species entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddSpecies}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold pt-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addSpeciesBtn}</span>
                </button>
              </div>

              {/* Location Input (Auto-filled & Editable) */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t.locationLabel}</span>
                </label>
                <input
                  type="text"
                  value={locationStr}
                  onChange={(e) => setLocationStr(e.target.value)}
                  className="w-full bg-ocean-850 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
                  required
                />
              </div>

              {/* Date & Time and Profit/Loss Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t.dateLabel}</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={dateTimeStr}
                    onChange={(e) => setDateTimeStr(e.target.value)}
                    className="w-full bg-ocean-850 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t.profitLossLabel}</span>
                  </label>
                  <select
                    value={profitLoss}
                    onChange={(e) => setProfitLoss(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer ${
                      profitLoss === 'Profit'
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                        : profitLoss === 'Loss'
                        ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                        : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                    }`}
                  >
                    <option value="Profit" className="bg-ocean-900 text-emerald-300">{t.profit}</option>
                    <option value="Loss" className="bg-ocean-900 text-rose-300">{t.loss}</option>
                    <option value="Break-even" className="bg-ocean-900 text-amber-300">{t.breakeven}</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">
                  {t.notesLabel}
                </label>
                <textarea
                  rows="2"
                  value={notesStr}
                  onChange={(e) => setNotesStr(e.target.value)}
                  placeholder={t.notesPlaceholder}
                  className="w-full bg-ocean-850 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner resize-none"
                />
              </div>

              {/* Save Log Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving to Database...' : t.saveLogBtn}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Your Trip History */}
          <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-ocean-900/90 via-ocean-900/60 to-ocean-950 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span>{t.tripHistoryTitle} ({tripHistory.length})</span>
              </h2>
              <button
                onClick={loadHistory}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                title="Refresh trip logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-1">
              {tripHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                  <Fish className="w-8 h-8 opacity-40 text-slate-400" />
                  <p>{t.noHistory}</p>
                </div>
              ) : (
                tripHistory.map((log) => {
                  const isProfit = log.profit_loss_status === 'Profit';
                  const isLoss = log.profit_loss_status === 'Loss';
                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl bg-ocean-850/80 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-100">
                          🐟 {log.species}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                            isProfit
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                              : isLoss
                              ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                              : 'bg-amber-950 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {isProfit ? <TrendingUp className="w-3 h-3" /> : isLoss ? <TrendingDown className="w-3 h-3" /> : <Scale className="w-3 h-3" />}
                          <span>{log.profit_loss_status}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                        <div>
                          Quantity: <strong className="text-cyan-300">{log.quantities}</strong>
                        </div>
                        <div className="text-right text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-300 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>{log.location}</span>
                      </div>

                      {log.notes && (
                        <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
