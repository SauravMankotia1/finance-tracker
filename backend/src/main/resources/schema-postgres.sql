-- Personal Finance Tracker - PostgreSQL / Supabase Database Schema
-- Run this in your Supabase SQL Editor if you prefer manual table creation or migrations

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

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tx_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_tx_user_category ON transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_budget_user_month_year ON budgets(user_id, budget_month, budget_year);
