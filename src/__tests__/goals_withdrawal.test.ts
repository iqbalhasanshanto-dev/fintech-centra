import { describe, it, expect } from 'vitest';
import {
  FinanceState,
  applyWithdrawFromGoal,
  applyContributeToGoal,
  applyDeleteTransaction,
} from '../utils/financeOperations';
import { Account, Category, Goal, Transaction } from '../types';

describe('Goals Withdrawal Operations', () => {
  const baseAccount: Account = {
    id: 'acc_usd',
    name: 'Checking Account',
    type: 'checking',
    balance: 500.0,
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
    balance: 10000.0,
    currency: 'BDT',
    accountNumberMasked: '•••• 5678',
    bankName: 'City Bank',
    color: '#059669',
  };

  const goalCategory: Category = {
    id: 'cat_goal_contrib',
    systemKey: 'goal_contribution',
    name: 'Goal Contribution',
    icon: 'Target',
    color: '#10B981',
    type: 'expense',
    hidden: true,
  };

  const initialGoal: Goal = {
    id: 'goal_macbook',
    name: 'New MacBook Pro',
    targetAmount: 2000.0,
    currentAmount: 1500.0,
    targetDate: '2026-12-31',
    startDate: '2026-01-01',
    icon: 'Laptop',
    color: '#3B82F6',
    isCompleted: false,
  };

  const completedGoal: Goal = {
    id: 'goal_trip',
    name: 'Cox\'s Bazar Trip',
    targetAmount: 1000.0,
    currentAmount: 1000.0,
    targetDate: '2026-12-31',
    startDate: '2026-01-01',
    icon: 'Palmtree',
    color: '#F59E0B',
    isCompleted: true,
  };

  const baseState: FinanceState = {
    accounts: [baseAccount, bdtAccount],
    transactions: [],
    categories: [goalCategory],
    goals: [initialGoal, completedGoal],
    budgets: [],
    notifications: [],
    settings: {
      theme: 'dark',
      baseCurrency: 'USD',
      privacyMode: false,
      security: { biometricEnabled: false, pinLockEnabled: false },
      notifications: {
        transactionAlerts: true,
        budgetOverruns: true,
        securityAlerts: true,
        billReminders: false,
        weeklyDigest: true,
      },
    },
  };

  it('successfully withdraws funds from a goal to an account', () => {
    const res = applyWithdrawFromGoal(baseState, {
      goalId: 'goal_macbook',
      amount: 300.0,
      accountId: 'acc_usd',
    });

    expect(res.ok).toBe(true);
    const updatedGoal = res.nextState.goals.find(g => g.id === 'goal_macbook')!;
    const updatedAcc = res.nextState.accounts.find(a => a.id === 'acc_usd')!;

    // Goal balance reduced from 1500 to 1200
    expect(updatedGoal.currentAmount).toBe(1200.0);
    expect(updatedGoal.isCompleted).toBe(false);

    // Account balance increased from 500 to 800
    expect(updatedAcc.balance).toBe(800.0);

    // Creates linked income transaction
    expect(res.createdTransaction).toBeDefined();
    expect(res.createdTransaction?.type).toBe('income');
    expect(res.createdTransaction?.amount).toBe(300.0);
    expect(res.createdTransaction?.categoryName).toBe('Goal Withdrawal');
    expect(res.createdTransaction?.merchant).toBe('New MacBook Pro');
    expect(res.createdTransaction?.note).toBe('Withdrawn from New MacBook Pro');
    expect(res.createdTransaction?.goalId).toBe('goal_macbook');
    expect(res.createdTransaction?.resultingBalance).toBe(800.0);
  });

  it('marks isCompleted false if withdrawal lowers balance below targetAmount', () => {
    const res = applyWithdrawFromGoal(baseState, {
      goalId: 'goal_trip',
      amount: 100.0,
      accountId: 'acc_usd',
    });

    expect(res.ok).toBe(true);
    const updatedGoal = res.nextState.goals.find(g => g.id === 'goal_trip')!;
    expect(updatedGoal.currentAmount).toBe(900.0);
    expect(updatedGoal.isCompleted).toBe(false);
  });

  it('rejects withdrawal if amount exceeds current saved goal balance', () => {
    const res = applyWithdrawFromGoal(baseState, {
      goalId: 'goal_macbook',
      amount: 1600.0, // Goal only has 1500.0
      accountId: 'acc_usd',
    });

    expect(res.ok).toBe(false);
    expect(res.error).toBe('Withdrawal amount cannot exceed current saved goal balance');
  });

  it('rejects withdrawal if amount is zero or negative', () => {
    const resZero = applyWithdrawFromGoal(baseState, {
      goalId: 'goal_macbook',
      amount: 0,
      accountId: 'acc_usd',
    });
    expect(resZero.ok).toBe(false);
    expect(resZero.error).toBe('Withdrawal amount must be greater than zero');

    const resNeg = applyWithdrawFromGoal(baseState, {
      goalId: 'goal_macbook',
      amount: -50,
      accountId: 'acc_usd',
    });
    expect(resNeg.ok).toBe(false);
  });

  it('rejects withdrawal if goal is not found', () => {
    const res = applyWithdrawFromGoal(baseState, {
      goalId: 'non_existent_goal',
      amount: 50,
      accountId: 'acc_usd',
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Goal not found');
  });

  it('deleting a goal withdrawal transaction restores the goal amount and reverts account balance', () => {
    // 1. Withdraw 200 from goal
    const withdrawRes = applyWithdrawFromGoal(baseState, {
      goalId: 'goal_macbook',
      amount: 200.0,
      accountId: 'acc_usd',
    });
    expect(withdrawRes.ok).toBe(true);
    const tx = withdrawRes.createdTransaction!;

    // 2. Delete the withdrawal transaction
    const deleteRes = applyDeleteTransaction(withdrawRes.nextState, tx.id);
    expect(deleteRes.ok).toBe(true);

    const revertedGoal = deleteRes.nextState.goals.find(g => g.id === 'goal_macbook')!;
    const revertedAcc = deleteRes.nextState.accounts.find(a => a.id === 'acc_usd')!;

    // Goal restored from 1300 back to 1500
    expect(revertedGoal.currentAmount).toBe(1500.0);
    // Account restored from 700 back to 500
    expect(revertedAcc.balance).toBe(500.0);
  });
});
