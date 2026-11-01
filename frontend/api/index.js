import healthHandler from './_handlers/health.js';
import {
  registerHandler,
  loginHandler,
  meHandler,
  updateProfileHandler,
  changePasswordHandler,
  seedDemoDataHandler,
  clearDataHandler,
} from './_handlers/auth.js';
import { transactionsHandler, transactionsAllHandler } from './_handlers/transactions.js';
import { budgetsHandler } from './_handlers/budgets.js';
import { dashboardStatsHandler } from './_handlers/dashboard.js';
import { reportsAnalyticsHandler, reportsCsvHandler } from './_handlers/reports.js';
import { categoriesHandler } from './_handlers/categories.js';

export default async function handler(req, res) {
  // CORS & Options Preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse path and query
  const rawUrl = req.url || '';
  const parsed = new URL(rawUrl, 'http://localhost');
  let pathname = parsed.pathname;

  // Normalize path by removing trailing slash
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // Ensure query parameters are attached to req.query
  if (!req.query) {
    req.query = Object.fromEntries(parsed.searchParams);
  } else {
    for (const [key, value] of parsed.searchParams) {
      if (!(key in req.query)) {
        req.query[key] = value;
      }
    }
  }

  // 1. Health
  if (pathname === '/api/health' || pathname === '/health') {
    return healthHandler(req, res);
  }

  // 2. Auth Routes
  if (pathname === '/api/auth/register') return registerHandler(req, res);
  if (pathname === '/api/auth/login') return loginHandler(req, res);
  if (pathname === '/api/auth/me') return meHandler(req, res);
  if (pathname === '/api/auth/update-profile') return updateProfileHandler(req, res);
  if (pathname === '/api/auth/change-password') return changePasswordHandler(req, res);
  if (pathname === '/api/auth/seed-demo-data') return seedDemoDataHandler(req, res);
  if (pathname === '/api/auth/clear-data') return clearDataHandler(req, res);

  // 3. Transactions
  if (pathname === '/api/transactions/all') return transactionsAllHandler(req, res);
  const txMatch = pathname.match(/^\/api\/transactions\/([^/]+)$/);
  if (txMatch) {
    return transactionsHandler(req, res, txMatch[1]);
  }
  if (pathname === '/api/transactions') {
    return transactionsHandler(req, res);
  }

  // 4. Budgets
  const budgetMatch = pathname.match(/^\/api\/budgets\/([^/]+)$/);
  if (budgetMatch) {
    return budgetsHandler(req, res, budgetMatch[1]);
  }
  if (pathname === '/api/budgets') {
    return budgetsHandler(req, res);
  }

  // 5. Dashboard
  if (pathname === '/api/dashboard/stats') {
    return dashboardStatsHandler(req, res);
  }

  // 6. Reports
  if (pathname === '/api/reports/analytics') return reportsAnalyticsHandler(req, res);
  if (pathname === '/api/reports/export/csv') return reportsCsvHandler(req, res);

  // 7. Categories
  const catMatch = pathname.match(/^\/api\/categories\/([^/]+)$/);
  if (catMatch) {
    return categoriesHandler(req, res, catMatch[1]);
  }
  if (pathname === '/api/categories') {
    return categoriesHandler(req, res);
  }

  return res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${pathname}`,
  });
}
