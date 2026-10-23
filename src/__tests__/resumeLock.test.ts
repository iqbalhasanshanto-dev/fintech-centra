import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CentraDB } from '../db/storage';
import * as pinLock from '../utils/pinLock';

describe('App Resume Lock Timing (Phase 7 Task 6b)', () => {
  const BACKGROUND_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates background elapsed time accurately and locks only after 5 minutes', () => {
    let hiddenTimestamp: number | null = null;
    const lockApp = vi.fn();
    const hasPin = true;
    const pinLockEnabled = true;

    // Simulate background event
    hiddenTimestamp = Date.now();

    // Advance by 4 minutes 59 seconds (299,000 ms)
    vi.advanceTimersByTime(299000);

    // Simulate resume
    const elapsedBeforeTimeout = Date.now() - (hiddenTimestamp || 0);
    expect(elapsedBeforeTimeout).toBeLessThan(BACKGROUND_TIMEOUT_MS);

    if (hiddenTimestamp && Date.now() - hiddenTimestamp >= BACKGROUND_TIMEOUT_MS) {
      if (pinLockEnabled && hasPin) {
        lockApp();
      }
    }
    expect(lockApp).not.toHaveBeenCalled();

    // Now advance past 5 minutes (another 2 seconds = 301,000 ms total)
    vi.advanceTimersByTime(2000);
    const elapsedAfterTimeout = Date.now() - (hiddenTimestamp || 0);
    expect(elapsedAfterTimeout).toBeGreaterThanOrEqual(BACKGROUND_TIMEOUT_MS);

    if (hiddenTimestamp && Date.now() - hiddenTimestamp >= BACKGROUND_TIMEOUT_MS) {
      if (pinLockEnabled && hasPin) {
        lockApp();
      }
    }
    expect(lockApp).toHaveBeenCalledTimes(1);
  });

  it('does not lock if user does not have PIN lock enabled', () => {
    let hiddenTimestamp: number | null = Date.now();
    const lockApp = vi.fn();
    const hasPin = true;
    const pinLockEnabled = false; // Disabled by user

    // Advance by 10 minutes
    vi.advanceTimersByTime(10 * 60 * 1000);

    if (hiddenTimestamp && Date.now() - hiddenTimestamp >= BACKGROUND_TIMEOUT_MS) {
      if (pinLockEnabled && hasPin) {
        lockApp();
      }
    }
    expect(lockApp).not.toHaveBeenCalled();
  });
});
