import { query, isUsingPostgres, getMemoryStore } from '../_lib/db.js';
import { hashPassword, generateToken, sendResponse } from '../_lib/auth.js';
import { seedDemoDataForUser } from '../_lib/seed.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendResponse(res, 405, false, 'Method not allowed');
  }

  try {
    const { name, email, password, currency = 'USD', seedDemoData = false } = req.body || {};

    if (!name || !email || !password) {
      return sendResponse(res, 400, false, 'Name, email, and password are required');
    }

    if (password.length < 6) {
      return sendResponse(res, 400, false, 'Password must be at least 6 characters');
    }

    const cleanEmail = email.toLowerCase().trim();
    const hashedPassword = hashPassword(password);
    const userCurrency = (currency || 'USD').toUpperCase().trim();

    let savedUser = null;

    if (isUsingPostgres()) {
      // Check existing email
      const checkRes = await query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (checkRes.rows.length > 0) {
        return sendResponse(res, 400, false, 'An account with this email address already exists');
      }

      // Insert user
      const insertRes = await query(
        `INSERT INTO users (name, email, password, currency, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'ROLE_USER', NOW(), NOW())
         RETURNING id, name, email, currency, role`,
        [name.trim(), cleanEmail, hashedPassword, userCurrency]
      );
      savedUser = insertRes.rows[0];
    } else {
      const store = getMemoryStore();
      const existing = store.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return sendResponse(res, 400, false, 'An account with this email address already exists');
      }

      savedUser = {
        id: store.nextIds.users++,
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        currency: userCurrency,
        role: 'ROLE_USER',
        created_at: new Date().toISOString(),
      };
      store.users.push(savedUser);
    }

    if (seedDemoData) {
      await seedDemoDataForUser(savedUser.id);
    }

    const token = generateToken(savedUser);

    return sendResponse(res, 200, true, 'User registered successfully', {
      token,
      type: 'Bearer',
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      currency: savedUser.currency,
      role: savedUser.role,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return sendResponse(res, 500, false, 'Registration failed: ' + err.message);
  }
}
