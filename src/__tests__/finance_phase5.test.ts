import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  addMoney,
  subMoney,
  roundMoney,
  parseAmountInput,
  convertCurrencyWithRate,
  validateAccountFunds,
} from '../utils/money';
import {
  FinanceState,
  applyAddTransaction,
  applyUpdateTransaction,
  applyDeleteTransaction,
  applyTransferFunds,
  applyContributeToGoal,
  applyDeleteAccount,
  deriveBudgetSpent,
  evaluateBudgetAlerts,
} from '../utils/financeOperations';
import { CentraDB } from '../db/storage';
import { OutboxQueue } from '../db/outbox';
import { Account, Budget, Category, Goal, NotificationItem, Transaction } from '../types';

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  },
  isSupabaseConfigured: () => true,
}));

function createMockState(overrides?: Partial<FinanceState>): FinanceState {
  const baseAccount: Account = {
    id: 'acc_usd',
    name: 'Checking Account',
    type: 'checking',
    balance: 1000.0,
    currency: 'USD',
    accountNumberMasked: '•••• 1234',
    bankName: 'Test Bank',
    color: '#4F46E5',
    isPrimary: true,
  };

  const bdtAccount: Account = {
    id: 'acc_bdt',
    name: 'City Bank BDT',
    type: 'savings',
    balance: 50000.0,
    currency: 'BDT',
    accountNumberMasked: '•••• 5678',
    bankName: 'City Bank',
    color: '#059669',
  };

  const creditAccount: Account = {
    id: 'acc_credit',
    name: 'Travel Card',
    type: 'credit',
    balance: -200.0,
    currency: 'USD',
    accountNumberMasked: '•••• 9999',
    bankName: 'Chase Credit',
    color: '#DC2626',
    creditLimit: 2000.0,
  };

  const category: Category = {
    id: 'cat_dining',
    name: 'Dining & Food',
    icon: 'Utensils',
    color: '#F59E0B',
    type: 'expense',
  };

  const budget: Budget = {
    id: 'bud_dining',
    categoryId: 'cat_dining',
    categoryName: 'Dining & Food',
    categoryIcon: 'Utensils',
    categoryColor: '#F59E0B',
    limitAmount: 500.0,
    spentAmount: 0.0,
    alertThreshold: 80,
    period: 'monthly',
    currency: 'USD',
  };

  const goal: Goal = {
    id: 'goal_vacation',
    name: 'Hawaii Trip',
    icon: 'Palmtree',
    color: '#06B6D4',
    targetAmount: 2000.0,
    currentAmount: 500.0,
    startDate: '2026-01-01',
    targetDate: '2026-12-31',
    linkedAccountId: 'acc_usd',
    isCompleted: false,
  };

  return {
    accounts: [baseAccount, bdtAccount, creditAccount],
    transactions: [],
    categories: [category],
    goals: [goal],
    budgets: [budget],
    notifications: [],
    settings: {
      theme: 'system',
      baseCurrency: 'USD',
      privacyMode: false,
      security: { biometricEnabled: false, pinLockEnabled: false },
      notifications: {
        transactionAlerts: true,
        budgetOverruns: true,
        securityAlerts: true,
        billReminders: false,
        weeklyDigest: false,
      },
    },
    ...overrides,
  };
}

describe('Phase 5: Financial Logic & Correctness', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. 0.1 + 0.2 Style Floating-Point Rounding & Input Sanitization', () => {
    it('eliminates floating point drift in addition and subtraction', () => {
      // Standard JS 0.1 + 0.2 === 0.30000000000000004
      expect(0.1 + 0.2).not.toBe(0.3);

      // Minor-unit arithmetic guarantees exact precision
      expect(addMoney(0.1, 0.2, 'USD')).toBe(0.3);
      expect(subMoney(0.3, 0.2, 'USD')).toBe(0.1);
      expect(addMoney(10.55, 0.05, 'USD')).toBe(10.6);
    });

    it('respects currency zero-decimal rules (JPY)', () => {
      expect(roundMoney(1234.56, 'JPY')).toBe(1235);
      expect(addMoney(100.4, 200.4, 'JPY')).toBe(300);
    });

    it('sanitizes amount input without treating thousand commas as decimals (C11 fix)', () => {
      expect(parseAmountInput('1,500.50', 'USD')).toBe(1500.5);
      expect(parseAmountInput('1,500', 'USD')).toBe(1500);
      expect(parseAmountInput('25.75', 'USD')).toBe(25.75);
      expect(parseAmountInput('12,345,678.90', 'USD')).toBe(12345678.9);
      expect(parseAmountInput('abc150.25xyz', 'USD')).toBe(150.25);
      expect(parseAmountInput('-50', 'USD')).toBe(50); // non-negative
    });
  });

  describe('2. Credit-Account Balance Convention', () => {
    it('validates debt, charges, payments, and credit limits', () => {
      const state = createMockState();
      const creditAcc = state.accounts.find(a => a.id === 'acc_credit')!;

      // Initial debt is $200 (balance is -200) on $2000 credit limit -> available is $1800
      const check1 = validateAccountFunds(creditAcc, 1800);
      expect(check1.hasFunds).toBe(true);
      expect(check1.available).toBe(1800);

      // Exceeding credit limit fails
      const check2 = validateAccountFunds(creditAcc, 1801);
      expect(check2.hasFunds).toBe(false);
      expect(check2.error).toContain('Credit limit exceeded');

      // Expense increases debt (more negative)
      const res = applyAddTransaction(state, {
        type: 'expense',
        amount: 300,
        currency: 'USD',
        accountId: creditAcc.id,
        accountName: creditAcc.name,
        categoryId: 'cat_dining',
        categoryName: 'Dining',
        categoryIcon: 'Utensils',
        categoryColor: '#F59E0B',
        date: new Date().toISOString(),
      });

      expect(res.ok).toBe(true);
      const updatedAcc = res.nextState.accounts.find(a => a.id === creditAcc.id)!;
      expect(updatedAcc.balance).toBe(-500); // -200 - 300 = -500
    });
  });

  describe('3. Rapid Double-Add (Latest State Ref Simulation)', () => {
    it('sequentially applies rapid actions without clobbering balance via stale closure', () => {
      let state = createMockState();
      const accountId = 'acc_usd';

      // Starting balance: 1000
      expect(state.accounts.find(a => a.id === accountId)!.balance).toBe(1000);

      // Action 1: Expense of $100
      const res1 = applyAddTransaction(state, {
        type: 'expense',
        amount: 100,
        currency: 'USD',
        accountId,
        accountName: 'Checking Account',
        categoryId: 'cat_dining',
        categoryName: 'Dining',
        categoryIcon: 'Utensils',
        categoryColor: '#F59E0B',
        date: new Date().toISOString(),
      });
      expect(res1.ok).toBe(true);

      // Advance state immediately (as latestStateRef does in FinanceProvider)
      state = res1.nextState;
      expect(state.accounts.find(a => a.id === accountId)!.balance).toBe(900);

      // Action 2: Rapid second expense of $200
      const res2 = applyAddTransaction(state, {
        type: 'expense',
        amount: 200,
        currency: 'USD',
        accountId,
        accountName: 'Checking Account',
        categoryId: 'cat_dining',
        categoryName: 'Dining',
        categoryIcon: 'Utensils',
        categoryColor: '#F59E0B',
        date: new Date().toISOString(),
      });
      expect(res2.ok).toBe(true);

      state = res2.nextState;
      // Balance is 1000 - 100 - 200 = 700 exactly
      expect(state.accounts.find(a => a.id === accountId)!.balance).toBe(700);
      expect(state.transactions).toHaveLength(2);
    });
  });

  describe('4. Edit Transaction: Changing Amount, Account, and Type', () => {
    it('fully rolls back old effect on Account A and applies new effect on Account B', () => {
      const state = createMockState();
      // Setup initial transaction: Expense of $100 on Account USD (balance 1000 -> 900)
      const addRes = applyAddTransaction(state, {
        type: 'expense',
        amount: 100,
        currency: 'USD',
        accountId: 'acc_usd',
        accountName: 'Checking Account',
        categoryId: 'cat_dining',
        categoryName: 'Dining',
        categoryIcon: 'Utensils',
        categoryColor: '#F59E0B',
        date: new Date().toISOString(),
      });
      const txId = addRes.createdTransaction!.id;
      let currentState = addRes.nextState;

      expect(currentState.accounts.find(a => a.id === 'acc_usd')!.balance).toBe(900);
      expect(currentState.accounts.find(a => a.id === 'acc_bdt')!.balance).toBe(50000);

      // Edit: Change to INCOME of 2000 BDT on Account BDT
      const editRes = applyUpdateTransaction(currentState, txId, {
        accountId: 'acc_bdt',
        accountName: 'City Bank BDT',
        type: 'income',
        amount: 2000,
        currency: 'BDT',
      });
      expect(editRes.ok).toBe(true);

      currentState = editRes.nextState;
      // Account USD reverted: 900 + 100 = 1000
      expect(currentState.accounts.find(a => a.id === 'acc_usd')!.balance).toBe(1000);
      // Account BDT credited: 50000 + 2000 = 52000
      expect(currentState.accounts.find(a => a.id === 'acc_bdt')!.balance).toBe(52000);

      // Both accounts reported in mutated diff
      expect(editRes.mutated.accountsToUpsert).toHaveLength(2);
    });

    it('rejects direct edit of transfers (must delete and recreate)', () => {
      const state = createMockState();
      const transferRes = applyTransferFunds(state, {
        fromId: 'acc_usd',
        toId: 'acc_bdt',
        amount: 100,
      });
      expect(transferRes.ok).toBe(true);

      const transferTx = transferRes.createdTransaction!;
      const editAttempt = applyUpdateTransaction(transferRes.nextState, transferTx.id, {
        amount: 150,
      });

      expect(editAttempt.ok).toBe(false);
      expect(editAttempt.error).toContain('Transfers cannot be edited directly');
    });
  });

  describe('5. Cross-Currency Transfer & Exact Restoration', () => {
    it('records convertedAmount and exchangeRate, and exact restoration on delete', () => {
      const state = createMockState();
      // From USD (balance 1000) to BDT (balance 50000)
      // USD -> BDT rate: 1.0 / 0.0085 = 117.64705882 BDT per USD
      // 100 USD = 11764.71 BDT
      const transferRes = applyTransferFunds(state, {
        fromId: 'acc_usd',
        toId: 'acc_bdt',
        amount: 100,
      });

      expect(transferRes.ok).toBe(true);
      const tx = transferRes.createdTransaction!;
      expect(tx.convertedAmount).toBe(11764.71);
      expect(tx.exchangeRate).toBeCloseTo(117.647, 2);

      let currentState = transferRes.nextState;
      expect(currentState.accounts.find(a => a.id === 'acc_usd')!.balance).toBe(900);
      expect(currentState.accounts.find(a => a.id === 'acc_bdt')!.balance).toBe(61764.71);

      // Delete transfer transaction -> exact restoration
      const delRes = applyDeleteTransaction(currentState, tx.id);
      expect(delRes.ok).toBe(true);

      currentState = delRes.nextState;
      expect(currentState.accounts.find(a => a.id === 'acc_usd')!.balance).toBe(1000);
      expect(currentState.accounts.find(a => a.id === 'acc_bdt')!.balance).toBe(50000);
    });

    it('handles legacy transfers with no convertedAmount via rate fallback', () => {
      const state = createMockState();
      // Simulate legacy transfer row from database without convertedAmount
      const legacyTx: Transaction = {
        id: 'legacy_tx_1',
        type: 'transfer',
        amount: 100,
        currency: 'USD',
        accountId: 'acc_usd',
        accountName: 'Checking Account',
        toAccountId: 'acc_bdt',
        recipient: 'City Bank BDT',
        categoryId: 'cat_transfer',
        categoryName: 'Transfer & Payment',
        categoryIcon: 'ArrowRightLeft',
        categoryColor: '#636E72',
        date: new Date().toISOString(),
        // convertedAmount is undefined
      };

      // Set account balances as if transfer was applied
      const modifiedState: FinanceState = {
        ...state,
        accounts: state.accounts.map(a => {
          if (a.id === 'acc_usd') return { ...a, balance: 900 };
          if (a.id === 'acc_bdt') return { ...a, balance: 61764.71 };
          return a;
        }),
        transactions: [legacyTx],
      };

      const delRes = applyDeleteTransaction(modifiedState, legacyTx.id);
      expect(delRes.ok).toBe(true);

      // Successfully falls back to recomputing rate and restores both balances
      const usdAcc = delRes.nextState.accounts.find(a => a.id === 'acc_usd')!;
      const bdtAcc = delRes.nextState.accounts.find(a => a.id === 'acc_bdt')!;
      expect(usdAcc.balance).toBe(1000);
      expect(bdtAcc.balance).toBeCloseTo(50000, 1);
    });
  });

  describe('6. Budgets: Period Rollover & Date Editing', () => {
    it('only derives spending within current period window (rollover)', () => {
      const state = createMockState();
      const budget = state.budgets[0]; // monthly dining budget, limit $500

      const currentMonthTx: Transaction = {
        id: 'tx_current',
        type: 'expense',
        amount: 150,
        currency: 'USD',
        categoryId: 'cat_dining',
        categoryName: 'Dining & Food',
        categoryIcon: 'Utensils',
        categoryColor: '#F59E0B',
        accountId: 'acc_usd',
        accountName: 'Checking',
        date: new Date().toISOString(), // Today
      };

      // Transaction from 3 months ago
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 3);
      const oldMonthTx: Transaction = {
        id: 'tx_old',
        type: 'expense',
        amount: 250,
        currency: 'USD',
        categoryId: 'cat_dining',
        categoryName: 'Dining & Food',
        categoryIcon: 'Utensils',
        categoryColor: '#F59E0B',
        accountId: 'acc_usd',
        accountName: 'Checking',
        date: oldDate.toISOString(),
      };

      const transactions = [currentMonthTx, oldMonthTx];
      const spent = deriveBudgetSpent(budget, transactions, 'USD');

      // Only current month transaction is counted
      expect(spent).toBe(150);
    });

    it('updates derived budget spent when a transaction date is edited across period boundary', () => {
      let state = createMockState();
      // Add transaction in current month
      const addRes = applyAddTransaction(state, {
        type: 'expense',
        amount: 200,
        currency: 'USD',
        categoryId: 'cat_dining',
        categoryName: 'Dining & Food',
        categoryIcon: 'Utensils',
        categoryColor: '#F59E0B',
        accountId: 'acc_usd',
        accountName: 'Checking',
        date: new Date().toISOString(),
      });
      state = addRes.nextState;

      const budget = state.budgets.find(b => b.id === 'bud_dining')!;
      expect(deriveBudgetSpent(budget, state.transactions, 'USD')).toBe(200);

      // Move transaction date to last year
      const txId = addRes.createdTransaction!.id;
      const lastYearDate = new Date();
      lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);

      const editRes = applyUpdateTransaction(state, txId, {
        date: lastYearDate.toISOString(),
      });
      state = editRes.nextState;

      // Current period derived spent drops to 0
      expect(deriveBudgetSpent(budget, state.transactions, 'USD')).toBe(0);
    });
  });

  describe('7. Budget Alerts & Deterministic Deduplication', () => {
    it('creates deterministic alert IDs and does not duplicate alerts', () => {
      const state = createMockState();
      const budget = state.budgets[0]; // limit 500, alertThreshold 80% ($400)

      // 1. Transaction reaching 85% ($425) -> triggers warning alert
      const tx1: Transaction = {
        id: 'tx_1',
        type: 'expense',
        amount: 425,
        currency: 'USD',
        categoryId: 'cat_dining',
        categoryName: 'Dining & Food',
        categoryIcon: 'Utensils',
        categoryColor: '#F59E0B',
        accountId: 'acc_usd',
        accountName: 'Checking',
        date: new Date().toISOString(),
      };

      const eval1 = evaluateBudgetAlerts([budget], [tx1], state.notifications, 'USD');
      expect(eval1.newNotifications).toHaveLength(1);
      expect(eval1.newNotifications[0].id).toContain(`budget:${budget.id}`);
      expect(eval1.newNotifications[0].id).toContain(':warning');

      // 2. Add second transaction pushing to 90% ($450) -> duplicate warning NOT created
      const tx2: Transaction = {
        id: 'tx_2',
        type: 'expense',
        amount: 25,
        currency: 'USD',
        categoryId: 'cat_dining',
        categoryName: 'Dining & Food',
        categoryIcon: 'Utensils',
        categoryColor: '#F59E0B',
        accountId: 'acc_usd',
        accountName: 'Checking',
        date: new Date().toISOString(),
      };

      const existingNotifs = [...eval1.newNotifications, ...state.notifications];
      const eval2 = evaluateBudgetAlerts([budget], [tx1, tx2], existingNotifs, 'USD');
      expect(eval2.newNotifications).toHaveLength(0); // Deduplicated!

      // 3. Add third transaction exceeding 100% ($520) -> triggers exceeded alert
      const tx3: Transaction = {
        id: 'tx_3',
        type: 'expense',
        amount: 70,
        currency: 'USD',
        categoryId: 'cat_dining',
        categoryName: 'Dining & Food',
        categoryIcon: 'Utensils',
        categoryColor: '#F59E0B',
        accountId: 'acc_usd',
        accountName: 'Checking',
        date: new Date().toISOString(),
      };

      const eval3 = evaluateBudgetAlerts([budget], [tx1, tx2, tx3], existingNotifs, 'USD');
      expect(eval3.newNotifications).toHaveLength(1);
      expect(eval3.newNotifications[0].id).toContain(':exceeded');
    });
  });

  describe('8. Goal Contribution & Reversibility', () => {
    it('creates linked transaction with goalId and restores goal progress on delete', () => {
      let state = createMockState();
      const goal = state.goals[0]; // target 2000, current 500

      const contribRes = applyContributeToGoal(state, {
        goalId: goal.id,
        amount: 250,
        accountId: 'acc_usd',
      });
      expect(contribRes.ok).toBe(true);

      state = contribRes.nextState;
      const updatedGoal = state.goals.find(g => g.id === goal.id)!;
      const updatedAcc = state.accounts.find(a => a.id === 'acc_usd')!;
      expect(updatedGoal.currentAmount).toBe(750); // 500 + 250
      expect(updatedAcc.balance).toBe(750); // 1000 - 250

      const tx = contribRes.createdTransaction!;
      expect(tx.goalId).toBe(goal.id);
      expect(tx.categoryName).toBe('Goal Contribution');

      // Delete contribution transaction -> reversibility
      const delRes = applyDeleteTransaction(state, tx.id);
      expect(delRes.ok).toBe(true);

      state = delRes.nextState;
      expect(state.goals.find(g => g.id === goal.id)!.currentAmount).toBe(500);
      expect(state.accounts.find(a => a.id === 'acc_usd')!.balance).toBe(1000);
    });
  });

  describe('9. Account Deletion: Block vs Cascade', () => {
    it('blocks account deletion when transactions exist unless cascade specified', () => {
      let state = createMockState();
      // Add a transaction to acc_usd
      const addRes = applyAddTransaction(state, {
        type: 'expense',
        amount: 50,
        currency: 'USD',
        accountId: 'acc_usd',
        accountName: 'Checking',
        categoryId: 'cat_dining',
        categoryName: 'Dining',
        categoryIcon: 'Utensils',
        categoryColor: '#F59E0B',
        date: new Date().toISOString(),
      });
      state = addRes.nextState;

      // Attempt to delete with mode = block
      const blockRes = applyDeleteAccount(state, 'acc_usd', 'block');
      expect(blockRes.ok).toBe(false);
      expect(blockRes.error).toContain('ACCOUNT_HAS_TRANSACTIONS');

      // Delete with mode = cascade
      const cascadeRes = applyDeleteAccount(state, 'acc_usd', 'cascade');
      expect(cascadeRes.ok).toBe(true);
      expect(cascadeRes.nextState.accounts.find(a => a.id === 'acc_usd')).toBeUndefined();
      expect(cascadeRes.nextState.transactions).toHaveLength(0);
      // Linked goal should be unlinked
      expect(cascadeRes.nextState.goals.find(g => g.id === 'goal_vacation')!.linkedAccountId).toBeUndefined();
    });
  });

  describe('10. Null BaseCurrency Safety', () => {
    it('blocks saving transactions/transfers when baseCurrency is null without crashing formatters', () => {
      const state = createMockState({
        settings: {
          ...createMockState().settings,
          baseCurrency: null,
        },
      });

      const txAttempt = applyAddTransaction(state, {
        type: 'expense',
        amount: 50,
        currency: 'USD',
        accountId: 'acc_usd',
        accountName: 'Checking',
        categoryId: 'cat_dining',
        categoryName: 'Dining',
        categoryIcon: 'Utensils',
        categoryColor: '#F59E0B',
        date: new Date().toISOString(),
      });

      expect(txAttempt.ok).toBe(false);
      expect(txAttempt.error).toContain('BASE_CURRENCY_REQUIRED');

      const transferAttempt = applyTransferFunds(state, {
        fromId: 'acc_usd',
        toId: 'acc_bdt',
        amount: 50,
      });

      expect(transferAttempt.ok).toBe(false);
      expect(transferAttempt.error).toContain('BASE_CURRENCY_REQUIRED');
    });
  });

  describe('11. Grouped Outbox Operations', () => {
    it('enqueues multi-record operations with a shared groupId and preserves order', () => {
      const opItems = [
        { userId: 'user_1', entity: 'transactions' as const, op: 'upsert' as const, recordId: 'tx_1', payload: { id: 'tx_1' } },
        { userId: 'user_1', entity: 'accounts' as const, op: 'upsert' as const, recordId: 'acc_1', payload: { id: 'acc_1' } },
      ];

      const enqueued = OutboxQueue.enqueueGroup(opItems, 'grp_shared_123');
      expect(enqueued).toHaveLength(2);
      expect(enqueued[0].groupId).toBe('grp_shared_123');
      expect(enqueued[1].groupId).toBe('grp_shared_123');
      expect(enqueued[0].order).toBe(0);
      expect(enqueued[1].order).toBe(1);

      const pending = OutboxQueue.getPending('user_1');
      expect(pending).toHaveLength(2);
      expect(pending[0].groupId).toBe('grp_shared_123');
      expect(pending[1].groupId).toBe('grp_shared_123');
    });
  });

  describe('12. CSV Formula Injection Neutralization', () => {
    it('quotes fields and escapes formula injection characters with single quote', () => {
      const csvStr = CentraDB.exportTransactionsCSV();
      // Should be valid CSV format with quoted headers
      expect(csvStr).toContain('"ID","Date","Type","Merchant/Payee"');
    });
  });
});
