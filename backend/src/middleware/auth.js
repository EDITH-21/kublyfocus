/**
 * Knolect Authentication & Authorization Middleware
 */

const crypto = require('crypto');
const { UserModel } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'knolect_master_secret_key_2026';

function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (req.cookies ? req.cookies.token : null);

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session token' });
  }

  const user = await UserModel.findById(payload.id);
  if (!user || user.status !== 'active') {
    return res.status(401).json({ success: false, error: 'Account not active or found' });
  }

  req.user = user;
  next();
}

async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (req.cookies ? req.cookies.token : null);

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session token' });
  }

  const user = await UserModel.findById(payload.id);
  if (!user || user.status !== 'active') {
    return res.status(401).json({ success: false, error: 'Account not active or found' });
  }

  req.user = user;
  if (user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access denied: Admin role required' });
  }

  next();
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (token) {
    const payload = verifyToken(token);
    if (payload && payload.id) {
      req.userId = payload.id;
    }
  }
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  requireAuth,
  requireAdmin,
  optionalAuth
};
