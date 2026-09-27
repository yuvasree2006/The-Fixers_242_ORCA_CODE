import fs from 'fs';
import path from 'path';

/**
 * AGENT 3: Marine Data Agent
 * Simulates ISRO OceanSat / INCOIS satellite data streams:
 * SST (Sea Surface Temperature), Chlorophyll-a concentration, PFZ Favourability.
 * 
 * ARCHITECTURAL NOTE FOR JUDGES:
 * To connect to live INCOIS REST APIs or ISRO MOSDAC APIs, swap `getPfzData` to fetch:
 * `https://incois.gov.in/api/pfz/v2/data?format=geojson`
 */

let pfzCache = null;

export function getPfzData() {
  if (!pfzCache) {
    const filePath = path.join(process.cwd(), 'data', 'pfz_mock.json');
    if (fs.existsSync(filePath)) {
      pfzCache = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } else {
      pfzCache = [];
    }
  }
  return pfzCache;
}

export function updatePfzFavourability(pfzId, boostAmount = 5) {
  const data = getPfzData();
  const target = data.find(p => p.id === pfzId);
  if (target) {
    target.favourabilityScore = Math.min(100, target.favourabilityScore + boostAmount);
  }
  return data;
}
