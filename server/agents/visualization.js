/**
 * AGENT 9: Visualization Agent
 * Packages multi-agent spatial results into ready-to-render map layers for Leaflet
 */
export function buildVisualizationLayers(userLocation, pfzList, geospatial, route) {
  const pfzMarkers = pfzList.map(p => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    favourabilityScore: p.favourabilityScore,
    targetSpecies: p.targetSpecies,
    depthMeters: p.depthMeters,
    color: p.favourabilityScore >= 90 ? '#10b981' : (p.favourabilityScore >= 80 ? '#f59e0b' : '#ef4444')
  }));

  const routePolyline = (route.waypoints || []).map(wp => [wp.lat, wp.lng]);

  return {
    userMarker: {
      lat: userLocation.lat,
      lng: userLocation.lng,
      name: userLocation.name || "Your Current Vessel Location"
    },
    pfzMarkers,
    routePolyline,
    imblLines: geospatial.boundaries?.imblLines || [],
    marineProtectedAreas: geospatial.boundaries?.marineProtectedAreas || []
  };
}
