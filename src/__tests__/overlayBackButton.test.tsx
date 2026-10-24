import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BackButtonManager } from '../utils/backButton';
import { TransactionDrawer } from '../components/home/TransactionDrawer';
import { DatePicker } from '../components/ui/DatePicker';
import { SettingsScreen } from '../components/settings/SettingsScreen';
import { AppSettings, UserProfile } from '../types';

// Mock contexts
const defaultUser: UserProfile = {
  id: 'user_1',
  name: 'Test User',
  email: 'test@example.com',
  avatarUrl: '',
  baseCurrency: 'USD',
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

vi.mock('../context/FinanceContext', () => ({
  useFinance: () => ({
    transactions: [],
    categories: [],
    accounts: [],
    goals: [],
    budgets: [],
    settings: defaultSettings,
    updateSettings: vi.fn(),
    resetAllData: vi.fn(),
  }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: defaultUser,
    isGuest: false,
    updateUser: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('Overlay Hardware Back-Button Integration (Task 3)', () => {
  beforeEach(() => {
    BackButtonManager.clear();
  });

  describe('TransactionDrawer', () => {
    it('registers on open and unregisters on close', () => {
      const onClose = vi.fn();
      const onSelect = vi.fn();

      expect(BackButtonManager.getStackSize()).toBe(0);

      // Render closed
      const { rerender } = render(
        <TransactionDrawer isOpen={false} onClose={onClose} onSelectTransaction={onSelect} />
      );
      expect(BackButtonManager.getStackSize()).toBe(0);

      // Open drawer
      rerender(<TransactionDrawer isOpen={true} onClose={onClose} onSelectTransaction={onSelect} />);
      expect(BackButtonManager.getStackSize()).toBe(1);

      // Hardware back press
      const handled = BackButtonManager.handleBackButton();
      expect(handled).toBe(true);
      expect(onClose).toHaveBeenCalledTimes(1);

      // Rerender as closed
      rerender(<TransactionDrawer isOpen={false} onClose={onClose} onSelectTransaction={onSelect} />);
      expect(BackButtonManager.getStackSize()).toBe(0);
    });
  });

  describe('DatePicker', () => {
    it('registers on open and closes via back button', () => {
      const onChange = vi.fn();

      expect(BackButtonManager.getStackSize()).toBe(0);
      render(<DatePicker value="2026-10-24" onChange={onChange} />);

      expect(BackButtonManager.getStackSize()).toBe(0);

      // Click to open date picker modal
      const openButton = screen.getByRole('button');
      fireEvent.click(openButton);

      // Should be registered in BackButtonManager
      expect(BackButtonManager.getStackSize()).toBe(1);

      // Press hardware back button
      act(() => {
        const handled = BackButtonManager.handleBackButton();
        expect(handled).toBe(true);
      });

      // DatePicker should unregister and close
      expect(BackButtonManager.getStackSize()).toBe(0);
    });
  });

  describe('SettingsScreen sub-modals', () => {
    it('registers on opening Edit Profile modal and closes on back button', () => {
      expect(BackButtonManager.getStackSize()).toBe(0);
      render(<SettingsScreen />);

      // Initially no modals open
      expect(BackButtonManager.getStackSize()).toBe(0);

      // Open Edit Profile modal
      const editProfileBtn = screen.getByRole('button', { name: /Edit user profile/i });
      fireEvent.click(editProfileBtn);

      // Modal registered in back button manager
      expect(BackButtonManager.getStackSize()).toBe(1);

      // Press hardware back button
      act(() => {
        const handled = BackButtonManager.handleBackButton();
        expect(handled).toBe(true);
      });

      // Edit Profile modal should close and unregister
      expect(BackButtonManager.getStackSize()).toBe(0);
    });
  });
});
