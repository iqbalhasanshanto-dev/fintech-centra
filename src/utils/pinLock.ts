/**
 * Device-local PIN hashing, verification and lockout management.
 * Uses WebCrypto PBKDF2 (SHA-256, 150,000 iterations, random salt).
 *
 * CRITICAL SECURITY INVARIANT:
 * Pin hash and salt are stored device-locally ONLY.
 * They are NEVER stored in AppSettings, NEVER synced to Supabase,
 * and NEVER included in data exports.
 */

const PBKDF2_ITERATIONS = 150_000;
const SALT_BYTE_LENGTH = 16;
const KEY_BYTE_LENGTH = 32;
const MAX_ATTEMPTS_BEFORE_DELAY = 5;
const MAX_ATTEMPTS_BEFORE_FORCED_LOGOUT = 10;
const LOCKOUT_DELAY_MS = 30_000; // 30 seconds delay after 5 failed attempts

interface DevicePinRecord {
  saltHex: string;
  hashHex: string;
  failedAttempts: number;
  lockedUntil: number | null;
}

function getPinStorageKey(userId: string): string {
  const uid = userId && userId !== 'guest' ? userId : 'guest';
  return `centra:device_lock:${uid}`;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function getStoredRecord(userId: string): DevicePinRecord | null {
  try {
    const raw = localStorage.getItem(getPinStorageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveRecord(userId: string, record: DevicePinRecord): void {
  try {
    localStorage.setItem(getPinStorageKey(userId), JSON.stringify(record));
  } catch (err) {
    console.error('Failed to save device PIN record:', err);
  }
}

/**
 * Derives a PBKDF2-SHA256 hash for a given PIN and salt.
 */
export async function derivePinHash(pin: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_BYTE_LENGTH * 8
  );

  return bytesToHex(new Uint8Array(derivedBits));
}

/**
 * Sets or updates a 4-6 digit PIN for a user on this device.
 */
export async function setDevicePin(userId: string, pin: string): Promise<void> {
  if (!pin || pin.length < 4 || pin.length > 8) {
    throw new Error('PIN must be between 4 and 8 digits.');
  }

  const salt = new Uint8Array(SALT_BYTE_LENGTH);
  crypto.getRandomValues(salt);

  const hashHex = await derivePinHash(pin, salt);
  const record: DevicePinRecord = {
    saltHex: bytesToHex(salt),
    hashHex,
    failedAttempts: 0,
    lockedUntil: null,
  };

  saveRecord(userId, record);
}

/**
 * Checks whether a device PIN has been established for the user.
 */
export function hasDevicePin(userId: string): boolean {
  const record = getStoredRecord(userId);
  return !!record && !!record.hashHex && !!record.saltHex;
}

/**
 * Removes the device-local PIN record for a user.
 */
export function clearDevicePin(userId: string): void {
  try {
    localStorage.removeItem(getPinStorageKey(userId));
  } catch {
    // Ignore
  }
}

/**
 * Returns remaining lockout delay in seconds (if locked out).
 */
export function getLockoutRemainingSeconds(userId: string): number {
  const record = getStoredRecord(userId);
  if (!record || !record.lockedUntil) return 0;
  const remaining = record.lockedUntil - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

export interface VerifyPinResult {
  ok: boolean;
  error?: string;
  lockedOutRemaining?: number;
  maxAttemptsExceeded?: boolean;
}

/**
 * Verifies the user PIN against device-local PBKDF2 hash with escalating throttling.
 */
export async function verifyDevicePin(userId: string, pin: string): Promise<VerifyPinResult> {
  const record = getStoredRecord(userId);
  if (!record) {
    return { ok: false, error: 'No PIN is configured on this device.' };
  }

  // Check lockout
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const seconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
    return {
      ok: false,
      error: `Too many failed attempts. Try again in ${seconds}s.`,
      lockedOutRemaining: seconds,
    };
  }

  const salt = hexToBytes(record.saltHex);
  const computedHashHex = await derivePinHash(pin, salt);

  if (computedHashHex === record.hashHex) {
    // Reset failed attempts on success
    record.failedAttempts = 0;
    record.lockedUntil = null;
    saveRecord(userId, record);
    return { ok: true };
  }

  // Failed attempt
  const attempts = record.failedAttempts + 1;
  record.failedAttempts = attempts;

  if (attempts >= MAX_ATTEMPTS_BEFORE_FORCED_LOGOUT) {
    clearDevicePin(userId);
    return {
      ok: false,
      error: 'Maximum PIN attempts exceeded. For security, your session has been logged out.',
      maxAttemptsExceeded: true,
    };
  }

  if (attempts >= MAX_ATTEMPTS_BEFORE_DELAY) {
    record.lockedUntil = Date.now() + LOCKOUT_DELAY_MS;
    saveRecord(userId, record);
    return {
      ok: false,
      error: 'Too many incorrect attempts. Locked out for 30 seconds.',
      lockedOutRemaining: Math.ceil(LOCKOUT_DELAY_MS / 1000),
    };
  }

  saveRecord(userId, record);
  return {
    ok: false,
    error: `Incorrect PIN. ${MAX_ATTEMPTS_BEFORE_DELAY - attempts} attempts remaining before temporary lockout.`,
  };
}
