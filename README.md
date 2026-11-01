# FinFlow — Personal Finance Tracker (Full-Stack SaaS)

FinFlow is a modern, responsive, production-ready **Personal Finance & Budget Tracker** web application built with **React + Vite + Tailwind CSS** and powered by **Node.js Serverless Functions on Vercel** backed by **Supabase PostgreSQL**.

The application is engineered to run **100% online 24/7 on Vercel** without requiring your local computer to stay on, with zero Render maintenance or cold sleeps.

---

## 🌟 Key Features

- **Authentication & Security:**
  - Stateless JWT authentication with 24-hour expiration.
  - BCrypt password hashing and cryptographic token verification.
  - Strict multi-tenant data isolation (users access only their own transactions, budgets, and reports).
  - Instant 1-Click **Demo Account** for live evaluation.
- **Financial Dashboard:**
  - Executive summary: Total Net Balance, Total Income, Total Expenses, and Monthly Savings Rate.
  - Month-over-month (MoM) cash flow velocity indicators.
  - Interactive **Recharts** Area Chart showing 6-month cash flow trends.
  - Expense concentration Donut Chart with color-coded category legends.
  - Real-time Budget Progress Alert widget.
  - Recent transactions table with instant actions.
- **Income Management:**
  - Dedicated inflow tracking for Salary, Freelance, Investments, Business, Gifts, and Other.
  - Inflow statistics, date tracking, descriptions, and payment method tags.
- **Expense Management:**
  - Standard categories: *Food, Shopping, Transportation, Education, Healthcare, Entertainment, Rent, Bills, Other*.
  - Category filters, date ranges, and notes.
- **Budget & Spending Limits:**
  - Monthly category spending caps with live progress bars:
    - 🟢 **Green (< 80%):** On Track
    - 🟡 **Amber (80% - 99%):** Warning Threshold Reached
    - 🔴 **Red (>= 100%):** Budget Exceeded
  - Month & Year selector for reviewing historical budgets.
- **Reports & Analytics:**
  - Weekly, Monthly, and Yearly time lenses.
  - Income vs. Expense side-by-side bar comparison.
  - Top spending category detection and daily average outflow.
  - One-click **CSV Statement Export** formatted to RFC 4180.
- **Design & UX:**
  - Minimal SaaS interface with emerald green (`#10B981`) and dark navy accents.
  - Full **Dark Mode** and **Light Mode** toggle with persistent local storage.
  - Multi-currency support (`USD`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`, `JPY`).

---

## 🏗️ Technology Architecture

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Recharts, Axios, React Router v7, Lucide Icons |
| **Serverless Backend** | Node.js Vercel Serverless Functions (`/api`), JWT, BCrypt, `pg` Connection Pooling |
| **Cloud Database** | PostgreSQL hosted on **Supabase** (with SSL and automated table creation) |
| **Hosting Platform** | **Vercel** (Global Edge CDN + Serverless Runtime) |
| **Legacy Spring Boot Backend** | Preserved in `backend/` for Java Spring Boot 3.4.x / Docker deployments |

---

## 🚀 Running Locally

```bash
cd frontend

# Install dependencies
npm install

# Start the unified local dev server (Frontend + Serverless APIs)
npm run dev
```

Open your browser at **`http://localhost:3000`**. The Vite server automatically executes the serverless functions in `api/` directly in Node.js.

---

## 🌐 Deploying Online to Vercel (Step-by-Step)

### Step 1: Set Up Cloud Database on Supabase
1. Create a free account at [Supabase](https://supabase.com) and create a new project.
2. In your Supabase Dashboard, navigate to **Project Settings** $\rightarrow$ **Database**.
3. Under **Connection string**, select **URI** (or **Nodejs**). Copy the connection URI:
   ```text
   postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
   ```
4. *(Optional)* Run the SQL script in [supabase_schema.sql](file:///d:/java%20project/supabase_schema.sql) in the **Supabase SQL Editor**. (Note: FinFlow also automatically verifies and initializes all tables on first connect).

---

### Step 2: Deploy to Vercel via GitHub (Recommended)
1. Push this project to your GitHub repository:
   ```bash
   git add .
   git commit -m "Deploy FinFlow Vercel-only personal finance tracker"
   git push origin main
   ```
2. Log in to [Vercel](https://vercel.com) and click **Add New** $\rightarrow$ **Project**.
3. Import your GitHub repository.
4. If importing the full repository, configure **Root Directory**:
   - Set **Root Directory** to `frontend`.
5. Under **Environment Variables**, configure:
   - `DATABASE_URL`: Your Supabase connection string.
   - `JWT_SECRET`: A secure random secret string (e.g. `finflow-prod-jwt-secret-key-2026`).
6. Click **Deploy**.

Vercel will build the React application and deploy the serverless functions in `api/`. Your app is now live 24/7 worldwide!

---

### Step 3: Instant 1-Click Vercel Claim Link
You can also immediately claim the existing active deployment directly to your Vercel account:
👉 **[Claim Deployment on Vercel](https://vercel.com/claim-deployment?code=570d15e2-2a2b-40d8-b72e-2895d153e55f)**

---

## 📡 REST API Reference

All routes are hosted on Vercel Serverless Functions under `/api`:

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | System health status & active database mode | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch active user profile | Yes |
| `PUT` | `/api/auth/update-profile` | Update display name & preferred currency | Yes |
| `PUT` | `/api/auth/change-password` | Update account password | Yes |
| `POST` | `/api/auth/seed-demo-data` | Seed realistic demo transactions & budgets | Yes |
| `POST` | `/api/auth/clear-data` | Erase all records for active account | Yes |
| `GET` | `/api/dashboard/stats` | Executive totals, MoM growth, trends | Yes |
| `GET` | `/api/transactions` | Filtered, sorted, paginated transactions | Yes |
| `POST` | `/api/transactions` | Create new income or expense record | Yes |
| `GET` | `/api/transactions/{id}` | Get transaction details | Yes |
| `PUT` | `/api/transactions/{id}` | Update existing transaction | Yes |
| `DELETE` | `/api/transactions/{id}` | Delete transaction | Yes |
| `GET` | `/api/budgets` | Fetch monthly category limits & spending | Yes |
| `POST` | `/api/budgets` | Create or update category spending limit | Yes |
| `DELETE` | `/api/budgets/{id}` | Delete category budget | Yes |
| `GET` | `/api/reports/analytics` | Weekly / monthly / yearly analytics | Yes |
| `GET` | `/api/reports/export/csv` | Download complete RFC 4180 CSV statement | Yes |

---

## 🔒 Security & Privacy Architecture
- **Strict Tenancy Isolation:** All queries filter strictly on `user_id`, preventing any cross-user access.
- **Cryptographic Security:** Passwords hashed with BCrypt (10 rounds); tokens verified with HMAC-SHA256.
- **SSL Enforced:** Cloud Supabase PostgreSQL connection enforced with SSL (`rejectUnauthorized: false`).
- **Zero Localhost Dependency:** Production builds use relative `/api` paths with zero hardcoded ports or localhost references.
