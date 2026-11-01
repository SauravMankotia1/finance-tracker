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
  const txId = parseInt(id, 10);
  if (isNaN(txId)) {
    return sendResponse(res, 400, false, 'Invalid transaction ID');
  }

  if (req.method === 'GET') {
    try {
      if (isUsingPostgres()) {
        const result = await query(
          `SELECT id, type, amount, category, TO_CHAR(date, 'YYYY-MM-DD') as date, description, notes, payment_method as "paymentMethod", created_at as "createdAt"
           FROM transactions
           WHERE id = $1 AND user_id = $2`,
          [txId, user.id]
        );
        if (result.rows.length === 0) {
          return sendResponse(res, 404, false, 'Transaction not found');
        }
        const tx = result.rows[0];
        return sendResponse(res, 200, true, 'Transaction retrieved successfully', { ...tx, amount: parseFloat(tx.amount) });
      } else {
        const store = getMemoryStore();
        const tx = store.transactions.find((t) => t.id === txId && t.user_id === user.id);
        if (!tx) {
          return sendResponse(res, 404, false, 'Transaction not found');
        }
        return sendResponse(res, 200, true, 'Transaction retrieved successfully', {
          id: tx.id,
          type: tx.type,
          amount: parseFloat(tx.amount),
          category: tx.category,
          date: tx.date,
          description: tx.description,
          notes: tx.notes,
          paymentMethod: tx.payment_method || 'Card',
          createdAt: tx.created_at,
        });
      }
    } catch (err) {
      return sendResponse(res, 500, false, err.message);
    }
  }

  if (req.method === 'PUT') {
    try {
      const { type, amount, category, date, description, notes, paymentMethod = 'Card' } = req.body || {};

      if (!type || !amount || !category || !date || !description) {
        return sendResponse(res, 400, false, 'Required fields missing');
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return sendResponse(res, 400, false, 'Amount must be greater than zero');
      }

      if (isUsingPostgres()) {
        const updateRes = await query(
          `UPDATE transactions
           SET type = $1, amount = $2, category = $3, date = $4, description = $5, notes = $6, payment_method = $7, updated_at = NOW()
           WHERE id = $8 AND user_id = $9
           RETURNING id, type, amount, category, TO_CHAR(date, 'YYYY-MM-DD') as date, description, notes, payment_method as "paymentMethod", created_at as "createdAt"`,
          [type.toUpperCase(), numAmount, category.trim(), date, description.trim(), notes ? notes.trim() : null, paymentMethod, txId, user.id]
        );
        if (updateRes.rows.length === 0) {
          return sendResponse(res, 404, false, 'Transaction not found or access denied');
        }
        const updated = updateRes.rows[0];
        return sendResponse(res, 200, true, 'Transaction updated successfully', { ...updated, amount: parseFloat(updated.amount) });
      } else {
        const store = getMemoryStore();
        const tx = store.transactions.find((t) => t.id === txId && t.user_id === user.id);
        if (!tx) {
          return sendResponse(res, 404, false, 'Transaction not found or access denied');
        }
        tx.type = type.toUpperCase();
        tx.amount = numAmount;
        tx.category = category.trim();
        tx.date = date;
        tx.description = description.trim();
        tx.notes = notes ? notes.trim() : null;
        tx.payment_method = paymentMethod;

        return sendResponse(res, 200, true, 'Transaction updated successfully', {
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          category: tx.category,
          date: tx.date,
          description: tx.description,
          notes: tx.notes,
          paymentMethod: tx.payment_method,
          createdAt: tx.created_at,
        });
      }
    } catch (err) {
      return sendResponse(res, 500, false, err.message);
    }
  }

  if (req.method === 'DELETE') {
    try {
      if (isUsingPostgres()) {
        const delRes = await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [txId, user.id]);
        if (delRes.rowCount === 0) {
          return sendResponse(res, 404, false, 'Transaction not found or access denied');
        }
      } else {
        const store = getMemoryStore();
        const idx = store.transactions.findIndex((t) => t.id === txId && t.user_id === user.id);
        if (idx === -1) {
          return sendResponse(res, 404, false, 'Transaction not found or access denied');
        }
        store.transactions.splice(idx, 1);
      }
      return sendResponse(res, 200, true, 'Transaction deleted successfully');
    } catch (err) {
      return sendResponse(res, 500, false, err.message);
    }
  }

  return sendResponse(res, 405, false, 'Method not allowed');
}
