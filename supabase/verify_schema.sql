-- ==============================================================================
-- CENTRA FINTECH - SCHEMA VERIFICATION & CROSS-USER ISOLATION TEST SUITE
-- ==============================================================================
-- This script contains two test suites:
-- Part 1: Schema Structure & Integrity Checks (Static, non-destructive queries)
-- Part 2: Cross-User RLS Isolation & Immutability Trigger Test (Runs in a transaction that ends with ROLLBACK)
--
-- Instructions: Run this script in the Supabase SQL Editor after applying
-- 20261009000000_initial_schema.sql.
-- Look for "PASS" in the status column of all output tables.
-- ==============================================================================

-- ==============================================================================
-- PART 1: SCHEMA STRUCTURE & INTEGRITY CHECKS
-- ==============================================================================

WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'profiles', 'accounts', 'categories', 'transactions',
    'goals', 'budgets', 'notifications', 'settings'
  ]) AS table_name
),
table_rls_check AS (
  SELECT
    t.table_name,
    CASE WHEN c.relrowsecurity THEN 'PASS' ELSE 'FAIL: RLS NOT ENABLED' END AS status,
    'Row Level Security enabled' AS details
  FROM expected_tables t
  JOIN pg_class c ON c.relname = t.table_name
  JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
),
pk_checks AS (
  SELECT
    'accounts' AS table_name,
    CASE WHEN (
      SELECT string_agg(a.attname, ',' ORDER BY a.attnum)
      FROM pg_constraint con
      JOIN pg_class cl ON cl.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = ANY(con.conkey)
      WHERE ns.nspname = 'public' AND cl.relname = 'accounts' AND con.contype = 'p'
    ) = 'user_id,id' THEN 'PASS' ELSE 'FAIL: Expected PK (user_id, id)' END AS status,
    'Composite PK (user_id, id)' AS details
  UNION ALL
  SELECT
    'categories',
    CASE WHEN (
      SELECT string_agg(a.attname, ',' ORDER BY a.attnum)
      FROM pg_constraint con
      JOIN pg_class cl ON cl.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = ANY(con.conkey)
      WHERE ns.nspname = 'public' AND cl.relname = 'categories' AND con.contype = 'p'
    ) = 'user_id,id' THEN 'PASS' ELSE 'FAIL: Expected PK (user_id, id)' END,
    'Composite PK (user_id, id)'
  UNION ALL
  SELECT
    'transactions',
    CASE WHEN (
      SELECT string_agg(a.attname, ',' ORDER BY a.attnum)
      FROM pg_constraint con
      JOIN pg_class cl ON cl.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = ANY(con.conkey)
      WHERE ns.nspname = 'public' AND cl.relname = 'transactions' AND con.contype = 'p'
    ) = 'user_id,id' THEN 'PASS' ELSE 'FAIL: Expected PK (user_id, id)' END,
    'Composite PK (user_id, id)'
  UNION ALL
  SELECT
    'goals',
    CASE WHEN (
      SELECT string_agg(a.attname, ',' ORDER BY a.attnum)
      FROM pg_constraint con
      JOIN pg_class cl ON cl.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = ANY(con.conkey)
      WHERE ns.nspname = 'public' AND cl.relname = 'goals' AND con.contype = 'p'
    ) = 'user_id,id' THEN 'PASS' ELSE 'FAIL: Expected PK (user_id, id)' END,
    'Composite PK (user_id, id)'
  UNION ALL
  SELECT
    'budgets',
    CASE WHEN (
      SELECT string_agg(a.attname, ',' ORDER BY a.attnum)
      FROM pg_constraint con
      JOIN pg_class cl ON cl.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = ANY(con.conkey)
      WHERE ns.nspname = 'public' AND cl.relname = 'budgets' AND con.contype = 'p'
    ) = 'user_id,id' THEN 'PASS' ELSE 'FAIL: Expected PK (user_id, id)' END,
    'Composite PK (user_id, id)'
  UNION ALL
  SELECT
    'notifications',
    CASE WHEN (
      SELECT string_agg(a.attname, ',' ORDER BY a.attnum)
      FROM pg_constraint con
      JOIN pg_class cl ON cl.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = ANY(con.conkey)
      WHERE ns.nspname = 'public' AND cl.relname = 'notifications' AND con.contype = 'p'
    ) = 'user_id,id' THEN 'PASS' ELSE 'FAIL: Expected PK (user_id, id)' END,
    'Composite PK (user_id, id)'
  UNION ALL
  SELECT
    'settings',
    CASE WHEN (
      SELECT string_agg(a.attname, ',' ORDER BY a.attnum)
      FROM pg_constraint con
      JOIN pg_class cl ON cl.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = ANY(con.conkey)
      WHERE ns.nspname = 'public' AND cl.relname = 'settings' AND con.contype = 'p'
    ) = 'user_id' THEN 'PASS' ELSE 'FAIL: Expected PK (user_id)' END,
    'Single-row PK (user_id)'
),
constraint_checks AS (
  SELECT
    'categories' AS table_name,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_constraint con
      JOIN pg_class cl ON cl.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      WHERE ns.nspname = 'public' AND cl.relname = 'categories' AND con.conname = 'uq_categories_user_system_key'
    ) THEN 'PASS' ELSE 'FAIL: Missing unique (user_id, system_key)' END AS status,
    'Unique constraint uq_categories_user_system_key' AS details
  UNION ALL
  SELECT
    'transactions',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_constraint con
      JOIN pg_class cl ON cl.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      WHERE ns.nspname = 'public' AND cl.relname = 'transactions' AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%amount > 0%'
    ) THEN 'PASS' ELSE 'FAIL: Missing CHECK (amount > 0)' END,
    'Check constraint (amount > 0)'
  UNION ALL
  SELECT
    'budgets',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_constraint con
      JOIN pg_class cl ON cl.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      WHERE ns.nspname = 'public' AND cl.relname = 'budgets' AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%monthly%'
      AND pg_get_constraintdef(con.oid) LIKE '%weekly%'
    ) THEN 'PASS' ELSE 'FAIL: Missing CHECK period IN (monthly, weekly)' END,
    'Check constraint period IN (monthly, weekly)'
)
SELECT 'RLS Check' AS category, table_name, status, details FROM table_rls_check
UNION ALL
SELECT 'Primary Key Check', table_name, status, details FROM pk_checks
UNION ALL
SELECT 'Constraint Check', table_name, status, details FROM constraint_checks
ORDER BY category, table_name;


-- ==============================================================================
-- PART 2: CROSS-USER ISOLATION & TRIGGER TEST (RUNS IN ROLLBACK TRANSACTION)
-- ==============================================================================
-- This test runs inside an isolated transaction. It creates two mock users,
-- simulates User A inserting data, switches role & JWT to User B, and tests:
--   1. User B reads User A data -> Returns 0 rows (PASS)
--   2. User B updates User A data -> Updates 0 rows (PASS)
--   3. User B deletes User A data -> Deletes 0 rows (PASS)
--   4. User B attempts client update to is_pro -> Trigger rejects with error (PASS)
--   5. User B attempts onboarding_completed revert (true -> false) -> Trigger forces true (PASS)
--
-- The transaction ends with ROLLBACK so no temporary data persists in your database.
-- ==============================================================================

BEGIN;

CREATE TEMP TABLE IF NOT EXISTS _isolation_test_results (
  test_num INT,
  test_name TEXT,
  expected TEXT,
  actual TEXT,
  status TEXT
) ON COMMIT DROP;

DO $$
DECLARE
  v_user_a UUID := 'a0000000-0000-4000-8000-000000000001'::uuid;
  v_user_b UUID := 'b0000000-0000-4000-8000-000000000002'::uuid;
  v_count INT;
  v_updated INT;
  v_deleted INT;
  v_err_caught BOOLEAN := FALSE;
  v_onboarding_val BOOLEAN;
BEGIN
  -- ----------------------------------------------------------------------------
  -- Step 1: Create two fake users in auth.users
  -- (Trigger on_auth_user_created automatically provisions profiles and settings)
  -- ----------------------------------------------------------------------------
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES
  (
    v_user_a,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'usera@centra.test',
    '',
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"name": "User Alpha"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    v_user_b,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'userb@centra.test',
    '',
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"name": "User Beta"}'::jsonb,
    NOW(),
    NOW()
  );

  -- ----------------------------------------------------------------------------
  -- Step 2: Switch to authenticated role as User A and insert sample records
  -- ----------------------------------------------------------------------------
  EXECUTE 'SET LOCAL ROLE authenticated';
  PERFORM set_config('request.jwt.claims', format('{"sub": "%s", "role": "authenticated"}', v_user_a), true);
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- User A inserts account
  INSERT INTO public.accounts (user_id, id, name, type, balance, currency)
  VALUES (v_user_a, 'acc_a_1', 'Alpha Main Checking', 'checking', 1500.00, 'BDT');

  -- User A inserts category
  INSERT INTO public.categories (user_id, id, system_key, name, icon, color, type)
  VALUES (v_user_a, 'cat_a_1', 'food_dining', 'Food & Dining', 'Utensils', '#FF7675', 'expense');

  -- User A inserts transaction
  INSERT INTO public.transactions (
    user_id, id, type, amount, currency,
    category_id, category_name, category_icon, category_color,
    account_id, account_name, date
  ) VALUES (
    v_user_a, 'tx_a_1', 'expense', 120.00, 'BDT',
    'cat_a_1', 'Food & Dining', 'Utensils', '#FF7675',
    'acc_a_1', 'Alpha Main Checking', NOW()
  );

  -- User A inserts goal
  INSERT INTO public.goals (user_id, id, name, target_amount, target_date)
  VALUES (v_user_a, 'goal_a_1', 'Alpha Emergency Fund', 5000.00, CURRENT_DATE + INTERVAL '1 year');

  -- User A inserts budget
  INSERT INTO public.budgets (user_id, id, category_id, category_name, category_icon, category_color, limit_amount, period)
  VALUES (v_user_a, 'bud_a_1', 'cat_a_1', 'Food & Dining', 'Utensils', '#FF7675', 500.00, 'monthly');

  -- User A inserts notification
  INSERT INTO public.notifications (user_id, id, type, title, message)
  VALUES (v_user_a, 'notif_a_1', 'info', 'Alpha Welcome', 'Hello Alpha');

  -- ----------------------------------------------------------------------------
  -- Step 3: Verify User A can see their own rows (Baseline check)
  -- ----------------------------------------------------------------------------
  SELECT count(*) INTO v_count FROM public.accounts WHERE user_id = v_user_a;
  INSERT INTO _isolation_test_results VALUES (
    1, 'User A reads own accounts', '1 row visible', format('%s row(s) visible', v_count),
    CASE WHEN v_count = 1 THEN 'PASS' ELSE 'FAIL' END
  );

  -- ----------------------------------------------------------------------------
  -- Step 4: Switch context to User B
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', format('{"sub": "%s", "role": "authenticated"}', v_user_b), true);
  PERFORM set_config('request.jwt.claim.sub', v_user_b::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- ----------------------------------------------------------------------------
  -- Step 5: Test Cross-User Isolation (User B reads User A's data)
  -- ----------------------------------------------------------------------------
  -- Accounts
  SELECT count(*) INTO v_count FROM public.accounts WHERE user_id = v_user_a;
  INSERT INTO _isolation_test_results VALUES (
    2, 'User B SELECT on User A accounts', '0 rows visible', format('%s row(s) visible', v_count),
    CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END
  );

  -- Profiles
  SELECT count(*) INTO v_count FROM public.profiles WHERE id = v_user_a;
  INSERT INTO _isolation_test_results VALUES (
    3, 'User B SELECT on User A profile', '0 rows visible', format('%s row(s) visible', v_count),
    CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END
  );

  -- Categories
  SELECT count(*) INTO v_count FROM public.categories WHERE user_id = v_user_a;
  INSERT INTO _isolation_test_results VALUES (
    4, 'User B SELECT on User A categories', '0 rows visible', format('%s row(s) visible', v_count),
    CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END
  );

  -- Transactions
  SELECT count(*) INTO v_count FROM public.transactions WHERE user_id = v_user_a;
  INSERT INTO _isolation_test_results VALUES (
    5, 'User B SELECT on User A transactions', '0 rows visible', format('%s row(s) visible', v_count),
    CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END
  );

  -- Goals
  SELECT count(*) INTO v_count FROM public.goals WHERE user_id = v_user_a;
  INSERT INTO _isolation_test_results VALUES (
    6, 'User B SELECT on User A goals', '0 rows visible', format('%s row(s) visible', v_count),
    CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END
  );

  -- Budgets
  SELECT count(*) INTO v_count FROM public.budgets WHERE user_id = v_user_a;
  INSERT INTO _isolation_test_results VALUES (
    7, 'User B SELECT on User A budgets', '0 rows visible', format('%s row(s) visible', v_count),
    CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END
  );

  -- Notifications
  SELECT count(*) INTO v_count FROM public.notifications WHERE user_id = v_user_a;
  INSERT INTO _isolation_test_results VALUES (
    8, 'User B SELECT on User A notifications', '0 rows visible', format('%s row(s) visible', v_count),
    CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END
  );

  -- Settings
  SELECT count(*) INTO v_count FROM public.settings WHERE user_id = v_user_a;
  INSERT INTO _isolation_test_results VALUES (
    9, 'User B SELECT on User A settings', '0 rows visible', format('%s row(s) visible', v_count),
    CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END
  );

  -- ----------------------------------------------------------------------------
  -- Step 6: Test Cross-User Mutation Prevention (User B updates/deletes User A)
  -- ----------------------------------------------------------------------------
  -- User B tries to update User A's accounts
  UPDATE public.accounts SET balance = 999999.00 WHERE user_id = v_user_a;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  INSERT INTO _isolation_test_results VALUES (
    10, 'User B UPDATE on User A accounts', '0 rows affected', format('%s row(s) affected', v_updated),
    CASE WHEN v_updated = 0 THEN 'PASS' ELSE 'FAIL' END
  );

  -- User B tries to delete User A's accounts
  DELETE FROM public.accounts WHERE user_id = v_user_a;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  INSERT INTO _isolation_test_results VALUES (
    11, 'User B DELETE on User A accounts', '0 rows affected', format('%s row(s) affected', v_deleted),
    CASE WHEN v_deleted = 0 THEN 'PASS' ELSE 'FAIL' END
  );

  -- User B tries to update User A's profile
  UPDATE public.profiles SET name = 'Attacker Named' WHERE id = v_user_a;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  INSERT INTO _isolation_test_results VALUES (
    12, 'User B UPDATE on User A profile', '0 rows affected', format('%s row(s) affected', v_updated),
    CASE WHEN v_updated = 0 THEN 'PASS' ELSE 'FAIL' END
  );

  -- ----------------------------------------------------------------------------
  -- Step 7: Test is_pro Immutability Trigger
  -- (User B attempts to upgrade their own is_pro as authenticated client)
  -- ----------------------------------------------------------------------------
  v_err_caught := FALSE;
  BEGIN
    UPDATE public.profiles SET is_pro = TRUE WHERE id = v_user_b;
  EXCEPTION
    WHEN OTHERS THEN
      v_err_caught := TRUE;
  END;

  INSERT INTO _isolation_test_results VALUES (
    13, 'User B modifies is_pro (client role)', 'Exception thrown',
    CASE WHEN v_err_caught THEN 'Exception thrown' ELSE 'Allowed (VULNERABILITY!)' END,
    CASE WHEN v_err_caught THEN 'PASS' ELSE 'FAIL' END
  );

  -- ----------------------------------------------------------------------------
  -- Step 8: Test onboarding_completed Downgrade Protection Trigger
  -- (User B completes onboarding: true -> attempts revert to false)
  -- ----------------------------------------------------------------------------
  -- Legitimate update: false -> true
  UPDATE public.profiles SET onboarding_completed = TRUE WHERE id = v_user_b;

  -- Attempted illegal downgrade: true -> false
  UPDATE public.profiles SET onboarding_completed = FALSE WHERE id = v_user_b;

  SELECT onboarding_completed INTO v_onboarding_val FROM public.profiles WHERE id = v_user_b;
  INSERT INTO _isolation_test_results VALUES (
    14, 'Downgrade onboarding_completed true->false', 'Remains true',
    CASE WHEN v_onboarding_val = TRUE THEN 'Remains true' ELSE 'Reverted to false (FAIL)' END,
    CASE WHEN v_onboarding_val = TRUE THEN 'PASS' ELSE 'FAIL' END
  );

END $$;

-- Display all test results
SELECT
  test_num,
  test_name,
  expected,
  actual,
  status
FROM _isolation_test_results
ORDER BY test_num;

-- Cleanly rollback the transaction so no test users or modifications persist
ROLLBACK;
