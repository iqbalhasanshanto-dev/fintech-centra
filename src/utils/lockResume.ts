export const AUTOLOCK_STORAGE_KEY = 'centra_autolock_timeout';
export const DEFAULT_AUTOLOCK_TIMEOUT_MS = 0; // Immediately

export type AutoLockTimeoutOption = 0 | 60000 | 300000 | 900000;

export interface AutoLockOptionDescriptor {
  label: string;
  value: AutoLockTimeoutOption;
}

export const AUTOLOCK_OPTIONS: AutoLockOptionDescriptor[] = [
  { label: 'Immediately (default)', value: 0 },
  { label: '1 minute', value: 60000 },
  { label: '5 minutes', value: 300000 },
  { label: '15 minutes', value: 900000 },
];

/**
 * Reads the device-local auto-lock timeout setting.
 * Not synced to Supabase, not included in data exports.
 */
export const getAutoLockTimeout = (): number => {
  if (typeof window === 'undefined') return DEFAULT_AUTOLOCK_TIMEOUT_MS;
  try {
    const stored = localStorage.getItem(AUTOLOCK_STORAGE_KEY);
    if (stored !== null) {
      const val = parseInt(stored, 10);
      if (!isNaN(val) && val >= 0) {
        return val;
      }
    }
  } catch {
    // Ignore localStorage read errors
  }
  return DEFAULT_AUTOLOCK_TIMEOUT_MS;
};

/**
 * Saves the device-local auto-lock timeout setting.
 */
export const setAutoLockTimeout = (timeoutMs: number): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTOLOCK_STORAGE_KEY, timeoutMs.toString());
  } catch {
    // Ignore localStorage write errors
  }
};

/**
 * Pure function to decide synchronously whether background elapsed time
 * requires triggering the PIN lock on resume.
 */
export const shouldTriggerResumeLock = (
  hiddenTimestamp: number | null,
  now: number,
  timeoutMs: number,
  isLockEnabled: boolean,
  hasPin: boolean,
  isAlreadyLocked: boolean
): boolean => {
  if (!isLockEnabled || !hasPin || isAlreadyLocked) {
    return false;
  }
  if (hiddenTimestamp === null) {
    return false;
  }
  return now - hiddenTimestamp >= timeoutMs;
};
