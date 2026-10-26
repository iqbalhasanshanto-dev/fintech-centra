/**
 * Input sanitization utilities for user-provided strings and values.
 * Protects against XSS, control characters, null bytes, and buffer/DoS payloads.
 */

// Matches control characters except common safe whitespace (newline, carriage return, tab)
// eslint-disable-next-line no-control-regex -- Explicitly matching and removing ASCII control characters for input sanitization
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

// Strip full script and style tag blocks including inner content
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const STYLE_TAG_REGEX = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;

// Strip remaining HTML tags and dangerous javascript: or data: pseudo-protocols
const HTML_TAGS_REGEX = /<[^>]*>/g;
const JS_PROTOCOL_REGEX = /(?:javascript|vbscript|data):/gi;

/**
 * Sanitizes a single-line or multi-line text input:
 * 1. Coerces to string
 * 2. Normalizes Unicode (NFC)
 * 3. Strips null bytes and malicious ASCII control characters
 * 4. Strips HTML markup (<...>)
 * 5. Disarms javascript: / vbscript: pseudo-protocols
 * 6. Trims outer whitespace
 * 7. Enforces maximum character length
 */
export function sanitizeText(input: unknown, maxLength = 255): string {
  if (input === null || input === undefined) return '';

  const raw = String(input);
  if (!raw) return '';

  const sanitized = raw
    .normalize('NFC')
    .replace(SCRIPT_TAG_REGEX, '')
    .replace(STYLE_TAG_REGEX, '')
    .replace(CONTROL_CHARS_REGEX, '')
    .replace(HTML_TAGS_REGEX, '')
    .replace(JS_PROTOCOL_REGEX, '')
    .trim();

  return maxLength > 0 ? sanitized.slice(0, maxLength) : sanitized;
}

/**
 * Sanitizes an email address:
 * - Trims whitespace
 * - Converts to lower case
 * - Strips control characters
 * - Restricts to RFC 5321 max length of 254 characters
 */
export function sanitizeEmail(email: unknown): string {
  if (!email || typeof email !== 'string') return '';
  return email
    .normalize('NFC')
    .replace(CONTROL_CHARS_REGEX, '')
    .trim()
    .toLowerCase()
    .slice(0, 254);
}

/**
 * Sanitizes and validates a finite numeric amount:
 * Returns fallback (default 0) if value is NaN, Infinity, negative, or exceeds maxAmount.
 */
export function sanitizeAmount(
  value: unknown,
  fallback = 0,
  maxAmount = 1_000_000_000
): number {
  if (value === null || value === undefined) return fallback;

  const num = typeof value === 'number' ? value : parseFloat(String(value));

  if (!Number.isFinite(num) || isNaN(num) || num < 0 || num > maxAmount) {
    return fallback;
  }

  // Round to 2 decimal places to avoid floating point precision quirks
  return Math.round(num * 100) / 100;
}
