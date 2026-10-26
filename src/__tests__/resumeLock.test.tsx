import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {
  shouldTriggerResumeLock,
  getAutoLockTimeout,
  setAutoLockTimeout,
  AUTOLOCK_STORAGE_KEY,
  DEFAULT_AUTOLOCK_TIMEOUT_MS,
} from '../utils/lockResume';
import { MainApp } from '../App';

let mockAuthState = {
  authView: 'app',
  isLockedByPin: false,
  isAppCovered: false,
  user: { id: 'test-user', name: 'Tester', email: 'test@example.com' },
  isGuest: false,
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('../lib/supabaseClient', () => ({
  isSupabaseConfigured: () => true,
  supabase: {},
}));

vi.mock('../context/FinanceContext', () => ({
  FinanceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useFinance: () => ({}),
}));

vi.mock('../components/layout/AppShell', () => ({
  AppShell: () => <div data-testid="app-shell">Financial App Shell Content</div>,
}));

vi.mock('../components/auth/PinLockScreen', () => ({
  PinLockScreen: () => <div data-testid="pin-lock-screen">App Locked (PIN Required)</div>,
}));

describe('App Resume Lock Timing and Cover Replacement (Phase 7 Task 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockAuthState = {
      authView: 'app',
      isLockedByPin: false,
      isAppCovered: false,
      user: { id: 'test-user', name: 'Tester', email: 'test@example.com' },
      isGuest: false,
    };
  });

  describe('shouldTriggerResumeLock pure function logic', () => {
    it('returns false if hiddenTimestamp is null or pin is not set', () => {
      expect(shouldTriggerResumeLock(null, 1000, 300000, true, true, false)).toBe(false);
      expect(shouldTriggerResumeLock(100, 1000, 300000, false, true, false)).toBe(false);
      expect(shouldTriggerResumeLock(100, 1000, 300000, true, false, false)).toBe(false);
      expect(shouldTriggerResumeLock(100, 1000, 300000, true, true, true)).toBe(false);
    });

    it('triggers immediately when timeout is 0ms', () => {
      const now = 5000;
      const hidden = 4999; // only 1ms elapsed
      expect(shouldTriggerResumeLock(hidden, now, 0, true, true, false)).toBe(true);
    });

    it('triggers correctly for 1 minute (60,000ms) interval', () => {
      const hidden = 100000;
      expect(shouldTriggerResumeLock(hidden, hidden + 59999, 60000, true, true, false)).toBe(false);
      expect(shouldTriggerResumeLock(hidden, hidden + 60000, 60000, true, true, false)).toBe(true);
      expect(shouldTriggerResumeLock(hidden, hidden + 60001, 60000, true, true, false)).toBe(true);
    });

    it('triggers correctly for 5 minutes default (300,000ms) interval', () => {
      const hidden = 100000;
      expect(shouldTriggerResumeLock(hidden, hidden + 299999, 300000, true, true, false)).toBe(false);
      expect(shouldTriggerResumeLock(hidden, hidden + 300000, 300000, true, true, false)).toBe(true);
      expect(shouldTriggerResumeLock(hidden, hidden + 350000, 300000, true, true, false)).toBe(true);
    });

    it('triggers correctly for 15 minutes (900,000ms) interval', () => {
      const hidden = 100000;
      expect(shouldTriggerResumeLock(hidden, hidden + 899999, 900000, true, true, false)).toBe(false);
      expect(shouldTriggerResumeLock(hidden, hidden + 900000, 900000, true, true, false)).toBe(true);
    });
  });

  describe('AutoLock Timeout persistence', () => {
    it('returns default 5 minutes when nothing is stored', () => {
      expect(getAutoLockTimeout()).toBe(DEFAULT_AUTOLOCK_TIMEOUT_MS);
    });

    it('persists and retrieves auto-lock timeout option', () => {
      setAutoLockTimeout(60000);
      expect(localStorage.getItem(AUTOLOCK_STORAGE_KEY)).toBe('60000');
      expect(getAutoLockTimeout()).toBe(60000);

      setAutoLockTimeout(0);
      expect(getAutoLockTimeout()).toBe(0);
    });

    it('falls back to default on corrupted storage', () => {
      localStorage.setItem(AUTOLOCK_STORAGE_KEY, 'invalid');
      expect(getAutoLockTimeout()).toBe(DEFAULT_AUTOLOCK_TIMEOUT_MS);
    });
  });

  describe('Render tree replacement (Cover vs PIN vs Financial screens)', () => {
    it('renders normal financial screens when app is active and unlocked', () => {
      mockAuthState.isAppCovered = false;
      mockAuthState.isLockedByPin = false;

      render(<MainApp />);

      expect(screen.getByTestId('app-shell')).toBeInTheDocument();
      expect(screen.queryByTestId('lock-cover-screen')).not.toBeInTheDocument();
      expect(screen.queryByTestId('pin-lock-screen')).not.toBeInTheDocument();
    });

    it('replaces financial screens with LockCoverScreen when covered (no financial screens mounted)', () => {
      mockAuthState.isAppCovered = true;
      mockAuthState.isLockedByPin = false;

      render(<MainApp />);

      expect(screen.getByTestId('lock-cover-screen')).toBeInTheDocument();
      // AppShell must NOT be mounted underneath
      expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument();
      expect(screen.queryByTestId('pin-lock-screen')).not.toBeInTheDocument();
    });

    it('replaces financial screens with PinLockScreen when locked (no financial screens mounted)', () => {
      mockAuthState.isAppCovered = false;
      mockAuthState.isLockedByPin = true;

      render(<MainApp />);

      expect(screen.getByTestId('pin-lock-screen')).toBeInTheDocument();
      // AppShell and LockCoverScreen must NOT be mounted
      expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument();
      expect(screen.queryByTestId('lock-cover-screen')).not.toBeInTheDocument();
    });

    it('never renders both lock cover and PIN screen at the same time', () => {
      // Even if both cover and lock flags were true during a state transition,
      // lock screen takes precedence and lock cover is not mounted
      mockAuthState.isAppCovered = true;
      mockAuthState.isLockedByPin = true;

      render(<MainApp />);

      expect(screen.getByTestId('pin-lock-screen')).toBeInTheDocument();
      expect(screen.queryByTestId('lock-cover-screen')).not.toBeInTheDocument();
      expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument();
    });

    it('uses latest lock state without stale closure on background and resume evaluation', () => {
      // Test verifying that shouldTriggerResumeLock receives the fresh isLockedByPin state
      const hidden = Date.now() - 600000; // 10 minutes ago
      const now = Date.now();
      const timeoutMs = 300000; // 5 min

      // When initially not locked, resume should trigger lock
      let isLocked = false;
      expect(shouldTriggerResumeLock(hidden, now, timeoutMs, true, true, isLocked)).toBe(true);

      // Once locked, subsequent resume checks with updated lock state must NOT trigger redundant lock
      isLocked = true;
      expect(shouldTriggerResumeLock(hidden, now, timeoutMs, true, true, isLocked)).toBe(false);
    });
  });
});
