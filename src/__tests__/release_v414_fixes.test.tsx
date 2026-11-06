import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { IntroScreen } from '../components/onboarding/IntroScreen';
import { CentraDB } from '../db/storage';
import { AuthProvider } from '../context/AuthContext';
import { FinanceProvider } from '../context/FinanceContext';
import { ThemeProvider } from '../context/ThemeContext';
import { AppShell } from '../components/layout/AppShell';
import { TransactionDetailModal } from '../components/home/TransactionDetailModal';
import { Transaction, Account } from '../types';

describe('Release Updates & 7 Core Fixes', () => {
  beforeEach(() => {
    localStorage.clear();
    CentraDB.clearMemoryCache();
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    window.scrollTo = vi.fn();
  });

  describe('1. IntroScreen Email Validation', () => {
    it('does not display email validation error on typing, but displays on submit if invalid', async () => {
      render(
        <AuthProvider>
          <IntroScreen initialMode="signin" />
        </AuthProvider>
      );

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const submitBtn = screen.getByRole('button', { name: /sign in with email/i });

      // Initially disabled when empty
      expect(submitBtn).toBeDisabled();

      // Type partial/invalid email - button should be enabled, no error visible while typing
      fireEvent.change(emailInput, { target: { value: 'incomplete@domain' } });
      expect(submitBtn).not.toBeDisabled();
      expect(screen.queryByText(/valid email|invalid email/i)).not.toBeInTheDocument();

      // Submit form directly
      const form = submitBtn.closest('form')!;
      fireEvent.submit(form);
      expect(screen.getAllByText(/valid email|invalid email/i).length).toBeGreaterThan(0);

      // Type another character - existing error should immediately clear
      fireEvent.change(emailInput, { target: { value: 'incomplete@domain.c' } });
      expect(screen.queryByText(/valid email|invalid email/i)).not.toBeInTheDocument();
    });
  });

  describe('2. Pending Delete Undo Window Protection in Storage & Merge', () => {
    it('marks and unmarks pending delete for entities correctly', () => {
      CentraDB.markPendingDelete('transactions', 'tx_undo_test_1');
      CentraDB.markPendingDelete('budgets', 'bud_undo_test_1');
      CentraDB.markPendingDelete('goals', 'goal_undo_test_1');

      CentraDB.unmarkPendingDelete('transactions', 'tx_undo_test_1');
      CentraDB.unmarkPendingDelete('budgets', 'bud_undo_test_1');
      CentraDB.unmarkPendingDelete('goals', 'goal_undo_test_1');
    });
  });

  describe('4. Receipt URL Persistence via Tags & Local Map', () => {
    it('correctly maps receiptUrl to tags with __receipt: prefix and strips it when reading back', async () => {
      const testTx: Transaction = {
        id: 'tx_receipt_test_1',
        amount: 75,
        currency: 'USD',
        type: 'expense',
        categoryId: 'cat_groceries',
        categoryName: 'Groceries',
        categoryIcon: 'ShoppingBag',
        categoryColor: '#10B981',
        accountId: 'acc_1',
        accountName: 'Checking',
        date: new Date().toISOString(),
        tags: ['dinner', 'friends'],
        receiptUrl: 'data:image/jpeg;base64,mockReceiptData',
      };

      await CentraDB.upsertTransaction(testTx);
      const readTx = CentraDB.getTransactions().find(t => t.id === testTx.id);
      expect(readTx).toBeDefined();
      expect(readTx?.receiptUrl).toBe('data:image/jpeg;base64,mockReceiptData');
      expect(readTx?.tags).toEqual(['dinner', 'friends']);
      expect(readTx?.tags?.some(t => t.startsWith('__receipt:'))).toBe(false);
    });
  });

  describe('6. AppShell Footer Offline-First Badge Removal', () => {
    it('renders Centra and tracker info in footer without Offline-First badge', () => {
      render(
        <AuthProvider>
          <FinanceProvider>
            <ThemeProvider>
              <AppShell />
            </ThemeProvider>
          </FinanceProvider>
        </AuthProvider>
      );

      const footer = document.querySelector('#footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveTextContent(/Centra/);
      expect(footer).toHaveTextContent(/Personal Finance & Expense Tracker/);
      expect(footer).not.toHaveTextContent(/Offline-First/);
    });
  });

  describe('5. TransactionDetailModal Edit Amount & Receipt Image', () => {
    it('allows editing amount and attaches receipt in Edit Mode', async () => {
      const testAccount: Account = {
        id: 'acc_1',
        name: 'Cash',
        type: 'cash',
        balance: 1000,
        currency: 'USD',
        accountNumberMasked: '•••• CASH',
        bankName: 'Cash',
        color: '#10B981',
        isPrimary: true,
      };

      const testTx: Transaction = {
        id: 'tx_edit_modal_test',
        amount: 100,
        currency: 'USD',
        type: 'expense',
        categoryId: 'cat_groceries',
        categoryName: 'Groceries',
        categoryIcon: 'ShoppingBag',
        categoryColor: '#10B981',
        accountId: 'acc_1',
        accountName: 'Cash',
        date: new Date().toISOString(),
        note: 'Original note',
      };

      await CentraDB.upsertAccount(testAccount);
      await CentraDB.upsertTransaction(testTx);

      const onClose = vi.fn();

      render(
        <AuthProvider>
          <FinanceProvider>
            <TransactionDetailModal
              isOpen={true}
              onClose={onClose}
              transaction={testTx}
            />
          </FinanceProvider>
        </AuthProvider>
      );

      // Open Edit Mode
      const editBtn = screen.getByRole('button', { name: /^Edit$/i });
      fireEvent.click(editBtn);

      // Check Amount input exists and is populated
      const amountInput = screen.getByDisplayValue('100');
      expect(amountInput).toBeInTheDocument();

      // Check Attach Receipt Image button exists
      expect(screen.getByRole('button', { name: /attach receipt image/i })).toBeInTheDocument();

      // Edit amount
      fireEvent.change(amountInput, { target: { value: '150.75' } });
      expect(amountInput).toHaveValue(150.75);

      // Click Save Changes
      const saveBtn = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('150.75')).not.toBeInTheDocument();
      });
    });
  });
});
