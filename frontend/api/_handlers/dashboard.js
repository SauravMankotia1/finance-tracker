import { query, isUsingPostgres, getMemoryStore } from '../_lib/db.js';
import { authenticate, sendResponse } from '../_lib/auth.js';

const PALETTE = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#EC4899', '#6366F1', '#14B8A6', '#F97316'
];

export async function dashboardStatsHandler(req, res) {
  if (req.method !== 'GET') return sendResponse(res, 405, false, 'Method not allowed');

  let user;
  try {
    user = await authenticate(req);
  } catch (err) {
    return sendResponse(res, err.status || 401, false, err.message);
  }

  try {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;

    const pad = (n) => String(n).padStart(2, '0');
    const curMonthStart = `${curYear}-${pad(curMonth)}-01`;
    const curMonthEndDay = new Date(curYear, curMonth, 0).getDate();
    const curMonthEnd = `${curYear}-${pad(curMonth)}-${pad(curMonthEndDay)}`;

    const prevDate = new Date(curYear, now.getMonth() - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;
    const prevMonthStart = `${prevYear}-${pad(prevMonth)}-01`;
    const prevMonthEndDay = new Date(prevYear, prevMonth, 0).getDate();
    const prevMonthEnd = `${prevYear}-${pad(prevMonth)}-${pad(prevMonthEndDay)}`;

    if (isUsingPostgres()) {
      const allTotalsRes = await query(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as "totalIncome",
           COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as "totalExpenses"
         FROM transactions WHERE user_id = $1`,
        [user.id]
      );
      const totalIncome = parseFloat(allTotalsRes.rows[0].totalIncome) || 0;
      const totalExpenses = parseFloat(allTotalsRes.rows[0].totalExpenses) || 0;
      const totalBalance = totalIncome - totalExpenses;
      const totalSavings = totalBalance;
      const savingsRate = totalIncome > 0 ? parseFloat(((totalSavings / totalIncome) * 100).toFixed(1)) : 0;

      const curTotalsRes = await query(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as "monthlyIncome",
           COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as "monthlyExpenses"
         FROM transactions WHERE user_id = $1 AND date >= $2 AND date <= $3`,
        [user.id, curMonthStart, curMonthEnd]
      );
      const monthlyIncome = parseFloat(curTotalsRes.rows[0].monthlyIncome) || 0;
      const monthlyExpenses = parseFloat(curTotalsRes.rows[0].monthlyExpenses) || 0;
      const monthlySavings = monthlyIncome - monthlyExpenses;
      const monthlySavingsRate = monthlyIncome > 0 ? parseFloat(((monthlySavings / monthlyIncome) * 100).toFixed(1)) : 0;

      const prevTotalsRes = await query(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as "prevIncome",
           COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as "prevExpenses"
         FROM transactions WHERE user_id = $1 AND date >= $2 AND date <= $3`,
        [user.id, prevMonthStart, prevMonthEnd]
      );
      const previousMonthIncome = parseFloat(prevTotalsRes.rows[0].prevIncome) || 0;
      const previousMonthExpenses = parseFloat(prevTotalsRes.rows[0].prevExpenses) || 0;

      let incomeGrowth = 0;
      if (previousMonthIncome > 0) incomeGrowth = parseFloat((((monthlyIncome - previousMonthIncome) / previousMonthIncome) * 100).toFixed(1));
      let expenseGrowth = 0;
      if (previousMonthExpenses > 0) expenseGrowth = parseFloat((((monthlyExpenses - previousMonthExpenses) / previousMonthExpenses) * 100).toFixed(1));

      const budgetRes = await query(
        `SELECT COALESCE(SUM(monthly_limit), 0) as "totalBudget" FROM budgets WHERE user_id = $1 AND budget_month = $2 AND budget_year = $3`,
        [user.id, curMonth, curYear]
      );
      const totalBudget = parseFloat(budgetRes.rows[0].totalBudget) || 0;

      const budgetSpentRes = await query(
        `SELECT COALESCE(SUM(t.amount), 0) as "totalBudgetSpent"
         FROM transactions t
         JOIN budgets b ON LOWER(t.category) = LOWER(b.category_name)
         WHERE t.user_id = $1 AND t.type = 'EXPENSE' AND t.date >= $2 AND t.date <= $3
           AND b.budget_month = $4 AND b.budget_year = $5`,
        [user.id, curMonthStart, curMonthEnd, curMonth, curYear]
      );
      const totalBudgetSpent = parseFloat(budgetSpentRes.rows[0].totalBudgetSpent) || 0;
      const totalBudgetRemaining = totalBudget - totalBudgetSpent;

      const recentRes = await query(
        `SELECT id, type, amount, category, TO_CHAR(date, 'YYYY-MM-DD') as date, description, notes, payment_method as "paymentMethod", created_at as "createdAt"
         FROM transactions WHERE user_id = $1 ORDER BY date DESC, id DESC LIMIT 10`,
        [user.id]
      );
      const recentTransactions = recentRes.rows.map((r) => ({ ...r, amount: parseFloat(r.amount) }));

      let catRes = await query(
        `SELECT category, SUM(amount) as amount
         FROM transactions
         WHERE user_id = $1 AND type = 'EXPENSE' AND date >= $2 AND date <= $3
         GROUP BY category ORDER BY SUM(amount) DESC`,
        [user.id, curMonthStart, curMonthEnd]
      );

      if (catRes.rows.length === 0) {
        catRes = await query(
          `SELECT category, SUM(amount) as amount
           FROM transactions
           WHERE user_id = $1 AND type = 'EXPENSE'
           GROUP BY category ORDER BY SUM(amount) DESC LIMIT 8`,
          [user.id]
        );
      }

      const totalCatExp = catRes.rows.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const categoryDistribution = catRes.rows.map((r, idx) => {
        const amt = parseFloat(r.amount);
        return {
          category: r.category,
          amount: amt,
          percentage: totalCatExp > 0 ? parseFloat(((amt / totalCatExp) * 100).toFixed(1)) : 0,
          color: PALETTE[idx % PALETTE.length],
        };
      });

      const monthlySpendingTrends = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(curYear, now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const sDate = `${y}-${pad(m)}-01`;
        const eDay = new Date(y, m, 0).getDate();
        const eDate = `${y}-${pad(m)}-${pad(eDay)}`;

        const trendRes = await query(
          `SELECT
             COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as inc,
             COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as exp
           FROM transactions WHERE user_id = $1 AND date >= $2 AND date <= $3`,
          [user.id, sDate, eDate]
        );

        const inc = parseFloat(trendRes.rows[0].inc) || 0;
        const exp = parseFloat(trendRes.rows[0].exp) || 0;
        monthlySpendingTrends.push({
          month: `${y}-${pad(m)}`,
          monthName: monthNames[m - 1],
          income: inc,
          expenses: exp,
          savings: inc - exp,
        });
      }

      return sendResponse(res, 200, true, 'Dashboard statistics retrieved successfully', {
        totalBalance,
        totalIncome,
        totalExpenses,
        totalSavings,
        savingsRate,
        monthlyIncome,
        monthlyExpenses,
        monthlySavings,
        monthlySavingsRate,
        previousMonthIncome,
        previousMonthExpenses,
        incomeGrowth,
        expenseGrowth,
        totalBudget,
        totalBudgetSpent,
        totalBudgetRemaining,
        currency: user.currency || 'USD',
        recentTransactions,
        categoryDistribution,
        monthlySpendingTrends,
      });
    } else {
      const store = getMemoryStore();
      const userTxs = store.transactions.filter((t) => t.user_id === user.id);

      const totalIncome = userTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount), 0);
      const totalExpenses = userTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(t.amount), 0);
      const totalBalance = totalIncome - totalExpenses;
      const totalSavings = totalBalance;
      const savingsRate = totalIncome > 0 ? parseFloat(((totalSavings / totalIncome) * 100).toFixed(1)) : 0;

      const curMonthTxs = userTxs.filter((t) => t.date >= curMonthStart && t.date <= curMonthEnd);
      const monthlyIncome = curMonthTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount), 0);
      const monthlyExpenses = curMonthTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(t.amount), 0);
      const monthlySavings = monthlyIncome - monthlyExpenses;
      const monthlySavingsRate = monthlyIncome > 0 ? parseFloat(((monthlySavings / monthlyIncome) * 100).toFixed(1)) : 0;

      const prevMonthTxs = userTxs.filter((t) => t.date >= prevMonthStart && t.date <= prevMonthEnd);
      const previousMonthIncome = prevMonthTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount), 0);
      const previousMonthExpenses = prevMonthTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(t.amount), 0);

      let incomeGrowth = 0;
      if (previousMonthIncome > 0) incomeGrowth = parseFloat((((monthlyIncome - previousMonthIncome) / previousMonthIncome) * 100).toFixed(1));
      let expenseGrowth = 0;
      if (previousMonthExpenses > 0) expenseGrowth = parseFloat((((monthlyExpenses - previousMonthExpenses) / previousMonthExpenses) * 100).toFixed(1));

      const userBudgets = store.budgets.filter((b) => b.user_id === user.id && b.budget_month === curMonth && b.budget_year === curYear);
      const totalBudget = userBudgets.reduce((s, b) => s + parseFloat(b.monthly_limit), 0);

      const totalBudgetSpent = curMonthTxs
        .filter((t) => t.type === 'EXPENSE' && userBudgets.some((b) => b.category_name.toLowerCase() === t.category.toLowerCase()))
        .reduce((s, t) => s + parseFloat(t.amount), 0);
      const totalBudgetRemaining = totalBudget - totalBudgetSpent;

      const recentTransactions = [...userTxs]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 10)
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

      const expGroup = {};
      const expSource = curMonthTxs.filter((t) => t.type === 'EXPENSE').length > 0
        ? curMonthTxs.filter((t) => t.type === 'EXPENSE')
        : userTxs.filter((t) => t.type === 'EXPENSE');

      expSource.forEach((t) => {
        expGroup[t.category] = (expGroup[t.category] || 0) + parseFloat(t.amount);
      });

      const catEntries = Object.entries(expGroup).sort((a, b) => b[1] - a[1]);
      const catSum = catEntries.reduce((s, e) => s + e[1], 0);
      const categoryDistribution = catEntries.map(([cat, amt], idx) => ({
        category: cat,
        amount: amt,
        percentage: catSum > 0 ? parseFloat(((amt / catSum) * 100).toFixed(1)) : 0,
        color: PALETTE[idx % PALETTE.length],
      }));

      const monthlySpendingTrends = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(curYear, now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const sDate = `${y}-${pad(m)}-01`;
        const eDay = new Date(y, m, 0).getDate();
        const eDate = `${y}-${pad(m)}-${pad(eDay)}`;

        const mTxs = userTxs.filter((t) => t.date >= sDate && t.date <= eDate);
        const inc = mTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount), 0);
        const exp = mTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(t.amount), 0);
        monthlySpendingTrends.push({
          month: `${y}-${pad(m)}`,
          monthName: monthNames[m - 1],
          income: inc,
          expenses: exp,
          savings: inc - exp,
        });
      }

      return sendResponse(res, 200, true, 'Dashboard statistics retrieved successfully', {
        totalBalance,
        totalIncome,
        totalExpenses,
        totalSavings,
        savingsRate,
        monthlyIncome,
        monthlyExpenses,
        monthlySavings,
        monthlySavingsRate,
        previousMonthIncome,
        previousMonthExpenses,
        incomeGrowth,
        expenseGrowth,
        totalBudget,
        totalBudgetSpent,
        totalBudgetRemaining,
        currency: user.currency || 'USD',
        recentTransactions,
        categoryDistribution,
        monthlySpendingTrends,
      });
    }
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to get dashboard stats: ' + err.message);
  }
}
