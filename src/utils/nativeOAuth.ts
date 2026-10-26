import { Browser } from '@capacitor/browser';
import type { PluginListenerHandle } from '@capacitor/core';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { getAuthRedirectUrl } from './authRedirect';
import { isNative } from './platform';
import { AuthMode } from '../context/AuthContext';

export const INTENT_STORAGE_KEY = 'centra_auth_intent';
export const OAUTH_GRACE_PERIOD_MS = 1800; // 1.5 - 2.0s grace period for deep link arrival after browserFinished
export const OAUTH_SAFETY_TIMEOUT_MS = 120000; // 2 minutes safety timeout

// Track codes that have already been processed to guard against duplicate appUrlOpen events
const processedCodes = new Set<string>();

interface OAuthCallbacks {
  onSuccess?: (session: Session) => Promise<void> | void;
  onError?: (errorMsg: string) => void;
  onCancel?: () => void;
  onResetLoading?: () => void;
}

let activeCallbacks: OAuthCallbacks | null = null;
let browserFinishedListener: PluginListenerHandle | null = null;
let graceTimeoutId: ReturnType<typeof setTimeout> | null = null;
let safetyTimeoutId: ReturnType<typeof setTimeout> | null = null;

const clearTimers = (): void => {
  if (graceTimeoutId) {
    clearTimeout(graceTimeoutId);
    graceTimeoutId = null;
  }
  if (safetyTimeoutId) {
    clearTimeout(safetyTimeoutId);
    safetyTimeoutId = null;
  }
};

const cleanupListener = async (): Promise<void> => {
  if (browserFinishedListener) {
    try {
      await browserFinishedListener.remove();
    } catch {
      // Ignore cleanup error
    }
    browserFinishedListener = null;
  }
};

/**
 * Validates that an incoming deep link URL matches scheme com.centra.app, host auth, path /callback.
 * Never logs raw URL or token.
 */
export const isValidAuthCallbackUrl = (rawUrl: string): boolean => {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    if (!rawUrl.startsWith('com.centra.app://auth/callback')) return false;
    const url = new URL(rawUrl.replace('com.centra.app://', 'https://'));
    return url.hostname === 'auth' && (url.pathname === '/callback' || url.pathname === '/callback/');
  } catch {
    const [schemePart, rest] = rawUrl.split('://');
    if (schemePart !== 'com.centra.app' || !rest) return false;
    const [hostAndPath] = rest.split('?');
    return hostAndPath === 'auth/callback' || hostAndPath === 'auth/callback/';
  }
};

/**
 * Handles incoming native deep links (com.centra.app://auth/callback)
 */
export const handleNativeDeepLink = async (
  rawUrl: string,
  callbacks?: OAuthCallbacks
): Promise<boolean> => {
  if (!isValidAuthCallbackUrl(rawUrl)) {
    // Ignore unrelated deep links
    return false;
  }

  // A valid deep link arrived — immediately clear the grace timer and safety timeout
  clearTimers();
  await cleanupListener();

  const cb: OAuthCallbacks = {
    ...activeCallbacks,
    ...callbacks,
  };

  try {
    const normalizedUrl = rawUrl.replace('com.centra.app://', 'https://');
    const urlObj = new URL(normalizedUrl);
    const searchParams = urlObj.searchParams;

    // Check for error parameters (e.g. user cancelled Google consent or access denied)
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    if (error || errorDescription) {
      localStorage.removeItem(INTENT_STORAGE_KEY);
      await Browser.close().catch(() => {});
      const isCancelled = error === 'access_denied' || (errorDescription && /cancel/i.test(errorDescription));
      const msg = isCancelled
        ? 'Sign-in cancelled'
        : 'Google sign-in failed, please try again';
      cb.onError?.(msg);
      cb.onResetLoading?.();
      activeCallbacks = null;
      return true;
    }

    // Extract authorization code
    const code = searchParams.get('code');
    if (!code) {
      localStorage.removeItem(INTENT_STORAGE_KEY);
      await Browser.close().catch(() => {});
      cb.onError?.('Google sign-in failed, please try again');
      cb.onResetLoading?.();
      activeCallbacks = null;
      return true;
    }

    // Guard against duplicate code execution
    if (processedCodes.has(code)) {
      return true;
    }
    processedCodes.add(code);

    // Attempt to close system browser (Chrome Custom Tab / SFSafariViewController)
    await Browser.close().catch(() => {});

    // Exchange the PKCE code for a session exactly once
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      localStorage.removeItem(INTENT_STORAGE_KEY);
      cb.onError?.('Google sign-in failed, please try again');
      cb.onResetLoading?.();
      activeCallbacks = null;
      return true;
    }

    if (data?.session) {
      localStorage.removeItem(INTENT_STORAGE_KEY);
      if (cb.onSuccess) {
        await cb.onSuccess(data.session);
      }
      cb.onResetLoading?.();
      activeCallbacks = null;
      return true;
    }

    cb.onResetLoading?.();
    activeCallbacks = null;
    return true;
  } catch {
    localStorage.removeItem(INTENT_STORAGE_KEY);
    cb.onError?.('Google sign-in failed, please try again');
    cb.onResetLoading?.();
    activeCallbacks = null;
    return true;
  }
};

/**
 * Initiates native OAuth using @capacitor/browser and Chrome Custom Tabs / SFSafariViewController.
 */
export const startNativeOAuth = async (
  provider: 'google' | 'apple',
  mode: AuthMode = 'signin',
  options?: OAuthCallbacks
): Promise<void> => {
  if (!isNative()) {
    throw new Error('startNativeOAuth called on non-native platform');
  }

  // 1. Clear previous attempt and timers cleanly
  clearTimers();
  await cleanupListener();

  activeCallbacks = options || null;

  // 2. Store intent in localStorage BEFORE launching system browser
  localStorage.setItem(INTENT_STORAGE_KEY, mode);

  // 3. Request OAuth URL with skipBrowserRedirect: true
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getAuthRedirectUrl(),
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    localStorage.removeItem(INTENT_STORAGE_KEY);
    activeCallbacks = null;
    throw error || new Error('Failed to retrieve authentication URL.');
  }

  // 4. Set hard safety timeout (2 minutes)
  safetyTimeoutId = setTimeout(() => {
    clearTimers();
    localStorage.removeItem(INTENT_STORAGE_KEY);
    const cb = activeCallbacks;
    activeCallbacks = null;
    if (cb) {
      cb.onError?.(`${provider === 'apple' ? 'Apple' : 'Google'} sign-in timed out. Please try again.`);
      cb.onResetLoading?.();
    }
    cleanupListener();
    Browser.close().catch(() => {});
  }, OAUTH_SAFETY_TIMEOUT_MS);

  // 5. Listen for user closing the browser before callback
  browserFinishedListener = await Browser.addListener('browserFinished', () => {
    // Do NOT cancel immediately: wait for grace period in case deep link arrives slightly after
    if (graceTimeoutId) clearTimeout(graceTimeoutId);
    graceTimeoutId = setTimeout(() => {
      clearTimers();
      localStorage.removeItem(INTENT_STORAGE_KEY);
      const cb = activeCallbacks;
      activeCallbacks = null;
      if (cb) {
        cb.onCancel?.();
        cb.onResetLoading?.();
      }
      cleanupListener();
    }, OAUTH_GRACE_PERIOD_MS);
  });

  // 6. Open the system browser (Chrome Custom Tabs on Android / SFSafariViewController on iOS)
  await Browser.open({
    url: data.url,
    windowName: '_self',
  });
};

/**
 * Resets processed codes cache and internal state (useful for tests and cleanup)
 */
export const _resetProcessedCodes = (): void => {
  processedCodes.clear();
};

export const _resetOAuthState = async (): Promise<void> => {
  clearTimers();
  await cleanupListener();
  activeCallbacks = null;
  processedCodes.clear();
};
