import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  ShieldAlert,
  AlertTriangle,
  Volume2,
  VolumeX,
  Compass,
  MapPin,
  Play,
  RotateCcw,
  Navigation,
  LifeBuoy
} from 'lucide-react';
import nearbyShipsMock from '../../data/nearby_ships_mock.json' with { type: 'json' };
import boundariesMock from '../../data/boundaries_mock.json' with { type: 'json' };
import {
  evaluateImblProximity,
  borderSiren,
  SPOKEN_WARNINGS,
  STAGE_THRESHOLDS
} from '../services/borderAlertService';
import { voiceService } from '../services/voiceService';

// Custom Leaflet Icons created via L.divIcon
const createPfzIcon = (favourabilityScore) => {
  let colorClass = 'bg-emerald-500 shadow-emerald-500/50';
  if (favourabilityScore < 85) colorClass = 'bg-amber-500 shadow-amber-500/50';
  if (favourabilityScore < 75) colorClass = 'bg-rose-500 shadow-rose-500/50';

  return L.divIcon({
    className: 'custom-pfz-marker',
    html: `<div class="w-6 h-6 rounded-full ${colorClass} border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-lg transform hover:scale-125 transition-all">
            🐟
          </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const createLiveShipIcon = (type) => {
  let iconEmoji = '🚢';
  let colorBg = 'bg-sky-500/90 shadow-sky-500/40';

  if (type === 'fishing_trawler') {
    iconEmoji = '🐟';
    colorBg = 'bg-emerald-500/90 shadow-emerald-500/40';
  } else if (type === 'patrol') {
    iconEmoji = '🛡️';
    colorBg = 'bg-rose-500/90 shadow-rose-500/40';
  } else if (type === 'passenger') {
    iconEmoji = '⛴️';
    colorBg = 'bg-amber-500/90 shadow-amber-500/40';
  }

  return L.divIcon({
    className: 'custom-live-ship-marker',
    html: `<div class="w-5 h-5 rounded-full ${colorBg} border border-white flex items-center justify-center text-[9px] text-white shadow-md transform hover:scale-125 transition-all animate-pulse">
            ${iconEmoji}
          </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div class="user-location-marker"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Map click listener component to update user vessel position
function MapClickHandler({ onLocationChange }) {
  useMapEvents({
    click(e) {
      if (onLocationChange) {
        onLocationChange({
          lat: +e.latlng.lat.toFixed(4),
          lng: +e.latlng.lng.toFixed(4),
          name: `Selected Coordinates (${e.latlng.lat.toFixed(2)}, ${e.latlng.lng.toFixed(2)})`
        });
      }
    },
  });
  return null;
}

export default function MapView({
  mapLayers,
  userLocation,
  onLocationChange,
  selectedLang = 'en',
  speechLang = 'en-US'
}) {
  const position = [userLocation?.lat || 13.0827, userLocation?.lng || 80.2707];

  const pfzMarkers = mapLayers?.pfzMarkers || [];
  const routePolyline = mapLayers?.routePolyline || [];
  const imblLines = mapLayers?.imblLines || boundariesMock.imblLines || [];
  const marineProtectedAreas = mapLayers?.marineProtectedAreas || [];

  // Live Animated Ships State
  const [liveShips, setLiveShips] = useState([]);

  // ─────────────────────────────────────────────────────────────
  //  BORDER LINE ALERT STATE & PROXIMITY EVALUATION
  // ─────────────────────────────────────────────────────────────
  const [proximityInfo, setProximityInfo] = useState({
    stage: 'SAFE',
    minDistanceKm: 45.0,
    matchedLineName: 'India - Sri Lanka IMBL',
    turnBackBearing: 270,
    turnBackCardinal: 'W',
    nearestHarbor: boundariesMock.harbors[0]
  });

  // Demo Approach Simulation State
  const [isSimulatingApproach, setIsSimulatingApproach] = useState(false);
  const [simOriginalPos, setSimOriginalPos] = useState(null);
  const simStepRef = useRef(0);

  // Silence for 30 seconds state
  const [isSilenced, setIsSilenced] = useState(false);
  const [silenceSecondsLeft, setSilenceSecondsLeft] = useState(0);

  // Evaluate IMBL distance whenever user location changes
  useEffect(() => {
    const info = evaluateImblProximity(position[0], position[1], imblLines);
    setProximityInfo(info);
  }, [position[0], position[1], imblLines]);

  // Audio Siren & Speech Synthesizer Trigger
  useEffect(() => {
    const stage = proximityInfo.stage;

    if (stage === 'WARNING' || stage === 'CRITICAL') {
      if (!isSilenced) {
        // Start Web Audio siren
        borderSiren.startAlarm(stage);

        // Speak warning aloud in current language
        const spokenText = SPOKEN_WARNINGS[selectedLang] || SPOKEN_WARNINGS.en;
        voiceService.speak(spokenText, speechLang);

        // Repeat speech every 12 seconds while in alert stage and not silenced
        const speechTimer = setInterval(() => {
          if (!isSilenced) {
            voiceService.speak(spokenText, speechLang);
          }
        }, 12000);

        return () => {
          clearInterval(speechTimer);
          borderSiren.stopAlarm();
        };
      } else {
        borderSiren.stopAlarm();
        voiceService.stopSpeaking();
      }
    } else {
      // Safe / Advisory -> stop siren & speech
      borderSiren.stopAlarm();
    }
  }, [proximityInfo.stage, isSilenced, selectedLang, speechLang]);

  // Handle 30s Silence countdown timer
  useEffect(() => {
    let timer = null;
    if (isSilenced && silenceSecondsLeft > 0) {
      timer = setInterval(() => {
        setSilenceSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsSilenced(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSilenced, silenceSecondsLeft]);

  const handleSilence30s = () => {
    setIsSilenced(true);
    setSilenceSecondsLeft(30);
    borderSiren.stopAlarm();
    voiceService.stopSpeaking();
  };

  // ─────────────────────────────────────────────────────────────
  //  "Simulate Approach" Demo Button logic
  //  Advances the boat smoothly from current position to:
  //  Step 1: ~18km (Advisory) -> Step 2: ~8km (Warning) -> Step 3: ~2.2km (Critical)
  // ─────────────────────────────────────────────────────────────
  const toggleSimulateApproach = () => {
    if (isSimulatingApproach) {
      // Reset simulation
      setIsSimulatingApproach(false);
      simStepRef.current = 0;
      if (simOriginalPos && onLocationChange) {
        onLocationChange(simOriginalPos);
      }
      setIsSilenced(false);
      setSilenceSecondsLeft(0);
    } else {
      // Start simulation
      setSimOriginalPos({ lat: position[0], lng: position[1], name: userLocation?.name || 'Original Position' });
      setIsSimulatingApproach(true);
      simStepRef.current = 1;

      // Target closest IMBL segment in Palk Strait (e.g. 9.75, 79.50)
      if (onLocationChange) {
        // Step 1: ~18 km away (ADVISORY)
        onLocationChange({
          lat: 9.68,
          lng: 79.35,
          name: 'Simulated Boat: 18km to IMBL (Advisory Zone)'
        });
      }
    }
  };

  // Interval step runner for simulation
  useEffect(() => {
    let simInterval = null;
    if (isSimulatingApproach) {
      simInterval = setInterval(() => {
        simStepRef.current = (simStepRef.current + 1) % 4;
        if (!onLocationChange) return;

        if (simStepRef.current === 1) {
          // Advisory: ~18 km
          onLocationChange({
            lat: 9.68,
            lng: 79.35,
            name: 'Simulated Boat: 18km to IMBL (Advisory)'
          });
        } else if (simStepRef.current === 2) {
          // Warning: ~8 km (amber alert + moderate siren + speech)
          onLocationChange({
            lat: 9.71,
            lng: 79.43,
            name: 'Simulated Boat: 8km to IMBL (Warning)'
          });
        } else if (simStepRef.current === 3) {
          // Critical: ~2.2 km (red overlay + loud siren + speech)
          onLocationChange({
            lat: 9.73,
            lng: 79.48,
            name: 'Simulated Boat: 2.2km to IMBL (Critical)'
          });
        }
      }, 5000);
    }
    return () => {
      if (simInterval) clearInterval(simInterval);
    };
  }, [isSimulatingApproach, onLocationChange]);

  // Live ship drift
  useEffect(() => {
    const allRegions = Object.values(nearbyShipsMock.regions || {}).flat();
    const nearby = allRegions.slice(0, 10).map((ship, idx) => ({
      ...ship,
      lat: position[0] + (Math.sin(idx * 1.3) * 0.12) + 0.03,
      lng: position[1] + (Math.cos(idx * 1.3) * 0.14) + 0.04,
    }));
    setLiveShips(nearby);
  }, [userLocation?.lat, userLocation?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const isAdvisory = proximityInfo.stage === 'ADVISORY';
  const isWarning = proximityInfo.stage === 'WARNING';
  const isCritical = proximityInfo.stage === 'CRITICAL';

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* ─────────────────────────────────────────────────────────
          STAGE 3: FULL-WIDTH HIGH-CONTRAST CRITICAL RED ALERT OVERLAY
         ───────────────────────────────────────────────────────── */}
      {isCritical && (
        <div className="absolute inset-x-0 top-0 z-30 bg-rose-600/95 border-b-4 border-rose-300 text-white p-3 shadow-2xl backdrop-blur-md animate-pulse">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white text-rose-600 flex items-center justify-center font-black animate-bounce shadow-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-black/40 uppercase tracking-widest">
                    CRITICAL STAGE 3
                  </span>
                  <h3 className="text-sm sm:text-base font-black tracking-tight">
                    IMMINENT MARITIME BORDER CROSSING ({proximityInfo.minDistanceKm} KM)
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 text-xs font-semibold text-rose-100 mt-0.5">
                  <span>Turn-Back Heading: <strong className="text-white underline">{proximityInfo.turnBackBearing}° {proximityInfo.turnBackCardinal}</strong></span>
                  <span>•</span>
                  <span>Safe Haven: <strong className="text-white">{proximityInfo.nearestHarbor?.name} ({proximityInfo.nearestHarbor?.distanceKm} km)</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSilence30s}
                disabled={isSilenced}
                className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/40 text-xs font-bold transition-all shadow flex items-center gap-1.5"
              >
                {isSilenced ? <VolumeX className="w-4 h-4 text-amber-300" /> : <Volume2 className="w-4 h-4" />}
                <span>{isSilenced ? `Silenced (${silenceSecondsLeft}s)` : 'Silence for 30s'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          STAGE 2: PROMINENT AMBER WARNING BANNER
         ───────────────────────────────────────────────────────── */}
      {isWarning && (
        <div className="absolute inset-x-0 top-0 z-30 bg-amber-500/95 border-b-2 border-amber-300 text-slate-950 p-2.5 shadow-xl backdrop-blur-md">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-950 text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold uppercase">Stage 2 Warning:</span> Approaching {proximityInfo.matchedLineName} ({proximityInfo.minDistanceKm} km). Turn Back Heading: <strong className="font-mono">{proximityInfo.turnBackBearing}° {proximityInfo.turnBackCardinal}</strong>. Safe Harbor: <strong>{proximityInfo.nearestHarbor?.name} ({proximityInfo.nearestHarbor?.distanceKm} km)</strong>
              </div>
            </div>

            <button
              onClick={handleSilence30s}
              disabled={isSilenced}
              className="px-2.5 py-1 rounded-lg bg-slate-950 text-amber-300 text-[11px] font-bold transition-all flex items-center gap-1 shadow"
            >
              {isSilenced ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isSilenced ? `Silenced (${silenceSecondsLeft}s)` : 'Silence 30s'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          STAGE 1: CALM ON-SCREEN ADVISORY BANNER (NO SOUND)
         ───────────────────────────────────────────────────────── */}
      {isAdvisory && (
        <div className="absolute inset-x-0 top-0 z-30 bg-ocean-900/90 border-b border-cyan-500/40 text-slate-200 px-4 py-2 text-xs flex items-center justify-between backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>
              <strong className="text-cyan-300 uppercase">Stage 1 Advisory:</strong> Within {proximityInfo.minDistanceKm} km of {proximityInfo.matchedLineName}. Turn-Back: <strong className="text-cyan-200">{proximityInfo.turnBackBearing}° {proximityInfo.turnBackCardinal}</strong> • Nearest Harbor: {proximityInfo.nearestHarbor?.name} ({proximityInfo.nearestHarbor?.distanceKm} km)
            </span>
          </div>
          <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/30">
            Advisory Active
          </span>
        </div>
      )}

      {/* Main Leaflet Map Canvas */}
      <div className="flex-1 w-full h-full relative">
        <MapContainer
          key={`${position[0]}-${position[1]}`}
          center={position}
          zoom={8}
          scrollWheelZoom={true}
          className="w-full h-full z-10"
        >
          {/* OpenStreetMap Free Tiles with client-side CSS dark filter */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <MapClickHandler onLocationChange={onLocationChange} />

          {/* User Vessel Location Marker */}
          <Marker position={position} icon={userIcon}>
            <Popup>
              <div className="p-1 space-y-1">
                <p className="font-bold text-xs text-cyan-400">⚓ Your Vessel Position</p>
                <p className="text-[11px] text-slate-300">Lat: {position[0]}, Lng: {position[1]}</p>
                <p className="text-[10px] text-amber-300 font-semibold">Distance to IMBL: {proximityInfo.minDistanceKm} km</p>
                <p className="text-[10px] text-slate-400 italic">Click map to reposition vessel</p>
              </div>
            </Popup>
          </Marker>

          {/* PFZ Markers */}
          {pfzMarkers.map((pfz) => (
            <Marker
              key={pfz.id}
              position={[pfz.lat, pfz.lng]}
              icon={createPfzIcon(pfz.favourabilityScore)}
            >
              <Popup>
                <div className="p-1.5 space-y-1">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1">
                    <h4 className="font-bold text-xs text-emerald-400">{pfz.name}</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                      {pfz.favourabilityScore}% Favourability
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Target Species: <span className="text-cyan-300 font-medium">{(pfz.targetSpecies || []).join(', ')}</span>
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Live Animated Ships */}
          {liveShips.map((ship) => (
            <Marker
              key={ship.id}
              position={[ship.lat, ship.lng]}
              icon={createLiveShipIcon(ship.type)}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <span className="font-bold text-cyan-300">{ship.name}</span>
                  <p className="text-[10px] text-slate-300">{ship.description}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Route Polyline */}
          {routePolyline.length > 1 && (
            <Polyline
              positions={routePolyline}
              pathOptions={{ color: '#06b6d4', weight: 4, dashArray: '8, 8', opacity: 0.9 }}
            />
          )}

          {/* IMBL Boundary Lines */}
          {imblLines.map((line, idx) => (
            <Polyline
              key={`imbl-${idx}`}
              positions={line.coordinates}
              pathOptions={{ color: '#ef4444', weight: 3, opacity: 0.85 }}
            />
          ))}

          {/* Marine Protected Area Polygons */}
          {marineProtectedAreas.map((mpa) => (
            <Polygon
              key={mpa.id}
              positions={mpa.coordinates}
              pathOptions={{ fillColor: '#f59e0b', fillOpacity: 0.25, color: '#f59e0b', weight: 1.5 }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <p className="font-bold text-amber-400">{mpa.name}</p>
                  <p className="text-[10px] text-slate-300 mt-1">{mpa.restrictions}</p>
                </div>
              </Popup>
            </Polygon>
          ))}
        </MapContainer>

        {/* ─────────────────────────────────────────────────────────
            "SIMULATE APPROACH" DEMO CONTROL BUTTON (TOP LEFT)
           ───────────────────────────────────────────────────────── */}
        <div className="absolute top-4 left-4 z-20 pointer-events-auto">
          <button
            onClick={toggleSimulateApproach}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-xl transition-all ${
              isSimulatingApproach
                ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-rose-600/30'
                : 'bg-ocean-900/90 text-slate-200 hover:text-white border-slate-700 hover:border-cyan-400'
            }`}
            title="Simulate approaching international boundary for live judge demonstration"
          >
            {isSimulatingApproach ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isSimulatingApproach ? 'Reset Simulation' : 'Simulate Approach'}</span>
          </button>
        </div>

        {/* Map Legend Floating Widget (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-20 glass-panel p-2.5 rounded-xl text-[10px] space-y-1 border border-slate-700/60 shadow-xl pointer-events-auto">
          <div className="font-semibold text-slate-200 mb-1 border-b border-slate-700 pb-1 flex items-center justify-between">
            <span>Map Legend</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300">High PFZ Fishing Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-rose-500"></span>
            <span className="text-slate-300">IMBL Boundary Line</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-amber-500/40 border border-amber-500"></span>
            <span className="text-slate-300">Marine Protected Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
}
