import { isNative } from './platform';

export const NATIVE_REDIRECT_SCHEME = 'com.centra.app://auth/callback';

/**
 * Returns the environment-aware auth redirect URL.
 * - Capacitor Android / iOS: com.centra.app://auth/callback
 * - Web: window.location.origin + '/' (or import.meta.env.VITE_SITE_URL || window.location.origin)
 * - Tauri Desktop: window.location.origin + '/' (note: Desktop uses email OTP only; OAuth is hidden)
 */
export const getAuthRedirectUrl = (): string => {
  if (isNative()) {
    return NATIVE_REDIRECT_SCHEME;
  }

  const baseOrigin =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) ||
    (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3003');

  return baseOrigin.endsWith('/') ? baseOrigin : `${baseOrigin}/`;
};
