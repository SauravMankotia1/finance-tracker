import { query, isUsingPostgres, getMemoryStore } from '../_lib/db.js';
import { authenticate, sendResponse } from '../_lib/auth.js';

export async function budgetsHandler(req, res, pathParamId = null) {
  let user;
  try {
    user = await authenticate(req);
  } catch (err) {
    return sendResponse(res, err.status || 401, false, err.message);
  }

  const budgetId = pathParamId ? parseInt(pathParamId, 10) : (req.query?.id ? parseInt(req.query.id, 10) : null);

  // If specific ID is targeted
  if (budgetId && !isNaN(budgetId)) {
    if (req.method === 'DELETE') {
      try {
        if (isUsingPostgres()) {
          const delRes = await query('DELETE FROM budgets WHERE id = $1 AND user_id = $2', [budgetId, user.id]);
          if (delRes.rowCount === 0) return sendResponse(res, 404, false, 'Budget not found or access denied');
        } else {
          const store = getMemoryStore();
          const idx = store.budgets.findIndex((b) => b.id === budgetId && b.user_id === user.id);
          if (idx === -1) return sendResponse(res, 404, false, 'Budget not found or access denied');
          store.budgets.splice(idx, 1);
        }
        return sendResponse(res, 200, true, 'Budget deleted successfully');
      } catch (err) {
        return sendResponse(res, 500, false, err.message);
      }
    }
    return sendResponse(res, 405, false, 'Method not allowed');
  }

  const now = new Date();
  const m = parseInt(req.query?.month, 10) || now.getMonth() + 1;
  const y = parseInt(req.query?.year, 10) || now.getFullYear();

  const pad = (n) => String(n).padStart(2, '0');
  const startDateStr = `${y}-${pad(m)}-01`;
  const endDay = new Date(y, m, 0).getDate();
  const endDateStr = `${y}-${pad(m)}-${pad(endDay)}`;

  if (req.method === 'GET') {
    try {
      if (isUsingPostgres()) {
        const budgetRes = await query(
          `SELECT id, category_name as "categoryName", monthly_limit as "monthlyLimit",
                  alert_threshold as "alertThreshold", budget_month as "month", budget_year as "year"
           FROM budgets WHERE user_id = $1 AND budget_month = $2 AND budget_year = $3 ORDER BY id ASC`,
          [user.id, m, y]
        );

        const list = [];
        for (const b of budgetRes.rows) {
          const limit = parseFloat(b.monthlyLimit);
          const spentRes = await query(
            `SELECT COALESCE(SUM(amount), 0) as spent
             FROM transactions
             WHERE user_id = $1 AND type = 'EXPENSE' AND LOWER(category) = LOWER($2) AND date >= $3 AND date <= $4`,
            [user.id, b.categoryName, startDateStr, endDateStr]
          );
          const actualSpent = parseFloat(spentRes.rows[0].spent) || 0;
          const remaining = limit - actualSpent;
          const percentageUsed = limit > 0 ? parseFloat(((actualSpent / limit) * 100).toFixed(2)) : 0;

          list.push({
            id: b.id,
            categoryName: b.categoryName,
            monthlyLimit: limit,
            actualSpent,
            remaining,
            percentageUsed,
            isExceeded: actualSpent > limit,
            isWarning: percentageUsed >= (b.alertThreshold || 80),
            month: b.month,
            year: b.year,
            alertThreshold: b.alertThreshold || 80,
          });
        }
        return sendResponse(res, 200, true, 'Budgets retrieved successfully', list);
      } else {
        const store = getMemoryStore();
        const userBudgets = store.budgets.filter((b) => b.user_id === user.id && b.budget_month === m && b.budget_year === y);

        const list = userBudgets.map((b) => {
          const limit = parseFloat(b.monthly_limit);
          const spent = store.transactions
            .filter((t) => t.user_id === user.id && t.type === 'EXPENSE' && t.category.toLowerCase() === b.category_name.toLowerCase() && t.date >= startDateStr && t.date <= endDateStr)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

          const remaining = limit - spent;
          const percentageUsed = limit > 0 ? parseFloat(((spent / limit) * 100).toFixed(2)) : 0;

          return {
            id: b.id,
            categoryName: b.category_name,
            monthlyLimit: limit,
            actualSpent: spent,
            remaining,
            percentageUsed,
            isExceeded: spent > limit,
            isWarning: percentageUsed >= (b.alert_threshold || 80),
            month: b.budget_month,
            year: b.budget_year,
            alertThreshold: b.alert_threshold || 80,
          };
        });
        return sendResponse(res, 200, true, 'Budgets retrieved successfully', list);
      }
    } catch (err) {
      return sendResponse(res, 500, false, 'Failed to fetch budgets: ' + err.message);
    }
  }

  if (req.method === 'POST') {
    try {
      const { categoryName, monthlyLimit, month, year, alertThreshold = 80 } = req.body || {};
      if (!categoryName || !monthlyLimit || !month || !year) return sendResponse(res, 400, false, 'Category name, limit, month, and year are required');

      const limit = parseFloat(monthlyLimit);
      const bMonth = parseInt(month, 10);
      const bYear = parseInt(year, 10);
      const thresh = parseInt(alertThreshold, 10) || 80;

      if (isUsingPostgres()) {
        const insertRes = await query(
          `INSERT INTO budgets (user_id, category_name, monthly_limit, budget_month, budget_year, alert_threshold, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
           ON CONFLICT (user_id, category_name, budget_month, budget_year)
           DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit, alert_threshold = EXCLUDED.alert_threshold, updated_at = NOW()
           RETURNING id, category_name as "categoryName", monthly_limit as "monthlyLimit", alert_threshold as "alertThreshold", budget_month as "month", budget_year as "year"`,
          [user.id, categoryName.trim(), limit, bMonth, bYear, thresh]
        );
        const b = insertRes.rows[0];

        const spentRes = await query(
          `SELECT COALESCE(SUM(amount), 0) as spent
           FROM transactions
           WHERE user_id = $1 AND type = 'EXPENSE' AND LOWER(category) = LOWER($2) AND date >= $3 AND date <= $4`,
          [user.id, b.categoryName, startDateStr, endDateStr]
        );
        const actualSpent = parseFloat(spentRes.rows[0].spent) || 0;
        const remaining = limit - actualSpent;
        const percentageUsed = limit > 0 ? parseFloat(((actualSpent / limit) * 100).toFixed(2)) : 0;

        return sendResponse(res, 200, true, 'Budget saved successfully', {
          id: b.id,
          categoryName: b.categoryName,
          monthlyLimit: limit,
          actualSpent,
          remaining,
          percentageUsed,
          isExceeded: actualSpent > limit,
          isWarning: percentageUsed >= thresh,
          month: b.month,
          year: b.year,
          alertThreshold: thresh,
        });
      } else {
        const store = getMemoryStore();
        let b = store.budgets.find((eb) => eb.user_id === user.id && eb.category_name.toLowerCase() === categoryName.trim().toLowerCase() && eb.budget_month === bMonth && eb.budget_year === bYear);

        if (b) {
          b.monthly_limit = limit;
          b.alert_threshold = thresh;
        } else {
          b = {
            id: store.nextIds.budgets++,
            user_id: user.id,
            category_name: categoryName.trim(),
            monthly_limit: limit,
            budget_month: bMonth,
            budget_year: bYear,
            alert_threshold: thresh,
            created_at: new Date().toISOString(),
          };
          store.budgets.push(b);
        }

        const spent = store.transactions
          .filter((t) => t.user_id === user.id && t.type === 'EXPENSE' && t.category.toLowerCase() === categoryName.trim().toLowerCase() && t.date >= startDateStr && t.date <= endDateStr)
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const remaining = limit - spent;
        const percentageUsed = limit > 0 ? parseFloat(((spent / limit) * 100).toFixed(2)) : 0;

        return sendResponse(res, 200, true, 'Budget saved successfully', {
          id: b.id,
          categoryName: b.category_name,
          monthlyLimit: limit,
          actualSpent: spent,
          remaining,
          percentageUsed,
          isExceeded: spent > limit,
          isWarning: percentageUsed >= thresh,
          month: b.budget_month,
          year: b.budget_year,
          alertThreshold: thresh,
        });
      }
    } catch (err) {
      return sendResponse(res, 500, false, 'Failed to save budget: ' + err.message);
    }
  }

  return sendResponse(res, 405, false, 'Method not allowed');
}
