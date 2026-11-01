import { query, isUsingPostgres, getMemoryStore } from './db.js';

export async function seedDemoDataForUser(userId) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const pad = (n) => String(n).padStart(2, '0');
  const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const todayStr = formatDate(now);
  const firstOfMonth = `${currentYear}-${pad(currentMonth)}-01`;

  const dMinus = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return formatDate(d);
  };

  const mMinus = (months, day = 1) => {
    const d = new Date(now.getFullYear(), now.getMonth() - months, day);
    return formatDate(d);
  };

  const sampleBudgets = [
    { cat: 'Food', limit: 600.0, month: currentMonth, year: currentYear, threshold: 80 },
    { cat: 'Shopping', limit: 400.0, month: currentMonth, year: currentYear, threshold: 80 },
    { cat: 'Transportation', limit: 250.0, month: currentMonth, year: currentYear, threshold: 85 },
    { cat: 'Rent', limit: 1200.0, month: currentMonth, year: currentYear, threshold: 90 },
    { cat: 'Bills', limit: 350.0, month: currentMonth, year: currentYear, threshold: 80 },
    { cat: 'Entertainment', limit: 200.0, month: currentMonth, year: currentYear, threshold: 75 },
  ];

  const sampleTransactions = [
    // Current Month Income
    { type: 'INCOME', amount: 4800.0, cat: 'Salary', date: firstOfMonth, desc: 'Monthly Tech Salary', notes: 'Direct bank deposit', method: 'Bank Transfer' },
    { type: 'INCOME', amount: 750.0, cat: 'Freelance', date: dMinus(5), desc: 'Frontend UI Design Project', notes: 'Client payment', method: 'Bank Transfer' },
    { type: 'INCOME', amount: 180.0, cat: 'Investments', date: dMinus(12), desc: 'Quarterly Dividend Payout', notes: 'S&P 500 Index fund', method: 'Other' },

    // Current Month Expenses
    { type: 'EXPENSE', amount: 1200.0, cat: 'Rent', date: firstOfMonth, desc: 'Apartment Monthly Rent', notes: 'Apartment 4B downtown', method: 'Bank Transfer' },
    { type: 'EXPENSE', amount: 135.5, cat: 'Food', date: dMinus(1), desc: 'Whole Foods Grocery', notes: 'Weekly groceries', method: 'Card' },
    { type: 'EXPENSE', amount: 45.2, cat: 'Food', date: dMinus(3), desc: 'Dinner with Friends', notes: 'Italian bistro', method: 'Card' },
    { type: 'EXPENSE', amount: 18.5, cat: 'Food', date: dMinus(2), desc: 'Artisan Coffee & Bakery', notes: 'Espresso', method: 'Card' },
    { type: 'EXPENSE', amount: 85.0, cat: 'Transportation', date: dMinus(4), desc: 'Gas Station Refuel', notes: 'Full tank', method: 'Card' },
    { type: 'EXPENSE', amount: 32.4, cat: 'Transportation', date: dMinus(6), desc: 'Uber Ride to Airport', notes: 'Terminal 2', method: 'Card' },
    { type: 'EXPENSE', amount: 129.99, cat: 'Shopping', date: dMinus(7), desc: 'Ergonomic Desk Chair Pad', notes: 'Home office improvement', method: 'Card' },
    { type: 'EXPENSE', amount: 89.0, cat: 'Bills', date: dMinus(8), desc: 'Fiber Optic Internet', notes: '1 Gbps speed', method: 'Bank Transfer' },
    { type: 'EXPENSE', amount: 115.0, cat: 'Bills', date: dMinus(10), desc: 'Electricity & Water Utility', notes: 'Monthly utility bill', method: 'Bank Transfer' },
    { type: 'EXPENSE', amount: 49.99, cat: 'Entertainment', date: dMinus(9), desc: 'Concert Tickets', notes: 'Live jazz club', method: 'Card' },
    { type: 'EXPENSE', amount: 24.99, cat: 'Entertainment', date: dMinus(14), desc: 'Streaming Subscriptions', notes: 'Netflix & Spotify', method: 'Card' },
    { type: 'EXPENSE', amount: 65.0, cat: 'Healthcare', date: dMinus(11), desc: 'Pharmacy & Vitamins', notes: 'Health supplements', method: 'Card' },

    // Last Month (Month - 1)
    { type: 'INCOME', amount: 4800.0, cat: 'Salary', date: mMinus(1, 1), desc: 'Monthly Tech Salary', notes: 'Direct deposit', method: 'Bank Transfer' },
    { type: 'INCOME', amount: 620.0, cat: 'Freelance', date: mMinus(1, 15), desc: 'Mobile App Consultation', notes: 'Contract work', method: 'Bank Transfer' },
    { type: 'EXPENSE', amount: 1200.0, cat: 'Rent', date: mMinus(1, 2), desc: 'Apartment Monthly Rent', notes: 'Apartment 4B', method: 'Bank Transfer' },
    { type: 'EXPENSE', amount: 480.0, cat: 'Food', date: mMinus(1, 10), desc: 'Supermarket & Groceries', notes: 'Monthly groceries', method: 'Card' },
    { type: 'EXPENSE', amount: 210.0, cat: 'Transportation', date: mMinus(1, 12), desc: 'Commuter Pass & Fuel', notes: 'Monthly transit', method: 'Card' },
    { type: 'EXPENSE', amount: 190.0, cat: 'Bills', date: mMinus(1, 16), desc: 'Utilities & Mobile', notes: 'Phone & Electricity', method: 'Bank Transfer' },
    { type: 'EXPENSE', amount: 240.0, cat: 'Shopping', date: mMinus(1, 18), desc: 'Winter Jacket & Shoes', notes: 'Clothing', method: 'Card' },
    { type: 'EXPENSE', amount: 150.0, cat: 'Entertainment', date: mMinus(1, 22), desc: 'Weekend Dining & Cinema', notes: 'Dinner', method: 'Card' },

    // Two Months Ago (Month - 2)
    { type: 'INCOME', amount: 4800.0, cat: 'Salary', date: mMinus(2, 1), desc: 'Monthly Tech Salary', notes: 'Direct deposit', method: 'Bank Transfer' },
    { type: 'INCOME', amount: 400.0, cat: 'Gifts', date: mMinus(2, 20), desc: 'Birthday Gift', notes: 'Family gift', method: 'Cash' },
    { type: 'EXPENSE', amount: 1200.0, cat: 'Rent', date: mMinus(2, 2), desc: 'Apartment Monthly Rent', notes: 'Apartment 4B', method: 'Bank Transfer' },
    { type: 'EXPENSE', amount: 420.0, cat: 'Food', date: mMinus(2, 8), desc: 'Grocery Deliveries', notes: 'Bi-weekly stock up', method: 'Card' },
    { type: 'EXPENSE', amount: 180.0, cat: 'Transportation', date: mMinus(2, 14), desc: 'Fuel & Subway', notes: 'Commute', method: 'Card' },
    { type: 'EXPENSE', amount: 175.0, cat: 'Bills', date: mMinus(2, 17), desc: 'Electricity & Internet', notes: 'Utilities', method: 'Bank Transfer' },
    { type: 'EXPENSE', amount: 160.0, cat: 'Shopping', date: mMinus(2, 23), desc: 'Books & Electronics', notes: 'Tech gadgets', method: 'Card' },
  ];

  if (isUsingPostgres()) {
    // Save Budgets to Supabase
    for (const b of sampleBudgets) {
      await query(
        `INSERT INTO budgets (user_id, category_name, monthly_limit, budget_month, budget_year, alert_threshold)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, category_name, budget_month, budget_year)
         DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit, alert_threshold = EXCLUDED.alert_threshold`,
        [userId, b.cat, b.limit, b.month, b.year, b.threshold]
      );
    }

    // Save Transactions to Supabase
    for (const t of sampleTransactions) {
      await query(
        `INSERT INTO transactions (user_id, type, amount, category, date, description, notes, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, t.type, t.amount, t.cat, t.date, t.desc, t.notes, t.method]
      );
    }
  } else {
    const store = getMemoryStore();
    // Memory Store Budgets
    for (const b of sampleBudgets) {
      const existing = store.budgets.find(
        (eb) => eb.user_id === userId && eb.category_name.toLowerCase() === b.cat.toLowerCase() && eb.budget_month === b.month && eb.budget_year === b.year
      );
      if (existing) {
        existing.monthly_limit = b.limit;
        existing.alert_threshold = b.threshold;
      } else {
        store.budgets.push({
          id: store.nextIds.budgets++,
          user_id: userId,
          category_name: b.cat,
          monthly_limit: b.limit,
          budget_month: b.month,
          budget_year: b.year,
          alert_threshold: b.threshold,
          created_at: new Date().toISOString(),
        });
      }
    }

    // Memory Store Transactions
    for (const t of sampleTransactions) {
      store.transactions.push({
        id: store.nextIds.transactions++,
        user_id: userId,
        type: t.type,
        amount: t.amount,
        category: t.cat,
        date: t.date,
        description: t.desc,
        notes: t.notes,
        payment_method: t.method,
        created_at: new Date().toISOString(),
      });
    }
  }
}

export async function clearUserData(userId) {
  if (isUsingPostgres()) {
    await query('DELETE FROM transactions WHERE user_id = $1', [userId]);
    await query('DELETE FROM budgets WHERE user_id = $1', [userId]);
  } else {
    const store = getMemoryStore();
    store.transactions = store.transactions.filter((t) => t.user_id !== userId);
    store.budgets = store.budgets.filter((b) => b.user_id !== userId);
  }
}
