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

// Helper for namespaced storage keys: centra:{userId}:{entity}
export function getUserStorageKey(userId: string | null | undefined, entity: string): string {
  const uid = userId && userId !== 'guest' ? userId : 'guest';
  return `centra:${uid}:${entity}`;
}

// Current active user ID tracked in memory
let currentActiveUserId: string | null = null;

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
      console.warn('Sync status listener error:', err);
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
      console.warn('Data change listener error:', err);
    }
  });
}

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

function isGuestUser(userId?: string | null): boolean {
  const uid = userId || currentActiveUserId || cache.user?.id;
  return !uid || uid === 'guest';
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

// Initialize cache for active user
function reloadCacheForUser(userId: string | null): void {
  currentActiveUserId = userId;
  const isGuest = isGuestUser(userId);

  if (isGuest) {
    // Guest starts with demo seed data
    cache.user = safeGet<UserProfile>(getUserStorageKey('guest', 'user'), INITIAL_USER);
    cache.accounts = safeGet<Account[]>(getUserStorageKey('guest', 'accounts'), INITIAL_ACCOUNTS);
    cache.categories = safeGet<Category[]>(getUserStorageKey('guest', 'categories'), INITIAL_CATEGORIES);
    cache.transactions = safeGet<Transaction[]>(getUserStorageKey('guest', 'transactions'), INITIAL_TRANSACTIONS);
    cache.goals = safeGet<Goal[]>(getUserStorageKey('guest', 'goals'), INITIAL_GOALS);
    cache.budgets = safeGet<Budget[]>(getUserStorageKey('guest', 'budgets'), INITIAL_BUDGETS);
    cache.notifications = safeGet<NotificationItem[]>(getUserStorageKey('guest', 'notifications'), INITIAL_NOTIFICATIONS);
    cache.settings = safeGet<AppSettings>(getUserStorageKey('guest', 'settings'), INITIAL_SETTINGS);
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
    cache.user = safeGet<UserProfile>(getUserStorageKey(userId, 'user'), emptyUser);
    cache.accounts = safeGet<Account[]>(getUserStorageKey(userId, 'accounts'), []);
    cache.categories = safeGet<Category[]>(getUserStorageKey(userId, 'categories'), []);
    cache.transactions = safeGet<Transaction[]>(getUserStorageKey(userId, 'transactions'), []);
    cache.goals = safeGet<Goal[]>(getUserStorageKey(userId, 'goals'), []);
    cache.budgets = safeGet<Budget[]>(getUserStorageKey(userId, 'budgets'), []);
    cache.notifications = safeGet<NotificationItem[]>(getUserStorageKey(userId, 'notifications'), []);
    cache.settings = safeGet<AppSettings>(getUserStorageKey(userId, 'settings'), INITIAL_SETTINGS);
  }
}

// Helpers to get active authenticated user id
const getActiveUserId = (): string | null => {
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
  system_key: cat.systemKey || null,
  name: cat.name,
  icon: cat.icon,
  color: cat.color,
  type: cat.type,
  budget_limit: cat.budgetLimit || null,
  updated_at: new Date().toISOString(),
});

const mapCategoryFromDb = (row: any): Category => ({
  id: row.id,
  systemKey: row.system_key || undefined,
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
  convertedAmount: row.converted_amount !== null && row.converted_amount !== undefined ? parseFloat(row.converted_amount) : undefined,
  exchangeRate: row.exchange_rate !== null && row.exchange_rate !== undefined ? parseFloat(row.exchange_rate) : undefined,
  goalId: row.goal_id || undefined,
  recipient: row.recipient || undefined,
  merchant: row.merchant || undefined,
  date: row.date,
  note: row.note || undefined,
  tags: row.tags || [],
  isPinned: !!row.is_pinned,
  isRecurring: !!row.is_recurring,
  recurringInterval: row.recurring_interval || undefined,
  resultingBalance: row.resulting_balance !== null ? parseFloat(row.resulting_balance) : undefined,
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
  spent_amount: b.spentAmount || 0,
  alert_threshold: b.alertThreshold,
  period: b.period,
  currency: b.currency || null,
  updated_at: new Date().toISOString(),
});

const mapBudgetFromDb = (row: any): Budget => ({
  id: row.id,
  categoryId: row.category_id,
  categoryName: row.category_name,
  categoryIcon: row.category_icon,
  categoryColor: row.category_color,
  limitAmount: parseFloat(row.limit_amount),
  spentAmount: parseFloat(row.spent_amount || '0'),
  alertThreshold: row.alert_threshold,
  period: row.period as any,
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
  base_currency: s.baseCurrency || null,
  privacy_mode: s.privacyMode,
  security: s.security,
  notifications: s.notifications,
  updated_at: new Date().toISOString(),
});

const mapSettingsFromDb = (row: any): AppSettings => ({
  theme: row.theme || 'light',
  baseCurrency: row.base_currency || null,
  privacyMode: !!row.privacy_mode,
  security: row.security || INITIAL_SETTINGS.security,
  notifications: row.notifications || INITIAL_SETTINGS.notifications,
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

const activeSyncPromisesByUser = new Map<string, Promise<{ ok: boolean; profile?: any; error?: any; throttled?: boolean }>>();
const lastPullTimestampByUser = new Map<string, number>();
const PULL_THROTTLE_MS = 30_000;

// Initialize cache for guest mode by default
reloadCacheForUser(null);

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
    const uid = userId || currentActiveUserId || cache.user?.id;
    if (!uid || uid === 'guest') return true;
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

  // ---------------------------------------------------------------------------
  // PER-RECORD REPOSITORY MUTATIONS (Optimistic Local + Supabase + Outbox)
  // ---------------------------------------------------------------------------

  // ACCOUNTS
  upsertAccount: async (acc: Account): Promise<{ data: Account | null; error: any }> => {
    // 1. Optimistic local update
    const existingIdx = cache.accounts.findIndex(a => a.id === acc.id);
    if (existingIdx >= 0) {
      cache.accounts[existingIdx] = acc;
    } else {
      cache.accounts.push(acc);
    }
    safeSet(getUserStorageKey(currentActiveUserId, 'accounts'), cache.accounts);

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { data: acc, error: null };
    }

    // 2. Remote write with outbox fallback
    const dbRow = mapAccountToDb(acc, userId);
    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('accounts').upsert(dbRow, { onConflict: 'user_id,id' });
      if (error) {
        console.warn('Supabase upsertAccount failed, queueing in outbox:', error);
        OutboxQueue.enqueue({ userId, entity: 'accounts', op: 'upsert', recordId: acc.id, payload: dbRow });
        setSyncStatus('error');
        return { data: acc, error };
      }
      setSyncStatus('synced');
      return { data: acc, error: null };
    } catch (err: any) {
      console.warn('Network error during upsertAccount, queueing in outbox:', err);
      OutboxQueue.enqueue({ userId, entity: 'accounts', op: 'upsert', recordId: acc.id, payload: dbRow });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { data: acc, error: err };
    }
  },

  deleteAccount: async (id: string): Promise<{ ok: boolean; error: any }> => {
    cache.accounts = cache.accounts.filter(a => a.id !== id);
    safeSet(getUserStorageKey(currentActiveUserId, 'accounts'), cache.accounts);

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { ok: true, error: null };
    }

    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) {
        console.warn('Supabase deleteAccount failed, queueing in outbox:', error);
        OutboxQueue.enqueue({ userId, entity: 'accounts', op: 'delete', recordId: id });
        setSyncStatus('error');
        return { ok: false, error };
      }
      setSyncStatus('synced');
      return { ok: true, error: null };
    } catch (err: any) {
      OutboxQueue.enqueue({ userId, entity: 'accounts', op: 'delete', recordId: id });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { ok: false, error: err };
    }
  },

  // CATEGORIES
  upsertCategory: async (cat: Category): Promise<{ data: Category | null; error: any }> => {
    const existingIdx = cache.categories.findIndex(c => c.id === cat.id);
    if (existingIdx >= 0) {
      cache.categories[existingIdx] = cat;
    } else {
      cache.categories.push(cat);
    }
    safeSet(getUserStorageKey(currentActiveUserId, 'categories'), cache.categories);

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { data: cat, error: null };
    }

    const dbRow = mapCategoryToDb(cat, userId);
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
    } catch (err: any) {
      OutboxQueue.enqueue({ userId, entity: 'categories', op: 'upsert', recordId: cat.id, payload: dbRow });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { data: cat, error: err };
    }
  },

  deleteCategory: async (id: string): Promise<{ ok: boolean; error: any }> => {
    cache.categories = cache.categories.filter(c => c.id !== id);
    safeSet(getUserStorageKey(currentActiveUserId, 'categories'), cache.categories);

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
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
    } catch (err: any) {
      OutboxQueue.enqueue({ userId, entity: 'categories', op: 'delete', recordId: id });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { ok: false, error: err };
    }
  },

  // TRANSACTIONS
  upsertTransaction: async (tx: Transaction): Promise<{ data: Transaction | null; error: any }> => {
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
    } catch (err: any) {
      OutboxQueue.enqueue({ userId, entity: 'transactions', op: 'upsert', recordId: tx.id, payload: dbRow });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { data: tx, error: err };
    }
  },

  deleteTransaction: async (id: string): Promise<{ ok: boolean; error: any }> => {
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
    } catch (err: any) {
      OutboxQueue.enqueue({ userId, entity: 'transactions', op: 'delete', recordId: id });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { ok: false, error: err };
    }
  },

  // GOALS
  upsertGoal: async (goal: Goal): Promise<{ data: Goal | null; error: any }> => {
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
    } catch (err: any) {
      OutboxQueue.enqueue({ userId, entity: 'goals', op: 'upsert', recordId: goal.id, payload: dbRow });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { data: goal, error: err };
    }
  },

  deleteGoal: async (id: string): Promise<{ ok: boolean; error: any }> => {
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
    } catch (err: any) {
      OutboxQueue.enqueue({ userId, entity: 'goals', op: 'delete', recordId: id });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { ok: false, error: err };
    }
  },

  // BUDGETS
  upsertBudget: async (budget: Budget): Promise<{ data: Budget | null; error: any }> => {
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
    } catch (err: any) {
      OutboxQueue.enqueue({ userId, entity: 'budgets', op: 'upsert', recordId: budget.id, payload: dbRow });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { data: budget, error: err };
    }
  },

  deleteBudget: async (id: string): Promise<{ ok: boolean; error: any }> => {
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
    } catch (err: any) {
      OutboxQueue.enqueue({ userId, entity: 'budgets', op: 'delete', recordId: id });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { ok: false, error: err };
    }
  },

  // NOTIFICATIONS
  upsertNotification: async (notif: NotificationItem): Promise<{ data: NotificationItem | null; error: any }> => {
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
    } catch (err: any) {
      OutboxQueue.enqueue({ userId, entity: 'notifications', op: 'upsert', recordId: notif.id, payload: dbRow });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { data: notif, error: err };
    }
  },

  deleteNotification: async (id: string): Promise<{ ok: boolean; error: any }> => {
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
    } catch (err: any) {
      OutboxQueue.enqueue({ userId, entity: 'notifications', op: 'delete', recordId: id });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { ok: false, error: err };
    }
  },

  clearAllNotifications: async (): Promise<{ ok: boolean; error: any }> => {
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
    } catch (err: any) {
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { ok: false, error: err };
    }
  },

  // SETTINGS
  saveSettings: async (settings: AppSettings): Promise<{ data: AppSettings | null; error: any }> => {
    cache.settings = settings;
    safeSet(getUserStorageKey(currentActiveUserId, 'settings'), settings);

    const userId = getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { data: settings, error: null };
    }

    const dbRow = mapSettingsToDb(settings, userId);
    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('settings').upsert(dbRow, { onConflict: 'user_id' });
      if (error) {
        console.warn('Supabase saveSettings failed, queueing in outbox:', error);
        OutboxQueue.enqueue({ userId, entity: 'settings', op: 'upsert', recordId: userId, payload: dbRow });
        setSyncStatus('error');
        return { data: settings, error };
      }
      setSyncStatus('synced');
      return { data: settings, error: null };
    } catch (err: any) {
      OutboxQueue.enqueue({ userId, entity: 'settings', op: 'upsert', recordId: userId, payload: dbRow });
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { data: settings, error: err };
    }
  },

  // USER PROFILE
  saveUser: async (user: UserProfile): Promise<{ data: UserProfile | null; error: any }> => {
    cache.user = user;
    safeSet(getUserStorageKey(currentActiveUserId, 'user'), user);

    const userId = user.id || getActiveUserId();
    if (isGuestUser(userId) || !isSupabaseConfigured() || !userId) {
      return { data: user, error: null };
    }

    try {
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (user.name !== undefined) updates.name = user.name;
      if (user.email !== undefined) updates.email = user.email;
      if (user.avatarUrl !== undefined) updates.avatar_url = user.avatarUrl;
      if (user.baseCurrency !== undefined) updates.base_currency = user.baseCurrency;
      if (user.onboardingCompleted === true) {
        updates.onboarding_completed = true;
      }

      setSyncStatus('syncing');
      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) {
        console.warn('Supabase saveUser failed:', error);
        setSyncStatus('error');
        return { data: user, error };
      }
      setSyncStatus('synced');
      return { data: user, error: null };
    } catch (err: any) {
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      return { data: user, error: err };
    }
  },

  // Bulk save backward compatibility (used during explicit imports or batch operations)
  saveAccounts: async (accounts: Account[]) => {
    cache.accounts = accounts;
    safeSet(getUserStorageKey(currentActiveUserId, 'accounts'), accounts);
  },
  saveCategories: async (categories: Category[]) => {
    cache.categories = categories;
    safeSet(getUserStorageKey(currentActiveUserId, 'categories'), categories);
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

    for (const item of pending) {
      try {
        let err: any = null;
        if (item.op === 'upsert') {
          const onConflict = item.entity === 'settings' ? 'user_id' : 'user_id,id';
          const { error } = await supabase.from(item.entity).upsert(item.payload, { onConflict });
          err = error;
        } else if (item.op === 'delete') {
          const { error } = await supabase.from(item.entity).delete().eq('id', item.recordId);
          err = error;
        }

        if (err) {
          errors++;
          OutboxQueue.update(userId, { ...item, retries: item.retries + 1, lastError: err.message });
        } else {
          processed++;
          OutboxQueue.remove(userId, item.id);
        }
      } catch (e: any) {
        errors++;
        OutboxQueue.update(userId, { ...item, retries: item.retries + 1, lastError: e?.message });
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
  ): Promise<{ ok: boolean; profile?: any; error?: any; throttled?: boolean }> => {
    if (!isSupabaseConfigured() || isGuestUser(userId)) {
      return { ok: true };
    }

    // 1. Drain outbox first (unthrottled!)
    await CentraDB.processOutbox();

    // 2. In-flight guard: prevent concurrent sync executions for the same user
    const inFlight = activeSyncPromisesByUser.get(userId);
    if (inFlight) {
      return inFlight;
    }

    const runSync = async () => {
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
          console.warn('Profile fetch error from Supabase:', profileError);
          setSyncStatus('error');
          return { ok: false, error: profileError };
        }

        if (profileData) {
          cache.user = {
            id: profileData.id,
            name: profileData.name || userName || '',
            email: profileData.email || userEmail || '',
            avatarUrl: profileData.avatar_url || undefined,
            baseCurrency: (profileData.base_currency as any) || null,
            onboardingCompleted: profileData.onboarding_completed ?? false,
            createdAt: profileData.created_at || new Date().toISOString(),
          };
          safeSet(getUserStorageKey(userId, 'user'), cache.user);
        }

        let anyFetchError = false;
        const pending = OutboxQueue.getPending(userId);

        // 2. Fetch Accounts
        const { data: accountsData, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', userId);

        if (!accountsError && accountsData) {
          const remote = accountsData.map(mapAccountFromDb);
          cache.accounts = mergeEntityWithOutbox('accounts', remote, cache.accounts, pending);
          safeSet(getUserStorageKey(userId, 'accounts'), cache.accounts);
        } else if (accountsError) {
          console.warn('Failed to fetch accounts:', accountsError);
          anyFetchError = true;
        }

        // 3. Fetch Categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId);

        if (!categoriesError && categoriesData) {
          const remote = categoriesData.map(mapCategoryFromDb);
          cache.categories = mergeEntityWithOutbox('categories', remote, cache.categories, pending);
          safeSet(getUserStorageKey(userId, 'categories'), cache.categories);
        } else if (categoriesError) {
          console.warn('Failed to fetch categories:', categoriesError);
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
          cache.transactions = mergeEntityWithOutbox('transactions', remote, cache.transactions, pending);
          safeSet(getUserStorageKey(userId, 'transactions'), cache.transactions);
        } else if (transactionsError) {
          console.warn('Failed to fetch transactions:', transactionsError);
          anyFetchError = true;
        }

        // 5. Fetch Goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId);

        if (!goalsError && goalsData) {
          const remote = goalsData.map(mapGoalFromDb);
          cache.goals = mergeEntityWithOutbox('goals', remote, cache.goals, pending);
          safeSet(getUserStorageKey(userId, 'goals'), cache.goals);
        } else if (goalsError) {
          console.warn('Failed to fetch goals:', goalsError);
          anyFetchError = true;
        }

        // 6. Fetch Budgets
        const { data: budgetsData, error: budgetsError } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', userId);

        if (!budgetsError && budgetsData) {
          const remote = budgetsData.map(mapBudgetFromDb);
          cache.budgets = mergeEntityWithOutbox('budgets', remote, cache.budgets, pending);
          safeSet(getUserStorageKey(userId, 'budgets'), cache.budgets);
        } else if (budgetsError) {
          console.warn('Failed to fetch budgets:', budgetsError);
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
          cache.notifications = mergeEntityWithOutbox('notifications', remote, cache.notifications, pending);
          safeSet(getUserStorageKey(userId, 'notifications'), cache.notifications);
        } else if (notifError) {
          console.warn('Failed to fetch notifications:', notifError);
          anyFetchError = true;
        }

        // 8. Fetch Settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        const pendingSettings = pending.find(item => item.entity === 'settings');
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
              console.warn('Fallback settings insert error:', settingsInsertErr);
            }
            cache.settings = INITIAL_SETTINGS;
            safeSet(getUserStorageKey(userId, 'settings'), cache.settings);
          }
        } else if (settingsError) {
          console.warn('Failed to fetch settings:', settingsError);
          anyFetchError = true;
        }

        if (!anyFetchError) {
          lastPullTimestampByUser.set(userId, Date.now());
          safeSet(getUserStorageKey(userId, 'last_synced_at'), new Date().toISOString());
          setSyncStatus('synced');
          notifyDataChanged();
          return { ok: true, profile: profileData };
        } else {
          setSyncStatus('error');
          return { ok: false, profile: profileData };
        }
      } catch (err) {
        console.warn('Error syncing from Supabase:', err);
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
  deleteAllUserData: async (userId: string): Promise<{ ok: boolean; error: any }> => {
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
            console.error(`Failed to delete remote records from ${table}:`, error);
            setSyncStatus('error');
            return { ok: false, error };
          }
        }
      }

      // Clear outbox & local user data ONLY if all remote deletions succeeded
      OutboxQueue.clear(userId);
      cache.accounts = [];
      cache.categories = [];
      cache.transactions = [];
      cache.goals = [];
      cache.budgets = [];
      cache.notifications = [];

      safeSet(getUserStorageKey(userId, 'accounts'), []);
      safeSet(getUserStorageKey(userId, 'categories'), []);
      safeSet(getUserStorageKey(userId, 'transactions'), []);
      safeSet(getUserStorageKey(userId, 'goals'), []);
      safeSet(getUserStorageKey(userId, 'budgets'), []);
      safeSet(getUserStorageKey(userId, 'notifications'), []);

      setSyncStatus('synced');
      notifyDataChanged();
      return { ok: true, error: null };
    } catch (err: any) {
      console.error('Failed to delete user data:', err);
      setSyncStatus('error');
      return { ok: false, error: err };
    }
  },

  // Reset to initial demo data (GUEST ONLY)
  resetToSeedData: async () => {
    cache.user = INITIAL_USER;
    cache.accounts = INITIAL_ACCOUNTS;
    cache.categories = INITIAL_CATEGORIES;
    cache.transactions = INITIAL_TRANSACTIONS;
    cache.goals = INITIAL_GOALS;
    cache.budgets = INITIAL_BUDGETS;
    cache.notifications = INITIAL_NOTIFICATIONS;
    cache.settings = INITIAL_SETTINGS;

    safeSet(getUserStorageKey('guest', 'user'), cache.user);
    safeSet(getUserStorageKey('guest', 'accounts'), cache.accounts);
    safeSet(getUserStorageKey('guest', 'categories'), cache.categories);
    safeSet(getUserStorageKey('guest', 'transactions'), cache.transactions);
    safeSet(getUserStorageKey('guest', 'goals'), cache.goals);
    safeSet(getUserStorageKey('guest', 'budgets'), cache.budgets);
    safeSet(getUserStorageKey('guest', 'notifications'), cache.notifications);
    safeSet(getUserStorageKey('guest', 'settings'), cache.settings);
    OutboxQueue.clear('guest');
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

  // Seed demo data for testing
  seedDemoData: async (userId: string) => {
    cache.user = { ...INITIAL_USER, id: userId, onboardingCompleted: true };
    cache.accounts = INITIAL_ACCOUNTS;
    cache.categories = INITIAL_CATEGORIES;
    cache.transactions = INITIAL_TRANSACTIONS;
    cache.goals = INITIAL_GOALS;
    cache.budgets = INITIAL_BUDGETS;
    cache.notifications = INITIAL_NOTIFICATIONS;
    cache.settings = INITIAL_SETTINGS;

    safeSet(getUserStorageKey(userId, 'user'), cache.user);
    safeSet(getUserStorageKey(userId, 'accounts'), cache.accounts);
    safeSet(getUserStorageKey(userId, 'categories'), cache.categories);
    safeSet(getUserStorageKey(userId, 'transactions'), cache.transactions);
    safeSet(getUserStorageKey(userId, 'goals'), cache.goals);
    safeSet(getUserStorageKey(userId, 'budgets'), cache.budgets);
    safeSet(getUserStorageKey(userId, 'notifications'), cache.notifications);
    safeSet(getUserStorageKey(userId, 'settings'), cache.settings);

    if (isSupabaseConfigured() && userId && userId !== 'guest') {
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
        console.warn('Error seeding Supabase rows:', err);
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
        message: 'Your account is ready. Add your first transaction or link an account to begin tracking.',
        timestamp: new Date().toISOString(),
        isRead: false,
        severity: 'info',
      },
    ];

    cache.user = userProfile;
    cache.accounts = initialAccounts;
    cache.categories = categories;
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

    if (isSupabaseConfigured() && userId && userId !== 'guest') {
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
        console.warn('Error creating blank Supabase rows:', err);
      }
    }
  },

  // Mark onboarding completed in cache, localStorage and Supabase
  markOnboardingCompleted: async (userId: string): Promise<boolean> => {
    if (cache.user) {
      cache.user = { ...cache.user, onboardingCompleted: true };
      safeSet(getUserStorageKey(userId, 'user'), cache.user);
    }
    if (isSupabaseConfigured() && userId && userId !== 'guest') {
      try {
        const { error } = await supabase.from('profiles').update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
        if (error) {
          console.error('Supabase markOnboardingCompleted failed:', error);
          return false;
        }
      } catch (err) {
        console.warn('Supabase markOnboardingCompleted failed:', err);
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
  }): Promise<{ ok: boolean; error?: any }> => {
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
      payload?: any;
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
      if (navigator.onLine) {
        CentraDB.processOutbox().catch(err => {
          console.warn('Outbox process error after persistBatch:', err);
        });
      }
    }

    return { ok: true };
  },

  exportTransactionsCSV: (): string => {
    const escapeCsvField = (val: any): string => {
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

  seedUserData: async (userId: string, email?: string, name?: string) => {
    await CentraDB.seedDemoData(userId);
    if (email || name) {
      cache.user = {
        ...cache.user,
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
      };
      safeSet(getUserStorageKey(userId, 'user'), cache.user);
    }
  },
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

