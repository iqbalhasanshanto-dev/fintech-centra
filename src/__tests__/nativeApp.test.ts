import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initNativeApp, cleanupNativeApp, updateNativeStatusBar, hideSplashScreen } from '../utils/nativeApp';
import * as platform from '../utils/platform';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

vi.mock('../utils/platform', () => ({
  isNative: vi.fn(),
}));

vi.mock('@capacitor/app', () => {
  const listeners: Record<string, Function[]> = {};
  return {
    App: {
      addListener: vi.fn((eventName: string, listener: Function) => {
        if (!listeners[eventName]) listeners[eventName] = [];
        listeners[eventName].push(listener);
        return Promise.resolve({
          remove: vi.fn(async () => {
            listeners[eventName] = listeners[eventName].filter(l => l !== listener);
          }),
        });
      }),
      getLaunchUrl: vi.fn().mockResolvedValue(undefined),
      exitApp: vi.fn().mockResolvedValue(undefined),
    },
  };
});

vi.mock('@capacitor/status-bar', () => ({
  StatusBar: {
    setStyle: vi.fn().mockResolvedValue(undefined),
    setBackgroundColor: vi.fn().mockResolvedValue(undefined),
  },
  Style: {
    Dark: 'DARK',
    Light: 'LIGHT',
  },
}));

vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: {
    hide: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Native Bootstrap (src/utils/nativeApp.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupNativeApp();
  });

  afterEach(async () => {
    await cleanupNativeApp();
  });

  it('does nothing when isNative is false (Web)', async () => {
    vi.mocked(platform.isNative).mockReturnValue(false);

    const cleanup = await initNativeApp();
    expect(SplashScreen.hide).not.toHaveBeenCalled();
    expect(CapApp.addListener).not.toHaveBeenCalled();

    await cleanup();
  });

  it('initializes splash, status bar, and listeners when isNative is true', async () => {
    vi.mocked(platform.isNative).mockReturnValue(true);

    const onUrlOpen = vi.fn();
    const onAppStateChange = vi.fn();
    const onBackButton = vi.fn();

    const cleanup = await initNativeApp({
      onUrlOpen,
      onAppStateChange,
      onBackButton,
    });

    // Splash hidden
    expect(SplashScreen.hide).toHaveBeenCalledWith({ fadeOutDuration: 250 });

    // Listeners registered
    expect(CapApp.addListener).toHaveBeenCalledWith('appUrlOpen', expect.any(Function));
    expect(CapApp.addListener).toHaveBeenCalledWith('appStateChange', expect.any(Function));
    expect(CapApp.addListener).toHaveBeenCalledWith('backButton', expect.any(Function));

    // Cleanup unregisters all
    await cleanup();
  });

  it('is idempotent: calling init twice does not re-register duplicate listeners', async () => {
    vi.mocked(platform.isNative).mockReturnValue(true);

    await initNativeApp();
    const initialCallCount = vi.mocked(CapApp.addListener).mock.calls.length;

    // Second call without cleanup
    await initNativeApp();
    expect(vi.mocked(CapApp.addListener).mock.calls.length).toBe(initialCallCount);
  });

  it('updates native status bar based on theme', async () => {
    vi.mocked(platform.isNative).mockReturnValue(true);

    await updateNativeStatusBar(true);
    expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: Style.Dark });
    expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith({ color: '#0A0E1A' });

    await updateNativeStatusBar(false);
    expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: Style.Light });
    expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith({ color: '#FAFAFA' });
  });

  it('handles cold-start launch URL from getLaunchUrl', async () => {
    vi.mocked(platform.isNative).mockReturnValue(true);
    vi.mocked(CapApp.getLaunchUrl).mockResolvedValueOnce({
      url: 'com.centra.app://auth/callback?code=cold_start_code',
    });

    const onUrlOpen = vi.fn();
    await initNativeApp({ onUrlOpen });

    expect(onUrlOpen).toHaveBeenCalledWith('com.centra.app://auth/callback?code=cold_start_code');
  });
});
