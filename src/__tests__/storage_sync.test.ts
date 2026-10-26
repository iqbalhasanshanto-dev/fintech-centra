import { describe, it, expect, vi, beforeEach } from 'vitest';
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
      },
    },
    isSupabaseConfigured: () => true,
  };
});

describe('Phase 3: Storage & Sync Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Outbox Queue Mechanics', () => {
    it('enqueues pending operations and retrieves them per user', () => {
      const item1 = OutboxQueue.enqueue({
        userId: '11111111-1111-4111-8111-111111111111',
        entity: 'transactions',
        op: 'upsert',
        recordId: 'tx_1',
        payload: { id: 'tx_1', amount: 50 },
      });

      expect(item1.id).toBeDefined();
      expect(OutboxQueue.count('11111111-1111-4111-8111-111111111111')).toBe(1);

      const pending = OutboxQueue.getPending('11111111-1111-4111-8111-111111111111');
      expect(pending).toHaveLength(1);
      expect(pending[0].recordId).toBe('tx_1');
      expect(pending[0].payload?.amount).toBe(50);
    });

    it('coalesces duplicate updates for the same entity and recordId', () => {
      OutboxQueue.enqueue({
        userId: '11111111-1111-4111-8111-111111111111',
        entity: 'transactions',
        op: 'upsert',
        recordId: 'tx_1',
        payload: { id: 'tx_1', amount: 50 },
      });

      OutboxQueue.enqueue({
        userId: '11111111-1111-4111-8111-111111111111',
        entity: 'transactions',
        op: 'upsert',
        recordId: 'tx_1',
        payload: { id: 'tx_1', amount: 75 },
      });

      const pending = OutboxQueue.getPending('11111111-1111-4111-8111-111111111111');
      expect(pending).toHaveLength(1);
      expect(pending[0].payload?.amount).toBe(75);
    });

    it('removes item from outbox by item ID', () => {
      const item = OutboxQueue.enqueue({
        userId: '11111111-1111-4111-8111-111111111111',
        entity: 'accounts',
        op: 'delete',
        recordId: 'acc_1',
      });

      expect(OutboxQueue.count('11111111-1111-4111-8111-111111111111')).toBe(1);
      OutboxQueue.remove('11111111-1111-4111-8111-111111111111', item.id);
      expect(OutboxQueue.count('11111111-1111-4111-8111-111111111111')).toBe(0);
    });
  });

  describe('Guest Isolation Invariant', () => {
    it('never calls Supabase for guest user mutations', async () => {
      CentraDB.setActiveUser('guest');

      await CentraDB.upsertTransaction({
        id: 'tx_guest_1',
        type: 'expense',
        amount: 25,
        currency: 'USD',
        categoryId: 'cat_dining',
        categoryName: 'Dining',
        categoryIcon: 'Utensils',
        categoryColor: '#f97316',
        accountId: 'acc_cash',
        accountName: 'Cash Wallet',
        merchant: 'Cafe',
        date: '2026-10-09T12:00:00.000Z',
      });

      expect(supabase.from).not.toHaveBeenCalled();

      const txs = CentraDB.getTransactions();
      expect(txs.some(t => t.id === 'tx_guest_1')).toBe(true);
    });

    it('saves guest data under centra:guest:* keys and does not pollute other users', async () => {
      CentraDB.setActiveUser('guest');
      // Add a guest transaction
      await CentraDB.upsertTransaction({
        id: 'tx_guest_p1',
        type: 'expense',
        amount: 10,
        currency: 'USD',
        categoryId: 'cat_dining',
        categoryName: 'Dining',
        categoryIcon: 'Utensils',
        categoryColor: '#f97316',
        accountId: 'acc_cash',
        accountName: 'Cash',
        merchant: 'Bakery',
        date: '2026-10-09T12:00:00.000Z',
      });

      // Switch to a real user
      CentraDB.setActiveUser('22222222-2222-4222-8222-222222222222');
      const userTxs = CentraDB.getTransactions();
      // Real user starts with an empty list, NOT demo or guest data
      expect(userTxs).toHaveLength(0);

      // Verify guest data is kept under guest namespace and real user namespace is separate
      expect(localStorage.getItem('centra:guest:transactions')).not.toBeNull();
      expect(JSON.parse(localStorage.getItem('centra:guest:transactions')!)).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'tx_guest_p1' })])
      );
      expect(localStorage.getItem('centra:22222222-2222-4222-8222-222222222222:transactions')).toBeNull();

      // Writing a transaction as real user writes strictly to real user namespace
      await CentraDB.upsertTransaction({
        id: 'tx_real_p1',
        type: 'income',
        amount: 500,
        currency: 'USD',
        categoryId: 'cat_salary',
        categoryName: 'Salary',
        categoryIcon: 'Briefcase',
        categoryColor: '#10b981',
        accountId: 'acc_main',
        accountName: 'Main',
        merchant: 'Employer',
        date: '2026-10-09T12:00:00.000Z',
      });

      expect(localStorage.getItem('centra:22222222-2222-4222-8222-222222222222:transactions')).not.toBeNull();
      expect(JSON.parse(localStorage.getItem('centra:22222222-2222-4222-8222-222222222222:transactions')!)).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'tx_real_p1' })])
      );
    });
  });

  describe('Safe Remote Sync & Error Handling', () => {
    it('preserves local records if remote fetch returns an error (no destructive wipe)', async () => {
      CentraDB.setActiveUser('33333333-3333-4333-8333-333333333333');

      // Add a local transaction (simulating local write)
      await CentraDB.upsertTransaction({
        id: 'tx_offline_local',
        type: 'income',
        amount: 1500,
        currency: 'USD',
        categoryId: 'cat_salary',
        categoryName: 'Salary',
        categoryIcon: 'Briefcase',
        categoryColor: '#10b981',
        accountId: 'acc_main',
        accountName: 'Main',
        merchant: 'Employer',
        date: '2026-10-09T12:00:00.000Z',
      });

      // Mock Supabase: profiles and settings succeed, but transactions query errors out
      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: '33333333-3333-4333-8333-333333333333', name: 'Test User' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { user_id: '33333333-3333-4333-8333-333333333333', base_currency: 'USD' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Network connection lost', code: 'PGRST000' },
              }),
            }),
          }),
        };
      });

      // Trigger sync
      await CentraDB.syncFromSupabase('33333333-3333-4333-8333-333333333333');

      // Invariant: Local transactions must NOT be wiped
      const localTxs = CentraDB.getTransactions();
      expect(localTxs).toHaveLength(1);
      expect(localTxs[0].id).toBe('tx_offline_local');
      expect(localTxs[0].amount).toBe(1500);
    });
  });

  describe('Per-Record Delete Scoping', () => {
    it('executes .delete().eq("id", id) when deleting a transaction for real user', async () => {
      CentraDB.setActiveUser('44444444-4444-4444-8444-444444444444');

      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: mockDelete,
      });

      await CentraDB.deleteTransaction('tx_to_remove');

      expect(supabase.from).toHaveBeenCalledWith('transactions');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'tx_to_remove');
    });

    it('deleteAllUserData calls .delete().eq("user_id", userId) and clears local records', async () => {
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: mockDelete,
      });

      await CentraDB.deleteAllUserData('44444444-4444-4444-8444-444444444444');

      expect(supabase.from).toHaveBeenCalledWith('transactions');
      expect(supabase.from).toHaveBeenCalledWith('accounts');
      expect(supabase.from).toHaveBeenCalledWith('categories');
      expect(supabase.from).toHaveBeenCalledWith('budgets');
      expect(supabase.from).toHaveBeenCalledWith('goals');
      expect(mockEq).toHaveBeenCalledWith('user_id', '44444444-4444-4444-8444-444444444444');

      // Cache should be completely empty
      expect(CentraDB.getTransactions()).toHaveLength(0);
      expect(CentraDB.getAccounts()).toHaveLength(0);
    });

    it('deleteAllUserData preserves local data and outbox if remote deletion fails', async () => {
      CentraDB.setActiveUser('55555555-5555-4555-8555-555555555555');
      // Add a dummy transaction in cache
      localStorage.setItem('centra:55555555-5555-4555-8555-555555555555:transactions', JSON.stringify([{ id: 'tx_stay' }]));
      CentraDB.setActiveUser('55555555-5555-4555-8555-555555555555');

      // Simulate remote delete error
      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database connection failed' } }),
        }),
      });

      const res = await CentraDB.deleteAllUserData('55555555-5555-4555-8555-555555555555');
      expect(res.ok).toBe(false);

      // Local data must NOT be wiped
      expect(CentraDB.getTransactions()).toHaveLength(1);
      expect(CentraDB.getTransactions()[0].id).toBe('tx_stay');
    });
  });

  describe('Entity Merge Rule & Outbox Priority', () => {
    it('preserves local records with pending upsert over remote data (local pending wins)', async () => {
      const uid = '66666666-6666-4666-8666-666666666661';
      CentraDB.setActiveUser(uid);

      // Enqueue an offline local edit for an account
      OutboxQueue.enqueue({
        userId: uid,
        entity: 'accounts',
        op: 'upsert',
        recordId: 'acc_1',
        payload: { id: 'acc_1', name: 'Local Edited Name', balance: 5000 },
      });

      // Populate local cache with edited account
      localStorage.setItem(`centra:${uid}:accounts`, JSON.stringify([
        { id: 'acc_1', name: 'Local Edited Name', balance: 5000, type: 'checking', currency: 'USD' }
      ]));
      CentraDB.setActiveUser(uid);

      // Mock remote Supabase returns older remote version
      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: uid, onboarding_completed: true }, error: null }),
              }),
            }),
          };
        }
        if (table === 'accounts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'acc_1', user_id: uid, name: 'Stale Remote Name', balance: 100, type: 'checking', currency: 'USD' }],
                error: null,
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      });

      await CentraDB.syncFromSupabase(uid, undefined, undefined, { force: true });

      const accounts = CentraDB.getAccounts();
      expect(accounts).toHaveLength(1);
      // Local pending version won!
      expect(accounts[0].name).toBe('Local Edited Name');
      expect(accounts[0].balance).toBe(5000);
    });

    it('remote deletion from another device removes the local copy', async () => {
      const uid = '66666666-6666-4666-8666-666666666662';
      CentraDB.setActiveUser(uid);

      // Locally user had acc_to_be_deleted in cache
      localStorage.setItem(`centra:${uid}:accounts`, JSON.stringify([
        { id: 'acc_to_be_deleted', name: 'Old Account', balance: 200, type: 'checking', currency: 'USD' }
      ]));
      CentraDB.setActiveUser(uid);
      expect(CentraDB.getAccounts()).toHaveLength(1);

      // Remote Supabase has 0 accounts (another device deleted it)
      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: uid, onboarding_completed: true }, error: null }),
              }),
            }),
          };
        }
        if (table === 'accounts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      });

      await CentraDB.syncFromSupabase(uid, undefined, undefined, { force: true });

      // Local copy was removed!
      expect(CentraDB.getAccounts()).toHaveLength(0);
    });
  });

  describe('User Isolation and Logout Cleanup', () => {
    it('sign out clears cache and outbox completely', () => {
      const uid = '77777777-7777-4777-8777-777777777777';
      CentraDB.setActiveUser(uid);

      OutboxQueue.enqueue({
        userId: uid,
        entity: 'transactions',
        op: 'upsert',
        recordId: 'tx_pending',
        payload: { id: 'tx_pending' },
      });
      expect(OutboxQueue.count(uid)).toBe(1);

      localStorage.setItem(`centra:${uid}:accounts`, JSON.stringify([{ id: 'acc_private' }]));

      CentraDB.clearAllData();

      // Outbox and namespaced keys must be cleared
      expect(OutboxQueue.count(uid)).toBe(0);
      expect(localStorage.getItem(`centra:${uid}:accounts`)).toBeNull();
    });

    it('switching users shows no data from the previous user', () => {
      const userA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
      const userB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
      // User A
      CentraDB.setActiveUser(userA);
      localStorage.setItem(`centra:${userA}:accounts`, JSON.stringify([
        { id: 'acc_A', name: 'User A Secret Vault', balance: 99999, type: 'savings', currency: 'USD' }
      ]));
      CentraDB.setActiveUser(userA);
      expect(CentraDB.getAccounts()[0].name).toBe('User A Secret Vault');

      // Switch to User B (brand new)
      CentraDB.setActiveUser(userB);
      expect(CentraDB.getAccounts()).toHaveLength(0);
      expect(CentraDB.getTransactions()).toHaveLength(0);
    });
  });

  describe('Rehydration Purity', () => {
    it('rehydration triggers no storage writes', async () => {
      const uid = '88888888-8888-4888-8888-888888888888';
      CentraDB.setActiveUser(uid);

      const notifySpy = vi.fn();
      const unsub = CentraDB.onDataChanged(notifySpy);

      // Spy on localStorage.setItem
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockClear();

      // Trigger data change notification
      CentraDB.notifyDataChanged();
      expect(notifySpy).toHaveBeenCalledTimes(1);

      // Subscribing consumer calls getters:
      const a = CentraDB.getAccounts();
      const t = CentraDB.getTransactions();
      const c = CentraDB.getCategories();
      const s = CentraDB.getSettings();
      expect(a).toBeDefined();
      expect(t).toBeDefined();
      expect(c).toBeDefined();
      expect(s).toBeDefined();

      // Must NOT have written to localStorage during rehydration reads
      expect(setItemSpy).not.toHaveBeenCalled();

      setItemSpy.mockRestore();
      unsub();
    });
  });
});
