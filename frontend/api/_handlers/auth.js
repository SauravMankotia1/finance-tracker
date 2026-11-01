import { query, isUsingPostgres, getMemoryStore } from '../_lib/db.js';
import { hashPassword, comparePassword, generateToken, authenticate, sendResponse } from '../_lib/auth.js';
import { seedDemoDataForUser, clearUserData } from '../_lib/seed.js';

export async function registerHandler(req, res) {
  if (req.method !== 'POST') return sendResponse(res, 405, false, 'Method not allowed');
  try {
    const { name, email, password, currency = 'USD', seedDemoData = false } = req.body || {};
    if (!name || !email || !password) return sendResponse(res, 400, false, 'Name, email, and password are required');
    if (password.length < 6) return sendResponse(res, 400, false, 'Password must be at least 6 characters');

    const cleanEmail = email.toLowerCase().trim();
    const hashedPassword = hashPassword(password);
    const userCurrency = (currency || 'USD').toUpperCase().trim();

    let savedUser = null;
    if (isUsingPostgres()) {
      const checkRes = await query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (checkRes.rows.length > 0) return sendResponse(res, 400, false, 'An account with this email address already exists');

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
      if (existing) return sendResponse(res, 400, false, 'An account with this email address already exists');

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
    return sendResponse(res, 500, false, 'Registration failed: ' + err.message);
  }
}

export async function loginHandler(req, res) {
  if (req.method !== 'POST') return sendResponse(res, 405, false, 'Method not allowed');
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return sendResponse(res, 400, false, 'Email and password are required');

    const cleanEmail = email.toLowerCase().trim();
    let user = null;

    if (isUsingPostgres()) {
      const result = await query('SELECT id, name, email, password, currency, role FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (result.rows.length === 0) return sendResponse(res, 401, false, 'Invalid email or password');
      user = result.rows[0];
    } else {
      const store = getMemoryStore();
      user = store.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!user) return sendResponse(res, 401, false, 'Invalid email or password');
    }

    const isMatch = comparePassword(password, user.password);
    if (!isMatch) return sendResponse(res, 401, false, 'Invalid email or password');

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
    return sendResponse(res, 500, false, 'Login error: ' + err.message);
  }
}

export async function meHandler(req, res) {
  if (req.method !== 'GET') return sendResponse(res, 405, false, 'Method not allowed');
  try {
    const user = await authenticate(req);
    return sendResponse(res, 200, true, 'Profile retrieved', {
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency || 'USD',
      role: user.role || 'ROLE_USER',
    });
  } catch (err) {
    return sendResponse(res, err.status || 401, false, err.message);
  }
}

export async function updateProfileHandler(req, res) {
  if (req.method !== 'PUT') return sendResponse(res, 405, false, 'Method not allowed');
  try {
    const user = await authenticate(req);
    const { name, currency } = req.body || {};
    const updatedName = name ? name.trim() : user.name;
    const updatedCurrency = currency ? currency.toUpperCase().trim() : user.currency;

    if (isUsingPostgres()) {
      const result = await query(
        `UPDATE users SET name = $1, currency = $2, updated_at = NOW()
         WHERE id = $3 RETURNING id, name, email, currency, role`,
        [updatedName, updatedCurrency, user.id]
      );
      return sendResponse(res, 200, true, 'Profile updated successfully', result.rows[0]);
    } else {
      const store = getMemoryStore();
      const u = store.users.find((x) => x.id === user.id);
      if (u) {
        u.name = updatedName;
        u.currency = updatedCurrency;
      }
      return sendResponse(res, 200, true, 'Profile updated successfully', {
        id: user.id,
        name: updatedName,
        email: user.email,
        currency: updatedCurrency,
        role: user.role,
      });
    }
  } catch (err) {
    return sendResponse(res, err.status || 500, false, err.message);
  }
}

export async function changePasswordHandler(req, res) {
  if (req.method !== 'PUT') return sendResponse(res, 405, false, 'Method not allowed');
  try {
    const user = await authenticate(req);
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return sendResponse(res, 400, false, 'Both current and new passwords are required');
    if (newPassword.length < 6) return sendResponse(res, 400, false, 'New password must be at least 6 characters');

    if (isUsingPostgres()) {
      const dbRes = await query('SELECT password FROM users WHERE id = $1', [user.id]);
      if (dbRes.rows.length === 0) return sendResponse(res, 404, false, 'User not found');
      if (!comparePassword(currentPassword, dbRes.rows[0].password)) return sendResponse(res, 400, false, 'Current password does not match');

      const newHashed = hashPassword(newPassword);
      await query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [newHashed, user.id]);
    } else {
      const store = getMemoryStore();
      const u = store.users.find((x) => x.id === user.id);
      if (!u || !comparePassword(currentPassword, u.password)) return sendResponse(res, 400, false, 'Current password does not match');
      u.password = hashPassword(newPassword);
    }
    return sendResponse(res, 200, true, 'Password changed successfully');
  } catch (err) {
    return sendResponse(res, err.status || 500, false, err.message);
  }
}

export async function seedDemoDataHandler(req, res) {
  if (req.method !== 'POST') return sendResponse(res, 405, false, 'Method not allowed');
  try {
    const user = await authenticate(req);
    await seedDemoDataForUser(user.id);
    return sendResponse(res, 200, true, 'Demo data seeded successfully');
  } catch (err) {
    return sendResponse(res, err.status || 500, false, err.message);
  }
}

export async function clearDataHandler(req, res) {
  if (req.method !== 'POST') return sendResponse(res, 405, false, 'Method not allowed');
  try {
    const user = await authenticate(req);
    await clearUserData(user.id);
    return sendResponse(res, 200, true, 'All user transactions and budgets have been erased');
  } catch (err) {
    return sendResponse(res, err.status || 500, false, err.message);
  }
}
