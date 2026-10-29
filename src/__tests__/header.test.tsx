import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Header } from '../components/layout/Header';

// Mock ThemeToggle
vi.mock('../components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

// Mock FinanceContext
vi.mock('../context/FinanceContext', () => ({
  useFinance: () => ({
    periodFilter: 'this_month',
    setPeriodFilter: vi.fn(),
    unreadNotificationsCount: 2,
    syncStatus: 'synced',
  }),
}));

// Mock AuthContext
const mockAuth = {
  user: { name: 'Adam James', email: 'adam@example.com', avatarUrl: 'https://example.com/avatar.jpg' },
  isGuest: false,
  createAccountFromGuest: vi.fn(),
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

describe('Header Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays "Good Morning" when local time is 08:00', () => {
    vi.setSystemTime(new Date(2026, 9, 28, 8, 0, 0));
    render(
      <Header
        onOpenNotifications={vi.fn()}
        onNavigateToSettings={vi.fn()}
      />
    );
    expect(screen.getByText('Good Morning')).toBeDefined();
    expect(screen.getByText('Adam James')).toBeDefined();
  });

  it('displays "Good Afternoon" when local time is 14:00', () => {
    vi.setSystemTime(new Date(2026, 9, 28, 14, 0, 0));
    render(
      <Header
        onOpenNotifications={vi.fn()}
        onNavigateToSettings={vi.fn()}
      />
    );
    expect(screen.getByText('Good Afternoon')).toBeDefined();
  });

  it('displays "Good Evening" when local time is 19:30', () => {
    vi.setSystemTime(new Date(2026, 9, 28, 19, 30, 0));
    render(
      <Header
        onOpenNotifications={vi.fn()}
        onNavigateToSettings={vi.fn()}
      />
    );
    expect(screen.getByText('Good Evening')).toBeDefined();
  });

  it('updates greeting dynamically when the hour boundary crosses (e.g. from 11:59 to 12:00)', () => {
    vi.setSystemTime(new Date(2026, 9, 28, 11, 59, 45));
    render(
      <Header
        onOpenNotifications={vi.fn()}
        onNavigateToSettings={vi.fn()}
      />
    );
    expect(screen.getByText('Good Morning')).toBeDefined();

    // Advance timers by 30 seconds into 12:00
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(screen.getByText('Good Afternoon')).toBeDefined();
  });

  it('has accessible settings profile button of at least 44x44 px that calls onNavigateToSettings', () => {
    const onNavigateToSettings = vi.fn();
    render(
      <Header
        onOpenNotifications={vi.fn()}
        onNavigateToSettings={onNavigateToSettings}
      />
    );

    const settingsBtn = screen.getByRole('button', { name: /open settings/i });
    expect(settingsBtn).toBeDefined();
    expect(settingsBtn.className).toContain('min-w-[44px]');
    expect(settingsBtn.className).toContain('min-h-[44px]');

    fireEvent.click(settingsBtn);
    expect(onNavigateToSettings).toHaveBeenCalledTimes(1);
  });

  it('has accessible notifications button of at least 44x44 px that calls onOpenNotifications', () => {
    const onOpenNotifications = vi.fn();
    render(
      <Header
        onOpenNotifications={onOpenNotifications}
        onNavigateToSettings={vi.fn()}
      />
    );

    const notifBtn = screen.getByRole('button', { name: /open notifications/i });
    expect(notifBtn).toBeDefined();
    expect(notifBtn.className).toContain('min-w-[44px]');
    expect(notifBtn.className).toContain('min-h-[44px]');

    fireEvent.click(notifBtn);
    expect(onOpenNotifications).toHaveBeenCalledTimes(1);
  });
});
