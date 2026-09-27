import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'orca_isro_hackathon_jwt_secret_9e8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0';

/**
 * Middleware: Verify Bearer JWT Token
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, error: 'Invalid or expired session token' });
    }
    req.user = decoded;
    next();
  });
}

/**
 * POST /api/auth/signup
 * Accepts name, email, password. Hashes password with bcrypt.
 */
router.post('/signup', (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const userRole = role?.trim() || 'Captain / Fisherman';

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    // Hash password with bcrypt (salt rounds: 10)
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Insert user into SQLite
    const insertStmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);
    const result = insertStmt.run(cleanName, cleanEmail, passwordHash, userRole);

    const newUser = {
      id: result.lastInsertRowid,
      name: cleanName,
      email: cleanEmail,
      role: userRole
    };

    // Sign JWT
    const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during registration' });
  }
});

/**
 * POST /api/auth/login
 * Verifies email and hashed password. Returns generic error on failure.
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query user by email
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    // Generic error message for both non-existent user and incorrect password
    const genericAuthError = 'Invalid email or password';

    if (!user) {
      return res.status(401).json({ success: false, error: genericAuthError });
    }

    // Verify bcrypt hash
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: genericAuthError });
    }

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Sign JWT
    const token = jwt.sign(userProfile, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userProfile
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during login' });
  }
});

/**
 * GET /api/auth/me
 * Returns current user's profile from token. Used by frontend route guard.
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User session expired or not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('/auth/me error:', err);
    res.status(500).json({ success: false, error: 'Internal server error verifying session' });
  }
});

/**
 * POST /api/auth/logout
 * Standard logout endpoint for completeness.
 */
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
