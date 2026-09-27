/**
 * Automated test script for SQLite + JWT + bcrypt authentication
 */

import db from './server/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

console.log('Testing Database and Auth logic...');

// 1. Clean test table or verify table
const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
if (!tableInfo) {
  console.error('❌ users table not found');
  process.exit(1);
}
console.log('✅ users table verified');

// 2. Test user creation
const testEmail = `test_${Date.now()}@marine.in`;
const salt = bcrypt.genSaltSync(10);
const passwordHash = bcrypt.hashSync('securePass123', salt);

const insert = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
const res = insert.run('Test Captain', testEmail, passwordHash, 'Captain');

console.log('✅ User inserted with ID:', res.lastInsertRowid);

// 3. Test duplicate rejection
try {
  insert.run('Test Captain 2', testEmail, passwordHash, 'Captain');
  console.error('❌ Expected duplicate error, but succeeded');
  process.exit(1);
} catch (err) {
  console.log('✅ Duplicate email correctly blocked by SQLite UNIQUE constraint');
}

// 4. Test password verification
const user = db.prepare('SELECT * FROM users WHERE email = ?').get(testEmail);
const valid = bcrypt.compareSync('securePass123', user.password_hash);
const invalid = bcrypt.compareSync('wrongPass', user.password_hash);

if (valid && !invalid) {
  console.log('✅ Password hash verification working properly (valid: true, invalid: false)');
} else {
  console.error('❌ Password verification failed');
  process.exit(1);
}

// 5. Test JWT signing & verification
const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
const decoded = jwt.verify(token, JWT_SECRET);
if (decoded.email === testEmail) {
  console.log('✅ JWT sign and verify working properly');
} else {
  console.error('❌ JWT verification failed');
  process.exit(1);
}

console.log('🎉 ALL AUTH UNIT TESTS PASSED!');
