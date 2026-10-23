import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackButtonManager } from '../utils/backButton';

describe('BackButtonManager (src/utils/backButton.ts)', () => {
  beforeEach(() => {
    BackButtonManager.clear();
  });

  it('closes the most recently registered overlay first (LIFO order)', () => {
    const closeFirst = vi.fn();
    const closeSecond = vi.fn();

    BackButtonManager.register(closeFirst);
    BackButtonManager.register(closeSecond);

    expect(BackButtonManager.getStackSize()).toBe(2);

    // First hardware back press
    const handled1 = BackButtonManager.handleBackButton();
    expect(handled1).toBe(true);
    expect(closeSecond).toHaveBeenCalledTimes(1);
    expect(closeFirst).not.toHaveBeenCalled();
    expect(BackButtonManager.getStackSize()).toBe(1);

    // Second hardware back press
    const handled2 = BackButtonManager.handleBackButton();
    expect(handled2).toBe(true);
    expect(closeFirst).toHaveBeenCalledTimes(1);
    expect(BackButtonManager.getStackSize()).toBe(0);
  });

  it('respects priority over insertion order', () => {
    const lowPriority = vi.fn();
    const highPriority = vi.fn();

    BackButtonManager.register(lowPriority, 0);
    BackButtonManager.register(highPriority, 10);

    const handled = BackButtonManager.handleBackButton();
    expect(handled).toBe(true);
    expect(highPriority).toHaveBeenCalledTimes(1);
    expect(lowPriority).not.toHaveBeenCalled();
  });

  it('unregisters cleanly when overlay closes or unmounts', () => {
    const closeModal = vi.fn();
    const unregister = BackButtonManager.register(closeModal);

    expect(BackButtonManager.getStackSize()).toBe(1);
    unregister();
    expect(BackButtonManager.getStackSize()).toBe(0);

    const handled = BackButtonManager.handleBackButton();
    expect(handled).toBe(false);
    expect(closeModal).not.toHaveBeenCalled();
  });

  it('invokes rootHandler when overlay stack is empty', () => {
    const rootHandler = vi.fn();
    BackButtonManager.registerRootHandler(rootHandler);

    expect(BackButtonManager.getStackSize()).toBe(0);
    const handled = BackButtonManager.handleBackButton();

    expect(handled).toBe(true);
    expect(rootHandler).toHaveBeenCalledTimes(1);
  });

  it('returns false when both stack and rootHandler are empty', () => {
    expect(BackButtonManager.handleBackButton()).toBe(false);
  });
});
