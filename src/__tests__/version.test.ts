import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAppVersion, VERSIONS } from '../utils/version';
import * as platformModule from '../utils/platform';

describe('Version Utils (src/utils/version.ts)', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Restore location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('exposes correct platform versions in VERSIONS config', () => {
    expect(VERSIONS.android).toBe('4.1.1');
    expect(VERSIONS.ios).toBe('1.0.0');
    expect(VERSIONS.web).toBe('1.0.0');
  });

  it('returns android version when on android native platform', () => {
    vi.spyOn(platformModule, 'getNativePlatform').mockReturnValue('android');
    expect(getAppVersion()).toBe('4.1.1');
  });

  it('returns ios version when on ios native platform', () => {
    vi.spyOn(platformModule, 'getNativePlatform').mockReturnValue('ios');
    expect(getAppVersion()).toBe('1.0.0');
  });

  it('returns web version by default on web', () => {
    vi.spyOn(platformModule, 'getNativePlatform').mockReturnValue('web');
    expect(getAppVersion()).toBe('1.0.0');
  });

  it('honors ?platform=android query param override', () => {
    delete (window as unknown as { location?: unknown }).location;
    window.location = new URL('https://centra.local?platform=android') as unknown as Location;

    expect(getAppVersion()).toBe('4.1.1');
  });

  it('honors ?platform=ios query param override', () => {
    delete (window as unknown as { location?: unknown }).location;
    window.location = new URL('https://centra.local?platform=ios') as unknown as Location;

    expect(getAppVersion()).toBe('1.0.0');
  });

  it('honors ?platform=web query param override', () => {
    delete (window as unknown as { location?: unknown }).location;
    window.location = new URL('https://centra.local?platform=web') as unknown as Location;

    expect(getAppVersion()).toBe('1.0.0');
  });
});
