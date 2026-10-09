/**
 * Centralized local date and time utilities for Centra Fintech.
 * Prevents UTC timezone midnight date-shifting bugs.
 */

import { PeriodFilter } from '../types';

/**
 * Returns a YYYY-MM-DD key for a given Date or ISO string in local timezone.
 */
export function toLocalDateKey(dateInput?: Date | string | number | null): string {
  if (!dateInput) {
    return todayLocalDateKey();
  }
  const d = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;

  if (isNaN(d.getTime())) {
    return todayLocalDateKey();
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local timezone.
 */
export function todayLocalDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a Date at local midnight.
 */
export function parseLocalDateKey(key: string): Date {
  const parts = key.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day, 0, 0, 0, 0);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }
  return new Date();
}

/**
 * Checks if two dates/keys represent the same local calendar day.
 */
export function isSameLocalDay(d1: Date | string, d2: Date | string): boolean {
  return toLocalDateKey(d1) === toLocalDateKey(d2);
}

/**
 * Returns the local date range boundary for period filters.
 */
export function getPeriodDateRange(
  period: PeriodFilter,
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  const now = referenceDate;
  const start = new Date(now);
  const end = new Date(now);

  switch (period) {
    case 'this_month': {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'last_month': {
      start.setMonth(start.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'last_90_days': {
      start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'this_year': {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'all':
    default: {
      start.setFullYear(2000, 0, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(2099, 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    }
  }

  return { start, end };
}
