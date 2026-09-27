import express from 'express';
import { detectAndParseIntent } from './agents/language-agent.js';
import { buildExecutionPlan } from './agents/planner.js';
import { getPfzData, updatePfzFavourability } from './agents/marineData.js';
import { getWeatherForLocation } from './agents/weatherIntel.js';
import { performGeospatialAnalysis } from './agents/geospatial.js';
import { calculateVentureSafety } from './agents/riskAssessment.js';
import { generateSafeRoute } from './agents/routeOptimization.js';
import { generateExplainabilityReport } from './agents/explainability.js';
import { buildVisualizationLayers } from './agents/visualization.js';
import { updateSession } from './agents/memoryContext.js';
import db from './db.js';
import authRouter from './auth.js';

const router = express.Router();

// Authentication Routes
router.use('/auth', authRouter);

// Reports Management Endpoints (SQLite-backed)
router.get('/reports', (req, res) => {
  try {
    const reports = db.prepare('SELECT * FROM reports ORDER BY id DESC').all();
    res.json({ success: true, reports });
  } catch (err) {
    console.error('Failed to fetch reports:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/reports', (req, res) => {
  try {
    const { report_type, role, location, food_status, water_status, severity, status, notes } = req.body;
    const stmt = db.prepare(`
      INSERT INTO reports (report_type, role, location, food_status, water_status, severity, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      report_type || 'Distress',
      role || 'Fisherman',
      location || 'Unknown Coastal Location',
      food_status || 'Unspecified',
      water_status || 'Unspecified',
      severity || 'MEDIUM',
      status || 'Open',
      notes || ''
    );
    const newReport = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, report: newReport });
  } catch (err) {
    console.error('Failed to create report:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Catch Log Management Endpoints (SQLite-backed)
router.get('/catches', (req, res) => {
  try {
    const catches = db.prepare('SELECT * FROM catches ORDER BY id DESC').all();
    res.json({ success: true, catches });
  } catch (err) {
    console.error('Failed to fetch catches:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/catches', (req, res) => {
  try {
    const { user_role, species, quantities, location, timestamp, profit_loss_status, notes } = req.body;
    const stmt = db.prepare(`
      INSERT INTO catches (user_role, species, quantities, location, timestamp, profit_loss_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      user_role || 'Fisherman',
      species || 'Mixed Catch',
      quantities || 'Unspecified',
      location || 'Coastal Waters',
      timestamp || new Date().toISOString(),
      profit_loss_status || 'Profit',
      notes || ''
    );
    const newCatch = db.prepare('SELECT * FROM catches WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, catch: newCatch });
  } catch (err) {
    console.error('Failed to save catch log:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/reports/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const existing = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    const updatedStatus = status !== undefined ? status : existing.status;
    const updatedNotes = notes !== undefined ? notes : existing.notes;
    
    db.prepare('UPDATE reports SET status = ?, notes = ? WHERE id = ?').run(updatedStatus, updatedNotes, id);
    const updated = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
    res.json({ success: true, report: updated });
  } catch (err) {
    console.error('Failed to update report:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: "OK", system: "ORCA Marine Intelligence Server", timestamp: new Date().toISOString() });
});

// GET all PFZ dataset
router.get('/pfz', (req, res) => {
  const data = getPfzData();
  res.json({ success: true, data });
});

// GET weather dataset for location
router.get('/weather', (req, res) => {
  const lat = parseFloat(req.query.lat) || 13.0827;
  const lng = parseFloat(req.query.lng) || 80.2707;
  const weather = getWeatherForLocation(lat, lng);
  res.json({ success: true, weather });
});

// POST Crowdsourced Catch Report
router.post('/report-catch', (req, res) => {
  const { species, quantityKg, lat, lng, pfzId, langCode } = req.body;
  
  if (pfzId) {
    updatePfzFavourability(pfzId, 5);
  }

  // Load language dict for confirmation message
  const intentRes = detectAndParseIntent("report catch", langCode);
  const dict = intentRes.dictionary;
  const template = dict.templates?.catchReportSuccess || "Catch logged successfully!";
  const confirmMessage = template
    .replace('{quantityKg}', quantityKg || 50)
    .replace('{species}', species || 'Fish')
    .replace('{lat}', lat ? (+lat).toFixed(2) : '13.08')
    .replace('{lng}', lng ? (+lng).toFixed(2) : '80.45');

  res.json({
    success: true,
    message: confirmMessage,
    updatedPfzData: getPfzData()
  });
});

// MAIN MULTI-AGENT ORCHESTRATION PIPELINE API
router.post('/chat', (req, res) => {
  try {
    const { queryText, langCode, userLocation, sessionId } = req.body;
    const currentLocation = userLocation || { lat: 13.0827, lng: 80.2707, name: "Chennai Coast" };

    // STEP 1: Intent & Language Agent
    const intentResult = detectAndParseIntent(queryText, langCode, currentLocation);

    // STEP 2: Planner Agent
    const planSteps = buildExecutionPlan(intentResult);

    // STEP 3: Marine Data Agent
    const pfzList = getPfzData();

    // STEP 4: Weather Intelligence Agent
    const weather = getWeatherForLocation(currentLocation.lat, currentLocation.lng, intentResult.entities.targetTime);

    // STEP 5: Geospatial Reasoning Agent
    const geospatial = performGeospatialAnalysis(currentLocation.lat, currentLocation.lng, pfzList);

    // STEP 6: Risk Assessment Agent
    const risk = calculateVentureSafety(weather, geospatial);

    // STEP 7: Route Optimization Agent
    const route = generateSafeRoute(currentLocation.lat, currentLocation.lng, geospatial.nearestPfz, geospatial.boundaries);

    // STEP 8: Explainability Agent (NLG)
    const explainability = generateExplainabilityReport(intentResult, weather, geospatial, risk, route);

    // STEP 9: Visualization Agent (GeoJSON formatting)
    const mapLayers = buildVisualizationLayers(currentLocation, pfzList, geospatial, route);

    // STEP 10: Memory & Context Agent
    updateSession(sessionId || "default-session", queryText, intentResult.langCode, currentLocation, explainability);

    res.json({
      success: true,
      langCode: intentResult.langCode,
      intent: intentResult.detectedIntent,
      planSteps,
      weather,
      geospatial,
      risk,
      route,
      explainability,
      mapLayers
    });
  } catch (err) {
    console.error("Multi-Agent Pipeline Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
