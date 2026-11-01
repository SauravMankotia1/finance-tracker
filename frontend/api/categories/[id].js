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
  const catId = parseInt(id, 10);
  if (isNaN(catId)) {
    return sendResponse(res, 400, false, 'Invalid category ID');
  }

  if (req.method === 'DELETE') {
    try {
      if (isUsingPostgres()) {
        const delRes = await query('DELETE FROM categories WHERE id = $1 AND user_id = $2 AND is_custom = TRUE', [catId, user.id]);
        if (delRes.rowCount === 0) {
          return sendResponse(res, 400, false, 'Cannot delete system default category or category of another user');
        }
      } else {
        const store = getMemoryStore();
        const idx = store.categories.findIndex((c) => c.id === catId && c.user_id === user.id && c.is_custom === true);
        if (idx === -1) {
          return sendResponse(res, 400, false, 'Cannot delete system default category or category of another user');
        }
        store.categories.splice(idx, 1);
      }
      return sendResponse(res, 200, true, 'Category deleted successfully');
    } catch (err) {
      return sendResponse(res, 500, false, err.message);
    }
  }

  return sendResponse(res, 405, false, 'Method not allowed');
}
