import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {
  calculatePercentageChange,
  computePreviousPeriodTotals,
} from '../utils/money';
import {
  getPeriodDateRange,
  getPreviousPeriodDateRange,
} from '../utils/dates';
import { YourMoneySection } from '../components/home/YourMoneySection';
import { IntroScreen } from '../components/onboarding/IntroScreen';
import { Transaction, AppSettings, PeriodFilter } from '../types';

// Configurable mock state for useFinance
let mockFinanceState = {
  periodIncome: 0,
  periodExpenses: 0,
  settings: {
    theme: 'dark' as const,
    privacyMode: false,
    baseCurrency: 'USD',
    security: { pinLockEnabled: false, biometricEnabled: false },
    notifications: {
      transactionAlerts: true,
      budgetOverruns: true,
      securityAlerts: true,
      billReminders: true,
      weeklyDigest: true,
    },
  } as AppSettings,
  transactions: [] as Transaction[],
  periodFilter: 'this_month' as PeriodFilter,
};

vi.mock('../context/FinanceContext', () => ({
  useFinance: () => mockFinanceState,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    authMode: 'signin',
    setAuthMode: vi.fn(),
    sendOtp: vi.fn(),
    signInWithOAuth: vi.fn(),
    enterGuestMode: vi.fn(),
    oauthLoading: false,
    oauthError: null,
    clearOauthError: vi.fn(),
  }),
}));

describe('Period Comparison & Percentage Change Calculations', () => {
  describe('calculatePercentageChange', () => {
    it('no previous data -> no badge (returns null)', () => {
      // Missing, negative, NaN or zero previous data returns null
      expect(calculatePercentageChange(100, 0, 'income')).toBeNull();
      expect(calculatePercentageChange(100, -50, 'income')).toBeNull();
      expect(calculatePercentageChange(100, NaN, 'income')).toBeNull();
      expect(calculatePercentageChange(NaN, 100, 'income')).toBeNull();
      expect(calculatePercentageChange(100, 0, 'expense')).toBeNull();
    });

    it('previous 100 and current 112.5 -> "+12.5%"', () => {
      const incomeResult = calculatePercentageChange(112.5, 100, 'income');
      expect(incomeResult).not.toBeNull();
      expect(incomeResult?.percentage).toBe(12.5);
      expect(incomeResult?.formatted).toBe('+12.5%');
      expect(incomeResult?.trend).toBe('up');
      expect(incomeResult?.isGood).toBe(true);

      const expenseResult = calculatePercentageChange(112.5, 100, 'expense');
      expect(expenseResult).not.toBeNull();
      expect(expenseResult?.percentage).toBe(12.5);
      expect(expenseResult?.formatted).toBe('+12.5%');
      expect(expenseResult?.trend).toBe('up');
      // For expense, an increase is bad
      expect(expenseResult?.isGood).toBe(false);
    });

    it('expenses decreasing shows the good (green) state', () => {
      // Previous 100, current 80 (-20.0%)
      const expenseDecrease = calculatePercentageChange(80, 100, 'expense');
      expect(expenseDecrease).not.toBeNull();
      expect(expenseDecrease?.percentage).toBe(-20);
      expect(expenseDecrease?.formatted).toBe('-20.0%');
      expect(expenseDecrease?.trend).toBe('down');
      // For expenses, decreasing is GOOD!
      expect(expenseDecrease?.isGood).toBe(true);

      // Previous 100, current 95.8 (-4.2%)
      const expenseSmallDecrease = calculatePercentageChange(95.8, 100, 'expense');
      expect(expenseSmallDecrease).not.toBeNull();
      expect(expenseSmallDecrease?.percentage).toBe(-4.2);
      expect(expenseSmallDecrease?.formatted).toBe('-4.2%');
      expect(expenseSmallDecrease?.trend).toBe('down');
      expect(expenseSmallDecrease?.isGood).toBe(true);
    });

    it('zero previous never divides by zero (returns null, not Infinity or NaN)', () => {
      expect(calculatePercentageChange(500, 0, 'income')).toBeNull();
      expect(calculatePercentageChange(0, 0, 'income')).toBeNull();
      expect(calculatePercentageChange(500, 0, 'expense')).toBeNull();
      expect(calculatePercentageChange(0, 0, 'expense')).toBeNull();
    });

    it('never shows NaN, Infinity, or a cap of 999%', () => {
      // 100 to 2500 is a +2400% increase; must not be capped at 999%
      const largeIncrease = calculatePercentageChange(2500, 100, 'income');
      expect(largeIncrease).not.toBeNull();
      expect(largeIncrease?.percentage).toBe(2400);
      expect(largeIncrease?.formatted).toBe('+2400.0%');

      // Invalid Infinity / NaN inputs safely return null
      expect(calculatePercentageChange(Infinity, 100, 'income')).toBeNull();
      expect(calculatePercentageChange(100, Infinity, 'income')).toBeNull();
    });
  });

  describe('getPreviousPeriodDateRange', () => {
    const fixedNow = new Date(2026, 9, 25, 12, 0, 0); // October 25, 2026

    it('calculates previous equivalent period for this_month (September 2026)', () => {
      const prev = getPreviousPeriodDateRange('this_month', fixedNow);
      expect(prev).not.toBeNull();
      expect(prev!.start.getFullYear()).toBe(2026);
      expect(prev!.start.getMonth()).toBe(8); // September (0-indexed)
      expect(prev!.start.getDate()).toBe(1);
      expect(prev!.end.getFullYear()).toBe(2026);
      expect(prev!.end.getMonth()).toBe(8);
      expect(prev!.end.getDate()).toBe(30);
    });

    it('calculates previous equivalent period for last_month (August 2026)', () => {
      const prev = getPreviousPeriodDateRange('last_month', fixedNow);
      expect(prev).not.toBeNull();
      expect(prev!.start.getFullYear()).toBe(2026);
      expect(prev!.start.getMonth()).toBe(7); // August
      expect(prev!.start.getDate()).toBe(1);
      expect(prev!.end.getFullYear()).toBe(2026);
      expect(prev!.end.getMonth()).toBe(7);
      expect(prev!.end.getDate()).toBe(31);
    });

    it('calculates previous equivalent period for this_year (Year 2025)', () => {
      const prev = getPreviousPeriodDateRange('this_year', fixedNow);
      expect(prev).not.toBeNull();
      expect(prev!.start.getFullYear()).toBe(2025);
      expect(prev!.start.getMonth()).toBe(0);
      expect(prev!.start.getDate()).toBe(1);
      expect(prev!.end.getFullYear()).toBe(2025);
      expect(prev!.end.getMonth()).toBe(11);
      expect(prev!.end.getDate()).toBe(31);
    });

    it('returns null for all filter', () => {
      expect(getPreviousPeriodDateRange('all', fixedNow)).toBeNull();
    });
  });

  describe('computePreviousPeriodTotals with currency conversion', () => {
    const fixedNow = new Date(2026, 9, 25, 12, 0, 0);

    it('sums previous period transactions and converts currencies correctly', () => {
      // In September 2026:
      // Income: 100 USD
      // Expense: 100 EUR -> at rate 1.08 = 108 USD
      // Transfer: 50 USD (should be ignored)
      const transactions: Transaction[] = [
        {
          id: 'tx_1',
          type: 'income',
          amount: 100,
          currency: 'USD',
          categoryId: 'cat_1',
          categoryName: 'Salary',
          categoryIcon: 'Briefcase',
          categoryColor: '#10B981',
          accountId: 'acc_1',
          accountName: 'Checking',
          date: '2026-09-15T10:00:00Z',
        },
        {
          id: 'tx_2',
          type: 'expense',
          amount: 100,
          currency: 'EUR',
          categoryId: 'cat_2',
          categoryName: 'Food',
          categoryIcon: 'Utensils',
          categoryColor: '#EF4444',
          accountId: 'acc_1',
          accountName: 'Checking',
          date: '2026-09-20T10:00:00Z',
        },
        {
          id: 'tx_3',
          type: 'transfer',
          amount: 50,
          currency: 'USD',
          categoryId: 'cat_3',
          categoryName: 'Transfer',
          categoryIcon: 'Repeat',
          categoryColor: '#6B7280',
          accountId: 'acc_1',
          accountName: 'Checking',
          date: '2026-09-22T10:00:00Z',
        },
      ];

      const totals = computePreviousPeriodTotals(transactions, 'this_month', 'USD', fixedNow);
      expect(totals.hasPreviousPeriod).toBe(true);
      expect(totals.previousIncome).toBe(100);
      expect(totals.previousIncomeCount).toBe(1);
      // EUR -> USD is 100 * 1.08 = 108
      expect(totals.previousExpenses).toBe(108);
      expect(totals.previousExpenseCount).toBe(1);
    });
  });
});

describe('YourMoneySection Component', () => {
  it('no previous data -> no badge rendered', () => {
    mockFinanceState = {
      periodIncome: 112.5,
      periodExpenses: 80,
      settings: {
        theme: 'dark',
        privacyMode: false,
        baseCurrency: 'USD',
        security: { pinLockEnabled: false, biometricEnabled: false },
        notifications: {
          transactionAlerts: true,
          budgetOverruns: true,
          securityAlerts: true,
          billReminders: true,
          weeklyDigest: true,
        },
      },
      transactions: [], // No transactions in previous period
      periodFilter: 'this_month',
    };

    render(<YourMoneySection onNavigateToReport={() => {}} />);

    expect(screen.queryByTestId('income-change-badge')).toBeNull();
    expect(screen.queryByTestId('expenses-change-badge')).toBeNull();
  });

  it('previous 100 and current 112.5 -> renders "+12.5%" on income card', () => {
    // Current date in October 2026
    const prevDate = '2026-09-10T12:00:00Z'; // in September (previous month)

    mockFinanceState = {
      periodIncome: 112.5,
      periodExpenses: 0,
      settings: {
        theme: 'dark',
        privacyMode: false,
        baseCurrency: 'USD',
        security: { pinLockEnabled: false, biometricEnabled: false },
        notifications: {
          transactionAlerts: true,
          budgetOverruns: true,
          securityAlerts: true,
          billReminders: true,
          weeklyDigest: true,
        },
      },
      transactions: [
        {
          id: 'prev_inc_1',
          type: 'income',
          amount: 100,
          currency: 'USD',
          categoryId: 'cat_1',
          categoryName: 'Income',
          categoryIcon: 'DollarSign',
          categoryColor: '#10B981',
          accountId: 'acc_1',
          accountName: 'Main',
          date: prevDate,
        },
      ],
      periodFilter: 'this_month',
    };

    render(<YourMoneySection onNavigateToReport={() => {}} />);

    const incomeBadge = screen.getByTestId('income-change-badge');
    expect(incomeBadge).toBeInTheDocument();
    expect(incomeBadge).toHaveTextContent('+12.5%');
    // Emerald / green classes for positive income
    expect(incomeBadge.className).toContain('text-emerald-600');
  });

  it('expenses decreasing shows the good (green) state with ArrowDown', () => {
    const prevDate = '2026-09-10T12:00:00Z';

    mockFinanceState = {
      periodIncome: 0,
      periodExpenses: 80, // Current: 80 vs Previous: 100 (-20.0%)
      settings: {
        theme: 'dark',
        privacyMode: false,
        baseCurrency: 'USD',
        security: { pinLockEnabled: false, biometricEnabled: false },
        notifications: {
          transactionAlerts: true,
          budgetOverruns: true,
          securityAlerts: true,
          billReminders: true,
          weeklyDigest: true,
        },
      },
      transactions: [
        {
          id: 'prev_exp_1',
          type: 'expense',
          amount: 100,
          currency: 'USD',
          categoryId: 'cat_2',
          categoryName: 'Bills',
          categoryIcon: 'FileText',
          categoryColor: '#EF4444',
          accountId: 'acc_1',
          accountName: 'Main',
          date: prevDate,
        },
      ],
      periodFilter: 'this_month',
    };

    render(<YourMoneySection onNavigateToReport={() => {}} />);

    const expensesBadge = screen.getByTestId('expenses-change-badge');
    expect(expensesBadge).toBeInTheDocument();
    expect(expensesBadge).toHaveTextContent('-20.0%');
    // Decreasing expenses is good -> MUST have emerald (green) color!
    expect(expensesBadge.className).toContain('text-emerald-600');
  });

  it('zero previous never divides by zero (badge hidden)', () => {
    const prevDate = '2026-09-10T12:00:00Z';

    mockFinanceState = {
      periodIncome: 200,
      periodExpenses: 150,
      settings: {
        theme: 'dark',
        privacyMode: false,
        baseCurrency: 'USD',
        security: { pinLockEnabled: false, biometricEnabled: false },
        notifications: {
          transactionAlerts: true,
          budgetOverruns: true,
          securityAlerts: true,
          billReminders: true,
          weeklyDigest: true,
        },
      },
      // Previous transactions with amount 0
      transactions: [
        {
          id: 'prev_zero_inc',
          type: 'income',
          amount: 0,
          currency: 'USD',
          categoryId: 'cat_1',
          categoryName: 'Income',
          categoryIcon: 'DollarSign',
          categoryColor: '#10B981',
          accountId: 'acc_1',
          accountName: 'Main',
          date: prevDate,
        },
      ],
      periodFilter: 'this_month',
    };

    render(<YourMoneySection onNavigateToReport={() => {}} />);

    // Zero previous total never divides by zero -> badge must be completely hidden
    expect(screen.queryByTestId('income-change-badge')).toBeNull();
    expect(screen.queryByTestId('expenses-change-badge')).toBeNull();
  });
});

describe('IntroScreen Marketing Preview', () => {
  it('renders "Sample preview" tag on the card so nobody mistakes it for real numbers', () => {
    render(<IntroScreen />);

    expect(screen.getByText(/Sample preview/i)).toBeInTheDocument();
  });
});
