/**
 * AGENT 8: Explainability Agent
 * Translates multi-agent quantitative calculations into a structured, localized reasoning card & spoken response string.
 */
export function generateExplainabilityReport(intentResult, weather, geospatial, risk, route) {
  const dict = intentResult?.dict || intentResult?.dictionary || {};
  const detectedIntent = intentResult?.detectedIntent || 'SAFETY_CHECK';
  const templates = dict.templates || {};

  const nearestPfz = geospatial.nearestPfz || { name: "Coastal Fishing Spot", distanceKm: 15, chlorophyll: 3.2, sst: 28.0, favourabilityScore: 85, targetSpecies: ["Mackerel"] };
  const targetSpeciesText = Array.isArray(nearestPfz.targetSpecies) ? nearestPfz.targetSpecies.join(", ") : "Local coastal fish";

  let recommendationText = templates.safeVerdict;
  if (risk.safetyLevel === "DANGER") recommendationText = templates.dangerVerdict;
  else if (risk.safetyLevel === "CAUTION") recommendationText = templates.cautionVerdict;

  const cycloneText = weather.cycloneAlertLevel !== "NONE" ? `[Cyclone Alert: ${weather.cycloneAlertLevel}]` : "No cyclone alert.";
  const lightningText = weather.lightningRisk ? "[Lightning warning active]" : "Clear sky conditions.";
  const imblWarning = geospatial.imblWarningText ? `[${geospatial.imblWarningText}]` : "";

  let templateString = templates.safetyCheckResponse || "Marine Safety Assessment: Safety Score {safetyScore}/100. Wave height {waveHeight}m, wind {windSpeed} km/h. Verdict: {recommendation}";
  if (detectedIntent === "NEAREST_PFZ") templateString = templates.nearestPfzResponse || templateString;
  else if (detectedIntent === "WEATHER_ALERT") templateString = templates.weatherAlertResponse || templateString;
  else if (detectedIntent === "SAFE_ROUTE") templateString = templates.safeRouteResponse || templateString;

  // Perform dynamic placeholder substitution
  const responseText = templateString
    .replace('{safetyScore}', risk.safetyScore)
    .replace('{safetyLevel}', risk.safetyLevel)
    .replace('{waveHeight}', weather.waveHeightMeters)
    .replace('{windSpeed}', weather.windSpeedKmH)
    .replace('{windDirection}', weather.windDirection)
    .replace('{cycloneText}', cycloneText)
    .replace('{lightningText}', lightningText)
    .replace('{imblWarning}', imblWarning)
    .replace('{recommendation}', recommendationText)
    .replace('{pfzName}', nearestPfz.name)
    .replace('{nearestPfzDist}', nearestPfz.distanceKm)
    .replace('{chlorophyll}', nearestPfz.chlorophyll)
    .replace('{sst}', nearestPfz.sst)
    .replace('{favourability}', nearestPfz.favourabilityScore)
    .replace('{targetSpecies}', targetSpeciesText)
    .replace('{cycloneAlertLevel}', weather.cycloneAlertLevel)
    .replace('{lightningRiskText}', weather.lightningRisk ? "High" : "Low")
    .replace('{waypointCount}', (route.waypoints || []).length);

  // Reasoning bullet points for card
  const reasoningBullets = [
    `Sea State: Wave height ${weather.waveHeightMeters}m (${weather.waveHeightMeters > 2.0 ? 'High' : 'Normal'}) | Wind ${weather.windSpeedKmH} km/h`,
    `Satellite Metrics: SST ${nearestPfz.sst}°C | Chlorophyll ${nearestPfz.chlorophyll} mg/m³`,
    `PFZ Favourability: ${nearestPfz.favourabilityScore}% score for ${nearestPfz.name} (${nearestPfz.distanceKm} km away)`,
    `Geospatial Warnings: ${geospatial.imblWarningText || geospatial.mpaWarningText || 'Clear of restricted polygons & IMBL line'}`
  ];

  if (risk.deductions.length > 0) {
    reasoningBullets.push(`Risk Factors: ${risk.deductions.join(" | ")}`);
  }

  return {
    responseText,
    reasoningBullets,
    recommendationText,
    safetyScore: risk.safetyScore,
    safetyLevel: risk.safetyLevel
  };
}
