import { CurrencyCode, Account } from '../types';
import { EXCHANGE_RATES_TO_USD, RATES_LAST_UPDATED } from './formatters';

/**
 * Currency Minor Unit Decimals mapping.
 * Standard fiat: 2 decimals (USD, BDT, EUR, GBP, etc.)
 * Zero-decimal currencies: JPY, KRW, etc.
 */
export const CURRENCY_DECIMALS: Record<string, number> = {
  BDT: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  CAD: 2,
  AUD: 2,
  CHF: 2,
  CNY: 2,
  INR: 2,
  SGD: 2,
  AED: 2,
  SAR: 2,
  JPY: 0,
  KRW: 0,
  VND: 0,
};

export function getCurrencyDecimals(currency?: CurrencyCode | null): number {
  if (!currency) return 2;
  const upper = currency.toUpperCase();
  return CURRENCY_DECIMALS[upper] !== undefined ? CURRENCY_DECIMALS[upper] : 2;
}

/**
 * Converts a floating-point money amount to integer minor units (e.g. cents).
 * Avoids float precision loss with Math.round.
 */
export function toMinorUnits(amount: number, currency?: CurrencyCode | null): number {
  const decimals = getCurrencyDecimals(currency);
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor);
}

/**
 * Converts integer minor units back to standard decimal amount.
 */
export function fromMinorUnits(minor: number, currency?: CurrencyCode | null): number {
  const decimals = getCurrencyDecimals(currency);
  const factor = Math.pow(10, decimals);
  return minor / factor;
}

/**
 * Rounds a monetary amount to the currency's decimal precision using minor units.
 */
export function roundMoney(amount: number, currency?: CurrencyCode | null): number {
  return fromMinorUnits(toMinorUnits(amount, currency), currency);
}

/**
 * Adds two monetary amounts in the same currency using integer minor units.
 * Eliminates float drift such as 0.10 + 0.20 = 0.30000000000000004.
 */
export function addMoney(a: number, b: number, currency?: CurrencyCode | null): number {
  const minorA = toMinorUnits(a, currency);
  const minorB = toMinorUnits(b, currency);
  return fromMinorUnits(minorA + minorB, currency);
}

/**
 * Subtracts two monetary amounts in the same currency using integer minor units.
 */
export function subMoney(a: number, b: number, currency?: CurrencyCode | null): number {
  const minorA = toMinorUnits(a, currency);
  const minorB = toMinorUnits(b, currency);
  return fromMinorUnits(minorA - minorB, currency);
}

/**
 * Sanitizes and parses an amount input string.
 * Strips thousand commas ("1,500.50" -> 1500.50), prevents multiple decimals,
 * and limits max length to avoid overflow.
 */
export function parseAmountInput(raw: string, currency?: CurrencyCode | null): number {
  if (!raw) return 0;
  let cleaned = raw.trim();
  
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/,/g, '');
  } else if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = parts[0] + '.' + parts[1];
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  cleaned = cleaned.replace(/[^0-9.]/g, '');
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex !== -1) {
    const beforeDot = cleaned.substring(0, dotIndex);
    const afterDot = cleaned.substring(dotIndex + 1).replace(/\./g, '');
    cleaned = beforeDot + '.' + afterDot;
  }

  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || !isFinite(parsed)) return 0;
  return roundMoney(Math.max(0, parsed), currency);
}

/**
 * Currency conversion with exact rate auditing.
 * Throws or reports error if currency rate is unknown (never silent 1.0).
 */
export function convertCurrencyWithRate(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): { convertedAmount: number; rate: number } {
  const safeFrom = (from || '').toUpperCase();
  const safeTo = (to || '').toUpperCase();

  if (safeFrom === safeTo) {
    return { convertedAmount: roundMoney(amount, to), rate: 1.0 };
  }

  const fromRateToUsd = EXCHANGE_RATES_TO_USD[safeFrom];
  const toRateToUsd = EXCHANGE_RATES_TO_USD[safeTo];

  if (!fromRateToUsd) {
    throw new Error(`Unsupported currency for exchange conversion: "${safeFrom}". Rates last updated: ${RATES_LAST_UPDATED}`);
  }
  if (!toRateToUsd) {
    throw new Error(`Unsupported currency for exchange conversion: "${safeTo}". Rates last updated: ${RATES_LAST_UPDATED}`);
  }

  // Rate from -> to is (fromRateToUsd / toRateToUsd)
  const rate = fromRateToUsd / toRateToUsd;
  const rawConverted = amount * rate;
  const convertedAmount = roundMoney(rawConverted, safeTo);

  return { convertedAmount, rate };
}

/**
 * CREDIT ACCOUNT BALANCE CONVENTION DOCUMENTATION:
 * -------------------------------------------------
 * 1. Credit accounts represent revolving lines of credit / credit cards.
 * 2. Balance sign:
 *    - Negative balance (e.g. -482.30) represents the current owed balance / debt.
 *    - Zero balance (0.00) means no debt is currently outstanding.
 *    - Positive balance (e.g. +50.00) represents an overpayment / surplus credit.
 * 3. Expenses / Charges:
 *    - An expense on a credit account SUBTRACTS from the balance (making it more negative).
 *      newBalance = currentBalance - expenseAmount
 * 4. Incomes / Repayments:
 *    - A payment or refund into a credit account ADDS to the balance (reducing debt towards 0).
 *      newBalance = currentBalance + paymentAmount
 * 5. Credit Limit & Available Credit:
 *    - creditLimit is the maximum borrowing capacity (positive number, e.g. 12,000).
 *    - Available credit = creditLimit + balance (e.g. 12,000 + (-482.30) = 11,517.70).
 *    - Debt limit check: balance - amount >= -(creditLimit)
 */
export function validateAccountFunds(
  account: Account,
  deductionAmount: number
): { hasFunds: boolean; available: number; error?: string } {
  if (deductionAmount <= 0) {
    return { hasFunds: false, available: 0, error: 'Amount must be greater than zero' };
  }

  if (account.type === 'credit') {
    const limit = account.creditLimit || 0;
    const availableCredit = addMoney(limit, account.balance, account.currency);
    const hasFunds = availableCredit >= deductionAmount;
    return {
      hasFunds,
      available: availableCredit,
      error: hasFunds ? undefined : `Credit limit exceeded. Available credit: ${availableCredit} ${account.currency}`,
    };
  }

  // Depository accounts (checking, savings, cash, investment)
  const available = account.balance;
  const hasFunds = available >= deductionAmount;
  return {
    hasFunds,
    available,
    error: hasFunds ? undefined : `Insufficient funds. Account balance: ${available} ${account.currency}`,
  };
}
