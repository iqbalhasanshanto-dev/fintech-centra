import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { App } from '../App';
import { AuthProvider, useAuth, GUEST_SESSION_FLAG_KEY } from '../context/AuthContext';
import { FinanceProvider, useFinance } from '../context/FinanceContext';
import { SettingsScreen } from '../components/settings/SettingsScreen';
import { CentraDB, GUEST_USER_ID } from '../db/storage';
import { supabase } from '../lib/supabaseClient';
import type { Transaction } from '../types';

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

vi.mock('../lib/supabaseClient', () => {
  const mockFrom = vi.fn();
  return {
    supabase: {
      from: mockFrom,
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
        exchangeCodeForSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    },
    isSupabaseConfigured: () => true,
  };
});

describe('Session-Scoped Guest Mode & Cold Start Landing Invariants', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    CentraDB.clearAllData();
    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  // (a) cold start with an old persistent guest flag shows the landing page, not the dashboard
  it('(a) cold start with an old persistent guest flag shows the landing page, not the dashboard', async () => {
    // Simulate an existing installation that had persistent guest flags in localStorage
    localStorage.setItem('centra_is_guest_v2', 'true');
    localStorage.setItem('centra_is_guest', 'true');
    localStorage.setItem('centra_guest_flag', 'true');
    sessionStorage.clear(); // Fresh cold start (process start)

    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    render(<App />);

    // Landing screen must show "Explore Demo (Local Only)"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Explore Demo \(Local Only\)/i })).toBeInTheDocument();
    });

    // The dashboard must NOT be rendered
    expect(screen.queryByText(/Guest Mode \(Local Demo\)/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Home/i })).not.toBeInTheDocument();

    // Stale persistent guest flags in localStorage must have been cleared
    expect(localStorage.getItem('centra_is_guest_v2')).toBeNull();
    expect(localStorage.getItem('centra_is_guest')).toBeNull();
    expect(localStorage.getItem('centra_guest_flag')).toBeNull();
  });

  // (b) Explore Demo opens the demo dashboard and a simulated background and resume (same session) keeps it
  it('(b) Explore Demo opens the demo dashboard and a simulated background and resume (same session) keeps it', async () => {
    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { unmount } = render(<App />);

    // 1. Click "Explore Demo (Local Only)"
    const demoBtn = await screen.findByRole('button', { name: /Explore Demo \(Local Only\)/i });
    await act(async () => {
      fireEvent.click(demoBtn);
    });

    // Dashboard renders
    await waitFor(() => {
      expect(screen.getByText(/Guest Mode \(Local Demo\)/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();
    });

    // Session flag is set
    expect(sessionStorage.getItem(GUEST_SESSION_FLAG_KEY)).toBe('true');

    // 2. Simulate moving app to background and returning (same process/session: sessionStorage survives)
    unmount();

    // Re-render App in the same session
    render(<App />);

    // Must still show the demo dashboard
    await waitFor(() => {
      expect(screen.getByText(/Guest Mode \(Local Demo\)/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();
    });
  });

  // (c) a simulated process restart (clear sessionStorage and memory) returns to the landing page
  it('(c) a simulated process restart (clear sessionStorage and memory) returns to the landing page', async () => {
    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    // Start in demo mode
    sessionStorage.setItem(GUEST_SESSION_FLAG_KEY, 'true');
    CentraDB.setActiveUser(GUEST_USER_ID);
    await CentraDB.seedDemoData(GUEST_USER_ID);

    // Simulate process kill: sessionStorage is purged when OS kills the app process
    sessionStorage.clear();

    // Cold start fresh process
    render(<App />);

    // Must return to the landing page
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Explore Demo \(Local Only\)/i })).toBeInTheDocument();
    });

    expect(screen.queryByText(/Guest Mode \(Local Demo\)/i)).not.toBeInTheDocument();
  });

  // (d) a stored valid Supabase session still resumes into the app
  it('(d) a stored valid Supabase session still resumes into the app', async () => {
    const validUserId = '44444444-4444-4444-8444-444444444444';

    // Mock an active Supabase session
    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        session: {
          user: { id: validUserId, email: 'real@example.com' },
          access_token: 'fake-jwt',
        },
      },
      error: null,
    });

    // Mock Supabase profile returning completed onboarding
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((_table: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: validUserId, onboarding_completed: true, base_currency: 'USD', name: 'Real User' },
            error: null,
          }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }));

    // Pre-populate user cache
    CentraDB.setActiveUser(validUserId);
    CentraDB.saveUser({
      id: validUserId,
      name: 'Real User',
      email: 'real@example.com',
      baseCurrency: 'USD',
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(`centra:${validUserId}:last_synced_at`, new Date().toISOString());

    render(<App />);

    // Resumes directly into the app shell (shows Dashboard, NOT the landing screen)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();
    });

    // Real user is not guest
    expect(screen.queryByText(/Guest Mode \(Local Demo\)/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Explore Demo \(Local Only\)/i })).not.toBeInTheDocument();
  });

  // (e) Exit demo returns to the landing page and does not delete real-user data
  it('(e) Exit demo returns to the landing page and does not delete real-user data', async () => {
    const realUserId = '88888888-8888-4888-8888-888888888888';

    // 1. Real user has data stored on this device
    localStorage.setItem(`centra:${realUserId}:user`, JSON.stringify({ id: realUserId, name: 'Real User' }));
    localStorage.setItem(`centra:${realUserId}:accounts`, JSON.stringify([{ id: 'acc_real', name: 'Savings' }]));

    // 2. Currently in guest demo mode
    sessionStorage.setItem(GUEST_SESSION_FLAG_KEY, 'true');
    CentraDB.setActiveUser(GUEST_USER_ID);
    await CentraDB.seedDemoData(GUEST_USER_ID);

    let authContextRef!: ReturnType<typeof useAuth>;
    const TestConsumer = () => {
      authContextRef = useAuth();
      return (
        <div>
          <span>View: {authContextRef.authView}</span>
          <SettingsScreen />
        </div>
      );
    };

    render(
      <AuthProvider>
        <FinanceProvider userId={GUEST_USER_ID}>
          <TestConsumer />
        </FinanceProvider>
      </AuthProvider>
    );

    // Wait for Settings to render Exit Demo option
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Exit Demo/i }).length).toBeGreaterThan(0);
    });

    // Click "Exit Demo"
    const exitDemoButtons = screen.getAllByRole('button', { name: /Exit Demo/i });
    fireEvent.click(exitDemoButtons[0]);

    // ConfirmModal should prompt for confirmation
    expect(screen.getByText(/Exit demo mode and return to the landing page\?/i)).toBeInTheDocument();

    // Confirm exit (last button with name Exit Demo is in the modal)
    const exitButtons = screen.getAllByRole('button', { name: 'Exit Demo' });
    const confirmButton = exitButtons[exitButtons.length - 1];
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    // Must return to signedOut (landing page)
    await waitFor(() => {
      expect(authContextRef.authView).toBe('signedOut');
      expect(authContextRef.isGuest).toBe(false);
    });

    // Session flag must be cleared
    expect(sessionStorage.getItem(GUEST_SESSION_FLAG_KEY)).toBeNull();

    // CRITICAL: Real user's data must remain intact in localStorage!
    expect(localStorage.getItem(`centra:${realUserId}:user`)).not.toBeNull();
    expect(localStorage.getItem(`centra:${realUserId}:accounts`)).not.toBeNull();

    // Guest demo data in localStorage is preserved for next time
    expect(localStorage.getItem(`centra:${GUEST_USER_ID}:accounts`)).not.toBeNull();
  });

  // (f) in guest mode there are still zero supabase.from calls
  it('(f) in guest mode there are still zero supabase.from calls', async () => {
    sessionStorage.setItem(GUEST_SESSION_FLAG_KEY, 'true');
    CentraDB.setActiveUser(GUEST_USER_ID);
    await CentraDB.seedDemoData(GUEST_USER_ID);

    let financeRef!: ReturnType<typeof useFinance>;
    const TestConsumer = () => {
      financeRef = useFinance();
      return <div>Ready</div>;
    };

    render(
      <AuthProvider>
        <FinanceProvider userId={GUEST_USER_ID}>
          <TestConsumer />
        </FinanceProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(financeRef).not.toBeNull();
    });

    // Add an expense and update settings
    await act(async () => {
      await financeRef.updateSettings({ baseCurrency: 'USD' });
      await financeRef.addTransaction({
        type: 'expense',
        amount: 42,
        accountId: 'acc_checking',
        categoryId: 'cat_food',
        date: new Date().toISOString(),
        merchant: 'Demo Cafe',
      } as unknown as Omit<Transaction, 'id'>);
    });

    // Zero supabase.from calls throughout
    expect(supabase.from).toHaveBeenCalledTimes(0);
  });

  // (g) signInWithOAuth clears GUEST_SESSION_FLAG_KEY from sessionStorage before calling supabase
  it('(g) signInWithOAuth clears GUEST_SESSION_FLAG_KEY from sessionStorage before starting OAuth', async () => {
    sessionStorage.setItem(GUEST_SESSION_FLAG_KEY, 'true');
    CentraDB.setActiveUser(GUEST_USER_ID);

    let authContextRef!: ReturnType<typeof useAuth>;
    const TestConsumer = () => {
      authContextRef = useAuth();
      return <div>Ready</div>;
    };

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(sessionStorage.getItem(GUEST_SESSION_FLAG_KEY)).toBe('true');

    await act(async () => {
      await authContextRef.signInWithOAuth('google');
    });

    // Flag must have been removed from sessionStorage
    expect(sessionStorage.getItem(GUEST_SESSION_FLAG_KEY)).toBeNull();
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: `${window.location.origin}/`,
        }),
      })
    );
  });

  // (h) cold start with OAuth callback in URL clears GUEST_SESSION_FLAG_KEY and renders AuthCallbackScreen
  it('(h) cold start with OAuth callback in URL clears GUEST_SESSION_FLAG_KEY and does not boot into guest mode', async () => {
    sessionStorage.setItem(GUEST_SESSION_FLAG_KEY, 'true');
    window.history.replaceState({}, '', '/?code=test-oauth-code');

    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(<App />);

    // Flag must have been cleared
    expect(sessionStorage.getItem(GUEST_SESSION_FLAG_KEY)).toBeNull();

    // Must NOT boot into guest dashboard
    expect(screen.queryByText(/Guest Mode \(Local Demo\)/i)).not.toBeInTheDocument();
    // Must render authenticating callback screen
    expect(screen.getByText(/Authenticating\.\.\./i)).toBeInTheDocument();

    window.history.replaceState({}, '', '/');
  });

  // (i) cold start with active Supabase session clears GUEST_SESSION_FLAG_KEY and prioritizes real session over guest mode
  it('(i) cold start with active Supabase session clears GUEST_SESSION_FLAG_KEY and prioritizes real session over guest mode', async () => {
    const validUserId = '77777777-7777-4777-8777-777777777777';
    sessionStorage.setItem(GUEST_SESSION_FLAG_KEY, 'true');

    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        session: {
          user: { id: validUserId, email: 'realuser@example.com' },
          access_token: 'fake-jwt',
        },
      },
      error: null,
    });

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((_table: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: validUserId, onboarding_completed: true, base_currency: 'USD', name: 'Real User' },
            error: null,
          }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }));

    CentraDB.setActiveUser(validUserId);
    CentraDB.saveUser({
      id: validUserId,
      name: 'Real User',
      email: 'realuser@example.com',
      baseCurrency: 'USD',
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();
    });

    // GUEST_SESSION_FLAG_KEY must be cleared
    expect(sessionStorage.getItem(GUEST_SESSION_FLAG_KEY)).toBeNull();
    // Real user is in dashboard, NOT guest mode
    expect(screen.queryByText(/Guest Mode \(Local Demo\)/i)).not.toBeInTheDocument();
  });
});
