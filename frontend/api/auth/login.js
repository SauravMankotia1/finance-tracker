import { query, isUsingPostgres, getMemoryStore } from '../_lib/db.js';
import { comparePassword, generateToken, sendResponse } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendResponse(res, 405, false, 'Method not allowed');
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return sendResponse(res, 400, false, 'Email and password are required');
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = null;

    if (isUsingPostgres()) {
      const result = await query(
        'SELECT id, name, email, password, currency, role FROM users WHERE LOWER(email) = $1',
        [cleanEmail]
      );
      if (result.rows.length === 0) {
        return sendResponse(res, 401, false, 'Invalid email or password');
      }
      user = result.rows[0];
    } else {
      const store = getMemoryStore();
      user = store.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!user) {
        return sendResponse(res, 401, false, 'Invalid email or password');
      }
    }

    const isMatch = comparePassword(password, user.password);
    if (!isMatch) {
      return sendResponse(res, 401, false, 'Invalid email or password');
    }

    const token = generateToken(user);

    return sendResponse(res, 200, true, 'Login successful', {
      token,
      type: 'Bearer',
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency || 'USD',
      role: user.role || 'ROLE_USER',
    });
  } catch (err) {
    console.error('Login error:', err);
    return sendResponse(res, 500, false, 'Login error: ' + err.message);
  }
}
