import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import {
  isNetworkError,
  isNetworkConnected,
  getFriendlyAuthErrorMessage,
  NO_INTERNET_ERROR_MESSAGE,
} from '../utils/networkErrors';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import type { AuthError } from '@supabase/supabase-js';

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
    }),
  },
  isSupabaseConfigured: () => true,
}));

describe('Phase 8 - Task B8: Friendly Network Errors', () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      configurable: true,
      writable: true,
    });
  });

  describe('isNetworkError helper', () => {
    it('detects Failed to fetch, Network request failed, Load failed, and AuthRetryableFetchError', () => {
      expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
      expect(isNetworkError(new Error('Network request failed'))).toBe(true);
      expect(isNetworkError(new Error('Load failed'))).toBe(true);
      expect(isNetworkError({ name: 'AuthRetryableFetchError', message: 'Auth retryable' })).toBe(true);
      expect(isNetworkError({ status: 0, message: 'offline' })).toBe(true);
      expect(isNetworkError('net::ERR_INTERNET_DISCONNECTED')).toBe(true);
    });

    it('returns true when navigator.onLine is false even without explicit network message', () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      expect(isNetworkError(new Error('Any error'))).toBe(true);
    });

    it('returns false for auth validation errors (wrong code, expired code, rate limit)', () => {
      expect(isNetworkError(new Error('Token has expired or is invalid'))).toBe(false);
      expect(isNetworkError(new Error('User not found'))).toBe(false);
      expect(isNetworkError(new Error('For security purposes, you can only request this once every 60 seconds'))).toBe(false);
    });
  });

  describe('getFriendlyAuthErrorMessage helper', () => {
    it('returns friendly message for network failures', () => {
      const err = new TypeError('Failed to fetch');
      expect(getFriendlyAuthErrorMessage(err, 'Default message')).toBe(NO_INTERNET_ERROR_MESSAGE);
    });

    it('preserves specific auth error messages', () => {
      const err = new Error('Token has expired or is invalid');
      expect(getFriendlyAuthErrorMessage(err, 'Default message')).toBe('Token has expired or is invalid');
    });

    it('detects online / offline via isNetworkConnected', async () => {
      expect(await isNetworkConnected()).toBe(true);
      Object.defineProperty(navigator, 'onLine', { value: false });
      expect(await isNetworkConnected()).toBe(false);
    });
  });

  describe('AuthContext email entry and OTP network handling', () => {
    function TestConsumer() {
      const { sendOtp, verifyOtp, signInWithOAuth } = useAuth();
      const [msg, setMsg] = React.useState('');

      return (
        <div>
          <button
            onClick={async () => {
              const res = await sendOtp('test@example.com', 'signin');
              setMsg(res.error || (res.ok ? 'OK' : 'FAIL'));
            }}
          >
            Send OTP
          </button>
          <button
            onClick={async () => {
              const res = await verifyOtp('test@example.com', '123456');
              setMsg(res.error || (res.ok ? 'OK' : 'FAIL'));
            }}
          >
            Verify OTP
          </button>
          <button
            onClick={async () => {
              try {
                await signInWithOAuth('google', 'signin');
              } catch (e: unknown) {
                setMsg(e instanceof Error ? e.message : 'OAuth error');
              }
            }}
          >
            Google Sign In
          </button>
          <div data-testid="msg">{msg}</div>
        </div>
      );
    }

    it('shows friendly message on mocked fetch failure during sendOtp', async () => {
      vi.mocked(supabase.auth.signInWithOtp).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      fireEvent.click(screen.getByText('Send OTP'));

      await waitFor(() => {
        expect(screen.getByTestId('msg').textContent).toBe(NO_INTERNET_ERROR_MESSAGE);
      });
    });

    it('shows friendly message on mocked fetch failure during verifyOtp', async () => {
      vi.mocked(supabase.auth.verifyOtp).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      fireEvent.click(screen.getByText('Verify OTP'));

      await waitFor(() => {
        expect(screen.getByTestId('msg').textContent).toBe(NO_INTERNET_ERROR_MESSAGE);
      });
    });

    it('preserves wrong code error message during verifyOtp', async () => {
      vi.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Token has expired or is invalid', name: 'AuthApiError', status: 400 } as unknown as AuthError,
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      fireEvent.click(screen.getByText('Verify OTP'));

      await waitFor(() => {
        expect(screen.getByTestId('msg').textContent).toBe('Token has expired or is invalid');
      });
    });

    it('blocks request immediately with friendly message when device is offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      fireEvent.click(screen.getByText('Send OTP'));

      await waitFor(() => {
        expect(screen.getByTestId('msg').textContent).toBe(NO_INTERNET_ERROR_MESSAGE);
      });

      // Verify supabase call was not made
      expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled();
    });
  });
});
