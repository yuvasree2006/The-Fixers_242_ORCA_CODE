import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Waves, ShieldCheck, Cpu, Globe, ArrowRight, UserCheck, Anchor, MapPin, Sparkles, CheckCircle2, ChevronRight, Radio, Compass } from 'lucide-react';
import { LANGUAGE_OPTIONS } from '../utils/languageDetector';
import { authService } from '../services/authService';

export default function HomePage({ selectedLang, onLangChange, currentUser }) {
  const navigate = useNavigate();

  const handleLaunchDashboard = async () => {
    const token = authService.getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    const user = await authService.getCurrentUser();
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-ocean-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="bg-ocean-900/80 border-b border-cyan-500/20 backdrop-blur-md px-6 py-4 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/40">
            <Waves className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
              ORCA
            </h1>
            <p className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
              ISRO Problem Statement 26176
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-ocean-850 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={selectedLang}
              onChange={(e) => onLangChange(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer font-medium"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code} className="bg-ocean-900 text-slate-100">
                  {opt.nativeName} ({opt.name})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>Sign In / Login</span>
          </button>

          <button
            onClick={handleLaunchDashboard}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-1.5"
          >
            <span>Enter App Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-28 max-w-6xl mx-auto text-center flex flex-col items-center justify-center">
        {/* Glowing backdrop blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold mb-6 shadow-lg glow-cyan">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>Smart India Hackathon • ISRO PS 26176 Official Prototype</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-extrabold text-slate-100 tracking-tight leading-tight max-w-4xl">
          Marine EcOsystem Reasoning with <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
            Collaborative Agents (ORCA)
          </span>
        </h2>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
          Empowering Indian fishermen and coastal authorities with multi-agent AI intelligence. Natural voice queries in 6 coastal languages for real-time safe venture scores, potential fishing zones, and hazard routes.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={handleLaunchDashboard}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center gap-2 scale-105"
          >
            <Anchor className="w-5 h-5 text-cyan-200" />
            <span>Launch Marine Dashboard</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/signup')}
            className="px-6 py-3.5 rounded-2xl bg-ocean-850 hover:bg-ocean-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition-all flex items-center gap-2"
          >
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <span>Register New Vessel / Captain</span>
          </button>
        </div>

        {/* Trust Stats Bar */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl text-left">
          <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20">
            <div className="text-2xl font-black text-cyan-400">10 Agents</div>
            <div className="text-xs text-slate-400 mt-1">Collaborative Orchestration DAG</div>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20">
            <div className="text-2xl font-black text-emerald-400">6 Languages</div>
            <div className="text-xs text-slate-400 mt-1">Hindi, Tamil, Telugu, Malayalam, Bengali, English</div>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20">
            <div className="text-2xl font-black text-amber-400">0 API Keys</div>
            <div className="text-xs text-slate-400 mt-1">Free OpenStreetMap & Local SQLite</div>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20">
            <div className="text-2xl font-black text-blue-400">100% Offline</div>
            <div className="text-xs text-slate-400 mt-1">Zero-Network Client Reasoning</div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="px-6 py-16 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-slate-100">Why ORCA for Coastal Marine Safety?</h3>
          <p className="text-xs text-slate-400 mt-2">Engineered specifically for Indian artisanal and mechanized fishermen.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-100">Composite Venture Safety Score</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Synthesizes real-time wave heights, wind gusts, IMD cyclone alerts, and IMBL boundaries into an unambiguous 0–100 venture score.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-100">Boundary-Aware Waypoint Router</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Calculates safest navigation waypoints to nearest PFZ coordinates while actively steering around Marine Protected Areas and international boundary buffers.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <Radio className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-100">SMS & Low-Bandwidth 2G Ready</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Simulates feature-phone SMS summaries (160-char payloads) ensuring non-smartphone artisanal fishermen receive the same safety intelligence.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ocean-950 border-t border-slate-800 p-6 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 ORCA — Smart India Hackathon Prototype (ISRO Problem Statement 26176). All local engines operational.</p>
      </footer>
    </div>
  );
}
