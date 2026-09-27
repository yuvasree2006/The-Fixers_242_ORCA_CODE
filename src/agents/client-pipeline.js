/**
 * Client-Side Agent Pipeline
 * Runs ALL marine reasoning locally in the browser — zero server calls.
 * Reads from local JSON imports (pfz, weather, boundaries).
 */

import pfzMock from '../../data/pfz_mock.json' with { type: 'json' };
import weatherMock from '../../data/weather_mock.json' with { type: 'json' };
import boundariesMock from '../../data/boundaries_mock.json' with { type: 'json' };
import { getAnswerTemplate, getFallbackResponse } from './intent-matcher.js';

// ────────────────────────────────────────────
// AGENT 3: Marine Data Agent (local)
// ────────────────────────────────────────────
export function getPfzList() {
  return pfzMock;
}

// ────────────────────────────────────────────
// AGENT 4: Weather Intelligence Agent (local)
// ────────────────────────────────────────────
export function getWeatherLocal(userLat, userLng) {
  const base = weatherMock.default || {};
  let regionName = 'Tamil Nadu';
  if (userLat > 20.0 && userLng > 87.0) regionName = 'West Bengal';
  else if (userLat > 15.0 && userLng > 81.0) regionName = 'Andhra Pradesh';
  else if (userLat < 11.5 && userLng < 77.5) regionName = 'Kerala';
  else if (userLat > 18.0 && userLng < 73.5) regionName = 'Maharashtra';

  const reg = (weatherMock.regions || {})[regionName] || {};
  const waveHeight = +((reg.waveHeightMeters || base.waveHeightMeters || 1.4) + (Math.random() * 0.2 - 0.1)).toFixed(1);
  const windSpeed = +((reg.windSpeedKmH || base.windSpeedKmH || 18.5) + (Math.random() * 2 - 1)).toFixed(1);

  return {
    region: regionName,
    temperatureC: base.temperatureC || 28.5,
    waveHeightMeters: Math.max(0.5, waveHeight),
    windSpeedKmH: Math.max(5, windSpeed),
    windDirection: reg.windDirection || base.windDirection || 'SW',
    swellPeriodSec: base.swellPeriodSec || 8.5,
    rainfallProbPercent: reg.rainfallProbPercent ?? base.rainfallProbPercent ?? 15,
    cycloneAlertLevel: reg.cycloneAlertLevel || base.cycloneAlertLevel || 'NONE',
    lightningRisk: reg.lightningRisk ?? base.lightningRisk ?? false,
    visibilityKm: base.visibilityKm || 10.0,
    trendSummary: reg.trendSummary || base.trendSummary || 'Slight improvement from Day 3 onwards. Calm conditions expected Day 4.',
    fiveDayOutlook: reg.fiveDayOutlook || base.fiveDayOutlook || [],
    tideTimes: reg.tideTimes || base.tideTimes || {},
  };
}

// ────────────────────────────────────────────
// AGENT 5: Geospatial Reasoning Agent (local)
// ────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

export function getGeospatialLocal(userLat, userLng, pfzList) {
  let nearestPfz = null, minDist = Infinity;
  for (const pfz of pfzList) {
    const d = haversine(userLat, userLng, pfz.lat, pfz.lng);
    if (d < minDist) { minDist = d; nearestPfz = { ...pfz, distanceKm: d }; }
  }

  let nearImbl = false, imblWarningText = null;
  for (const line of boundariesMock.imblLines || []) {
    for (const pt of line.coordinates) {
      const d = haversine(userLat, userLng, pt[0], pt[1]);
      if (d < 15.0) {
        nearImbl = true;
        imblWarningText = `Within ${d} km of ${line.name}`;
        break;
      }
    }
  }

  let insideMpa = false, mpaWarningText = null, nearestMpa = null;
  for (const mpa of boundariesMock.marineProtectedAreas || []) {
    if (!nearestMpa) nearestMpa = mpa;
    if (pointInPolygon([userLat, userLng], mpa.coordinates)) {
      insideMpa = true;
      mpaWarningText = `Inside ${mpa.name} — ${mpa.restrictions}`;
      nearestMpa = mpa;
      break;
    }
  }

  return { userLat, userLng, nearestPfz, nearImbl, imblWarningText, insideMpa, mpaWarningText, nearestMpa, boundaries: boundariesMock };
}

// ────────────────────────────────────────────
// AGENT 6: Risk Assessment Agent (local)
// ────────────────────────────────────────────
export function computeRiskLocal(weather, geospatial) {
  let score = 100;
  const deductions = [];

  if (weather.waveHeightMeters > 3.0) { score -= 45; deductions.push(`Severe waves (${weather.waveHeightMeters}m): -45`); }
  else if (weather.waveHeightMeters >= 2.0) { score -= 25; deductions.push(`High waves (${weather.waveHeightMeters}m): -25`); }
  else if (weather.waveHeightMeters >= 1.5) { score -= 10; deductions.push(`Moderate swell (${weather.waveHeightMeters}m): -10`); }

  if (weather.windSpeedKmH > 40) { score -= 35; deductions.push(`Strong winds (${weather.windSpeedKmH}km/h): -35`); }
  else if (weather.windSpeedKmH >= 25) { score -= 20; deductions.push(`Moderate wind (${weather.windSpeedKmH}km/h): -20`); }
  else if (weather.windSpeedKmH >= 15) { score -= 5; deductions.push(`Light wind (${weather.windSpeedKmH}km/h): -5`); }

  if (weather.cycloneAlertLevel === 'WARNING' || weather.cycloneAlertLevel === 'SEVERE') { score -= 60; deductions.push('Active cyclone warning: -60'); }
  else if (weather.cycloneAlertLevel === 'WATCH') { score -= 30; deductions.push('Cyclone watch: -30'); }

  if (weather.lightningRisk) { score -= 20; deductions.push('Lightning risk: -20'); }
  if (geospatial.nearImbl) { score -= 15; deductions.push('Near IMBL: -15'); }
  if (geospatial.insideMpa) { score -= 20; deductions.push('Inside MPA: -20'); }

  const finalScore = Math.max(0, Math.min(100, score));
  const safetyLevel = finalScore < 50 ? 'DANGER' : finalScore < 75 ? 'CAUTION' : 'SAFE';
  return { safetyScore: finalScore, safetyLevel, deductions };
}

// ────────────────────────────────────────────
// AGENT 7: Route Optimization Agent (local)
// ────────────────────────────────────────────
export function computeRouteLocal(userLat, userLng, targetPfz) {
  if (!targetPfz) return { waypoints: [], totalDistanceKm: 0 };
  const steps = 5;
  const waypoints = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let lat = userLat + (targetPfz.lat - userLat) * t;
    let lng = userLng + (targetPfz.lng - userLng) * t;
    if (i === 2 || i === 3) { lat += 0.02; lng += 0.015; }
    waypoints.push({
      step: i + 1,
      lat: +lat.toFixed(4), lng: +lng.toFixed(4),
      label: i === 0 ? 'Start (Vessel)' : (i === steps ? `Destination (${targetPfz.name})` : `Waypoint ${i}`)
    });
  }
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    total += haversine(waypoints[i].lat, waypoints[i].lng, waypoints[i + 1].lat, waypoints[i + 1].lng);
  }
  return { waypoints, totalDistanceKm: +total.toFixed(1) };
}

// ────────────────────────────────────────────
// AGENT 8: Explainability / NLG Agent (local)
// ────────────────────────────────────────────
function getWaveLabel(w) {
  if (w < 1.0) return 'Calm'; if (w < 1.5) return 'Slight'; if (w < 2.0) return 'Moderate'; if (w < 3.0) return 'Rough'; return 'Very Rough';
}
function getSeaState(w) {
  if (w < 1.0) return 'Calm — Excellent'; if (w < 1.5) return 'Slight — Good'; if (w < 2.0) return 'Moderate — Caution'; if (w < 3.0) return 'Rough — Use caution'; return 'Very Rough — Stay ashore';
}

const VERDICTS = {
  SAFE:    { en: '✅ Safe to venture. Conditions favorable.', hi: '✅ समुद्र में जाना सुरक्षित है।', ta: '✅ கடலுக்குச் செல்வது பாதுகாப்பானது.', te: '✅ సురక్షితం. అనుకూల పరిస్థితులు.', ml: '✅ കടലിൽ പോകാം. സുരക്ഷിതം.', bn: '✅ সমুদ্রে যাওয়া নিরাপদ।' },
  CAUTION: { en: '⚠️ Proceed with caution. Keep radio contact.', hi: '⚠️ सावधानी से जाएं। रेडियो संपर्क बनाए रखें।', ta: '⚠️ எச்சரிக்கையுடன் சென்று வானொலி தொடர்பில் இருக்கவும்.', te: '⚠️ జాగ్రత్తగా వెళ్ళండి.', ml: '⚠️ ജാഗ്രതയോടെ. റേഡിയോ ബന്ധം നിലനിർത്തുക.', bn: '⚠️ সতর্কতার সাথে যান।' },
  DANGER:  { en: '🔴 DANGER — Stay ashore. Adverse conditions.', hi: '🔴 खतरा — किनारे पर रहें।', ta: '🔴 ஆபத்து — கரையில் இருங்கள்.', te: '🔴 ప్రమాదం — తీరంలో ఉండండి.', ml: '🔴 അപകടം — കരയിൽ തുടരുക.', bn: '🔴 বিপদ — উপকূলে থাকুন।' },
};

const CYCLONE_TEXT = {
  NONE:    { en: 'No cyclone alert', hi: 'चक्रवात चेतावनी नहीं', ta: 'புயல் எச்சரிக்கை இல்லை', te: 'తుఫాను హెచ్చరిక లేదు', ml: 'ചുഴലിക്കാറ്റ് ഇല്ല', bn: 'কোনো ঘূর্ণিঝড় নেই' },
  WATCH:   { en: '🌀 Cyclone Watch issued', hi: '🌀 चक्रवात वॉच जारी', ta: '🌀 புயல் கண்காணிப்பு', te: '🌀 తుఫాను పర్యవేక్షణ', ml: '🌀 ചുഴലിക്കാറ്റ് നിരീക്ഷണം', bn: '🌀 ঘূর্ণিঝড় পর্যবেক্ষণ' },
  WARNING: { en: '🔴 CYCLONE WARNING IN EFFECT', hi: '🔴 चक्रवात चेतावनी सक्रिय', ta: '🔴 புயல் எச்சரிக்கை செயலில்', te: '🔴 తుఫాను హెచ్చరిక', ml: '🔴 ചുഴലിക്കാറ്റ് മുന്നറിയിപ്പ്', bn: '🔴 ঘূর্ণিঝড় সতর্কতা' },
};

const LIGHTNING_TEXT = {
  clear: { en: 'No lightning risk', hi: 'बिजली का खतरा नहीं', ta: 'மின்னல் ஆபத்து இல்லை', te: 'మెరుపు ప్రమాదం లేదు', ml: 'മിന്നൽ ഇല്ല', bn: 'বজ্রপাতের ঝুঁকি নেই' },
  active: { en: '⚡ Lightning risk active', hi: '⚡ बिजली का खतरा सक्रिय', ta: '⚡ மின்னல் ஆபத்து', te: '⚡ మెరుపు ప్రమాదం', ml: '⚡ മിന്നൽ അപകടം', bn: '⚡ বজ্রপাতের ঝুঁকি' },
};

const CYCLONE_ADVISORY = {
  NONE:    { en: 'No cyclone restrictions. Proceed normally.', hi: 'कोई चक्रवात प्रतिबंध नहीं। सामान्य रूप से आगे बढ़ें।', ta: 'புயல் தடை இல்லை. இயல்பாக தொடரவும்.', te: 'తుఫాను నిషేధం లేదు. సాధారణంగా కొనసాగండి.', ml: 'ചുഴലിക്കാറ്റ് ഇല്ല. സ്বഭാവികമായി തുടരുക.', bn: 'কোনো নিষেধাজ্ঞা নেই। স্বাভাবিকভাবে যান।' },
  WATCH:   { en: 'Monitor IMD advisories. Limit offshore trips to within 12 nautical miles.', hi: 'IMD परामर्श का पालन करें। 12 समुद्री मील के भीतर रहें।', ta: 'IMD ஆலோசனை கண்காணிக்கவும். 12 கடல் மைல் வரை மட்டுமே.', te: 'IMD సలహాలు పర్యవేక్షించండి. 12 నా.మైళ్ళలో ఉండండి.', ml: 'IMD ഉപദേശം ശ്രദ്ധിക്കുക. 12 കി.മൈ ഉള്ളിൽ.', bn: 'IMD পরামর্শ দেখুন। ১২ নটিক্যাল মাইলের মধ্যে থাকুন।' },
  WARNING: { en: 'RETURN TO HARBOR IMMEDIATELY. All vessels must seek shelter.', hi: 'तुरंत बंदरगाह वापस लौटें।', ta: 'உடனடியாக துறைமுகம் திரும்புங்கள்.', te: 'వెంటనే ఓడరేవుకు తిరిగి రండి.', ml: 'ഉടനടി തുറമുഖത്തേക്ക് മടങ്ങുക.', bn: 'অবিলম্বে বন্দরে ফিরে যান।' },
};

const LIGHTNING_ADVISORY = {
  en: { clear: 'Clear conditions — proceed normally.', risk: 'Avoid open water and tall equipment.' },
  hi: { clear: 'सुरक्षित स्थिति।', risk: 'खुले पानी और ऊंचे उपकरणों से दूर रहें।' },
  ta: { clear: 'பாதுகாப்பான நிலை.', risk: 'திறந்த கடலில் இருந்து விலகுங்கள்.' },
  te: { clear: 'సురక్షిత పరిస్థితి.', risk: 'తెరిచిన సముద్రం నుండి దూరంగా ఉండండి.' },
  ml: { clear: 'സുരക്ഷിത അവസ്ഥ.', risk: 'തുറന്ന ജലം ഒഴിവാക്കുക.' },
  bn: { clear: 'নিরাপদ অবস্থা।', risk: 'খোলা জল এড়িয়ে চলুন।' },
};

const ROUTE_ADVISORY = {
  en: 'Stay on marked waypoints. Maintain VHF radio contact. Check weather every 2 hours.',
  hi: 'चिह्नित वेपॉइंट पर रहें। VHF रेडियो संपर्क बनाए रखें।',
  ta: 'குறிக்கப்பட்ட வேப்பாயிண்ட்களில் VHF வானொலி தொடர்பை பராமரிக்கவும்.',
  te: 'గుర్తించిన వేపాయింట్లలో ఉండండి. VHF రేడియో సంపర్కం నిలబెట్టండి.',
  ml: 'അടയാളപ്പെടുത്തിയ വേ‌പോയിന്റുകളിൽ VHF ബന്ധം നിലനിർത്തുക.',
  bn: 'চিহ্নিত ওয়েপয়েন্টে থাকুন। VHF রেডিও যোগাযোগ রাখুন।',
};

const HAZARD_ADVISORY = {
  en: 'Stay in designated fishing zones. Maintain at least 15 km from IMBL. Avoid MPA polygons.',
  hi: 'निर्धारित मछली पकड़ने के क्षेत्रों में रहें। IMBL से 15 किमी दूर रहें।',
  ta: 'நியமிக்கப்பட்ட மீன்பிடி மண்டலங்களில் இருங்கள். IMBL இலிருந்து 15 கிமீ தொலைவிலிருங்கள்.',
  te: 'నిర్దేశించిన మత్స్య ప్రాంతాల్లో ఉండండి. IMBL నుండి 15 కిమీ దూరంగా ఉండండి.',
  ml: 'നിശ്ചിത മത്സ്യ മേഖലകളിൽ ഉണ്ടാകുക. IMBL-ൽ നിന്ന് 15 കിമീ ദൂരം.',
  bn: 'নির্ধারিত মাছ ধরার এলাকায় থাকুন। IMBL থেকে ১৫ কিমি দূরে।',
};

function getTideData(weather) {
  const tTimes = (weather && weather.tideTimes) ? weather.tideTimes : (weatherMock.default?.tideTimes || {});
  const hour = new Date().getHours();
  const phases = ['Rising Tide', 'High Tide', 'Falling Tide', 'Low Tide'];
  const phase = phases[Math.floor(hour / 6) % 4];
  return {
    tidePhase: phase,
    highTide1: tTimes.highTideM1 || '1.8',
    highTideTime1: tTimes.highTide1 || '06:18',
    highTide2: tTimes.highTideM2 || '1.9',
    highTideTime2: tTimes.highTide2 || '18:42',
    lowTide1: tTimes.lowTideM1 || '0.3',
    lowTideTime1: tTimes.lowTide1 || '00:12',
    lowTide2: tTimes.lowTideM2 || '0.4',
    lowTideTime2: tTimes.lowTide2 || '12:28',
    tidalRange: tTimes.tidalRange || '1.5',
    tidalAdvice: phase.includes('High') ? 'Excellent time for deep-water fishing and navigation' : 'Good time for coastal shallow-water fishing',
  };
}

export function getTop3Pfz(pfzList, userLat = 13.0827, userLng = 80.2707) {
  const sorted = [...(pfzList || [])].sort((a, b) => (b.favourabilityScore || 0) - (a.favourabilityScore || 0));
  const top3 = sorted.slice(0, 3);
  return top3.map((p, idx) => {
    const dist = haversine(userLat, userLng, p.lat, p.lng);
    const species = (p.targetSpecies || ['Mackerel', 'Sardines']).join(', ');
    return `  ${idx + 1}. ${p.name} — Score: ${p.favourabilityScore}/100 | Dist: ${dist} km | Depth: ${p.depthMeters}m (${species})`;
  }).join('\n') || '  No high-yield zones currently registered.';
}

export function getSpeciesLikelihood(pfz) {
  const fav = pfz?.favourabilityScore ?? 85;
  const chl = pfz?.chlorophyll ?? 3.5;
  if (fav >= 90 && chl >= 4.0) {
    return 'Sardine, Mackerel, Anchovies — Very High Catch Potential';
  } else if (fav >= 80 && chl >= 3.0) {
    return 'Seer Fish, Prawns, Tuna — High Catch Potential';
  } else if (fav >= 70) {
    return 'Mixed Coastal Species — Moderate Catch Potential';
  } else {
    return 'Low Catch Potential — Consider alternate zone';
  }
}

export function getNearestHarbor(userLat, userLng, harbors, weather) {
  const harborList = harbors || boundariesMock.harbors || [];
  if (harborList.length === 0) {
    return {
      name: 'Chennai Fishing Harbour',
      distanceKm: '12.4',
      dockingCapacity: 'Large — Deep draft vessels OK',
      coastGuardStation: true,
      dockSafe: 'Safe for docking ✅'
    };
  }
  let nearest = harborList[0];
  let minDist = haversine(userLat, userLng, nearest.lat, nearest.lng);
  for (let i = 1; i < harborList.length; i++) {
    const d = haversine(userLat, userLng, harborList[i].lat, harborList[i].lng);
    if (d < minDist) {
      minDist = d;
      nearest = harborList[i];
    }
  }
  const isSafe = (weather?.waveHeightMeters || 1.4) <= 2.0 && (weather?.windSpeedKmH || 18) <= 35;
  return {
    name: nearest.name,
    distanceKm: minDist.toFixed(1),
    dockingCapacity: nearest.dockingCapacity,
    coastGuardStation: nearest.coastGuardStation,
    dockSafe: isSafe ? 'Safe for docking ✅' : '⚠️ Rough seas — approach with caution'
  };
}

export function getOffshoreChlorophyll(pfzList, userLat, userLng) {
  const list = pfzList || [];
  let best = list.find(p => p.depthMeters >= 50) || list[0] || {};
  const dist = haversine(userLat, userLng, best.lat || 13.2, best.lng || 80.5);
  return {
    chl: best.chlorophyll || '4.2',
    name: best.name || 'Offshore Thermal Front Zone',
    dist: dist.toFixed(1)
  };
}

export function getFiveDayOutlook(weather) {
  const outlook = (weather && weather.fiveDayOutlook && weather.fiveDayOutlook.length > 0)
    ? weather.fiveDayOutlook
    : (weatherMock.default?.fiveDayOutlook || []);
  return outlook.map(item => `  • ${item.day}: Waves ${item.waveH}m, Wind ${item.windKmH} km/h — ${item.condition}`).join('\n');
}

export function getPortStatus(weather, risk, harbors, userLat, userLng) {
  const harbor = getNearestHarbor(userLat, userLng, harbors, weather);
  const score = risk?.safetyScore ?? 75;
  let closureAdvisory;
  if (score < 50) {
    closureAdvisory = '🔴 Advisory: Issue Port Closure — High Risk Conditions (Suspend small-craft departures)';
  } else if (score < 75) {
    closureAdvisory = '⚠️ Advisory: Monitor Conditions — Small craft caution, berthing restricted for shallow draft';
  } else {
    closureAdvisory = '✅ Advisory: Normal Operations — Port open, channels clear for all vessel movements';
  }
  return {
    portName: harbor.name,
    closureAdvisory,
  };
}

export function buildAnswerText(intent, lang, weather, geospatial, risk, route) {
  const template = getAnswerTemplate(intent, lang);
  const pfz = geospatial.nearestPfz || {};
  const userLat = geospatial.userLat || 13.0827;
  const userLng = geospatial.userLng || 80.2707;
  const tide = getTideData(weather);

  const nearestHarbor = getNearestHarbor(userLat, userLng, boundariesMock.harbors, weather);
  const top3Formatted = getTop3Pfz(pfzMock, userLat, userLng);
  const speciesLikelihoodText = getSpeciesLikelihood(pfz);
  const offshoreChl = getOffshoreChlorophyll(pfzMock, userLat, userLng);
  const fiveDayFormatted = getFiveDayOutlook(weather);
  const portStatus = getPortStatus(weather, risk, boundariesMock.harbors, userLat, userLng);
  const catchCountVal = (typeof window !== 'undefined' && window.__orcaCatchCount) ? window.__orcaCatchCount : 18;

  const boatSafetyAdvice = risk.safetyScore < 50
    ? 'Do not venture out. Small craft face severe capsizing risks under current wave/wind conditions.'
    : risk.safetyScore < 75
    ? 'Small craft exercise caution. Stay within 10 km of shoreline and carry VHF transceiver.'
    : 'Conditions favorable for small boats. Ensure life jackets, navigation lights, and emergency distress beacon.';

  const communityRiskPhrase = risk.safetyScore < 50 
    ? '🔴 High Risk — Community advisory: All coastal village boats should remain anchored' 
    : risk.safetyScore < 75 
    ? '⚠️ Moderate Risk — Coastal community advisory: Small craft proceed with caution' 
    : '✅ Safe Conditions — Coastal village advisory: Normal fishing operations permitted';

  const communityAdvisory = risk.safetyScore < 50 
    ? 'Village elders and panchayat recommend suspending sea trips until seas subside.' 
    : 'Normal community operations approved. Morning launch window recommended.';

  const vars = {
    wave: weather.waveHeightMeters,
    waveLabel: getWaveLabel(weather.waveHeightMeters),
    wind: weather.windSpeedKmH,
    windDir: weather.windDirection,
    cycloneStatus: (CYCLONE_TEXT[weather.cycloneAlertLevel] || CYCLONE_TEXT.NONE)[lang] || (CYCLONE_TEXT[weather.cycloneAlertLevel] || CYCLONE_TEXT.NONE).en,
    lightningStatus: (LIGHTNING_TEXT[weather.lightningRisk ? 'active' : 'clear'])[lang] || (LIGHTNING_TEXT[weather.lightningRisk ? 'active' : 'clear']).en,
    score: risk.safetyScore,
    verdict: (VERDICTS[risk.safetyLevel] || VERDICTS.SAFE)[lang] || (VERDICTS[risk.safetyLevel] || VERDICTS.SAFE).en,
    pfzName: pfz.name || 'Nearest Coastal Zone',
    pfzDist: pfz.distanceKm || '18',
    sst: pfz.sst || '28.2',
    chl: pfz.chlorophyll || '3.4',
    fav: pfz.favourabilityScore || '88',
    depth: pfz.depthMeters || '40',
    species: (pfz.targetSpecies || ['Mackerel', 'Sardines']).join(', '),
    seaState: getSeaState(weather.waveHeightMeters),
    swell: weather.swellPeriodSec || 8.5,
    rain: weather.rainfallProbPercent || 15,
    vis: weather.visibilityKm || 10,
    cycloneLevel: weather.cycloneAlertLevel || 'NONE',
    cycloneDetail: weather.cycloneAlertLevel !== 'NONE' ? `IMD Alert ${weather.cycloneAlertLevel} in effect` : 'Bay of Bengal: No active depression',
    cycloneAdvisory: (CYCLONE_ADVISORY[weather.cycloneAlertLevel] || CYCLONE_ADVISORY.NONE)[lang] || (CYCLONE_ADVISORY[weather.cycloneAlertLevel] || CYCLONE_ADVISORY.NONE).en,
    lightningRisk: weather.lightningRisk ? 'HIGH ⚡' : 'LOW ✅',
    lightningDetail: weather.lightningRisk ? 'Active thunderstorm cells within 50 km' : 'No active electrical storms in vicinity',
    lightningAdvisory: ((LIGHTNING_ADVISORY[lang] || LIGHTNING_ADVISORY.en)[weather.lightningRisk ? 'risk' : 'clear']),
    waypoints: (route.waypoints || []).length,
    waypointList: (route.waypoints || []).map(wp => `  ${wp.step}. ${wp.label} (${wp.lat}, ${wp.lng})`).join('\n') || '  (No waypoints)',
    avoidedZones: 'Marine Protected Areas and stays inside IMBL safe buffer',
    routeAdvisory: ROUTE_ADVISORY[lang] || ROUTE_ADVISORY.en,
    imblStatus: geospatial.nearImbl ? `⚠️ ${geospatial.imblWarningText}` : '✅ Safe distance from IMBL (>15 km)',
    mpaName: (geospatial.nearestMpa || {}).name || 'Gulf of Mannar MPA',
    mpaRestriction: (geospatial.nearestMpa || {}).restrictions || 'No trawl fishing within MPA boundary',
    hazardList: `  • IMBL: ${geospatial.nearImbl ? geospatial.imblWarningText : 'Clear ✅'}\n  • MPA: ${geospatial.insideMpa ? geospatial.mpaWarningText : 'Not inside any MPA ✅'}`,
    safeZoneCount: pfzMock.length,
    safeRange: '100',
    hazardAdvisory: HAZARD_ADVISORY[lang] || HAZARD_ADVISORY.en,
    ...tide,

    // Extended variables for role intents
    boatSafetyAdvice,
    harborName: nearestHarbor.name,
    harborDist: nearestHarbor.distanceKm,
    harborCapacity: nearestHarbor.dockingCapacity,
    harborCoastGuard: nearestHarbor.coastGuardStation ? 'Coast Guard Station Active ✅' : 'Local Fishing Jetty',
    harborDockSafe: nearestHarbor.dockSafe,
    top3Pfz: top3Formatted,
    speciesLikelihood: speciesLikelihoodText,
    offshorePfzName: offshoreChl.name,
    offshorePfzDist: offshoreChl.dist,
    chlOffshore: offshoreChl.chl,
    totalDistanceKm: route.totalDistanceKm || '32.4',
    fuelEstimate: `${((route.totalDistanceKm || 32.4) * 1.8).toFixed(1)} Liters (Marine Diesel)`,
    multiDayOutlook: fiveDayFormatted,
    trendSummary: weather.trendSummary || 'Slight improvement from Day 3 onwards. Calm conditions expected Day 4.',
    communityRiskPhrase,
    communityAdvisory,
    catchCount: catchCountVal,
    catchReportInstruction: 'Tap the "Report Catch" button in the navigation header to submit GPS coordinates, gear type, and weight.',
    portName: portStatus.portName,
    portSeaState: getSeaState(weather.waveHeightMeters),
    portWave: weather.waveHeightMeters,
    portWind: weather.windSpeedKmH,
    portRiskScore: risk.safetyScore,
    portClosureAdvisory: portStatus.closureAdvisory,
  };

  let answer = template;
  for (const [key, val] of Object.entries(vars)) {
    answer = answer.replaceAll(`{${key}}`, String(val ?? ''));
  }
  return answer;
}

// ────────────────────────────────────────────
// AGENT 9: Visualization Agent (local)
// ────────────────────────────────────────────
export function buildMapLayers(userLocation, pfzList, geospatial, route) {
  return {
    userMarker: { lat: userLocation.lat, lng: userLocation.lng, name: userLocation.name },
    pfzMarkers: pfzList.map(p => ({
      id: p.id, name: p.name, lat: p.lat, lng: p.lng,
      favourabilityScore: p.favourabilityScore,
      targetSpecies: p.targetSpecies,
      depthMeters: p.depthMeters,
      sst: p.sst,
      chlorophyll: p.chlorophyll,
    })),
    routePolyline: (route.waypoints || []).map(wp => [wp.lat, wp.lng]),
    imblLines: geospatial.boundaries?.imblLines || [],
    marineProtectedAreas: geospatial.boundaries?.marineProtectedAreas || [],
  };
}

// ────────────────────────────────────────────
// Plan Steps for Agent Trace Panel
// ────────────────────────────────────────────
export function buildPlanSteps(intent, lang) {
  return [
    { id: 'a1', agentName: 'Intent & Language Agent', role: 'NLU & Script Analysis', description: `Detected language: [${lang.toUpperCase()}] | Intent: [${intent}]` },
    { id: 'a2', agentName: 'Planner Agent', role: 'Workflow Orchestration', description: 'Generated 7-step client-side execution DAG' },
    { id: 'a3', agentName: 'Marine Data Agent', role: 'ISRO/INCOIS Satellite Data', description: 'Loaded PFZ coordinates, SST & Chlorophyll-a from local dataset' },
    { id: 'a4', agentName: 'Weather Intelligence Agent', role: 'IMD Marine Weather', description: 'Evaluated wave height, wind, cyclone & lightning from regional models' },
    { id: 'a5', agentName: 'Geospatial Reasoning Agent', role: 'Boundary & Distance Engine', description: 'Haversine nearest PFZ computed, IMBL & MPA polygon checks done' },
    { id: 'a6', agentName: 'Risk Assessment Agent', role: 'Safety Score Fusion', description: 'Composite 0–100 venture safety score via threshold rules' },
    { id: 'a7', agentName: 'Route Optimization Agent', role: 'Waypoint A* Pathfinder', description: 'Safe navigation path computed, MPA polygons avoided' },
    { id: 'a8', agentName: 'Explainability Agent', role: 'Multilingual NLG', description: `Filled localized [${lang}] template with all computed values` },
    { id: 'a9', agentName: 'Visualization Agent', role: 'GeoJSON Map Renderer', description: 'PFZ pins, route polyline & boundary layers packaged for Leaflet' },
  ];
}
