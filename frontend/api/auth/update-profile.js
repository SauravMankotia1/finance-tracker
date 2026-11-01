import { query, isUsingPostgres, getMemoryStore } from '../_lib/db.js';
import { authenticate, sendResponse } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return sendResponse(res, 405, false, 'Method not allowed');
  }

  try {
    const user = await authenticate(req);
    const { name, currency } = req.body || {};

    if (!name || !name.trim()) {
      return sendResponse(res, 400, false, 'Name cannot be empty');
    }

    const cleanName = name.trim();
    const cleanCurrency = (currency || user.currency || 'USD').toUpperCase().trim();

    if (isUsingPostgres()) {
      await query(
        'UPDATE users SET name = $1, currency = $2, updated_at = NOW() WHERE id = $3',
        [cleanName, cleanCurrency, user.id]
      );
    } else {
      const store = getMemoryStore();
      const memUser = store.users.find((u) => u.id === user.id);
      if (memUser) {
        memUser.name = cleanName;
        memUser.currency = cleanCurrency;
      }
    }

    return sendResponse(res, 200, true, 'Profile updated successfully', {
      id: user.id,
      name: cleanName,
      email: user.email,
      currency: cleanCurrency,
      role: user.role,
    });
  } catch (err) {
    return sendResponse(res, err.status || 500, false, err.message);
  }
}
