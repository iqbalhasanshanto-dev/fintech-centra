import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNativeMobile = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const initializeNativeApp = (handlers?: {
  onUrlOpen?: (url: string) => void;
  onAppStateChange?: (isActive: boolean) => void;
  onBackButton?: () => void;
}) => {
  if (!isNativeMobile()) return;

  try {
    // Hide splash screen
    SplashScreen.hide().catch(() => {});

    // Deep link listener (OAuth redirects)
    CapApp.addListener('appUrlOpen', data => {
      if (data?.url && handlers?.onUrlOpen) {
        handlers.onUrlOpen(data.url);
      }
    });

    // App state listener (background / resume)
    CapApp.addListener('appStateChange', state => {
      if (handlers?.onAppStateChange) {
        handlers.onAppStateChange(state.isActive);
      }
    });

    // Hardware back button
    CapApp.addListener('backButton', () => {
      if (handlers?.onBackButton) {
        handlers.onBackButton();
      }
    });
  } catch (err) {
    console.warn('Native Capacitor initialization error:', err);
  }
};

export const updateNativeStatusBar = async (isDark: boolean) => {
  if (!isNativeMobile()) return;
  try {
    await StatusBar.setStyle({
      style: isDark ? Style.Dark : Style.Light,
    });
    await StatusBar.setBackgroundColor({
      color: isDark ? '#0A0E1A' : '#FAFAFA',
    });
  } catch (err) {
    // Status bar may not be supported on some platforms
  }
};

export const checkBiometricsAvailable = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  // WebAuthn platform authenticator check
  if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  return false;
};
