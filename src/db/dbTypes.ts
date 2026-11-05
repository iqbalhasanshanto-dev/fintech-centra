/**
 * Database Row Interfaces
 * Matching schemas in supabase/migrations:
 * - 20261009000000_initial_schema.sql
 * - 20261017000000_transaction_cross_currency_and_goal.sql
 */

export interface ProfileRow {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  plan_expiry: string | null;
  base_currency: string | null;
  onboarding_completed: boolean;
  app_version?: string | null;
  platform?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AccountRow {
  user_id: string;
  id: string;
  name: string;
  type: string;
  balance: string | number;
  currency: string;
  account_number_masked?: string | null;
  bank_name?: string | null;
  color?: string | null;
  card_brand?: string | null;
  is_primary?: boolean | null;
  credit_limit?: string | number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryRow {
  user_id: string;
  id: string;
  system_key?: string | null;
  name: string;
  icon: string;
  color: string;
  type: string;
  budget_limit?: string | number | null;
  created_at?: string;
  updated_at?: string;
}

export interface TransactionRow {
  user_id: string;
  id: string;
  type: string;
  amount: string | number;
  currency: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  account_id: string;
  account_name: string;
  to_account_id?: string | null;
  converted_amount?: string | number | null;
  exchange_rate?: string | number | null;
  goal_id?: string | null;
  recipient?: string | null;
  merchant?: string | null;
  date: string;
  note?: string | null;
  tags?: string[] | null;
  is_recurring?: boolean | null;
  recurring_interval?: string | null;
  is_pinned?: boolean | null;
  resulting_balance?: string | number | null;
  created_at?: string;
  updated_at?: string;
}

export interface GoalRow {
  user_id: string;
  id: string;
  name: string;
  icon: string;
  color: string;
  target_amount: string | number;
  current_amount: string | number;
  start_date: string;
  target_date: string;
  linked_account_id?: string | null;
  is_completed?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetRow {
  user_id: string;
  id: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  limit_amount: string | number;
  spent_amount?: string | number | null;
  alert_threshold: number;
  period: string;
  currency?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationRow {
  user_id: string;
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  is_read?: boolean | null;
  action_url?: string | null;
  severity?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SettingsRow {
  user_id: string;
  id?: string | null;
  theme?: string | null;
  base_currency?: string | null;
  privacy_mode?: boolean | null;
  security?: {
    biometricEnabled?: boolean;
    pinLockEnabled?: boolean;
  } | null;
  notifications?: {
    transactionAlerts?: boolean;
    budgetOverruns?: boolean;
    securityAlerts?: boolean;
    billReminders?: boolean;
    weeklyDigest?: boolean;
  } | null;
  created_at?: string;
  updated_at?: string;
}
