import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isNewerVersion, checkForAppUpdate, triggerSafeAppUpdate } from '../utils/updateChecker';
import * as platformModule from '../utils/platform';
import { CentraDB } from '../db/storage';
import { Browser } from '@capacitor/browser';

vi.mock('@capacitor/browser', () => ({
  Browser: {
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('In-App Update Checker (src/utils/updateChecker.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('isNewerVersion', () => {
    it('returns true strictly when latest > installed', () => {
      expect(isNewerVersion('4.1.2', '4.1.3')).toBe(true);
      expect(isNewerVersion('1.0.4', '1.0.5')).toBe(true);
      expect(isNewerVersion('1.0.0', '2.0.0')).toBe(true);
      expect(isNewerVersion('1.1.0', '1.2.0')).toBe(true);
      expect(isNewerVersion('v1.0.4', 'v1.0.5')).toBe(true);
      expect(isNewerVersion('1.0', '1.0.1')).toBe(true);
    });

    it('returns false when latest <= installed', () => {
      expect(isNewerVersion('4.1.3', '4.1.3')).toBe(false);
      expect(isNewerVersion('1.0.5', '1.0.5')).toBe(false);
      expect(isNewerVersion('4.1.4', '4.1.3')).toBe(false);
      expect(isNewerVersion('2.0.0', '1.9.9')).toBe(false);
    });

    it('handles empty or invalid inputs safely', () => {
      expect(isNewerVersion('', '1.0.0')).toBe(false);
      expect(isNewerVersion('1.0.0', '')).toBe(false);
    });
  });

  describe('checkForAppUpdate', () => {
    it('returns updateAvailable: false when version is up to date', async () => {
      vi.spyOn(platformModule, 'getNativePlatform').mockReturnValue('web');
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          web: {
            version: '1.0.6',
            releaseNotes: ['Sample notes'],
          },
        }),
      } as unknown as Response);

      const result = await checkForAppUpdate(false);
      expect(result.updateAvailable).toBe(false);
      expect(result.installedVersion).toBe('1.0.6');
      expect(result.latestVersion).toBe('1.0.6');
    });

    it('returns updateAvailable: true when remote version is newer', async () => {
      vi.spyOn(platformModule, 'getNativePlatform').mockReturnValue('web');
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          web: {
            version: '1.0.7',
            releaseNotes: ['Feature A', 'Feature B'],
          },
        }),
      } as unknown as Response);

      const result = await checkForAppUpdate(false);
      expect(result.updateAvailable).toBe(true);
      expect(result.latestVersion).toBe('1.0.7');
      expect(result.releaseNotes).toEqual(['Feature A', 'Feature B']);
    });

    it('respects dismissed state in sessionStorage unless forceCheck is true', async () => {
      vi.spyOn(platformModule, 'getNativePlatform').mockReturnValue('android');
      sessionStorage.setItem('centra_dismissed_update_4.1.5', '1');

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          android: {
            version: '4.1.5',
            downloadUrl: 'https://test.com/app.apk',
            releaseNotes: ['Android update'],
          },
        }),
      } as unknown as Response);

      // forceCheck = false -> dismissed
      const dismissedRes = await checkForAppUpdate(false);
      expect(dismissedRes.updateAvailable).toBe(false);
      expect(dismissedRes.dismissed).toBe(true);

      // forceCheck = true -> ignores dismissed
      const forcedRes = await checkForAppUpdate(true);
      expect(forcedRes.updateAvailable).toBe(true);
      expect(forcedRes.latestVersion).toBe('4.1.5');
    });
  });

  describe('triggerSafeAppUpdate', () => {
    it('flushes outbox and reloads page on web without clearing storage', async () => {
      const processOutboxSpy = vi.spyOn(CentraDB, 'processOutbox').mockResolvedValue(undefined as never);
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { reload: reloadMock },
      });

      await triggerSafeAppUpdate({
        updateAvailable: true,
        platform: 'web',
        installedVersion: '1.0.4',
        latestVersion: '1.0.5',
      });

      expect(processOutboxSpy).toHaveBeenCalled();
      expect(reloadMock).toHaveBeenCalled();
    });

    it('opens download URL on native platform via Browser.open', async () => {
      vi.spyOn(CentraDB, 'processOutbox').mockResolvedValue(undefined as never);
      const openSpy = vi.spyOn(Browser, 'open').mockResolvedValue(undefined as never);

      await triggerSafeAppUpdate({
        updateAvailable: true,
        platform: 'android',
        installedVersion: '4.1.2',
        latestVersion: '4.1.3',
        downloadUrl: 'https://raw.githubusercontent.com/test.apk',
      });

      expect(openSpy).toHaveBeenCalledWith({ url: 'https://raw.githubusercontent.com/test.apk' });
    });
  });
});
