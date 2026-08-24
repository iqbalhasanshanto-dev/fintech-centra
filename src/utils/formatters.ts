import { CurrencyCode } from '../types';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  BDT: '৳',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
};

export const EXCHANGE_RATES_TO_USD: Record<CurrencyCode, number> = {
  BDT: 0.0085,
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.28,
  JPY: 0.0067,
  CAD: 0.74,
};

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;
  // Convert from origin to USD, then from USD to destination
  const amountInUSD = amount * EXCHANGE_RATES_TO_USD[from];
  const targetRate = EXCHANGE_RATES_TO_USD[to];
  return amountInUSD / targetRate;
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'BDT',
  privacyMode: boolean = false,
  showDecimals: boolean = true
): string {
  if (privacyMode) {
    return '••••••';
  }

  const symbol = CURRENCY_SYMBOLS[currency] || '৳';
  const absAmount = Math.abs(amount);
  
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: currency === 'JPY' ? 0 : showDecimals ? 2 : 0,
    maximumFractionDigits: currency === 'JPY' ? 0 : showDecimals ? 2 : 0,
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
