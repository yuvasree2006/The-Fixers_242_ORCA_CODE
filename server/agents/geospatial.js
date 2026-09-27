import fs from 'fs';
import path from 'path';

/**
 * AGENT 5: Geospatial Reasoning Agent
 * Computes Haversine distances, finds nearest PFZs, checks IMBL proximity & MPA polygon intersections.
 */

let boundariesCache = null;

function loadBoundaries() {
  if (!boundariesCache) {
    const filePath = path.join(process.cwd(), 'data', 'boundaries_mock.json');
    if (fs.existsSync(filePath)) {
      boundariesCache = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } else {
      boundariesCache = { imblLines: [], marineProtectedAreas: [] };
    }
  }
  return boundariesCache;
}

// Haversine Distance Formula (in Kilometers)
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(1);
}

// Point-in-Polygon ray-casting algorithm for MPA checks
export function isPointInPolygon(point, polygonCoords) {
  const [x, y] = point; // [lat, lng]
  let inside = false;
  for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
    const xi = polygonCoords[i][0], yi = polygonCoords[i][1];
    const xj = polygonCoords[j][0], yj = polygonCoords[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function performGeospatialAnalysis(userLat, userLng, pfzList) {
  const boundaries = loadBoundaries();
  
  // 1. Find Nearest PFZ
  let nearestPfz = null;
  let minDistance = Infinity;

  for (const pfz of pfzList) {
    const dist = haversineDistanceKm(userLat, userLng, pfz.lat, pfz.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestPfz = { ...pfz, distanceKm: dist };
    }
  }

  // 2. Check IMBL Proximity (if near Sri Lanka / Pak borders)
  let nearImbl = false;
  let imblWarningText = null;
  for (const line of boundaries.imblLines || []) {
    for (const pt of line.coordinates) {
      const distToPt = haversineDistanceKm(userLat, userLng, pt[0], pt[1]);
      if (distToPt < 15.0) {
        nearImbl = true;
        imblWarningText = `CAUTION: Within ${distToPt} km of ${line.name}. Maintain safe distance!`;
        break;
      }
    }
  }

  // 3. Check MPA Proximity
  let insideMpa = false;
  let mpaWarningText = null;
  for (const mpa of boundaries.marineProtectedAreas || []) {
    if (isPointInPolygon([userLat, userLng], mpa.coordinates)) {
      insideMpa = true;
      mpaWarningText = `RESTRICTION: Currently inside ${mpa.name}. ${mpa.restrictions}`;
      break;
    }
  }

  return {
    nearestPfz,
    nearImbl,
    imblWarningText,
    insideMpa,
    mpaWarningText,
    boundaries
  };
}
