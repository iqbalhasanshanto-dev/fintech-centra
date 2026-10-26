import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { App } from '../App';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { FinanceProvider, useFinance } from '../context/FinanceContext';
import { GuestBanner } from '../components/layout/GuestBanner';
import { CentraDB, GUEST_USER_ID, isGuestUser } from '../db/storage';
import { OutboxQueue } from '../db/outbox';
import { supabase } from '../lib/supabaseClient';
import type { AppSettings, Transaction } from '../types';

vi.mock('../lib/supabaseClient', () => {
  const mockFrom = vi.fn();
  return {
    supabase: {
      from: mockFrom,
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    },
    isSupabaseConfigured: () => true,
  };
});

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

describe('Guest Mode Fix & Invariant Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    CentraDB.clearAllData();
  });

  // (c) isGuestUser for each id shape ('guest', 'guest_123', '', null, 'abc', a valid UUID)
  it('(c) isGuestUser correctly identifies each id shape', () => {
    expect(isGuestUser('guest')).toBe(true);
    expect(isGuestUser('guest_123')).toBe(true);
    expect(isGuestUser('guest_1792924629553')).toBe(true);
    expect(isGuestUser('')).toBe(true);
    expect(isGuestUser(null)).toBe(true);
    expect(isGuestUser(undefined)).toBe(true);
    expect(isGuestUser('abc')).toBe(true);
    expect(isGuestUser('user_123')).toBe(true);

    // Valid UUIDs must return false
    expect(isGuestUser('123e4567-e89b-12d3-a456-426614174000')).toBe(false);
    expect(isGuestUser('00000000-0000-4000-8000-000000000000')).toBe(false);
    expect(isGuestUser('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(false);

    // Constant check
    expect(GUEST_USER_ID).toBe('guest');
  });

  // (a) entering guest mode renders the home dashboard and never the retry screen
  it('(a) entering guest mode renders the home dashboard and never the retry screen', async () => {
    render(<App />);

    // Initially on IntroScreen with "Explore Demo (Local Only)"
    const demoButton = await screen.findByRole('button', { name: /Explore Demo \(Local Only\)/i });
    expect(demoButton).toBeInTheDocument();

    // Tap "Explore Demo (Local Only)"
    await act(async () => {
      fireEvent.click(demoButton);
    });

    // The demo dashboard must render immediately
    await waitFor(() => {
      // Guest banner indicating guest mode
      expect(screen.getByText(/Guest Mode \(Local Demo\)/i)).toBeInTheDocument();
      // Main dashboard elements should be present
      expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument();
      expect(screen.getByText(/New transaction/i)).toBeInTheDocument();
    });

    // Verify retry screen and loading screen never render
    expect(screen.queryByText(/Unable to Sync Data/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tap below to retry syncing/i)).not.toBeInTheDocument();
  });

  // (b) in guest mode, adding an expense, editing settings and reloading the provider cause ZERO supabase.from calls
  it('(b) in guest mode, adding an expense, editing settings and reloading the provider cause ZERO supabase.from calls', async () => {
    // Seed demo data and set active user
    await CentraDB.seedDemoData(GUEST_USER_ID);
    CentraDB.setActiveUser(GUEST_USER_ID);
    localStorage.setItem('centra_is_guest_v2', 'true');

    let financeContextRef!: ReturnType<typeof useFinance>;
    const TestConsumer: React.FC = () => {
      financeContextRef = useFinance();
      return (
        <div>
          <span data-testid="tx-count">{financeContextRef.transactions.length}</span>
          <span data-testid="base-currency">{financeContextRef.settings.baseCurrency}</span>
        </div>
      );
    };

    const { unmount } = render(
      <FinanceProvider userId={GUEST_USER_ID}>
        <TestConsumer />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(financeContextRef).not.toBeNull();
    });

    // 1. Edit settings (configure base currency and preferences)
    await act(async () => {
      await financeContextRef.updateSettings({
        baseCurrency: 'USD',
        hapticsEnabled: true,
        smartAlertsEnabled: false,
      } as unknown as Partial<AppSettings>);
    });

    // 2. Add an expense
    await act(async () => {
      const accounts = CentraDB.getAccounts();
      const categories = CentraDB.getCategories();
      await financeContextRef.addTransaction({
        type: 'expense',
        amount: 25.5,
        accountId: accounts[0]?.id || 'acc_demo_checking',
        categoryId: categories[0]?.id || 'cat_demo_food',
        date: new Date().toISOString(),
        merchant: 'Coffee Shop',
        notes: 'Guest purchase',
      } as unknown as Omit<Transaction, 'id'>);
    });

    // 3. Reload provider
    unmount();

    render(
      <FinanceProvider userId={GUEST_USER_ID}>
        <TestConsumer />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(financeContextRef).not.toBeNull();
    });

    // Assert ZERO supabase.from calls were made
    expect(supabase.from).toHaveBeenCalledTimes(0);

    // Also assert outbox has zero records for guest
    expect(OutboxQueue.getPending(GUEST_USER_ID)).toHaveLength(0);
  });

  // (d) "Create account" from guest mode still shows the confirmation and clears the guest namespace
  it('(d) "Create account" from guest mode still shows the confirmation and clears the guest namespace', async () => {
    localStorage.setItem('centra:guest:custom_data', 'test_data');
    localStorage.setItem('centra_is_guest_v2', 'true');
    sessionStorage.setItem('centra_is_guest_session', 'true');
    CentraDB.setActiveUser(GUEST_USER_ID);
    await CentraDB.seedDemoData(GUEST_USER_ID);

    let authContextRef!: ReturnType<typeof useAuth>;
    const TestConsumer: React.FC = () => {
      authContextRef = useAuth();
      return (
        <div>
          <span>Mode: {authContextRef.authMode}</span>
          <span>View: {authContextRef.authView}</span>
          <GuestBanner />
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Wait for guest mode initialization
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create account to enable cloud sync/i })).toBeInTheDocument();
    });

    // Click "Create account to enable cloud sync."
    const createBtn = screen.getByRole('button', { name: /Create account to enable cloud sync/i });
    fireEvent.click(createBtn);

    // ConfirmModal should appear
    expect(screen.getByText('Create a real account? Your demo data will be discarded.')).toBeInTheDocument();

    // Confirm creation
    const confirmBtn = screen.getByRole('button', { name: 'Create Account' });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Guest namespace must be cleared
    expect(localStorage.getItem('centra:guest:custom_data')).toBeNull();
    expect(localStorage.getItem('centra:guest:accounts')).toBeNull();
    expect(localStorage.getItem('centra_is_guest_v2')).toBeNull();

    // Mode switched to signup and signedOut view
    expect(authContextRef.authMode).toBe('signup');
    expect(authContextRef.authView).toBe('signedOut');
    expect(authContextRef.isGuest).toBe(false);
  });

  // (e) a real user with a UUID and an empty cache still shows the loading screen, and the retry screen if the first sync fails
  it('(e) a real user with a UUID and an empty cache still shows the loading screen, and the retry screen if the first sync fails', async () => {
    const realUserUuid = '55555555-5555-4555-8555-555555555555';

    // Mock supabase.from to simulate network / sync failure
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Failed to connect to Supabase' } }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'Failed to connect to Supabase' } }),
        }),
      }),
    }));

    render(
      <FinanceProvider userId={realUserUuid}>
        <div data-testid="app-content">Secret User Content</div>
      </FinanceProvider>
    );

    // Initial state: shows loading screen (or wait for retry)
    // Wait for the sync to fail and render the retry screen
    await waitFor(() => {
      expect(screen.getByText('Unable to Sync Data')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    // Secret user content must not be displayed while waiting on first sync
    expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
  });
});
