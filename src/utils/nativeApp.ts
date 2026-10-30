import { App as CapApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network, ConnectionStatus } from '@capacitor/network';
import { isNative } from './platform';
import { CentraDB, isGuestUser, getActiveUserId, setSyncStatus } from '../db/storage';
import { logger } from './logger';

export interface NativeAppHandlers {
  onUrlOpen?: (url: string) => void;
  onAppStateChange?: (isActive: boolean) => void;
  onBackButton?: () => void;
  onNetworkStatusChange?: (status: ConnectionStatus) => void;
}

let isInitialized = false;
let activeListenerHandles: PluginListenerHandle[] = [];
let currentHandlers: NativeAppHandlers | undefined = undefined;
let lastNativeSyncTrigger = 0;
const NATIVE_SYNC_THROTTLE_MS = 2000;

export const _resetNativeSyncThrottleForTesting = (): void => {
  lastNativeSyncTrigger = 0;
};

/**
 * Triggers outbox processing and remote sync on native reconnect or resume.
 * Protected against duplicate rapid calls and guest accounts.
 */
export const triggerNativeSync = async (): Promise<void> => {
  const now = Date.now();
  if (now - lastNativeSyncTrigger < NATIVE_SYNC_THROTTLE_MS) {
    return;
  }
  lastNativeSyncTrigger = now;

  const activeUid = CentraDB.getUser()?.id || getActiveUserId();
  if (!activeUid || isGuestUser(activeUid)) {
    return;
  }

  try {
    await CentraDB.processOutbox();
    await CentraDB.syncFromSupabase(activeUid);
  } catch (err) {
    logger.warn('Native background/network sync failed:', err);
  }
};

/**
 * Hides the splash screen once the initial React render is complete.
 */
export const hideSplashScreen = async (): Promise<void> => {
  if (!isNative()) return;
  try {
    await SplashScreen.hide({ fadeOutDuration: 250 });
  } catch {
    // Splash screen may not be active or supported
  }
};

/**
 * Sets the status bar style to match the active theme.
 * Note:
 * - Style.Dark = Light content/icons (for dark background)
 * - Style.Light = Dark content/icons (for light background)
 */
export const updateNativeStatusBar = async (isDark: boolean): Promise<void> => {
  if (!isNative()) return;
  try {
    await StatusBar.setStyle({
      style: isDark ? Style.Dark : Style.Light,
    });
    await StatusBar.setBackgroundColor({
      color: isDark ? '#0A0E1A' : '#FAFAFA',
    });
  } catch {
    // Status bar may not be available or may be edge-to-edge on newer Android versions
  }
};

/**
 * Cleanly unregisters all active native event listeners.
 */
export const cleanupNativeApp = async (): Promise<void> => {
  if (!isNative()) return;
  for (const handle of activeListenerHandles) {
    try {
      await handle.remove();
    } catch {
      // Ignore cleanup error
    }
  }
  activeListenerHandles = [];
  isInitialized = false;
  currentHandlers = undefined;
};

/**
 * Initializes native mobile listeners and splash screen.
 * Idempotent: safe against double-mounts (React StrictMode).
 */
export const initNativeApp = async (handlers?: NativeAppHandlers): Promise<() => Promise<void>> => {
  if (!isNative()) {
    return async () => {};
  }

  if (handlers) {
    currentHandlers = handlers;
  }

  if (isInitialized) {
    return cleanupNativeApp;
  }
  isInitialized = true;

  try {
    // 1. Hide the splash screen after initial render
    await hideSplashScreen();

    // 2. Set status bar based on initial theme class
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    await updateNativeStatusBar(isDark);

    // 3. Register deep link URL open listener
    const urlHandle = await CapApp.addListener('appUrlOpen', data => {
      if (data?.url && currentHandlers?.onUrlOpen) {
        currentHandlers.onUrlOpen(data.url);
      }
    });
    activeListenerHandles.push(urlHandle);

    // 4. Register app background / resume state listener
    const stateHandle = await CapApp.addListener('appStateChange', state => {
      if (state.isActive) {
        triggerNativeSync();
      }
      if (currentHandlers?.onAppStateChange) {
        currentHandlers.onAppStateChange(state.isActive);
      }
    });
    activeListenerHandles.push(stateHandle);

    // 5. Register hardware back button listener (Android)
    const backHandle = await CapApp.addListener('backButton', () => {
      if (currentHandlers?.onBackButton) {
        currentHandlers.onBackButton();
      }
    });
    activeListenerHandles.push(backHandle);

    // 6. Register network connection status listener
    const networkHandle = await Network.addListener('networkStatusChange', status => {
      if (currentHandlers?.onNetworkStatusChange) {
        currentHandlers.onNetworkStatusChange(status);
      }
      if (status.connected) {
        triggerNativeSync();
      } else {
        setSyncStatus('offline');
      }
    });
    activeListenerHandles.push(networkHandle);

    // 7. Check for cold-start launch URL (when app was opened directly from a deep link)
    const launchUrl = await CapApp.getLaunchUrl();
    if (launchUrl?.url && currentHandlers?.onUrlOpen) {
      currentHandlers.onUrlOpen(launchUrl.url);
    }
  } catch (err) {
    logger.warn('Native Capacitor initialization error:', err);
  }

  return cleanupNativeApp;
};
