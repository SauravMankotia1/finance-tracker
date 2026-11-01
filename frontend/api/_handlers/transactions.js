import { query, isUsingPostgres, getMemoryStore } from '../_lib/db.js';
import { authenticate, sendResponse } from '../_lib/auth.js';

export async function transactionsHandler(req, res, pathParamId = null) {
  let user;
  try {
    user = await authenticate(req);
  } catch (err) {
    return sendResponse(res, err.status || 401, false, err.message);
  }

  // If specific ID is provided (/api/transactions/:id)
  const txId = pathParamId ? parseInt(pathParamId, 10) : (req.query?.id ? parseInt(req.query.id, 10) : null);

  if (txId && !isNaN(txId)) {
    if (req.method === 'GET') {
      try {
        if (isUsingPostgres()) {
          const result = await query(
            `SELECT id, type, amount, category, TO_CHAR(date, 'YYYY-MM-DD') as date, description, notes, payment_method as "paymentMethod", created_at as "createdAt"
             FROM transactions WHERE id = $1 AND user_id = $2`,
            [txId, user.id]
          );
          if (result.rows.length === 0) return sendResponse(res, 404, false, 'Transaction not found');
          const tx = result.rows[0];
          return sendResponse(res, 200, true, 'Transaction retrieved successfully', { ...tx, amount: parseFloat(tx.amount) });
        } else {
          const store = getMemoryStore();
          const tx = store.transactions.find((t) => t.id === txId && t.user_id === user.id);
          if (!tx) return sendResponse(res, 404, false, 'Transaction not found');
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
        if (!type || !amount || !category || !date || !description) return sendResponse(res, 400, false, 'Required fields missing');
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return sendResponse(res, 400, false, 'Amount must be greater than zero');

        if (isUsingPostgres()) {
          const updateRes = await query(
            `UPDATE transactions
             SET type = $1, amount = $2, category = $3, date = $4, description = $5, notes = $6, payment_method = $7, updated_at = NOW()
             WHERE id = $8 AND user_id = $9
             RETURNING id, type, amount, category, TO_CHAR(date, 'YYYY-MM-DD') as date, description, notes, payment_method as "paymentMethod", created_at as "createdAt"`,
            [type.toUpperCase(), numAmount, category.trim(), date, description.trim(), notes ? notes.trim() : null, paymentMethod, txId, user.id]
          );
          if (updateRes.rows.length === 0) return sendResponse(res, 404, false, 'Transaction not found or access denied');
          const updated = updateRes.rows[0];
          return sendResponse(res, 200, true, 'Transaction updated successfully', { ...updated, amount: parseFloat(updated.amount) });
        } else {
          const store = getMemoryStore();
          const tx = store.transactions.find((t) => t.id === txId && t.user_id === user.id);
          if (!tx) return sendResponse(res, 404, false, 'Transaction not found or access denied');
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
          if (delRes.rowCount === 0) return sendResponse(res, 404, false, 'Transaction not found or access denied');
        } else {
          const store = getMemoryStore();
          const idx = store.transactions.findIndex((t) => t.id === txId && t.user_id === user.id);
          if (idx === -1) return sendResponse(res, 404, false, 'Transaction not found or access denied');
          store.transactions.splice(idx, 1);
        }
        return sendResponse(res, 200, true, 'Transaction deleted successfully');
      } catch (err) {
        return sendResponse(res, 500, false, err.message);
      }
    }

    return sendResponse(res, 405, false, 'Method not allowed');
  }

  // Base /api/transactions collection routes
  if (req.method === 'GET') {
    try {
      const { type, category, startDate, endDate, search, page = 0, size = 10, sortBy = 'date', sortDir = 'desc' } = req.query || {};
      const pageNum = parseInt(page, 10) || 0;
      const pageSize = parseInt(size, 10) || 10;
      const offset = pageNum * pageSize;

      if (isUsingPostgres()) {
        let whereClauses = ['user_id = $1'];
        let params = [user.id];
        let pIdx = 2;

        if (type) {
          whereClauses.push(`type = $${pIdx++}`);
          params.push(type.toUpperCase());
        }
        if (category && category !== 'All') {
          whereClauses.push(`LOWER(category) = LOWER($${pIdx++})`);
          params.push(category);
        }
        if (startDate) {
          whereClauses.push(`date >= $${pIdx++}`);
          params.push(startDate);
        }
        if (endDate) {
          whereClauses.push(`date <= $${pIdx++}`);
          params.push(endDate);
        }
        if (search && search.trim()) {
          whereClauses.push(`(LOWER(description) LIKE $${pIdx} OR LOWER(notes) LIKE $${pIdx})`);
          params.push(`%${search.trim().toLowerCase()}%`);
          pIdx++;
        }

        const whereSql = whereClauses.join(' AND ');
        const countRes = await query(`SELECT COUNT(*) as total FROM transactions WHERE ${whereSql}`, params);
        const totalElements = parseInt(countRes.rows[0].total, 10) || 0;
        const totalPages = Math.ceil(totalElements / pageSize);

        const validSortCols = { date: 'date', amount: 'amount', id: 'id' };
        const sortCol = validSortCols[sortBy] || 'date';
        const direction = sortDir.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        const dataRes = await query(
          `SELECT id, type, amount, category, TO_CHAR(date, 'YYYY-MM-DD') as date, description, notes, payment_method as "paymentMethod", created_at as "createdAt"
           FROM transactions
           WHERE ${whereSql}
           ORDER BY ${sortCol} ${direction}, id DESC
           LIMIT $${pIdx++} OFFSET $${pIdx++}`,
          [...params, pageSize, offset]
        );

        return sendResponse(res, 200, true, 'Transactions retrieved successfully', {
          content: dataRes.rows.map((r) => ({ ...r, amount: parseFloat(r.amount) })),
          totalElements,
          totalPages,
          size: pageSize,
          number: pageNum,
        });
      } else {
        const store = getMemoryStore();
        let list = store.transactions.filter((t) => t.user_id === user.id);

        if (type) list = list.filter((t) => t.type.toUpperCase() === type.toUpperCase());
        if (category && category !== 'All') list = list.filter((t) => t.category.toLowerCase() === category.toLowerCase());
        if (startDate) list = list.filter((t) => t.date >= startDate);
        if (endDate) list = list.filter((t) => t.date <= endDate);
        if (search && search.trim()) {
          const q = search.trim().toLowerCase();
          list = list.filter((t) => (t.description && t.description.toLowerCase().includes(q)) || (t.notes && t.notes.toLowerCase().includes(q)));
        }

        list.sort((a, b) => {
          let valA = a[sortBy] ?? a.date;
          let valB = b[sortBy] ?? b.date;
          if (sortBy === 'amount') {
            valA = Number(valA);
            valB = Number(valB);
          }
          if (sortDir.toLowerCase() === 'asc') return valA > valB ? 1 : -1;
          return valA < valB ? 1 : -1;
        });

        const totalElements = list.length;
        const totalPages = Math.ceil(totalElements / pageSize);
        const paged = list.slice(offset, offset + pageSize);

        return sendResponse(res, 200, true, 'Transactions retrieved successfully', {
          content: paged.map((t) => ({
            id: t.id,
            type: t.type,
            amount: parseFloat(t.amount),
            category: t.category,
            date: t.date,
            description: t.description,
            notes: t.notes,
            paymentMethod: t.payment_method || 'Card',
            createdAt: t.created_at,
          })),
          totalElements,
          totalPages,
          size: pageSize,
          number: pageNum,
        });
      }
    } catch (err) {
      return sendResponse(res, 500, false, 'Failed to fetch transactions: ' + err.message);
    }
  }

  if (req.method === 'POST') {
    try {
      const { type, amount, category, date, description, notes, paymentMethod = 'Card' } = req.body || {};
      if (!type || !amount || !category || !date || !description) {
        return sendResponse(res, 400, false, 'Type, amount, category, date, and description are required');
      }
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) return sendResponse(res, 400, false, 'Amount must be greater than zero');

      if (isUsingPostgres()) {
        const resInsert = await query(
          `INSERT INTO transactions (user_id, type, amount, category, date, description, notes, payment_method, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
           RETURNING id, type, amount, category, TO_CHAR(date, 'YYYY-MM-DD') as date, description, notes, payment_method as "paymentMethod", created_at as "createdAt"`,
          [user.id, type.toUpperCase(), numAmount, category.trim(), date, description.trim(), notes ? notes.trim() : null, paymentMethod]
        );
        const created = resInsert.rows[0];
        return sendResponse(res, 200, true, 'Transaction created successfully', { ...created, amount: parseFloat(created.amount) });
      } else {
        const store = getMemoryStore();
        const tx = {
          id: store.nextIds.transactions++,
          user_id: user.id,
          type: type.toUpperCase(),
          amount: numAmount,
          category: category.trim(),
          date,
          description: description.trim(),
          notes: notes ? notes.trim() : null,
          payment_method: paymentMethod,
          created_at: new Date().toISOString(),
        };
        store.transactions.unshift(tx);

        return sendResponse(res, 200, true, 'Transaction created successfully', {
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
      return sendResponse(res, 500, false, 'Failed to create transaction: ' + err.message);
    }
  }

  return sendResponse(res, 405, false, 'Method not allowed');
}

export async function transactionsAllHandler(req, res) {
  let user;
  try {
    user = await authenticate(req);
  } catch (err) {
    return sendResponse(res, err.status || 401, false, err.message);
  }

  try {
    if (isUsingPostgres()) {
      const dataRes = await query(
        `SELECT id, type, amount, category, TO_CHAR(date, 'YYYY-MM-DD') as date, description, notes, payment_method as "paymentMethod", created_at as "createdAt"
         FROM transactions WHERE user_id = $1 ORDER BY date DESC, id DESC`,
        [user.id]
      );
      return sendResponse(res, 200, true, 'All transactions retrieved', dataRes.rows.map((r) => ({ ...r, amount: parseFloat(r.amount) })));
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
      return sendResponse(res, 200, true, 'All transactions retrieved', list);
    }
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
}
