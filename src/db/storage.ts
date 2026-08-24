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

const STORAGE_KEYS = {
  USER: 'centra_db_user_v1',
  ACCOUNTS: 'centra_db_accounts_v1',
  CATEGORIES: 'centra_db_categories_v1',
  TRANSACTIONS: 'centra_db_transactions_v1',
  GOALS: 'centra_db_goals_v1',
  BUDGETS: 'centra_db_budgets_v1',
  NOTIFICATIONS: 'centra_db_notifications_v1',
  SETTINGS: 'centra_db_settings_v1',
  AUTH_TOKEN: 'centra_db_auth_token_v1',
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

export const CentraDB = {
  getUser: (): UserProfile => safeGet(STORAGE_KEYS.USER, INITIAL_USER),
  saveUser: (user: UserProfile) => safeSet(STORAGE_KEYS.USER, user),

  getAccounts: (): Account[] => safeGet(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS),
  saveAccounts: (accounts: Account[]) => safeSet(STORAGE_KEYS.ACCOUNTS, accounts),

  getCategories: (): Category[] => safeGet(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES),
  saveCategories: (categories: Category[]) => safeSet(STORAGE_KEYS.CATEGORIES, categories),

  getTransactions: (): Transaction[] => safeGet(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS),
  saveTransactions: (txs: Transaction[]) => safeSet(STORAGE_KEYS.TRANSACTIONS, txs),

  getGoals: (): Goal[] => safeGet(STORAGE_KEYS.GOALS, INITIAL_GOALS),
  saveGoals: (goals: Goal[]) => safeSet(STORAGE_KEYS.GOALS, goals),

  getBudgets: (): Budget[] => safeGet(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS),
  saveBudgets: (budgets: Budget[]) => safeSet(STORAGE_KEYS.BUDGETS, budgets),

  getNotifications: (): NotificationItem[] => safeGet(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
  saveNotifications: (notifs: NotificationItem[]) => safeSet(STORAGE_KEYS.NOTIFICATIONS, notifs),

  getSettings: (): AppSettings => safeGet(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS),
  saveSettings: (settings: AppSettings) => safeSet(STORAGE_KEYS.SETTINGS, settings),

  getAuthSession: (): boolean => safeGet(STORAGE_KEYS.AUTH_TOKEN, true),
  saveAuthSession: (isLoggedIn: boolean) => safeSet(STORAGE_KEYS.AUTH_TOKEN, isLoggedIn),

  resetToSeedData: () => {
    safeSet(STORAGE_KEYS.USER, INITIAL_USER);
    safeSet(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    safeSet(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    safeSet(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    safeSet(STORAGE_KEYS.GOALS, INITIAL_GOALS);
    safeSet(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS);
    safeSet(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    safeSet(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
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
