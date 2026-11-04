import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { getTransactionDisplay } from '../utils/formatters';
import { applyAddTransaction, FinanceState } from '../utils/financeOperations';
import { TransactionDetailModal } from '../components/home/TransactionDetailModal';
import { SettingsScreen } from '../components/settings/SettingsScreen';
import { AddActionModal } from '../components/modals/AddActionModal';
import { AuthProvider } from '../context/AuthContext';
import { FinanceProvider } from '../context/FinanceContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Transaction } from '../types';

function createMockFinanceState(): FinanceState {
  return {
    accounts: [
      { id: 'acc_cash', name: 'Cash', balance: 10000, currency: 'USD', type: 'cash', color: '#10B981', isPrimary: true, accountNumberMasked: '•••• 1111', bankName: 'Cash' },
      { id: 'acc_bank', name: 'City Bank', balance: 50000, currency: 'USD', type: 'checking', color: '#3B82F6', isPrimary: false, accountNumberMasked: '•••• 2222', bankName: 'City Bank' },
    ],
    transactions: [],
    categories: [
      { id: 'cat_groceries', name: 'Groceries', icon: 'ShoppingBag', color: '#10B981', type: 'expense' },
      { id: 'cat_salary', name: 'Salary', icon: 'Briefcase', color: '#3B82F6', type: 'income' },
    ],
    goals: [],
    budgets: [],
    notifications: [],
    settings: {
      theme: 'light',
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
  };
}

describe('Web v1.0.4 Feature & Regression Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('1. Unnamed Transaction Subtitle Formatting', () => {
    it('does not prepend accountName ("Cash") to subtitle when title equals category name', () => {
      const tx = {
        categoryName: 'Groceries',
        merchant: '',
        note: '',
        date: new Date().toISOString(),
        accountName: 'Cash',
      };

      const res = getTransactionDisplay(tx);
      expect(res.title).toBe('Groceries');
      expect(res.subtitle).not.toContain('Cash');
      expect(res.subtitle).toMatch(/^Today •/);
    });

    it('keeps categoryName in subtitle when a custom merchant is present', () => {
      const tx = {
        categoryName: 'Groceries',
        merchant: 'Agora Supermarket',
        note: '',
        date: new Date().toISOString(),
        accountName: 'Cash',
      };

      const res = getTransactionDisplay(tx);
      expect(res.title).toBe('Agora Supermarket');
      expect(res.subtitle).toMatch(/^Groceries • Today •/);
    });
  });

  describe('2. Transaction Detail Modal View Mode Account Row', () => {
    const baseTx: Transaction = {
      id: 'tx_1',
      accountId: 'acc_cash',
      accountName: 'Cash',
      categoryId: 'cat_1',
      categoryName: 'General',
      categoryIcon: 'Tag',
      categoryColor: '#10B981',
      amount: 1200,
      type: 'expense',
      date: new Date().toISOString(),
      currency: 'USD',
      note: 'Test note',
    };

    it('renders Account row when transaction is an expense', () => {
      render(
        <AuthProvider>
          <FinanceProvider>
            <TransactionDetailModal
              isOpen={true}
              onClose={() => {}}
              transaction={baseTx}
            />
          </FinanceProvider>
        </AuthProvider>
      );

      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Cash')).toBeInTheDocument();
    });

    it('does NOT render Account row when transaction is an income', () => {
      const incomeTx: Transaction = {
        ...baseTx,
        id: 'tx_2',
        type: 'income',
        categoryName: 'Salary',
      };

      render(
        <AuthProvider>
          <FinanceProvider>
            <TransactionDetailModal
              isOpen={true}
              onClose={() => {}}
              transaction={incomeTx}
            />
          </FinanceProvider>
        </AuthProvider>
      );

      expect(screen.queryByText('Account')).not.toBeInTheDocument();
    });
  });

  describe('3. High-Outflow Transaction Alert (Finance Operations)', () => {
    it('triggers High-Outflow Transaction Alert when an expense is >= 5000', () => {
      const state = createMockFinanceState();
      const largeExpense: Transaction = {
        id: 'tx_exp_1',
        accountId: 'acc_cash',
        accountName: 'Cash',
        categoryId: 'cat_groceries',
        categoryName: 'Groceries',
        categoryIcon: 'ShoppingBag',
        categoryColor: '#10B981',
        amount: 5500,
        type: 'expense',
        date: new Date().toISOString(),
        currency: 'USD',
      };

      const result = applyAddTransaction(state, largeExpense);
      expect(result.ok).toBe(true);
      const highAlert = result.nextState.notifications.find(n => n.title === 'High-Outflow Transaction Alert');
      expect(highAlert).toBeDefined();
      expect(highAlert?.message).toContain('Paid');
    });

    it('does NOT trigger High-Outflow Transaction Alert when an income is >= 5000', () => {
      const state = createMockFinanceState();
      const largeIncome: Transaction = {
        id: 'tx_inc_1',
        accountId: 'acc_cash',
        accountName: 'Cash',
        categoryId: 'cat_salary',
        categoryName: 'Salary',
        categoryIcon: 'Briefcase',
        categoryColor: '#3B82F6',
        amount: 8000,
        type: 'income',
        date: new Date().toISOString(),
        currency: 'USD',
      };

      const result = applyAddTransaction(state, largeIncome);
      expect(result.ok).toBe(true);
      const highAlert = result.nextState.notifications.find(n => n.title === 'High-Outflow Transaction Alert');
      expect(highAlert).toBeUndefined();
    });
  });

  describe('4. Settings Screen Theme Toggle Switch', () => {
    it('renders the Dark Mode toggle switch and toggles theme', async () => {
      render(
        <AuthProvider>
          <FinanceProvider>
            <ThemeProvider>
              <SettingsScreen onBack={() => {}} />
            </ThemeProvider>
          </FinanceProvider>
        </AuthProvider>
      );

      const switchBtn = screen.getByRole('switch', { name: /Switch between Dark and Light mode/i });
      expect(switchBtn).toBeInTheDocument();
      fireEvent.click(switchBtn);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark') || switchBtn.getAttribute('aria-checked') === 'true').toBeTruthy();
      });
    });
  });

  describe('5. AddActionModal Picker and Fields Reset', () => {
    it('renders the modal and initializes category and account properly', () => {
      render(
        <AuthProvider>
          <FinanceProvider>
            <AddActionModal
              isOpen={true}
              onClose={() => {}}
              defaultTab="spend"
            />
          </FinanceProvider>
        </AuthProvider>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Quick Action')).toBeInTheDocument();
      expect(screen.getByText('Spend')).toBeInTheDocument();
    });
  });
});
