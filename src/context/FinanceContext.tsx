import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Account,
  Transaction,
  Category,
  Goal,
  Budget,
  NotificationItem,
  AppSettings,
  PeriodFilter,
  CurrencyCode,
  SyncStatus,
} from '../types';
import { CentraDB } from '../db/storage';
import { convertCurrency } from '../utils/formatters';
import { getPeriodDateRange } from '../utils/dates';
import brandLogo from '../assets/brand/logo.png';

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
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  togglePinTransaction: (id: string) => void;

  addAccount: (acc: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  transferFunds: (fromId: string, toId: string, amount: number, note?: string) => Promise<boolean>;

  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number, accountId?: string) => void;

  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;

  updateSettings: (updates: Partial<AppSettings>) => void;
  resetAllData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => CentraDB.getSyncStatus());

  const [accounts, setAccounts] = useState<Account[]>(() => CentraDB.getAccounts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => CentraDB.getTransactions());
  const [categories, setCategories] = useState<Category[]>(() => CentraDB.getCategories());
  const [goals, setGoals] = useState<Goal[]>(() => CentraDB.getGoals());
  const [budgets, setBudgets] = useState<Budget[]>(() => CentraDB.getBudgets());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => CentraDB.getNotifications());
  const [settings, setSettings] = useState<AppSettings>(() => CentraDB.getSettings());
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('this_month');

  // Hydration and sync status subscriptions (no mount-time bulk overwrite pushes!)
  useEffect(() => {
    setAccounts(CentraDB.getAccounts());
    setTransactions(CentraDB.getTransactions());
    setCategories(CentraDB.getCategories());
    setGoals(CentraDB.getGoals());
    setBudgets(CentraDB.getBudgets());
    setNotifications(CentraDB.getNotifications());
    setSettings(CentraDB.getSettings());
    setIsHydrated(true);

    const unsubscribe = CentraDB.onSyncStatusChange(status => {
      setSyncStatus(status);
    });
    return unsubscribe;
  }, []);

  // Theme application
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const baseCurrency: CurrencyCode = settings.baseCurrency || 'USD';

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
    return accounts.reduce((acc, account) => {
      const converted = convertCurrency(account.balance, account.currency, baseCurrency);
      return acc + converted;
    }, 0);
  }, [accounts, baseCurrency]);

  // Compute Period Income and Expenses
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

    return { periodIncome: income, periodExpenses: expenses };
  }, [filteredTransactions, baseCurrency]);

  const netSavings = periodIncome - periodExpenses;
  const savingsRate = periodIncome > 0 ? Math.max(0, (netSavings / periodIncome) * 100) : 0;

  // Period over period delta
  const previousPeriodBalanceDelta = useMemo(() => {
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
      return txDate.getFullYear() === now.getFullYear() - 1;
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
    const map: Record<string, { total: number; count: number; category: Category }> = {};

    categories
      .filter(c => c.type === 'expense')
      .forEach(c => {
        map[c.id] = { total: 0, count: 0, category: c };
      });

    filteredTransactions
      .filter(t => t.type === 'expense')
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
      .filter(item => item.total > 0 || item.count > 0)
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

  // Notification Trigger Helper
  const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: NotificationItem = {
      ...item,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    CentraDB.upsertNotification(newNotif);
  };

  // Add Transaction with balance adjustments and budget limit monitoring
  const addTransaction = async (txData: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const targetAccount = accounts.find(a => a.id === txData.accountId);
    const txAmount = Number(txData.amount);

    let newBalance = targetAccount ? targetAccount.balance : 0;
    if (txData.type === 'expense') {
      newBalance -= txAmount;
    } else if (txData.type === 'income') {
      newBalance += txAmount;
    }

    const newTx: Transaction = {
      ...txData,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx_${Date.now()}`,
      amount: txAmount,
      resultingBalance: newBalance,
    };

    // 1. Optimistic React State update
    setTransactions(prev => [newTx, ...prev]);

    // 2. Persist transaction per-record
    await CentraDB.upsertTransaction(newTx);

    // 3. Update account balance
    if (targetAccount) {
      const updatedAccount: Account = { ...targetAccount, balance: newBalance };
      setAccounts(prev =>
        prev.map(acc => (acc.id === targetAccount.id ? updatedAccount : acc))
      );
      await CentraDB.upsertAccount(updatedAccount);
    }

    // 4. Budget limit alert check
    if (txData.type === 'expense' && settings.notifications.budgetOverruns) {
      const budget = budgets.find(b => b.categoryId === txData.categoryId);
      if (budget) {
        const newSpent = budget.spentAmount + txAmount;
        const percentSpent = (newSpent / budget.limitAmount) * 100;
        const updatedBudget: Budget = { ...budget, spentAmount: newSpent };

        setBudgets(prev =>
          prev.map(b => (b.id === budget.id ? updatedBudget : b))
        );
        CentraDB.upsertBudget(updatedBudget);

        if (percentSpent >= 100) {
          addNotification({
            type: 'budget',
            title: `Budget Exceeded: ${budget.categoryName}`,
            message: `You've spent $${newSpent.toFixed(2)} of your $${budget.limitAmount.toFixed(2)} limit (${percentSpent.toFixed(0)}%).`,
            severity: 'alert',
          });
        } else if (percentSpent >= budget.alertThreshold) {
          addNotification({
            type: 'budget',
            title: `Budget Warning: ${budget.categoryName}`,
            message: `You've reached ${percentSpent.toFixed(0)}% of your $${budget.limitAmount.toFixed(2)} budget.`,
            severity: 'warning',
          });
        }
      }
    }

    // High transaction alert
    if (settings.notifications.transactionAlerts && txAmount >= 500) {
      addNotification({
        type: 'transaction',
        title: `High Amount Transaction Alert`,
        message: `${txData.type === 'income' ? 'Received' : 'Paid'} $${txAmount.toFixed(2)} (${txData.merchant || txData.categoryName}).`,
        severity: 'info',
      });
    }

    return newTx;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => {
      const next = prev.map(tx => (tx.id === id ? { ...tx, ...updates } : tx));
      const updated = next.find(t => t.id === id);
      if (updated) {
        CentraDB.upsertTransaction(updated);
      }
      return next;
    });
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    if (tx.type === 'transfer' && tx.toAccountId) {
      const fromAcc = accounts.find(a => a.id === tx.accountId);
      const toAcc = accounts.find(a => a.id === tx.toAccountId);
      if (fromAcc) {
        const revertedFrom = { ...fromAcc, balance: fromAcc.balance + tx.amount };
        CentraDB.upsertAccount(revertedFrom);
      }
      if (toAcc) {
        const revertedTo = { ...toAcc, balance: toAcc.balance - tx.amount };
        CentraDB.upsertAccount(revertedTo);
      }
      setAccounts(prev => prev.map(acc => {
        if (acc.id === tx.accountId) return { ...acc, balance: acc.balance + tx.amount };
        if (acc.id === tx.toAccountId) return { ...acc, balance: acc.balance - tx.amount };
        return acc;
      }));
    } else {
      const acc = accounts.find(a => a.id === tx.accountId);
      if (acc) {
        const reverted = tx.type === 'expense'
          ? acc.balance + tx.amount
          : acc.balance - tx.amount;
        const updatedAcc = { ...acc, balance: reverted };
        CentraDB.upsertAccount(updatedAcc);
        setAccounts(prev => prev.map(a => (a.id === tx.accountId ? updatedAcc : a)));
      }
    }

    setTransactions(prev => prev.filter(t => t.id !== id));
    CentraDB.deleteTransaction(id);
  };

  const togglePinTransaction = (id: string) => {
    setTransactions(prev => {
      const next = prev.map(tx => (tx.id === id ? { ...tx, isPinned: !tx.isPinned } : tx));
      const updated = next.find(t => t.id === id);
      if (updated) {
        CentraDB.upsertTransaction(updated);
      }
      return next;
    });
  };

  const addAccount = (accData: Omit<Account, 'id'>) => {
    const newAcc: Account = {
      ...accData,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `acc_${Date.now()}`,
    };
    setAccounts(prev => [...prev, newAcc]);
    CentraDB.upsertAccount(newAcc);
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts(prev => {
      const next = prev.map(a => (a.id === id ? { ...a, ...updates } : a));
      const updated = next.find(a => a.id === id);
      if (updated) {
        CentraDB.upsertAccount(updated);
      }
      return next;
    });
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    CentraDB.deleteAccount(id);
  };

  const transferFunds = async (
    fromId: string,
    toId: string,
    amount: number,
    note?: string
  ): Promise<boolean> => {
    const fromAcc = accounts.find(a => a.id === fromId);
    const toAcc = accounts.find(a => a.id === toId);
    if (!fromAcc || !toAcc || amount <= 0) return false;

    const convertedAmount = convertCurrency(amount, fromAcc.currency, toAcc.currency);

    const updatedFrom = { ...fromAcc, balance: fromAcc.balance - amount };
    const updatedTo = { ...toAcc, balance: toAcc.balance + convertedAmount };

    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id === fromId) return updatedFrom;
        if (acc.id === toId) return updatedTo;
        return acc;
      })
    );
    CentraDB.upsertAccount(updatedFrom);
    CentraDB.upsertAccount(updatedTo);

    const newTx: Transaction = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx_tr_${Date.now()}`,
      type: 'transfer',
      amount,
      currency: fromAcc.currency,
      categoryId: 'cat_transfer',
      categoryName: 'Transfer & Payment',
      categoryIcon: 'ArrowRightLeft',
      categoryColor: '#636E72',
      accountId: fromId,
      accountName: fromAcc.name,
      toAccountId: toId,
      recipient: toAcc.name,
      date: new Date().toISOString(),
      note: note || `Transfer to ${toAcc.name}`,
      tags: ['Transfer'],
    };

    setTransactions(prev => [newTx, ...prev]);
    CentraDB.upsertTransaction(newTx);

    addNotification({
      type: 'transaction',
      title: 'Funds Transferred Successfully',
      message: `Transferred $${amount.toFixed(2)} from ${fromAcc.name} to ${toAcc.name}.`,
      severity: 'success',
    });

    return true;
  };

  const addGoal = (goalData: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `goal_${Date.now()}`,
    };
    setGoals(prev => [...prev, newGoal]);
    CentraDB.upsertGoal(newGoal);

    addNotification({
      type: 'goal',
      title: 'New Savings Target Created! 🎯',
      message: `Started "${newGoal.name}" with target of $${newGoal.targetAmount.toLocaleString()}.`,
      severity: 'info',
    });
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals(prev => {
      const next = prev.map(g => (g.id === id ? { ...g, ...updates } : g));
      const updated = next.find(g => g.id === id);
      if (updated) {
        CentraDB.upsertGoal(updated);
      }
      return next;
    });
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    CentraDB.deleteGoal(id);
  };

  const contributeToGoal = (goalId: string, amount: number, accountId?: string) => {
    setGoals(prev =>
      prev.map(g => {
        if (g.id === goalId) {
          const newAmount = g.currentAmount + amount;
          const isCompleted = newAmount >= g.targetAmount;
          const updatedGoal = { ...g, currentAmount: newAmount, isCompleted };
          CentraDB.upsertGoal(updatedGoal);

          if (isCompleted && !g.isCompleted) {
            addNotification({
              type: 'goal',
              title: `Goal Achieved! 🎉`,
              message: `Congratulations! You reached your $${g.targetAmount.toLocaleString()} target for "${g.name}".`,
              severity: 'success',
            });
          }
          return updatedGoal;
        }
        return g;
      })
    );

    if (accountId) {
      setAccounts(prev =>
        prev.map(acc => {
          if (acc.id === accountId) {
            const updatedAcc = { ...acc, balance: acc.balance - amount };
            CentraDB.upsertAccount(updatedAcc);
            return updatedAcc;
          }
          return acc;
        })
      );
    }
  };

  const addBudget = (budgetData: Omit<Budget, 'id'>) => {
    const newBudget: Budget = {
      ...budgetData,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `bud_${Date.now()}`,
    };
    setBudgets(prev => [...prev, newBudget]);
    CentraDB.upsertBudget(newBudget);
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    setBudgets(prev => {
      const next = prev.map(b => (b.id === id ? { ...b, ...updates } : b));
      const updated = next.find(b => b.id === id);
      if (updated) {
        CentraDB.upsertBudget(updated);
      }
      return next;
    });
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
    CentraDB.deleteBudget(id);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => {
      const next = prev.map(n => (n.id === id ? { ...n, isRead: true } : n));
      const updated = next.find(n => n.id === id);
      if (updated) {
        CentraDB.upsertNotification(updated);
      }
      return next;
    });
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, isRead: true }));
      next.forEach(n => CentraDB.upsertNotification(n));
      return next;
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
    CentraDB.clearAllNotifications();
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      CentraDB.saveSettings(next);
      return next;
    });
  };

  const resetAllData = async () => {
    const activeUid = CentraDB.getUser()?.id;
    if (!activeUid || activeUid === 'guest') {
      await CentraDB.resetToSeedData();
    } else {
      await CentraDB.deleteAllUserData(activeUid);
    }
    setAccounts(CentraDB.getAccounts());
    setTransactions(CentraDB.getTransactions());
    setCategories(CentraDB.getCategories());
    setGoals(CentraDB.getGoals());
    setBudgets(CentraDB.getBudgets());
    setNotifications(CentraDB.getNotifications());
    setSettings(CentraDB.getSettings());
  };

  // Render clean loader before hydration completes
  if (!isHydrated) {
    return (
      <div className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#0A0E1A] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <img src={brandLogo} alt="Centra" className="w-10 h-10 object-contain select-none" />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Loading your finances...</span>
        </div>
      </div>
    );
  }

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        transactions,
        categories,
        goals,
        budgets,
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
        addBudget,
        updateBudget,
        deleteBudget,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
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
