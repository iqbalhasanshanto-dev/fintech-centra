import { describe, it, expect, beforeEach } from 'vitest';
import {
  setDevicePin,
  verifyDevicePin,
  hasDevicePin,
  clearDevicePin,
  getLockoutRemainingSeconds,
} from '../utils/pinLock';

describe('Phase 2 PIN Lock & WebCrypto PBKDF2', () => {
  const userId = 'user_test_pin_123';

  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly hashes and stores PIN locally with a random salt', async () => {
    expect(hasDevicePin(userId)).toBe(false);

    await setDevicePin(userId, '4829');

    expect(hasDevicePin(userId)).toBe(true);
    const stored = JSON.parse(localStorage.getItem(`centra:device_lock:${userId}`) || '{}');
    expect(stored.hashHex).toBeDefined();
    expect(stored.saltHex).toBeDefined();
    // Salt must be 16 bytes = 32 hex chars
    expect(stored.saltHex.length).toBe(32);
    // SHA-256 derived key must be 32 bytes = 64 hex chars
    expect(stored.hashHex.length).toBe(64);
  });

  it('successfully verifies the correct PIN', async () => {
    await setDevicePin(userId, '9876');

    const result = await verifyDevicePin(userId, '9876');
    expect(result.ok).toBe(true);
  });

  it('rejects an incorrect PIN and tracks remaining attempts', async () => {
    await setDevicePin(userId, '9876');

    const result = await verifyDevicePin(userId, '0000');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('attempts remaining');
  });

  it('applies a temporary lockout after 5 consecutive failures', async () => {
    await setDevicePin(userId, '5555');

    for (let i = 0; i < 4; i++) {
      const res = await verifyDevicePin(userId, '0000');
      expect(res.ok).toBe(false);
    }

    // 5th attempt triggers lockout
    const res5 = await verifyDevicePin(userId, '0000');
    expect(res5.ok).toBe(false);
    expect(res5.error).toContain('Locked out for 30 seconds');
    expect(res5.lockedOutRemaining).toBeGreaterThan(0);

    // Subsequent attempts during lockout fail immediately
    const resDuringLockout = await verifyDevicePin(userId, '5555');
    expect(resDuringLockout.ok).toBe(false);
    expect(resDuringLockout.error).toContain('Too many failed attempts');
  });

  it('forces sign-out and clears device PIN after 10 consecutive failures', async () => {
    await setDevicePin(userId, '7777');

    // Simulate 9 failures
    const stored = JSON.parse(localStorage.getItem(`centra:device_lock:${userId}`) || '{}');
    stored.failedAttempts = 9;
    stored.lockedUntil = null;
    localStorage.setItem(`centra:device_lock:${userId}`, JSON.stringify(stored));

    const res10 = await verifyDevicePin(userId, '0000');
    expect(res10.ok).toBe(false);
    expect(res10.maxAttemptsExceeded).toBe(true);
    expect(hasDevicePin(userId)).toBe(false);
  });

  it('clears device PIN on clearDevicePin call', async () => {
    await setDevicePin(userId, '123456');
    expect(hasDevicePin(userId)).toBe(true);

    clearDevicePin(userId);
    expect(hasDevicePin(userId)).toBe(false);
  });
});
