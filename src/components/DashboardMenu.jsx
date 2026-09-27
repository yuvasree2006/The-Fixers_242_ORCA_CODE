import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Fish, LifeBuoy, Ship, Compass, ArrowRight, ShieldAlert, Sparkles, Anchor, Radio, Waves } from 'lucide-react';
import Header from './Header';

export default function DashboardMenu({
  currentUser,
  activeRole,
  setActiveRole,
  onLogout,
  selectedLang,
  setSelectedLang,
  uiDict,
  onToggleFeaturePhone,
  onOpenCatchReport
}) {
  const navigate = useNavigate();
  const ui = uiDict?.ui || {};

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Commercial Operator':
        return { label: 'Deep Sea & Fleet Intelligence', color: 'text-sky-400 bg-sky-950/80 border-sky-500/30' };
      case 'Society / Coastal Fisherman':
        return { label: 'Community & Catch Advisory', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/30' };
      case 'Port Authority':
        return { label: 'Harbor Control & Sea State', color: 'text-amber-400 bg-amber-950/80 border-amber-500/30' };
      case 'Fisherman':
      default:
        return { label: 'Artisanal Safety & PFZ Zones', color: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/30' };
    }
  };

  const roleInfo = getRoleBadge(activeRole || 'Fisherman');

  const tiles = [
    {
      id: 'chat',
      title: 'Chatbot',
      subtitle: 'Multilingual Q&A Assistant',
      description: 'Ask safety scores, potential fishing zones, IMBL boundaries, and wave heights across 6 coastal languages.',
      icon: MessageSquare,
      gradient: 'from-cyan-500/20 via-sky-500/10 to-transparent',
      borderColor: 'border-cyan-500/40 hover:border-cyan-400',
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/15 ring-cyan-400/40',
      badge: 'Interactive Text Chat',
      badgeColor: 'text-cyan-300 bg-cyan-950/80 border-cyan-500/30',
      route: '/dashboard/chat'
    },
    {
      id: 'catch-log',
      title: 'Catch Log',
      subtitle: 'Trip & Harvest Logger',
      description: 'Log your fish catch with species, quantity, GPS location, and profit/loss tracking. Voice-fillable form with persistent trip history.',
      icon: Fish,
      gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      borderColor: 'border-blue-500/40 hover:border-blue-400',
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/15 ring-blue-400/40',
      badge: 'SQLite-Backed Log',
      badgeColor: 'text-blue-300 bg-blue-950/80 border-blue-500/30',
      route: '/dashboard/catch-log'
    },
    {
      id: 'survival-kit',
      title: 'Survival Kit',
      subtitle: 'Emergency Guided Protocol',
      description: 'Stateful emergency workflow for lost or stranded vessels. Food/water rationing guidance & auto Coast Guard dispatch.',
      icon: LifeBuoy,
      gradient: 'from-rose-500/20 via-amber-500/10 to-transparent',
      borderColor: 'border-rose-500/40 hover:border-rose-400',
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/15 ring-rose-400/40',
      badge: 'Emergency SOS Flow',
      badgeColor: 'text-rose-300 bg-rose-950/80 border-rose-500/30 animate-pulse',
      route: '/dashboard/survival-kit'
    },
    {
      id: 'nearby-ships',
      title: 'Nearby Ships',
      subtitle: 'Simulated AIS Fleet Radar',
      description: 'Real-time proximity radar of cargo carriers, fishing trawlers, patrol boats & ferries around your chosen coastal sector.',
      icon: Ship,
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'border-emerald-500/40 hover:border-emerald-400',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 ring-emerald-400/40',
      badge: 'Simulated AIS Radar',
      badgeColor: 'text-emerald-300 bg-emerald-950/80 border-emerald-500/30',
      route: '/dashboard/nearby-ships'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-ocean-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Persistent Dashboard Top Bar */}
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-center">
        {/* Welcome Banner */}
        <div className="mb-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold mb-3 shadow-md backdrop-blur-md ${roleInfo.color}">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Active Operational Mode: {activeRole || 'Fisherman'}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            ORCA Marine Intelligence Center
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Select an operational module below to access real-time marine reasoning, voice interaction, emergency guidance, or local vessel traffic.
          </p>
        </div>

        {/* 4-Tile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full">
          {tiles.map((tile) => {
            const IconComponent = tile.icon;
            return (
              <div
                key={tile.id}
                onClick={() => navigate(tile.route)}
                className={`group relative glass-panel p-6 sm:p-7 rounded-3xl border ${tile.borderColor} bg-gradient-to-br ${tile.gradient} hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 flex flex-col justify-between overflow-hidden`}
              >
                {/* Background Ambient Glow */}
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all pointer-events-none" />

                <div>
                  {/* Top Tile Row */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ring-1 ${tile.iconBg} ${tile.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-7 h-7" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${tile.badgeColor} shadow-sm`}>
                      {tile.badge}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-xl font-bold text-slate-100 group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                    <span>{tile.title}</span>
                  </h3>
                  <p className="text-xs font-semibold text-cyan-400/90 mt-0.5 uppercase tracking-wider">
                    {tile.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-slate-300/90 mt-3 leading-relaxed">
                    {tile.description}
                  </p>
                </div>

                {/* Bottom Action Row */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                  <span>Open {tile.title}</span>
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-sm">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick System Status Bar */}
        <div className="mt-10 max-w-5xl mx-auto w-full glass-panel p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">Local Marine Engines: 100% Online & Key-Free</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>ISRO PS 26176</span>
            <span>•</span>
            <span>6 Coastal Languages</span>
            <span>•</span>
            <span>SQLite Offline Reporting</span>
          </div>
        </div>
      </main>
    </div>
  );
}
