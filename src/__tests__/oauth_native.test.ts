import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  handleNativeDeepLink,
  startNativeOAuth,
  _resetProcessedCodes,
  _resetOAuthState,
  isValidAuthCallbackUrl,
  INTENT_STORAGE_KEY,
  OAUTH_GRACE_PERIOD_MS,
  OAUTH_SAFETY_TIMEOUT_MS,
} from '../utils/nativeOAuth';
import { supabase } from '../lib/supabaseClient';
import { Browser } from '@capacitor/browser';
import * as platform from '../utils/platform';

let browserFinishedCallback: (() => void) | null = null;

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      exchangeCodeForSession: vi.fn(),
    },
  },
  isSupabaseConfigured: vi.fn().mockReturnValue(true),
}));

vi.mock('@capacitor/browser', () => ({
  Browser: {
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    addListener: vi.fn().mockImplementation((event: string, callback: () => void) => {
      if (event === 'browserFinished') {
        browserFinishedCallback = callback;
      }
      return Promise.resolve({
        remove: vi.fn().mockResolvedValue(undefined),
      });
    }),
  },
}));

vi.mock('../utils/platform', () => ({
  isNative: vi.fn(),
  isTauri: vi.fn(),
  getNativePlatform: vi.fn(),
}));

describe('Native OAuth and Deep Link (src/utils/nativeOAuth.ts)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    browserFinishedCallback = null;
    await _resetOAuthState();
    localStorage.clear();
  });

  afterEach(async () => {
    await _resetOAuthState();
    vi.useRealTimers();
  });

  describe('Deep Link URL Validation', () => {
    it('validates correct scheme, host, and path (com.centra.app://auth/callback)', () => {
      expect(isValidAuthCallbackUrl('com.centra.app://auth/callback?code=xyz')).toBe(true);
      expect(isValidAuthCallbackUrl('com.centra.app://auth/callback')).toBe(true);
      expect(isValidAuthCallbackUrl('com.centra.app://auth/callback/')).toBe(true);
    });

    it('rejects invalid scheme, host, or path', () => {
      expect(isValidAuthCallbackUrl('https://centra.app/auth/callback')).toBe(false);
      expect(isValidAuthCallbackUrl('com.centra.app://other/callback')).toBe(false);
      expect(isValidAuthCallbackUrl('com.centra.app://auth/other')).toBe(false);
      expect(isValidAuthCallbackUrl('evil.app://auth/callback')).toBe(false);
      expect(isValidAuthCallbackUrl('')).toBe(false);
    });

    it('ignores unrelated deep links without calling exchangeCodeForSession', async () => {
      const handled = await handleNativeDeepLink('com.centra.app://other/path?foo=bar');
      expect(handled).toBe(false);
      expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    });
  });

  describe('Successful Code Exchange & Duplicate Guard', () => {
    it('processes valid code from appUrlOpen and calls exchangeCodeForSession once', async () => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValueOnce({
        data: {
          session: {
            user: { id: 'user_123', email: 'test@example.com' },
            access_token: 'fake_access_token',
          },
        } as any,
        error: null,
      });

      const onSuccess = vi.fn();
      const onResetLoading = vi.fn();
      const handled = await handleNativeDeepLink('com.centra.app://auth/callback?code=valid_pkce_code', {
        onSuccess,
        onResetLoading,
      });

      expect(handled).toBe(true);
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('valid_pkce_code');
      expect(Browser.close).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
      expect(onResetLoading).toHaveBeenCalled();
    });

    it('ignores duplicate appUrlOpen events with the same code', async () => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValueOnce({
        data: { session: { user: { id: 'user_123' } } } as any,
        error: null,
      });

      const onSuccess = vi.fn();

      // First call
      await handleNativeDeepLink('com.centra.app://auth/callback?code=duplicate_code', { onSuccess });
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);

      // Second call with identical code
      await handleNativeDeepLink('com.centra.app://auth/callback?code=duplicate_code', { onSuccess });
      // Still only 1 call
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
    });

    it('handles code exchange failure gracefully with error message and reset', async () => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValueOnce({
        data: { session: null } as any,
        error: { message: 'Invalid or expired code', name: 'AuthApiError', status: 400 },
      });

      const onError = vi.fn();
      const onResetLoading = vi.fn();

      await handleNativeDeepLink('com.centra.app://auth/callback?code=bad_code', {
        onError,
        onResetLoading,
      });

      expect(onError).toHaveBeenCalledWith('Google sign-in failed, please try again');
      expect(onResetLoading).toHaveBeenCalled();
    });
  });

  describe('Error Parameters Handling', () => {
    it('handles error URL parameters and resets loading with user-friendly message', async () => {
      const onError = vi.fn();
      const onResetLoading = vi.fn();

      const handled = await handleNativeDeepLink(
        'com.centra.app://auth/callback?error=access_denied&error_description=User+cancelled',
        { onError, onResetLoading }
      );

      expect(handled).toBe(true);
      expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith('Sign-in cancelled');
      expect(onResetLoading).toHaveBeenCalled();
      expect(Browser.close).toHaveBeenCalled();
    });
  });

  describe('Cancellation, Grace Period, and Safety Timeout', () => {
    it('cancels and resets after grace period when browserFinished fires with no deep link', async () => {
      vi.useFakeTimers();
      vi.mocked(platform.isNative).mockReturnValue(true);
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
        data: { url: 'https://accounts.google.com/auth', provider: 'google' },
        error: null,
      });

      const onCancel = vi.fn();
      const onResetLoading = vi.fn();

      await startNativeOAuth('google', 'signin', { onCancel, onResetLoading });
      expect(browserFinishedCallback).toBeDefined();

      // User closes the browser
      browserFinishedCallback!();

      // Grace period has NOT expired yet (e.g. 500ms)
      vi.advanceTimersByTime(500);
      expect(onCancel).not.toHaveBeenCalled();
      expect(onResetLoading).not.toHaveBeenCalled();

      // Now advance past grace period (1800ms total)
      vi.advanceTimersByTime(OAUTH_GRACE_PERIOD_MS);
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onResetLoading).toHaveBeenCalledTimes(1);
    });

    it('a deep link arriving DURING the grace period wins and signs in (not shown as cancelled)', async () => {
      vi.useFakeTimers();
      vi.mocked(platform.isNative).mockReturnValue(true);
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
        data: { url: 'https://accounts.google.com/auth', provider: 'google' },
        error: null,
      });

      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValueOnce({
        data: { session: { user: { id: 'u1' } } } as any,
        error: null,
      });

      const onCancel = vi.fn();
      const onSuccess = vi.fn();
      const onResetLoading = vi.fn();

      await startNativeOAuth('google', 'signin', { onCancel, onSuccess, onResetLoading });

      // User closed the browser, browserFinished fires
      browserFinishedCallback!();

      // Deep link arrives 400ms into grace period
      vi.advanceTimersByTime(400);

      await handleNativeDeepLink('com.centra.app://auth/callback?code=fast_code', {
        onSuccess,
        onCancel,
        onResetLoading,
      });

      // Deep link won!
      expect(onSuccess).toHaveBeenCalledTimes(1);

      // Now advance past the grace period duration to confirm cancel never fires
      vi.advanceTimersByTime(OAUTH_GRACE_PERIOD_MS * 2);
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('hard safety timeout (2 minutes) cancels and resets loading if nothing arrives', async () => {
      vi.useFakeTimers();
      vi.mocked(platform.isNative).mockReturnValue(true);
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
        data: { url: 'https://accounts.google.com/auth', provider: 'google' },
        error: null,
      });

      const onError = vi.fn();
      const onResetLoading = vi.fn();

      await startNativeOAuth('google', 'signin', { onError, onResetLoading });

      // Advance by 1 minute: still waiting
      vi.advanceTimersByTime(60000);
      expect(onError).not.toHaveBeenCalled();

      // Advance to 2 minutes
      vi.advanceTimersByTime(OAUTH_SAFETY_TIMEOUT_MS);
      expect(onError).toHaveBeenCalledWith('Google sign-in timed out. Please try again.');
      expect(onResetLoading).toHaveBeenCalled();
    });
  });
});
