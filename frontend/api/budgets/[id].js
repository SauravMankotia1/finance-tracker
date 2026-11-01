import { query, isUsingPostgres, getMemoryStore } from '../_lib/db.js';
import { authenticate, sendResponse } from '../_lib/auth.js';

export default async function handler(req, res) {
  let user;
  try {
    user = await authenticate(req);
  } catch (err) {
    return sendResponse(res, err.status || 401, false, err.message);
  }

  const { id } = req.query;
  const budgetId = parseInt(id, 10);
  if (isNaN(budgetId)) {
    return sendResponse(res, 400, false, 'Invalid budget ID');
  }

  if (req.method === 'DELETE') {
    try {
      if (isUsingPostgres()) {
        const delRes = await query('DELETE FROM budgets WHERE id = $1 AND user_id = $2', [budgetId, user.id]);
        if (delRes.rowCount === 0) {
          return sendResponse(res, 404, false, 'Budget not found or access denied');
        }
      } else {
        const store = getMemoryStore();
        const idx = store.budgets.findIndex((b) => b.id === budgetId && b.user_id === user.id);
        if (idx === -1) {
          return sendResponse(res, 404, false, 'Budget not found or access denied');
        }
        store.budgets.splice(idx, 1);
      }
      return sendResponse(res, 200, true, 'Budget deleted successfully');
    } catch (err) {
      return sendResponse(res, 500, false, err.message);
    }
  }

  return sendResponse(res, 405, false, 'Method not allowed');
}
