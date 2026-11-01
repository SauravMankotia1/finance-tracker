# FinFlow — Vercel Serverless & React + Vite Frontend

This directory contains the complete, deployable **Vercel-Only** Personal Finance Tracker application, combining the high-performance **React + Vite** frontend with built-in **Node.js Vercel Serverless Functions** (`/api`) connected to **Supabase PostgreSQL**.

---

## ⚡ Architecture Highlights

- **Vercel-Only Architecture:** Frontend and Backend live in a single unified project. No separate Spring Boot or Render server is required.
- **Node.js Serverless API (`api/`):** Full REST API implementing JWT authentication, transactions CRUD, budgets, dashboard analytics, and CSV streaming.
- **Supabase Cloud Database:** Connected via `DATABASE_URL` with SSL support and automated schema initialization (`initDbSchema`).
- **Memory Fallback Mode:** Zero-config fallback store ensures the app boots and previews immediately without crashing even before database credentials are set.
- **Local Dev Parity:** `npm run dev` executes the same serverless endpoints through custom Vite middleware without needing any secondary background services.

---

## 🚀 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local unified server (Frontend + Serverless Functions)
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## ☁️ Deploying to Vercel

### Option 1: One-Click Claim Link
If deployed via Vercel CLI temporary mode, claim your existing deployment into your Vercel account:
👉 [Claim Deployment on Vercel](https://vercel.com/claim-deployment?code=570d15e2-2a2b-40d8-b72e-2895d153e55f)

### Option 2: Deploy from GitHub (Recommended for 24/7 Production)
1. Push this project to your GitHub repository.
2. Go to [Vercel Dashboard](https://vercel.com/new) -> **Import Git Repository**.
3. If importing the full repository root, set **Root Directory** to `frontend`.
4. In **Environment Variables**, add:
   - `DATABASE_URL`: Your Supabase connection string (`postgresql://postgres.[ref]:[password]@...`)
   - `JWT_SECRET`: A secure random secret string
5. Click **Deploy**.
