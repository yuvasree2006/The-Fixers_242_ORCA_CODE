/**
 * Automated Verification Script for New Features:
 * 1. Admin Auth & Seeding
 * 2. Reports Table & CRUD Operations
 * 3. Survival Kit Agent & Severity Rules
 * 4. Coastal Regions & Foreign Waters Geofencing
 * 5. Nearby Vessels Fleet Catalog
 */

import db from './server/db.js';
import bcrypt from 'bcryptjs';
import {
  isDistressQuery,
  computeWaterGuidance,
  computeFoodGuidance,
  generateSurvivalGuidance,
  parseWaterLiters
} from './src/agents/survival-kit-agent.js';
import { COASTAL_REGIONS, FOREIGN_WATERS_ALERTS } from './src/utils/coastalRegions.js';
import nearbyShipsData from './data/nearby_ships_mock.json' with { type: 'json' };

async function runVerification() {
  console.log('===========================================================================');
  console.log('ORCA: NEW FEATURES AUTOMATED VERIFICATION SUITE');
  console.log('===========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. ADMIN USER IN SQLITE
  // ─────────────────────────────────────────────────────────────
  console.log('[1/5] VERIFYING ADMIN ACCOUNT IN SQLITE...');
  const adminUser = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@orca.demo');
  assert(adminUser !== undefined, 'Admin user (admin@orca.demo) exists in SQLite database');
  assert(adminUser.role === 'Admin', `Admin user has role: [${adminUser.role}]`);
  const passwordMatch = bcrypt.compareSync('Admin@123', adminUser.password_hash);
  assert(passwordMatch === true, 'Admin password matches bcrypt hash for Admin@123');

  // ─────────────────────────────────────────────────────────────
  // 2. SQLITE REPORTS TABLE & CRUD
  // ─────────────────────────────────────────────────────────────
  console.log('\n[2/5] VERIFYING SQLITE REPORTS TABLE & DATA STRUCTURE...');
  const reportsCount = db.prepare('SELECT COUNT(*) as count FROM reports').get();
  assert(reportsCount.count >= 3, `Reports table initialized with ${reportsCount.count} records`);

  // Insert a test report
  const insertStmt = db.prepare(`
    INSERT INTO reports (role, location, food_status, water_status, severity, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const testReportRes = insertStmt.run(
    'Fisherman',
    'Palk Bay Test Coordinates',
    'None',
    '0.5L',
    'HIGH',
    'Open',
    'Automated test distress dispatch'
  );
  assert(testReportRes.lastInsertRowid > 0, `Successfully inserted new report with ID #${testReportRes.lastInsertRowid}`);

  // Fetch report
  const fetchedReport = db.prepare('SELECT * FROM reports WHERE id = ?').get(testReportRes.lastInsertRowid);
  assert(fetchedReport.severity === 'HIGH', 'Report severity is HIGH');
  assert(fetchedReport.status === 'Open', 'Report initial status is Open');

  // Update report status
  db.prepare('UPDATE reports SET status = ? WHERE id = ?').run('Acknowledged', testReportRes.lastInsertRowid);
  const updatedReport = db.prepare('SELECT * FROM reports WHERE id = ?').get(testReportRes.lastInsertRowid);
  assert(updatedReport.status === 'Acknowledged', 'Report status successfully updated to Acknowledged');

  // ─────────────────────────────────────────────────────────────
  // 3. SURVIVAL KIT AGENT & STATE MACHINE LOGIC
  // ─────────────────────────────────────────────────────────────
  console.log('\n[3/5] VERIFYING SURVIVAL KIT DISTRESS LOGIC & THRESHOLDS...');

  // Multilingual distress keyword triggers
  assert(isDistressQuery('I got stuck in the shoals') === true, 'Distress query detected: "I got stuck in the shoals"');
  assert(isDistressQuery('help me I am stranded') === true, 'Distress query detected: "help me I am stranded"');
  assert(isDistressQuery('मैं फंस गया हूँ मदद करो') === true, 'Distress query detected in Hindi: "मैं फंस गया हूँ मदद करो"');
  assert(isDistressQuery('நான் மாட்டிக்கொண்டேன் காப்பாற்றுங்கள்') === true, 'Distress query detected in Tamil: "நான் மாட்டிக்கொண்டேன் காப்பாற்றுங்கள்"');
  assert(isDistressQuery('నేను చిక్కుకున్నాను కాపాడండి') === true, 'Distress query detected in Telugu: "నేను చిక్కుకున్నాను కాపాడండి"');
  assert(isDistressQuery('ഞാൻ കുടുങ്ങി ബോട്ട് കേടായി') === true, 'Distress query detected in Malayalam: "ഞാൻ കുടുങ്ങി ബോട്ട് കേടായി"');
  assert(isDistressQuery('আমি আটকে গেছি সাহায্য করুন') === true, 'Distress query detected in Bengali: "আমি আটকে গেছি সাহায্য করুন"');
  assert(isDistressQuery('Where is the nearest fishing zone?') === false, 'Standard PFZ query correctly identified as non-distress');

  // Water Thresholds
  const critWater = computeWaterGuidance('0.5 Litres left', 'en');
  assert(critWater.tier === 'CRITICAL', 'Water < 1L classified as CRITICAL rationing tier');
  const lowWater = computeWaterGuidance('1.5 Litres', 'en');
  assert(lowWater.tier === 'LOW', 'Water 1.5L classified as LOW tier (~250ml / 8h)');
  const modWater = computeWaterGuidance('3.5 Litres', 'en');
  assert(modWater.tier === 'MODERATE', 'Water 3.5L classified as MODERATE tier (~500ml / 6h)');
  const safeWater = computeWaterGuidance('10 Litres', 'en');
  assert(safeWater.tier === 'ADEQUATE', 'Water 10L classified as ADEQUATE tier (1L / 24h)');

  // Food Rationing
  const noFood = computeFoodGuidance('No food left', 'en');
  assert(noFood.isNone === true, 'Food empty correctly detected');

  // Severity rule calculation
  const highSev = (critWater.liters < 1.0 || noFood.isNone) ? 'HIGH' : 'MEDIUM';
  assert(highSev === 'HIGH', 'Severity computed as HIGH when water < 1L or food is zero');

  // Full guidance response generation
  const guidanceObj = await generateSurvivalGuidance({
    role: 'Fisherman',
    foodText: 'None',
    waterText: '0.5L',
    locationText: 'Chennai Harbour',
    lang: 'en'
  });
  assert(guidanceObj.severity === 'HIGH', 'Survival Kit generated guidance with HIGH severity');
  assert(guidanceObj.guidanceText.includes('ORCA EMERGENCY SURVIVAL PROTOCOL'), 'Guidance contains Emergency Protocol header');
  assert(guidanceObj.guidanceText.includes('Water Rationing'), 'Guidance contains water rationing section');
  assert(guidanceObj.guidanceText.includes('Shelter & Sea Survival'), 'Guidance contains shelter instructions');

  // ─────────────────────────────────────────────────────────────
  // 4. COASTAL REGIONS & FOREIGN WATERS GEOFENCING
  // ─────────────────────────────────────────────────────────────
  console.log('\n[4/5] VERIFYING COASTAL REGIONS & GEOFENCING RULES...');
  const indianRegions = COASTAL_REGIONS.filter(r => r.isIndianRegion);
  const foreignRegions = COASTAL_REGIONS.filter(r => !r.isIndianRegion);

  assert(indianRegions.length >= 5, `Found ${indianRegions.length} Indian coastal regions (Chennai, Kochi, Vizag, Mumbai, Kolkata)`);
  assert(foreignRegions.length >= 5, `Found ${foreignRegions.length} Foreign coastal regions (Colombo, Chittagong, Karachi, Malé, Yangon)`);

  const chennaiReg = COASTAL_REGIONS.find(r => r.id === 'chennai');
  assert(chennaiReg.isIndianRegion === true, 'Chennai is flagged with isIndianRegion: true');

  const colomboReg = COASTAL_REGIONS.find(r => r.id === 'colombo');
  assert(colomboReg.isIndianRegion === false, 'Colombo is flagged with isIndianRegion: false');

  const karachiReg = COASTAL_REGIONS.find(r => r.id === 'karachi');
  assert(karachiReg.isIndianRegion === false, 'Karachi is flagged with isIndianRegion: false');

  // Foreign Alerts translations
  const enAlert = FOREIGN_WATERS_ALERTS.en;
  const hiAlert = FOREIGN_WATERS_ALERTS.hi;
  const taAlert = FOREIGN_WATERS_ALERTS.ta;
  assert(enAlert.title.includes('Foreign Maritime Zone'), 'English foreign alert present');
  assert(hiAlert.title.includes('विदेशी समुद्री क्षेत्र'), 'Hindi foreign alert present');
  assert(taAlert.title.includes('வெளிநாட்டு கடல் மண்டலம்'), 'Tamil foreign alert present');

  // ─────────────────────────────────────────────────────────────
  // 5. NEARBY SHIPS FLEET CATALOG
  // ─────────────────────────────────────────────────────────────
  console.log('\n[5/5] VERIFYING NEARBY SHIPS SIMULATION DATASET...');
  const regionsCovered = Object.keys(nearbyShipsData.regions);
  assert(regionsCovered.includes('Chennai'), 'Chennai vessel fleet exists');
  assert(regionsCovered.includes('Kochi'), 'Kochi vessel fleet exists');
  assert(regionsCovered.includes('Visakhapatnam'), 'Visakhapatnam vessel fleet exists');
  assert(regionsCovered.includes('Mumbai'), 'Mumbai vessel fleet exists');
  assert(regionsCovered.includes('Kolkata'), 'Kolkata vessel fleet exists');
  assert(regionsCovered.includes('Colombo'), 'Colombo vessel fleet exists');
  assert(regionsCovered.includes('Chittagong'), 'Chittagong vessel fleet exists');
  assert(regionsCovered.includes('Karachi'), 'Karachi vessel fleet exists');

  const chennaiVessels = nearbyShipsData.regions['Chennai'];
  assert(chennaiVessels.length === 10, `Chennai has ${chennaiVessels.length} mock vessels`);
  const sampleVessel = chennaiVessels[0];
  assert(sampleVessel.name !== undefined && sampleVessel.type !== undefined, 'Vessel contains name and type');
  assert(sampleVessel.distanceKm !== undefined && sampleVessel.heading !== undefined, 'Vessel contains distanceKm and heading');
  assert(sampleVessel.lat !== undefined && sampleVessel.lng !== undefined, 'Vessel contains geospatial lat/lng coordinates');

  console.log('\n===========================================================================');
  console.log(`🎉 ALL ${passed}/${total} NEW FEATURE VERIFICATION TESTS PASSED (100% SUCCESS)!`);
  console.log('===========================================================================');
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
