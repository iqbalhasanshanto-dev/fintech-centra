/**
 * Centra Pure Input Validation Functions
 *
 * All validators return { ok, value, error } with clear user-facing messages.
 * Never silently deletes user text: input is either accepted as valid or
 * rejected with actionable feedback.
 */

import { CurrencyCode } from '../types';
import { getCurrencyDecimals, parseAmountInput } from './money';
import { sanitizeText, sanitizeEmail } from './sanitize';

export interface ValidationResult<T = string> {
  ok: boolean;
  value: T;
  error?: string;
}

// ---------------------------------------------------------------------------
// 1. validateName (People names)
// 1 to 80 characters, Unicode letters (\p{L}), combining marks (\p{M}),
// spaces, hyphen (-), apostrophe (' and ’), dot (.).
// Collapses repeated spaces. No digits, symbols, or emoji.
// ---------------------------------------------------------------------------
const NAME_ALLOWED_REGEX = /^[\p{L}\p{M}\u200C\u200D\s'’.-]+$/u;

export function validateName(input: unknown): ValidationResult<string> {
  if (input === null || input === undefined) {
    return { ok: false, value: '', error: 'Please enter your name.' };
  }

  // Pre-clean control characters, bidi overrides, lone surrogates per Step 2
  const cleaned = sanitizeText(input, 200).replace(/\s+/g, ' ').trim();

  if (!cleaned) {
    return { ok: false, value: '', error: 'Please enter your name.' };
  }

  if (cleaned.length > 80) {
    return { ok: false, value: cleaned, error: 'Name must be 80 characters or fewer.' };
  }

  if (!NAME_ALLOWED_REGEX.test(cleaned)) {
    return {
      ok: false,
      value: cleaned,
      error: 'Name can only contain letters, spaces, hyphens, dots, and apostrophes.',
    };
  }

  return { ok: true, value: cleaned };
}

// ---------------------------------------------------------------------------
// 2. validateLabel (Account, Category, Goal, Budget names, Merchant)
// 1 to 60 characters, letters, marks, digits, spaces and . , - _ & ' / ( ) # +
// No < > { } * = ; \ ` and emoji.
// ---------------------------------------------------------------------------
const LABEL_ALLOWED_REGEX = /^[\p{L}\p{M}\u200C\u200D\p{N}\s.,\-_&'’/()#+]+$/u;

export function validateLabel(
  input: unknown,
  fieldName = 'Name',
  required = true
): ValidationResult<string> {
  if (input === null || input === undefined) {
    if (!required) return { ok: true, value: '' };
    return { ok: false, value: '', error: `Please enter a ${fieldName.toLowerCase()}.` };
  }

  const cleaned = sanitizeText(input, 150).replace(/\s+/g, ' ').trim();

  if (!cleaned) {
    if (!required) return { ok: true, value: '' };
    return { ok: false, value: '', error: `Please enter a ${fieldName.toLowerCase()}.` };
  }

  if (cleaned.length > 60) {
    return { ok: false, value: cleaned, error: `${fieldName} must be 60 characters or fewer.` };
  }

  if (!LABEL_ALLOWED_REGEX.test(cleaned)) {
    return {
      ok: false,
      value: cleaned,
      error: `${fieldName} contains invalid characters. Disallowed: < > { } * = ; \\ \` and emoji.`,
    };
  }

  return { ok: true, value: cleaned };
}

// ---------------------------------------------------------------------------
// 3. validateNote (Transaction and transfer notes)
// 0 to 500 characters, any printable text per Step 2.
// Retains all characters including < > ( ) * & " ' / and words like "metadata:".
// ---------------------------------------------------------------------------
export function validateNote(input: unknown): ValidationResult<string> {
  if (input === null || input === undefined) {
    return { ok: true, value: '' };
  }

  const cleaned = sanitizeText(input, 600);

  if (cleaned.length > 500) {
    return { ok: false, value: cleaned, error: 'Note must be 500 characters or fewer.' };
  }

  return { ok: true, value: cleaned };
}

// ---------------------------------------------------------------------------
// 4. validateEmail (Contact email address)
// Trim, lowercase, exactly one @, 5 to 254 characters, standards-based pattern.
// ---------------------------------------------------------------------------
const EMAIL_STANDARD_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateEmail(input: unknown): ValidationResult<string> {
  if (input === null || input === undefined) {
    return { ok: false, value: '', error: 'Please enter an email address.' };
  }

  const clean = sanitizeEmail(input);

  if (!clean) {
    return { ok: false, value: '', error: 'Please enter an email address.' };
  }

  if (clean.length < 5 || clean.length > 254) {
    return { ok: false, value: clean, error: 'Email must be between 5 and 254 characters.' };
  }

  const atParts = clean.split('@');
  if (atParts.length !== 2 || !atParts[0] || !atParts[1]) {
    return { ok: false, value: clean, error: 'Please enter a valid email address.' };
  }

  if (!EMAIL_STANDARD_REGEX.test(clean)) {
    return { ok: false, value: clean, error: 'Please enter a valid email address.' };
  }

  return { ok: true, value: clean };
}

// ---------------------------------------------------------------------------
// 5. validatePhone (Contact / SMS phone number)
// Digits, spaces, hyphens, parentheses, optional leading +; 7 to 15 digits.
// ---------------------------------------------------------------------------
const PHONE_STRUCTURE_REGEX = /^\+?[\d\s\-()]+$/;

export function validatePhone(input: unknown, required = false): ValidationResult<string> {
  if (input === null || input === undefined) {
    if (!required) return { ok: true, value: '' };
    return { ok: false, value: '', error: 'Please enter a phone number.' };
  }

  const raw = sanitizeText(input, 50).trim();

  if (!raw) {
    if (!required) return { ok: true, value: '' };
    return { ok: false, value: '', error: 'Please enter a phone number.' };
  }

  if (!PHONE_STRUCTURE_REGEX.test(raw)) {
    return {
      ok: false,
      value: raw,
      error: 'Phone number can only contain digits, spaces, hyphens, parentheses, and a leading +.',
    };
  }

  const digitsOnly = raw.replace(/\D/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return {
      ok: false,
      value: raw,
      error: 'Phone number must contain between 7 and 15 digits.',
    };
  }

  return { ok: true, value: raw };
}

// ---------------------------------------------------------------------------
// 6. validateAddress (Physical / mailing address)
// 0 to 200 characters, letters, marks, digits, spaces and , . - / # ' ’
// No < > { } * = ; \ `
// ---------------------------------------------------------------------------
const ADDRESS_ALLOWED_REGEX = /^[\p{L}\p{M}\u200C\u200D\p{N}\s,.\-/#’']+$/u;

export function validateAddress(input: unknown, required = false): ValidationResult<string> {
  if (input === null || input === undefined) {
    if (!required) return { ok: true, value: '' };
    return { ok: false, value: '', error: 'Please enter an address.' };
  }

  const cleaned = sanitizeText(input, 250).replace(/\s+/g, ' ').trim();

  if (!cleaned) {
    if (!required) return { ok: true, value: '' };
    return { ok: false, value: '', error: 'Please enter an address.' };
  }

  if (cleaned.length > 200) {
    return { ok: false, value: cleaned, error: 'Address must be 200 characters or fewer.' };
  }

  if (!ADDRESS_ALLOWED_REGEX.test(cleaned)) {
    return {
      ok: false,
      value: cleaned,
      error: 'Address can only contain letters, numbers, spaces, and , . - / # \'',
    };
  }

  return { ok: true, value: cleaned };
}

// ---------------------------------------------------------------------------
// 7. validateAmount (Financial money amounts)
// Reuses amount input parsing, rejects values > 999,999,999,999.99
// and checks that decimal precision does not exceed currency fraction digits.
// ---------------------------------------------------------------------------
export function validateAmount(
  input: unknown,
  currency?: CurrencyCode | string | null,
  options?: { allowZero?: boolean; max?: number }
): ValidationResult<number> {
  const allowZero = options?.allowZero ?? false;
  const max = options?.max ?? 999_999_999_999.99;

  if (input === null || input === undefined || input === '') {
    return { ok: false, value: 0, error: 'Please enter an amount.' };
  }

  const rawStr = String(input).trim();
  if (!rawStr) {
    return { ok: false, value: 0, error: 'Please enter an amount.' };
  }

  // Reject invalid characters like letters or dangerous symbols
  if (/[^\d.,\s]/.test(rawStr)) {
    return { ok: false, value: 0, error: 'Amount can only contain numbers and a decimal point.' };
  }

  // Check decimal count based on currency rules
  const maxDecimals = getCurrencyDecimals(currency as CurrencyCode);

  let decimalPart = '';
  if (rawStr.includes('.')) {
    const parts = rawStr.split('.');
    if (parts.length > 2) {
      return { ok: false, value: 0, error: 'Amount cannot have multiple decimal points.' };
    }
    decimalPart = parts[1].replace(/,/g, '');
  } else if (rawStr.includes(',')) {
    const parts = rawStr.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      decimalPart = parts[1];
    }
  }

  if (decimalPart.length > maxDecimals) {
    if (maxDecimals === 0) {
      return {
        ok: false,
        value: 0,
        error: `Amount cannot have decimal places for ${currency || 'this currency'}.`,
      };
    }
    return {
      ok: false,
      value: 0,
      error: `Amount cannot have more than ${maxDecimals} decimal places for ${currency || 'this currency'}.`,
    };
  }

  const parsed = parseAmountInput(rawStr, currency as CurrencyCode);
  if (!Number.isFinite(parsed) || isNaN(parsed)) {
    return { ok: false, value: 0, error: 'Please enter a valid amount.' };
  }

  if (parsed < 0 || (!allowZero && parsed === 0)) {
    return { ok: false, value: parsed, error: 'Amount must be greater than zero.' };
  }

  if (parsed > max) {
    return {
      ok: false,
      value: parsed,
      error: 'Amount cannot exceed 999,999,999,999.99.',
    };
  }

  return { ok: true, value: parsed };
}
