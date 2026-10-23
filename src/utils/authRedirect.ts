import { isNative, isTauri } from './platform';

export const NATIVE_REDIRECT_SCHEME = 'com.centra.app://auth/callback';

/**
 * Returns the environment-aware auth redirect URL.
 * - Capacitor Android / iOS: com.centra.app://auth/callback
 * - Web: window.location.origin + '/auth/callback'
 * - Tauri Desktop: window.location.origin + '/auth/callback' (note: Desktop uses email OTP only; OAuth is hidden)
 */
export const getAuthRedirectUrl = (): string => {
  if (isNative()) {
    return NATIVE_REDIRECT_SCHEME;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/auth/callback`;
  }

  // Safe fallback if called outside browser window (e.g. during SSR or test environments)
  return 'http://localhost:3003/auth/callback';
};
