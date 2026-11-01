import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query, isUsingPostgres, getMemoryStore } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'finflow-secure-jwt-secret-key-2026-production-ready';

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      currency: user.currency || 'USD',
      role: user.role || 'ROLE_USER',
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export async function authenticate(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Full authentication is required to access this resource');
    error.status = 401;
    throw error;
  }

  const token = authHeader.substring(7);
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    const error = new Error('Invalid or expired authentication token');
    error.status = 401;
    throw error;
  }

  if (isUsingPostgres()) {
    const res = await query('SELECT id, name, email, currency, role FROM users WHERE id = $1', [decoded.id]);
    if (!res || res.rows.length === 0) {
      const error = new Error('User not found');
      error.status = 401;
      throw error;
    }
    return res.rows[0];
  } else {
    const store = getMemoryStore();
    let user = store.users.find((u) => u.id === decoded.id);
    if (!user) {
      user = {
        id: decoded.id,
        name: decoded.name || 'User',
        email: decoded.email,
        currency: decoded.currency || 'USD',
        role: decoded.role || 'ROLE_USER',
      };
      store.users.push(user);
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      role: user.role,
    };
  }
}

export function sendResponse(res, status, success, message, data = null) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json({
    success,
    message,
    data,
  });
}
