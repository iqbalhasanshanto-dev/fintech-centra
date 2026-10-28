import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { TransactionsList } from '../components/home/TransactionsList';
import { BackButtonManager } from '../utils/backButton';

// Mock dependencies
vi.mock('../components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock('../context/FinanceContext', () => ({
  useFinance: () => ({
    periodFilter: 'this_month',
    setPeriodFilter: vi.fn(),
    unreadNotificationsCount: 3,
    syncStatus: 'synced',
    settings: { privacyMode: false, baseCurrency: 'USD' },
    transactions: [
      {
        id: 'tx-1',
        type: 'expense',
        amount: 45,
        currency: 'USD',
        category: 'Food',
        description: 'Lunch',
        date: '2026-10-28T12:00:00Z',
        accountId: 'acc-1',
      },
    ],
  }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Adam James', email: 'adam@example.com', avatarUrl: 'https://example.com/avatar.jpg' },
    isGuest: false,
    createAccountFromGuest: vi.fn(),
  }),
}));

describe('Navigation Routes Verification', () => {
  beforeEach(() => {
    BackButtonManager.clear();
  });

  it('Route 1 - Settings: reached via header profile button ("Open settings")', () => {
    const onNavigateToSettings = vi.fn();
    render(
      <Header
        onOpenNotifications={vi.fn()}
        onNavigateToSettings={onNavigateToSettings}
      />
    );

    const profileBtn = screen.getByRole('button', { name: /open settings/i });
    expect(profileBtn).toBeDefined();
    fireEvent.click(profileBtn);
    expect(onNavigateToSettings).toHaveBeenCalledTimes(1);
  });

  it('Route 1 - Settings back navigation: Android back button returns to Home', () => {
    let currentTab: string = 'settings';
    const unregister = BackButtonManager.registerRootHandler(() => {
      if (currentTab !== 'home') {
        currentTab = 'home';
      }
    });

    expect(currentTab).toBe('settings');
    const handled = BackButtonManager.handleBackButton();
    expect(handled).toBe(true);
    expect(currentTab).toBe('home');

    unregister();
  });

  it('Route 2 - Notifications: reached via header bell button ("Open notifications")', () => {
    const onOpenNotifications = vi.fn();
    render(
      <Header
        onOpenNotifications={onOpenNotifications}
        onNavigateToSettings={vi.fn()}
      />
    );

    const bellBtn = screen.getByRole('button', { name: /open notifications/i });
    expect(bellBtn).toBeDefined();
    fireEvent.click(bellBtn);
    expect(onOpenNotifications).toHaveBeenCalledTimes(1);
  });

  it('Route 3 - View all transactions: reached via "View All" on Recent Activity in Home', () => {
    const onOpenSeeAll = vi.fn();
    render(
      <TransactionsList
        onSelectTransaction={vi.fn()}
        onOpenSeeAll={onOpenSeeAll}
      />
    );

    const viewAllBtn = screen.getByRole('button', { name: /view all transactions/i });
    expect(viewAllBtn).toBeDefined();
    fireEvent.click(viewAllBtn);
    expect(onOpenSeeAll).toHaveBeenCalledTimes(1);
  });

  it('Bottom navigation does NOT contain a Settings item (floating dock has 3 main tabs: Home, Analytics, Budgets)', () => {
    const onSelectTab = vi.fn();
    render(
      <BottomNav
        activeTab="home"
        onSelectTab={onSelectTab}
        onOpenAddAction={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Home' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Analytics' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Budgets' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull();
  });
});
