import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CentraDB } from '../db/storage';
import { AuthProvider } from '../context/AuthContext';
import { FinanceProvider } from '../context/FinanceContext';
import { Switch } from '../components/ui/Switch';
import { SwipeableRow } from '../components/ui/SwipeableRow';
import { BottomNav } from '../components/layout/BottomNav';
import { Header } from '../components/layout/Header';
import { PinLockScreen } from '../components/auth/PinLockScreen';
import { OtpScreen } from '../components/auth/OtpScreen';
import { PlanScreen } from '../components/plan/PlanScreen';
import { AddActionModal } from '../components/modals/AddActionModal';
import { Goal } from '../types';

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('Centra v4.0.0 UI Motion & Micro-Interaction System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    CentraDB.clearAllData();
  });

  describe('1. Spring Stretch & Overshoot Toggle Switches', () => {
    it('applies spring-switch-thumb class to thumb element and group to button', () => {
      const handleChange = vi.fn();
      render(<Switch checked={false} onChange={handleChange} label="Test switch" />);

      const button = screen.getByRole('switch');
      expect(button).toHaveClass('group');

      const thumb = button.querySelector('.spring-switch-thumb');
      expect(thumb).not.toBeNull();
      expect(thumb).toHaveClass('translate-x-0');
    });

    it('toggles translate position with spring-switch-thumb when checked', () => {
      const handleChange = vi.fn();
      const { rerender } = render(<Switch checked={false} onChange={handleChange} label="Test switch" />);

      let button = screen.getByRole('switch');
      expect(button.querySelector('.spring-switch-thumb')).toHaveClass('translate-x-0');

      rerender(<Switch checked={true} onChange={handleChange} label="Test switch" />);
      button = screen.getByRole('switch');
      expect(button.querySelector('.spring-switch-thumb')).toHaveClass('translate-x-5');
    });
  });

  describe('2. Elastic Pop + Radial Burst Tap Feedback', () => {
    it('renders pop-tap animation on Confirm button in AddActionModal', async () => {
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

      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '25' } });

      const confirmBtn = screen.getByRole('button', { name: /confirm/i });
      expect(confirmBtn).toBeInTheDocument();

      fireEvent.click(confirmBtn);
      // Confirm button triggers pop tap feedback class on click
      expect(confirmBtn.className).toMatch(/animate-pop-tap/);
    });
  });

  describe('3. Spatial Origin Menu Expansion', () => {
    it('applies origin-bottom-right-spring to Quick Action menu and rotates plus button', () => {
      render(
        <BottomNav
          activeTab="home"
          onSelectTab={() => {}}
          onOpenAddAction={() => {}}
        />
      );

      const plusBtn = screen.getByLabelText(/New Transaction, Transfer or Budget/i);
      expect(plusBtn).toBeInTheDocument();

      // Open quick action menu
      fireEvent.click(plusBtn);

      const menu = screen.getByRole('menu', { name: /Quick Actions/i });
      expect(menu).toHaveClass('origin-bottom-right-spring');

      // The plus button wrapper rotates
      const rotatingIconContainer = plusBtn.querySelector('.rotate-135');
      expect(rotatingIconContainer).not.toBeNull();
    });

    it('applies origin-top-right-spring to Period dropdown in Header', () => {
      render(
        <AuthProvider>
          <FinanceProvider>
            <Header onOpenNotifications={() => {}} onNavigateToSettings={() => {}} />
          </FinanceProvider>
        </AuthProvider>
      );

      const periodBtn = screen.getByLabelText(/Filter by period/i);
      fireEvent.click(periodBtn);

      const dropdown = screen.getByText('Select Period').closest('.origin-top-right-spring');
      expect(dropdown).not.toBeNull();
    });
  });

  describe('4. Horizontal Error Shake on Invalid Input / Wrong PIN', () => {
    it('triggers error shake on PinLockScreen when submitting empty or wrong PIN', async () => {
      render(
        <AuthProvider>
          <PinLockScreen />
        </AuthProvider>
      );

      const unlockBtn = screen.getByRole('button', { name: /unlock/i });
      fireEvent.click(unlockBtn);

      await waitFor(() => {
        expect(screen.getByText('Please enter your PIN.')).toBeInTheDocument();
      });

      const inputContainer = screen.getByLabelText(/PIN/i).closest('.animate-error-shake');
      expect(inputContainer).not.toBeNull();
    });

    it('triggers error shake on OtpScreen when incomplete OTP is submitted', async () => {
      render(
        <AuthProvider>
          <OtpScreen />
        </AuthProvider>
      );

      const firstDigit = screen.getByLabelText(/Digit 1 of verification code/i);
      const formEl = firstDigit.closest('form');
      if (formEl) {
        fireEvent.submit(formEl);
      }

      await waitFor(() => {
        expect(screen.getByText(/Please enter the complete 6-digit code/i)).toBeInTheDocument();
      });

      const errorRow = formEl?.querySelector('.animate-error-shake');
      expect(errorRow).not.toBeNull();
    });
  });

  describe('5. Sliding Active Pill Continuity', () => {
    it('renders a smooth sliding indicator in BottomNav capsule dock', () => {
      const { container } = render(
        <BottomNav
          activeTab="report"
          onSelectTab={() => {}}
          onOpenAddAction={() => {}}
        />
      );

      const slidingPill = container.querySelector('.bg-\\[\\#18212F\\].dark\\:bg-\\[\\#C6FF3D\\]');
      expect(slidingPill).not.toBeNull();
      expect(slidingPill).toHaveClass('transition-transform');
    });

    it('renders a smooth sliding indicator in PlanScreen fund switcher', async () => {
      const goal: Goal = {
        id: 'goal_test',
        name: 'Car Savings',
        icon: 'Car',
        color: '#10B981',
        targetAmount: 5000,
        currentAmount: 1000,
        startDate: '2026-01-01',
        targetDate: '2026-12-31',
      };
      await CentraDB.saveGoals([goal]);

      render(
        <AuthProvider>
          <FinanceProvider>
            <PlanScreen onOpenAddGoal={() => {}} />
          </FinanceProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Car Savings')).toBeInTheDocument();
      });

      const addBtn = screen.getByRole('button', { name: /\+ Add/i });
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(screen.getByText(/Add Funds to Car Savings/i)).toBeInTheDocument();
      });

      const depositTabBtn = screen.getByRole('button', { name: /\+ Add Funds/i });
      const switcherContainer = depositTabBtn.parentElement;
      const slidingPill = switcherContainer?.querySelector('.transition-transform');
      expect(slidingPill).not.toBeNull();
    });
  });

  describe('6. Swipe-Left to Delete Row + Smooth Height Collapse', () => {
    it('reveals delete button on horizontal swipe and triggers smooth collapse before onDelete', async () => {
      vi.useFakeTimers();
      const handleDelete = vi.fn();

      render(
        <SwipeableRow onDelete={handleDelete} deleteLabel="Delete">
          <div data-testid="row-content">Transaction Item</div>
        </SwipeableRow>
      );

      const content = screen.getByTestId('row-content');
      const deleteBtn = screen.getByRole('button', { name: /delete/i });
      expect(deleteBtn).toBeInTheDocument();

      // Tap delete
      fireEvent.click(deleteBtn);

      // Immediately after tap, collapse class should be active
      const wrapper = deleteBtn.closest('.overflow-hidden');
      expect(wrapper).toHaveClass('max-h-0', 'opacity-0');

      // Before timer finishes, onDelete has not run
      expect(handleDelete).not.toHaveBeenCalled();

      // Fast-forward 280ms
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(handleDelete).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });
});
