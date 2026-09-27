import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import {
  ShieldCheck,
  Ship,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Send,
  LogOut,
  RefreshCw,
  Compass,
  MapPin,
  Clock,
  Droplets,
  Utensils,
  Layers,
  ChevronRight,
  Activity
} from 'lucide-react';
import guardianBoatsMock from '../../data/guardian_boats_mock.json' with { type: 'json' };
import boundariesMock from '../../data/boundaries_mock.json' with { type: 'json' };

// Custom Boat Marker Icon for Guardian Map
const createBoatIcon = (riskLevel) => {
  let colorBg = 'bg-emerald-500 shadow-emerald-500/50';
  let emoji = '⛵';

  if (riskLevel === 'High') {
    colorBg = 'bg-rose-600 shadow-rose-600/60 ring-2 ring-rose-400';
    emoji = '🚨';
  } else if (riskLevel === 'Medium') {
    colorBg = 'bg-amber-500 shadow-amber-500/50';
    emoji = '⚠️';
  }

  return L.divIcon({
    className: 'guardian-boat-marker',
    html: `<div class="w-7 h-7 rounded-full ${colorBg} text-white flex items-center justify-center text-xs font-bold shadow-xl transform hover:scale-125 transition-all">
            ${emoji}
          </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

export default function GuardianDashboard({ currentUser, onLogout }) {
  const [fleet, setFleet] = useState(guardianBoatsMock.fleet || []);
  const [selectedBoat, setSelectedBoat] = useState(fleet[0] || null);
  const [actionFeedback, setActionFeedback] = useState('');

  // Auto-refresh simulation to randomly alter coordinates very slightly for live feeling
  useEffect(() => {
    const interval = setInterval(() => {
      setFleet((prev) =>
        prev.map((b) => ({
          ...b,
          lat: +(b.lat + (Math.random() - 0.5) * 0.0008).toFixed(4),
          lng: +(b.lng + (Math.random() - 0.5) * 0.0008).toFixed(4),
        }))
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Update selectedBoat when fleet updates coordinates
  useEffect(() => {
    if (selectedBoat) {
      const updated = fleet.find((b) => b.id === selectedBoat.id);
      if (updated) setSelectedBoat(updated);
    }
  }, [fleet]);

  const handleBoatAction = (boatId, actionType) => {
    let newStatus = 'Monitoring';
    if (actionType === 'Acknowledge') newStatus = 'Acknowledged';
    if (actionType === 'Dispatch') newStatus = 'Rescue Dispatched';
    if (actionType === 'Resolve') newStatus = 'Resolved / Safe';

    setFleet((prev) =>
      prev.map((b) => (b.id === boatId ? { ...b, status: newStatus } : b))
    );

    setActionFeedback(`✅ Action applied: ${actionType} triggered for vessel ${boatId}`);
    setTimeout(() => setActionFeedback(''), 3500);
  };

  const highRiskCount = fleet.filter((b) => b.riskLevel === 'High').length;
  const imblLines = boundariesMock.imblLines || [];

  return (
    <div className="min-h-screen flex flex-col bg-ocean-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      {/* Guardian Operations Header */}
      <header className="bg-ocean-900/95 border-b border-rose-500/40 backdrop-blur-md px-6 py-3.5 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-purple-600 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-500/25 ring-1 ring-rose-400/40">
            <ShieldCheck className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg text-slate-100 tracking-tight">
                ORCA Guardian Command
              </h1>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/50 uppercase tracking-wider">
                Guardian Fleet Monitor
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Active Coastal Fleet Tracker & Autonomous IMBL Enforcement
            </p>
          </div>
        </div>

        {/* Guardian Profile & Standalone Logout Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
            <div className="flex flex-col text-left">
              <span className="font-bold text-slate-100 leading-none">
                {currentUser?.name || 'Guardian Officer'}
              </span>
              <span className="text-[10px] text-rose-300 truncate max-w-[140px]">
                {currentUser?.email || 'guardian@orca.demo'}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all shadow-sm group"
            title="Logout from Guardian Console"
          >
            <LogOut className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* KPI Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-2xl font-black text-slate-100">{fleet.length}</div>
              <div className="text-xs text-slate-400 mt-0.5">Active Monitored Vessels</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Ship className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-rose-500/40 bg-rose-950/20 flex items-center justify-between">
            <div>
              <div className="text-2xl font-black text-rose-400">{highRiskCount}</div>
              <div className="text-xs text-rose-300 mt-0.5">High Risk Boundary Alerts</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 flex items-center justify-between">
            <div>
              <div className="text-2xl font-black text-amber-400">100%</div>
              <div className="text-xs text-amber-300 mt-0.5">GPS / AIS Link Status</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between">
            <div>
              <div className="text-2xl font-black text-emerald-400">2.4 GHz</div>
              <div className="text-xs text-emerald-300 mt-0.5">Telemetry Frequency</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        {actionFeedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* 2-Column Main Workspace: Map & Fleet List (Left) + Boat Detail Card (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Fleet Interactive Map & Vessel List */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Guardian Fleet Map */}
            <div className="h-[380px] w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
              <MapContainer
                center={[9.6, 79.4]}
                zoom={7}
                scrollWheelZoom={true}
                className="w-full h-full z-10"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* IMBL Boundary Lines */}
                {imblLines.map((line, idx) => (
                  <Polyline
                    key={`imbl-${idx}`}
                    positions={line.coordinates}
                    pathOptions={{ color: '#ef4444', weight: 3, opacity: 0.85, dashArray: '6, 6' }}
                  />
                ))}

                {/* Fleet Boat Markers */}
                {fleet.map((boat) => (
                  <Marker
                    key={boat.id}
                    position={[boat.lat, boat.lng]}
                    icon={createBoatIcon(boat.riskLevel)}
                    eventHandlers={{
                      click: () => setSelectedBoat(boat)
                    }}
                  >
                    <Popup>
                      <div className="p-1 text-xs space-y-1">
                        <div className="font-bold text-slate-100">{boat.name}</div>
                        <div className="text-[10px] text-slate-400">ID: {boat.id}</div>
                        <div className={`font-semibold text-[10px] ${
                          boat.riskLevel === 'High' ? 'text-rose-400' : boat.riskLevel === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          Risk: {boat.riskLevel}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              <div className="absolute top-3 right-3 z-20 glass-panel p-2 rounded-xl text-[10px] space-y-1 border border-slate-700/60 shadow-lg">
                <span className="font-bold text-slate-200 block border-b border-slate-700 pb-0.5">Legend</span>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span><span className="text-slate-300">High Risk Boat</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span className="text-slate-300">Medium Risk Boat</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span className="text-slate-300">Normal Safe Boat</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-rose-500"></span><span className="text-slate-300">IMBL Boundary</span></div>
              </div>
            </div>

            {/* Fleet Boat Selector List */}
            <div className="glass-panel p-4 rounded-3xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Fleet Vessel Directory (Click to Inspect)</span>
                <span className="text-[10px] text-slate-400">Click a boat to open telemetry card</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {fleet.map((boat) => {
                  const isSelected = selectedBoat?.id === boat.id;
                  const isHigh = boat.riskLevel === 'High';
                  return (
                    <div
                      key={boat.id}
                      onClick={() => setSelectedBoat(boat)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-500/10'
                          : 'bg-ocean-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                          isHigh ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-ocean-800 text-slate-300'
                        }`}>
                          <Ship className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-100 truncate">{boat.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{boat.id} • {boat.captain}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isHigh
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                            : boat.riskLevel === 'Medium'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        }`}>
                          {boat.riskLevel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Boat Alert & Action Detail Card */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {selectedBoat ? (
              <div className="glass-panel p-6 rounded-3xl border border-rose-500/40 bg-gradient-to-br from-rose-950/30 via-ocean-900 to-ocean-950 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      Vessel Telemetry Card
                    </span>
                    <h2 className="text-lg font-black text-slate-100">{selectedBoat.name}</h2>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase ${
                    selectedBoat.riskLevel === 'High'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : selectedBoat.riskLevel === 'Medium'
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-emerald-500 text-slate-900'
                  }`}>
                    {selectedBoat.riskLevel} Risk
                  </span>
                </div>

                {/* Vessel Details */}
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-ocean-850 border border-slate-800">
                    <span className="text-slate-400">Boat ID:</span>
                    <span className="font-mono text-cyan-300 font-bold">{selectedBoat.id}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-ocean-850 border border-slate-800">
                    <span className="text-slate-400">Captain / Master:</span>
                    <span className="font-semibold text-slate-200">{selectedBoat.captain} ({selectedBoat.crewCount} crew)</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-ocean-850 border border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Coordinates:</span>
                    </span>
                    <span className="font-mono text-slate-200 font-semibold">{selectedBoat.lat}°N, {selectedBoat.lng}°E</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-ocean-850 border border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-amber-400" />
                      <span>Speed & Heading:</span>
                    </span>
                    <span className="text-slate-200 font-semibold">{selectedBoat.speedKnots} kts • Heading {selectedBoat.heading}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200">
                    <div className="font-bold text-[11px] mb-0.5">⚠️ Risk Advisory:</div>
                    <div className="text-[11px]">{selectedBoat.riskReason}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-ocean-850 border border-slate-800">
                      <div className="text-slate-400 flex items-center gap-1">
                        <Utensils className="w-3 h-3 text-amber-400" />
                        <span>Supply Status:</span>
                      </div>
                      <div className="font-semibold text-slate-200 mt-0.5">{selectedBoat.supplyStatus}</div>
                    </div>

                    <div className="p-2 rounded-xl bg-ocean-850 border border-slate-800">
                      <div className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>Last Contact:</span>
                      </div>
                      <div className="font-semibold text-slate-200 mt-0.5">{selectedBoat.lastContact}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-ocean-900 border border-slate-700">
                    <span className="text-slate-400">Current Operational Status:</span>
                    <span className="font-bold text-rose-300">{selectedBoat.status}</span>
                  </div>
                </div>

                {/* 3 Guardian Action Buttons */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Take Operational Action:
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleBoatAction(selectedBoat.id, 'Acknowledge')}
                      className="py-2.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all shadow-sm flex flex-col items-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Acknowledge</span>
                    </button>

                    <button
                      onClick={() => handleBoatAction(selectedBoat.id, 'Dispatch')}
                      className="py-2.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-all shadow-md shadow-rose-600/30 flex flex-col items-center gap-1"
                    >
                      <Send className="w-4 h-4" />
                      <span>Dispatch</span>
                    </button>

                    <button
                      onClick={() => handleBoatAction(selectedBoat.id, 'Resolve')}
                      className="py-2.5 px-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all shadow-sm flex flex-col items-center gap-1"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Resolve</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center text-xs text-slate-500">
                Select a vessel from the map or directory to inspect telemetry details.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
