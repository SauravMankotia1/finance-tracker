import { query, isUsingPostgres, getMemoryStore } from '../_lib/db.js';
import { authenticate, sendResponse } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendResponse(res, 405, false, 'Method not allowed');
  }

  try {
    const user = await authenticate(req);

    if (isUsingPostgres()) {
      const dataRes = await query(
        `SELECT id, type, amount, category, TO_CHAR(date, 'YYYY-MM-DD') as date, description, notes, payment_method as "paymentMethod", created_at as "createdAt"
         FROM transactions
         WHERE user_id = $1
         ORDER BY date DESC, id DESC`,
        [user.id]
      );
      return sendResponse(res, 200, true, 'All transactions retrieved successfully', dataRes.rows.map((r) => ({ ...r, amount: parseFloat(r.amount) })));
    } else {
      const store = getMemoryStore();
      const list = store.transactions
        .filter((t) => t.user_id === user.id)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((t) => ({
          id: t.id,
          type: t.type,
          amount: parseFloat(t.amount),
          category: t.category,
          date: t.date,
          description: t.description,
          notes: t.notes,
          paymentMethod: t.payment_method || 'Card',
          createdAt: t.created_at,
        }));
      return sendResponse(res, 200, true, 'All transactions retrieved successfully', list);
    }
  } catch (err) {
    return sendResponse(res, err.status || 500, false, err.message);
  }
}
