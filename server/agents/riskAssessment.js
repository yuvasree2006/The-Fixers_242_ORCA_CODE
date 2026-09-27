/**
 * AGENT 6: Risk Assessment Agent
 * Fuses multi-domain physical factors into a transparent, composite 0–100 Venture Safety Score.
 * 
 * RISK EVALUATION RULES & THRESHOLDS (Documented for transparency):
 * 1. Base Score = 100
 * 2. Wave Height Penalties:
 *    - Wave > 3.0m: -45 pts (HIGH DANGER)
 *    - Wave 2.0m - 3.0m: -25 pts (MODERATE CAUTION)
 *    - Wave 1.5m - 2.0m: -10 pts (SLIGHT SWELL)
 * 3. Wind Speed Penalties:
 *    - Wind > 40 km/h: -35 pts
 *    - Wind 25 - 40 km/h: -20 pts
 *    - Wind 15 - 25 km/h: -5 pts
 * 4. Cyclone Alert Penalties:
 *    - WARNING / SEVERE: -60 pts (IMMEDIATE NO-GO)
 *    - WATCH: -30 pts
 * 5. Lightning Risk:
 *    - Active Lightning: -20 pts
 * 6. Border / Restricted Area Penalty:
 *    - Inside MPA or Near IMBL: -15 pts
 */
export function calculateVentureSafety(weather, geospatial) {
  let score = 100;
  const deductions = [];

  // Wave height penalty
  if (weather.waveHeightMeters > 3.0) {
    score -= 45;
    deductions.push(`Heavy wave swells (${weather.waveHeightMeters}m > 3.0m): -45 pts`);
  } else if (weather.waveHeightMeters >= 2.0) {
    score -= 25;
    deductions.push(`Moderate waves (${weather.waveHeightMeters}m): -25 pts`);
  } else if (weather.waveHeightMeters >= 1.5) {
    score -= 10;
    deductions.push(`Minor swell (${weather.waveHeightMeters}m): -10 pts`);
  }

  // Wind speed penalty
  if (weather.windSpeedKmH > 40.0) {
    score -= 35;
    deductions.push(`High wind gusts (${weather.windSpeedKmH} km/h > 40 km/h): -35 pts`);
  } else if (weather.windSpeedKmH >= 25.0) {
    score -= 20;
    deductions.push(`Breezy wind condition (${weather.windSpeedKmH} km/h): -20 pts`);
  } else if (weather.windSpeedKmH >= 15.0) {
    score -= 5;
    deductions.push(`Light wind (${weather.windSpeedKmH} km/h): -5 pts`);
  }

  // Cyclone alert penalty
  if (weather.cycloneAlertLevel === "WARNING" || weather.cycloneAlertLevel === "SEVERE") {
    score -= 60;
    deductions.push(`IMD Cyclone Warning Active (${weather.cycloneAlertLevel}): -60 pts`);
  } else if (weather.cycloneAlertLevel === "WATCH") {
    score -= 30;
    deductions.push(`Cyclone Watch Advisory: -30 pts`);
  }

  // Lightning risk penalty
  if (weather.lightningRisk) {
    score -= 20;
    deductions.push(`Active lightning strikes predicted: -20 pts`);
  }

  // Boundary proximity penalty
  if (geospatial.nearImbl) {
    score -= 15;
    deductions.push(`Proximity to International Maritime Boundary Line (IMBL): -15 pts`);
  }
  if (geospatial.insideMpa) {
    score -= 20;
    deductions.push(`Inside Marine Protected Area (MPA) restriction zone: -20 pts`);
  }

  const finalScore = Math.max(0, Math.min(100, score));

  let safetyLevel = "SAFE";
  if (finalScore < 50) safetyLevel = "DANGER";
  else if (finalScore < 75) safetyLevel = "CAUTION";

  return {
    safetyScore: finalScore,
    safetyLevel,
    deductions
  };
}
