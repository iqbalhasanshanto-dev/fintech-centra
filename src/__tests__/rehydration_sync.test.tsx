import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { FinanceProvider, useFinance } from '../context/FinanceContext';
import { CentraDB } from '../db/storage';
import { OutboxQueue } from '../db/outbox';
import { supabase } from '../lib/supabaseClient';

vi.mock('../lib/supabaseClient', () => {
  const mockFrom = vi.fn();
  return {
    supabase: {
      from: mockFrom,
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
    },
    isSupabaseConfigured: () => true,
  };
});

function createMockQuery(data: any = [], error: any = null) {
  const result = { data, error };
  const promise = Promise.resolve(result) as any;
  promise.order = vi.fn().mockResolvedValue(result);
  promise.maybeSingle = vi.fn().mockResolvedValue({
    data: Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data,
    error,
  });
  return promise;
}

function createSupabaseMock(handlers: Record<string, any> = {}) {
  (supabase.from as any).mockImplementation((table: string) => {
    if (handlers[table]) {
      return handlers[table]();
    }
    const defaultData = table === 'profiles'
      ? { id: 'test_user', onboarding_completed: true }
      : table === 'settings'
      ? { user_id: 'test_user', base_currency: 'USD' }
      : [];
    const query = createMockQuery(defaultData, null);
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(query),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    };
  });
}

// Test consumer component
const TestConsumer: React.FC = () => {
  const { accounts, syncStatus, totalBalance, settings } = useFinance();
  return (
    <div>
      <span data-testid="sync-status">{syncStatus}</span>
      <span data-testid="accounts-count">{accounts.length}</span>
      <span data-testid="total-balance">{totalBalance}</span>
      <span data-testid="base-currency">{settings.baseCurrency || 'NONE'}</span>
      <ul data-testid="accounts-list">
        {accounts.map(a => (
          <li key={a.id}>{a.name}</li>
        ))}
      </ul>
    </div>
  );
};

describe('Phase 3: FinanceProvider First-Sync Gating & Rehydration', () => {
  beforeEach(() => {
    CentraDB.clearAllData();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('user with empty cache sees the loading screen until the first sync ends', async () => {
    const uid = 'user_new_empty_device';
    CentraDB.setActiveUser(uid);
    expect(CentraDB.hasCachedData(uid)).toBe(false);

    let resolveSync: (val: any) => void;
    const syncPromise = new Promise(resolve => {
      resolveSync = resolve;
    });

    createSupabaseMock({
      profiles: () => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockReturnValue(syncPromise),
          }),
        }),
      }),
    });

    render(
      <FinanceProvider key={uid} userId={uid}>
        <TestConsumer />
      </FinanceProvider>
    );

    // Initial render: user must see loading splash screen
    expect(screen.getByText('Starting Centra...')).toBeInTheDocument();
    expect(screen.queryByTestId('accounts-count')).not.toBeInTheDocument();

    // Now resolve sync
    await act(async () => {
      resolveSync({
        data: { id: uid, onboarding_completed: true },
        error: null,
      });
    });

    // After sync settles, loading screen disappears and main content renders
    await waitFor(() => {
      expect(screen.getByTestId('accounts-count')).toBeInTheDocument();
    });
  });

  it('first sync fails with no cache -> shows retry screen, not an empty app', async () => {
    const uid = 'user_sync_failed_no_cache';
    CentraDB.setActiveUser(uid);
    expect(CentraDB.hasCachedData(uid)).toBe(false);

    // Mock profile fetch error
    createSupabaseMock({
      profiles: () => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Failed to fetch from remote' },
            }),
          }),
        }),
      }),
    });

    render(
      <FinanceProvider key={uid} userId={uid}>
        <TestConsumer />
      </FinanceProvider>
    );

    // Should display the SyncRetryScreen, not an empty dashboard
    await waitFor(() => {
      expect(screen.getByText('Unable to Sync Data')).toBeInTheDocument();
      expect(screen.getByText('Retry Sync')).toBeInTheDocument();
      expect(screen.queryByTestId('accounts-count')).not.toBeInTheDocument();
    });
  });

  it('sync completes -> state updates without any user action', async () => {
    const uid = 'user_auto_rehydrate';
    // User already has cached data
    localStorage.setItem(`centra:${uid}:last_synced_at`, new Date().toISOString());
    localStorage.setItem(`centra:${uid}:accounts`, JSON.stringify([
      { id: 'acc_init', name: 'Cached Account', balance: 100, type: 'checking', currency: 'USD' }
    ]));
    CentraDB.setActiveUser(uid);

    createSupabaseMock({
      accounts: () => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue(createMockQuery([
            { id: 'acc_init', user_id: uid, name: 'Cached Account', balance: 100, type: 'checking', currency: 'USD' },
            { id: 'acc_remote_new', user_id: uid, name: 'Cloud Added Account', balance: 2500, type: 'savings', currency: 'USD' }
          ])),
        }),
      }),
    });

    render(
      <FinanceProvider key={uid} userId={uid}>
        <TestConsumer />
      </FinanceProvider>
    );

    // Cached data renders immediately
    expect(screen.getByText('Cached Account')).toBeInTheDocument();
    expect(screen.getByTestId('accounts-count')).toHaveTextContent('1');

    // Trigger syncFromSupabase externally (e.g. background sync or tab focus)
    await act(async () => {
      await CentraDB.syncFromSupabase(uid, undefined, undefined, { force: true });
    });

    // Without ANY user action, state updates automatically!
    await waitFor(() => {
      expect(screen.getByTestId('accounts-count')).toHaveTextContent('2');
      expect(screen.getByText('Cloud Added Account')).toBeInTheDocument();
    });
  });

  it('pending outbox item wins over stale remote data in React state', async () => {
    const uid = 'user_outbox_wins_react';
    localStorage.setItem(`centra:${uid}:last_synced_at`, new Date().toISOString());
    localStorage.setItem(`centra:${uid}:accounts`, JSON.stringify([
      { id: 'acc_1', name: 'Local Draft Account', balance: 500, type: 'checking', currency: 'USD' }
    ]));
    CentraDB.setActiveUser(uid);

    // Enqueue a pending upsert for acc_1
    OutboxQueue.enqueue({
      userId: uid,
      entity: 'accounts',
      op: 'upsert',
      recordId: 'acc_1',
      payload: { id: 'acc_1', name: 'Local Draft Account', balance: 500, type: 'checking', currency: 'USD' },
    });

    createSupabaseMock({
      accounts: () => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue(createMockQuery([
            { id: 'acc_1', user_id: uid, name: 'Stale Remote Account', balance: 100, type: 'checking', currency: 'USD' }
          ])),
        }),
      }),
    });

    render(
      <FinanceProvider key={uid} userId={uid}>
        <TestConsumer />
      </FinanceProvider>
    );

    // Initial render shows local version
    expect(screen.getByText('Local Draft Account')).toBeInTheDocument();

    // Trigger sync
    await act(async () => {
      await CentraDB.syncFromSupabase(uid, undefined, undefined, { force: true });
    });

    // Pending local version wins! Stale remote does not overwrite it
    expect(screen.getByText('Local Draft Account')).toBeInTheDocument();
    expect(screen.queryByText('Stale Remote Account')).not.toBeInTheDocument();
  });

  it('remote deletion from another device removes the local copy in React state', async () => {
    const uid = 'user_remote_del_react';
    localStorage.setItem(`centra:${uid}:last_synced_at`, new Date().toISOString());
    localStorage.setItem(`centra:${uid}:accounts`, JSON.stringify([
      { id: 'acc_to_remove', name: 'Account Deleted Remotely', balance: 350, type: 'checking', currency: 'USD' }
    ]));
    CentraDB.setActiveUser(uid);

    createSupabaseMock({
      accounts: () => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue(createMockQuery([])),
        }),
      }),
    });

    render(
      <FinanceProvider key={uid} userId={uid}>
        <TestConsumer />
      </FinanceProvider>
    );

    expect(screen.getByText('Account Deleted Remotely')).toBeInTheDocument();
    expect(screen.getByTestId('accounts-count')).toHaveTextContent('1');

    // Trigger sync
    await act(async () => {
      await CentraDB.syncFromSupabase(uid, undefined, undefined, { force: true });
    });

    // React state reflects remote deletion
    await waitFor(() => {
      expect(screen.queryByText('Account Deleted Remotely')).not.toBeInTheDocument();
      expect(screen.getByTestId('accounts-count')).toHaveTextContent('0');
    });
  });

  it('switching users shows no data from previous user', async () => {
    createSupabaseMock();

    // User 1 setup
    const uid1 = 'user_switch_1';
    localStorage.setItem(`centra:${uid1}:last_synced_at`, new Date().toISOString());
    localStorage.setItem(`centra:${uid1}:accounts`, JSON.stringify([
      { id: 'acc_u1', name: 'User 1 Confidential Account', balance: 9999, type: 'checking', currency: 'USD' }
    ]));
    CentraDB.setActiveUser(uid1);

    const { unmount } = render(
      <FinanceProvider key={uid1} userId={uid1}>
        <TestConsumer />
      </FinanceProvider>
    );

    expect(screen.getByText('User 1 Confidential Account')).toBeInTheDocument();
    unmount();

    // User 2 setup (clean user)
    const uid2 = 'user_switch_2';
    localStorage.setItem(`centra:${uid2}:last_synced_at`, new Date().toISOString());
    CentraDB.setActiveUser(uid2);

    render(
      <FinanceProvider key={uid2} userId={uid2}>
        <TestConsumer />
      </FinanceProvider>
    );

    expect(screen.queryByText('User 1 Confidential Account')).not.toBeInTheDocument();
    expect(screen.getByTestId('accounts-count')).toHaveTextContent('0');
  });

  it('null baseCurrency does not crash formatters, conversions, or calculations', async () => {
    createSupabaseMock();

    const uid = 'user_null_curr';
    localStorage.setItem(`centra:${uid}:last_synced_at`, new Date().toISOString());
    // Settings with baseCurrency: null
    localStorage.setItem(`centra:${uid}:settings`, JSON.stringify({
      theme: 'light',
      baseCurrency: null,
      privacyMode: false,
      security: { biometricEnabled: false, pinLockEnabled: false },
    }));
    localStorage.setItem(`centra:${uid}:accounts`, JSON.stringify([
      { id: 'acc_nc', name: 'Null Currency Acc', balance: 1500, type: 'checking', currency: 'USD' }
    ]));
    CentraDB.setActiveUser(uid);

    render(
      <FinanceProvider key={uid} userId={uid}>
        <TestConsumer />
      </FinanceProvider>
    );

    // Must render cleanly without throwing
    expect(screen.getByText('Null Currency Acc')).toBeInTheDocument();
    expect(screen.getByTestId('total-balance')).toHaveTextContent('1500');
    expect(screen.getByTestId('base-currency')).toHaveTextContent('NONE');
  });
});
