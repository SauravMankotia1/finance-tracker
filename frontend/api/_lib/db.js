import pg from 'pg';

const { Pool } = pg;

// Database Connection String from Environment Variables
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.POSTGRES_PRISMA_URL;

let pool = null;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

// In-Memory Fallback Store (used if no PostgreSQL database is connected yet)
const memoryStore = {
  users: [],
  transactions: [],
  budgets: [],
  categories: [
    { id: 1, name: 'Food', type: 'EXPENSE', icon: 'Utensils', color: '#EF4444', is_custom: false, user_id: null },
    { id: 2, name: 'Shopping', type: 'EXPENSE', icon: 'ShoppingBag', color: '#F59E0B', is_custom: false, user_id: null },
    { id: 3, name: 'Transportation', type: 'EXPENSE', icon: 'Car', color: '#3B82F6', is_custom: false, user_id: null },
    { id: 4, name: 'Education', type: 'EXPENSE', icon: 'GraduationCap', color: '#8B5CF6', is_custom: false, user_id: null },
    { id: 5, name: 'Healthcare', type: 'EXPENSE', icon: 'Activity', color: '#EC4899', is_custom: false, user_id: null },
    { id: 6, name: 'Entertainment', type: 'EXPENSE', icon: 'Film', color: '#06B6D4', is_custom: false, user_id: null },
    { id: 7, name: 'Rent', type: 'EXPENSE', icon: 'Home', color: '#10B981', is_custom: false, user_id: null },
    { id: 8, name: 'Bills', type: 'EXPENSE', icon: 'FileText', color: '#6366F1', is_custom: false, user_id: null },
    { id: 9, name: 'Other', type: 'EXPENSE', icon: 'MoreHorizontal', color: '#64748B', is_custom: false, user_id: null },
    { id: 10, name: 'Salary', type: 'INCOME', icon: 'Briefcase', color: '#10B981', is_custom: false, user_id: null },
    { id: 11, name: 'Freelance', type: 'INCOME', icon: 'Laptop', color: '#06B6D4', is_custom: false, user_id: null },
    { id: 12, name: 'Investments', type: 'INCOME', icon: 'TrendingUp', color: '#3B82F6', is_custom: false, user_id: null },
    { id: 13, name: 'Business', type: 'INCOME', icon: 'Building2', color: '#8B5CF6', is_custom: false, user_id: null },
    { id: 14, name: 'Gifts', type: 'INCOME', icon: 'Gift', color: '#EC4899', is_custom: false, user_id: null },
    { id: 15, name: 'Other Income', type: 'INCOME', icon: 'DollarSign', color: '#F59E0B', is_custom: false, user_id: null },
  ],
  nextIds: { users: 1, transactions: 1, budgets: 1, categories: 16 },
};

let schemaInitialized = false;

// Initialize Supabase PostgreSQL Schema Automatically
export async function initDbSchema() {
  if (!pool || schemaInitialized) return;

  const initSql = `
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      currency VARCHAR(10) DEFAULT 'USD',
      role VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER',
      created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categories (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL,
      icon VARCHAR(50),
      color VARCHAR(20),
      is_custom BOOLEAN DEFAULT FALSE,
      user_id BIGINT REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      date DATE NOT NULL,
      description VARCHAR(255) NOT NULL,
      notes TEXT,
      payment_method VARCHAR(50) DEFAULT 'Card',
      created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_name VARCHAR(100) NOT NULL,
      monthly_limit NUMERIC(12, 2) NOT NULL,
      budget_month INTEGER NOT NULL,
      budget_year INTEGER NOT NULL,
      alert_threshold INTEGER DEFAULT 80,
      created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      CONSTRAINT uk_user_cat_month_year UNIQUE (user_id, category_name, budget_month, budget_year)
    );

    CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_tx_user_type ON transactions(user_id, type);
    CREATE INDEX IF NOT EXISTS idx_budget_user_month_year ON budgets(user_id, budget_month, budget_year);
  `;

  try {
    await pool.query(initSql);
    schemaInitialized = true;
    console.log('[Supabase DB] Schema verified and initialized.');
  } catch (err) {
    console.error('[Supabase DB] Schema initialization error:', err.message);
  }
}

export async function query(text, params) {
  if (pool) {
    if (!schemaInitialized) {
      await initDbSchema();
    }
    return pool.query(text, params);
  }
  return null;
}

export function isUsingPostgres() {
  return !!pool;
}

export function getMemoryStore() {
  return memoryStore;
}
