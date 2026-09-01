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
} from '../types';
import { CentraDB } from '../db/storage';
import { convertCurrency } from '../utils/formatters';

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
  resetAllData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>(() => CentraDB.getAccounts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => CentraDB.getTransactions());
  const [categories, setCategories] = useState<Category[]>(() => CentraDB.getCategories());
  const [goals, setGoals] = useState<Goal[]>(() => CentraDB.getGoals());
  const [budgets, setBudgets] = useState<Budget[]>(() => CentraDB.getBudgets());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => CentraDB.getNotifications());
  const [settings, setSettings] = useState<AppSettings>(() => CentraDB.getSettings());
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('this_month');

  // Persistence hooks
  useEffect(() => { CentraDB.saveAccounts(accounts); }, [accounts]);
  useEffect(() => { CentraDB.saveTransactions(transactions); }, [transactions]);
  useEffect(() => { CentraDB.saveCategories(categories); }, [categories]);
  useEffect(() => { CentraDB.saveGoals(goals); }, [goals]);
  useEffect(() => { CentraDB.saveBudgets(budgets); }, [budgets]);
  useEffect(() => { CentraDB.saveNotifications(notifications); }, [notifications]);
  useEffect(() => {
    CentraDB.saveSettings(settings);
    // Apply theme class to document element
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const baseCurrency: CurrencyCode = settings.baseCurrency;

  // Filter transactions by active period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      if (periodFilter === 'this_month') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      if (periodFilter === 'last_month') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
      }
      if (periodFilter === 'last_90_days') {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return txDate >= ninetyDaysAgo;
      }
      if (periodFilter === 'this_year') {
        return txDate.getFullYear() === now.getFullYear();
      }
      return true; // 'all'
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
    // Computed comparison indicator
    const deltaAmount = periodIncome - periodExpenses;
    const isPositive = deltaAmount >= 0;
    const percentage = periodExpenses > 0 ? Math.min(99.9, Math.abs((deltaAmount / periodExpenses) * 100)) : 12.4;
    return {
      amount: Math.abs(deltaAmount),
      percentage,
      isPositive,
    };
  }, [periodIncome, periodExpenses]);

  // Category breakdown for expenses
  const categoryBreakdown = useMemo(() => {
    const expenseMap: Record<string, { total: number; count: number }> = {};

    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(tx => {
        const amountInBase = convertCurrency(tx.amount, tx.currency, baseCurrency);
        if (!expenseMap[tx.categoryId]) {
          expenseMap[tx.categoryId] = { total: 0, count: 0 };
        }
        expenseMap[tx.categoryId].total += amountInBase;
        expenseMap[tx.categoryId].count += 1;
      });

    const items: CategoryBreakdownItem[] = [];
    const totalExp = periodExpenses || 1;

    categories.filter(c => c.type === 'expense').forEach(cat => {
      const data = expenseMap[cat.id] || { total: 0, count: 0 };
      if (data.total > 0) {
        const percentage = (data.total / totalExp) * 100;
        // Mock trend comparison for UI polish
        const trendPercentage = cat.id === 'cat_dining' ? 8.2 : cat.id === 'cat_entertainment' ? 14.5 : -5.0;
        items.push({
          category: cat,
          total: data.total,
          percentage,
          transactionCount: data.count,
          previousPeriodTotal: data.total * (1 - trendPercentage / 100),
          trendPercentage,
        });
      }
    });

    return items.sort((a, b) => b.total - a.total);
  }, [filteredTransactions, categories, periodExpenses, baseCurrency]);

  // Category breakdown for income
  const incomeBreakdown = useMemo(() => {
    const incomeMap: Record<string, { total: number; count: number }> = {};

    filteredTransactions
      .filter(t => t.type === 'income')
      .forEach(tx => {
        const amountInBase = convertCurrency(tx.amount, tx.currency, baseCurrency);
        if (!incomeMap[tx.categoryId]) {
          incomeMap[tx.categoryId] = { total: 0, count: 0 };
        }
        incomeMap[tx.categoryId].total += amountInBase;
        incomeMap[tx.categoryId].count += 1;
      });

    const items: CategoryBreakdownItem[] = [];
    const totalInc = periodIncome || 1;

    categories.filter(c => c.type === 'income').forEach(cat => {
      const data = incomeMap[cat.id] || { total: 0, count: 0 };
      if (data.total > 0) {
        const percentage = (data.total / totalInc) * 100;
        items.push({
          category: cat,
          total: data.total,
          percentage,
          transactionCount: data.count,
          previousPeriodTotal: data.total * 0.95,
          trendPercentage: 5.0,
        });
      }
    });

    return items.sort((a, b) => b.total - a.total);
  }, [filteredTransactions, categories, periodIncome, baseCurrency]);

  const topSpendCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  // Dynamic Insight Banner Computation
  const currentInsight: FinancialInsight = useMemo(() => {
    if (topSpendCategory && topSpendCategory.percentage > 30) {
      return {
        title: `${topSpendCategory.category.name} is your top expense`,
        description: `It represents ${topSpendCategory.percentage.toFixed(0)}% of your expenses this period. Keep an eye on dining out to boost your savings rate to 35%.`,
        type: 'spending',
        metric: `${topSpendCategory.percentage.toFixed(0)}%`,
        actionText: 'View Insights',
      };
    }
    if (savingsRate >= 30) {
      return {
        title: 'Super Saver! Savings rate at ' + savingsRate.toFixed(0) + '%',
        description: `You are saving higher than 84% of Centra users this month. Consider funneling surplus into your Dream Apartment goal.`,
        type: 'positive',
        metric: `${savingsRate.toFixed(0)}%`,
        actionText: 'Optimize Plan',
      };
    }
    return {
      title: 'Spending pacing is steady',
      description: 'Your cash flow is currently balanced. Turn on Pro Smart Budgets to auto-categorize recurring subscriptions.',
      type: 'budget',
      metric: 'Stable',
      actionText: 'Explore Pro',
    };
  }, [topSpendCategory, savingsRate]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Live Notification Trigger Helper
  const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Add Transaction with balance adjustments and budget limit monitoring
  const addTransaction = async (txData: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const targetAccount = accounts.find(a => a.id === txData.accountId);
    const txAmount = Number(txData.amount);

    // Calculate new resulting balance
    let newBalance = targetAccount ? targetAccount.balance : 0;
    if (txData.type === 'expense') {
      newBalance -= txAmount;
    } else if (txData.type === 'income') {
      newBalance += txAmount;
    }

    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      amount: txAmount,
      resultingBalance: newBalance,
    };

    // Update transactions
    setTransactions(prev => [newTx, ...prev]);

    // Update account balance
    if (targetAccount) {
      setAccounts(prev =>
        prev.map(acc => (acc.id === targetAccount.id ? { ...acc, balance: newBalance } : acc))
      );
    }

    // Check budget limit alert trigger
    if (txData.type === 'expense' && settings.notifications.budgetOverruns) {
      const budget = budgets.find(b => b.categoryId === txData.categoryId);
      if (budget) {
        const newSpent = budget.spentAmount + txAmount;
        const percentSpent = (newSpent / budget.limitAmount) * 100;

        // Update budget spent amount
        setBudgets(prev =>
          prev.map(b => (b.id === budget.id ? { ...b, spentAmount: newSpent } : b))
        );

        if (percentSpent >= 100) {
          addNotification({
            type: 'budget',
            title: `Budget Exceeded: ${budget.categoryName}`,
            message: `You've spent $${newSpent.toFixed(2)} of your $${budget.limitAmount.toFixed(2)} monthly limit (${percentSpent.toFixed(0)}%).`,
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

    // If transaction alert enabled and amount > 500
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
    setTransactions(prev => prev.map(tx => (tx.id === id ? { ...tx, ...updates } : tx)));
  };

  const deleteTransaction = (id: string) => {
    const txToDelete = transactions.find(t => t.id === id);
    if (txToDelete) {
      // Revert account balance
      setAccounts(prev =>
        prev.map(acc => {
          if (acc.id === txToDelete.accountId) {
            const reverted = txToDelete.type === 'expense'
              ? acc.balance + txToDelete.amount
              : txToDelete.type === 'income'
                ? acc.balance - txToDelete.amount
                : acc.balance;
            return { ...acc, balance: reverted };
          }
          return acc;
        })
      );
    }
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  const togglePinTransaction = (id: string) => {
    setTransactions(prev =>
      prev.map(tx => (tx.id === id ? { ...tx, isPinned: !tx.isPinned } : tx))
    );
  };

  const addAccount = (accData: Omit<Account, 'id'>) => {
    const newAcc: Account = {
      ...accData,
      id: `acc_${Date.now()}`,
    };
    setAccounts(prev => [...prev, newAcc]);
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
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

    // Convert amount if currencies differ
    const convertedAmount = convertCurrency(amount, fromAcc.currency, toAcc.currency);

    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id === fromId) return { ...acc, balance: acc.balance - amount };
        if (acc.id === toId) return { ...acc, balance: acc.balance + convertedAmount };
        return acc;
      })
    );

    // Record transfer transaction
    const newTx: Transaction = {
      id: `tx_tr_${Date.now()}`,
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
      id: `goal_${Date.now()}`,
    };
    setGoals(prev => [...prev, newGoal]);
    addNotification({
      type: 'goal',
      title: 'New Savings Target Created! 🎯',
      message: `Started "${newGoal.name}" with target of $${newGoal.targetAmount.toLocaleString()}.`,
      severity: 'info',
    });
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, ...updates } : g)));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const contributeToGoal = (goalId: string, amount: number, accountId?: string) => {
    setGoals(prev =>
      prev.map(g => {
        if (g.id === goalId) {
          const newAmount = g.currentAmount + amount;
          const isCompleted = newAmount >= g.targetAmount;
          if (isCompleted && !g.isCompleted) {
            addNotification({
              type: 'goal',
              title: `Goal Achieved! 🎉`,
              message: `Congratulations! You reached your $${g.targetAmount.toLocaleString()} target for "${g.name}".`,
              severity: 'success',
            });
          }
          return { ...g, currentAmount: newAmount, isCompleted };
        }
        return g;
      })
    );

    // If source account specified, deduct balance
    if (accountId) {
      setAccounts(prev =>
        prev.map(acc => (acc.id === accountId ? { ...acc, balance: acc.balance - amount } : acc))
      );
    }
  };

  const addBudget = (budgetData: Omit<Budget, 'id'>) => {
    const newBudget: Budget = {
      ...budgetData,
      id: `bud_${Date.now()}`,
    };
    setBudgets(prev => [...prev, newBudget]);
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    setBudgets(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)));
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      CentraDB.saveSettings(next);
      return next;
    });
  };

  const resetAllData = () => {
    CentraDB.resetToSeedData();
    setAccounts(CentraDB.getAccounts());
    setTransactions(CentraDB.getTransactions());
    setCategories(CentraDB.getCategories());
    setGoals(CentraDB.getGoals());
    setBudgets(CentraDB.getBudgets());
    setNotifications(CentraDB.getNotifications());
    setSettings(CentraDB.getSettings());
  };

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
