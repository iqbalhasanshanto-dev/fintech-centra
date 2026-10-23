import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { isNative, getNativePlatform, isTauri, getAppPlatform } from '../utils/platform';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
    getPlatform: vi.fn(),
  },
}));

describe('Platform Helper (src/utils/platform.ts)', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock as web
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    vi.mocked(Capacitor.getPlatform).mockReturnValue('web');
  });

  afterEach(() => {
    // Restore window
    if (originalWindow) {
      delete (globalThis.window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
      delete (globalThis.window as unknown as { __TAURI__?: unknown }).__TAURI__;
    }
  });

  it('detects web platform correctly', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    vi.mocked(Capacitor.getPlatform).mockReturnValue('web');

    expect(isNative()).toBe(false);
    expect(getNativePlatform()).toBe('web');
    expect(isTauri()).toBe(false);
    expect(getAppPlatform()).toBe('web');
  });

  it('detects android platform correctly', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(Capacitor.getPlatform).mockReturnValue('android');

    expect(isNative()).toBe(true);
    expect(getNativePlatform()).toBe('android');
    expect(isTauri()).toBe(false);
    expect(getAppPlatform()).toBe('android');
  });

  it('detects ios platform correctly', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(Capacitor.getPlatform).mockReturnValue('ios');

    expect(isNative()).toBe(true);
    expect(getNativePlatform()).toBe('ios');
    expect(isTauri()).toBe(false);
    expect(getAppPlatform()).toBe('ios');
  });

  it('detects tauri desktop via __TAURI_INTERNALS__', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    vi.mocked(Capacitor.getPlatform).mockReturnValue('web');

    (globalThis.window as unknown as { __TAURI_INTERNALS__: Record<string, unknown> }).__TAURI_INTERNALS__ = {};

    expect(isNative()).toBe(false);
    expect(isTauri()).toBe(true);
    expect(getAppPlatform()).toBe('desktop');
  });

  it('detects tauri desktop via __TAURI__', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    vi.mocked(Capacitor.getPlatform).mockReturnValue('web');

    (globalThis.window as unknown as { __TAURI__: Record<string, unknown> }).__TAURI__ = {};

    expect(isNative()).toBe(false);
    expect(isTauri()).toBe(true);
    expect(getAppPlatform()).toBe('desktop');
  });
});
