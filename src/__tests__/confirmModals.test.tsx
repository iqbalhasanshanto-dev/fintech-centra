import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SettingsScreen } from '../components/settings/SettingsScreen';
import { TransactionDetailModal } from '../components/home/TransactionDetailModal';
import { PinLockScreen } from '../components/auth/PinLockScreen';
import { PlanScreen } from '../components/plan/PlanScreen';
import { Sidebar } from '../components/layout/Sidebar';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import { Transaction, Goal, AppSettings } from '../types';

// Mock contexts
const mockLogout = vi.fn();
const mockResetAllData = vi.fn().mockResolvedValue({ ok: true });
const mockDeleteTransaction = vi.fn();
const mockDeleteGoal = vi.fn();
const mockUpdateUser = vi.fn();
const mockUpdateSettings = vi.fn();
const mockUnlockPin = vi.fn();

let currentIsGuest = false;

const defaultUser = {
  id: 'user_1',
  name: 'Test User',
  email: 'test@example.com',
  avatarUrl: '',
  baseCurrency: 'USD' as const,
  onboardingCompleted: true,
  createdAt: '2026-01-01T00:00:00Z',
};

const defaultSettings: AppSettings = {
  theme: 'dark',
  privacyMode: false,
  baseCurrency: 'USD',
  security: {
    pinLockEnabled: false,
    biometricEnabled: false,
  },
  notifications: {
    transactionAlerts: true,
    budgetOverruns: true,
    securityAlerts: true,
    billReminders: true,
    weeklyDigest: true,
  },
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: defaultUser,
    logout: mockLogout,
    updateUser: mockUpdateUser,
    lockApp: vi.fn(),
    isGuest: currentIsGuest,
    createAccountFromGuest: vi.fn(),
    unlockPin: mockUnlockPin,
    authMode: 'signin',
    authView: 'authenticated',
    saveOnboardingProfile: vi.fn(),
  }),
}));

const mockGoal: Goal = {
  id: 'goal_123',
  name: 'Emergency Fund',
  icon: 'Target',
  color: '#10B981',
  targetAmount: 5000,
  currentAmount: 2000,
  targetDate: '2026-12-31',
  startDate: '2026-01-01',
};

vi.mock('../context/FinanceContext', () => ({
  useFinance: () => ({
    settings: defaultSettings,
    updateSettings: mockUpdateSettings,
    resetAllData: mockResetAllData,
    deleteTransaction: mockDeleteTransaction,
    deleteGoal: mockDeleteGoal,
    togglePinTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    contributeToGoal: vi.fn(),
    accounts: [],
    categories: [],
    budgets: [],
    goals: [mockGoal],
    transactions: [],
  }),
}));

describe('ConfirmModal Integration Tests (Replaced window.confirm)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentIsGuest = false;
  });

  describe('1. SettingsScreen Confirmations', () => {
    it('Reset demo data opens ConfirmModal, cancel does nothing, confirm calls resetAllData', async () => {
      currentIsGuest = true;
      render(<SettingsScreen />);

      const resetBtn = screen.getByRole('button', { name: /Reset Demo Data/i });
      fireEvent.click(resetBtn);

      // ConfirmModal should be visible
      expect(screen.getByRole('heading', { name: 'Reset Demo Data' })).toBeInTheDocument();
      expect(screen.getByText('Reset all transactions, accounts, and budgets to default demo state?')).toBeInTheDocument();

      // Click Cancel
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelBtn);

      expect(mockResetAllData).not.toHaveBeenCalled();
      expect(screen.queryByRole('heading', { name: 'Reset Demo Data' })).not.toBeInTheDocument();

      // Open again and confirm
      fireEvent.click(resetBtn);
      const confirmBtn = screen.getByRole('button', { name: 'Reset Data' });
      fireEvent.click(confirmBtn);

      expect(mockResetAllData).toHaveBeenCalledTimes(1);
    });

    it('Logout button opens ConfirmModal, cancel does nothing, confirm calls logout', () => {
      render(<SettingsScreen />);

      const logoutBtn = screen.getByRole('button', { name: /Log Out of Session/i });
      fireEvent.click(logoutBtn);

      expect(screen.getByText('Log out of Centra?')).toBeInTheDocument();

      // Cancel
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelBtn);
      expect(mockLogout).not.toHaveBeenCalled();

      // Open again and confirm
      fireEvent.click(logoutBtn);
      const confirmBtn = screen.getByRole('button', { name: 'Log Out' });
      fireEvent.click(confirmBtn);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. TransactionDetailModal Confirmation', () => {
    const testTx: Transaction = {
      id: 'tx_999',
      accountId: 'acc_1',
      accountName: 'Checking',
      amount: 45.5,
      currency: 'USD',
      type: 'expense',
      categoryId: 'cat_food',
      categoryName: 'Food & Dining',
      categoryIcon: 'Utensils',
      categoryColor: '#F59E0B',
      date: '2026-10-17T12:00:00Z',
      isPinned: false,
      merchant: 'Tasty Diner',
    };

    it('Delete transaction opens ConfirmModal, cancel does nothing, confirm calls deleteTransaction', () => {
      const mockOnClose = vi.fn();
      render(<TransactionDetailModal transaction={testTx} isOpen={true} onClose={mockOnClose} />);

      const deleteBtn = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(deleteBtn);

      expect(screen.getByText('Delete Transaction')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete this transaction\?/i)).toBeInTheDocument();

      // Cancel
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelBtn);
      expect(mockDeleteTransaction).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();

      // Open again and confirm
      fireEvent.click(deleteBtn);
      const modalConfirmBtn = screen.getAllByRole('button', { name: 'Delete' }).pop()!;
      fireEvent.click(modalConfirmBtn);

      expect(mockDeleteTransaction).toHaveBeenCalledWith('tx_999');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('3. PinLockScreen Confirmation', () => {
    it('"Sign out instead" opens ConfirmModal, cancel does nothing, confirm calls logout', () => {
      render(<PinLockScreen />);

      const signOutBtn = screen.getByRole('button', { name: 'Sign out instead' });
      fireEvent.click(signOutBtn);

      expect(screen.getByText('Sign out of Centra?')).toBeInTheDocument();

      // Cancel
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelBtn);
      expect(mockLogout).not.toHaveBeenCalled();

      // Open again and confirm
      fireEvent.click(signOutBtn);
      const confirmBtn = screen.getByRole('button', { name: 'Sign Out' });
      fireEvent.click(confirmBtn);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. PlanScreen Confirmation', () => {
    it('Delete goal opens ConfirmModal, cancel does nothing, confirm calls deleteGoal', () => {
      render(<PlanScreen onOpenAddGoal={() => {}} />);

      // Open goal options menu
      const optionsBtn = screen.getByLabelText('Goal options');
      fireEvent.click(optionsBtn);

      // Click Delete in menu
      const menuDeleteBtn = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(menuDeleteBtn);

      expect(screen.getByText('Delete Goal')).toBeInTheDocument();
      expect(screen.getByText('Delete "Emergency Fund"?')).toBeInTheDocument();

      // Cancel
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelBtn);
      expect(mockDeleteGoal).not.toHaveBeenCalled();

      // Open again and confirm
      fireEvent.click(optionsBtn);
      const menuDeleteBtn2 = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(menuDeleteBtn2);

      const confirmBtn = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmBtn);
      expect(mockDeleteGoal).toHaveBeenCalledWith('goal_123');
    });
  });

  describe('5. Sidebar Confirmation', () => {
    it('Logout button opens ConfirmModal, cancel does nothing, confirm calls logout', () => {
      render(<Sidebar activeTab="home" onSelectTab={() => {}} />);

      const logoutBtn = screen.getByLabelText('Log out');
      fireEvent.click(logoutBtn);

      expect(screen.getByText('Log out of Centra?')).toBeInTheDocument();

      // Cancel
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelBtn);
      expect(mockLogout).not.toHaveBeenCalled();

      // Open again and confirm
      fireEvent.click(logoutBtn);
      const confirmBtn = screen.getByRole('button', { name: 'Log Out' });
      fireEvent.click(confirmBtn);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('6. OnboardingFlow Confirmation', () => {
    it('Exit setup on profile step opens ConfirmModal, cancel does nothing, confirm calls logout', () => {
      localStorage.removeItem('centra_onboarding_step');
      render(<OnboardingFlow />);

      // The back button on the profile step
      const backBtn = screen.getByLabelText('Go back');
      fireEvent.click(backBtn);

      expect(screen.getByText('Sign out and exit setup?')).toBeInTheDocument();

      // Cancel
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelBtn);
      expect(mockLogout).not.toHaveBeenCalled();

      // Open again and confirm
      fireEvent.click(backBtn);
      const confirmBtn = screen.getByRole('button', { name: 'Sign Out' });
      fireEvent.click(confirmBtn);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });
});
