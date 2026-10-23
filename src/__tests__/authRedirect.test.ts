import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthRedirectUrl, NATIVE_REDIRECT_SCHEME } from '../utils/authRedirect';
import * as platform from '../utils/platform';

vi.mock('../utils/platform', () => ({
  isNative: vi.fn(),
  isTauri: vi.fn(),
}));

describe('Auth Redirect Helper (src/utils/authRedirect.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns native scheme com.centra.app://auth/callback when on native platform (Android/iOS)', () => {
    vi.mocked(platform.isNative).mockReturnValue(true);
    vi.mocked(platform.isTauri).mockReturnValue(false);

    expect(getAuthRedirectUrl()).toBe(NATIVE_REDIRECT_SCHEME);
    expect(getAuthRedirectUrl()).toBe('com.centra.app://auth/callback');
  });

  it('returns web origin callback when on web platform', () => {
    vi.mocked(platform.isNative).mockReturnValue(false);
    vi.mocked(platform.isTauri).mockReturnValue(false);

    const result = getAuthRedirectUrl();
    expect(result).toBe(`${window.location.origin}/auth/callback`);
  });

  it('returns web origin callback when on Tauri desktop platform', () => {
    vi.mocked(platform.isNative).mockReturnValue(false);
    vi.mocked(platform.isTauri).mockReturnValue(true);

    const result = getAuthRedirectUrl();
    expect(result).toBe(`${window.location.origin}/auth/callback`);
  });
});
