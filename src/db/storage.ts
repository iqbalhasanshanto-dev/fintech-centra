import {
  UserProfile,
  Account,
  Transaction,
  Category,
  Goal,
  Budget,
  NotificationItem,
  AppSettings,
} from '../types';
import {
  INITIAL_USER,
  INITIAL_ACCOUNTS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_GOALS,
  INITIAL_BUDGETS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
} from './seedData';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const STORAGE_KEYS = {
  USER: 'centra_db_user_v2',
  ACCOUNTS: 'centra_db_accounts_v2',
  CATEGORIES: 'centra_db_categories_v2',
  TRANSACTIONS: 'centra_db_transactions_v2',
  GOALS: 'centra_db_goals_v2',
  BUDGETS: 'centra_db_budgets_v2',
  NOTIFICATIONS: 'centra_db_notifications_v2',
  SETTINGS: 'centra_db_settings_v2',
  AUTH_TOKEN: 'centra_db_auth_token_v2',
};

// In-memory / local cache
let cache = {
  user: safeGet<UserProfile>(STORAGE_KEYS.USER, INITIAL_USER),
  accounts: safeGet<Account[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS),
  categories: safeGet<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES),
  transactions: safeGet<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS),
  goals: safeGet<Goal[]>(STORAGE_KEYS.GOALS, INITIAL_GOALS),
  budgets: safeGet<Budget[]>(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS),
  notifications: safeGet<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
  settings: safeGet<AppSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS),
  authToken: safeGet<boolean>(STORAGE_KEYS.AUTH_TOKEN, true),
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (err) {
    console.warn(`Error reading localStorage key ${key}:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing localStorage key ${key}:`, err);
  }
}

// Helpers to get active authenticated user id
const getActiveUserId = (): string | null => {
  return cache.user?.id || null;
};

// Mappers: App Types <-> DB Schema
const mapAccountToDb = (acc: Account, userId: string) => ({
  id: acc.id,
  user_id: userId,
  name: acc.name,
  type: acc.type,
  balance: acc.balance,
  currency: acc.currency,
  account_number_masked: acc.accountNumberMasked,
  bank_name: acc.bankName,
  color: acc.color,
  card_brand: acc.cardBrand,
  is_primary: acc.isPrimary || false,
  credit_limit: acc.creditLimit || null,
  updated_at: new Date().toISOString(),
});

const mapAccountFromDb = (row: any): Account => ({
  id: row.id,
  name: row.name,
  type: row.type,
  balance: parseFloat(row.balance),
  currency: row.currency,
  accountNumberMasked: row.account_number_masked || '',
  bankName: row.bank_name || '',
  color: row.color || '#6366F1',
  cardBrand: row.card_brand || 'generic',
  isPrimary: !!row.is_primary,
  creditLimit: row.credit_limit ? parseFloat(row.credit_limit) : undefined,
});

const mapCategoryToDb = (cat: Category, userId: string) => ({
  id: cat.id,
  user_id: userId,
  name: cat.name,
  icon: cat.icon,
  color: cat.color,
  type: cat.type,
  budget_limit: cat.budgetLimit || null,
});

const mapCategoryFromDb = (row: any): Category => ({
  id: row.id,
  name: row.name,
  icon: row.icon,
  color: row.color,
  type: row.type,
  budgetLimit: row.budget_limit ? parseFloat(row.budget_limit) : undefined,
});

const mapTransactionToDb = (tx: Transaction, userId: string) => ({
  id: tx.id,
  user_id: userId,
  type: tx.type,
  amount: tx.amount,
  currency: tx.currency,
  category_id: tx.categoryId,
  category_name: tx.categoryName,
  category_icon: tx.categoryIcon,
  category_color: tx.categoryColor,
  account_id: tx.accountId,
  account_name: tx.accountName,
  to_account_id: tx.toAccountId || null,
  recipient: tx.recipient || null,
  merchant: tx.merchant || null,
  date: tx.date,
  note: tx.note || null,
  tags: tx.tags || [],
  is_recurring: tx.isRecurring || false,
  recurring_interval: tx.recurringInterval || null,
  is_pinned: tx.isPinned || false,
  resulting_balance: tx.resultingBalance !== undefined ? tx.resultingBalance : null,
});

const mapTransactionFromDb = (row: any): Transaction => ({
  id: row.id,
  type: row.type,
  amount: parseFloat(row.amount),
  currency: row.currency,
  categoryId: row.category_id,
  categoryName: row.category_name,
  categoryIcon: row.category_icon,
  categoryColor: row.category_color,
  accountId: row.account_id,
  accountName: row.account_name,
  toAccountId: row.to_account_id || undefined,
  recipient: row.recipient || undefined,
  merchant: row.merchant || undefined,
  date: row.date,
  note: row.note || undefined,
  tags: row.tags || [],
  isRecurring: !!row.is_recurring,
  recurringInterval: row.recurring_interval || undefined,
  isPinned: !!row.is_pinned,
  resultingBalance: row.resulting_balance !== null && row.resulting_balance !== undefined ? parseFloat(row.resulting_balance) : undefined,
});

const mapGoalToDb = (goal: Goal, userId: string) => ({
  id: goal.id,
  user_id: userId,
  name: goal.name,
  icon: goal.icon,
  color: goal.color,
  target_amount: goal.targetAmount,
  current_amount: goal.currentAmount,
  start_date: goal.startDate,
  target_date: goal.targetDate,
  linked_account_id: goal.linkedAccountId || null,
  is_completed: goal.isCompleted || false,
});

const mapGoalFromDb = (row: any): Goal => ({
  id: row.id,
  name: row.name,
  icon: row.icon,
  color: row.color,
  targetAmount: parseFloat(row.target_amount),
  currentAmount: parseFloat(row.current_amount),
  startDate: row.start_date,
  targetDate: row.target_date,
  linkedAccountId: row.linked_account_id || undefined,
  isCompleted: !!row.is_completed,
});

const mapBudgetToDb = (b: Budget, userId: string) => ({
  id: b.id,
  user_id: userId,
  category_id: b.categoryId,
  category_name: b.categoryName,
  category_icon: b.categoryIcon,
  category_color: b.categoryColor,
  limit_amount: b.limitAmount,
  spent_amount: b.spentAmount,
  alert_threshold: b.alertThreshold,
  period: b.period,
});

const mapBudgetFromDb = (row: any): Budget => ({
  id: row.id,
  categoryId: row.category_id,
  categoryName: row.category_name,
  categoryIcon: row.category_icon,
  categoryColor: row.category_color,
  limitAmount: parseFloat(row.limit_amount),
  spentAmount: parseFloat(row.spent_amount),
  alertThreshold: row.alert_threshold,
  period: row.period as any,
});

const mapNotificationToDb = (n: NotificationItem, userId: string) => ({
  id: n.id,
  user_id: userId,
  type: n.type,
  title: n.title,
  message: n.message,
  timestamp: n.timestamp,
  is_read: n.isRead,
  action_url: n.actionUrl || null,
  severity: n.severity || 'info',
});

const mapNotificationFromDb = (row: any): NotificationItem => ({
  id: row.id,
  type: row.type,
  title: row.title,
  message: row.message,
  timestamp: row.timestamp,
  isRead: !!row.is_read,
  actionUrl: row.action_url || undefined,
  severity: row.severity || 'info',
});

const mapSettingsToDb = (s: AppSettings, userId: string) => ({
  id: `settings_${userId}`,
  user_id: userId,
  theme: s.theme,
  base_currency: s.baseCurrency,
  privacy_mode: s.privacyMode,
  security: s.security,
  notifications: s.notifications,
  updated_at: new Date().toISOString(),
});

const mapSettingsFromDb = (row: any): AppSettings => ({
  theme: row.theme || 'light',
  baseCurrency: row.base_currency || 'BDT',
  privacyMode: !!row.privacy_mode,
  security: row.security || INITIAL_SETTINGS.security,
  notifications: row.notifications || INITIAL_SETTINGS.notifications,
});

export const CentraDB = {
  // Sync memory & local storage
  getUser: (): UserProfile => cache.user,
  saveUser: async (user: UserProfile) => {
    cache.user = user;
    safeSet(STORAGE_KEYS.USER, user);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: user.avatarUrl,
          base_currency: user.baseCurrency,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase saveUser sync failed:', err);
      }
    }
  },

  getAccounts: (): Account[] => cache.accounts,
  saveAccounts: async (accounts: Account[]) => {
    cache.accounts = accounts;
    safeSet(STORAGE_KEYS.ACCOUNTS, accounts);
    const userId = getActiveUserId();
    if (isSupabaseConfigured() && userId) {
      try {
        const rows = accounts.map(a => mapAccountToDb(a, userId));
        await supabase.from('accounts').upsert(rows);
      } catch (err) {
        console.warn('Supabase saveAccounts sync failed:', err);
      }
    }
  },

  getCategories: (): Category[] => cache.categories,
  saveCategories: async (categories: Category[]) => {
    cache.categories = categories;
    safeSet(STORAGE_KEYS.CATEGORIES, categories);
    const userId = getActiveUserId();
    if (isSupabaseConfigured() && userId) {
      try {
        const rows = categories.map(c => mapCategoryToDb(c, userId));
        await supabase.from('categories').upsert(rows);
      } catch (err) {
        console.warn('Supabase saveCategories sync failed:', err);
      }
    }
  },

  getTransactions: (): Transaction[] => cache.transactions,
  saveTransactions: async (txs: Transaction[]) => {
    cache.transactions = txs;
    safeSet(STORAGE_KEYS.TRANSACTIONS, txs);
    const userId = getActiveUserId();
    if (isSupabaseConfigured() && userId) {
      try {
        const rows = txs.map(t => mapTransactionToDb(t, userId));
        await supabase.from('transactions').upsert(rows);
      } catch (err) {
        console.warn('Supabase saveTransactions sync failed:', err);
      }
    }
  },

  getGoals: (): Goal[] => cache.goals,
  saveGoals: async (goals: Goal[]) => {
    cache.goals = goals;
    safeSet(STORAGE_KEYS.GOALS, goals);
    const userId = getActiveUserId();
    if (isSupabaseConfigured() && userId) {
      try {
        const rows = goals.map(g => mapGoalToDb(g, userId));
        await supabase.from('goals').upsert(rows);
      } catch (err) {
        console.warn('Supabase saveGoals sync failed:', err);
      }
    }
  },

  getBudgets: (): Budget[] => cache.budgets,
  saveBudgets: async (budgets: Budget[]) => {
    cache.budgets = budgets;
    safeSet(STORAGE_KEYS.BUDGETS, budgets);
    const userId = getActiveUserId();
    if (isSupabaseConfigured() && userId) {
      try {
        const rows = budgets.map(b => mapBudgetToDb(b, userId));
        await supabase.from('budgets').upsert(rows);
      } catch (err) {
        console.warn('Supabase saveBudgets sync failed:', err);
      }
    }
  },

  getNotifications: (): NotificationItem[] => cache.notifications,
  saveNotifications: async (notifs: NotificationItem[]) => {
    cache.notifications = notifs;
    safeSet(STORAGE_KEYS.NOTIFICATIONS, notifs);
    const userId = getActiveUserId();
    if (isSupabaseConfigured() && userId) {
      try {
        const rows = notifs.map(n => mapNotificationToDb(n, userId));
        await supabase.from('notifications').upsert(rows);
      } catch (err) {
        console.warn('Supabase saveNotifications sync failed:', err);
      }
    }
  },

  getSettings: (): AppSettings => cache.settings,
  saveSettings: async (settings: AppSettings) => {
    cache.settings = settings;
    safeSet(STORAGE_KEYS.SETTINGS, settings);
    const userId = getActiveUserId();
    if (isSupabaseConfigured() && userId) {
      try {
        await supabase.from('settings').upsert(mapSettingsToDb(settings, userId));
      } catch (err) {
        console.warn('Supabase saveSettings sync failed:', err);
      }
    }
  },

  getAuthSession: (): boolean => cache.authToken,
  saveAuthSession: (isLoggedIn: boolean) => {
    cache.authToken = isLoggedIn;
    safeSet(STORAGE_KEYS.AUTH_TOKEN, isLoggedIn);
  },

  // Seed remote and local data for a new or reset user
  seedUserData: async (userId: string, userEmail?: string, userName?: string) => {
    const userProfile: UserProfile = {
      ...INITIAL_USER,
      id: userId,
      email: userEmail || INITIAL_USER.email,
      name: userName || INITIAL_USER.name,
    };

    cache.user = userProfile;
    cache.accounts = INITIAL_ACCOUNTS;
    cache.categories = INITIAL_CATEGORIES;
    cache.transactions = INITIAL_TRANSACTIONS;
    cache.goals = INITIAL_GOALS;
    cache.budgets = INITIAL_BUDGETS;
    cache.notifications = INITIAL_NOTIFICATIONS;
    cache.settings = INITIAL_SETTINGS;

    safeSet(STORAGE_KEYS.USER, cache.user);
    safeSet(STORAGE_KEYS.ACCOUNTS, cache.accounts);
    safeSet(STORAGE_KEYS.CATEGORIES, cache.categories);
    safeSet(STORAGE_KEYS.TRANSACTIONS, cache.transactions);
    safeSet(STORAGE_KEYS.GOALS, cache.goals);
    safeSet(STORAGE_KEYS.BUDGETS, cache.budgets);
    safeSet(STORAGE_KEYS.NOTIFICATIONS, cache.notifications);
    safeSet(STORAGE_KEYS.SETTINGS, cache.settings);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          name: userProfile.name,
          email: userProfile.email,
          avatar_url: userProfile.avatarUrl,
          base_currency: userProfile.baseCurrency,
        });

        await supabase.from('accounts').upsert(INITIAL_ACCOUNTS.map(a => mapAccountToDb(a, userId)));
        await supabase.from('categories').upsert(INITIAL_CATEGORIES.map(c => mapCategoryToDb(c, userId)));
        await supabase.from('transactions').upsert(INITIAL_TRANSACTIONS.map(t => mapTransactionToDb(t, userId)));
        await supabase.from('goals').upsert(INITIAL_GOALS.map(g => mapGoalToDb(g, userId)));
        await supabase.from('budgets').upsert(INITIAL_BUDGETS.map(b => mapBudgetToDb(b, userId)));
        await supabase.from('notifications').upsert(INITIAL_NOTIFICATIONS.map(n => mapNotificationToDb(n, userId)));
        await supabase.from('settings').upsert(mapSettingsToDb(INITIAL_SETTINGS, userId));
      } catch (err) {
        console.warn('Error seeding Supabase rows:', err);
      }
    }
  },

  // Sync entire state from Supabase if user is logged in
  syncFromSupabase: async (userId: string, userEmail?: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) return false;

    try {
      // 1. Check if user profile exists
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!profileData) {
        // First login for this user: Seed initial rows!
        await CentraDB.seedUserData(userId, userEmail);
        return true;
      }

      // Profile exists: update user profile
      cache.user = {
        id: profileData.id,
        name: profileData.name || 'Centra User',
        email: profileData.email || userEmail || '',
        avatarUrl: profileData.avatar_url || INITIAL_USER.avatarUrl,
        baseCurrency: (profileData.base_currency as any) || 'BDT',
        createdAt: profileData.created_at || new Date().toISOString(),
      };
      safeSet(STORAGE_KEYS.USER, cache.user);

      // 2. Fetch Accounts
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId);

      if (accountsData && accountsData.length > 0) {
        cache.accounts = accountsData.map(mapAccountFromDb);
        safeSet(STORAGE_KEYS.ACCOUNTS, cache.accounts);
      }

      // 3. Fetch Categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

      if (categoriesData && categoriesData.length > 0) {
        cache.categories = categoriesData.map(mapCategoryFromDb);
        safeSet(STORAGE_KEYS.CATEGORIES, cache.categories);
      }

      // 4. Fetch Transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (txData && txData.length > 0) {
        cache.transactions = txData.map(mapTransactionFromDb);
        safeSet(STORAGE_KEYS.TRANSACTIONS, cache.transactions);
      }

      // 5. Fetch Goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId);

      if (goalsData && goalsData.length > 0) {
        cache.goals = goalsData.map(mapGoalFromDb);
        safeSet(STORAGE_KEYS.GOALS, cache.goals);
      }

      // 6. Fetch Budgets
      const { data: budgetsData } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);

      if (budgetsData && budgetsData.length > 0) {
        cache.budgets = budgetsData.map(mapBudgetFromDb);
        safeSet(STORAGE_KEYS.BUDGETS, cache.budgets);
      }

      // 7. Fetch Notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (notifData && notifData.length > 0) {
        cache.notifications = notifData.map(mapNotificationFromDb);
        safeSet(STORAGE_KEYS.NOTIFICATIONS, cache.notifications);
      }

      // 8. Fetch Settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (settingsData) {
        cache.settings = mapSettingsFromDb(settingsData);
        safeSet(STORAGE_KEYS.SETTINGS, cache.settings);
      }

      return true;
    } catch (err) {
      console.warn('Error syncing from Supabase:', err);
      return false;
    }
  },

  resetToSeedData: async () => {
    const userId = getActiveUserId() || 'usr_centra_01';
    await CentraDB.seedUserData(userId);
    cache.authToken = true;
    safeSet(STORAGE_KEYS.AUTH_TOKEN, true);
  },

  exportAllData: () => {
    return JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      user: CentraDB.getUser(),
      accounts: CentraDB.getAccounts(),
      categories: CentraDB.getCategories(),
      transactions: CentraDB.getTransactions(),
      goals: CentraDB.getGoals(),
      budgets: CentraDB.getBudgets(),
      notifications: CentraDB.getNotifications(),
      settings: CentraDB.getSettings(),
    }, null, 2);
  },

  exportTransactionsCSV: (): string => {
    const txs = CentraDB.getTransactions();
    const headers = ['ID', 'Date', 'Type', 'Merchant', 'Category', 'Account', 'Amount', 'Currency', 'Note', 'Tags'];
    const rows = txs.map(t => [
      t.id,
      t.date,
      t.type,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      `"${t.categoryName.replace(/"/g, '""')}"`,
      `"${t.accountName.replace(/"/g, '""')}"`,
      t.amount,
      t.currency,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      `"${(t.tags || []).join(';')}"`,
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
};
