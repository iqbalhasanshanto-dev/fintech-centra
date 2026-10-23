import { App as CapApp, PluginListenerHandle } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNative } from './platform';

export interface NativeAppHandlers {
  onUrlOpen?: (url: string) => void;
  onAppStateChange?: (isActive: boolean) => void;
  onBackButton?: () => void;
}

let isInitialized = false;
let activeListenerHandles: PluginListenerHandle[] = [];

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
};

/**
 * Initializes native mobile listeners and splash screen.
 * Idempotent: safe against double-mounts (React StrictMode).
 */
export const initNativeApp = async (handlers?: NativeAppHandlers): Promise<() => Promise<void>> => {
  if (!isNative()) {
    return async () => {};
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
      if (data?.url && handlers?.onUrlOpen) {
        handlers.onUrlOpen(data.url);
      }
    });
    activeListenerHandles.push(urlHandle);

    // 4. Register app background / resume state listener
    const stateHandle = await CapApp.addListener('appStateChange', state => {
      if (handlers?.onAppStateChange) {
        handlers.onAppStateChange(state.isActive);
      }
    });
    activeListenerHandles.push(stateHandle);

    // 5. Register hardware back button listener (Android)
    const backHandle = await CapApp.addListener('backButton', () => {
      if (handlers?.onBackButton) {
        handlers.onBackButton();
      }
    });
    activeListenerHandles.push(backHandle);

    // 6. Check for cold-start launch URL (when app was opened directly from a deep link)
    const launchUrl = await CapApp.getLaunchUrl();
    if (launchUrl?.url && handlers?.onUrlOpen) {
      handlers.onUrlOpen(launchUrl.url);
    }
  } catch (err) {
    console.warn('Native Capacitor initialization error:', err);
  }

  return cleanupNativeApp;
};
