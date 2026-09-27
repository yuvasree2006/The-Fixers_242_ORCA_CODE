import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'orca.db');

// Ensure database file directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite database connection
const db = new Database(dbPath);

// Enable WAL mode for high concurrency & performance
db.pragma('journal_mode = WAL');

// Initialize SQLite database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'Captain / Fisherman',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_type TEXT DEFAULT 'Distress', -- 'Distress' | 'Medical'
    role TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    location TEXT NOT NULL,
    food_status TEXT,
    water_status TEXT,
    severity TEXT NOT NULL, -- 'HIGH' | 'MEDIUM' | 'LOW'
    status TEXT DEFAULT 'Open', -- 'Open' | 'Acknowledged' | 'Resolved'
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS catches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_role TEXT DEFAULT 'Fisherman',
    species TEXT NOT NULL,
    quantities TEXT NOT NULL,
    location TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    profit_loss_status TEXT DEFAULT 'Profit', -- 'Profit' | 'Loss' | 'Break-even'
    notes TEXT
  );
`);

// Migration: Ensure report_type column exists on older db files if created prior
try {
  const tableInfo = db.prepare("PRAGMA table_info(reports)").all();
  const hasReportType = tableInfo.some(col => col.name === 'report_type');
  if (!hasReportType) {
    db.exec("ALTER TABLE reports ADD COLUMN report_type TEXT DEFAULT 'Distress'");
    console.log("🛠️ Migrated reports table: added report_type column");
  }
} catch (e) {
  console.warn("Migration check note:", e.message);
}

// ─────────────────────────────────────────────────────────
//  Auto-seed 6 demo accounts (idempotent — runs on every
//  startup but inserts ONLY if the email doesn't exist yet)
// ─────────────────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  { name: 'Demo Fisherman', email: 'fisherman@orca.demo', password: 'Fisher@123', role: 'Fisherman' },
  { name: 'Demo Commercial Operator', email: 'commercial@orca.demo', password: 'Commercial@123', role: 'Commercial Operator' },
  { name: 'Demo Society Representative', email: 'society@orca.demo', password: 'Society@123', role: 'Society / Coastal Fisherman' },
  { name: 'Demo Port Authority Officer', email: 'port@orca.demo', password: 'PortAuth@123', role: 'Port Authority' },
  { name: 'Demo Admin Officer', email: 'admin@orca.demo', password: 'Admin@123', role: 'Admin' },
  { name: 'Demo Guardian Officer', email: 'guardian@orca.demo', password: 'Guardian@123', role: 'Guardian' },
];

const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
const insertStmt = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');

const seedDemoAccounts = db.transaction(() => {
  let seeded = 0;
  for (const acct of DEMO_ACCOUNTS) {
    const existing = checkStmt.get(acct.email);
    if (!existing) {
      const hash = bcrypt.hashSync(acct.password, 10);
      insertStmt.run(acct.name, acct.email, hash, acct.role);
      seeded++;
    }
  }
  if (seeded > 0) {
    console.log(`🌱 Seeded ${seeded} demo account(s) into SQLite`);
  }
});

seedDemoAccounts();

// Seed initial reports if empty
const countReports = db.prepare('SELECT COUNT(*) as count FROM reports').get();
if (countReports.count === 0) {
  const insertReport = db.prepare(`
    INSERT INTO reports (report_type, role, location, food_status, water_status, severity, status, notes, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialReports = [
    {
      report_type: 'Distress',
      role: 'Fisherman',
      location: 'Palk Strait / Point Calimere (10.2°N, 79.9°E)',
      food_status: 'No food remaining',
      water_status: '0.5 Litres left',
      severity: 'HIGH',
      status: 'Open',
      notes: 'Engine seized 14 NM offshore. Drifting South towards international boundary.',
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
    },
    {
      report_type: 'Distress',
      role: 'Commercial Operator',
      location: 'Visakhapatnam Deep Sea (17.4°N, 83.6°E)',
      food_status: '3 days rations',
      water_status: '12 Litres',
      severity: 'MEDIUM',
      status: 'Acknowledged',
      notes: 'Rudder malfunction in moderate swell. Awaiting support tug.',
      timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString()
    },
    {
      report_type: 'Medical',
      role: 'Fisherman',
      location: 'Rameswaram Offshore (9.3°N, 79.3°E)',
      food_status: 'Standard',
      water_status: '3 Litres',
      severity: 'HIGH',
      status: 'Open',
      notes: 'Medical Emergency: Crew member suffered severe seizure. Immediate medical evacuation requested.',
      timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString()
    },
    {
      report_type: 'Distress',
      role: 'Society / Coastal Fisherman',
      location: 'Kochi Offshore Shoals (9.8°N, 76.1°E)',
      food_status: '1 day supplies',
      water_status: '4 Litres',
      severity: 'LOW',
      status: 'Resolved',
      notes: 'Submerged gillnet snag reported and cleared. Safe anchorage reached.',
      timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString()
    }
  ];

  for (const r of initialReports) {
    insertReport.run(r.report_type || 'Distress', r.role, r.location, r.food_status, r.water_status, r.severity, r.status, r.notes, r.timestamp);
  }
  console.log('📋 Seeded initial demonstration incident reports into SQLite');
}

// Seed initial catches if empty
const countCatches = db.prepare('SELECT COUNT(*) as count FROM catches').get();
if (countCatches.count === 0) {
  const insertCatch = db.prepare(`
    INSERT INTO catches (user_role, species, quantities, location, timestamp, profit_loss_status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const initialCatches = [
    {
      user_role: 'Fisherman',
      species: 'Indian Mackerel, Oil Sardines',
      quantities: '45 kg, 80 kg',
      location: 'Chennai Coast (13.08°N, 80.29°E)',
      timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      profit_loss_status: 'Profit',
      notes: 'High haul near PFZ Thermal Front.'
    },
    {
      user_role: 'Fisherman',
      species: 'King Seer Fish, Tiger Prawns',
      quantities: '20 kg, 15 kg',
      location: 'Palk Bay / Rameswaram (9.28°N, 79.31°E)',
      timestamp: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      profit_loss_status: 'Profit',
      notes: 'Calm morning voyage.'
    },
    {
      user_role: 'Commercial Operator',
      species: 'Skipjack Tuna',
      quantities: '120 kg',
      location: 'Visakhapatnam Deep Sea (17.68°N, 83.29°E)',
      timestamp: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
      profit_loss_status: 'Break-even',
      notes: 'Higher diesel consumption due to swell.'
    }
  ];

  for (const c of initialCatches) {
    insertCatch.run(c.user_role, c.species, c.quantities, c.location, c.timestamp, c.profit_loss_status, c.notes);
  }
  console.log('🐟 Seeded initial sample catch logs into SQLite');
}

console.log(`📁 Local SQLite database initialized at: ${dbPath}`);

export default db;
