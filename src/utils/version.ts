import versionsData from '../../versions.json';
import { getNativePlatform } from './platform';

export interface PlatformVersions {
  android: string;
  ios: string;
  web: string;
}

export const PLATFORM_VERSIONS: PlatformVersions = {
  android: '4.1.1',
  ios: '1.0.1',
  web: '1.0.0',
};

export const VERSIONS: PlatformVersions = (versionsData || PLATFORM_VERSIONS) as PlatformVersions;

/**
 * Returns true if running as a standalone PWA on iOS (Safari Add-to-Home-Screen).
 */
export const isIosStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as unknown as { standalone?: boolean; userAgent?: string };
  if (nav.standalone === true) return true;
  const isIosDevice = /iPad|iPhone|iPod/.test(nav.userAgent || '') && !(window as unknown as { MSStream?: unknown }).MSStream;
  const isStandaloneMatch = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
  return Boolean(isIosDevice && isStandaloneMatch);
};

/**
 * Returns the current platform version string.
 * Supports URL query parameter overrides (?platform=android | ios | web) for testing on desktop browsers.
 */
export const getAppVersion = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    try {
      const params = new URLSearchParams(window.location.search);
      const override = params.get('platform')?.toLowerCase();
      if (override === 'android') return VERSIONS.android;
      if (override === 'ios') return VERSIONS.ios;
      if (override === 'web') return VERSIONS.web;
    } catch {
      // Ignore URL parsing errors
    }
  }

  const native = getNativePlatform();
  if (native === 'android') return VERSIONS.android;
  if (native === 'ios' || isIosStandalone()) return VERSIONS.ios;

  return VERSIONS.web;
};

export const APP_VERSION = getAppVersion();
