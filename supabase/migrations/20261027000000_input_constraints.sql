-- =============================================================================
-- Migration: 20261027000000_input_constraints.sql
-- Description: Add length CHECK constraints (NOT VALID) for user input columns.
-- Target Columns:
--   - public.profiles.name (max 80)
--   - public.accounts.name (max 60)
--   - public.categories.name (max 60)
--   - public.goals.name (max 60)
--   - public.budgets.category_name (max 60)
--   - public.transactions.merchant (max 60)
--   - public.transactions.note (max 500)
--
-- Idempotent & Additive: Uses pg_constraint checks and NOT VALID so existing
-- rows cannot cause migration failures. Character-class constraints are intentionally
-- omitted from SQL to avoid Unicode collation/script discrepancies.
--
-- IMPORTANT: DO NOT RUN THIS MIGRATION AUTOMATICALLY AGAINST THE PRODUCTION DATABASE.
-- =============================================================================

-- 1. Profiles Name constraint (<= 80 chars)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_profiles_name_length'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT check_profiles_name_length
      CHECK (length(name) <= 80) NOT VALID;
  END IF;
END $$;

-- 2. Accounts Name constraint (<= 60 chars)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_accounts_name_length'
  ) THEN
    ALTER TABLE public.accounts
      ADD CONSTRAINT check_accounts_name_length
      CHECK (length(name) <= 60) NOT VALID;
  END IF;
END $$;

-- 3. Categories Name constraint (<= 60 chars)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_categories_name_length'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT check_categories_name_length
      CHECK (length(name) <= 60) NOT VALID;
  END IF;
END $$;

-- 4. Goals Name constraint (<= 60 chars)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_goals_name_length'
  ) THEN
    ALTER TABLE public.goals
      ADD CONSTRAINT check_goals_name_length
      CHECK (length(name) <= 60) NOT VALID;
  END IF;
END $$;

-- 5. Budgets Category Name constraint (<= 60 chars)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_budgets_category_name_length'
  ) THEN
    ALTER TABLE public.budgets
      ADD CONSTRAINT check_budgets_category_name_length
      CHECK (length(category_name) <= 60) NOT VALID;
  END IF;
END $$;

-- 6. Transactions Merchant constraint (<= 60 chars)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_transactions_merchant_length'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT check_transactions_merchant_length
      CHECK (merchant IS NULL OR length(merchant) <= 60) NOT VALID;
  END IF;
END $$;

-- 7. Transactions Note constraint (<= 500 chars)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_transactions_note_length'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT check_transactions_note_length
      CHECK (note IS NULL OR length(note) <= 500) NOT VALID;
  END IF;
END $$;

-- =============================================================================
-- INSTRUCTION FOR OPERATOR:
--
-- The constraints above were added as NOT VALID to ensure zero downtime and to
-- guarantee that existing rows do not block the migration.
--
-- Before validating these constraints, audit any existing data that violates them:
--   SELECT id, name FROM public.profiles WHERE length(name) > 80;
--   SELECT user_id, id, name FROM public.accounts WHERE length(name) > 60;
--   SELECT user_id, id, name FROM public.categories WHERE length(name) > 60;
--   SELECT user_id, id, name FROM public.goals WHERE length(name) > 60;
--   SELECT user_id, id, category_name FROM public.budgets WHERE length(category_name) > 60;
--   SELECT user_id, id, merchant FROM public.transactions WHERE length(merchant) > 60;
--   SELECT user_id, id, note FROM public.transactions WHERE length(note) > 500;
--
-- After verifying (and remediating if necessary) existing records, run:
--   ALTER TABLE public.profiles VALIDATE CONSTRAINT check_profiles_name_length;
--   ALTER TABLE public.accounts VALIDATE CONSTRAINT check_accounts_name_length;
--   ALTER TABLE public.categories VALIDATE CONSTRAINT check_categories_name_length;
--   ALTER TABLE public.goals VALIDATE CONSTRAINT check_goals_name_length;
--   ALTER TABLE public.budgets VALIDATE CONSTRAINT check_budgets_category_name_length;
--   ALTER TABLE public.transactions VALIDATE CONSTRAINT check_transactions_merchant_length;
--   ALTER TABLE public.transactions VALIDATE CONSTRAINT check_transactions_note_length;
-- =============================================================================
