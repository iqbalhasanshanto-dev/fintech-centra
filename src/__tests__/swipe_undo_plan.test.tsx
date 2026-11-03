import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import {
  saveGoalHistory,
  getGoalHistory,
  removeGoalHistoryEntry,
} from '../utils/goalHistory';
import { GoalHistoryEntry } from '../types';
import { FinanceProvider, useFinance } from '../context/FinanceContext';
import { PlanScreen } from '../components/plan/PlanScreen';
import { SwipeableRow } from '../components/ui/SwipeableRow';
import * as platformModule from '../utils/platform';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test_user_plan_undo', name: 'Tester', email: 'test@example.com' },
    isGuest: false,
    logout: vi.fn(),
  }),
}));

// Mock Supabase
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
      order: vi.fn().mockReturnThis(),
    })),
  },
  isSupabaseConfigured: () => false,
}));

describe('Goal History Entry Removal & Chronological Recalculation', () => {
  const goalId = 'test_goal_recalc';

  beforeEach(() => {
    localStorage.clear();
  });

  it('removes target entry and recalculates balanceAfter chronologically', () => {
    const entries: GoalHistoryEntry[] = [
      {
        id: 'e3',
        goalId,
        type: 'withdraw',
        amount: 200,
        date: '2026-03-01T10:00:00Z',
        balanceAfter: 800,
      },
      {
        id: 'e2',
        goalId,
        type: 'add',
        amount: 500,
        date: '2026-02-01T10:00:00Z',
        balanceAfter: 1000,
      },
      {
        id: 'e1',
        goalId,
        type: 'initial',
        amount: 500,
        date: '2026-01-01T10:00:00Z',
        balanceAfter: 500,
      },
    ];

    saveGoalHistory(goalId, entries);

    // Remove the middle entry (e2: add 500)
    const result = removeGoalHistoryEntry(goalId, 'e2');
    expect(result.removed?.id).toBe('e2');
    expect(result.updatedHistory.length).toBe(2);

    // Recalculated balance:
    // e1 (initial 500) -> balanceAfter = 500
    // e3 (withdraw 200) -> balanceAfter = 300
    const e3 = result.updatedHistory.find(e => e.id === 'e3');
    const e1 = result.updatedHistory.find(e => e.id === 'e1');

    expect(e1?.balanceAfter).toBe(500);
    expect(e3?.balanceAfter).toBe(300);

    // Persisted in storage
    const stored = getGoalHistory(goalId);
    expect(stored.length).toBe(2);
    expect(stored.find(e => e.id === 'e3')?.balanceAfter).toBe(300);
  });
});

describe('FinanceContext: 5-Second Undo for Goal History & Budgets', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  const TestConsumer: React.FC = () => {
    const {
      goals,
      budgets,
      addGoal,
      deleteGoal,
      addBudget,
      deleteBudget,
      deleteGoalHistoryEntry,
      pendingUndo,
      undoLastDelete,
    } = useFinance();

    const targetGoal = goals.find(g => g.name === 'Vacation Test Goal');

    return (
      <div>
        <button
          onClick={() =>
            addGoal({
              name: 'Vacation Test Goal',
              targetAmount: 1000,
              currentAmount: 300,
              targetDate: '2026-12-31',
              startDate: '2026-01-01',
              icon: 'Plane',
              color: '#3B82F6',
              isCompleted: false,
            })
          }
        >
          Add Test Goal
        </button>

        <button
          onClick={() =>
            addBudget({
              categoryId: 'cat_food_test',
              categoryName: 'Dining Test',
              categoryIcon: 'Utensils',
              categoryColor: '#F59E0B',
              limitAmount: 500,
              spentAmount: 0,
              alertThreshold: 80,
              period: 'monthly',
            })
          }
        >
          Add Test Budget
        </button>

        <div data-testid="goals-count">{goals.length}</div>
        <div data-testid="budgets-count">{budgets.length}</div>
        {targetGoal && (
          <div data-testid="target-goal-amount">{targetGoal.currentAmount}</div>
        )}

        {targetGoal?.history?.[0] && (
          <button
            onClick={() =>
              deleteGoalHistoryEntry(targetGoal.id, targetGoal.history![0].id)
            }
          >
            Delete Goal History Entry
          </button>
        )}

        {budgets.find(b => b.categoryName === 'Dining Test') && (
          <button
            onClick={() =>
              deleteBudget(budgets.find(b => b.categoryName === 'Dining Test')!.id)
            }
          >
            Delete Test Budget
          </button>
        )}

        {targetGoal && (
          <button onClick={() => deleteGoal(targetGoal.id)}>
            Delete Target Goal
          </button>
        )}

        {pendingUndo && (
          <div data-testid="undo-bar">
            <span>{pendingUndo.label}</span>
            <button onClick={undoLastDelete}>Undo</button>
          </div>
        )}
      </div>
    );
  };

  it('deletes a budget with 5-second undo and restores on undo click', async () => {
    render(
      <FinanceProvider userId="test_user_plan_undo">
        <TestConsumer />
      </FinanceProvider>
    );

    const initialBudgetsCount = parseInt(screen.getByTestId('budgets-count').textContent || '0', 10);

    // Add budget
    fireEvent.click(screen.getByText('Add Test Budget'));
    expect(screen.getByTestId('budgets-count').textContent).toBe(String(initialBudgetsCount + 1));

    // Delete budget
    fireEvent.click(screen.getByText('Delete Test Budget'));
    expect(screen.getByTestId('budgets-count').textContent).toBe(String(initialBudgetsCount));
    expect(screen.getByTestId('undo-bar')).toBeDefined();
    expect(screen.getByText('Budget deleted')).toBeDefined();

    // Click Undo
    await act(async () => {
      fireEvent.click(screen.getByText('Undo'));
    });

    expect(screen.getByTestId('budgets-count').textContent).toBe(String(initialBudgetsCount + 1));
    expect(screen.queryByTestId('undo-bar')).toBeNull();
  });

  it('deletes goal history entry with balance reversal and restores on undo', async () => {
    render(
      <FinanceProvider userId="test_user_plan_undo">
        <TestConsumer />
      </FinanceProvider>
    );

    // Add goal with 300 initial deposit
    fireEvent.click(screen.getByText('Add Test Goal'));
    expect(screen.getByTestId('target-goal-amount').textContent).toBe('300');

    // Delete initial deposit entry
    await act(async () => {
      fireEvent.click(screen.getByText('Delete Goal History Entry'));
    });

    // Reversed balance: 300 - 300 = 0
    expect(screen.getByTestId('target-goal-amount').textContent).toBe('0');
    expect(screen.getByText('Goal entry deleted')).toBeDefined();

    // Click Undo
    await act(async () => {
      fireEvent.click(screen.getByText('Undo'));
    });

    // Restored balance: 300
    expect(screen.getByTestId('target-goal-amount').textContent).toBe('300');
    expect(screen.queryByTestId('undo-bar')).toBeNull();
  });
});

describe('PlanScreen & SwipeableRow Integration', () => {
  it('renders PlanScreen with Goal cards, Budget cards, and inline delete buttons on Web', () => {
    const { container } = render(
      <FinanceProvider userId="test_user_plan_undo">
        <PlanScreen onOpenAddGoal={vi.fn()} />
      </FinanceProvider>
    );

    expect(container).toBeDefined();
    expect(screen.getByText('Milestone savings goals')).toBeDefined();
    expect(screen.getByText('Category Budgets')).toBeDefined();

    // Check that delete budget buttons are present on Web
    const deleteBudgetBtns = screen.queryAllByRole('button', { name: 'Delete budget' });
    expect(deleteBudgetBtns.length).toBeGreaterThan(0);
  });

  it('SwipeableRow renders clean children without rubber-band on Web and supports touch swipe on native', () => {
    const onDelete = vi.fn();
    const { rerender } = render(
      <SwipeableRow onDelete={onDelete} deleteLabel="Delete">
        <div>Swipeable Goal Row Content</div>
      </SwipeableRow>
    );

    // On Web (!isNative), renders clean static container
    expect(screen.getByText('Swipeable Goal Row Content')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();

    // On Native (isNative() === true), touch swipe reveals delete button
    vi.spyOn(platformModule, 'isNative').mockReturnValue(true);
    rerender(
      <SwipeableRow onDelete={onDelete} deleteLabel="Delete">
        <div>Swipeable Goal Row Content</div>
      </SwipeableRow>
    );

    const rowContent = screen.getByText('Swipeable Goal Row Content');
    fireEvent.touchStart(rowContent, { touches: [{ clientX: 200, clientY: 50 }] });
    fireEvent.touchMove(rowContent, { touches: [{ clientX: 140, clientY: 50 }] });
    fireEvent.touchEnd(rowContent);

    const deleteBtn = screen.getByRole('button', { name: 'Delete' });
    expect(deleteBtn).toBeInTheDocument();
  });
});
