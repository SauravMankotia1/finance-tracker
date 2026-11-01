import { query, isUsingPostgres, getMemoryStore } from '../_lib/db.js';
import { authenticate, sendResponse } from '../_lib/auth.js';

export default async function handler(req, res) {
  let user;
  try {
    user = await authenticate(req);
  } catch (err) {
    return sendResponse(res, err.status || 401, false, err.message);
  }

  if (req.method === 'GET') {
    try {
      const {
        type,
        category,
        startDate,
        endDate,
        search,
        page = 0,
        size = 10,
        sortBy = 'date',
        sortDir = 'desc',
      } = req.query;

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

        // Count total
        const countRes = await query(`SELECT COUNT(*) as total FROM transactions WHERE ${whereSql}`, params);
        const totalElements = parseInt(countRes.rows[0].total, 10) || 0;
        const totalPages = Math.ceil(totalElements / pageSize);

        // Sorting column
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

        // Sorting
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
      console.error('Fetch transactions error:', err);
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
      if (isNaN(numAmount) || numAmount <= 0) {
        return sendResponse(res, 400, false, 'Amount must be greater than zero');
      }

      if (isUsingPostgres()) {
        const resInsert = await query(
          `INSERT INTO transactions (user_id, type, amount, category, date, description, notes, payment_method, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
           RETURNING id, type, amount, category, TO_CHAR(date, 'YYYY-MM-DD') as date, description, notes, payment_method as "paymentMethod", created_at as "createdAt"`,
          [user.id, type.toUpperCase(), numAmount, category.trim(), date, description.trim(), notes ? notes.trim() : null, paymentMethod]
        );
        const created = resInsert.rows[0];
        return sendResponse(res, 200, true, 'Transaction created successfully', {
          ...created,
          amount: parseFloat(created.amount),
        });
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
      console.error('Create transaction error:', err);
      return sendResponse(res, 500, false, 'Failed to create transaction: ' + err.message);
    }
  }

  return sendResponse(res, 405, false, 'Method not allowed');
}
