import { describe, it, expect } from 'vitest';
import { getGreeting } from '../utils/greeting';

describe('getGreeting (local device time)', () => {
  const createDate = (hours: number, minutes: number) => {
    const d = new Date(2026, 9, 28, hours, minutes, 0, 0);
    return d;
  };

  it('returns "Good Evening" for 04:59', () => {
    expect(getGreeting(createDate(4, 59))).toBe('Good Evening');
  });

  it('returns "Good Morning" for 05:00', () => {
    expect(getGreeting(createDate(5, 0))).toBe('Good Morning');
  });

  it('returns "Good Morning" for 11:59', () => {
    expect(getGreeting(createDate(11, 59))).toBe('Good Morning');
  });

  it('returns "Good Afternoon" for 12:00', () => {
    expect(getGreeting(createDate(12, 0))).toBe('Good Afternoon');
  });

  it('returns "Good Afternoon" for 16:59', () => {
    expect(getGreeting(createDate(16, 59))).toBe('Good Afternoon');
  });

  it('returns "Good Evening" for 17:00', () => {
    expect(getGreeting(createDate(17, 0))).toBe('Good Evening');
  });

  it('returns "Good Evening" for 00:00 (midnight)', () => {
    expect(getGreeting(createDate(0, 0))).toBe('Good Evening');
  });

  it('does not produce "Good Night"', () => {
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        expect(getGreeting(createDate(h, m))).not.toBe('Good Night');
      }
    }
  });
});
