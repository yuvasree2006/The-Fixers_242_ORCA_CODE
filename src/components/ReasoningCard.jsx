import React from 'react';
import { ShieldCheck, ShieldAlert, Waves, Wind, Thermometer, Droplet, AlertTriangle, Compass, CheckCircle } from 'lucide-react';

export default function ReasoningCard({ explainability, weather, geospatial, risk, uiDict }) {
  const ui = uiDict.ui || {};
  
  if (!explainability) {
    return (
      <div className="glass-panel p-4 rounded-2xl text-center text-slate-400 text-xs">
        Submit a query to view ecosystem risk reasoning & venture safety analysis.
      </div>
    );
  }

  const score = risk?.safetyScore ?? explainability.safetyScore ?? 85;
  const level = risk?.safetyLevel ?? explainability.safetyLevel ?? 'SAFE';

  let scoreColor = 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
  let gaugeBg = 'from-emerald-500 to-teal-400';
  if (level === 'CAUTION') {
    scoreColor = 'text-amber-400 border-amber-500/50 bg-amber-500/10';
    gaugeBg = 'from-amber-500 to-yellow-400';
  } else if (level === 'DANGER') {
    scoreColor = 'text-rose-400 border-rose-500/50 bg-rose-500/10';
    gaugeBg = 'from-rose-600 to-red-400';
  }

  return (
    <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20 shadow-xl space-y-4">
      {/* Top Header & Safety Gauge */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>{ui.reasoningCardTitle || "Ecosystem Risk Reasoning Synthesis"}</span>
          </h3>
          <p className="text-[11px] text-slate-300 font-medium mt-1">
            {explainability.recommendationText}
          </p>
        </div>

        {/* Safety Score Gauge Circle */}
        <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${scoreColor}`}>
          <div className="text-right">
            <div className="text-[10px] uppercase font-semibold text-slate-300">
              {ui.safetyGaugeTitle || "Venture Safety Score"}
            </div>
            <div className="text-xl font-extrabold tracking-tight">{score}/100</div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-slate-800 flex items-center justify-center relative overflow-hidden bg-ocean-950">
            <div
              className={`absolute bottom-0 w-full bg-gradient-to-t ${gaugeBg} transition-all duration-700`}
              style={{ height: `${score}%` }}
            />
            <span className="relative z-10 font-bold text-xs text-white">{level}</span>
          </div>
        </div>
      </div>

      {/* Sea State & Environmental Parameters Grid */}
      <div>
        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>{ui.seaMetricsTitle || "Real-Time Sea Conditions"}</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-ocean-850/80 border border-slate-800 p-2 rounded-xl flex items-center gap-2">
            <Waves className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Wave Height</span>
              <span className="font-bold text-slate-200">{weather?.waveHeightMeters || 1.4}m</span>
            </div>
          </div>

          <div className="bg-ocean-850/80 border border-slate-800 p-2 rounded-xl flex items-center gap-2">
            <Wind className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Wind Speed</span>
              <span className="font-bold text-slate-200">{weather?.windSpeedKmH || 18.5} km/h</span>
            </div>
          </div>

          <div className="bg-ocean-850/80 border border-slate-800 p-2 rounded-xl flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">SST</span>
              <span className="font-bold text-slate-200">{geospatial?.nearestPfz?.sst || 28.2}°C</span>
            </div>
          </div>

          <div className="bg-ocean-850/80 border border-slate-800 p-2 rounded-xl flex items-center gap-2">
            <Droplet className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Chlorophyll-a</span>
              <span className="font-bold text-slate-200">{geospatial?.nearestPfz?.chlorophyll || 3.4} mg/m³</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulleted Reasoning Trace in Active Language */}
      <div className="bg-ocean-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
        <div className="text-[11px] font-semibold text-cyan-400 mb-1">
          Synthesized Multi-Agent Reasoning Bullets:
        </div>
        <ul className="space-y-1 text-xs text-slate-300">
          {(explainability.reasoningBullets || []).map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
