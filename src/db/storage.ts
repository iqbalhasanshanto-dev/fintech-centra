import {
  UserProfile,
  Account,
  Transaction,
  Category,
  Goal,
  Budget,
  NotificationItem,
  AppSettings,
  CurrencyCode,
  SyncStatus,
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
import { OutboxQueue, OutboxItem } from './outbox';
import {
  AccountRow,
  CategoryRow,
  TransactionRow,
  GoalRow,
  BudgetRow,
  NotificationRow,
  SettingsRow,
  ProfileRow,
} from './dbTypes';
import { logger } from '../utils/logger';
import { getAppVersion } from '../utils/version';
import { getNativePlatform } from '../utils/platform';

export const GUEST_USER_ID = 'guest';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return UUID_REGEX.test(id.trim());
}

// Current active user ID tracked in memory
let currentActiveUserId: string | null = null;

export function isGuestUser(userId?: string | null): boolean {
  const uid = userId !== undefined ? userId : (currentActiveUserId || cache?.user?.id);
  if (!uid || typeof uid !== 'string') return true;
  const trimmed = uid.trim();
  if (!trimmed || trimmed === GUEST_USER_ID || trimmed.startsWith('guest')) {
    return true;
  }
  return !isValidUuid(trimmed);
}

// Clean up legacy guest_<timestamp> namespaces and persistent guest flags left from earlier versions
export function cleanupLegacyGuestData(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('centra:guest_') ||
          key === 'centra_is_guest_v2' ||
          key === 'centra_is_guest' ||
          key === 'centra_guest_flag')
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    // Ignore in non-browser or disabled environments
  }
}

if (typeof window !== 'undefined') {
  cleanupLegacyGuestData();
}

// Helper for namespaced storage keys: centra:{userId}:{entity}
export function getUserStorageKey(userId: string | null | undefined, entity: string): string {
  const uid = isGuestUser(userId) ? GUEST_USER_ID : userId!;
  return `centra:${uid}:${entity}`;
}

/**
 * Returns the cutoff timestamp for 2-month rolling data retention:
 * The start of the previous calendar month (1st of previous month at 00:00:00.000).
 * Any transactions strictly older than this cutoff (txDate < cutoff) are eligible for pruning.
 */
export function getTwoMonthRetentionCutoff(referenceDate: Date = new Date()): Date {
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1, 0, 0, 0, 0);
}

// Sync status state machine
let currentSyncStatus: SyncStatus = 'synced';
const syncStatusListeners = new Set<(status: SyncStatus) => void>();

export function getSyncStatus(): SyncStatus {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'offline';
  }
  return currentSyncStatus;
}

export function setSyncStatus(status: SyncStatus): void {
  currentSyncStatus = status;
  syncStatusListeners.forEach(listener => {
    try {
      listener(status);
    } catch (err) {
      logger.warn('Sync status listener error:', err);
    }
  });
}

export function onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
  syncStatusListeners.add(callback);
  callback(getSyncStatus());
  return () => {
    syncStatusListeners.delete(callback);
  };
}

const dataChangeListeners = new Set<() => void>();

export function onDataChanged(callback: () => void): () => void {
  dataChangeListeners.add(callback);
  return () => {
    dataChangeListeners.delete(callback);
  };
}

export function notifyDataChanged(): void {
  dataChangeListeners.forEach(listener => {
    try {
      listener();
    } catch (err) {
      logger.warn('Data change listener error:', err);
    }
  });
}

export const SYSTEM_CATEGORIES_DEFINITIONS: Array<Omit<Category, 'id'>> = [
  {
    systemKey: 'transfer',
    name: 'Transfer & Payment',
    icon: 'ArrowRightLeft',
    color: '#636E72',
    type: 'expense',
    hidden: true,
  },
  {
    systemKey: 'goal_contribution',
    name: 'Goal Contribution',
    icon: 'Target',
    color: '#10B981',
    type: 'expense',
    hidden: true,
  },
  {
    systemKey: 'uncategorized',
    name: 'Uncategorized',
    icon: 'HelpCircle',
    color: '#94A3B8',
    type: 'expense',
    hidden: true,
  },
];

export const DEFAULT_INCOME_CATEGORIES_DEFINITIONS: Array<Omit<Category, 'id'>> = [
  {
    name: 'Salary & Wages',
    icon: 'Briefcase',
    color: '#22C55E',
    type: 'income',
    hidden: false,
  },
  {
    name: 'Freelance & Bonus',
    icon: 'TrendingUp',
    color: '#10B981',
    type: 'income',
    hidden: false,
  },
  {
    name: 'Dividends & Yield',
    icon: 'Coins',
    color: '#06B6D4',
    type: 'income',
    hidden: false,
  },
  {
    name: 'Investments',
    icon: 'LineChart',
    color: '#3B82F6',
    type: 'income',
    hidden: false,
  },
  {
    name: 'Gifts / Allowance',
    icon: 'Gift',
    color: '#EC4899',
    type: 'income',
    hidden: false,
  },
];

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    try {
      return JSON.parse(item);
    } catch {
      return item as unknown as T;
    }
  } catch (err) {
    logger.warn(`Error reading localStorage key ${key}:`, err);
    return fallback;
  }
}

export function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    logger.error(`Error writing localStorage key ${key}:`, err);
  }
}

// In-memory cache for fast local access
const cache = {
  user: INITIAL_USER as UserProfile,
  accounts: [] as Account[],
  categories: [] as Category[],
  transactions: [] as Transaction[],
  goals: [] as Goal[],
  budgets: [] as Budget[],
  notifications: [] as NotificationItem[],
  settings: INITIAL_SETTINGS as AppSettings,
};

const DEMO_ACCOUNT_IDS = new Set(['acc_1', 'acc_2', 'acc_3', 'acc_4']);
const DEMO_TX_IDS = new Set(['tx_1', 'tx_2', 'tx_3', 'tx_4', 'tx_5', 'tx_6', 'tx_7', 'tx_8', 'tx_9', 'tx_10']);
const DEMO_GOAL_IDS = new Set(['goal_1', 'goal_2', 'goal_3', 'goal_4']);
const DEMO_BUDGET_IDS = new Set(['bud_1', 'bud_2', 'bud_3', 'bud_4', 'bud_5']);

// Initialize cache for active user
function reloadCacheForUser(userId: string | null): void {
  const isGuest = isGuestUser(userId);
  currentActiveUserId = isGuest ? GUEST_USER_ID : userId;

  if (isGuest) {
    // Guest starts with demo seed data
    cache.user = safeGet<UserProfile>(getUserStorageKey(GUEST_USER_ID, 'user'), {
      ...INITIAL_USER,
      id: GUEST_USER_ID,
    });
    cache.accounts = safeGet<Account[]>(getUserStorageKey(GUEST_USER_ID, 'accounts'), INITIAL_ACCOUNTS);
    cache.categories = safeGet<Category[]>(getUserStorageKey(GUEST_USER_ID, 'categories'), INITIAL_CATEGORIES);
    cache.transactions = safeGet<Transaction[]>(getUserStorageKey(GUEST_USER_ID, 'transactions'), INITIAL_TRANSACTIONS);
    cache.goals = safeGet<Goal[]>(getUserStorageKey(GUEST_USER_ID, 'goals'), INITIAL_GOALS);
    cache.budgets = safeGet<Budget[]>(getUserStorageKey(GUEST_USER_ID, 'budgets'), INITIAL_BUDGETS);
    cache.notifications = safeGet<NotificationItem[]>(getUserStorageKey(GUEST_USER_ID, 'notifications'), INITIAL_NOTIFICATIONS);
    cache.settings = safeGet<AppSettings>(getUserStorageKey(GUEST_USER_ID, 'settings'), INITIAL_SETTINGS);
  } else {
    // Real users start empty; no demo data fallbacks
    const emptyUser: UserProfile = {
      id: userId || '',
      name: '',
      email: '',
      isPro: false,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
    };
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    cache.settings = safeGet<AppSettings>(getUserStorageKey(userId, 'settings'), INITIAL_SETTINGS);
    cache.user = safeGet<UserProfile>(getUserStorageKey(userId, 'user'), emptyUser);
    const rawAccounts = safeGet<Account[]>(getUserStorageKey(userId, 'accounts'), []);
    const filteredAccounts = !isTest ? rawAccounts.filter(a => !DEMO_ACCOUNT_IDS.has(a.id)) : rawAccounts;
    if (!isTest && filteredAccounts.length === 0 && userId && !isGuest) {
      const standards = getStandardAccounts(cache.settings?.baseCurrency || 'USD');
      cache.accounts = standards;
      safeSet(getUserStorageKey(userId, 'accounts'), standards);
    } else {
      cache.accounts = filteredAccounts;
    }
    cache.categories = safeGet<Category[]>(getUserStorageKey(userId, 'categories'), []);
    const rawTransactions = safeGet<Transaction[]>(getUserStorageKey(userId, 'transactions'), []);
    const nonDemo = !isTest ? rawTransactions.filter(t => !DEMO_TX_IDS.has(t.id)) : rawTransactions;
    const cutoff = getTwoMonthRetentionCutoff();
    cache.transactions = nonDemo.filter(t => {
      if (!t.date) return true;
      const d = new Date(t.date);
      return isNaN(d.getTime()) || d >= cutoff;
    });
    const rawGoals = safeGet<Goal[]>(getUserStorageKey(userId, 'goals'), []);
    cache.goals = !isTest ? rawGoals.filter(g => !DEMO_GOAL_IDS.has(g.id)) : rawGoals;
    const rawBudgets = safeGet<Budget[]>(getUserStorageKey(userId, 'budgets'), []);
    cache.budgets = !isTest ? rawBudgets.filter(b => !DEMO_BUDGET_IDS.has(b.id)) : rawBudgets;
    cache.notifications = safeGet<NotificationItem[]>(getUserStorageKey(userId, 'notifications'), []);
  }
}

// Helpers to get active authenticated user id
export const getActiveUserId = (): string | null => {
  return currentActiveUserId || cache.user?.id || null;
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
  card_brand: acc.cardBrand || 'generic',
  is_primary: acc.isPrimary || false,
  credit_limit: acc.creditLimit || null,
  updated_at: new Date().toISOString(),
});

const mapAccountFromDb = (row: AccountRow): Account => ({
  id: row.id,
  name: row.name,
  type: row.type as Account['type'],
  balance: typeof row.balance === 'number' ? row.balance : parseFloat(row.balance),
  currency: row.currency,
  accountNumberMasked: row.account_number_masked || '',
  bankName: row.bank_name || '',
  color: row.color || '#6366F1',
  cardBrand: (row.card_brand as Account['cardBrand']) || 'generic',
  isPrimary: !!row.is_primary,
  creditLimit: row.credit_limit ? (typeof row.credit_limit === 'number' ? row.credit_limit : parseFloat(row.credit_limit)) : undefined,
});

const mapCategoryToDb = (cat: Category, userId: string) => ({
  id: cat.id,
  user_id: userId,
  system_key: cat.systemKey || null,
  name: cat.name,
  icon: cat.icon,
  color: cat.color,
  type: cat.type,
  budget_limit: cat.budgetLimit || null,
  updated_at: new Date().toISOString(),
});

const mapCategoryFromDb = (row: CategoryRow): Category => {
  const isSystem = ['transfer', 'goal_contribution', 'uncategorized'].includes(row.system_key || '');
  return {
    id: row.id,
    systemKey: row.system_key || undefined,
    name: row.name,
    icon: row.icon,
    color: row.color,
    type: row.type as Category['type'],
    budgetLimit: row.budget_limit ? (typeof row.budget_limit === 'number' ? row.budget_limit : parseFloat(row.budget_limit)) : undefined,
    hidden: isSystem,
  };
};

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
  converted_amount: tx.convertedAmount !== undefined ? tx.convertedAmount : null,
  exchange_rate: tx.exchangeRate !== undefined ? tx.exchangeRate : null,
  goal_id: tx.goalId || null,
  recipient: tx.recipient || null,
  merchant: tx.merchant || null,
  date: tx.date,
  note: tx.note || null,
  tags: tx.tags || [],
  is_recurring: tx.isRecurring || false,
  recurring_interval: tx.recurringInterval || null,
  is_pinned: tx.isPinned || false,
  resulting_balance: tx.resultingBalance !== undefined ? tx.resultingBalance : null,
  updated_at: new Date().toISOString(),
});

const mapTransactionFromDb = (row: TransactionRow): Transaction => ({
  id: row.id,
  type: row.type as Transaction['type'],
  amount: typeof row.amount === 'number' ? row.amount : parseFloat(row.amount),
  currency: row.currency,
  categoryId: row.category_id,
  categoryName: row.category_name,
  categoryIcon: row.category_icon,
  categoryColor: row.category_color,
  accountId: row.account_id,
  accountName: row.account_name,
  toAccountId: row.to_account_id || undefined,
  convertedAmount: row.converted_amount !== null && row.converted_amount !== undefined ? (typeof row.converted_amount === 'number' ? row.converted_amount : parseFloat(row.converted_amount)) : undefined,
  exchangeRate: row.exchange_rate !== null && row.exchange_rate !== undefined ? (typeof row.exchange_rate === 'number' ? row.exchange_rate : parseFloat(row.exchange_rate)) : undefined,
  goalId: row.goal_id || undefined,
  recipient: row.recipient || undefined,
  merchant: row.merchant || undefined,
  date: row.date,
  note: row.note || undefined,
  tags: row.tags || [],
  isPinned: !!row.is_pinned,
  isRecurring: !!row.is_recurring,
  recurringInterval: (row.recurring_interval as Transaction['recurringInterval']) || undefined,
  resultingBalance: row.resulting_balance !== null && row.resulting_balance !== undefined ? (typeof row.resulting_balance === 'number' ? row.resulting_balance : parseFloat(row.resulting_balance)) : undefined,
});

const mapGoalToDb = (g: Goal, userId: string) => ({
  id: g.id,
  user_id: userId,
  name: g.name,
  icon: g.icon,
  color: g.color,
  target_amount: g.targetAmount,
  current_amount: g.currentAmount,
  start_date: g.startDate,
  target_date: g.targetDate,
  linked_account_id: g.linkedAccountId || null,
  is_completed: g.isCompleted || false,
  updated_at: new Date().toISOString(),
});

const mapGoalFromDb = (row: GoalRow): Goal => ({
  id: row.id,
  name: row.name,
  icon: row.icon,
  color: row.color,
  targetAmount: typeof row.target_amount === 'number' ? row.target_amount : parseFloat(row.target_amount),
  currentAmount: typeof row.current_amount === 'number' ? row.current_amount : parseFloat(row.current_amount),
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
  spent_amount: b.spentAmount || 0,
  alert_threshold: b.alertThreshold,
  period: b.period,
  currency: b.currency || null,
  updated_at: new Date().toISOString(),
});

const mapBudgetFromDb = (row: BudgetRow): Budget => ({
  id: row.id,
  categoryId: row.category_id,
  categoryName: row.category_name,
  categoryIcon: row.category_icon,
  categoryColor: row.category_color,
  limitAmount: typeof row.limit_amount === 'number' ? row.limit_amount : parseFloat(row.limit_amount),
  spentAmount: typeof row.spent_amount === 'number' ? row.spent_amount : parseFloat(row.spent_amount || '0'),
  alertThreshold: row.alert_threshold,
  period: row.period as Budget['period'],
  currency: row.currency || undefined,
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
  updated_at: new Date().toISOString(),
});

const mapNotificationFromDb = (row: NotificationRow): NotificationItem => ({
  id: row.id,
  type: row.type as NotificationItem['type'],
  title: row.title,
  message: row.message,
  timestamp: row.timestamp,
  isRead: !!row.is_read,
  actionUrl: row.action_url || undefined,
  severity: (row.severity as NotificationItem['severity']) || 'info',
});

const mapSettingsToDb = (s: AppSettings, userId: string) => ({
  id: `settings_${userId}`,
  user_id: userId,
  theme: s.theme,
  base_currency: s.baseCurrency || null,
  privacy_mode: s.privacyMode,
  security: s.security,
  notifications: s.notifications,
  updated_at: new Date().toISOString(),
});

const mapSettingsFromDb = (row: SettingsRow): AppSettings => ({
  theme: (row.theme as AppSettings['theme']) || 'light',
  baseCurrency: row.base_currency || null,
  privacyMode: !!row.privacy_mode,
  security: (row.security as AppSettings['security']) || INITIAL_SETTINGS.security,
  notifications: (row.notifications as AppSettings['notifications']) || INITIAL_SETTINGS.notifications,
});

export const CATEGORY_STYLE_MAP: Record<string, { icon: string; color: string; type: 'expense' | 'income' }> = {
  'Groceries': { icon: 'ShoppingBag', color: '#10B981', type: 'expense' },
  'Food & Drinks': { icon: 'Utensils', color: '#FF7675', type: 'expense' },
  'Food & Dining': { icon: 'Utensils', color: '#FF7675', type: 'expense' },
  'Bills & Utilities': { icon: 'Home', color: '#6C5CE7', type: 'expense' },
  'Housing & Rent': { icon: 'Home', color: '#6C5CE7', type: 'expense' },
  'Shopping': { icon: 'ShoppingBag', color: '#FD79A8', type: 'expense' },
  'Travel': { icon: 'Plane', color: '#FDCB6E', type: 'expense' },
  'Entertainment': { icon: 'Film', color: '#A29BFE', type: 'expense' },
  'Work & Freelance': { icon: 'TrendingUp', color: '#00B894', type: 'income' },
  'Transport': { icon: 'Car', color: '#0984E3', type: 'expense' },
  'Subscriptions': { icon: 'Repeat', color: '#E17055', type: 'expense' },
  'Health & Wellness': { icon: 'HeartPulse', color: '#00CEC9', type: 'expense' },
  'Salary & Wages': { icon: 'Briefcase', color: '#1FAE71', type: 'income' },
};

// Merge rule after a successful fetch of an entity:
// cache = remote records + local records with a pending upsert - records with a pending delete.
// Remote deletions from other devices remove the local copy.
function mergeEntityWithOutbox<T extends { id: string }>(
  entityName: 'accounts' | 'categories' | 'transactions' | 'goals' | 'budgets' | 'notifications',
  remoteItems: T[],
  localCacheItems: T[],
  pendingItems: OutboxItem[]
): T[] {
  const pendingForEntity = pendingItems.filter(item => item.entity === entityName);
  const pendingDeletes = new Set(
    pendingForEntity.filter(item => item.op === 'delete').map(item => item.recordId)
  );
  const pendingUpserts = new Map<string, T>();
  pendingForEntity
    .filter(item => item.op === 'upsert')
    .forEach(item => {
      const local = localCacheItems.find(loc => loc.id === item.recordId);
      if (local) {
        pendingUpserts.set(item.recordId, local);
      }
    });

  const result: T[] = [];
  const seenIds = new Set<string>();

  for (const remote of remoteItems) {
    if (pendingDeletes.has(remote.id)) {
      continue; // Remote record was deleted locally: pending delete wins
    }
    if (pendingUpserts.has(remote.id)) {
      result.push(pendingUpserts.get(remote.id)!); // Local pending edit wins over remote
      seenIds.add(remote.id);
    } else {
      result.push(remote);
      seenIds.add(remote.id);
    }
  }

  // Include any local records with pending upserts that do not exist yet in remote
  for (const [id, localItem] of pendingUpserts) {
    if (!seenIds.has(id) && !pendingDeletes.has(id)) {
      result.push(localItem);
      seenIds.add(id);
    }
  }

  return result;
}

const activeSyncPromisesByUser = new Map<string, Promise<{ ok: boolean; profile?: ProfileRow | null; error?: unknown; throttled?: boolean }>>();
const lastPullTimestampByUser = new Map<string, number>();
const PULL_THROTTLE_MS = 30_000;

// Initialize cache for guest mode by default
reloadCacheForUser(null);

export const FIGMA_DEFAULT_CATEGORIES: Category[] = [
  // 11 Expense Categories from 15-picker-budget.png
  { id: 'cat_groceries', name: 'Groceries', icon: 'ShoppingCart', color: '#10B981', type: 'expense', budgetLimit: 600 },
  { id: 'cat_food_drinks', name: 'Food & Drinks', icon: 'Utensils', color: '#F59E0B', type: 'expense', budgetLimit: 800 },
  { id: 'cat_bills_utils', name: 'Bills & Utilities', icon: 'Receipt', color: '#6366F1', type: 'expense', budgetLimit: 500 },
  { id: 'cat_transport', name: 'Transport', icon: 'Car', color: '#3B82F6', type: 'expense', budgetLimit: 300 },
  { id: 'cat_subscriptions', name: 'Subscriptions', icon: 'Repeat', color: '#EC4899', type: 'expense', budgetLimit: 120 },
  { id: 'cat_travel', name: 'Travel', icon: 'Plane', color: '#8B5CF6', type: 'expense', budgetLimit: 600 },
  { id: 'cat_entertainment', name: 'Entertainment', icon: 'Film', color: '#F97316', type: 'expense', budgetLimit: 250 },
  { id: 'cat_shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#14B8A6', type: 'expense', budgetLimit: 500 },
  { id: 'cat_health_medical', name: 'Health & Medical', icon: 'HeartPulse', color: '#EF4444', type: 'expense', budgetLimit: 200 },
  { id: 'cat_education', name: 'Education', icon: 'GraduationCap', color: '#06B6D4', type: 'expense', budgetLimit: 400 },
  { id: 'cat_personal_care', name: 'Personal Care', icon: 'Sparkles', color: '#84CC16', type: 'expense', budgetLimit: 150 },
  // 5 Income Categories from 15-picker-income-category.png
  { id: 'cat_salary_wages', name: 'Salary & Wages', icon: 'Briefcase', color: '#22C55E', type: 'income', hidden: false },
  { id: 'cat_freelance_bonus', name: 'Freelance & Bonus', icon: 'TrendingUp', color: '#10B981', type: 'income', hidden: false },
  { id: 'cat_dividends_yield', name: 'Dividends & Yield', icon: 'Coins', color: '#06B6D4', type: 'income', hidden: false },
  { id: 'cat_investments', name: 'Investments', icon: 'LineChart', color: '#3B82F6', type: 'income', hidden: false },
  { id: 'cat_gifts_allowance', name: 'Gifts / Allowance', icon: 'Gift', color: '#EC4899', type: 'income', hidden: false },
  // System Categories
  { id: 'cat_transfer', systemKey: 'transfer', name: 'Transfer & Payment', icon: 'ArrowRightLeft', color: '#636E72', type: 'expense', hidden: true },
  { id: 'cat_goal_contrib', systemKey: 'goal_contribution', name: 'Goal Contribution', icon: 'Target', color: '#10B981', type: 'expense', hidden: true },
  { id: 'cat_uncategorized', systemKey: 'uncategorized', name: 'Uncategorized', icon: 'HelpCircle', color: '#94A3B8', type: 'expense', hidden: true },
];

export const FIGMA_DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc_cash', name: 'Cash', type: 'cash', balance: 0, currency: 'USD', accountNumberMasked: '•••• CASH', bankName: 'Physical Cash', color: '#10B981', isPrimary: true },
  { id: 'acc_card', name: 'Card Payment', type: 'credit', balance: 0, currency: 'USD', accountNumberMasked: '•••• CARD', bankName: 'Credit Card', color: '#6366F1' },
  { id: 'acc_mobile', name: 'Mobile Banking', type: 'checking', balance: 0, currency: 'USD', accountNumberMasked: '•••• MFS', bankName: 'Mobile Banking', color: '#EC4899' },
  { id: 'acc_bank', name: 'Bank Transfer', type: 'savings', balance: 0, currency: 'USD', accountNumberMasked: '•••• BANK', bankName: 'Bank Transfer', color: '#3B82F6' },
];

export const getStandardAccounts = (currency: CurrencyCode = 'USD'): Account[] => [
  { id: 'acc_cash', name: 'Cash', type: 'cash', balance: 0, currency, accountNumberMasked: '•••• CASH', bankName: 'Physical Cash', color: '#10B981', isPrimary: true },
  { id: 'acc_card', name: 'Card Payment', type: 'credit', balance: 0, currency, accountNumberMasked: '•••• CARD', bankName: 'Credit Card', color: '#6366F1' },
  { id: 'acc_mobile', name: 'Mobile Banking', type: 'checking', balance: 0, currency, accountNumberMasked: '•••• MFS', bankName: 'Mobile Banking', color: '#EC4899' },
  { id: 'acc_bank', name: 'Bank Transfer', type: 'savings', balance: 0, currency, accountNumberMasked: '•••• BANK', bankName: 'Bank Transfer', color: '#3B82F6' },
];

export const CentraDB = {
  // Sync Status API
  getSyncStatus,
  setSyncStatus,
  onSyncStatusChange,

  // Re-hydration Data Change Subscriptions
  onDataChanged,
  notifyDataChanged,

  // First-Sync Gating Check (per-user lastSyncedAt marker)
  hasCachedData: (userId?: string | null): boolean => {
    const uid = userId !== undefined ? userId : (currentActiveUserId || cache.user?.id);
    const storedUser = uid ? safeGet<UserProfile | null>(getUserStorageKey(uid, 'user'), null) : cache.user;
    if (storedUser && storedUser.onboardingCompleted === false) {
      return false;
    }
    if (isGuestUser(uid)) return true;
    const lastSynced = safeGet<string | null>(getUserStorageKey(uid, 'last_synced_at'), null);
    return !!lastSynced;
  },

  // Set active user and load namespaced storage
  setActiveUser: (userId: string | null) => {
    reloadCacheForUser(userId);
  },

  // In-memory & local cache getters
  getUser: (): UserProfile => cache.user,
  getAccounts: (): Account[] => cache.accounts,
  getCategories: (): Category[] => cache.categories,
  getTransactions: (): Transaction[] => cache.transactions,
  getGoals: (): Goal[] => cache.goals,
  getBudgets: (): Budget[] => cache.budgets,
  getNotifications: (): NotificationItem[] => cache.notifications,
  getSettings: (): AppSettings => cache.settings,

  // In-memory & local cache setters
  setCachedTransactions: (txs: Transaction[]) => {
    cache.transactions = txs;
    safeSet(getUserStorageKey(currentActiveUserId, 'transactions'), cache.transactions);
  },
  setCachedAccounts: (accs: Account[]) => {
    cache.accounts = accs;
    safeSet(getUserStorageKey(currentActiveUserId, 'accounts'), cache.accounts);
  },
  setCachedGoals: (goals: Goal[]) => {
    cache.goals = goals;
    safeSet(getUserStorageKey(currentActiveUserId, 'goals'), cache.goals);
  },
  setCachedBudgets: (budgets: Budget[]) => {
    cache.budgets = budgets;
    safeSet(getUserStorageKey(currentActiveUserId, 'budgets'), cache.budgets);
  },

  /**
   * Prunes transactions strictly older than 2 calendar months (Current Month + Previous Month).
   * Their net balance remains preserved in the user's account balances.
   * Removes expired records from local memory/storage and remotely from Supabase.
   */
  pruneExpiredTransactions: async (userId?: string | null): Promise<{ prunedCount: number }> => {
    const uid = userId !== undefined ? userId : (currentActiveUserId || cache.user?.id);
    const cutoff = getTwoMonthRetentionCutoff();

    const allTxs = cache.transactions;
    const activeTxs = allTxs.filter(tx => {
      if (!tx.date) return true;
      const d = new Date(tx.date);
      return isNaN(d.getTime()) || d >= cutoff;
    });
    const expiredTxs = allTxs.filter(tx => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      return !isNaN(d.getTime()) && d < cutoff;
    });

    if (expiredTxs.length === 0) {
      return { prunedCount: 0 };
    }

    cache.transactions = activeTxs;
    safeSet(getUserStorageKey(uid, 'transactions'), activeTxs);

    if (uid && !isGuestUser(uid) && isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const expiredIds = expiredTxs.map(t => t.id);
        await supabase
          .from('transactions')
          .delete()
          .eq('user_id', uid)
          .in('id', expiredIds);
      } catch (err) {
        logger.warn('Remote pruning of expired transactions encountered error:', err);
      }
    }

    notifyDataChanged();
    return { prunedCount: expiredTxs.length };
  },

  // ---------------------------------------------------------------------------
  // PER-RECORD REPOSITORY MUTATIONS (Optimistic Local + Supabase + Outbox)
  // ---------------------------------------------------------------------------

  // ACCOUNTS
  upsertAccount: async (acc: Account): Promise<{ data: Account | null; error: unknown }> => {
    // 1. Optimistic local update
    const existingIdx = cache.accounts.findIndex(a => a.id === acc.id);
    if (existingIdx >= 0) {
      cache.accounts[existingIdx] = acc;
    } else {
      cache.accounts.push(acc);
    }
    safeSet(getUserStorageKey(currentActiveUserId, 'accounts'), cache.accounts);
    notifyDataChanged();

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { data: acc, error: null };
    }

    const dbRow = mapAccountToDb(acc, userId);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      OutboxQueue.enqueue({ userId, entity: 'accounts', op: 'upsert', recordId: acc.id, payload: dbRow });
      setSyncStatus('offline');
      return { data: acc, error: null };
    }

    // 2. Remote write with outbox fallback
    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('accounts').upsert(dbRow, { onConflict: 'user_id,id' });
      if (error) {
        logger.warn('Supabase upsertAccount failed, queueing in outbox:', error);
        OutboxQueue.enqueue({ userId, entity: 'accounts', op: 'upsert', recordId: acc.id, payload: dbRow });
        setSyncStatus('error');
        return { data: acc, error };
      }
      setSyncStatus('synced');
      return { data: acc, error: null };
    } catch (err: unknown) {
      logger.warn('Network error during upsertAccount, queueing in outbox:', err);
      OutboxQueue.enqueue({ userId, entity: 'accounts', op: 'upsert', recordId: acc.id, payload: dbRow });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { data: acc, error: err };
    }
  },

  deleteAccount: async (id: string): Promise<{ ok: boolean; error: unknown }> => {
    cache.accounts = cache.accounts.filter(a => a.id !== id);
    safeSet(getUserStorageKey(currentActiveUserId, 'accounts'), cache.accounts);
    notifyDataChanged();

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { ok: true, error: null };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      OutboxQueue.enqueue({ userId, entity: 'accounts', op: 'delete', recordId: id });
      setSyncStatus('offline');
      return { ok: true, error: null };
    }

    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) {
        logger.warn('Supabase deleteAccount failed, queueing in outbox:', error);
        OutboxQueue.enqueue({ userId, entity: 'accounts', op: 'delete', recordId: id });
        setSyncStatus('error');
        return { ok: false, error };
      }
      setSyncStatus('synced');
      return { ok: true, error: null };
    } catch (err: unknown) {
      OutboxQueue.enqueue({ userId, entity: 'accounts', op: 'delete', recordId: id });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { ok: false, error: err };
    }
  },

  // CATEGORIES
  upsertCategory: async (cat: Category): Promise<{ data: Category | null; error: unknown }> => {
    const existingIdx = cache.categories.findIndex(c => c.id === cat.id);
    if (existingIdx >= 0) {
      cache.categories[existingIdx] = cat;
    } else {
      cache.categories.push(cat);
    }
    safeSet(getUserStorageKey(currentActiveUserId, 'categories'), cache.categories);
    notifyDataChanged();

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { data: cat, error: null };
    }

    const dbRow = mapCategoryToDb(cat, userId);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      OutboxQueue.enqueue({ userId, entity: 'categories', op: 'upsert', recordId: cat.id, payload: dbRow });
      setSyncStatus('offline');
      return { data: cat, error: null };
    }

    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('categories').upsert(dbRow, { onConflict: 'user_id,id' });
      if (error) {
        OutboxQueue.enqueue({ userId, entity: 'categories', op: 'upsert', recordId: cat.id, payload: dbRow });
        setSyncStatus('error');
        return { data: cat, error };
      }
      setSyncStatus('synced');
      return { data: cat, error: null };
    } catch (err: unknown) {
      OutboxQueue.enqueue({ userId, entity: 'categories', op: 'upsert', recordId: cat.id, payload: dbRow });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { data: cat, error: err };
    }
  },

  deleteCategory: async (id: string): Promise<{ ok: boolean; error: unknown }> => {
    cache.categories = cache.categories.filter(c => c.id !== id);
    safeSet(getUserStorageKey(currentActiveUserId, 'categories'), cache.categories);
    notifyDataChanged();

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { ok: true, error: null };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      OutboxQueue.enqueue({ userId, entity: 'categories', op: 'delete', recordId: id });
      setSyncStatus('offline');
      return { ok: true, error: null };
    }

    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        OutboxQueue.enqueue({ userId, entity: 'categories', op: 'delete', recordId: id });
        setSyncStatus('error');
        return { ok: false, error };
      }
      setSyncStatus('synced');
      return { ok: true, error: null };
    } catch (err: unknown) {
      OutboxQueue.enqueue({ userId, entity: 'categories', op: 'delete', recordId: id });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { ok: false, error: err };
    }
  },

  ensureSystemCategories: async (targetUserId?: string): Promise<Category[]> => {
    const userId = targetUserId || getActiveUserId();
    const isGuest = isGuestUser(userId);
    const existing = [...cache.categories];
    const toCreate: Category[] = [];

    for (const def of SYSTEM_CATEGORIES_DEFINITIONS) {
      const match = existing.find(c => c.systemKey === def.systemKey);
      if (!match) {
        const newCat: Category = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cat_${def.systemKey}_${Date.now()}`,
          systemKey: def.systemKey,
          name: def.name,
          icon: def.icon,
          color: def.color,
          type: def.type,
          hidden: true,
        };
        toCreate.push(newCat);
        existing.push(newCat);
      }
    }

    if (toCreate.length === 0) {
      return cache.categories;
    }

    cache.categories = existing;
    safeSet(getUserStorageKey(userId || GUEST_USER_ID, 'categories'), cache.categories);
    notifyDataChanged();

    if (!userId || isGuest || !isSupabaseConfigured()) {
      return cache.categories;
    }

    // Persist newly created categories through the outbox as one group
    const outboxItems = toCreate.map(cat => ({
      userId,
      entity: 'categories' as const,
      op: 'upsert' as const,
      recordId: cat.id,
      payload: mapCategoryToDb(cat, userId),
    }));
    const enqueued = OutboxQueue.enqueueGroup(outboxItems);

    if (navigator.onLine) {
      try {
        setSyncStatus('syncing');
        const rows = toCreate.map(c => mapCategoryToDb(c, userId));
        const { error } = await supabase.from('categories').upsert(rows, { onConflict: 'user_id,id' });

        if (error) {
          if (
            error.code === '23505' ||
            error.message?.includes('uq_categories_user_system_key') ||
            error.message?.includes('system_key')
          ) {
            // Unique violation on (user_id, system_key): re-read and use existing row instead of failing
            const { data: remoteRows } = await supabase
              .from('categories')
              .select('*')
              .eq('user_id', userId)
              .in('system_key', toCreate.map(c => c.systemKey!));

            if (remoteRows && remoteRows.length > 0) {
              const remoteCats = remoteRows.map(mapCategoryFromDb);
              cache.categories = cache.categories.map(c => {
                const found = remoteCats.find(r => r.systemKey === c.systemKey);
                return found || c;
              });
              safeSet(getUserStorageKey(userId, 'categories'), cache.categories);
              for (const item of enqueued) {
                OutboxQueue.remove(userId, item.id);
              }
              setSyncStatus('synced');
              notifyDataChanged();
              return cache.categories;
            }
          }
          setSyncStatus('error');
        } else {
          // Success: remove enqueued items from outbox
          for (const item of enqueued) {
            OutboxQueue.remove(userId, item.id);
          }
          setSyncStatus('synced');
        }
      } catch {
        setSyncStatus(navigator.onLine ? 'error' : 'offline');
      }
    }

    return cache.categories;
  },

  // TRANSACTIONS
  upsertTransaction: async (tx: Transaction): Promise<{ data: Transaction | null; error: unknown }> => {
    const existingIdx = cache.transactions.findIndex(t => t.id === tx.id);
    if (existingIdx >= 0) {
      cache.transactions[existingIdx] = tx;
    } else {
      cache.transactions.unshift(tx);
    }
    safeSet(getUserStorageKey(currentActiveUserId, 'transactions'), cache.transactions);

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { data: tx, error: null };
    }

    const dbRow = mapTransactionToDb(tx, userId);
    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('transactions').upsert(dbRow, { onConflict: 'user_id,id' });
      if (error) {
        OutboxQueue.enqueue({ userId, entity: 'transactions', op: 'upsert', recordId: tx.id, payload: dbRow });
        setSyncStatus('error');
        return { data: tx, error };
      }
      setSyncStatus('synced');
      return { data: tx, error: null };
    } catch (err: unknown) {
      OutboxQueue.enqueue({ userId, entity: 'transactions', op: 'upsert', recordId: tx.id, payload: dbRow });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { data: tx, error: err };
    }
  },

  deleteTransaction: async (id: string): Promise<{ ok: boolean; error: unknown }> => {
    cache.transactions = cache.transactions.filter(t => t.id !== id);
    safeSet(getUserStorageKey(currentActiveUserId, 'transactions'), cache.transactions);

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { ok: true, error: null };
    }

    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
        OutboxQueue.enqueue({ userId, entity: 'transactions', op: 'delete', recordId: id });
        setSyncStatus('error');
        return { ok: false, error };
      }
      setSyncStatus('synced');
      return { ok: true, error: null };
    } catch (err: unknown) {
      OutboxQueue.enqueue({ userId, entity: 'transactions', op: 'delete', recordId: id });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { ok: false, error: err };
    }
  },

  // GOALS
  upsertGoal: async (goal: Goal): Promise<{ data: Goal | null; error: unknown }> => {
    const existingIdx = cache.goals.findIndex(g => g.id === goal.id);
    if (existingIdx >= 0) {
      cache.goals[existingIdx] = goal;
    } else {
      cache.goals.push(goal);
    }
    safeSet(getUserStorageKey(currentActiveUserId, 'goals'), cache.goals);

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { data: goal, error: null };
    }

    const dbRow = mapGoalToDb(goal, userId);
    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('goals').upsert(dbRow, { onConflict: 'user_id,id' });
      if (error) {
        OutboxQueue.enqueue({ userId, entity: 'goals', op: 'upsert', recordId: goal.id, payload: dbRow });
        setSyncStatus('error');
        return { data: goal, error };
      }
      setSyncStatus('synced');
      return { data: goal, error: null };
    } catch (err: unknown) {
      OutboxQueue.enqueue({ userId, entity: 'goals', op: 'upsert', recordId: goal.id, payload: dbRow });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { data: goal, error: err };
    }
  },

  deleteGoal: async (id: string): Promise<{ ok: boolean; error: unknown }> => {
    cache.goals = cache.goals.filter(g => g.id !== id);
    safeSet(getUserStorageKey(currentActiveUserId, 'goals'), cache.goals);

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { ok: true, error: null };
    }

    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) {
        OutboxQueue.enqueue({ userId, entity: 'goals', op: 'delete', recordId: id });
        setSyncStatus('error');
        return { ok: false, error };
      }
      setSyncStatus('synced');
      return { ok: true, error: null };
    } catch (err: unknown) {
      OutboxQueue.enqueue({ userId, entity: 'goals', op: 'delete', recordId: id });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { ok: false, error: err };
    }
  },

  // BUDGETS
  upsertBudget: async (budget: Budget): Promise<{ data: Budget | null; error: unknown }> => {
    const existingIdx = cache.budgets.findIndex(b => b.id === budget.id);
    if (existingIdx >= 0) {
      cache.budgets[existingIdx] = budget;
    } else {
      cache.budgets.push(budget);
    }
    safeSet(getUserStorageKey(currentActiveUserId, 'budgets'), cache.budgets);

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { data: budget, error: null };
    }

    const dbRow = mapBudgetToDb(budget, userId);
    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('budgets').upsert(dbRow, { onConflict: 'user_id,id' });
      if (error) {
        OutboxQueue.enqueue({ userId, entity: 'budgets', op: 'upsert', recordId: budget.id, payload: dbRow });
        setSyncStatus('error');
        return { data: budget, error };
      }
      setSyncStatus('synced');
      return { data: budget, error: null };
    } catch (err: unknown) {
      OutboxQueue.enqueue({ userId, entity: 'budgets', op: 'upsert', recordId: budget.id, payload: dbRow });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { data: budget, error: err };
    }
  },

  deleteBudget: async (id: string): Promise<{ ok: boolean; error: unknown }> => {
    cache.budgets = cache.budgets.filter(b => b.id !== id);
    safeSet(getUserStorageKey(currentActiveUserId, 'budgets'), cache.budgets);

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { ok: true, error: null };
    }

    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) {
        OutboxQueue.enqueue({ userId, entity: 'budgets', op: 'delete', recordId: id });
        setSyncStatus('error');
        return { ok: false, error };
      }
      setSyncStatus('synced');
      return { ok: true, error: null };
    } catch (err: unknown) {
      OutboxQueue.enqueue({ userId, entity: 'budgets', op: 'delete', recordId: id });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { ok: false, error: err };
    }
  },

  // NOTIFICATIONS
  upsertNotification: async (notif: NotificationItem): Promise<{ data: NotificationItem | null; error: unknown }> => {
    const existingIdx = cache.notifications.findIndex(n => n.id === notif.id);
    if (existingIdx >= 0) {
      cache.notifications[existingIdx] = notif;
    } else {
      cache.notifications.unshift(notif);
    }
    safeSet(getUserStorageKey(currentActiveUserId, 'notifications'), cache.notifications);

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { data: notif, error: null };
    }

    const dbRow = mapNotificationToDb(notif, userId);
    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('notifications').upsert(dbRow, { onConflict: 'user_id,id' });
      if (error) {
        OutboxQueue.enqueue({ userId, entity: 'notifications', op: 'upsert', recordId: notif.id, payload: dbRow });
        setSyncStatus('error');
        return { data: notif, error };
      }
      setSyncStatus('synced');
      return { data: notif, error: null };
    } catch (err: unknown) {
      OutboxQueue.enqueue({ userId, entity: 'notifications', op: 'upsert', recordId: notif.id, payload: dbRow });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { data: notif, error: err };
    }
  },

  deleteNotification: async (id: string): Promise<{ ok: boolean; error: unknown }> => {
    cache.notifications = cache.notifications.filter(n => n.id !== id);
    safeSet(getUserStorageKey(currentActiveUserId, 'notifications'), cache.notifications);

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { ok: true, error: null };
    }

    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) {
        OutboxQueue.enqueue({ userId, entity: 'notifications', op: 'delete', recordId: id });
        setSyncStatus('error');
        return { ok: false, error };
      }
      setSyncStatus('synced');
      return { ok: true, error: null };
    } catch (err: unknown) {
      OutboxQueue.enqueue({ userId, entity: 'notifications', op: 'delete', recordId: id });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { ok: false, error: err };
    }
  },

  clearAllNotifications: async (): Promise<{ ok: boolean; error: unknown }> => {
    cache.notifications = [];
    safeSet(getUserStorageKey(currentActiveUserId, 'notifications'), cache.notifications);

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { ok: true, error: null };
    }

    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('notifications').delete().eq('user_id', userId);
      if (error) {
        setSyncStatus('error');
        return { ok: false, error };
      }
      setSyncStatus('synced');
      return { ok: true, error: null };
    } catch (err: unknown) {
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { ok: false, error: err };
    }
  },

  // SETTINGS
  saveSettings: async (settings: AppSettings): Promise<{ data: AppSettings | null; error: unknown }> => {
    cache.settings = settings;
    safeSet(getUserStorageKey(currentActiveUserId, 'settings'), settings);

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { data: settings, error: null };
    }

    const dbRow = mapSettingsToDb(settings, userId);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      OutboxQueue.enqueue({ userId, entity: 'settings', op: 'upsert', recordId: userId, payload: dbRow });
      setSyncStatus('offline');
      return { data: settings, error: null };
    }

    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('settings').upsert(dbRow, { onConflict: 'user_id' });
      if (error) {
        logger.warn('Supabase saveSettings failed, queueing in outbox:', error);
        OutboxQueue.enqueue({ userId, entity: 'settings', op: 'upsert', recordId: userId, payload: dbRow });
        setSyncStatus('error');
        return { data: settings, error };
      }
      setSyncStatus('synced');
      return { data: settings, error: null };
    } catch (err: unknown) {
      OutboxQueue.enqueue({ userId, entity: 'settings', op: 'upsert', recordId: userId, payload: dbRow });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { data: settings, error: err };
    }
  },

  // USER PROFILE
  saveUser: async (user: UserProfile): Promise<{ data: UserProfile | null; error: unknown }> => {
    cache.user = user;
    safeSet(getUserStorageKey(currentActiveUserId, 'user'), user);

    const userId = user.id || getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { data: user, error: null };
    }

    try {
      const updates: Partial<ProfileRow> = {
        updated_at: new Date().toISOString(),
        app_version: getAppVersion(),
        platform: getNativePlatform(),
      };
      if (user.name !== undefined) updates.name = user.name;
      if (user.email !== undefined) updates.email = user.email;
      if (user.avatarUrl !== undefined) updates.avatar_url = user.avatarUrl;
      if (user.baseCurrency !== undefined) updates.base_currency = user.baseCurrency;
      if (user.onboardingCompleted === true) {
        updates.onboarding_completed = true;
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        OutboxQueue.enqueue({ userId, entity: 'profiles', op: 'upsert', recordId: userId, payload: updates });
        setSyncStatus('offline');
        return { data: user, error: null };
      }

      setSyncStatus('syncing');
      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) {
        logger.warn('Supabase saveUser failed:', error);
        setSyncStatus('error');
        return { data: user, error };
      }
      setSyncStatus('synced');
      return { data: user, error: null };
    } catch (err: unknown) {
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { data: user, error: err };
    }
  },

  // Bulk save backward compatibility (used during explicit imports or batch operations)
  saveAccounts: async (accounts: Account[]) => {
    cache.accounts = accounts;
    safeSet(getUserStorageKey(currentActiveUserId, 'accounts'), accounts);
    notifyDataChanged();
  },
  saveCategories: async (categories: Category[]) => {
    cache.categories = categories;
    safeSet(getUserStorageKey(currentActiveUserId, 'categories'), categories);
    notifyDataChanged();
  },
  saveTransactions: async (txs: Transaction[]) => {
    cache.transactions = txs;
    safeSet(getUserStorageKey(currentActiveUserId, 'transactions'), txs);
  },
  saveGoals: async (goals: Goal[]) => {
    cache.goals = goals;
    safeSet(getUserStorageKey(currentActiveUserId, 'goals'), goals);
  },
  saveBudgets: async (budgets: Budget[]) => {
    cache.budgets = budgets;
    safeSet(getUserStorageKey(currentActiveUserId, 'budgets'), budgets);
  },
  saveNotifications: async (notifs: NotificationItem[]) => {
    cache.notifications = notifs;
    safeSet(getUserStorageKey(currentActiveUserId, 'notifications'), notifs);
  },

  // ---------------------------------------------------------------------------
  // OUTBOX PROCESSOR (DRAIN PENDING OFFLINE MUTATIONS - UNTHROTTLED)
  // ---------------------------------------------------------------------------
  processOutbox: async (): Promise<{ processed: number; errors: number }> => {
    const userId = getActiveUserId();
    if (!userId || isGuestUser(userId) || !isSupabaseConfigured() || !navigator.onLine) {
      return { processed: 0, errors: 0 };
    }

    const pending = OutboxQueue.getPending(userId);
    if (pending.length === 0) {
      setSyncStatus('synced');
      return { processed: 0, errors: 0 };
    }

    setSyncStatus('syncing');
    let processed = 0;
    let errors = 0;

    const ENTITY_PRIORITY: Record<string, number> = {
      profiles: 1,
      settings: 1,
      accounts: 2,
      categories: 2,
      goals: 3,
      budgets: 3,
      transactions: 4,
      notifications: 5,
    };

    const sortedPending = [...pending].sort((a, b) => {
      if (a.groupId && b.groupId && a.groupId === b.groupId && a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      const pA = ENTITY_PRIORITY[a.entity] || 99;
      const pB = ENTITY_PRIORITY[b.entity] || 99;
      if (pA !== pB) return pA - pB;
      return a.timestamp - b.timestamp;
    });

    for (const item of sortedPending) {
      try {
        let err: { code?: string; message?: string } | null = null;
        if (item.op === 'upsert') {
          const onConflict = item.entity === 'settings' ? 'user_id' : 'user_id,id';
          const { error } = await supabase.from(item.entity).upsert(item.payload || {}, { onConflict });
          err = error;
        } else if (item.op === 'delete') {
          const { error } = await supabase.from(item.entity).delete().eq('id', item.recordId);
          err = error;
        }

        if (err) {
          if (
            item.entity === 'categories' &&
            item.payload?.system_key &&
            (err.code === '23505' || err.message?.includes('uq_categories_user_system_key') || err.message?.includes('system_key'))
          ) {
            try {
              const { data: remoteRow, error: fetchErr } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', userId)
                .eq('system_key', item.payload.system_key as string)
                .maybeSingle();

              if (!fetchErr && remoteRow) {
                const existingCat = mapCategoryFromDb(remoteRow);
                cache.categories = cache.categories.map(c =>
                  c.systemKey === existingCat.systemKey ? existingCat : c
                );
                safeSet(getUserStorageKey(userId, 'categories'), cache.categories);
                OutboxQueue.remove(userId, item.id);
                processed++;
                err = null;
              }
            } catch {
              // Ignore and proceed to retry
            }
          }
          if (err) {
            errors++;
            OutboxQueue.update(userId, { ...item, retries: item.retries + 1, lastError: err.message });
          }
        } else {
          processed++;
          OutboxQueue.remove(userId, item.id);
        }
      } catch (e: unknown) {
        errors++;
        const message = e instanceof Error ? e.message : String(e);
        OutboxQueue.update(userId, { ...item, retries: item.retries + 1, lastError: message });
      }
    }

    if (errors > 0) {
      setSyncStatus('error');
    } else {
      setSyncStatus('synced');
    }

    if (processed > 0) {
      notifyDataChanged();
    }

    return { processed, errors };
  },

  // ---------------------------------------------------------------------------
  // FAIL-SAFE REMOTE SYNC (THROTTLED PULL WITH IN-FLIGHT GUARD & MERGE RULE)
  // ---------------------------------------------------------------------------
  syncFromSupabase: async (
    userId: string,
    userEmail?: string,
    userName?: string,
    options?: { force?: boolean }
  ): Promise<{ ok: boolean; profile?: ProfileRow | null; error?: unknown; throttled?: boolean }> => {
    if (!isSupabaseConfigured() || isGuestUser(userId)) {
      return { ok: true };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
      return { ok: false };
    }

    // 1. Drain outbox first (unthrottled!)
    await CentraDB.processOutbox();

    // Telemetry update: sync app_version and platform to public.profiles asynchronously
    if (isSupabaseConfigured() && !isGuestUser(userId)) {
      (async () => {
        try {
          if (typeof navigator !== 'undefined' && !navigator.onLine) return;
          const query = supabase.from('profiles');
          if (query && typeof query.update === 'function') {
            await query
              .update({
                app_version: getAppVersion(),
                platform: getNativePlatform(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);
          }
        } catch (telemetryErr) {
          logger.warn('Failed to update profile telemetry (app_version/platform):', telemetryErr);
        }
      })().catch(() => {});
    }

    // 2. In-flight guard: prevent concurrent sync executions for the same user
    const inFlight = activeSyncPromisesByUser.get(userId);
    if (inFlight) {
      return inFlight;
    }

    const runSync = async (): Promise<{ ok: boolean; profile?: ProfileRow | null; error?: unknown; throttled?: boolean }> => {
      // Throttle only the PULL (30-second cooldown per user, unless forced)
      const now = Date.now();
      const lastPull = lastPullTimestampByUser.get(userId) || 0;
      if (!options?.force && now - lastPull < PULL_THROTTLE_MS) {
        return { ok: true, throttled: true };
      }

      currentActiveUserId = userId;

      try {
        setSyncStatus('syncing');

        // 1. Fetch Profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          logger.warn('Profile fetch error from Supabase:', profileError);
          setSyncStatus('error');
          return { ok: false, error: profileError };
        }

        if (profileData) {
          const prof = profileData as ProfileRow;
          cache.user = {
            id: prof.id,
            name: prof.name || userName || '',
            email: prof.email || userEmail || '',
            avatarUrl: prof.avatar_url || undefined,
            baseCurrency: prof.base_currency || null,
            onboardingCompleted: prof.onboarding_completed ?? false,
            createdAt: prof.created_at || new Date().toISOString(),
          };
          safeSet(getUserStorageKey(userId, 'user'), cache.user);
        }

        let anyFetchError = false;

        // 2. Fetch Accounts
        const { data: accountsData, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', userId);

        if (!accountsError && accountsData) {
          const remote = accountsData.map(mapAccountFromDb);
          const pendingAccounts = OutboxQueue.getPending(userId);
          cache.accounts = mergeEntityWithOutbox('accounts', remote, cache.accounts, pendingAccounts);
          safeSet(getUserStorageKey(userId, 'accounts'), cache.accounts);
        } else if (accountsError) {
          logger.warn('Failed to fetch accounts:', accountsError);
          anyFetchError = true;
        }

        // 3. Fetch Categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId);

        if (!categoriesError && categoriesData) {
          const remote = categoriesData.map(mapCategoryFromDb);
          const pendingCategories = OutboxQueue.getPending(userId);
          cache.categories = mergeEntityWithOutbox('categories', remote, cache.categories, pendingCategories);
          safeSet(getUserStorageKey(userId, 'categories'), cache.categories);
        } else if (categoriesError) {
          logger.warn('Failed to fetch categories:', categoriesError);
          anyFetchError = true;
        }

        // 4. Fetch Transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (!transactionsError && transactionsData) {
          const remote = transactionsData.map(mapTransactionFromDb);
          const pendingTransactions = OutboxQueue.getPending(userId);
          const merged = mergeEntityWithOutbox('transactions', remote, cache.transactions, pendingTransactions);
          const cutoff = getTwoMonthRetentionCutoff();
          cache.transactions = merged.filter(tx => {
            if (!tx.date) return true;
            const d = new Date(tx.date);
            return isNaN(d.getTime()) || d >= cutoff;
          });
          safeSet(getUserStorageKey(userId, 'transactions'), cache.transactions);
        } else if (transactionsError) {
          logger.warn('Failed to fetch transactions:', transactionsError);
          anyFetchError = true;
        }

        // 5. Fetch Goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId);

        if (!goalsError && goalsData) {
          const remote = goalsData.map(mapGoalFromDb);
          const pendingGoals = OutboxQueue.getPending(userId);
          cache.goals = mergeEntityWithOutbox('goals', remote, cache.goals, pendingGoals);
          safeSet(getUserStorageKey(userId, 'goals'), cache.goals);
        } else if (goalsError) {
          logger.warn('Failed to fetch goals:', goalsError);
          anyFetchError = true;
        }

        // 6. Fetch Budgets
        const { data: budgetsData, error: budgetsError } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', userId);

        if (!budgetsError && budgetsData) {
          const remote = budgetsData.map(mapBudgetFromDb);
          const pendingBudgets = OutboxQueue.getPending(userId);
          cache.budgets = mergeEntityWithOutbox('budgets', remote, cache.budgets, pendingBudgets);
          safeSet(getUserStorageKey(userId, 'budgets'), cache.budgets);
        } else if (budgetsError) {
          logger.warn('Failed to fetch budgets:', budgetsError);
          anyFetchError = true;
        }

        // 7. Fetch Notifications
        const { data: notifData, error: notifError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false });

        if (!notifError && notifData) {
          const remote = notifData.map(mapNotificationFromDb);
          const pendingNotifs = OutboxQueue.getPending(userId);
          cache.notifications = mergeEntityWithOutbox('notifications', remote, cache.notifications, pendingNotifs);
          safeSet(getUserStorageKey(userId, 'notifications'), cache.notifications);
        } else if (notifError) {
          logger.warn('Failed to fetch notifications:', notifError);
          anyFetchError = true;
        }

        // 8. Fetch Settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        const pendingSettings = OutboxQueue.getPending(userId).find(item => item.entity === 'settings');
        if (!settingsError && settingsData) {
          if (!pendingSettings) {
            cache.settings = mapSettingsFromDb(settingsData);
            safeSet(getUserStorageKey(userId, 'settings'), cache.settings);
          }
        } else if (!settingsError && !settingsData) {
          if (!pendingSettings) {
            try {
              await supabase.from('settings').upsert(mapSettingsToDb(INITIAL_SETTINGS, userId), { onConflict: 'user_id' });
            } catch (settingsInsertErr) {
              logger.warn('Fallback settings insert error:', settingsInsertErr);
            }
            cache.settings = INITIAL_SETTINGS;
            safeSet(getUserStorageKey(userId, 'settings'), cache.settings);
          }
        } else if (settingsError) {
          logger.warn('Failed to fetch settings:', settingsError);
          anyFetchError = true;
        }

        if (!anyFetchError) {
          // If user has 0 transactions, ensure account doesn't carry a mock balance (e.g., 20 or named after user)
          if (cache.transactions.length === 0 && cache.accounts && cache.accounts.length > 0) {
            const userFirstName = (cache.user?.name || userName || '').trim().split(/\s+/)[0]?.toLowerCase();
            let accountsModified = false;
            cache.accounts = cache.accounts.map(acc => {
              const accNameLower = (acc.name || '').toLowerCase();
              const matchesUserName = Boolean(userFirstName && accNameLower.includes(userFirstName));
              if (acc.balance === 20 || matchesUserName) {
                accountsModified = true;
                return {
                  ...acc,
                  balance: 0,
                  name: (acc.name === 'Checking' || acc.name === 'Savings' || acc.name === 'Investment') ? acc.name : 'Cash'
                };
              }
              return acc;
            });
            if (accountsModified) {
              safeSet(getUserStorageKey(userId, 'accounts'), cache.accounts);
            }
          }

          lastPullTimestampByUser.set(userId, Date.now());
          const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
          if (!isTest && !isGuestUser(userId)) {
            cache.accounts = cache.accounts.filter(a => !DEMO_ACCOUNT_IDS.has(a.id));
            cache.transactions = cache.transactions.filter(t => !DEMO_TX_IDS.has(t.id));
            cache.goals = cache.goals.filter(g => !DEMO_GOAL_IDS.has(g.id));
            cache.budgets = cache.budgets.filter(b => !DEMO_BUDGET_IDS.has(b.id));
            safeSet(getUserStorageKey(userId, 'accounts'), cache.accounts);
            safeSet(getUserStorageKey(userId, 'transactions'), cache.transactions);
            safeSet(getUserStorageKey(userId, 'goals'), cache.goals);
            safeSet(getUserStorageKey(userId, 'budgets'), cache.budgets);
          }
          safeSet(getUserStorageKey(userId, 'last_synced_at'), new Date().toISOString());
          setSyncStatus('synced');
          notifyDataChanged();
          return { ok: true, profile: profileData };
        } else {
          setSyncStatus('error');
          notifyDataChanged();
          return { ok: false, profile: profileData };
        }
      } catch (err) {
        logger.warn('Error syncing from Supabase:', err);
        setSyncStatus('error');
        return { ok: false, error: err };
      }
    };

    const syncPromise = runSync().finally(() => {
      activeSyncPromisesByUser.delete(userId);
    });
    activeSyncPromisesByUser.set(userId, syncPromise);
    return syncPromise;
  },

  // ---------------------------------------------------------------------------
  // DATA DELETION & RESET
  // ---------------------------------------------------------------------------

  // Real user: Scoped real DELETE queries on Supabase + clear local storage ONLY on success
  deleteAllUserData: async (
    userId: string,
    options?: { forceLocalReset?: boolean; resetStandardAccounts?: boolean }
  ): Promise<{ ok: boolean; error: unknown }> => {
    if (isGuestUser(userId)) {
      CentraDB.resetToSeedData();
      notifyDataChanged();
      return { ok: true, error: null };
    }

    try {
      setSyncStatus('syncing');
      if (isSupabaseConfigured() && userId) {
        const tables = ['transactions', 'budgets', 'goals', 'accounts', 'notifications', 'categories'] as const;
        for (const table of tables) {
          const { error } = await supabase.from(table).delete().eq('user_id', userId);
          if (error) {
            logger.error(`Failed to delete remote records from ${table}:`, error);
            if (!options?.forceLocalReset) {
              setSyncStatus('error');
              return { ok: false, error };
            }
          }
        }
      }

      // Clear outbox & local user data
      OutboxQueue.clear(userId);
      const cur = (cache.user?.baseCurrency as CurrencyCode) || 'USD';
      cache.accounts = options?.resetStandardAccounts ? getStandardAccounts(cur) : [];
      cache.categories = [];
      cache.transactions = [];
      cache.goals = [];
      cache.budgets = [];
      cache.notifications = [];

      safeSet(getUserStorageKey(userId, 'accounts'), cache.accounts);
      safeSet(getUserStorageKey(userId, 'categories'), []);
      safeSet(getUserStorageKey(userId, 'transactions'), []);
      safeSet(getUserStorageKey(userId, 'goals'), []);
      safeSet(getUserStorageKey(userId, 'budgets'), []);
      safeSet(getUserStorageKey(userId, 'notifications'), []);

      setSyncStatus('synced');
      notifyDataChanged();
      return { ok: true, error: null };
    } catch (err: unknown) {
      logger.error('Failed to delete user data:', err);
      if (options?.forceLocalReset) {
        OutboxQueue.clear(userId);
        const cur = (cache.user?.baseCurrency as CurrencyCode) || 'USD';
        cache.accounts = options?.resetStandardAccounts ? getStandardAccounts(cur) : [];
        cache.categories = [];
        cache.transactions = [];
        cache.goals = [];
        cache.budgets = [];
        cache.notifications = [];

        safeSet(getUserStorageKey(userId, 'accounts'), cache.accounts);
        safeSet(getUserStorageKey(userId, 'categories'), []);
        safeSet(getUserStorageKey(userId, 'transactions'), []);
        safeSet(getUserStorageKey(userId, 'goals'), []);
        safeSet(getUserStorageKey(userId, 'budgets'), []);
        safeSet(getUserStorageKey(userId, 'notifications'), []);

        setSyncStatus('offline');
        notifyDataChanged();
        return { ok: true, error: null };
      }
      setSyncStatus('error');
      return { ok: false, error: err };
    }
  },

  // Reset to initial demo data (GUEST ONLY)
  resetToSeedData: async () => {
    cache.user = { ...INITIAL_USER, id: GUEST_USER_ID };
    cache.accounts = INITIAL_ACCOUNTS;
    cache.categories = INITIAL_CATEGORIES;
    cache.transactions = INITIAL_TRANSACTIONS;
    cache.goals = INITIAL_GOALS;
    cache.budgets = INITIAL_BUDGETS;
    cache.notifications = INITIAL_NOTIFICATIONS;
    cache.settings = INITIAL_SETTINGS;

    safeSet(getUserStorageKey(GUEST_USER_ID, 'user'), cache.user);
    safeSet(getUserStorageKey(GUEST_USER_ID, 'accounts'), cache.accounts);
    safeSet(getUserStorageKey(GUEST_USER_ID, 'categories'), cache.categories);
    safeSet(getUserStorageKey(GUEST_USER_ID, 'transactions'), cache.transactions);
    safeSet(getUserStorageKey(GUEST_USER_ID, 'goals'), cache.goals);
    safeSet(getUserStorageKey(GUEST_USER_ID, 'budgets'), cache.budgets);
    safeSet(getUserStorageKey(GUEST_USER_ID, 'notifications'), cache.notifications);
    safeSet(getUserStorageKey(GUEST_USER_ID, 'settings'), cache.settings);
    OutboxQueue.clear(GUEST_USER_ID);
    notifyDataChanged();
  },

  // Logout/clear all local data
  clearAllData: () => {
    const userId = currentActiveUserId;
    if (userId) {
      OutboxQueue.clear(userId);
    }
    lastPullTimestampByUser.clear();
    activeSyncPromisesByUser.clear();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('centra:') || key.startsWith('centra_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {
      // Ignore
    }
    currentActiveUserId = null;
    reloadCacheForUser(null);
    notifyDataChanged();
  },

  // Clear guest namespace completely (used when transitioning from guest to create account)
  clearGuestNamespace: () => {
    OutboxQueue.clear(GUEST_USER_ID);
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith('centra:guest:') ||
            key.startsWith('centra:guest_') ||
            key === 'centra_guest_flag' ||
            key === 'centra_is_guest' ||
            key === 'centra_is_guest_v2' ||
            key === 'centra_onboarding_step')
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {
      // Ignore
    }
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('centra_is_guest_session');
      }
    } catch {
      // Ignore
    }
    if (isGuestUser(currentActiveUserId)) {
      cache.user = null as unknown as UserProfile;
      cache.accounts = [];
      cache.categories = [];
      cache.transactions = [];
      cache.goals = [];
      cache.budgets = [];
      cache.notifications = [];
      cache.settings = INITIAL_SETTINGS;
    }
    notifyDataChanged();
  },

  // Seed demo data for testing or guest
  seedDemoData: async (userId: string = GUEST_USER_ID) => {
    const isGuest = isGuestUser(userId);
    const targetId = isGuest ? GUEST_USER_ID : userId;
    currentActiveUserId = targetId;

    cache.user = { ...INITIAL_USER, id: targetId, onboardingCompleted: true };
    cache.accounts = INITIAL_ACCOUNTS;
    cache.categories = INITIAL_CATEGORIES;
    cache.transactions = INITIAL_TRANSACTIONS;
    cache.goals = INITIAL_GOALS;
    cache.budgets = INITIAL_BUDGETS;
    cache.notifications = INITIAL_NOTIFICATIONS;
    cache.settings = INITIAL_SETTINGS;

    safeSet(getUserStorageKey(targetId, 'user'), cache.user);
    safeSet(getUserStorageKey(targetId, 'accounts'), cache.accounts);
    safeSet(getUserStorageKey(targetId, 'categories'), cache.categories);
    safeSet(getUserStorageKey(targetId, 'transactions'), cache.transactions);
    safeSet(getUserStorageKey(targetId, 'goals'), cache.goals);
    safeSet(getUserStorageKey(targetId, 'budgets'), cache.budgets);
    safeSet(getUserStorageKey(targetId, 'notifications'), cache.notifications);
    safeSet(getUserStorageKey(targetId, 'settings'), cache.settings);

    if (isGuest) {
      OutboxQueue.clear(GUEST_USER_ID);
      notifyDataChanged();
      return;
    }

    if (isSupabaseConfigured() && !isGuestUser(userId)) {
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        const profileFields = {
          name: INITIAL_USER.name || '',
          email: INITIAL_USER.email || null,
          avatar_url: INITIAL_USER.avatarUrl || null,
          base_currency: INITIAL_USER.baseCurrency || null,
          onboarding_completed: true,
          app_version: getAppVersion(),
          platform: getNativePlatform(),
          updated_at: new Date().toISOString(),
        };

        if (existingProfile) {
          await supabase.from('profiles').update(profileFields).eq('id', userId);
        } else {
          await supabase.from('profiles').insert({
            id: userId,
            ...profileFields,
          });
        }

        await supabase.from('accounts').upsert(INITIAL_ACCOUNTS.map(a => mapAccountToDb(a, userId)), { onConflict: 'user_id,id' });
        await supabase.from('categories').upsert(INITIAL_CATEGORIES.map(c => mapCategoryToDb(c, userId)), { onConflict: 'user_id,id' });
        await supabase.from('transactions').upsert(INITIAL_TRANSACTIONS.map(t => mapTransactionToDb(t, userId)), { onConflict: 'user_id,id' });
        await supabase.from('goals').upsert(INITIAL_GOALS.map(g => mapGoalToDb(g, userId)), { onConflict: 'user_id,id' });
        await supabase.from('budgets').upsert(INITIAL_BUDGETS.map(b => mapBudgetToDb(b, userId)), { onConflict: 'user_id,id' });
        await supabase.from('notifications').upsert(INITIAL_NOTIFICATIONS.map(n => mapNotificationToDb(n, userId)), { onConflict: 'user_id,id' });
        await supabase.from('settings').upsert(mapSettingsToDb(INITIAL_SETTINGS, userId), { onConflict: 'user_id' });
      } catch (err) {
        logger.warn('Error seeding Supabase rows:', err);
      }
    }
  },

  // Initialize a genuinely blank user state for real signups
  createBlankUserData: async (
    userId: string,
    userEmail?: string,
    userName?: string,
    avatarUrl?: string,
    baseCurrency?: CurrencyCode | null,
    categories: Category[] = [],
    initialAccounts: Account[] = []
  ) => {
    currentActiveUserId = userId;

    const userProfile: UserProfile = {
      id: userId,
      name: userName || '',
      email: userEmail || '',
      avatarUrl: avatarUrl || undefined,
      baseCurrency: baseCurrency || null,
      isPro: false,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
    };

    const userSettings: AppSettings = {
      ...INITIAL_SETTINGS,
      baseCurrency: baseCurrency || null,
      security: {
        biometricEnabled: false,
        pinLockEnabled: false,
      },
      notifications: {
        transactionAlerts: true,
        budgetOverruns: true,
        securityAlerts: true,
        billReminders: true,
        weeklyDigest: true,
      },
    };

    const welcomeNotification: NotificationItem[] = [
      {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif_${Date.now()}`,
        type: 'system',
        title: 'Welcome to Centra',
        message: 'Your account is ready. Add your first transaction to begin tracking.',
        timestamp: new Date().toISOString(),
        isRead: false,
        severity: 'info',
      },
    ];

    const cur = baseCurrency || 'USD';
    const effectiveCategories = categories.length > 0 ? categories : FIGMA_DEFAULT_CATEGORIES;
    const effectiveAccounts = initialAccounts.length > 0
      ? initialAccounts
      : FIGMA_DEFAULT_ACCOUNTS.map(a => ({ ...a, currency: cur }));

    cache.user = userProfile;
    cache.accounts = effectiveAccounts;
    cache.categories = effectiveCategories;
    cache.transactions = [];
    cache.goals = [];
    cache.budgets = [];
    cache.notifications = welcomeNotification;
    cache.settings = userSettings;

    safeSet(getUserStorageKey(userId, 'user'), cache.user);
    safeSet(getUserStorageKey(userId, 'accounts'), cache.accounts);
    safeSet(getUserStorageKey(userId, 'categories'), cache.categories);
    safeSet(getUserStorageKey(userId, 'transactions'), cache.transactions);
    safeSet(getUserStorageKey(userId, 'goals'), cache.goals);
    safeSet(getUserStorageKey(userId, 'budgets'), cache.budgets);
    safeSet(getUserStorageKey(userId, 'notifications'), cache.notifications);
    safeSet(getUserStorageKey(userId, 'settings'), cache.settings);
    // Note: Do NOT set last_synced_at before onboarding finishes, so hasCachedData(userId) correctly reflects onboarding state.
    notifyDataChanged();

    if (isSupabaseConfigured() && !isGuestUser(userId)) {
      try {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id, onboarding_completed')
          .eq('id', userId)
          .maybeSingle();

        if (!existing) {
          await supabase.from('profiles').insert({
            id: userId,
            name: userProfile.name || '',
            email: userProfile.email || null,
            avatar_url: userProfile.avatarUrl || null,
            base_currency: userProfile.baseCurrency || null,
            is_pro: false,
            plan_expiry: null,
            onboarding_completed: false,
            app_version: getAppVersion(),
            platform: getNativePlatform(),
            updated_at: new Date().toISOString(),
          });
        }

        if (categories.length > 0) {
          await supabase.from('categories').upsert(categories.map(c => mapCategoryToDb(c, userId)), { onConflict: 'user_id,id' });
        }
        if (initialAccounts.length > 0) {
          await supabase.from('accounts').upsert(initialAccounts.map(a => mapAccountToDb(a, userId)), { onConflict: 'user_id,id' });
        }
        await supabase.from('notifications').upsert(welcomeNotification.map(n => mapNotificationToDb(n, userId)), { onConflict: 'user_id,id' });
        await supabase.from('settings').upsert(mapSettingsToDb(userSettings, userId), { onConflict: 'user_id' });
      } catch (err) {
        logger.warn('Error creating blank Supabase rows:', err);
      }
    }
  },

  // Mark onboarding completed in cache, localStorage and Supabase
  markOnboardingCompleted: async (userId: string): Promise<boolean> => {
    if (cache.user) {
      cache.user = { ...cache.user, onboardingCompleted: true };
      safeSet(getUserStorageKey(userId, 'user'), cache.user);
    }
    if (isSupabaseConfigured() && !isGuestUser(userId)) {
      try {
        const { error } = await supabase.from('profiles').update({
          onboarding_completed: true,
          app_version: getAppVersion(),
          platform: getNativePlatform(),
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
        if (error) {
          logger.error('Supabase markOnboardingCompleted failed:', error);
          return false;
        }
      } catch (err) {
        logger.warn('Supabase markOnboardingCompleted failed:', err);
        return false;
      }
    }
    return true;
  },

  // Data export helpers
  exportAllData: (): string => {
    return CentraDB.exportDataAsJSON();
  },

  exportDataAsJSON: (): string => {
    const payload = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      user: cache.user,
      accounts: cache.accounts,
      categories: cache.categories,
      transactions: cache.transactions,
      goals: cache.goals,
      budgets: cache.budgets,
      settings: cache.settings,
    };
    return JSON.stringify(payload, null, 2);
  },

  persistBatch: async (mutated: {
    accountsToUpsert?: Account[];
    accountsToDelete?: string[];
    transactionsToUpsert?: Transaction[];
    transactionsToDelete?: string[];
    goalsToUpsert?: Goal[];
    goalsToDelete?: string[];
    budgetsToUpsert?: Budget[];
    budgetsToDelete?: string[];
    notificationsToUpsert?: NotificationItem[];
    notificationsToDelete?: string[];
  }): Promise<{ ok: boolean; error?: unknown }> => {
    // 1. Update in-memory cache and localStorage synchronously
    if (mutated.accountsToUpsert) {
      mutated.accountsToUpsert.forEach(acc => {
        const idx = cache.accounts.findIndex(a => a.id === acc.id);
        if (idx >= 0) cache.accounts[idx] = acc;
        else cache.accounts.push(acc);
      });
      safeSet(getUserStorageKey(currentActiveUserId, 'accounts'), cache.accounts);
    }
    if (mutated.accountsToDelete) {
      cache.accounts = cache.accounts.filter(a => !mutated.accountsToDelete!.includes(a.id));
      safeSet(getUserStorageKey(currentActiveUserId, 'accounts'), cache.accounts);
    }

    if (mutated.transactionsToUpsert) {
      mutated.transactionsToUpsert.forEach(tx => {
        const idx = cache.transactions.findIndex(t => t.id === tx.id);
        if (idx >= 0) cache.transactions[idx] = tx;
        else cache.transactions = [tx, ...cache.transactions];
      });
      safeSet(getUserStorageKey(currentActiveUserId, 'transactions'), cache.transactions);
    }
    if (mutated.transactionsToDelete) {
      cache.transactions = cache.transactions.filter(t => !mutated.transactionsToDelete!.includes(t.id));
      safeSet(getUserStorageKey(currentActiveUserId, 'transactions'), cache.transactions);
    }

    if (mutated.goalsToUpsert) {
      mutated.goalsToUpsert.forEach(goal => {
        const idx = cache.goals.findIndex(g => g.id === goal.id);
        if (idx >= 0) cache.goals[idx] = goal;
        else cache.goals.push(goal);
      });
      safeSet(getUserStorageKey(currentActiveUserId, 'goals'), cache.goals);
    }
    if (mutated.goalsToDelete) {
      cache.goals = cache.goals.filter(g => !mutated.goalsToDelete!.includes(g.id));
      safeSet(getUserStorageKey(currentActiveUserId, 'goals'), cache.goals);
    }

    if (mutated.budgetsToUpsert) {
      mutated.budgetsToUpsert.forEach(b => {
        const idx = cache.budgets.findIndex(item => item.id === b.id);
        if (idx >= 0) cache.budgets[idx] = b;
        else cache.budgets.push(b);
      });
      safeSet(getUserStorageKey(currentActiveUserId, 'budgets'), cache.budgets);
    }
    if (mutated.budgetsToDelete) {
      cache.budgets = cache.budgets.filter(b => !mutated.budgetsToDelete!.includes(b.id));
      safeSet(getUserStorageKey(currentActiveUserId, 'budgets'), cache.budgets);
    }

    if (mutated.notificationsToUpsert) {
      mutated.notificationsToUpsert.forEach(n => {
        const idx = cache.notifications.findIndex(item => item.id === n.id);
        if (idx >= 0) cache.notifications[idx] = n;
        else cache.notifications = [n, ...cache.notifications];
      });
      safeSet(getUserStorageKey(currentActiveUserId, 'notifications'), cache.notifications);
    }
    if (mutated.notificationsToDelete) {
      cache.notifications = cache.notifications.filter(n => !mutated.notificationsToDelete!.includes(n.id));
      safeSet(getUserStorageKey(currentActiveUserId, 'notifications'), cache.notifications);
    }

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { ok: true };
    }

    // 2. Build grouped outbox items sharing an operation ID
    const operationId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const outboxItems: Array<{
      userId: string;
      entity: 'accounts' | 'categories' | 'transactions' | 'goals' | 'budgets' | 'notifications' | 'settings' | 'profiles';
      op: 'upsert' | 'delete';
      recordId: string;
      payload?: Record<string, unknown>;
    }> = [];

    if (mutated.accountsToUpsert) {
      mutated.accountsToUpsert.forEach(acc => {
        outboxItems.push({ userId, entity: 'accounts', op: 'upsert', recordId: acc.id, payload: mapAccountToDb(acc, userId) });
      });
    }
    if (mutated.accountsToDelete) {
      mutated.accountsToDelete.forEach(id => {
        outboxItems.push({ userId, entity: 'accounts', op: 'delete', recordId: id });
      });
    }

    if (mutated.transactionsToUpsert) {
      mutated.transactionsToUpsert.forEach(tx => {
        outboxItems.push({ userId, entity: 'transactions', op: 'upsert', recordId: tx.id, payload: mapTransactionToDb(tx, userId) });
      });
    }
    if (mutated.transactionsToDelete) {
      mutated.transactionsToDelete.forEach(id => {
        outboxItems.push({ userId, entity: 'transactions', op: 'delete', recordId: id });
      });
    }

    if (mutated.goalsToUpsert) {
      mutated.goalsToUpsert.forEach(g => {
        outboxItems.push({ userId, entity: 'goals', op: 'upsert', recordId: g.id, payload: mapGoalToDb(g, userId) });
      });
    }
    if (mutated.goalsToDelete) {
      mutated.goalsToDelete.forEach(id => {
        outboxItems.push({ userId, entity: 'goals', op: 'delete', recordId: id });
      });
    }

    if (mutated.budgetsToUpsert) {
      mutated.budgetsToUpsert.forEach(b => {
        outboxItems.push({ userId, entity: 'budgets', op: 'upsert', recordId: b.id, payload: mapBudgetToDb(b, userId) });
      });
    }
    if (mutated.budgetsToDelete) {
      mutated.budgetsToDelete.forEach(id => {
        outboxItems.push({ userId, entity: 'budgets', op: 'delete', recordId: id });
      });
    }

    if (mutated.notificationsToUpsert) {
      mutated.notificationsToUpsert.forEach(n => {
        outboxItems.push({ userId, entity: 'notifications', op: 'upsert', recordId: n.id, payload: mapNotificationToDb(n, userId) });
      });
    }
    if (mutated.notificationsToDelete) {
      mutated.notificationsToDelete.forEach(id => {
        outboxItems.push({ userId, entity: 'notifications', op: 'delete', recordId: id });
      });
    }

    if (outboxItems.length > 0) {
      OutboxQueue.enqueueGroup(outboxItems, operationId);
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setSyncStatus('offline');
        notifyDataChanged();
        return { ok: true };
      }
      if (navigator.onLine) {
        CentraDB.processOutbox().catch(err => {
          logger.warn('Outbox process error after persistBatch:', err);
        });
      }
    }

    return { ok: true };
  },

  exportTransactionsCSV: (): string => {
    const escapeCsvField = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      // Neutralize CSV formula injection: characters =, +, -, @, \t, \r
      if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = ['ID', 'Date', 'Type', 'Merchant/Payee', 'Category', 'Account', 'Amount', 'Currency', 'Note', 'Tags'];
    const rows = cache.transactions.map(t => [
      escapeCsvField(t.id),
      escapeCsvField(t.date),
      escapeCsvField(t.type),
      escapeCsvField(t.merchant || ''),
      escapeCsvField(t.categoryName),
      escapeCsvField(t.accountName),
      escapeCsvField(t.amount),
      escapeCsvField(t.currency),
      escapeCsvField(t.note || ''),
      escapeCsvField((t.tags || []).join(';')),
    ]);
    return [headers.map(escapeCsvField).join(','), ...rows.map(r => r.join(','))].join('\n');
  },

  seedUserData: async (userId: string = GUEST_USER_ID, email?: string, name?: string) => {
    const targetId = isGuestUser(userId) ? GUEST_USER_ID : userId;
    await CentraDB.seedDemoData(targetId);
    if (email || name) {
      cache.user = {
        ...cache.user,
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
      };
      safeSet(getUserStorageKey(targetId, 'user'), cache.user);
    }
  },

  // Exported constants and helpers
  GUEST_USER_ID,
  isGuestUser,
  isValidUuid,
  cleanupLegacyGuestData,
  getActiveUserId,
};

// Global network & visibility listeners for automatic outbox draining and pull sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    CentraDB.processOutbox().then(() => {
      const activeUid = getActiveUserId();
      if (activeUid && !isGuestUser(activeUid)) {
        CentraDB.syncFromSupabase(activeUid);
      }
    });
  });
  window.addEventListener('offline', () => {
    setSyncStatus('offline');
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      CentraDB.processOutbox().then(() => {
        const activeUid = getActiveUserId();
        if (activeUid && !isGuestUser(activeUid)) {
          CentraDB.syncFromSupabase(activeUid);
        }
      });
    }
  });
}

