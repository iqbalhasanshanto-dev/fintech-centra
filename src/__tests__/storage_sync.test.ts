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
        userId: 'user_123',
        entity: 'transactions',
        op: 'upsert',
        recordId: 'tx_1',
        payload: { id: 'tx_1', amount: 50 },
      });

      expect(item1.id).toBeDefined();
      expect(OutboxQueue.count('user_123')).toBe(1);

      const pending = OutboxQueue.getPending('user_123');
      expect(pending).toHaveLength(1);
      expect(pending[0].recordId).toBe('tx_1');
      expect(pending[0].payload.amount).toBe(50);
    });

    it('coalesces duplicate updates for the same entity and recordId', () => {
      OutboxQueue.enqueue({
        userId: 'user_123',
        entity: 'transactions',
        op: 'upsert',
        recordId: 'tx_1',
        payload: { id: 'tx_1', amount: 50 },
      });

      OutboxQueue.enqueue({
        userId: 'user_123',
        entity: 'transactions',
        op: 'upsert',
        recordId: 'tx_1',
        payload: { id: 'tx_1', amount: 75 },
      });

      const pending = OutboxQueue.getPending('user_123');
      expect(pending).toHaveLength(1);
      expect(pending[0].payload.amount).toBe(75);
    });

    it('removes item from outbox by item ID', () => {
      const item = OutboxQueue.enqueue({
        userId: 'user_123',
        entity: 'accounts',
        op: 'delete',
        recordId: 'acc_1',
      });

      expect(OutboxQueue.count('user_123')).toBe(1);
      OutboxQueue.remove('user_123', item.id);
      expect(OutboxQueue.count('user_123')).toBe(0);
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
      CentraDB.setActiveUser('real_user_456');
      const userTxs = CentraDB.getTransactions();
      // Real user starts with an empty list, NOT demo or guest data
      expect(userTxs).toHaveLength(0);

      // Verify guest data is kept under guest namespace and real user namespace is separate
      expect(localStorage.getItem('centra:guest:transactions')).not.toBeNull();
      expect(JSON.parse(localStorage.getItem('centra:guest:transactions')!)).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'tx_guest_p1' })])
      );
      expect(localStorage.getItem('centra:real_user_456:transactions')).toBeNull();

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

      expect(localStorage.getItem('centra:real_user_456:transactions')).not.toBeNull();
      expect(JSON.parse(localStorage.getItem('centra:real_user_456:transactions')!)).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'tx_real_p1' })])
      );
    });
  });

  describe('Safe Remote Sync & Error Handling', () => {
    it('preserves local records if remote fetch returns an error (no destructive wipe)', async () => {
      CentraDB.setActiveUser('user_real_999');

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
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'user_real_999', name: 'Test User' },
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
                  data: { user_id: 'user_real_999', base_currency: 'USD' },
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
      await CentraDB.syncFromSupabase('user_real_999');

      // Invariant: Local transactions must NOT be wiped
      const localTxs = CentraDB.getTransactions();
      expect(localTxs).toHaveLength(1);
      expect(localTxs[0].id).toBe('tx_offline_local');
      expect(localTxs[0].amount).toBe(1500);
    });
  });

  describe('Per-Record Delete Scoping', () => {
    it('executes .delete().eq("id", id) when deleting a transaction for real user', async () => {
      CentraDB.setActiveUser('user_real_888');

      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({
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

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });

      await CentraDB.deleteAllUserData('user_real_888');

      expect(supabase.from).toHaveBeenCalledWith('transactions');
      expect(supabase.from).toHaveBeenCalledWith('accounts');
      expect(supabase.from).toHaveBeenCalledWith('categories');
      expect(supabase.from).toHaveBeenCalledWith('budgets');
      expect(supabase.from).toHaveBeenCalledWith('goals');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user_real_888');

      // Cache should be completely empty
      expect(CentraDB.getTransactions()).toHaveLength(0);
      expect(CentraDB.getAccounts()).toHaveLength(0);
    });
  });
});
