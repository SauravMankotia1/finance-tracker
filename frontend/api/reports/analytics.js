import { query, isUsingPostgres, getMemoryStore } from '../_lib/db.js';
import { authenticate, sendResponse } from '../_lib/auth.js';

const PALETTE = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#EC4899', '#6366F1', '#14B8A6', '#F97316'
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendResponse(res, 405, false, 'Method not allowed');
  }

  let user;
  try {
    user = await authenticate(req);
  } catch (err) {
    return sendResponse(res, err.status || 401, false, err.message);
  }

  try {
    const today = new Date();
    const periodMode = (req.query.period || 'monthly').toLowerCase().trim();
    const targetYear = parseInt(req.query.year, 10) || today.getFullYear();
    const targetMonth = parseInt(req.query.month, 10) || today.getMonth() + 1;

    const pad = (n) => String(n).padStart(2, '0');
    const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    let startDateStr;
    let endDateStr = formatDate(today);

    if (periodMode === 'weekly') {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      startDateStr = formatDate(d);
    } else if (periodMode === 'yearly') {
      startDateStr = `${targetYear}-01-01`;
      endDateStr = `${targetYear}-12-31`;
    } else {
      // Monthly
      startDateStr = `${targetYear}-${pad(targetMonth)}-01`;
      const endDay = new Date(targetYear, targetMonth, 0).getDate();
      endDateStr = `${targetYear}-${pad(targetMonth)}-${pad(endDay)}`;
    }

    if (isUsingPostgres()) {
      // Totals
      const totalsRes = await query(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as "totalIncome",
           COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as "totalExpenses"
         FROM transactions
         WHERE user_id = $1 AND date >= $2 AND date <= $3`,
        [user.id, startDateStr, endDateStr]
      );

      const totalIncome = parseFloat(totalsRes.rows[0].totalIncome) || 0;
      const totalExpenses = parseFloat(totalsRes.rows[0].totalExpenses) || 0;
      const netSavings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? parseFloat(((netSavings / totalIncome) * 100).toFixed(1)) : 0;

      // Category breakdown
      const catRes = await query(
        `SELECT category, SUM(amount) as amount
         FROM transactions
         WHERE user_id = $1 AND type = 'EXPENSE' AND date >= $2 AND date <= $3
         GROUP BY category ORDER BY SUM(amount) DESC`,
        [user.id, startDateStr, endDateStr]
      );

      let topSpendingCategory = 'N/A';
      let topCategoryAmount = 0;

      if (catRes.rows.length > 0) {
        topSpendingCategory = catRes.rows[0].category;
        topCategoryAmount = parseFloat(catRes.rows[0].amount);
      }

      const categoryBreakdown = catRes.rows.map((r, idx) => {
        const amt = parseFloat(r.amount);
        return {
          category: r.category,
          amount: amt,
          percentage: totalExpenses > 0 ? parseFloat(((amt / totalExpenses) * 100).toFixed(1)) : 0,
          color: PALETTE[idx % PALETTE.length],
        };
      });

      // Trend data
      const trendData = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      if (periodMode === 'weekly') {
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dStr = formatDate(d);

          const dRes = await query(
            `SELECT
               COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as inc,
               COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as exp
             FROM transactions WHERE user_id = $1 AND date = $2`,
            [user.id, dStr]
          );

          const inc = parseFloat(dRes.rows[0].inc) || 0;
          const exp = parseFloat(dRes.rows[0].exp) || 0;
          trendData.push({
            month: dStr,
            monthName: dayNames[d.getDay()],
            income: inc,
            expenses: exp,
            savings: inc - exp,
          });
        }
      } else if (periodMode === 'yearly') {
        for (let m = 1; m <= 12; m++) {
          const sDate = `${targetYear}-${pad(m)}-01`;
          const eDay = new Date(targetYear, m, 0).getDate();
          const eDate = `${targetYear}-${pad(m)}-${pad(eDay)}`;

          const mRes = await query(
            `SELECT
               COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as inc,
               COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as exp
             FROM transactions WHERE user_id = $1 AND date >= $2 AND date <= $3`,
            [user.id, sDate, eDate]
          );

          const inc = parseFloat(mRes.rows[0].inc) || 0;
          const exp = parseFloat(mRes.rows[0].exp) || 0;
          trendData.push({
            month: `${targetYear}-${pad(m)}`,
            monthName: monthNames[m - 1],
            income: inc,
            expenses: exp,
            savings: inc - exp,
          });
        }
      } else {
        // Monthly mode: past 6 months
        for (let i = 5; i >= 0; i--) {
          const d = new Date(targetYear, targetMonth - 1 - i, 1);
          const y = d.getFullYear();
          const m = d.getMonth() + 1;
          const sDate = `${y}-${pad(m)}-01`;
          const eDay = new Date(y, m, 0).getDate();
          const eDate = `${y}-${pad(m)}-${pad(eDay)}`;

          const mRes = await query(
            `SELECT
               COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as inc,
               COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as exp
             FROM transactions WHERE user_id = $1 AND date >= $2 AND date <= $3`,
            [user.id, sDate, eDate]
          );

          const inc = parseFloat(mRes.rows[0].inc) || 0;
          const exp = parseFloat(mRes.rows[0].exp) || 0;
          trendData.push({
            month: `${y}-${pad(m)}`,
            monthName: monthNames[m - 1],
            income: inc,
            expenses: exp,
            savings: inc - exp,
          });
        }
      }

      return sendResponse(res, 200, true, 'Analytics retrieved successfully', {
        period: periodMode,
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        averageExpense: totalExpenses > 0 ? parseFloat((totalExpenses / 30).toFixed(2)) : 0,
        topSpendingCategory,
        topCategoryAmount,
        categoryBreakdown,
        trendData,
      });
    } else {
      // Memory Store Analytics
      const store = getMemoryStore();
      const userTxs = store.transactions.filter(
        (t) => t.user_id === user.id && t.date >= startDateStr && t.date <= endDateStr
      );

      const totalIncome = userTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount), 0);
      const totalExpenses = userTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(t.amount), 0);
      const netSavings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? parseFloat(((netSavings / totalIncome) * 100).toFixed(1)) : 0;

      const expMap = {};
      userTxs.filter((t) => t.type === 'EXPENSE').forEach((t) => {
        expMap[t.category] = (expMap[t.category] || 0) + parseFloat(t.amount);
      });

      const catSorted = Object.entries(expMap).sort((a, b) => b[1] - a[1]);
      const topSpendingCategory = catSorted.length > 0 ? catSorted[0][0] : 'N/A';
      const topCategoryAmount = catSorted.length > 0 ? catSorted[0][1] : 0;

      const categoryBreakdown = catSorted.map(([cat, amt], idx) => ({
        category: cat,
        amount: amt,
        percentage: totalExpenses > 0 ? parseFloat(((amt / totalExpenses) * 100).toFixed(1)) : 0,
        color: PALETTE[idx % PALETTE.length],
      }));

      // Trend data
      const trendData = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      if (periodMode === 'weekly') {
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dStr = formatDate(d);

          const dayTxs = store.transactions.filter((t) => t.user_id === user.id && t.date === dStr);
          const inc = dayTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount), 0);
          const exp = dayTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(t.amount), 0);
          trendData.push({
            month: dStr,
            monthName: dayNames[d.getDay()],
            income: inc,
            expenses: exp,
            savings: inc - exp,
          });
        }
      } else {
        for (let i = 5; i >= 0; i--) {
          const d = new Date(targetYear, targetMonth - 1 - i, 1);
          const y = d.getFullYear();
          const m = d.getMonth() + 1;
          const sDate = `${y}-${pad(m)}-01`;
          const eDay = new Date(y, m, 0).getDate();
          const eDate = `${y}-${pad(m)}-${pad(eDay)}`;

          const mTxs = store.transactions.filter((t) => t.user_id === user.id && t.date >= sDate && t.date <= eDate);
          const inc = mTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount), 0);
          const exp = mTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(t.amount), 0);
          trendData.push({
            month: `${y}-${pad(m)}`,
            monthName: monthNames[m - 1],
            income: inc,
            expenses: exp,
            savings: inc - exp,
          });
        }
      }

      return sendResponse(res, 200, true, 'Analytics retrieved successfully', {
        period: periodMode,
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        averageExpense: totalExpenses > 0 ? parseFloat((totalExpenses / 30).toFixed(2)) : 0,
        topSpendingCategory,
        topCategoryAmount,
        categoryBreakdown,
        trendData,
      });
    }
  } catch (err) {
    console.error('Analytics error:', err);
    return sendResponse(res, 500, false, 'Failed to fetch analytics: ' + err.message);
  }
}
