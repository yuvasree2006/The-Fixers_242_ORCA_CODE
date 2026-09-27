import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ship,
  ArrowLeft,
  Navigation,
  Compass,
  Anchor,
  Shield,
  Fish,
  Users,
  AlertCircle,
  Filter,
  Layers,
  MapPin,
  RefreshCw,
  Search
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import Header from './Header';
import { COASTAL_REGIONS } from '../utils/coastalRegions';
import nearbyShipsData from '../../data/nearby_ships_mock.json' with { type: 'json' };

// Custom Leaflet Vessel Icons per Ship Type
const createShipIcon = (type) => {
  let iconEmoji = '🚢';
  let colorClass = 'bg-sky-500 shadow-sky-500/50';

  if (type === 'fishing_trawler') {
    iconEmoji = '🐟';
    colorClass = 'bg-emerald-500 shadow-emerald-500/50';
  } else if (type === 'patrol') {
    iconEmoji = '🛡️';
    colorClass = 'bg-rose-500 shadow-rose-500/50';
  } else if (type === 'passenger') {
    iconEmoji = '⛴️';
    colorClass = 'bg-amber-500 shadow-amber-500/50';
  }

  return L.divIcon({
    className: 'custom-ship-marker',
    html: `<div class="w-7 h-7 rounded-full ${colorClass} border-2 border-white flex items-center justify-center text-xs shadow-lg transform hover:scale-125 transition-all">
            ${iconEmoji}
          </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

const userCenterIcon = L.divIcon({
  className: 'custom-user-center-marker',
  html: `<div class="w-6 h-6 rounded-full bg-cyan-400 border-2 border-white flex items-center justify-center text-xs shadow-lg animate-pulse">⚓</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function NearbyShipsView({
  currentUser,
  activeRole,
  setActiveRole,
  onLogout,
  selectedLang,
  setSelectedLang,
  uiDict,
  userLocation,
  setUserLocation,
  onToggleFeaturePhone,
  onOpenCatchReport
}) {
  const navigate = useNavigate();
  const ui = uiDict?.ui || {};

  const [selectedRegionId, setSelectedRegionId] = useState('chennai');
  const [activeFilter, setActiveFilter] = useState('all'); // all | cargo | fishing_trawler | patrol | passenger
  const [searchQuery, setSearchQuery] = useState('');
  const [ships, setShips] = useState([]);

  // Find region object
  const currentRegion = COASTAL_REGIONS.find((r) => r.id === selectedRegionId) || COASTAL_REGIONS[0];

  useEffect(() => {
    // Load vessels for region from mock data
    const regionKey = currentRegion.shortName || 'Chennai';
    const regionShips = nearbyShipsData.regions[regionKey] || nearbyShipsData.regions['Chennai'] || [];
    setShips(regionShips);
  }, [selectedRegionId, currentRegion]);

  const filteredShips = ships.filter((ship) => {
    const matchesFilter = activeFilter === 'all' || ship.type === activeFilter;
    const matchesSearch =
      ship.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ship.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ship.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getShipTypeBadge = (type) => {
    switch (type) {
      case 'cargo':
        return { label: 'Cargo Carrier', icon: Ship, color: 'text-sky-400 bg-sky-950/80 border-sky-500/30' };
      case 'patrol':
        return { label: 'Patrol Vessel', icon: Shield, color: 'text-rose-400 bg-rose-950/80 border-rose-500/30' };
      case 'passenger':
        return { label: 'Passenger Ferry', icon: Users, color: 'text-amber-400 bg-amber-950/80 border-amber-500/30' };
      case 'fishing_trawler':
      default:
        return { label: 'Fishing Trawler', icon: Fish, color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/30' };
    }
  };

  const centerPos = [currentRegion.lat, currentRegion.lng];

  return (
    <div className="min-h-screen flex flex-col bg-ocean-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Top Control Bar & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-semibold transition-all group shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Dashboard Menu</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
                <Ship className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                Nearby Vessels Radar
              </h2>
            </div>
          </div>

          {/* Region Selector */}
          <div className="flex items-center gap-2 bg-ocean-900 border border-cyan-500/30 rounded-2xl px-3 py-1.5 text-xs shadow-inner">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-medium">Coastal Region:</span>
            <select
              value={selectedRegionId}
              onChange={(e) => {
                setSelectedRegionId(e.target.value);
                const reg = COASTAL_REGIONS.find(r => r.id === e.target.value);
                if (reg && setUserLocation) {
                  setUserLocation({ lat: reg.lat, lng: reg.lng, name: reg.name });
                }
              }}
              className="bg-transparent text-cyan-300 font-bold outline-none cursor-pointer text-xs"
            >
              {COASTAL_REGIONS.map((reg) => (
                <option key={reg.id} value={reg.id} className="bg-ocean-900 text-slate-100">
                  {reg.name} {!reg.isIndianRegion ? '🌍 (Foreign EEZ)' : '🇮🇳'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Prominent Simulated Data Disclaimer Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
          <div className="flex-1">
            <span className="font-bold uppercase tracking-wider text-[11px] mr-2">Simulated Maritime AIS Data:</span>
            <span>
              All vessel positions, headings, and coordinates shown are synthetically modeled for demonstration and safety drills (zero commercial AIS feed cost / zero API keys).
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-3 rounded-2xl border border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </span>
            {[
              { id: 'all', label: `All Ships (${ships.length})` },
              { id: 'cargo', label: 'Cargo' },
              { id: 'fishing_trawler', label: 'Fishing Trawlers' },
              { id: 'patrol', label: 'Coast Guard / Patrol' },
              { id: 'passenger', label: 'Passenger Ferries' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeFilter === f.id
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-ocean-850 hover:bg-ocean-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vessel by name or type..."
              className="w-full bg-ocean-850 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Layout: Map and Vessel Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Radar Map */}
          <div className="lg:col-span-6 h-[480px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
            <MapContainer
              key={`${currentRegion.id}-${currentRegion.lat}-${currentRegion.lng}`}
              center={centerPos}
              zoom={10}
              scrollWheelZoom={true}
              className="w-full h-full z-10"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />

              {/* Coastal Center Anchor */}
              <Marker position={centerPos} icon={userCenterIcon}>
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-cyan-400">⚓ {currentRegion.name}</p>
                    <p className="text-[10px] text-slate-300">Radar Reference Center</p>
                  </div>
                </Popup>
              </Marker>

              {/* 5km and 10km radar rings */}
              <Circle
                center={centerPos}
                radius={5000}
                pathOptions={{ color: '#06b6d4', weight: 1.5, dashArray: '4, 4', fillOpacity: 0.05 }}
              />
              <Circle
                center={centerPos}
                radius={10000}
                pathOptions={{ color: '#0284c7', weight: 1, dashArray: '6, 6', fillOpacity: 0.02 }}
              />

              {/* Vessel Markers */}
              {filteredShips.map((ship) => (
                <Marker
                  key={ship.id}
                  position={[ship.lat || currentRegion.lat + 0.02, ship.lng || currentRegion.lng + 0.02]}
                  icon={createShipIcon(ship.type)}
                >
                  <Popup>
                    <div className="p-1.5 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1">
                        <span className="font-bold text-slate-100">{ship.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-semibold border border-cyan-500/30">
                          {ship.distanceKm} km
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">{ship.description}</p>
                      <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                        <span>Speed: {ship.speedKnots} kts</span>
                        <span>Heading: {ship.heading}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Radar Range Floating Indicator */}
            <div className="absolute bottom-3 left-3 z-20 glass-panel p-2 rounded-xl text-[10px] text-slate-300 border border-slate-700/60 shadow-lg pointer-events-auto flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>10km Radar Coverage Radius</span>
            </div>
          </div>

          {/* Right Column: Vessel Cards List */}
          <div className="lg:col-span-6 h-[480px] overflow-y-auto space-y-3 pr-1">
            {filteredShips.length === 0 ? (
              <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center text-slate-400">
                <Ship className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-semibold">No vessels match current filter/search.</p>
                <button
                  onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-semibold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredShips.map((ship) => {
                const badge = getShipTypeBadge(ship.type);
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={ship.id}
                    className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all group flex flex-col justify-between gap-2 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-ocean-850 border border-slate-700 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                          <BadgeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                            {ship.name}
                          </h4>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color} inline-flex items-center gap-1 mt-0.5`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-extrabold text-cyan-400">
                          {ship.distanceKm} km
                        </div>
                        <div className="text-[10px] text-slate-400">Distance</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      {ship.description}
                    </p>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Heading: <strong className="text-slate-200">{ship.heading}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Speed: <strong className="text-slate-200">{ship.speedKnots} kts</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
