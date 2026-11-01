import { CurrencyCode } from '../types';
import { getCurrencyInfo } from './currencies';
import { logger } from './logger';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: '৳',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  INR: '₹',
  SGD: 'S$',
  AED: 'AED',
  SAR: 'SAR',
};

export const EXCHANGE_RATES_TO_USD: Record<string, number> = {
  BDT: 0.0085,
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.28,
  JPY: 0.0067,
  CAD: 0.74,
  AUD: 0.65,
  CHF: 1.12,
  CNY: 0.14,
  INR: 0.012,
  SGD: 0.75,
  AED: 0.27,
  SAR: 0.27,
};

export const RATES_LAST_UPDATED = 'October 15, 2026';

export function convertCurrency(
  amount: number,
  from?: CurrencyCode | null,
  to?: CurrencyCode | null
): number {
  const safeFrom = (from || 'BDT').toUpperCase();
  const safeTo = (to || 'BDT').toUpperCase();
  if (safeFrom === safeTo) return amount;
  const fromRate = EXCHANGE_RATES_TO_USD[safeFrom];
  const toRate = EXCHANGE_RATES_TO_USD[safeTo];
  if (!fromRate || !toRate) {
    // If currency not in rate table, warn and keep amount or throw
    logger.warn(`[Currency] Missing rate for ${safeFrom} or ${safeTo}. Rates updated: ${RATES_LAST_UPDATED}`);
    return amount;
  }
  const amountInUSD = amount * fromRate;
  return amountInUSD / toRate;
}

export function formatCurrency(
  amount: number,
  currency?: CurrencyCode | null,
  privacyMode: boolean = false,
  showDecimals: boolean = true
): string {
  if (privacyMode) {
    return '••••••';
  }

  const activeCurrency = currency || 'USD';
  const info = getCurrencyInfo(activeCurrency);
  const symbol = info.symbol || activeCurrency;
  const absAmount = Math.abs(amount);
  
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: activeCurrency === 'JPY' ? 0 : showDecimals ? 2 : 0,
    maximumFractionDigits: activeCurrency === 'JPY' ? 0 : showDecimals ? 2 : 0,
  };

  const formattedNum = absAmount.toLocaleString('en-US', options);
  const sign = amount < 0 ? '-' : '';

  return `${sign}${symbol}${formattedNum}`;
}

export function formatPercent(value: number, includeSign: boolean = true): string {
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDateHeader(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = 
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = 
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Strips any trailing ` [Attached: ...]` tag and trims whitespace.
 */
export function cleanTransactionNote(note?: string): string {
  if (!note) return '';
  return note.replace(/\s*\[Attached:\s*[^\]]+\]\s*$/i, '').trim();
}

/**
 * Format transaction date with smart relative labels:
 * - diffDays === 0: "Today • 9:00 PM"
 * - diffDays === 1: "Yesterday • 3:40 AM"
 * - diffDays >= 2 && diffDays <= 6: "N days ago" (e.g. "2 days ago")
 * - diffDays === 7: "1 week ago"
 * - diffDays > 7 (or future dates): "Oct 31" or "Oct 31, 2025" if different year
 */
export function formatSmartTxDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;

  const now = new Date();
  const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((nowMidnight - dMidnight) / (1000 * 60 * 60 * 24));

  const timeStr = formatTime(isoDate);

  if (diffDays === 0) {
    return `Today • ${timeStr}`;
  }
  if (diffDays === 1) {
    return `Yesterday • ${timeStr}`;
  }
  if (diffDays >= 2 && diffDays <= 6) {
    return `${diffDays} days ago`;
  }
  if (diffDays === 7) {
    return '1 week ago';
  }

  if (d.getFullYear() !== now.getFullYear()) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export interface TransactionDisplayInput {
  merchant?: string;
  categoryName?: string;
  note?: string;
  date: string;
  type?: string;
  accountName?: string;
}

export interface TransactionDisplay {
  title: string;
  subtitle: string;
  cleanNote: string;
  hasCustomMerchant: boolean;
  rawMerchant: string;
  categoryName: string;
  smartDate: string;
}

/**
 * Generates smart display title and subtitle for a transaction:
 * - Prioritizes custom merchant (Paid To / Received From) > note > category name for the title.
 * - Prevents repeating category name over category name in subtitle.
 */
export function getTransactionDisplay(tx: TransactionDisplayInput): TransactionDisplay {
  const cleanNote = cleanTransactionNote(tx.note);
  const rawMerchant = (tx.merchant || '').trim();
  const catName = (tx.categoryName || (tx.type === 'income' ? 'Income' : 'Expense')).trim();

  // Determine if rawMerchant is a real user-entered merchant/source
  const hasCustomMerchant =
    rawMerchant.length > 0 &&
    rawMerchant.toLowerCase() !== catName.toLowerCase() &&
    !['income', 'expense', 'other'].includes(rawMerchant.toLowerCase());

  // Primary title: Priority 1 (rawMerchant if custom) > Priority 2 (cleanNote) > Priority 3 (catName)
  let title = catName;
  if (hasCustomMerchant) {
    title = rawMerchant;
  } else if (cleanNote) {
    title = cleanNote;
  }

  // Secondary subtitle: Never append cleanNote into subtitle to avoid truncating smartDate
  const smartDate = formatSmartTxDate(tx.date);
  let subtitle: string;

  if (title.toLowerCase() === catName.toLowerCase()) {
    // Both custom merchant and note were blank (or matched category name)
    // Do NOT repeat category name!
    subtitle = tx.accountName ? `${tx.accountName} • ${smartDate}` : smartDate;
  } else {
    // Otherwise, ALWAYS return `${catName} • ${smartDate}`
    subtitle = `${catName} • ${smartDate}`;
  }

  return {
    title,
    subtitle,
    cleanNote,
    hasCustomMerchant,
    rawMerchant,
    categoryName: catName,
    smartDate,
  };
}

export interface GoalPaceResult {
  percentComplete: number;
  expectedPercent: number;
  isBehind: boolean;
  behindPercent: number;
  remainingAmount: number;
  daysRemaining: number;
  monthsRemaining: number;
  recommendedMonthly: number;
}

export function calculateGoalPace(
  current: number,
  target: number,
  startDateStr: string,
  targetDateStr: string
): GoalPaceResult {
  const start = new Date(startDateStr).getTime();
  const targetTime = new Date(targetDateStr).getTime();
  const now = new Date().getTime();

  const totalDuration = Math.max(1, targetTime - start);
  const elapsedDuration = Math.max(0, Math.min(now - start, totalDuration));
  const remainingTime = Math.max(0, targetTime - now);

  const expectedPercent = Math.min(100, (elapsedDuration / totalDuration) * 100);
  const percentComplete = Math.min(100, (current / Math.max(1, target)) * 100);
  const remainingAmount = Math.max(0, target - current);

  const daysRemaining = Math.max(1, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));
  const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));
  const recommendedMonthly = Math.round(remainingAmount / monthsRemaining);

  const isBehind = percentComplete < expectedPercent - 3;
  const behindPercent = isBehind ? Math.round(expectedPercent - percentComplete) : 0;

  return {
    percentComplete,
    expectedPercent,
    isBehind,
    behindPercent,
    remainingAmount,
    daysRemaining,
    monthsRemaining,
    recommendedMonthly,
  };
}
