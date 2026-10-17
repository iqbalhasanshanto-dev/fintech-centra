import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CentraDB, SYSTEM_CATEGORIES_DEFINITIONS, DEFAULT_INCOME_CATEGORIES_DEFINITIONS } from '../db/storage';
import { OutboxQueue } from '../db/outbox';
import { supabase } from '../lib/supabaseClient';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { FinanceProvider, useFinance } from '../context/FinanceContext';
import { AddActionModal } from '../components/modals/AddActionModal';
import { FirstAccountScreen } from '../components/onboarding/FirstAccountScreen';
import { GuestBanner } from '../components/layout/GuestBanner';
import { Category, Account } from '../types';

function createDefaultChainable() {
  const queryResult = { data: [], error: null };
  const chainable: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(queryResult),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  };
  chainable.then = (resolve: any) => Promise.resolve(queryResult).then(resolve);
  return chainable;
}

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

describe('Phase 6 — Guest vs Real Account UI, System Categories & Control Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    CentraDB.clearAllData();
    (supabase.from as any).mockImplementation(() => createDefaultChainable());
  });

  it('1. Income tab lists Salary, Freelance, and Investment income categories and excludes hidden system categories', async () => {
    // Setup test categories
    const testCategories: Category[] = [
      { id: 'cat_sal', name: 'Salary & Wages', icon: 'Briefcase', color: '#1FAE71', type: 'income', hidden: false },
      { id: 'cat_free', name: 'Freelance & Bonus', icon: 'TrendingUp', color: '#00B894', type: 'income', hidden: false },
      { id: 'cat_inv', name: 'Dividends & Yield', icon: 'Coins', color: '#55EFC4', type: 'income', hidden: false },
      { id: 'cat_gro', name: 'Groceries', icon: 'ShoppingBag', color: '#FF7675', type: 'expense', hidden: false },
      { id: 'cat_sys_tr', systemKey: 'transfer', name: 'Transfer & Payment', icon: 'ArrowRightLeft', color: '#636E72', type: 'expense', hidden: true },
      { id: 'cat_sys_gc', systemKey: 'goal_contribution', name: 'Goal Contribution', icon: 'Target', color: '#10B981', type: 'expense', hidden: true },
      { id: 'cat_sys_unc', systemKey: 'uncategorized', name: 'Uncategorized', icon: 'HelpCircle', color: '#94A3B8', type: 'expense', hidden: true },
    ];
    const testAccounts: Account[] = [
      {
        id: 'acc_1',
        name: 'Checking Account',
        type: 'checking',
        balance: 1500,
        currency: 'USD',
        accountNumberMasked: '•••• 1234',
        bankName: 'Test Bank',
        color: '#6366F1',
        isPrimary: true,
      },
    ];

    CentraDB.setActiveUser('guest');
    await CentraDB.saveAccounts(testAccounts);
    await CentraDB.saveCategories(testCategories);

    render(
      <FinanceProvider userId="guest">
        <AddActionModal isOpen={true} onClose={() => {}} defaultTab="income" />
      </FinanceProvider>
    );

    // Verify Income tab is active
    expect(screen.getByText('Income')).toBeInTheDocument();

    // Check available category options in the select dropdown
    const select = screen.getByLabelText(/Category/i) as HTMLSelectElement;
    const optionTexts = Array.from(select.options).map(o => o.text);

    // Pickable income categories MUST be listed
    expect(optionTexts).toContain('Salary & Wages');
    expect(optionTexts).toContain('Freelance & Bonus');
    expect(optionTexts).toContain('Dividends & Yield');

    // Expense & hidden system categories MUST NOT be listed in Income tab
    expect(optionTexts).not.toContain('Groceries');
    expect(optionTexts).not.toContain('Transfer & Payment');
    expect(optionTexts).not.toContain('Goal Contribution');
    expect(optionTexts).not.toContain('Uncategorized');
  });

  it('2. Onboarding is idempotent: re-entry with existing accounts does not create duplicate default Cash account', async () => {
    CentraDB.setActiveUser('user_test_onboarding');
    const existingAccount: Account = {
      id: 'acc_existing',
      name: 'Existing Checking',
      type: 'checking',
      balance: 500,
      currency: 'USD',
      accountNumberMasked: '•••• 5555',
      bankName: 'Existing Bank',
      color: '#6366F1',
      isPrimary: true,
    };
    await CentraDB.saveAccounts([existingAccount]);

    let authContextRef: any = null;
    const TestConsumer: React.FC = () => {
      authContextRef = useAuth();
      return <div>Ready</div>;
    };

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Run completeOnboarding
    await act(async () => {
      await authContextRef.completeOnboarding();
    });

    const accountsAfter = CentraDB.getAccounts();
    // Must NOT have created a second default Cash account!
    expect(accountsAfter.length).toBe(1);
    expect(accountsAfter[0].id).toBe('acc_existing');
  });

  it('3. Onboarding idempotency: categories double-submit and category deduplication', async () => {
    CentraDB.setActiveUser('user_cat_dedup');
    let authContextRef: any = null;
    const TestConsumer: React.FC = () => {
      authContextRef = useAuth();
      return <div>Ready</div>;
    };

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Call saveOnboardingProfile with 'Shopping' and 'Groceries'
    await act(async () => {
      await authContextRef.saveOnboardingProfile({
        name: 'Alex Doe',
        currency: 'USD',
        categories: ['Shopping', 'Groceries'],
      });
    });

    const firstRunCategories = CentraDB.getCategories();
    const shoppingCount1 = firstRunCategories.filter(c => c.name.toLowerCase() === 'shopping').length;
    expect(shoppingCount1).toBe(1);

    // Re-run saveOnboardingProfile with the same categories
    await act(async () => {
      await authContextRef.saveOnboardingProfile({
        name: 'Alex Doe',
        currency: 'USD',
        categories: ['Shopping', 'Groceries'],
      });
    });

    const secondRunCategories = CentraDB.getCategories();
    const shoppingCount2 = secondRunCategories.filter(c => c.name.toLowerCase() === 'shopping').length;
    // Must not have duplicated 'Shopping'
    expect(shoppingCount2).toBe(1);

    // System categories must exist and never be duplicated
    const transferCount = secondRunCategories.filter(c => c.systemKey === 'transfer').length;
    expect(transferCount).toBe(1);

    // Double-submit of completeOnboarding must be safe
    await act(async () => {
      const p1 = authContextRef.completeOnboarding();
      const p2 = authContextRef.completeOnboarding();
      await Promise.all([p1, p2]);
    });

    const accounts = CentraDB.getAccounts();
    expect(accounts.length).toBe(1); // Default cash created exactly once
  });

  it('4. ensureSystemCategories persists as a group and re-reads on (user_id, system_key) unique violation', async () => {
    const userId = 'user_unique_violation_test';
    CentraDB.setActiveUser(userId);

    // Mock remote Supabase returning 23505 unique violation on upsert
    const existingRemoteTransferCategory = {
      id: 'cat_remote_transfer_123',
      user_id: userId,
      system_key: 'transfer',
      name: 'Transfer & Payment',
      icon: 'ArrowRightLeft',
      color: '#636E72',
      type: 'expense',
      budget_limit: null,
      updated_at: new Date().toISOString(),
    };

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'categories') {
        return {
          upsert: vi.fn().mockResolvedValue({
            error: {
              code: '23505',
              message: 'duplicate key value violates unique constraint "uq_categories_user_system_key"',
            },
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [existingRemoteTransferCategory],
                error: null,
              }),
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: existingRemoteTransferCategory,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return createDefaultChainable();
    });

    // Run ensureSystemCategories
    const cats = await CentraDB.ensureSystemCategories(userId);

    // Verify it used the existing remote category id without failing
    const transferCat = cats.find(c => c.systemKey === 'transfer');
    expect(transferCat).toBeDefined();
    expect(transferCat?.id).toBe('cat_remote_transfer_123');
  });

  it('5. FirstAccountScreen gates on base currency and sanitizes opening balance', async () => {
    const mockOnBack = vi.fn();
    const mockOnContinue = vi.fn();
    const mockOnSkip = vi.fn();

    // 1. Gating check: render when user has NO base currency
    CentraDB.setActiveUser('user_no_base');
    CentraDB.saveUser({
      id: 'user_no_base',
      name: 'No Base User',
      email: 'test@example.com',
      baseCurrency: '' as any,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
    });

    const { unmount } = render(
      <AuthProvider>
        <FirstAccountScreen onBack={mockOnBack} onContinue={mockOnContinue} onSkip={mockOnSkip} />
      </AuthProvider>
    );

    expect(screen.getByText(/Base Currency Required/i)).toBeInTheDocument();
    unmount();

    // 2. Render when base currency IS configured
    CentraDB.setActiveUser('user_base_set');
    CentraDB.saveUser({
      id: 'user_base_set',
      name: 'Test User',
      email: 'test@example.com',
      baseCurrency: 'USD',
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
    });

    render(
      <AuthProvider>
        <FirstAccountScreen onBack={mockOnBack} onContinue={mockOnContinue} onSkip={mockOnSkip} />
      </AuthProvider>
    );

    // Now renders the account creation form
    expect(screen.getByText('Set up your first account')).toBeInTheDocument();

    // Fill opening balance with commas and formatting from Phase 5
    const balanceInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(balanceInput, { target: { value: '2,500.75' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Continue/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(mockOnContinue).toHaveBeenCalled();
    const accounts = CentraDB.getAccounts();
    expect(accounts.length).toBe(1);
    expect(accounts[0].balance).toBe(2500.75); // Sanitized float correctly
    expect(accounts[0].currency).toBe('USD');
  });

  it('6. Empty state in AddActionModal: accounts empty prompts Add Account, and Transfer never defaults to same account', async () => {
    CentraDB.setActiveUser('guest');
    await CentraDB.saveAccounts([]); // 0 accounts

    const { unmount } = render(
      <FinanceProvider userId="guest">
        <AddActionModal isOpen={true} onClose={() => {}} defaultTab="spend" />
      </FinanceProvider>
    );

    // Spend tab shows empty state for accounts
    expect(screen.getByText('No accounts connected yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add an Account' })).toBeInTheDocument();

    // Switch to Transfer tab
    const transferTabBtn = screen.getByRole('button', { name: 'Transfer' });
    fireEvent.click(transferTabBtn);

    // Transfer shows requirement for at least 2 accounts
    expect(screen.getByText('Transfer requires at least 2 accounts')).toBeInTheDocument();

    unmount();

    // Now add 2 accounts and verify fromAccountId !== toAccountId
    const acc1: Account = {
      id: 'acc_source',
      name: 'Source Account',
      type: 'checking',
      balance: 1000,
      currency: 'USD',
      accountNumberMasked: '•••• 1111',
      bankName: 'Bank A',
      color: '#6366F1',
    };
    const acc2: Account = {
      id: 'acc_dest',
      name: 'Dest Account',
      type: 'savings',
      balance: 500,
      currency: 'USD',
      accountNumberMasked: '•••• 2222',
      bankName: 'Bank B',
      color: '#10B981',
    };

    await CentraDB.saveAccounts([acc1, acc2]);

    render(
      <FinanceProvider userId="guest">
        <AddActionModal isOpen={true} onClose={() => {}} defaultTab="transfer" />
      </FinanceProvider>
    );

    // In transfer form, check selects
    const fromSelect = screen.getByLabelText(/From Source Account/i) as HTMLSelectElement;
    const toSelect = screen.getByLabelText(/To Destination Account/i) as HTMLSelectElement;

    expect(fromSelect.value).not.toBe(toSelect.value);
    expect(fromSelect.value).toBe('acc_source');
    expect(toSelect.value).toBe('acc_dest');
  });

  it('7. When "Create account" is chosen from guest mode: signs out, clears guest namespace, starts signup flow', async () => {
    localStorage.setItem('centra:guest:custom_data', 'test_data');
    localStorage.setItem('centra_is_guest_v2', 'true');
    CentraDB.setActiveUser('guest');

    let authContextRef: any = null;
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

    // Click "Create account to enable cloud sync." in GuestBanner
    const createBtn = screen.getByRole('button', { name: /Create account to enable cloud sync/i });
    await act(async () => {
      fireEvent.click(createBtn);
    });

    // Verify guest namespace was cleared
    expect(localStorage.getItem('centra:guest:custom_data')).toBeNull();
    expect(localStorage.getItem('centra_is_guest_v2')).toBeNull();

    // Verify authMode switched to 'signup' and view switched to 'signedOut'
    expect(authContextRef.authMode).toBe('signup');
    expect(authContextRef.authView).toBe('signedOut');
    expect(authContextRef.isGuest).toBe(false);
  });
});
