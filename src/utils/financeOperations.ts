import {
  Account,
  Transaction,
  Category,
  Goal,
  Budget,
  NotificationItem,
  AppSettings,
  CurrencyCode,
} from '../types';
import {
  addMoney,
  subMoney,
  roundMoney,
  convertCurrencyWithRate,
  validateAccountFunds,
} from './money';
import { convertCurrency, formatCurrency } from './formatters';
import { getBudgetPeriodDateRange, toLocalDateKey } from './dates';

export interface FinanceState {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  budgets: Budget[];
  notifications: NotificationItem[];
  settings: AppSettings;
}

export interface MutatedRecords {
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
}

export interface OperationResult {
  ok: boolean;
  nextState: FinanceState;
  mutated: MutatedRecords;
  notificationsToEmit: NotificationItem[];
  error?: string;
  createdTransaction?: Transaction;
  createdAccount?: Account;
  createdGoal?: Goal;
  createdBudget?: Budget;
}

/**
 * Derives current period spending for a budget from expense transactions.
 * Converts every transaction amount into the budget's currency.
 */
export function deriveBudgetSpent(
  budget: Budget,
  transactions: Transaction[],
  fallbackCurrency?: CurrencyCode | null
): number {
  const budgetCurrency = budget.currency || fallbackCurrency || 'USD';
  const { start, end } = getBudgetPeriodDateRange(budget.period);

  let total = 0;
  for (const tx of transactions) {
    if (tx.type === 'expense' && tx.categoryId === budget.categoryId) {
      const txDate = new Date(tx.date);
      if (txDate >= start && txDate <= end) {
        const converted = convertCurrency(tx.amount, tx.currency, budgetCurrency);
        total = addMoney(total, converted, budgetCurrency);
      }
    }
  }

  return total;
}

/**
 * Checks budget thresholds and generates deterministic notifications.
 * Deterministic ID: budget:{budgetId}:{periodStartKey}:{level}
 * Each alert fires at most ONCE per period.
 */
export function evaluateBudgetAlerts(
  budgets: Budget[],
  transactions: Transaction[],
  existingNotifications: NotificationItem[],
  fallbackCurrency?: CurrencyCode | null
): { updatedBudgets: Budget[]; newNotifications: NotificationItem[] } {
  const newNotifications: NotificationItem[] = [];
  const updatedBudgets: Budget[] = [];

  for (const budget of budgets) {
    const budgetCurrency = budget.currency || fallbackCurrency || 'USD';
    const spent = deriveBudgetSpent(budget, transactions, budgetCurrency);
    const updatedBudget: Budget = { ...budget, spentAmount: spent };
    updatedBudgets.push(updatedBudget);

    if (budget.limitAmount <= 0) continue;

    const { start } = getBudgetPeriodDateRange(budget.period);
    const periodStartKey = toLocalDateKey(start);
    const percentSpent = (spent / budget.limitAmount) * 100;

    // Check 100% exceeded threshold
    if (percentSpent >= 100) {
      const exceededId = `budget:${budget.id}:${periodStartKey}:exceeded`;
      const alreadyFired = existingNotifications.some(n => n.id === exceededId) ||
        newNotifications.some(n => n.id === exceededId);

      if (!alreadyFired) {
        const notif: NotificationItem = {
          id: exceededId,
          type: 'budget',
          title: `Budget Exceeded: ${budget.categoryName}`,
          message: `You've spent ${formatCurrency(spent, budgetCurrency)} of your ${formatCurrency(budget.limitAmount, budgetCurrency)} limit (${percentSpent.toFixed(0)}%).`,
          timestamp: new Date().toISOString(),
          isRead: false,
          severity: 'alert',
        };
        newNotifications.push(notif);
      }
    } else if (percentSpent >= (budget.alertThreshold || 80)) {
      // Check warning threshold
      const warningId = `budget:${budget.id}:${periodStartKey}:warning`;
      const alreadyFired = existingNotifications.some(n => n.id === warningId) ||
        newNotifications.some(n => n.id === warningId);

      if (!alreadyFired) {
        const notif: NotificationItem = {
          id: warningId,
          type: 'budget',
          title: `Budget Warning: ${budget.categoryName}`,
          message: `You've reached ${percentSpent.toFixed(0)}% of your ${formatCurrency(budget.limitAmount, budgetCurrency)} budget.`,
          timestamp: new Date().toISOString(),
          isRead: false,
          severity: 'warning',
        };
        newNotifications.push(notif);
      }
    }
  }

  return { updatedBudgets, newNotifications };
}

/**
 * Pure Operation: Apply Add Transaction.
 * Updates account balance with minor unit precision, creates transaction,
 * and evaluates budget alerts.
 */
export function applyAddTransaction(
  state: FinanceState,
  txInput: Omit<Transaction, 'id'>
): OperationResult {
  if (!state.settings.baseCurrency) {
    return {
      ok: false,
      nextState: state,
      mutated: {},
      notificationsToEmit: [],
      error: 'BASE_CURRENCY_REQUIRED: Please choose a base currency in Settings before recording transactions.',
    };
  }

  const targetAccount = state.accounts.find(a => a.id === txInput.accountId);
  if (!targetAccount) {
    return {
      ok: false,
      nextState: state,
      mutated: {},
      notificationsToEmit: [],
      error: `Account not found with ID: ${txInput.accountId}`,
    };
  }

  const txAmount = roundMoney(Number(txInput.amount), txInput.currency || targetAccount.currency);
  if (txAmount <= 0) {
    return {
      ok: false,
      nextState: state,
      mutated: {},
      notificationsToEmit: [],
      error: 'Transaction amount must be greater than zero',
    };
  }

  // Validate funds for expense
  if (txInput.type === 'expense') {
    const fundsCheck = validateAccountFunds(targetAccount, txAmount);
    if (!fundsCheck.hasFunds) {
      return {
        ok: false,
        nextState: state,
        mutated: {},
        notificationsToEmit: [],
        error: fundsCheck.error || 'Insufficient funds',
      };
    }
  }

  // Compute resulting balance
  let newBalance = targetAccount.balance;
  if (txInput.type === 'expense') {
    newBalance = subMoney(targetAccount.balance, txAmount, targetAccount.currency);
  } else if (txInput.type === 'income') {
    newBalance = addMoney(targetAccount.balance, txAmount, targetAccount.currency);
  }

  const newTxId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newTx: Transaction = {
    ...txInput,
    id: newTxId,
    amount: txAmount,
    currency: txInput.currency || targetAccount.currency,
    resultingBalance: newBalance,
    date: txInput.date || new Date().toISOString(),
  };

  const updatedAccount: Account = { ...targetAccount, balance: newBalance };
  const nextAccounts = state.accounts.map(a => a.id === updatedAccount.id ? updatedAccount : a);
  const nextTransactions = [newTx, ...state.transactions];

  // Evaluate budget alerts post-commit
  const { updatedBudgets, newNotifications } = evaluateBudgetAlerts(
    state.budgets,
    nextTransactions,
    state.notifications,
    state.settings.baseCurrency
  );

  const notificationsToEmit = [...newNotifications];

  // High transaction alert
  if (state.settings.notifications.transactionAlerts && txAmount >= 500) {
    const highAlert: NotificationItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif_${Date.now()}`,
      type: 'transaction',
      title: 'High Amount Transaction Alert',
      message: `${newTx.type === 'income' ? 'Received' : 'Paid'} ${formatCurrency(txAmount, newTx.currency)} (${newTx.merchant || newTx.categoryName}).`,
      timestamp: new Date().toISOString(),
      isRead: false,
      severity: 'info',
    };
    notificationsToEmit.push(highAlert);
  }

  const nextNotifications = [...notificationsToEmit, ...state.notifications];

  return {
    ok: true,
    nextState: {
      ...state,
      accounts: nextAccounts,
      transactions: nextTransactions,
      budgets: updatedBudgets,
      notifications: nextNotifications,
    },
    mutated: {
      accountsToUpsert: [updatedAccount],
      transactionsToUpsert: [newTx],
      budgetsToUpsert: updatedBudgets,
      notificationsToUpsert: notificationsToEmit,
    },
    notificationsToEmit,
    createdTransaction: newTx,
  };
}

/**
 * Pure Operation: Apply Update Transaction.
 * Transfers are NOT editable (delete and recreate required).
 * Normal transactions revert old effect and apply new updates (handling changed amount, account, or type).
 */
export function applyUpdateTransaction(
  state: FinanceState,
  txId: string,
  updates: Partial<Transaction>
): OperationResult {
  const existingTx = state.transactions.find(t => t.id === txId);
  if (!existingTx) {
    return { ok: false, nextState: state, mutated: {}, notificationsToEmit: [], error: 'Transaction not found' };
  }

  if (existingTx.type === 'transfer' || updates.type === 'transfer') {
    return {
      ok: false,
      nextState: state,
      mutated: {},
      notificationsToEmit: [],
      error: 'Transfers cannot be edited directly; please delete and recreate the transfer.',
    };
  }

  const oldAccountId = existingTx.accountId;
  const newAccountId = updates.accountId || oldAccountId;
  const oldAmount = existingTx.amount;
  const newAmount = updates.amount !== undefined ? roundMoney(Number(updates.amount), existingTx.currency) : oldAmount;
  const oldType = existingTx.type;
  const newType = updates.type || oldType;

  // Revert old effect on old account
  const oldAccount = state.accounts.find(a => a.id === oldAccountId);
  if (!oldAccount) {
    return { ok: false, nextState: state, mutated: {}, notificationsToEmit: [], error: 'Source account not found' };
  }

  let revertedOldBalance = oldAccount.balance;
  if (oldType === 'expense') {
    revertedOldBalance = addMoney(oldAccount.balance, oldAmount, oldAccount.currency);
  } else if (oldType === 'income') {
    revertedOldBalance = subMoney(oldAccount.balance, oldAmount, oldAccount.currency);
  }

  let nextAccounts = state.accounts.map(a => a.id === oldAccountId ? { ...a, balance: revertedOldBalance } : a);

  // Apply new effect on new account
  const newAccount = nextAccounts.find(a => a.id === newAccountId);
  if (!newAccount) {
    return { ok: false, nextState: state, mutated: {}, notificationsToEmit: [], error: 'Destination account not found' };
  }

  let appliedNewBalance = newAccount.balance;
  if (newType === 'expense') {
    appliedNewBalance = subMoney(newAccount.balance, newAmount, newAccount.currency);
  } else if (newType === 'income') {
    appliedNewBalance = addMoney(newAccount.balance, newAmount, newAccount.currency);
  }

  const updatedTargetAccount: Account = { ...newAccount, balance: appliedNewBalance };
  nextAccounts = nextAccounts.map(a => a.id === newAccountId ? updatedTargetAccount : a);

  const updatedTx: Transaction = {
    ...existingTx,
    ...updates,
    amount: newAmount,
    resultingBalance: appliedNewBalance,
  };

  const nextTransactions = state.transactions.map(t => t.id === txId ? updatedTx : t);

  // Evaluate budget alerts
  const { updatedBudgets, newNotifications } = evaluateBudgetAlerts(
    state.budgets,
    nextTransactions,
    state.notifications,
    state.settings.baseCurrency
  );

  const touchedAccounts = oldAccountId === newAccountId
    ? [updatedTargetAccount]
    : [
        nextAccounts.find(a => a.id === oldAccountId)!,
        updatedTargetAccount,
      ];

  return {
    ok: true,
    nextState: {
      ...state,
      accounts: nextAccounts,
      transactions: nextTransactions,
      budgets: updatedBudgets,
      notifications: [...newNotifications, ...state.notifications],
    },
    mutated: {
      accountsToUpsert: touchedAccounts,
      transactionsToUpsert: [updatedTx],
      budgetsToUpsert: updatedBudgets,
      notificationsToUpsert: newNotifications,
    },
    notificationsToEmit: newNotifications,
  };
}

/**
 * Pure Operation: Apply Delete Transaction.
 * Exact balance restoration:
 * - Expense: + amount
 * - Income: - amount
 * - Cross-currency transfer: restores fromAccount with +amount, and toAccount with -convertedAmount
 *   (falls back to recomputing rate if legacy transfer without convertedAmount).
 * - Goal contribution: restores account with +amount, and decreases goal progress.
 */
export function applyDeleteTransaction(
  state: FinanceState,
  txId: string
): OperationResult {
  const tx = state.transactions.find(t => t.id === txId);
  if (!tx) {
    return { ok: false, nextState: state, mutated: {}, notificationsToEmit: [], error: 'Transaction not found' };
  }

  let nextAccounts = [...state.accounts];
  const touchedAccounts: Account[] = [];
  let nextGoals = [...state.goals];
  const touchedGoals: Goal[] = [];

  if (tx.type === 'transfer' && tx.toAccountId) {
    const fromAcc = nextAccounts.find(a => a.id === tx.accountId);
    const toAcc = nextAccounts.find(a => a.id === tx.toAccountId);

    if (fromAcc) {
      const restoredFrom = {
        ...fromAcc,
        balance: addMoney(fromAcc.balance, tx.amount, fromAcc.currency),
      };
      nextAccounts = nextAccounts.map(a => a.id === fromAcc.id ? restoredFrom : a);
      touchedAccounts.push(restoredFrom);
    }

    if (toAcc) {
      // Legacy transfers with no convertedAmount: fall back to recomputing with current rate
      const converted = tx.convertedAmount !== undefined
        ? tx.convertedAmount
        : convertCurrency(tx.amount, tx.currency, toAcc.currency);

      const restoredTo = {
        ...toAcc,
        balance: subMoney(toAcc.balance, converted, toAcc.currency),
      };
      nextAccounts = nextAccounts.map(a => a.id === toAcc.id ? restoredTo : a);
      touchedAccounts.push(restoredTo);
    }
  } else if (tx.goalId) {
    // Linked goal contribution reversal
    const acc = nextAccounts.find(a => a.id === tx.accountId);
    if (acc) {
      const restoredAcc = {
        ...acc,
        balance: addMoney(acc.balance, tx.amount, acc.currency),
      };
      nextAccounts = nextAccounts.map(a => a.id === acc.id ? restoredAcc : a);
      touchedAccounts.push(restoredAcc);
    }

    const goal = nextGoals.find(g => g.id === tx.goalId);
    if (goal) {
      const goalDeduction = tx.convertedAmount !== undefined ? tx.convertedAmount : tx.amount;
      const newAmount = Math.max(0, subMoney(goal.currentAmount, goalDeduction));
      const restoredGoal = {
        ...goal,
        currentAmount: newAmount,
        isCompleted: newAmount >= goal.targetAmount,
      };
      nextGoals = nextGoals.map(g => g.id === goal.id ? restoredGoal : g);
      touchedGoals.push(restoredGoal);
    }
  } else {
    // Normal expense or income
    const acc = nextAccounts.find(a => a.id === tx.accountId);
    if (acc) {
      const newBal = tx.type === 'expense'
        ? addMoney(acc.balance, tx.amount, acc.currency)
        : subMoney(acc.balance, tx.amount, acc.currency);
      const restoredAcc = { ...acc, balance: newBal };
      nextAccounts = nextAccounts.map(a => a.id === acc.id ? restoredAcc : a);
      touchedAccounts.push(restoredAcc);
    }
  }

  const nextTransactions = state.transactions.filter(t => t.id !== txId);

  // Recalculate derived budget spent
  const { updatedBudgets } = evaluateBudgetAlerts(
    state.budgets,
    nextTransactions,
    state.notifications,
    state.settings.baseCurrency
  );

  return {
    ok: true,
    nextState: {
      ...state,
      accounts: nextAccounts,
      transactions: nextTransactions,
      goals: nextGoals,
      budgets: updatedBudgets,
    },
    mutated: {
      accountsToUpsert: touchedAccounts,
      transactionsToDelete: [txId],
      goalsToUpsert: touchedGoals,
      budgetsToUpsert: updatedBudgets,
    },
    notificationsToEmit: [],
  };
}

/**
 * Pure Operation: Apply Transfer Funds.
 * Validates accounts, credit limits, performs exact currency conversion with rate audit,
 * and creates transfer transaction with convertedAmount and exchangeRate.
 */
export function applyTransferFunds(
  state: FinanceState,
  payload: { fromId: string; toId: string; amount: number; note?: string }
): OperationResult {
  if (!state.settings.baseCurrency) {
    return {
      ok: false,
      nextState: state,
      mutated: {},
      notificationsToEmit: [],
      error: 'BASE_CURRENCY_REQUIRED: Please choose a base currency in Settings before transferring funds.',
    };
  }

  const { fromId, toId, amount, note } = payload;
  if (fromId === toId) {
    return { ok: false, nextState: state, mutated: {}, notificationsToEmit: [], error: 'Source and destination accounts must be different' };
  }

  const fromAcc = state.accounts.find(a => a.id === fromId);
  const toAcc = state.accounts.find(a => a.id === toId);
  if (!fromAcc || !toAcc) {
    return { ok: false, nextState: state, mutated: {}, notificationsToEmit: [], error: 'Account not found' };
  }

  const safeAmount = roundMoney(amount, fromAcc.currency);
  if (safeAmount <= 0) {
    return { ok: false, nextState: state, mutated: {}, notificationsToEmit: [], error: 'Transfer amount must be greater than zero' };
  }

  // Funds check on fromAcc
  const fundsCheck = validateAccountFunds(fromAcc, safeAmount);
  if (!fundsCheck.hasFunds) {
    return { ok: false, nextState: state, mutated: {}, notificationsToEmit: [], error: fundsCheck.error || 'Insufficient funds' };
  }

  // Currency conversion with rate auditing
  let convertedAmount: number;
  let exchangeRate: number;
  try {
    const res = convertCurrencyWithRate(safeAmount, fromAcc.currency, toAcc.currency);
    convertedAmount = res.convertedAmount;
    exchangeRate = res.rate;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { ok: false, nextState: state, mutated: {}, notificationsToEmit: [], error: errorMsg };
  }

  const newFromBalance = subMoney(fromAcc.balance, safeAmount, fromAcc.currency);
  const newToBalance = addMoney(toAcc.balance, convertedAmount, toAcc.currency);

  const updatedFrom: Account = { ...fromAcc, balance: newFromBalance };
  const updatedTo: Account = { ...toAcc, balance: newToBalance };

  const txId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx_tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const transferTx: Transaction = {
    id: txId,
    type: 'transfer',
    amount: safeAmount,
    currency: fromAcc.currency,
    categoryId: 'cat_transfer',
    categoryName: 'Transfer & Payment',
    categoryIcon: 'ArrowRightLeft',
    categoryColor: '#636E72',
    accountId: fromId,
    accountName: fromAcc.name,
    toAccountId: toId,
    recipient: toAcc.name,
    convertedAmount,
    exchangeRate,
    date: new Date().toISOString(),
    note: note || `Transfer to ${toAcc.name}`,
    tags: ['Transfer'],
    resultingBalance: newFromBalance,
  };

  const nextAccounts = state.accounts.map(a => {
    if (a.id === fromId) return updatedFrom;
    if (a.id === toId) return updatedTo;
    return a;
  });

  const nextTransactions = [transferTx, ...state.transactions];

  const notif: NotificationItem = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif_${Date.now()}`,
    type: 'transaction',
    title: 'Funds Transferred Successfully',
    message: `Transferred ${formatCurrency(safeAmount, fromAcc.currency)} from ${fromAcc.name} to ${toAcc.name}${fromAcc.currency !== toAcc.currency ? ` (${formatCurrency(convertedAmount, toAcc.currency)})` : ''}.`,
    timestamp: new Date().toISOString(),
    isRead: false,
    severity: 'success',
  };

  return {
    ok: true,
    nextState: {
      ...state,
      accounts: nextAccounts,
      transactions: nextTransactions,
      notifications: [notif, ...state.notifications],
    },
    mutated: {
      accountsToUpsert: [updatedFrom, updatedTo],
      transactionsToUpsert: [transferTx],
      notificationsToUpsert: [notif],
    },
    notificationsToEmit: [notif],
    createdTransaction: transferTx,
  };
}

/**
 * Pure Operation: Apply Contribute To Goal.
 * Creates a real linked transaction with goalId, deducts account balance,
 * updates goal progress and checks completion.
 */
export function applyContributeToGoal(
  state: FinanceState,
  payload: { goalId: string; amount: number; accountId: string }
): OperationResult {
  if (!state.settings.baseCurrency) {
    return {
      ok: false,
      nextState: state,
      mutated: {},
      notificationsToEmit: [],
      error: 'BASE_CURRENCY_REQUIRED: Please choose a base currency in Settings before contributing to goals.',
    };
  }

  const { goalId, amount, accountId } = payload;
  const goal = state.goals.find(g => g.id === goalId);
  const acc = state.accounts.find(a => a.id === accountId);

  if (!goal) {
    return { ok: false, nextState: state, mutated: {}, notificationsToEmit: [], error: 'Goal not found' };
  }
  if (!acc) {
    return { ok: false, nextState: state, mutated: {}, notificationsToEmit: [], error: 'Account not found' };
  }

  const safeAmount = roundMoney(amount, acc.currency);
  if (safeAmount <= 0) {
    return { ok: false, nextState: state, mutated: {}, notificationsToEmit: [], error: 'Contribution amount must be greater than zero' };
  }

  const fundsCheck = validateAccountFunds(acc, safeAmount);
  if (!fundsCheck.hasFunds) {
    return { ok: false, nextState: state, mutated: {}, notificationsToEmit: [], error: fundsCheck.error || 'Insufficient funds' };
  }

  // Convert to base currency / goal target currency
  let convertedAmount = safeAmount;
  let exchangeRate = 1.0;
  const baseCurrency = state.settings.baseCurrency;
  if (acc.currency !== baseCurrency) {
    try {
      const res = convertCurrencyWithRate(safeAmount, acc.currency, baseCurrency);
      convertedAmount = res.convertedAmount;
      exchangeRate = res.rate;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { ok: false, nextState: state, mutated: {}, notificationsToEmit: [], error: errorMsg };
    }
  }

  const newAccBalance = subMoney(acc.balance, safeAmount, acc.currency);
  const updatedAccount: Account = { ...acc, balance: newAccBalance };

  const newGoalAmount = addMoney(goal.currentAmount, convertedAmount);
  const isCompleted = newGoalAmount >= goal.targetAmount;
  const updatedGoal: Goal = {
    ...goal,
    currentAmount: newGoalAmount,
    isCompleted,
  };

  const txId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx_goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const goalTx: Transaction = {
    id: txId,
    type: 'expense',
    amount: safeAmount,
    currency: acc.currency,
    categoryId: 'cat_goal_contrib',
    categoryName: 'Goal Contribution',
    categoryIcon: 'Target',
    categoryColor: goal.color || '#10B981',
    accountId: acc.id,
    accountName: acc.name,
    goalId: goal.id,
    recipient: goal.name,
    convertedAmount,
    exchangeRate,
    date: new Date().toISOString(),
    note: `Contribution towards ${goal.name}`,
    tags: ['Savings Goal'],
    resultingBalance: newAccBalance,
  };

  const nextAccounts = state.accounts.map(a => a.id === acc.id ? updatedAccount : a);
  const nextGoals = state.goals.map(g => g.id === goal.id ? updatedGoal : g);
  const nextTransactions = [goalTx, ...state.transactions];

  const notificationsToEmit: NotificationItem[] = [];
  if (isCompleted && !goal.isCompleted) {
    notificationsToEmit.push({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif_${Date.now()}`,
      type: 'goal',
      title: 'Goal Achieved! 🎉',
      message: `Congratulations! You reached your ${formatCurrency(goal.targetAmount, baseCurrency)} target for "${goal.name}".`,
      timestamp: new Date().toISOString(),
      isRead: false,
      severity: 'success',
    });
  }

  return {
    ok: true,
    nextState: {
      ...state,
      accounts: nextAccounts,
      goals: nextGoals,
      transactions: nextTransactions,
      notifications: [...notificationsToEmit, ...state.notifications],
    },
    mutated: {
      accountsToUpsert: [updatedAccount],
      goalsToUpsert: [updatedGoal],
      transactionsToUpsert: [goalTx],
      notificationsToUpsert: notificationsToEmit,
    },
    notificationsToEmit,
    createdTransaction: goalTx,
  };
}

/**
 * Pure Operation: Apply Delete Account.
 * If transactions exist and mode is 'block', blocks deletion.
 * If mode is 'cascade', removes account, cascades delete of transactions,
 * and unlinks goals.
 */
export function applyDeleteAccount(
  state: FinanceState,
  accountId: string,
  mode: 'block' | 'cascade' = 'block'
): OperationResult {
  const hasTransactions = state.transactions.some(
    t => t.accountId === accountId || t.toAccountId === accountId
  );

  if (hasTransactions && mode === 'block') {
    return {
      ok: false,
      nextState: state,
      mutated: {},
      notificationsToEmit: [],
      error: 'ACCOUNT_HAS_TRANSACTIONS: This account has associated transactions. Please choose to delete with transactions or reassign.',
    };
  }

  const nextAccounts = state.accounts.filter(a => a.id !== accountId);
  const transactionsToDelete = hasTransactions
    ? state.transactions.filter(t => t.accountId === accountId || t.toAccountId === accountId).map(t => t.id)
    : [];

  const nextTransactions = state.transactions.filter(
    t => t.accountId !== accountId && t.toAccountId !== accountId
  );

  // Unlink goals linked to this account
  const touchedGoals: Goal[] = [];
  const nextGoals = state.goals.map(g => {
    if (g.linkedAccountId === accountId) {
      const unlinked = { ...g, linkedAccountId: undefined };
      touchedGoals.push(unlinked);
      return unlinked;
    }
    return g;
  });

  return {
    ok: true,
    nextState: {
      ...state,
      accounts: nextAccounts,
      transactions: nextTransactions,
      goals: nextGoals,
    },
    mutated: {
      accountsToDelete: [accountId],
      transactionsToDelete,
      goalsToUpsert: touchedGoals,
    },
    notificationsToEmit: [],
  };
}
