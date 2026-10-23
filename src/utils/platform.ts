import { Capacitor } from '@capacitor/core';

export type NativePlatform = 'android' | 'ios' | 'web';
export type AppPlatform = 'android' | 'ios' | 'desktop' | 'web';

/**
 * Returns true if running as a native mobile app (Capacitor Android or iOS).
 */
export const isNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Returns the native platform name ('android', 'ios', or 'web').
 */
export const getNativePlatform = (): NativePlatform => {
  const platform = Capacitor.getPlatform();
  if (platform === 'android' || platform === 'ios') {
    return platform;
  }
  return 'web';
};

/**
 * Returns true if running inside the Tauri desktop runtime.
 */
export const isTauri = (): boolean => {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
};

/**
 * Returns the overall application platform: 'android', 'ios', 'desktop', or 'web'.
 */
export const getAppPlatform = (): AppPlatform => {
  if (isNative()) {
    const native = getNativePlatform();
    return native === 'android' || native === 'ios' ? native : 'web';
  }
  if (isTauri()) {
    return 'desktop';
  }
  return 'web';
};
