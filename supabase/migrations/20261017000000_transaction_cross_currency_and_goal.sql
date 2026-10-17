-- Migration: 20261017000000_transaction_cross_currency_and_goal.sql
-- Additive, non-destructive migration for cross-currency transfers, exchange rate auditing, and goal linkage.
-- All columns are nullable with IF NOT EXISTS to ensure safe, idempotent application.

-- 1. TRANSACTIONS TABLE ADDITIONS
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS to_account_id TEXT,
  ADD COLUMN IF NOT EXISTS converted_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(18,6),
  ADD COLUMN IF NOT EXISTS goal_id TEXT;

-- 2. BUDGETS TABLE ADDITIONS
-- Allows a budget to specify an explicit currency; if NULL, falls back to the user's base currency
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS currency TEXT;
