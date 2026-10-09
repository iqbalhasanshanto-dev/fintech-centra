-- ==============================================================================
-- CENTRA FINTECH - PRODUCTION DATABASE INITIAL MIGRATION
-- Self-contained, idempotent, and secure with Row Level Security (RLS)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. UPDATED_AT TRIGGER FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT DEFAULT NULL,
  is_pro BOOLEAN NOT NULL DEFAULT FALSE,
  plan_expiry TIMESTAMPTZ DEFAULT NULL,
  base_currency TEXT DEFAULT NULL,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. ACCOUNTS TABLE
-- Composite Primary Key: (user_id, id)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounts (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'cash')),
  balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'BDT',
  account_number_masked TEXT,
  bank_name TEXT,
  color TEXT DEFAULT '#6366F1',
  card_brand TEXT DEFAULT 'generic',
  is_primary BOOLEAN DEFAULT FALSE,
  credit_limit NUMERIC(14,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

-- ------------------------------------------------------------------------------
-- 3. CATEGORIES TABLE
-- Composite Primary Key: (user_id, id) + Unique (user_id, system_key)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  system_key TEXT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  budget_limit NUMERIC(14,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id),
  CONSTRAINT uq_categories_user_system_key UNIQUE (user_id, system_key)
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- ------------------------------------------------------------------------------
-- 4. TRANSACTIONS TABLE
-- Composite Primary Key: (user_id, id), CHECK (amount > 0)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'BDT',
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  category_icon TEXT NOT NULL,
  category_color TEXT NOT NULL,
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  to_account_id TEXT,
  recipient TEXT,
  merchant TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  tags TEXT[] DEFAULT '{}',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_interval TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  resulting_balance NUMERIC(14,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);

-- ------------------------------------------------------------------------------
-- 5. GOALS TABLE
-- Composite Primary Key: (user_id, id)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goals (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Target',
  color TEXT NOT NULL DEFAULT '#6366f1',
  target_amount NUMERIC(14,2) NOT NULL,
  current_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE NOT NULL,
  linked_account_id TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);

-- ------------------------------------------------------------------------------
-- 6. BUDGETS TABLE
-- Composite Primary Key: (user_id, id), CHECK constraints
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  category_icon TEXT NOT NULL,
  category_color TEXT NOT NULL,
  limit_amount NUMERIC(14,2) NOT NULL,
  spent_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  alert_threshold INTEGER NOT NULL DEFAULT 80 CHECK (alert_threshold >= 1 AND alert_threshold <= 100),
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('monthly', 'weekly')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);

-- ------------------------------------------------------------------------------
-- 7. NOTIFICATIONS TABLE
-- Composite Primary Key: (user_id, id)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  severity TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ------------------------------------------------------------------------------
-- 8. SETTINGS TABLE
-- One row per user: PRIMARY KEY (user_id), clean security JSON default
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  id TEXT,
  theme TEXT DEFAULT 'light',
  base_currency TEXT DEFAULT NULL,
  privacy_mode BOOLEAN DEFAULT FALSE,
  security JSONB DEFAULT '{"biometricEnabled": false, "pinLockEnabled": false}'::jsonb,
  notifications JSONB DEFAULT '{"transactionAlerts": true, "budgetOverruns": true, "securityAlerts": true, "billReminders": true, "weeklyDigest": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);

-- ------------------------------------------------------------------------------
-- 9. UPDATED_AT TRIGGERS FOR ALL TABLES
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_accounts_updated_at ON public.accounts;
CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_goals_updated_at ON public.goals;
CREATE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_budgets_updated_at ON public.budgets;
CREATE TRIGGER trg_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_notifications_updated_at ON public.notifications;
CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_settings_updated_at ON public.settings;
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 10. PRIVILEGE ENFORCEMENT & IMMUTABILITY TRIGGER ON PROFILES
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profiles_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Obtain caller's JWT role
  caller_role := COALESCE(
    current_setting('request.jwt.claim.role', true),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'role')
  );

  -- 1. If caller is normal authenticated client, block changes to is_pro and plan_expiry
  IF caller_role = 'authenticated' THEN
    IF NEW.is_pro IS DISTINCT FROM OLD.is_pro THEN
      RAISE EXCEPTION 'Clients are not permitted to modify is_pro.';
    END IF;
    IF NEW.plan_expiry IS DISTINCT FROM OLD.plan_expiry THEN
      RAISE EXCEPTION 'Clients are not permitted to modify plan_expiry.';
    END IF;
  END IF;

  -- 2. onboarding_completed can never transition from true back to false
  IF OLD.onboarding_completed = true AND NEW.onboarding_completed = false THEN
    NEW.onboarding_completed := true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profiles_columns ON public.profiles;
CREATE TRIGGER trg_protect_profiles_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profiles_columns();

-- ------------------------------------------------------------------------------
-- 11. HARDENED HANDLE_NEW_USER TRIGGER (AUTOMATED USER PROVISIONING)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_name TEXT;
  user_avatar TEXT;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  -- Insert blank profile row
  INSERT INTO public.profiles (
    id,
    name,
    email,
    avatar_url,
    base_currency,
    is_pro,
    plan_expiry,
    onboarding_completed,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    user_name,
    NEW.email,
    user_avatar,
    NULL,
    FALSE,
    NULL,
    FALSE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert default user settings row
  INSERT INTO public.settings (
    user_id,
    id,
    theme,
    base_currency,
    privacy_mode,
    security,
    notifications,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'settings_' || NEW.id::text,
    'light',
    NULL,
    FALSE,
    '{"biometricEnabled": false, "pinLockEnabled": false}'::jsonb,
    '{"transactionAlerts": true, "budgetOverruns": true, "securityAlerts": true, "billReminders": true, "weeklyDigest": true}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never raise error or block user creation in auth.users
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 12. BACKFILL FOR EXISTING AUTH.USERS (IDEMPOTENT)
-- ------------------------------------------------------------------------------
INSERT INTO public.profiles (
  id,
  name,
  email,
  avatar_url,
  base_currency,
  is_pro,
  plan_expiry,
  onboarding_completed,
  created_at,
  updated_at
)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  u.email,
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', NULL),
  NULL,
  FALSE,
  NULL,
  FALSE,
  NOW(),
  NOW()
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.settings (
  user_id,
  id,
  theme,
  base_currency,
  privacy_mode,
  security,
  notifications,
  created_at,
  updated_at
)
SELECT
  u.id,
  'settings_' || u.id::text,
  'light',
  NULL,
  FALSE,
  '{"biometricEnabled": false, "pinLockEnabled": false}'::jsonb,
  '{"transactionAlerts": true, "budgetOverruns": true, "securityAlerts": true, "billReminders": true, "weeklyDigest": true}'::jsonb,
  NOW(),
  NOW()
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 13. EXPLICIT PERMISSION GRANTS
-- ------------------------------------------------------------------------------
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.accounts FROM anon;
REVOKE ALL ON TABLE public.categories FROM anon;
REVOKE ALL ON TABLE public.transactions FROM anon;
REVOKE ALL ON TABLE public.goals FROM anon;
REVOKE ALL ON TABLE public.budgets FROM anon;
REVOKE ALL ON TABLE public.notifications FROM anon;
REVOKE ALL ON TABLE public.settings FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.settings TO authenticated;

-- ------------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = id AND
    is_pro = false AND
    plan_expiry IS NULL
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Accounts Policies
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
CREATE POLICY "Users can view their own accounts"
  ON public.accounts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.accounts;
CREATE POLICY "Users can insert their own accounts"
  ON public.accounts FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
CREATE POLICY "Users can update their own accounts"
  ON public.accounts FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;
CREATE POLICY "Users can delete their own accounts"
  ON public.accounts FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Categories Policies
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
CREATE POLICY "Users can view their own categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
CREATE POLICY "Users can insert their own categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
CREATE POLICY "Users can update their own categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;
CREATE POLICY "Users can delete their own categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Transactions Policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Goals Policies
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
CREATE POLICY "Users can view their own goals"
  ON public.goals FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own goals" ON public.goals;
CREATE POLICY "Users can insert their own goals"
  ON public.goals FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
CREATE POLICY "Users can update their own goals"
  ON public.goals FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own goals" ON public.goals;
CREATE POLICY "Users can delete their own goals"
  ON public.goals FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Budgets Policies
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
CREATE POLICY "Users can view their own budgets"
  ON public.budgets FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
CREATE POLICY "Users can insert their own budgets"
  ON public.budgets FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
CREATE POLICY "Users can update their own budgets"
  ON public.budgets FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;
CREATE POLICY "Users can delete their own budgets"
  ON public.budgets FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
CREATE POLICY "Users can insert their own notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Settings Policies (Including DELETE policy)
DROP POLICY IF EXISTS "Users can view their own settings" ON public.settings;
CREATE POLICY "Users can view their own settings"
  ON public.settings FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.settings;
CREATE POLICY "Users can insert their own settings"
  ON public.settings FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.settings;
CREATE POLICY "Users can update their own settings"
  ON public.settings FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own settings" ON public.settings;
CREATE POLICY "Users can delete their own settings"
  ON public.settings FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
