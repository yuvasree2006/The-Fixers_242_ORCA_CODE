import React, { useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Waves,
  Wind,
  Compass,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Info
} from 'lucide-react';

const BRIEFING_TEMPLATES = {
  en: {
    cycloneDanger: "⚠️ Pre-Departure Advisory: Do NOT venture out tomorrow. Active cyclone alert within 200 km — return to harbor and secure vessel moorings.",
    roughSeaCaution: "⚠️ Pre-Departure Advisory: Caution advised for tomorrow morning. Elevated wave swell ({wave}m) and strong wind ({wind} km/h) expected. Small craft stay within 10 km.",
    favorableSafe: "✅ Pre-Departure Advisory: Conditions highly favorable for departure tomorrow morning. Calm sea state ({wave}m swell), light wind ({wind} km/h), and no hazard alerts."
  },
  hi: {
    cycloneDanger: "⚠️ प्रस्थान-पूर्व परामर्श: कल समुद्र में न जाएं। 200 किमी के भीतर सक्रिय चक्रवात चेतावनी — तुरंत बंदरगाह लौटें और नाव सुरक्षित बांधें।",
    roughSeaCaution: "⚠️ प्रस्थान-पूर्व परामर्श: कल सुबह सावधानी बरतने की सलाह। ऊंची लहरें ({wave}मी) और तेज हवाएं ({wind} किमी/घंटा) अपेक्षित हैं। छोटी नावें 10 किमी के भीतर रहें।",
    favorableSafe: "✅ प्रस्थान-पूर्व परामर्श: कल सुबह प्रस्थान के लिए स्थितियां बेहद अनुकूल हैं। शांत समुद्र ({wave}मी लहरें), हल्की हवाएं ({wind} किमी/घंटा) और कोई खतरा नहीं।"
  },
  ta: {
    cycloneDanger: "⚠️ பயணத்திற்கு முந்தைய ஆலோசனை: நாளை கடலுக்குச் செல்ல வேண்டாம். 200 கி.மீ தொலைவில் புயல் எச்சரிக்கை செயலில் உள்ளது — படகை பாதுகாப்பான துறைமுகத்தில் நிறுத்தவும்.",
    roughSeaCaution: "⚠️ பயணத்திற்கு முந்தைய ஆலோசனை: நாளை காலை எச்சரிக்கையுடன் இருக்கவும். கடல் அலை ({wave}மீ) மற்றும் காற்று ({wind} கி.மீ/மணி) அதிகமாக இருக்கும்.",
    favorableSafe: "✅ பயணத்திற்கு முந்தைய ஆலோசனை: நாளை காலை கடலுக்குச் செல்ல நிலைமை மிகவும் சாதகமாக உள்ளது. அமைதியான கடல் ({wave}மீ) மற்றும் மிதமான காற்று."
  },
  te: {
    cycloneDanger: "⚠️ బయలుదేరే ముందు సలహా: రేపు సముద్రంలోకి వెళ్లవద్దు. 200 కి.మీ పరిధిలో తుఫాను హెచ్చరిక ఉంది — ఓడరేవుకు తిరిగి రండి.",
    roughSeaCaution: "⚠️ బయలుదేరే ముందు సలహా: రేపు ఉదయం జాగ్రత్తగా ఉండండి. అధిక అలల తీవ్రత ({wave}మీ) మరియు బలమైన గాలి ({wind} కి.మీ/గం).",
    favorableSafe: "✅ బయలుదేరే ముందు సలహా: రేపు ఉదయం ప్రయాణానికి పరిస్థితులు చాలా అనుకూలంగా ఉన్నాయి. ప్రశాంతమైన సముద్రం మరియు అనుకూల వాతావరణం."
  },
  ml: {
    cycloneDanger: "⚠️ പുറപ്പെടുന്നതിന് മുമ്പുള്ള മുന്നറിയിപ്പ്: നാളെ കടലിൽ പോകരുത്. 200 കി.മീറ്ററിനുള്ളിൽ ചുഴലിക്കാറ്റ് മുന്നറിയിപ്പ് നിലവിലുണ്ട്.",
    roughSeaCaution: "⚠️ പുറപ്പെടുന്നതിന് മുമ്പുള്ള ഉപദേശം: നാളെ രാവിലെ ജാഗ്രത പാലിക്കുക. ഉയർന്ന തിരമാലകളും ({wave}m) ശക്തമായ കാറ്റും ({wind} km/h) പ്രതീക്ഷിക്കുന്നു.",
    favorableSafe: "✅ പുറപ്പെടുന്നതിന് മുമ്പുള്ള ഉപദേശം: നാളെ രാവിലെ യാത്ര തിരിക്കാൻ അനുകൂലമായ കാലാവസ്ഥയാണ്. ശാന്തമായ കടലും കുറഞ്ഞ കാറ്റും."
  },
  bn: {
    cycloneDanger: "⚠️ যাত্রাপূর্ব পরামর্শ: আগামীকাল সমুদ্রে যাবেন না। ২০০ কিমির মধ্যে সক্রিয় ঘূর্ণিঝড় সতর্কতা রয়েছে — অবিলম্বে বন্দরে ফিরুন।",
    roughSeaCaution: "⚠️ যাত্রাপূর্ব পরামর্শ: আগামীকাল সকালে সতর্কতা অবলম্বন করুন। উচ্চ ঢেউ ({wave}মি) এবং তীব্র বাতাস ({wind} কিমি/ঘণ্টা) হতে পারে।",
    favorableSafe: "✅ যাত্রাপূর্ব পরামর্শ: আগামীকাল সকালে সমুদ্রযাত্রার জন্য পরিস্থিতি অত্যন্ত অনুকূল। শান্ত সমুদ্র ও অনুকূল আবহাওয়া।"
  }
};

/**
 * Generate a bounded random walk for 24 hours of simulated safety scores
 * THRESHOLD DESIGNATION:
 * - Score >= 70 : GREEN (Safe / Favorable)
 * - Score 40-69 : AMBER (Caution / Moderate)
 * - Score < 40  : RED   (Danger / Adverse)
 */
function generate24HourForecast(baseScore, baseWave, baseWind) {
  const currentHour = new Date().getHours();
  const forecast = [];
  let score = baseScore;

  for (let i = 0; i < 24; i++) {
    const hourLabel = (currentHour + i) % 24;
    const timeFormatted = `${String(hourLabel).padStart(2, '0')}:00`;

    // Sinusoidal diurnal wave variation + minor noise
    const diurnalFactor = Math.sin((i / 24) * 2 * Math.PI - Math.PI / 2);
    const scoreDelta = Math.round(diurnalFactor * 12 + (Math.sin(i * 1.7) * 4));
    const hourlyScore = Math.max(15, Math.min(98, score + scoreDelta));

    const hourlyWave = Math.max(0.4, +(baseWave + diurnalFactor * 0.4 + (Math.sin(i * 2.1) * 0.15)).toFixed(1));
    const hourlyWind = Math.max(6, +(baseWind + diurnalFactor * 6 + (Math.cos(i * 1.5) * 2)).toFixed(0));

    let tier = 'safe';
    if (hourlyScore < 40) tier = 'danger';
    else if (hourlyScore < 70) tier = 'caution';

    forecast.push({
      hourIndex: i,
      time: timeFormatted,
      score: hourlyScore,
      tier,
      wave: hourlyWave,
      wind: hourlyWind
    });
  }

  return forecast;
}

export default function SafetyDashboard({
  risk,
  weather,
  geospatial,
  selectedLang = 'en',
  selectedRegion
}) {
  const currentScore = risk?.safetyScore ?? 78;
  const waveHeight = weather?.waveHeightMeters ?? 1.3;
  const windSpeed = weather?.windSpeedKmH ?? 18;
  const cycloneAlert = weather?.cycloneAlertLevel ?? 'NONE';

  // 1. Sea Safety Badge Color Mapping
  // Thresholds: >= 70 Green, 40-69 Amber, < 40 Red
  const badgeConfig = useMemo(() => {
    if (currentScore >= 70) {
      return {
        label: 'GREEN — SAFE / FAVORABLE',
        badgeBg: 'bg-emerald-500/20 border-emerald-500 text-emerald-300',
        scoreColor: 'text-emerald-400',
        glowColor: 'shadow-emerald-500/20',
        desc: 'Favorable sea conditions for artisanal and commercial coastal operations.'
      };
    } else if (currentScore >= 40) {
      return {
        label: 'AMBER — CAUTION / MODERATE',
        badgeBg: 'bg-amber-500/20 border-amber-500 text-amber-300',
        scoreColor: 'text-amber-400',
        glowColor: 'shadow-amber-500/20',
        desc: 'Elevated wave swell or gusty winds. Keep VHF radio watch and exercise caution.'
      };
    } else {
      return {
        label: 'RED — DANGER / ADVERSE',
        badgeBg: 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse',
        scoreColor: 'text-rose-400',
        glowColor: 'shadow-rose-500/30',
        desc: 'Adverse maritime sea state or severe hazard alert. Strongly advise staying ashore.'
      };
    }
  }, [currentScore]);

  // 2. 24-Hour Forecast Timeline
  const hourlyData = useMemo(() => {
    return generate24HourForecast(currentScore, waveHeight, windSpeed);
  }, [currentScore, waveHeight, windSpeed, selectedRegion]);

  // 3. Pre-Departure Briefing Text
  const briefingText = useMemo(() => {
    const dict = BRIEFING_TEMPLATES[selectedLang] || BRIEFING_TEMPLATES.en;
    if (cycloneAlert === 'WARNING' || cycloneAlert === 'SEVERE' || cycloneAlert === 'WATCH') {
      return dict.cycloneDanger;
    } else if (currentScore < 60 || waveHeight >= 2.2 || windSpeed >= 32) {
      return dict.roughSeaCaution.replace('{wave}', waveHeight).replace('{wind}', windSpeed);
    } else {
      return dict.favorableSafe.replace('{wave}', waveHeight).replace('{wind}', windSpeed);
    }
  }, [cycloneAlert, currentScore, waveHeight, windSpeed, selectedLang]);

  return (
    <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-gradient-to-br from-ocean-900/90 via-ocean-900/60 to-ocean-950 shadow-2xl space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-100 tracking-tight flex items-center gap-2">
              <span>Marine Safety & 24-Hour Departure Dashboard</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Real-time fusion for {selectedRegion?.name || 'Coastal Sector'}
            </p>
          </div>
        </div>

        {/* Sea Safety Score Badge */}
        <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl border ${badgeConfig.badgeBg} ${badgeConfig.glowColor} shadow-md`}>
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Safety Index</span>
            <span className="text-xs font-black">{badgeConfig.label}</span>
          </div>
          <div className="text-xl font-black">{currentScore}<span className="text-xs font-normal opacity-70">/100</span></div>
        </div>
      </div>

      {/* Pre-Departure Briefing Card */}
      <div className="p-3.5 rounded-2xl bg-ocean-850/90 border border-slate-700/70 shadow-inner flex items-start gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 text-xs">
          <div className="font-bold text-cyan-300 text-[11px] uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
            <span>Pre-Departure Briefing</span>
            <span className="text-[9px] font-normal text-slate-400">• Simulated AI Intelligence</span>
          </div>
          <p className="text-slate-200 leading-relaxed font-sans">{briefingText}</p>
        </div>
      </div>

      {/* 24-Hour Hour-by-Hour Breakdown Bar Chart */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>24-Hour Safety Score Evolution (Simulated Hourly Variation)</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Safe (&ge;70)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Caution (40-69)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Danger (&lt;40)</span>
          </div>
        </div>

        {/* Horizontal Scrollable Timeline Bars */}
        <div className="overflow-x-auto pb-2 pt-1 scrollbar-thin">
          <div className="flex items-end gap-1.5 min-w-[680px] h-28 bg-ocean-950/60 p-2 rounded-2xl border border-slate-800">
            {hourlyData.map((slot) => {
              const heightPercent = Math.max(15, slot.score);
              let barColor = 'bg-gradient-to-t from-emerald-600 to-emerald-400';
              let textColor = 'text-emerald-300';
              if (slot.tier === 'caution') {
                barColor = 'bg-gradient-to-t from-amber-600 to-amber-400';
                textColor = 'text-amber-300';
              } else if (slot.tier === 'danger') {
                barColor = 'bg-gradient-to-t from-rose-600 to-rose-500';
                textColor = 'text-rose-300';
              }

              return (
                <div
                  key={slot.hourIndex}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                    <div className="bg-ocean-900 border border-slate-700 text-[10px] px-2 py-1 rounded-lg text-slate-200 shadow-xl whitespace-nowrap">
                      <div>Score: <strong className={textColor}>{slot.score}/100</strong></div>
                      <div>Wave: {slot.wave}m • Wind: {slot.wind} km/h</div>
                    </div>
                  </div>

                  <span className={`text-[9px] font-bold ${textColor} mb-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {slot.score}
                  </span>

                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${barColor} group-hover:brightness-125`}
                    style={{ height: `${heightPercent}%` }}
                  />

                  <span className="text-[9px] text-slate-400 mt-1 font-mono">
                    {slot.time.split(':')[0]}h
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
