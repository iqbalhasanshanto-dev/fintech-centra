import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Account,
  Transaction,
  Category,
  Goal,
  GoalHistoryEntry,
  Budget,
  NotificationItem,
  AppSettings,
  PeriodFilter,
  CurrencyCode,
  SyncStatus,
} from '../types';
import {
  getGoalHistory,
  appendGoalHistory,
  saveGoalHistory,
  deleteGoalHistory,
} from '../utils/goalHistory';
import { CentraDB, isGuestUser } from '../db/storage';
import { convertCurrency, formatCurrency } from '../utils/formatters';
import { getPeriodDateRange } from '../utils/dates';
import { requestNotificationPermission, triggerSystemNotification } from '../utils/nativeNotifications';
import {
  FinanceState,
  OperationResult,
  deriveBudgetSpent,
  applyAddTransaction,
  applyUpdateTransaction,
  applyDeleteTransaction,
  applyTransferFunds,
  applyContributeToGoal,
  applyWithdrawFromGoal,
  applyDeleteAccount,
} from '../utils/financeOperations';
import { SyncRetryScreen } from '../components/auth/SyncRetryScreen';
import { logger } from '../utils/logger';

interface CategoryBreakdownItem {
  category: Category;
  total: number;
  percentage: number;
  transactionCount: number;
  previousPeriodTotal: number;
  trendPercentage: number;
}

interface FinancialInsight {
  title: string;
  description: string;
  type: 'spending' | 'saving' | 'budget' | 'positive';
  actionText?: string;
  metric?: string;
}

interface FinanceContextType {
  // Data lists
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  budgets: Budget[];
  notifications: NotificationItem[];
  settings: AppSettings;
  periodFilter: PeriodFilter;

  // Hydration & Sync Status
  isHydrated: boolean;
  syncStatus: SyncStatus;

  // Computed metrics
  totalBalance: number;
  previousPeriodBalanceDelta: { amount: number; percentage: number; isPositive: boolean };
  periodIncome: number;
  periodExpenses: number;
  netSavings: number;
  savingsRate: number;
  topSpendCategory: CategoryBreakdownItem | null;
  categoryBreakdown: CategoryBreakdownItem[];
  incomeBreakdown: CategoryBreakdownItem[];
  currentInsight: FinancialInsight;
  unreadNotificationsCount: number;

  // Actions
  setPeriodFilter: (filter: PeriodFilter) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  togglePinTransaction: (id: string) => void;

  addAccount: (acc: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string, mode?: 'block' | 'cascade') => Promise<void>;
  transferFunds: (fromId: string, toId: string, amount: number, note?: string) => Promise<boolean>;

  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number, accountId?: string) => Promise<void>;
  withdrawFromGoal: (goalId: string, amount: number, accountId?: string) => Promise<void>;

  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;

  // 5-Second Undo Delete
  pendingUndo: { id: string; type: 'transaction' | 'goal'; label: string } | null;
  undoLastDelete: () => Promise<void>;
  dismissUndo: () => void;

  updateSettings: (updates: Partial<AppSettings>) => void;
  resetAllData: () => Promise<{ ok: boolean; error?: unknown }>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode; userId?: string }> = ({ children, userId: propUserId }) => {
  const activeUser = CentraDB.getUser();
  const userId = propUserId || activeUser?.id;
  const isGuest = isGuestUser(userId);
  const hasCache = CentraDB.hasCachedData(userId);

  // First-sync gating: if real user has no cached data, gate with loading screen until sync completes
  const [firstSyncState, setFirstSyncState] = useState<'ready' | 'loading' | 'error'>(() => {
    if (isGuest || hasCache) return 'ready';
    return 'loading';
  });

  const [isHydrated, setIsHydrated] = useState(() => isGuest || hasCache);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => CentraDB.getSyncStatus());

  const [accounts, setAccounts] = useState<Account[]>(() => CentraDB.getAccounts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => CentraDB.getTransactions());
  const [categories, setCategories] = useState<Category[]>(() => CentraDB.getCategories());
  const [goals, setGoals] = useState<Goal[]>(() =>
    CentraDB.getGoals().map(g => ({ ...g, history: getGoalHistory(g.id) }))
  );
  const [budgets, setBudgets] = useState<Budget[]>(() => CentraDB.getBudgets());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => CentraDB.getNotifications());
  const [settings, setSettings] = useState<AppSettings>(() => CentraDB.getSettings());
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('this_month');

  // Ref holding the LATEST state to run operations against (eliminates stale closures)
  const latestStateRef = useRef<FinanceState>({
    accounts: CentraDB.getAccounts(),
    transactions: CentraDB.getTransactions(),
    categories: CentraDB.getCategories(),
    goals: CentraDB.getGoals().map(g => ({ ...g, history: getGoalHistory(g.id) })),
    budgets: CentraDB.getBudgets(),
    notifications: CentraDB.getNotifications(),
    settings: CentraDB.getSettings(),
  });

  // Helper to reload state from in-memory cache without triggering any persistence effects
  const reloadFromCache = useCallback(() => {
    const accs = CentraDB.getAccounts();
    const txs = CentraDB.getTransactions();
    const cats = CentraDB.getCategories();
    const gs = CentraDB.getGoals().map(g => ({ ...g, history: getGoalHistory(g.id) }));
    const buds = CentraDB.getBudgets();
    const notifs = CentraDB.getNotifications();
    const sets = CentraDB.getSettings();

    latestStateRef.current = {
      accounts: accs,
      transactions: txs,
      categories: cats,
      goals: gs,
      budgets: buds,
      notifications: notifs,
      settings: sets,
    };

    setAccounts(accs);
    setTransactions(txs);
    setCategories(cats);
    setGoals(gs);
    setBudgets(buds);
    setNotifications(notifs);
    setSettings(sets);
  }, []);

  // Sync active user in storage layer when userId changes
  useEffect(() => {
    CentraDB.setActiveUser(userId || null);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Re-hydrate context state from local DB whenever active user switches
    reloadFromCache();
  }, [userId, reloadFromCache]);

  // Hydration, sync status, and data change subscriptions
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial re-hydration and subscription setup on provider mount
    reloadFromCache();
    setIsHydrated(true);

    const unsubscribeData = CentraDB.onDataChanged(() => {
      reloadFromCache();
    });

    const unsubscribeSync = CentraDB.onSyncStatusChange(status => {
      setSyncStatus(status);
    });

    return () => {
      unsubscribeData();
      unsubscribeSync();
    };
  }, [reloadFromCache]);

  // First-sync gating runner: executes when user has no cache on this device
  useEffect(() => {
    if (isGuest) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Immediately transition guest mode to ready state without remote sync
      setFirstSyncState('ready');
      setIsHydrated(true);
      return;
    }
    if (firstSyncState === 'loading' && userId && !isGuest) {
      let isMounted = true;
      CentraDB.syncFromSupabase(userId, undefined, undefined, { force: true })
        .then(res => {
          if (!isMounted) return;
          if (res.ok) {
            reloadFromCache();
            setIsHydrated(true);
            setFirstSyncState('ready');
          } else {
            // Failed: if still no cache on device, show retry screen
            if (!CentraDB.hasCachedData(userId)) {
              setFirstSyncState('error');
            } else {
              setIsHydrated(true);
              setFirstSyncState('ready');
            }
          }
        })
        .catch(() => {
          if (!isMounted) return;
          if (!CentraDB.hasCachedData(userId)) {
            setFirstSyncState('error');
          } else {
            setIsHydrated(true);
            setFirstSyncState('ready');
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [firstSyncState, userId, isGuest, reloadFromCache]);

  // Background sync on mount for users who already have cached data
  useEffect(() => {
    if (firstSyncState === 'ready' && !isGuest && userId) {
      CentraDB.syncFromSupabase(userId);
    }
  }, [userId, isGuest, firstSyncState]);

  // Reconnect (online) and tab focus (visibilitychange) sync triggers
  // Outbox drain is immediate; pull sync is subject to in-flight guard and 30s throttle
  useEffect(() => {
    if (isGuest || !userId) return;

    const handleOnline = () => {
      CentraDB.processOutbox().then(() => {
        CentraDB.syncFromSupabase(userId);
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        CentraDB.processOutbox().then(() => {
          CentraDB.syncFromSupabase(userId);
        });
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, isGuest]);

  // Theme application
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const isSystemDark = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  const baseCurrency: CurrencyCode = settings.baseCurrency || 'USD';

  // Budgets: spent is DERIVED from transactions for the active period in the budget's currency
  const derivedBudgets = useMemo(() => {
    return budgets.map(b => ({
      ...b,
      spentAmount: deriveBudgetSpent(b, transactions, baseCurrency),
    }));
  }, [budgets, transactions, baseCurrency]);

  // Filter transactions by active period using centralized date boundaries
  const filteredTransactions = useMemo(() => {
    const { start, end } = getPeriodDateRange(periodFilter);
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= start && txDate <= end;
    });
  }, [transactions, periodFilter]);

  // Compute Total Live Balance across all accounts in base currency
  const totalBalance = useMemo(() => {
    if (!isGuest && transactions.length > 0) {
      let income = 0;
      let expenses = 0;
      transactions.forEach(tx => {
        const amountInBase = convertCurrency(tx.amount, tx.currency, baseCurrency);
        if (tx.type === 'income') income += amountInBase;
        else if (tx.type === 'expense') expenses += amountInBase;
      });
      return income - expenses;
    }
    return accounts.reduce((acc, account) => {
      const converted = convertCurrency(account.balance, account.currency, baseCurrency);
      return acc + converted;
    }, 0);
  }, [accounts, baseCurrency, isGuest, transactions]);

  // Synchronize accounts to match totalBalance if there's any discrepancy
  const synchronizedAccounts = useMemo(() => {
    if (isGuest || transactions.length === 0 || accounts.length === 0) {
      return accounts;
    }
    const currentSumInBase = accounts.reduce((sum, acc) => {
      return sum + convertCurrency(acc.balance, acc.currency, baseCurrency);
    }, 0);

    const diff = totalBalance - currentSumInBase;
    if (Math.abs(diff) < 0.001) {
      return accounts;
    }

    // Apply the diff to the primary account (or first account)
    const primaryIndex = accounts.findIndex(a => a.isPrimary);
    const targetIndex = primaryIndex >= 0 ? primaryIndex : 0;
    const targetAccount = accounts[targetIndex];
    const diffInTargetCurrency = convertCurrency(diff, baseCurrency, targetAccount.currency);

    return accounts.map((acc, idx) => {
      if (idx !== targetIndex) return acc;
      return {
        ...acc,
        balance: Math.round((acc.balance + diffInTargetCurrency) * 100) / 100,
      };
    });
  }, [accounts, baseCurrency, isGuest, totalBalance, transactions.length]);

  useEffect(() => {
    latestStateRef.current.accounts = synchronizedAccounts;
  }, [synchronizedAccounts]);

  // Compute Period Income and Expenses (with leftover prior balance carryover)
  const { periodIncome, periodExpenses } = useMemo(() => {
    let income = 0;
    let expenses = 0;

    filteredTransactions.forEach(tx => {
      const amountInBase = convertCurrency(tx.amount, tx.currency, baseCurrency);
      if (tx.type === 'income') {
        income += amountInBase;
      } else if (tx.type === 'expense') {
        expenses += amountInBase;
      }
    });

    let priorNetBalance = 0;
    if (periodFilter !== 'all') {
      const { start } = getPeriodDateRange(periodFilter);
      let priorIncome = 0;
      let priorExpenses = 0;
      transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        if (txDate < start) {
          const amountInBase = convertCurrency(tx.amount, tx.currency, baseCurrency);
          if (tx.type === 'income') {
            priorIncome += amountInBase;
          } else if (tx.type === 'expense') {
            priorExpenses += amountInBase;
          }
        }
      });
      priorNetBalance = Math.max(0, priorIncome - priorExpenses);
    }

    return {
      periodIncome: income + priorNetBalance,
      periodExpenses: expenses,
    };
  }, [filteredTransactions, transactions, periodFilter, baseCurrency]);

  const netSavings = periodIncome - periodExpenses;
  const savingsRate = periodIncome > 0
    ? (netSavings / periodIncome) * 100
    : (periodExpenses > 0 ? -100 : 0);

  // Period over period delta
  const previousPeriodBalanceDelta = useMemo(() => {
    if (periodFilter === 'all') {
      return { amount: 0, percentage: 0, isPositive: true };
    }
    const now = new Date();
    const prevPeriodTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      if (periodFilter === 'this_month') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
      }
      if (periodFilter === 'last_month') {
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        return txDate.getMonth() === twoMonthsAgo.getMonth() && txDate.getFullYear() === twoMonthsAgo.getFullYear();
      }
      if (periodFilter === 'last_90_days') {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const oneEightyDaysAgo = new Date();
        oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);
        return txDate >= oneEightyDaysAgo && txDate < ninetyDaysAgo;
      }
      if (periodFilter === 'this_year') {
        return txDate.getFullYear() === now.getFullYear() - 1;
      }
      return false;
    });

    let prevIncome = 0;
    let prevExpenses = 0;
    prevPeriodTransactions.forEach(tx => {
      const amountInBase = convertCurrency(tx.amount, tx.currency, baseCurrency);
      if (tx.type === 'income') {
        prevIncome += amountInBase;
      } else if (tx.type === 'expense') {
        prevExpenses += amountInBase;
      }
    });

    const currentNetSavings = periodIncome - periodExpenses;
    const prevNetSavings = prevIncome - prevExpenses;
    const deltaAmount = currentNetSavings - prevNetSavings;
    const isPositive = deltaAmount >= 0;
    const percentage =
      Math.abs(prevNetSavings) > 0
        ? Math.min(99.9, Math.abs((deltaAmount / Math.abs(prevNetSavings)) * 100))
        : 0;

    return {
      amount: Math.abs(deltaAmount),
      percentage,
      isPositive,
    };
  }, [transactions, periodFilter, periodIncome, periodExpenses, baseCurrency]);

  // Category breakdown for expenses
  const categoryBreakdown = useMemo(() => {
    const isLegacyGoalCategory = (c: { systemKey?: string; name?: string }) =>
      c.systemKey === 'goal_contribution' ||
      c.systemKey === 'goal_withdrawal' ||
      (c.name && c.name.toLowerCase().includes('goal contribution')) ||
      (c.name && c.name.toLowerCase().includes('goal withdrawal'));

    const map: Record<string, { total: number; count: number; category: Category }> = {};

    categories
      .filter(c => c.type === 'expense' && !isLegacyGoalCategory(c))
      .forEach(c => {
        map[c.id] = { total: 0, count: 0, category: c };
      });

    filteredTransactions
      .filter(t => t.type === 'expense' && !isLegacyGoalCategory({ systemKey: t.categoryId, name: t.categoryName }))
      .forEach(tx => {
        const amountInBase = convertCurrency(tx.amount, tx.currency, baseCurrency);
        if (map[tx.categoryId]) {
          map[tx.categoryId].total += amountInBase;
          map[tx.categoryId].count += 1;
        } else {
          const fallbackCat: Category = {
            id: tx.categoryId,
            name: tx.categoryName || 'Other',
            icon: tx.categoryIcon || 'Tag',
            color: tx.categoryColor || '#94A3B8',
            type: 'expense',
          };
          map[tx.categoryId] = { total: amountInBase, count: 1, category: fallbackCat };
        }
      });

    const items: CategoryBreakdownItem[] = Object.values(map)
      .filter(item => (item.total > 0 || item.count > 0) && !isLegacyGoalCategory(item.category))
      .map(item => ({
        category: item.category,
        total: item.total,
        percentage: periodExpenses > 0 ? (item.total / periodExpenses) * 100 : 0,
        transactionCount: item.count,
        previousPeriodTotal: 0,
        trendPercentage: 0,
      }))
      .sort((a, b) => b.total - a.total);

    return items;
  }, [categories, filteredTransactions, periodExpenses, baseCurrency]);

  // Income category breakdown
  const incomeBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number; category: Category }> = {};

    categories
      .filter(c => c.type === 'income')
      .forEach(c => {
        map[c.id] = { total: 0, count: 0, category: c };
      });

    filteredTransactions
      .filter(t => t.type === 'income')
      .forEach(tx => {
        const amountInBase = convertCurrency(tx.amount, tx.currency, baseCurrency);
        if (map[tx.categoryId]) {
          map[tx.categoryId].total += amountInBase;
          map[tx.categoryId].count += 1;
        } else {
          const fallbackCat: Category = {
            id: tx.categoryId,
            name: tx.categoryName || 'Income',
            icon: tx.categoryIcon || 'TrendingUp',
            color: tx.categoryColor || '#10B981',
            type: 'income',
          };
          map[tx.categoryId] = { total: amountInBase, count: 1, category: fallbackCat };
        }
      });

    const items: CategoryBreakdownItem[] = Object.values(map)
      .filter(item => item.total > 0 || item.count > 0)
      .map(item => ({
        category: item.category,
        total: item.total,
        percentage: periodIncome > 0 ? (item.total / periodIncome) * 100 : 0,
        transactionCount: item.count,
        previousPeriodTotal: 0,
        trendPercentage: 0,
      }))
      .sort((a, b) => b.total - a.total);

    return items;
  }, [categories, filteredTransactions, periodIncome, baseCurrency]);

  const topSpendCategory = useMemo(() => {
    return categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;
  }, [categoryBreakdown]);

  // Dynamic Rule-Based Financial Insights
  const currentInsight = useMemo((): FinancialInsight => {
    const overBudget = budgets.find(b => {
      const catSpent = filteredTransactions
        .filter(t => t.categoryId === b.categoryId && t.type === 'expense')
        .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, baseCurrency), 0);
      return catSpent > b.limitAmount;
    });

    if (overBudget) {
      return {
        title: `Over Budget in ${overBudget.categoryName}`,
        description: `You've exceeded your monthly plan. Rebalance allocations or reduce discretionary spending.`,
        type: 'budget',
        actionText: 'Review Budget',
        metric: `Alert`,
      };
    }

    if (savingsRate >= 30) {
      return {
        title: 'Outstanding Savings Rate! 🌟',
        description: `You saved ${savingsRate.toFixed(0)}% of your earnings this cycle. Consider parking surplus in a high-yield goal.`,
        type: 'saving',
        actionText: 'Contribute to Goal',
        metric: `${savingsRate.toFixed(0)}%`,
      };
    }

    if (topSpendCategory && topSpendCategory.percentage > 35) {
      return {
        title: `High Concentration in ${topSpendCategory.category.name}`,
        description: `${topSpendCategory.category.name} represents ${topSpendCategory.percentage.toFixed(0)}% of your expenses.`,
        type: 'spending',
        actionText: 'View Breakdown',
        metric: `${topSpendCategory.percentage.toFixed(0)}%`,
      };
    }

    return {
      title: 'Stable Cashflow Momentum',
      description: 'Your outflow is on track with your historical patterns. Keep monitoring daily logs.',
      type: 'positive',
      actionText: 'Add Record',
    };
  }, [budgets, filteredTransactions, savingsRate, topSpendCategory, baseCurrency]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Atomic execution runner: executes pure finance operation against latestStateRef,
  // updates latestStateRef synchronously, applies React state, and persists mutated diffs in one group.
  const executeOperation = useCallback(async (opRunner: (state: FinanceState) => OperationResult): Promise<OperationResult> => {
    const currentState = latestStateRef.current;
    const result = opRunner(currentState);
    if (!result.ok) {
      throw new Error(result.error || 'Operation failed');
    }

    // Advance ref synchronously so immediate subsequent calls in the same event tick read the updated state!
    latestStateRef.current = result.nextState;

    // React state updates
    if (result.mutated.accountsToUpsert || result.mutated.accountsToDelete) {
      setAccounts(result.nextState.accounts);
    }
    if (result.mutated.transactionsToUpsert || result.mutated.transactionsToDelete) {
      setTransactions(result.nextState.transactions);
    }
    if (result.mutated.goalsToUpsert || result.mutated.goalsToDelete) {
      setGoals(result.nextState.goals);
    }
    if (result.mutated.budgetsToUpsert || result.mutated.budgetsToDelete) {
      setBudgets(result.nextState.budgets);
    }
    if (result.mutated.notificationsToUpsert || result.mutated.notificationsToDelete) {
      setNotifications(result.nextState.notifications);
      if (result.mutated.notificationsToUpsert) {
        for (const notif of result.mutated.notificationsToUpsert) {
          triggerSystemNotification(notif.title, notif.message, notif.id).catch(err => {
            logger.warn('Failed to dispatch system notification:', err);
          });
        }
      }
    }

    // Persist mutated records as a group
    await CentraDB.persistBatch(result.mutated);

    return result;
  }, []);

  // 5-Second Undo Delete pending state
  const pendingDeleteRef = useRef<{
    id: string;
    type: 'transaction' | 'goal';
    timer: NodeJS.Timeout;
    executeCommit: () => Promise<void>;
    undo: () => Promise<void>;
  } | null>(null);

  const [pendingUndo, setPendingUndo] = useState<{ id: string; type: 'transaction' | 'goal'; label: string } | null>(null);

  const undoLastDelete = useCallback(async (): Promise<void> => {
    if (pendingDeleteRef.current) {
      await pendingDeleteRef.current.undo();
    }
  }, []);

  const dismissUndo = useCallback((): void => {
    if (pendingDeleteRef.current) {
      pendingDeleteRef.current.executeCommit();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pendingDeleteRef.current) {
        clearTimeout(pendingDeleteRef.current.timer);
        pendingDeleteRef.current.executeCommit();
      }
    };
  }, []);

  // Request notification permission automatically when an authenticated user enters the app
  useEffect(() => {
    if (!isGuest && userId) {
      requestNotificationPermission().catch(err => {
        logger.warn('Failed to request notification permission:', err);
      });
    }
  }, [isGuest, userId]);

  // 2-Month Rolling Data Retention & Monthly Notification Reminder
  useEffect(() => {
    if (!isHydrated) return;

    // Prune transactions older than Current Month + Previous Month
    CentraDB.pruneExpiredTransactions(userId).catch(err => {
      logger.warn('Failed to prune expired transactions:', err);
    });

    // Monthly Retention Reminder Notification (Deterministic ID: retention-reminder:${YYYY-MM})
    const now = new Date();
    const yyyyMm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const reminderId = `retention-reminder:${yyyyMm}`;

    const alreadyReminded = latestStateRef.current.notifications.some(n => n.id === reminderId);
    if (!alreadyReminded) {
      const reminderTitle = '2-Month Data Retention Reminder 🗓️';
      const reminderMsg =
        'Centra keeps your transaction history for the Current Month and Previous Month (2 months total). Export a CSV backup anytime from Settings before older months roll over.';

      const reminderItem: NotificationItem = {
        id: reminderId,
        title: reminderTitle,
        message: reminderMsg,
        type: 'system',
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      executeOperation(state => {
        if (state.notifications.some(n => n.id === reminderId)) {
          return { ok: true, nextState: state, mutated: {}, notificationsToEmit: [] };
        }
        return {
          ok: true,
          nextState: {
            ...state,
            notifications: [reminderItem, ...state.notifications],
          },
          mutated: {
            notificationsToUpsert: [reminderItem],
          },
          notificationsToEmit: [reminderItem],
        };
      }).catch(err => {
        logger.warn('Failed to create monthly retention reminder notification:', err);
      });
    }
  }, [isHydrated, userId, executeOperation]);

  // Notification Trigger Helper
  const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: NotificationItem = {
      ...item,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    triggerSystemNotification(newNotif.title, newNotif.message, newNotif.id).catch(err => {
      logger.warn('Failed to dispatch system notification:', err);
    });
    executeOperation(state => ({
      ok: true,
      nextState: {
        ...state,
        notifications: [newNotif, ...state.notifications],
      },
      mutated: {
        notificationsToUpsert: [newNotif],
      },
      notificationsToEmit: [newNotif],
    }));
  };

  const addTransaction = async (txData: Omit<Transaction, 'id'>): Promise<Transaction> => {
    let finalTxData = txData;
    if (!txData.categoryId) {
      let uncategorizedCat = latestStateRef.current.categories.find(c => c.systemKey === 'uncategorized');
      if (!uncategorizedCat) {
        const refreshed = await CentraDB.ensureSystemCategories(userId);
        setCategories(refreshed);
        latestStateRef.current = { ...latestStateRef.current, categories: refreshed };
        uncategorizedCat = refreshed.find(c => c.systemKey === 'uncategorized');
      }
      if (!uncategorizedCat) {
        throw new Error('Missing system category for uncategorized transaction');
      }
      finalTxData = {
        ...txData,
        categoryId: uncategorizedCat.id,
        categoryName: uncategorizedCat.name,
        categoryIcon: uncategorizedCat.icon,
        categoryColor: uncategorizedCat.color,
      };
    }
    const res = await executeOperation(state => applyAddTransaction(state, finalTxData));
    return res.createdTransaction!;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<void> => {
    await executeOperation(state => applyUpdateTransaction(state, id, updates));
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    if (pendingDeleteRef.current) {
      await pendingDeleteRef.current.executeCommit();
    }

    const tx = latestStateRef.current.transactions.find(t => t.id === id);
    if (!tx) return;

    const txIndex = latestStateRef.current.transactions.findIndex(t => t.id === id);
    const preAccounts = latestStateRef.current.accounts;

    // Apply deletion locally and reverse account balances
    const res = applyDeleteTransaction(latestStateRef.current, id);
    if (!res.ok) return;

    latestStateRef.current = res.nextState;
    setTransactions(res.nextState.transactions);
    setAccounts(res.nextState.accounts);
    CentraDB.setCachedTransactions(res.nextState.transactions);
    CentraDB.setCachedAccounts(res.nextState.accounts);

    const executeCommit = async () => {
      try {
        await CentraDB.deleteTransaction(id);
      } catch (err) {
        logger.warn('Failed to permanently delete transaction in Supabase:', err);
      }
      if (pendingDeleteRef.current?.id === id) {
        pendingDeleteRef.current = null;
        setPendingUndo(null);
      }
    };

    const undo = async () => {
      if (pendingDeleteRef.current?.timer) {
        clearTimeout(pendingDeleteRef.current.timer);
      }
      const currentTxs = latestStateRef.current.transactions;
      const restored = [...currentTxs];
      restored.splice(Math.min(txIndex, restored.length), 0, tx);

      latestStateRef.current = {
        ...latestStateRef.current,
        transactions: restored,
        accounts: preAccounts,
      };
      setTransactions(restored);
      setAccounts(preAccounts);
      CentraDB.setCachedTransactions(restored);
      CentraDB.setCachedAccounts(preAccounts);
      pendingDeleteRef.current = null;
      setPendingUndo(null);
    };

    const timer = setTimeout(() => {
      executeCommit();
    }, 5000);

    pendingDeleteRef.current = {
      id,
      type: 'transaction',
      timer,
      executeCommit,
      undo,
    };

    setPendingUndo({
      id,
      type: 'transaction',
      label: 'Transaction deleted',
    });
  };

  const togglePinTransaction = (id: string) => {
    executeOperation(state => {
      const nextTxs = state.transactions.map(tx => tx.id === id ? { ...tx, isPinned: !tx.isPinned } : tx);
      const updated = nextTxs.find(t => t.id === id);
      return {
        ok: true,
        nextState: { ...state, transactions: nextTxs },
        mutated: { transactionsToUpsert: updated ? [updated] : [] },
        notificationsToEmit: [],
      };
    });
  };

  const addAccount = (accData: Omit<Account, 'id'>) => {
    if (!settings.baseCurrency) {
      throw new Error('BASE_CURRENCY_REQUIRED: Please choose a base currency in Settings before adding an account.');
    }
    const newAcc: Account = {
      ...accData,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `acc_${Date.now()}`,
    };
    executeOperation(state => ({
      ok: true,
      nextState: { ...state, accounts: [...state.accounts, newAcc] },
      mutated: { accountsToUpsert: [newAcc] },
      notificationsToEmit: [],
      createdAccount: newAcc,
    }));
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    executeOperation(state => {
      const nextAccounts = state.accounts.map(a => a.id === id ? { ...a, ...updates } : a);
      const updated = nextAccounts.find(a => a.id === id);
      return {
        ok: true,
        nextState: { ...state, accounts: nextAccounts },
        mutated: { accountsToUpsert: updated ? [updated] : [] },
        notificationsToEmit: [],
      };
    });
  };

  const deleteAccount = async (id: string, mode: 'block' | 'cascade' = 'cascade'): Promise<void> => {
    await executeOperation(state => applyDeleteAccount(state, id, mode));
  };

  const transferFunds = async (
    fromId: string,
    toId: string,
    amount: number,
    note?: string
  ): Promise<boolean> => {
    try {
      let transferCat = latestStateRef.current.categories.find(c => c.systemKey === 'transfer');
      if (!transferCat) {
        const refreshed = await CentraDB.ensureSystemCategories(userId);
        setCategories(refreshed);
        latestStateRef.current = { ...latestStateRef.current, categories: refreshed };
        transferCat = refreshed.find(c => c.systemKey === 'transfer');
      }
      if (!transferCat) {
        throw new Error('Missing system category for transfer');
      }

      await executeOperation(state => applyTransferFunds(state, { fromId, toId, amount, note }));
      return true;
    } catch (err) {
      logger.warn('Transfer funds failed:', err);
      return false;
    }
  };

  const addGoal = (goalData: Omit<Goal, 'id'>) => {
    const goalId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `goal_${Date.now()}`;
    const initialDeposit = goalData.currentAmount || 0;
    const historyEntries: GoalHistoryEntry[] = [];

    if (initialDeposit > 0) {
      const initialEntry: GoalHistoryEntry = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `gh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        goalId,
        type: 'initial',
        amount: initialDeposit,
        date: new Date().toISOString(),
        note: 'Initial deposit',
        balanceAfter: initialDeposit,
      };
      appendGoalHistory(initialEntry);
      historyEntries.push(initialEntry);
    }

    const newGoal: Goal = {
      ...goalData,
      id: goalId,
      currentAmount: initialDeposit,
      history: historyEntries,
    };

    const notif: NotificationItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif_${Date.now()}`,
      type: 'goal',
      title: 'New Savings Target Created! 🎯',
      message: `Started "${newGoal.name}" with target of ${formatCurrency(newGoal.targetAmount, settings.baseCurrency)}.`,
      timestamp: new Date().toISOString(),
      isRead: false,
      severity: 'info',
    };

    executeOperation(state => ({
      ok: true,
      nextState: {
        ...state,
        goals: [...state.goals, newGoal],
        notifications: [notif, ...state.notifications],
      },
      mutated: {
        goalsToUpsert: [newGoal],
        notificationsToUpsert: [notif],
      },
      notificationsToEmit: [notif],
      createdGoal: newGoal,
    }));
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    executeOperation(state => {
      const nextGoals = state.goals.map(g => g.id === id ? { ...g, ...updates } : g);
      const updated = nextGoals.find(g => g.id === id);
      return {
        ok: true,
        nextState: { ...state, goals: nextGoals },
        mutated: { goalsToUpsert: updated ? [updated] : [] },
        notificationsToEmit: [],
      };
    });
  };

  const deleteGoal = (id: string) => {
    if (pendingDeleteRef.current) {
      pendingDeleteRef.current.executeCommit();
    }

    const goal = latestStateRef.current.goals.find(g => g.id === id);
    if (!goal) return;

    const goalIndex = latestStateRef.current.goals.findIndex(g => g.id === id);
    const historySnapshot = getGoalHistory(id);

    const nextGoals = latestStateRef.current.goals.filter(g => g.id !== id);
    latestStateRef.current = {
      ...latestStateRef.current,
      goals: nextGoals,
    };
    setGoals(nextGoals);
    CentraDB.setCachedGoals(nextGoals);

    const executeCommit = async () => {
      try {
        await CentraDB.deleteGoal(id);
        deleteGoalHistory(id);
      } catch (err) {
        logger.warn('Failed to permanently delete goal in Supabase:', err);
      }
      if (pendingDeleteRef.current?.id === id) {
        pendingDeleteRef.current = null;
        setPendingUndo(null);
      }
    };

    const undo = async () => {
      if (pendingDeleteRef.current?.timer) {
        clearTimeout(pendingDeleteRef.current.timer);
      }
      const currentGoals = latestStateRef.current.goals;
      const restored = [...currentGoals];
      restored.splice(Math.min(goalIndex, restored.length), 0, {
        ...goal,
        history: historySnapshot,
      });

      latestStateRef.current = {
        ...latestStateRef.current,
        goals: restored,
      };
      setGoals(restored);
      saveGoalHistory(id, historySnapshot);
      CentraDB.setCachedGoals(restored);
      pendingDeleteRef.current = null;
      setPendingUndo(null);
    };

    const timer = setTimeout(() => {
      executeCommit();
    }, 5000);

    pendingDeleteRef.current = {
      id,
      type: 'goal',
      timer,
      executeCommit,
      undo,
    };

    setPendingUndo({
      id,
      type: 'goal',
      label: 'Goal deleted',
    });
  };

  const contributeToGoal = async (goalId: string, amount: number, noteOrAccountId?: string): Promise<void> => {
    const goal = latestStateRef.current.goals.find(g => g.id === goalId);
    if (!goal) throw new Error('Goal not found');

    const newAmount = goal.currentAmount + amount;
    const cleanNote = typeof noteOrAccountId === 'string' && !noteOrAccountId.startsWith('acc_') ? noteOrAccountId : undefined;
    const entry: GoalHistoryEntry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `gh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      goalId,
      type: 'add',
      amount,
      date: new Date().toISOString(),
      note: cleanNote,
      balanceAfter: newAmount,
    };
    appendGoalHistory(entry);

    const updatedGoal: Goal = {
      ...goal,
      currentAmount: newAmount,
      isCompleted: newAmount >= goal.targetAmount,
      history: [entry, ...(goal.history || getGoalHistory(goalId))],
    };

    await executeOperation(state => ({
      ok: true,
      nextState: {
        ...state,
        goals: state.goals.map(g => g.id === goalId ? updatedGoal : g),
      },
      mutated: {
        goalsToUpsert: [updatedGoal],
      },
      notificationsToEmit: [],
    }));
  };

  const withdrawFromGoal = async (goalId: string, amount: number, noteOrAccountId?: string): Promise<void> => {
    const goal = latestStateRef.current.goals.find(g => g.id === goalId);
    if (!goal) throw new Error('Goal not found');

    const newAmount = Math.max(0, goal.currentAmount - amount);
    const cleanNote = typeof noteOrAccountId === 'string' && !noteOrAccountId.startsWith('acc_') ? noteOrAccountId : undefined;
    const entry: GoalHistoryEntry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `gh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      goalId,
      type: 'withdraw',
      amount,
      date: new Date().toISOString(),
      note: cleanNote,
      balanceAfter: newAmount,
    };
    appendGoalHistory(entry);

    const updatedGoal: Goal = {
      ...goal,
      currentAmount: newAmount,
      isCompleted: false,
      history: [entry, ...(goal.history || getGoalHistory(goalId))],
    };

    await executeOperation(state => ({
      ok: true,
      nextState: {
        ...state,
        goals: state.goals.map(g => g.id === goalId ? updatedGoal : g),
      },
      mutated: {
        goalsToUpsert: [updatedGoal],
      },
      notificationsToEmit: [],
    }));
  };

  const addBudget = (budgetData: Omit<Budget, 'id'>) => {
    const newBudget: Budget = {
      ...budgetData,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `bud_${Date.now()}`,
      spentAmount: 0,
    };
    executeOperation(state => ({
      ok: true,
      nextState: { ...state, budgets: [...state.budgets, newBudget] },
      mutated: { budgetsToUpsert: [newBudget] },
      notificationsToEmit: [],
      createdBudget: newBudget,
    }));
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    executeOperation(state => {
      const nextBudgets = state.budgets.map(b => b.id === id ? { ...b, ...updates } : b);
      const updated = nextBudgets.find(b => b.id === id);
      return {
        ok: true,
        nextState: { ...state, budgets: nextBudgets },
        mutated: { budgetsToUpsert: updated ? [updated] : [] },
        notificationsToEmit: [],
      };
    });
  };

  const deleteBudget = (id: string) => {
    executeOperation(state => ({
      ok: true,
      nextState: { ...state, budgets: state.budgets.filter(b => b.id !== id) },
      mutated: { budgetsToDelete: [id] },
      notificationsToEmit: [],
    }));
  };

  const markNotificationAsRead = (id: string) => {
    executeOperation(state => {
      const nextNotifs = state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
      const updated = nextNotifs.find(n => n.id === id);
      return {
        ok: true,
        nextState: { ...state, notifications: nextNotifs },
        mutated: { notificationsToUpsert: updated ? [updated] : [] },
        notificationsToEmit: [],
      };
    });
  };

  const markAllNotificationsAsRead = () => {
    executeOperation(state => {
      const nextNotifs = state.notifications.map(n => ({ ...n, isRead: true }));
      return {
        ok: true,
        nextState: { ...state, notifications: nextNotifs },
        mutated: { notificationsToUpsert: nextNotifs },
        notificationsToEmit: [],
      };
    });
  };

  const deleteNotification = (id: string) => {
    executeOperation(state => ({
      ok: true,
      nextState: { ...state, notifications: state.notifications.filter(n => n.id !== id) },
      mutated: { notificationsToDelete: [id] },
      notificationsToEmit: [],
    }));
  };

  const clearNotifications = () => {
    const isRetention = (n: NotificationItem) =>
      n.id.startsWith('retention-reminder:') || n.title.includes('2-Month Data Retention Reminder');
    const retentionNotif = latestStateRef.current.notifications.find(isRetention);
    const notifIds = latestStateRef.current.notifications
      .filter(n => !isRetention(n))
      .map(n => n.id);

    executeOperation(state => ({
      ok: true,
      nextState: { ...state, notifications: retentionNotif ? [retentionNotif] : [] },
      mutated: { notificationsToDelete: notifIds },
      notificationsToEmit: [],
    }));
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    const next = { ...latestStateRef.current.settings, ...updates };
    latestStateRef.current.settings = next;
    setSettings(next);
    await CentraDB.saveSettings(next);
  };

  const resetAllData = async (): Promise<{ ok: boolean; error?: unknown }> => {
    const activeUid = CentraDB.getUser()?.id;
    if (isGuestUser(activeUid)) {
      await CentraDB.resetToSeedData();
      reloadFromCache();
      return { ok: true, error: null };
    } else {
      const res = await CentraDB.deleteAllUserData(activeUid, { forceLocalReset: true, resetStandardAccounts: true });
      if (res.ok) {
        reloadFromCache();
      }
      return res;
    }
  };

  // First-sync failed for real user with no local cache -> Retry screen (real users only)
  if (!isGuest && firstSyncState === 'error') {
    return <SyncRetryScreen onRetry={() => setFirstSyncState('loading')} />;
  }

  return (
    <FinanceContext.Provider
      value={{
        accounts: synchronizedAccounts,
        transactions,
        categories,
        goals,
        budgets: derivedBudgets,
        notifications,
        settings,
        periodFilter,
        isHydrated,
        syncStatus,
        totalBalance,
        previousPeriodBalanceDelta,
        periodIncome,
        periodExpenses,
        netSavings,
        savingsRate,
        topSpendCategory,
        categoryBreakdown,
        incomeBreakdown,
        currentInsight,
        unreadNotificationsCount,
        setPeriodFilter,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        togglePinTransaction,
        addAccount,
        updateAccount,
        deleteAccount,
        transferFunds,
        addGoal,
        updateGoal,
        deleteGoal,
        contributeToGoal,
        withdrawFromGoal,
        addBudget,
        updateBudget,
        deleteBudget,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearNotifications,
        pendingUndo,
        undoLastDelete,
        dismissUndo,
        updateSettings,
        resetAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
