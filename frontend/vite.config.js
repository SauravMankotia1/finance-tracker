import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import url from 'url';
import path from 'path';

// Vite Plugin to run Vercel Serverless Functions during local `npm run dev`
function vercelApiDevPlugin() {
  return {
    name: 'vercel-api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api')) {
          return next();
        }

        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname.replace(/^\/api\/?/, '');
        req.query = parsedUrl.query;

        // Parse JSON body if present
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
          await new Promise((resolve) => {
            let data = '';
            req.on('data', (chunk) => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                req.body = data ? JSON.parse(data) : {};
              } catch {
                req.body = {};
              }
              resolve();
            });
          });
        }

        // Decorate response object with .status().json() and .send()
        res.status = function (code) {
          res.statusCode = code;
          return res;
        };
        res.json = function (obj) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(obj));
        };
        res.send = function (data) {
          res.end(data);
        };

        try {
          let targetFile = null;

          if (pathname === 'health') {
            targetFile = 'health.js';
          } else if (pathname === 'auth/register') {
            targetFile = 'auth/register.js';
          } else if (pathname === 'auth/login') {
            targetFile = 'auth/login.js';
          } else if (pathname === 'auth/me') {
            targetFile = 'auth/me.js';
          } else if (pathname === 'auth/update-profile') {
            targetFile = 'auth/update-profile.js';
          } else if (pathname === 'auth/change-password') {
            targetFile = 'auth/change-password.js';
          } else if (pathname === 'auth/seed-demo-data') {
            targetFile = 'auth/seed-demo-data.js';
          } else if (pathname === 'auth/clear-data') {
            targetFile = 'auth/clear-data.js';
          } else if (pathname === 'transactions') {
            targetFile = 'transactions/index.js';
          } else if (pathname === 'transactions/all') {
            targetFile = 'transactions/all.js';
          } else if (pathname.startsWith('transactions/')) {
            req.query.id = pathname.split('/')[1];
            targetFile = 'transactions/[id].js';
          } else if (pathname === 'budgets') {
            targetFile = 'budgets/index.js';
          } else if (pathname.startsWith('budgets/')) {
            req.query.id = pathname.split('/')[1];
            targetFile = 'budgets/[id].js';
          } else if (pathname === 'dashboard/stats') {
            targetFile = 'dashboard/stats.js';
          } else if (pathname === 'reports/analytics') {
            targetFile = 'reports/analytics.js';
          } else if (pathname === 'reports/export/csv') {
            targetFile = 'reports/export/csv.js';
          } else if (pathname === 'categories') {
            targetFile = 'categories/index.js';
          } else if (pathname.startsWith('categories/')) {
            req.query.id = pathname.split('/')[1];
            targetFile = 'categories/[id].js';
          }

          if (targetFile) {
            const absolutePath = path.resolve(process.cwd(), 'api', targetFile);
            const fileUrl = url.pathToFileURL(absolutePath).href + '?t=' + Date.now();
            const handlerModule = await import(fileUrl);
            if (handlerModule && handlerModule.default) {
              return await handlerModule.default(req, res);
            }
          }

          return res.status(404).json({ success: false, message: `Route /api/${pathname} not found` });
        } catch (err) {
          console.error('[API Dev Server Error]:', err);
          return res.status(500).json({ success: false, message: err.message });
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    vercelApiDevPlugin(),
  ],
  server: {
    port: 3000,
  },
});
