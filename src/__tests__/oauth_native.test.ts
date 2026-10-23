import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleNativeDeepLink, startNativeOAuth, _resetProcessedCodes, INTENT_STORAGE_KEY } from '../utils/nativeOAuth';
import { supabase } from '../lib/supabaseClient';
import { Browser } from '@capacitor/browser';
import * as platform from '../utils/platform';

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
    addListener: vi.fn().mockResolvedValue({
      remove: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('../utils/platform', () => ({
  isNative: vi.fn(),
  isTauri: vi.fn(),
}));

describe('Native OAuth and Deep Link (src/utils/nativeOAuth.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetProcessedCodes();
    localStorage.clear();
  });

  it('ignores unrelated deep links that do not match com.centra.app://auth/callback', async () => {
    const handled = await handleNativeDeepLink('com.centra.app://other/path?foo=bar');
    expect(handled).toBe(false);
    expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

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
    const handled = await handleNativeDeepLink('com.centra.app://auth/callback?code=valid_pkce_code', {
      onSuccess,
    });

    expect(handled).toBe(true);
    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('valid_pkce_code');
    expect(Browser.close).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
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

  it('handles error URL parameters without crashing and resets loading', async () => {
    const onError = vi.fn();
    const onResetLoading = vi.fn();

    const handled = await handleNativeDeepLink(
      'com.centra.app://auth/callback?error=access_denied&error_description=User+cancelled',
      { onError, onResetLoading }
    );

    expect(handled).toBe(true);
    expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('User cancelled');
    expect(onResetLoading).toHaveBeenCalled();
    expect(Browser.close).toHaveBeenCalled();
  });

  it('startNativeOAuth saves intent, calls signInWithOAuth with skipBrowserRedirect, and opens Browser', async () => {
    vi.mocked(platform.isNative).mockReturnValue(true);
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=123', provider: 'google' },
      error: null,
    });

    await startNativeOAuth('google', 'signup');

    // Intent was saved to localStorage BEFORE opening browser
    expect(localStorage.getItem(INTENT_STORAGE_KEY)).toBe('signup');
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'com.centra.app://auth/callback',
        skipBrowserRedirect: true,
      },
    });
    expect(Browser.open).toHaveBeenCalledWith({
      url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=123',
      windowName: '_self',
    });
  });
});
