import { query, isUsingPostgres, getMemoryStore } from '../../_lib/db.js';
import { authenticate } from '../../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let user;
  try {
    user = await authenticate(req);
  } catch (err) {
    return res.status(err.status || 401).json({ success: false, message: err.message });
  }

  try {
    let txs = [];

    if (isUsingPostgres()) {
      const dataRes = await query(
        `SELECT id, type, amount, category, TO_CHAR(date, 'YYYY-MM-DD') as date, description, notes, payment_method
         FROM transactions
         WHERE user_id = $1
         ORDER BY date DESC, id DESC`,
        [user.id]
      );
      txs = dataRes.rows;
    } else {
      const store = getMemoryStore();
      txs = store.transactions
        .filter((t) => t.user_id === user.id)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
    }

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    let csv = 'Transaction ID,Date,Type,Category,Amount,Currency,Description,Payment Method,Notes\n';

    for (const t of txs) {
      csv += `${t.id},${t.date},${t.type},${escapeCsv(t.category)},${parseFloat(t.amount).toFixed(2)},${user.currency || 'USD'},${escapeCsv(t.description)},${escapeCsv(t.payment_method || t.paymentMethod || 'Card')},${escapeCsv(t.notes || '')}\n`;
    }

    const filename = `finflow_transactions_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=UTF-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (err) {
    console.error('Export CSV error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export CSV: ' + err.message });
  }
}
