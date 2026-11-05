import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAppVersion, VERSIONS } from '../utils/version';
import * as platformModule from '../utils/platform';

describe('Version Utils (src/utils/version.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('exposes correct platform versions in VERSIONS config', () => {
    expect(VERSIONS.android).toBe('4.1.3');
    expect(VERSIONS.ios).toBe('1.0.1');
    expect(VERSIONS.web).toBe('1.0.5');
  });

  it('returns android version when on android native platform', () => {
    vi.spyOn(platformModule, 'getNativePlatform').mockReturnValue('android');
    expect(getAppVersion()).toBe('4.1.3');
  });

  it('returns ios version when on ios native platform', () => {
    vi.spyOn(platformModule, 'getNativePlatform').mockReturnValue('ios');
    expect(getAppVersion()).toBe('1.0.1');
  });

  it('returns web version by default on web', () => {
    vi.spyOn(platformModule, 'getNativePlatform').mockReturnValue('web');
    expect(getAppVersion()).toBe('1.0.5');
  });

  it('honors ?platform=android query param override', () => {
    window.history.replaceState({}, '', '?platform=android');
    expect(getAppVersion()).toBe('4.1.3');
  });

  it('honors ?platform=ios query param override', () => {
    window.history.replaceState({}, '', '?platform=ios');
    expect(getAppVersion()).toBe('1.0.1');
  });

  it('honors ?platform=web query param override', () => {
    window.history.replaceState({}, '', '?platform=web');
    expect(getAppVersion()).toBe('1.0.5');
  });
});

