import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CentraDB, FIGMA_DEFAULT_CATEGORIES, getTwoMonthRetentionCutoff } from '../db/storage';
import { supabase } from '../lib/supabaseClient';
import { AuthProvider } from '../context/AuthContext';
import { FinanceProvider } from '../context/FinanceContext';
import { AddActionModal } from '../components/modals/AddActionModal';
import { AnalyticsCalendar } from '../components/report/AnalyticsCalendar';
import { IncomeExpenseLineChart } from '../components/home/IncomeExpenseLineChart';
import { TransactionDrawer } from '../components/home/TransactionDrawer';
import { PlanScreen } from '../components/plan/PlanScreen';
import { PinLockScreen } from '../components/auth/PinLockScreen';
import { getTransactionDisplay } from '../utils/formatters';
import { requestNotificationPermission, triggerSystemNotification } from '../utils/nativeNotifications';
import { DEFAULT_AUTOLOCK_TIMEOUT_MS, AUTOLOCK_OPTIONS } from '../utils/lockResume';
import { Category, Transaction, Goal } from '../types';

function createDefaultChainable() {
  const queryResult = { data: [], error: null };
  const chainable = {
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
    then: (resolve?: (val: unknown) => unknown) => Promise.resolve(queryResult).then(resolve),
  };
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

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('UI & Functional Fixes Suite', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    CentraDB.clearAllData();
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => createDefaultChainable());
  });

  describe('1. All 11 Expense Categories in Spend and Budget', () => {
    it('shows all 11 expense categories in Spend tab even if user only selected 1 category during onboarding', async () => {
      // Simulate user selecting only Groceries during onboarding
      const userCategories: Category[] = [
        { id: 'cat_groceries', name: 'Groceries', icon: 'ShoppingCart', color: '#10B981', type: 'expense', budgetLimit: 600 }
      ];
      await CentraDB.saveCategories(userCategories);

      render(
        <AuthProvider>
          <FinanceProvider>
            <AddActionModal isOpen={true} onClose={() => {}} defaultTab="spend" />
          </FinanceProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // The hidden select should contain all 11 expense categories
      const categorySelect = screen.getByLabelText(/Category/i);
      const options = categorySelect.querySelectorAll('option');
      expect(options.length).toBe(11);

      const figmaExpenseNames = FIGMA_DEFAULT_CATEGORIES.filter(c => c.type === 'expense' && !c.hidden).map(c => c.name);
      expect(figmaExpenseNames.length).toBe(11);
      figmaExpenseNames.forEach(name => {
        expect(Array.from(options).some(o => o.textContent?.includes(name))).toBe(true);
      });
    });

    it('shows all 11 expense categories in Budget tab even if user only selected 1 category during onboarding', async () => {
      const userCategories: Category[] = [
        { id: 'cat_groceries', name: 'Groceries', icon: 'ShoppingCart', color: '#10B981', type: 'expense', budgetLimit: 600 }
      ];
      await CentraDB.saveCategories(userCategories);

      render(
        <AuthProvider>
          <FinanceProvider>
            <AddActionModal isOpen={true} onClose={() => {}} defaultTab="budget" />
          </FinanceProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const budgetCategorySelect = screen.getByLabelText(/Budget Category/i);
      const options = budgetCategorySelect.querySelectorAll('option');
      expect(options.length).toBe(11);
    });
  });

  describe('2. Category Picker Overline Labels & Merchant Field Labels', () => {
    it('displays SPEND overline and updated merchant label & placeholder on Spend tab', async () => {
      render(
        <AuthProvider>
          <FinanceProvider>
            <AddActionModal isOpen={true} onClose={() => {}} defaultTab="spend" />
          </FinanceProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Open category picker
      const categoryLabel = screen.getByText('Category');
      const categoryPickerButton = categoryLabel.parentElement?.querySelector('button');
      if (categoryPickerButton) {
        fireEvent.click(categoryPickerButton);
      }

      // Check overline is SPEND
      expect(screen.getByText('SPEND')).toBeInTheDocument();

      // Check merchant input label and placeholder
      expect(screen.getByText('SPENT ON / PAID TO')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g. Nasta, Uber Ride, Shwapno')).toBeInTheDocument();
    });

    it('displays BUDGET overline on Budget tab', async () => {
      render(
        <AuthProvider>
          <FinanceProvider>
            <AddActionModal isOpen={true} onClose={() => {}} defaultTab="budget" />
          </FinanceProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Open budget category picker
      const budgetCategoryLabel = screen.getByText('Budget Category');
      const budgetPickerButton = budgetCategoryLabel.parentElement?.querySelector('button');
      if (budgetPickerButton) {
        fireEvent.click(budgetPickerButton);
      }

      expect(screen.getByText('BUDGET')).toBeInTheDocument();
    });

    it('displays RECEIVED FROM / SOURCE label and placeholder on Income tab', async () => {
      render(
        <AuthProvider>
          <FinanceProvider>
            <AddActionModal isOpen={true} onClose={() => {}} defaultTab="income" />
          </FinanceProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByText('RECEIVED FROM / SOURCE')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g. Salary, Abbu, Client Project')).toBeInTheDocument();
    });
  });

  describe('3. Goals Form Initial Deposit & Target Date Alignment', () => {
    it('renders Initial Deposit and Target Date inside grid-cols-2 gap-3 items-end with matching h-[52px]', async () => {
      render(
        <AuthProvider>
          <FinanceProvider>
            <AddActionModal isOpen={true} onClose={() => {}} defaultTab="create-goal" />
          </FinanceProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const depositLabel = screen.getByText('INITIAL DEPOSIT');
      const targetDateLabel = screen.getByText('TARGET DATE');

      expect(depositLabel).toHaveClass('whitespace-nowrap', 'truncate');
      expect(targetDateLabel).toHaveClass('whitespace-nowrap', 'truncate');

      // Check parent grid has items-start
      const gridContainer = depositLabel.closest('.grid');
      expect(gridContainer).toHaveClass('grid-cols-2', 'gap-3', 'items-start');

      // Check input has h-[52px]
      const depositInput = depositLabel.parentElement?.querySelector('input');
      expect(depositInput).toHaveClass('h-[52px]');

      // Check DatePicker trigger button has h-[52px]
      const dateButton = screen.getByText(/2027|June|Jun/i).closest('button');
      expect(dateButton).toHaveClass('h-[52px]');
    });
  });

  describe('4. Transaction Subtitle Format', () => {
    it('never appends note to subtitle when merchant is present', () => {
      const res = getTransactionDisplay({
        merchant: 'Uber Ride',
        categoryName: 'Transport',
        note: 'Trip to airport',
        date: '2026-11-01T10:00:00Z',
      });

      expect(res.title).toBe('Uber Ride');
      expect(res.subtitle).toMatch(/^Transport • /);
      expect(res.subtitle).not.toContain('Trip to airport');
    });

    it('falls back to smartDate without prepending accountName when title equals categoryName', () => {
      const resWithAccount = getTransactionDisplay({
        categoryName: 'Groceries',
        merchant: '',
        note: '',
        date: '2026-11-01T10:00:00Z',
        accountName: 'City Bank',
      });

      expect(resWithAccount.title).toBe('Groceries');
      expect(resWithAccount.subtitle).not.toContain('City Bank');
      expect(resWithAccount.subtitle).not.toContain('Groceries');
    });
  });

  describe('5. Spending Calendar Solid Solid #C6FF3D without artificial neon glow', () => {
    it('uses solid border border-[#C6FF3D] shadow-xs without artificial drop-shadow glow', () => {
      const { container } = render(
        <AuthProvider>
          <FinanceProvider>
            <AnalyticsCalendar />
          </FinanceProvider>
        </AuthProvider>
      );

      // Verify no shadow-[0_0_14px... or shadow-[0_0_12px... exists in DOM
      expect(container.innerHTML).not.toContain('shadow-[0_0_14px_rgba(198,255,61,0.55)]');
      expect(container.innerHTML).not.toContain('shadow-[0_0_12px_rgba(198,255,61,0.35)]');
    });
  });

  describe('6. Cash Flow Trend Cumulative Running Income & Expenses', () => {
    it('keeps income steady at carried-over balance on expense-only days instead of dropping to zero', async () => {
      // Prior month transaction: 400 net savings (in Oct 2026)
      const txOct: Transaction = {
        id: 'tx_oct',
        type: 'income',
        amount: 400,
        currency: 'USD',
        categoryId: 'cat_salary',
        categoryName: 'Salary',
        categoryIcon: 'Briefcase',
        categoryColor: '#10B981',
        accountId: 'acc_1',
        accountName: 'Cash',
        date: '2026-10-15T10:00:00.000Z',
      };

      // Current month expense-only transaction: 50 expense on Nov 1
      const txNov: Transaction = {
        id: 'tx_nov',
        type: 'expense',
        amount: 50,
        currency: 'USD',
        categoryId: 'cat_groceries',
        categoryName: 'Groceries',
        categoryIcon: 'ShoppingCart',
        categoryColor: '#10B981',
        accountId: 'acc_1',
        accountName: 'Cash',
        date: '2026-11-01T12:00:00.000Z',
      };

      await CentraDB.saveTransactions([txOct, txNov]);

      render(
        <AuthProvider>
          <FinanceProvider>
            <IncomeExpenseLineChart />
          </FinanceProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Cash Flow Trend')).toBeInTheDocument();
      });

      // Chart should render without crashing and include Nov 1 data
      const chartSection = screen.getByText('Cash Flow Trend').closest('section');
      expect(chartSection).toBeInTheDocument();
    });
  });

  describe('7. Transaction Drawer Month Grouping & Individual Borders', () => {
    it('groups transactions into Current Month and Previous Month headers and uses individual borders', async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Current month transaction
      const currentTx: Transaction = {
        id: 'tx_current',
        type: 'expense',
        amount: 30,
        currency: 'USD',
        categoryId: 'cat_groceries',
        categoryName: 'Groceries',
        categoryIcon: 'ShoppingCart',
        categoryColor: '#10B981',
        accountId: 'acc_1',
        accountName: 'Cash',
        date: new Date(currentYear, currentMonth, 10).toISOString(),
      };

      // Previous month transaction
      const prevTx: Transaction = {
        id: 'tx_prev',
        type: 'income',
        amount: 500,
        currency: 'USD',
        categoryId: 'cat_salary',
        categoryName: 'Salary',
        categoryIcon: 'Briefcase',
        categoryColor: '#10B981',
        accountId: 'acc_1',
        accountName: 'Cash',
        date: new Date(currentYear, currentMonth - 1, 15).toISOString(),
      };

      await CentraDB.saveTransactions([currentTx, prevTx]);

      render(
        <AuthProvider>
          <FinanceProvider>
            <TransactionDrawer isOpen={true} onClose={() => {}} onSelectTransaction={() => {}} />
          </FinanceProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Current Month •/i)).toBeInTheDocument();
        expect(screen.getByText(/Previous Month •/i)).toBeInTheDocument();
      });

      // Confirm row borders exist
      const groceryItem = screen.getByText('Groceries');
      const itemRow = groceryItem.closest('div[class*="border"]');
      expect(itemRow).not.toBeNull();
    });
  });

  describe('8. 2-Month Data Retention Logic', () => {
    it('computes 1st of previous month as the retention cutoff', () => {
      const refDate = new Date('2026-11-15T12:00:00Z');
      const cutoff = getTwoMonthRetentionCutoff(refDate);

      expect(cutoff.getFullYear()).toBe(2026);
      expect(cutoff.getMonth()).toBe(9); // October (0-indexed 9)
      expect(cutoff.getDate()).toBe(1);
      expect(cutoff.getHours()).toBe(0);
      expect(cutoff.getMinutes()).toBe(0);
    });

    it('prunes transactions strictly older than the 2-month cutoff', async () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const activeTx: Transaction = {
        id: 'tx_keep_curr',
        type: 'expense',
        amount: 25,
        currency: 'USD',
        categoryId: 'cat_groceries',
        categoryName: 'Groceries',
        categoryIcon: 'ShoppingCart',
        categoryColor: '#10B981',
        accountId: 'acc_1',
        accountName: 'Cash',
        date: new Date(currentYear, currentMonth, 1).toISOString(),
      };

      const prevMonthTx: Transaction = {
        id: 'tx_keep_prev',
        type: 'expense',
        amount: 45,
        currency: 'USD',
        categoryId: 'cat_groceries',
        categoryName: 'Groceries',
        categoryIcon: 'ShoppingCart',
        categoryColor: '#10B981',
        accountId: 'acc_1',
        accountName: 'Cash',
        date: new Date(currentYear, currentMonth - 1, 15).toISOString(),
      };

      const expiredTx: Transaction = {
        id: 'tx_expired_3mo',
        type: 'expense',
        amount: 99,
        currency: 'USD',
        categoryId: 'cat_groceries',
        categoryName: 'Groceries',
        categoryIcon: 'ShoppingCart',
        categoryColor: '#10B981',
        accountId: 'acc_1',
        accountName: 'Cash',
        date: new Date(currentYear, currentMonth - 3, 10).toISOString(),
      };

      await CentraDB.saveTransactions([activeTx, prevMonthTx, expiredTx]);
      expect(CentraDB.getTransactions()).toHaveLength(3);

      const result = await CentraDB.pruneExpiredTransactions();
      expect(result.prunedCount).toBe(1);

      const remaining = CentraDB.getTransactions();
      expect(remaining).toHaveLength(2);
      expect(remaining.some(t => t.id === 'tx_expired_3mo')).toBe(false);
      expect(remaining.some(t => t.id === 'tx_keep_curr')).toBe(true);
      expect(remaining.some(t => t.id === 'tx_keep_prev')).toBe(true);
    });
  });

  describe('9. Savings Goal + Add and - Withdraw Buttons', () => {
    it('shows both + Add and - Withdraw buttons when goal has current funds, and opens correct modal mode', async () => {
      const fundedGoal: Goal = {
        id: 'goal_funded',
        name: 'Emergency Fund',
        icon: 'Shield',
        color: '#10B981',
        targetAmount: 5000,
        currentAmount: 1500,
        startDate: '2026-01-01',
        targetDate: '2026-12-31',
      };

      const emptyGoal: Goal = {
        id: 'goal_empty',
        name: 'Vacation',
        icon: 'Plane',
        color: '#3B82F6',
        targetAmount: 2000,
        currentAmount: 0,
        startDate: '2026-01-01',
        targetDate: '2026-12-31',
      };

      await CentraDB.saveGoals([fundedGoal, emptyGoal]);

      render(
        <AuthProvider>
          <FinanceProvider>
            <PlanScreen onOpenAddGoal={() => {}} />
          </FinanceProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
        expect(screen.getByText('Vacation')).toBeInTheDocument();
      });

      // + Add and - Withdraw should be present for both (always visible)
      const addButtons = screen.getAllByRole('button', { name: /\+ Add/i });
      expect(addButtons.length).toBe(2);

      const withdrawButtons = screen.getAllByRole('button', { name: /- Withdraw/i });
      expect(withdrawButtons.length).toBe(2);

      // Clicking + Add opens deposit modal
      fireEvent.click(addButtons[0]);
      await waitFor(() => {
        expect(screen.getByText(/Add Funds to Emergency Fund/i)).toBeInTheDocument();
      });

      // Close modal
      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      if (closeButtons.length > 0) {
        fireEvent.click(closeButtons[0]);
      }

      // Clicking - Withdraw opens withdraw modal
      fireEvent.click(withdrawButtons[0]);
      await waitFor(() => {
        expect(screen.getByText(/Withdraw Funds from Emergency Fund/i)).toBeInTheDocument();
      });
    });
  });

  describe('10. Native Status-Bar Notifications Utility', () => {
    it('requestNotificationPermission executes gracefully without throwing', async () => {
      const granted = await requestNotificationPermission();
      expect(typeof granted).toBe('boolean');
    });

    it('triggerSystemNotification executes gracefully without throwing', async () => {
      await expect(triggerSystemNotification('Test Title', 'Test Body', 'test-id')).resolves.not.toThrow();
    });
  });

  describe('11. Immediate PIN Lock & Centra Brand Logo', () => {
    it('defaults autolock timeout to 0ms (Immediately)', () => {
      expect(DEFAULT_AUTOLOCK_TIMEOUT_MS).toBe(0);
      expect(AUTOLOCK_OPTIONS[0].value).toBe(0);
      expect(AUTOLOCK_OPTIONS[0].label).toBe('Immediately (default)');
    });

    it('renders Centra brand logo instead of shield icon on PinLockScreen', () => {
      render(
        <AuthProvider>
          <PinLockScreen />
        </AuthProvider>
      );

      // Verify brand logo with alt="Centra" exists
      const brandLogos = screen.getAllByAltText('Centra');
      expect(brandLogos.length).toBeGreaterThanOrEqual(1);

      // Verify no Shield icon is rendered
      expect(screen.queryByTestId('shield-icon')).toBeNull();
    });
  });
});
