import React from 'react';
import { Waves, Globe, Smartphone, Fish, ShieldAlert, Cpu, LogOut, User, ArrowLeft, MapPin } from 'lucide-react';
import { LANGUAGE_OPTIONS } from '../utils/languageDetector';
import { COASTAL_REGIONS } from '../utils/coastalRegions';

export default function Header({ 
  selectedLang, 
  onLangChange, 
  onToggleFeaturePhone, 
  onOpenCatchReport,
  onNavigateHome,
  onBackToMenu,
  onLogout,
  currentUser,
  activeRole,
  onRoleChange,
  selectedRegion,
  onRegionChange,
  uiDict
}) {
  const ui = uiDict || {};

  return (
    <header className="bg-ocean-900/90 border-b border-cyan-500/20 backdrop-blur-md px-4 py-3 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
      {/* Left Title & Branding */}
      <div className="flex items-center gap-3">
        {onBackToMenu && (
          <button
            onClick={onBackToMenu}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-all group shadow-sm mr-1"
            title="Return to 4-Tile Dashboard Menu"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Menu</span>
          </button>
        )}

        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/40">
          <Waves className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 font-extrabold">
                ORCA
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                ISRO PS 26176
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            {ui.appSubtitle || "Marine EcOsystem Reasoning with Collaborative Agents"}
          </p>
        </div>
      </div>

      {/* Right Controls & User Session */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Coastal Region Selector (when active) */}
        {onRegionChange && (
          <div className="flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-500/40 rounded-xl px-2.5 py-1 text-xs shadow-inner">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mr-1 hidden md:inline">Region:</span>
            <select
              value={selectedRegion?.id || 'chennai'}
              onChange={(e) => {
                const reg = COASTAL_REGIONS.find((r) => r.id === e.target.value);
                if (reg) onRegionChange(reg);
              }}
              className="bg-transparent text-cyan-300 font-semibold outline-none cursor-pointer text-xs"
              title="Select Coastal Region Context"
            >
              {COASTAL_REGIONS.map((reg) => (
                <option key={reg.id} value={reg.id} className="bg-ocean-900 text-slate-100">
                  {reg.name} {!reg.isIndianRegion ? '🌍' : '🇮🇳'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Logged-in User Profile Information */}
        {currentUser && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-xs shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <div className="flex flex-col text-left">
              <span className="font-bold text-slate-100 leading-none">
                {currentUser.name}
              </span>
              {currentUser.email && (
                <span className="text-[10px] text-cyan-400/90 leading-tight truncate max-w-[150px]">
                  {currentUser.email}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all shadow-sm group"
            title="Log Out of Marine Platform Session"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
            <span>Logout</span>
          </button>
        )}

        {/* Role Switcher Dropdown */}
        <div className="flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-500/40 rounded-xl px-2.5 py-1.5 text-xs shadow-inner">
          <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mr-1 hidden sm:inline">Role:</span>
          <select
            id="role-switcher-select"
            value={activeRole || 'Fisherman'}
            onChange={(e) => onRoleChange && onRoleChange(e.target.value)}
            className="bg-transparent text-cyan-300 font-semibold outline-none cursor-pointer text-xs"
            title="Switch Dashboard Role View"
          >
            <option value="Fisherman" className="bg-ocean-900 text-slate-100">Fisherman</option>
            <option value="Commercial Operator" className="bg-ocean-900 text-slate-100">Commercial Operator</option>
            <option value="Society / Coastal Fisherman" className="bg-ocean-900 text-slate-100">Society / Coastal Fisherman</option>
            <option value="Port Authority" className="bg-ocean-900 text-slate-100">Port Authority</option>
          </select>
        </div>

        {/* Home Page Navigation Button */}
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-medium transition-all"
            title="Go to Home Landing Page"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Home</span>
          </button>
        )}

        {/* Crowdsourced Catch Report Button */}
        <button
          onClick={onOpenCatchReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-medium transition-all shadow-sm"
          title="Crowdsourced Fishermen Catch Log"
        >
          <Fish className="w-4 h-4 text-emerald-400" />
          <span>{ui.reportCatchBtn || "Report Catch"}</span>
        </button>

        {/* Feature Phone SMS/IVR Simulation Toggle */}
        <button
          onClick={onToggleFeaturePhone}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 text-xs font-medium transition-all shadow-sm"
          title="SMS/IVR Text-Only Accessibility Mode"
        >
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <span className="hidden md:inline">{ui.featurePhoneMode || "Feature Phone Mode"}</span>
        </button>

        {/* Multilingual Selector Dropdown */}
        <div className="flex items-center gap-1.5 bg-ocean-850 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs">
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
      </div>
    </header>
  );
}
