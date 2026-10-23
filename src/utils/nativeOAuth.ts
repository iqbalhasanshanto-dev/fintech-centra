import { Browser, PluginListenerHandle } from '@capacitor/browser';
import { supabase } from '../lib/supabaseClient';
import { getAuthRedirectUrl, NATIVE_REDIRECT_SCHEME } from './authRedirect';
import { isNative } from './platform';
import { AuthMode } from '../context/AuthContext';

export const INTENT_STORAGE_KEY = 'centra_auth_intent';

// Track codes that have already been processed to guard against duplicate appUrlOpen events
const processedCodes = new Set<string>();

let browserFinishedListener: PluginListenerHandle | null = null;
let onCancelCallback: (() => void) | null = null;

/**
 * Handles incoming native deep links (com.centra.app://auth/callback)
 */
export const handleNativeDeepLink = async (
  rawUrl: string,
  callbacks?: {
    onSuccess?: (session: any) => Promise<void> | void;
    onError?: (errorMsg: string) => void;
    onResetLoading?: () => void;
  }
): Promise<boolean> => {
  if (!rawUrl || !rawUrl.startsWith('com.centra.app://auth/callback')) {
    // Ignore unrelated deep links
    return false;
  }

  try {
    // Parse the URL
    // Convert custom scheme to a standard URL string for URL/URLSearchParams parsing
    const normalizedUrl = rawUrl.replace('com.centra.app://', 'https://centra.local/');
    const urlObj = new URL(normalizedUrl);
    const searchParams = urlObj.searchParams;

    // Check for error parameters (e.g. user cancelled Google consent)
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    if (error || errorDescription) {
      const msg = errorDescription || error || 'Sign-in was cancelled or failed.';
      callbacks?.onError?.(msg);
      callbacks?.onResetLoading?.();
      localStorage.removeItem(INTENT_STORAGE_KEY);
      await Browser.close().catch(() => {});
      return true;
    }

    // Extract authorization code
    const code = searchParams.get('code');
    if (!code) {
      callbacks?.onError?.('No authorization code returned from provider.');
      callbacks?.onResetLoading?.();
      await Browser.close().catch(() => {});
      return true;
    }

    // Guard against duplicate listener execution
    if (processedCodes.has(code)) {
      return true;
    }
    processedCodes.add(code);

    // Clean up browserFinished listener
    if (browserFinishedListener) {
      await browserFinishedListener.remove().catch(() => {});
      browserFinishedListener = null;
      onCancelCallback = null;
    }

    // Exchange the PKCE code for a session exactly once
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    // Attempt to close system browser (Chrome Custom Tab / SFSafariViewController)
    await Browser.close().catch(() => {});

    if (exchangeError) {
      callbacks?.onError?.(exchangeError.message || 'Failed to exchange authentication code.');
      callbacks?.onResetLoading?.();
      return true;
    }

    if (data?.session) {
      if (callbacks?.onSuccess) {
        await callbacks.onSuccess(data.session);
      }
      return true;
    }

    return true;
  } catch (err: any) {
    callbacks?.onError?.(err?.message || 'Error processing authentication callback.');
    callbacks?.onResetLoading?.();
    return true;
  }
};

/**
 * Initiates native OAuth using @capacitor/browser and Chrome Custom Tabs / SFSafariViewController.
 */
export const startNativeOAuth = async (
  provider: 'google' | 'apple',
  mode: AuthMode = 'signin',
  options?: {
    onCancel?: () => void;
    onError?: (msg: string) => void;
  }
): Promise<void> => {
  if (!isNative()) {
    throw new Error('startNativeOAuth called on non-native platform');
  }

  // 1. Store intent in localStorage BEFORE launching system browser
  localStorage.setItem(INTENT_STORAGE_KEY, mode);

  // 2. Request OAuth URL with skipBrowserRedirect: true
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getAuthRedirectUrl(),
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    localStorage.removeItem(INTENT_STORAGE_KEY);
    throw error || new Error('Failed to retrieve authentication URL.');
  }

  // 3. Listen for user closing the browser before callback
  if (browserFinishedListener) {
    await browserFinishedListener.remove().catch(() => {});
    browserFinishedListener = null;
  }

  onCancelCallback = options?.onCancel || null;
  browserFinishedListener = await Browser.addListener('browserFinished', () => {
    if (onCancelCallback) {
      onCancelCallback();
    }
  });

  // 4. Open the system browser (Chrome Custom Tabs on Android / SFSafariViewController on iOS)
  await Browser.open({
    url: data.url,
    windowName: '_self',
  });
};

/**
 * Resets processed codes cache (useful for testing)
 */
export const _resetProcessedCodes = (): void => {
  processedCodes.clear();
};
