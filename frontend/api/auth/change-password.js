import { query, isUsingPostgres, getMemoryStore } from '../_lib/db.js';
import { authenticate, comparePassword, hashPassword, sendResponse } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return sendResponse(res, 405, false, 'Method not allowed');
  }

  try {
    const user = await authenticate(req);
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return sendResponse(res, 400, false, 'Current and new password are required');
    }

    if (newPassword.length < 6) {
      return sendResponse(res, 400, false, 'New password must be at least 6 characters');
    }

    let currentHash = null;

    if (isUsingPostgres()) {
      const dbUser = await query('SELECT password FROM users WHERE id = $1', [user.id]);
      currentHash = dbUser.rows[0].password;
    } else {
      const store = getMemoryStore();
      const memUser = store.users.find((u) => u.id === user.id);
      currentHash = memUser ? memUser.password : null;
    }

    if (!currentHash || !comparePassword(currentPassword, currentHash)) {
      return sendResponse(res, 400, false, 'Current password does not match');
    }

    const newHashed = hashPassword(newPassword);

    if (isUsingPostgres()) {
      await query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [newHashed, user.id]);
    } else {
      const store = getMemoryStore();
      const memUser = store.users.find((u) => u.id === user.id);
      if (memUser) memUser.password = newHashed;
    }

    return sendResponse(res, 200, true, 'Password changed successfully');
  } catch (err) {
    return sendResponse(res, err.status || 500, false, err.message);
  }
}
