/**
 * BorderAlertService — Proactive IMBL Maritime Boundary Early Warning & Siren Engine
 *
 * Implements:
 * 1. Continuous point-to-line-segment distance calculation to international maritime boundaries
 * 2. Three escalating alert stages:
 *    - ADVISORY (Stage 1: <= 20 km, > 10 km): Calm on-screen banner, zero sound
 *    - WARNING  (Stage 2: <= 10 km, > 3 km):  Prominent amber banner + moderate Web Audio siren + repeating voice
 *    - CRITICAL (Stage 3: <= 3 km):          Full-width high-contrast red overlay + loud fast siren + repeating voice
 * 3. Pure browser Web Audio API oscillator siren (zero external audio files or keys)
 * 4. Computed turn-back heading & nearest safe harbor resolution
 */

import boundariesMock from '../../data/boundaries_mock.json' with { type: 'json' };

// Distance thresholds in kilometers
export const STAGE_THRESHOLDS = {
  CRITICAL: 3.0, // <= 3.0 km is CRITICAL
  WARNING: 10.0,  // <= 10.0 km is WARNING
  ADVISORY: 20.0  // <= 20.0 km is ADVISORY
};

export const SPOKEN_WARNINGS = {
  en: "Warning. You are approaching the maritime border. Turn back immediately.",
  hi: "चेतावनी। आप समुद्री सीमा के करीब पहुंच रहे हैं। तुरंत वापस लौटें।",
  ta: "எச்சரிக்கை. நீங்கள் சர்வதேச கடல் எல்லையை நெருங்குகிறீர்கள். உடனடியாக திரும்பிச் செல்லுங்கள்.",
  te: "హెచ్చరిక. మీరు సముద్ర సరిహద్దుకు చేరుకుంటున్నారు. వెంటనే వెనక్కి తిరగండి.",
  ml: "മുന്നറിയിപ്പ്. നിങ്ങൾ സമുദ്ര അതിർത്തിയിലേക്ക് അടുക്കുകയാണ്. ഉടനടി തിരികെ പോകുക.",
  bn: "সতর্কতা। আপনি সামুদ্রিক সীমান্তের কাছে পৌঁছাচ্ছেন। অবিলম্বে ফিরে যান।"
};

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

/**
 * Calculate Haversine distance in kilometers between two coordinates
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(2);
}

/**
 * Calculate initial compass bearing from Point A to Point B in degrees (0-360)
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const brng = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return Math.round(brng);
}

/**
 * Convert compass degrees to 8-point cardinal abbreviation (e.g. 245° -> WSW / SW)
 */
export function getCardinalDirection(deg) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  return directions[Math.round(deg / 45) % 8];
}

/**
 * Compute minimum perpendicular distance from a boat point to a line segment
 */
function pointToSegmentDistanceKm(pLat, pLng, aLat, aLng, bLat, bLng) {
  const l2 = (bLat - aLat) ** 2 + (bLng - aLng) ** 2;
  if (l2 === 0) return { dist: haversineKm(pLat, pLng, aLat, aLng), nearest: [aLat, aLng] };

  // Projection parameter t
  let t = ((pLat - aLat) * (bLat - aLat) + (pLng - aLng) * (bLng - aLng)) / l2;
  t = Math.max(0, Math.min(1, t));

  const projLat = aLat + t * (bLat - aLat);
  const projLng = aLng + t * (bLng - aLng);

  return {
    dist: haversineKm(pLat, pLng, projLat, projLng),
    nearest: [projLat, projLng]
  };
}

/**
 * Compute the boat's distance to the nearest point on all IMBL lines
 */
export function evaluateImblProximity(boatLat, boatLng, customImblLines = null) {
  const lines = customImblLines || boundariesMock.imblLines || [];
  let minDistanceKm = Infinity;
  let nearestCoord = null;
  let matchedLineName = 'International Maritime Boundary Line';

  for (const line of lines) {
    const coords = line.coordinates || [];
    for (let i = 0; i < coords.length - 1; i++) {
      const [aLat, aLng] = coords[i];
      const [bLat, bLng] = coords[i + 1];
      const res = pointToSegmentDistanceKm(boatLat, boatLng, aLat, aLng, bLat, bLng);
      if (res.dist < minDistanceKm) {
        minDistanceKm = res.dist;
        nearestCoord = res.nearest;
        matchedLineName = line.name;
      }
    }
  }

  // Determine Alert Stage
  let stage = 'SAFE'; // SAFE | ADVISORY | WARNING | CRITICAL
  if (minDistanceKm <= STAGE_THRESHOLDS.CRITICAL) {
    stage = 'CRITICAL';
  } else if (minDistanceKm <= STAGE_THRESHOLDS.WARNING) {
    stage = 'WARNING';
  } else if (minDistanceKm <= STAGE_THRESHOLDS.ADVISORY) {
    stage = 'ADVISORY';
  }

  // Turn-back heading: bearing pointing directly AWAY from the boundary back into safe waters
  let turnBackBearing = 270; // default West towards Indian mainland
  let turnBackCardinal = 'W';
  if (nearestCoord) {
    // Vector pointing from nearest border point through current boat position
    turnBackBearing = calculateBearing(nearestCoord[0], nearestCoord[1], boatLat, boatLng);
    turnBackCardinal = getCardinalDirection(turnBackBearing);
  }

  // Nearest Safe Harbor
  let nearestHarbor = boundariesMock.harbors[0];
  let minHarborDist = Infinity;
  for (const h of boundariesMock.harbors || []) {
    const d = haversineKm(boatLat, boatLng, h.lat, h.lng);
    if (d < minHarborDist) {
      minHarborDist = d;
      nearestHarbor = { ...h, distanceKm: d };
    }
  }

  return {
    stage,
    minDistanceKm: +minDistanceKm.toFixed(1),
    nearestCoord,
    matchedLineName,
    turnBackBearing,
    turnBackCardinal,
    nearestHarbor
  };
}

/**
 * Web Audio API Oscillator Alarm Siren Engine
 * Produces frequency-swept alternating siren waves entirely locally in the browser
 */
class WebAudioSirenEngine {
  constructor() {
    this.audioCtx = null;
    this.oscillator = null;
    this.gainNode = null;
    this.intervalId = null;
    this.activeStage = null;
    this.isMuted = false;
  }

  initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
  }

  startAlarm(stage) {
    if (stage !== 'WARNING' && stage !== 'CRITICAL') {
      this.stopAlarm();
      return;
    }

    this.initContext();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    // If already playing the same stage and not muted, do not restart
    if (this.activeStage === stage && this.oscillator && !this.isMuted) {
      return;
    }

    this.stopAlarm();
    this.activeStage = stage;

    if (this.isMuted) return;

    try {
      this.oscillator = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();

      // Configure siren wave based on stage
      // CRITICAL stage is noticeably louder and faster repeating than WARNING stage
      const isCritical = stage === 'CRITICAL';
      this.oscillator.type = isCritical ? 'sawtooth' : 'sine';
      
      // Base Gain: Critical is louder (0.45) vs Warning (0.20)
      this.gainNode.gain.setValueAtTime(isCritical ? 0.40 : 0.18, this.audioCtx.currentTime);

      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      let toggle = false;
      const lowFreq = isCritical ? 750 : 600;
      const highFreq = isCritical ? 1350 : 900;
      const speedMs = isCritical ? 250 : 500; // Critical sweeps twice as fast

      this.oscillator.frequency.setValueAtTime(lowFreq, this.audioCtx.currentTime);
      this.oscillator.start();

      this.intervalId = setInterval(() => {
        if (!this.oscillator || !this.audioCtx) return;
        toggle = !toggle;
        const targetFreq = toggle ? highFreq : lowFreq;
        this.oscillator.frequency.cancelScheduledValues(this.audioCtx.currentTime);
        this.oscillator.frequency.linearRampToValueAtTime(targetFreq, this.audioCtx.currentTime + (speedMs / 1000));
      }, speedMs);
    } catch (e) {
      console.warn("Web Audio siren initialization error:", e);
    }
  }

  stopAlarm() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (e) {
        // ignored
      }
      this.oscillator = null;
    }
    this.activeStage = null;
  }
}

export const borderSiren = new WebAudioSirenEngine();
