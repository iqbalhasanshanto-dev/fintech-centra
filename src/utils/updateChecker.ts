import { Browser } from '@capacitor/browser';
import { CentraDB } from '../db/storage';
import { getNativePlatform, NativePlatform } from './platform';
import { getAppVersion } from './version';

export interface AppUpdateInfo {
  updateAvailable: boolean;
  dismissed?: boolean;
  platform?: NativePlatform;
  installedVersion: string;
  latestVersion: string;
  downloadUrl?: string;
  releaseNotes?: string[];
}

export interface VersionMetadata {
  version: string;
  versionCode?: number;
  artifactPath?: string;
  downloadUrl?: string;
  releaseNotes?: string[];
  updatedAt?: string;
}

export interface VersionsConfig {
  android?: VersionMetadata;
  ios?: VersionMetadata;
  web?: VersionMetadata;
}

/**
 * Compares semantic versions (major.minor.patch) and returns true strictly when latest > installed.
 */
export function isNewerVersion(installed: string, latest: string): boolean {
  if (!installed || !latest) return false;
  const parse = (v: string) =>
    v.replace(/^v/i, '').split('.').map(num => parseInt(num, 10) || 0);

  const instParts = parse(installed);
  const latestParts = parse(latest);
  const maxLen = Math.max(instParts.length, latestParts.length);

  for (let i = 0; i < maxLen; i++) {
    const inst = instParts[i] ?? 0;
    const lat = latestParts[i] ?? 0;
    if (lat > inst) return true;
    if (lat < inst) return false;
  }
  return false;
}

/**
 * Checks for available application updates across Web, Android, and iOS.
 * Checks remote versions.json with automatic fallbacks and respects dismissed states unless forced.
 */
export async function checkForAppUpdate(forceCheck = false): Promise<AppUpdateInfo> {
  const platform = getNativePlatform();
  const installed = getAppVersion();

  const endpoints = [
    `https://usecentra.vercel.app/versions.json?t=${Date.now()}`,
    `https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/versions.json?t=${Date.now()}`,
    `/versions.json?t=${Date.now()}`,
  ];

  let versionsData: VersionsConfig | null = null;

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && (json.android || json.web || json.ios)) {
          versionsData = json;
          break;
        }
      }
    } catch {
      // Try next fallback endpoint
    }
  }

  if (!versionsData) {
    return {
      updateAvailable: false,
      installedVersion: installed,
      latestVersion: installed,
    };
  }

  const platformData = versionsData[platform];
  const remoteVersion = platformData?.version;

  if (!remoteVersion || !isNewerVersion(installed, remoteVersion)) {
    return {
      updateAvailable: false,
      installedVersion: installed,
      latestVersion: remoteVersion || installed,
    };
  }

  if (
    !forceCheck &&
    typeof window !== 'undefined' &&
    window.sessionStorage &&
    sessionStorage.getItem(`centra_dismissed_update_${remoteVersion}`) === '1'
  ) {
    return {
      updateAvailable: false,
      dismissed: true,
      installedVersion: installed,
      latestVersion: remoteVersion,
    };
  }

  return {
    updateAvailable: true,
    platform,
    installedVersion: installed,
    latestVersion: remoteVersion,
    downloadUrl: platformData.downloadUrl,
    releaseNotes: platformData.releaseNotes,
  };
}

/**
 * Executes a zero-data-loss safe application update.
 * Step 1: Flushes pending outbox mutations to cloud storage (3s timeout).
 * Step 2: Executes platform-specific in-place update without touching local user storage or auth tokens.
 */
export async function triggerSafeAppUpdate(updateInfo: AppUpdateInfo): Promise<void> {
  // Step 1: Zero-Data-Loss Guard
  // Never touch or clear localStorage or user session tokens!
  try {
    const syncPromise = CentraDB.processOutbox();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Outbox sync timeout')), 3000)
    );
    await Promise.race([syncPromise, timeoutPromise]);
  } catch (err) {
    console.warn('Pre-update outbox sync finished or timed out:', err);
  }

  const platform = updateInfo.platform || getNativePlatform();

  // Step 2: Execute Update by Platform
  if (platform === 'web') {
    // Web / Installed PWA:
    // Unregister or update Service Workers, delete ONLY window.caches static asset caches,
    // and reload the page so all localStorage data and auth sessions remain 100% intact.
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          try {
            await registration.update();
          } catch {}
          try {
            await registration.unregister();
          } catch {}
        }
      } catch (err) {
        console.warn('Service worker unregister error:', err);
      }
    }

    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      } catch (err) {
        console.warn('Cache clear error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  } else if (platform === 'android' || platform === 'ios') {
    // Android / iOS:
    // Open the direct binary stream updateInfo.downloadUrl via @capacitor/browser or window.open
    // so the device downloads the .apk / .ipa directly and triggers the OS in-place package upgrade.
    const url = updateInfo.downloadUrl;
    if (url) {
      try {
        await Browser.open({ url });
      } catch {
        if (typeof window !== 'undefined') {
          window.open(url, '_system');
        }
      }
    }
  }
}

