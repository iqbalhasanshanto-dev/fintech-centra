/**
 * Input sanitization utilities for user-provided strings and values.
 * Removes non-printable control characters, bidirectional overrides, and lone surrogates.
 * Normalizes to NFC and enforces length caps without silently destroying valid user characters
 * (<, >, &, ', ", /, *, "metadata:", etc.).
 *
 * XSS safety is ensured via React output escaping at render time.
 */

// Matches non-printable control characters (U+0000 to U+0008, U+000B, U+000C, U+000E to U+001F, U+007F)
// Keeping \t (U+0009), \n (U+000A), \r (U+000D)
// eslint-disable-next-line no-control-regex -- Explicitly matching ASCII control characters for input normalization
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

// Invisible bidirectional override / isolate characters
// U+202A to U+202E (LRE, RLE, PDF, LRO, RLO) and U+2066 to U+2069 (LRI, RLI, FSI, PDI)
const BIDI_OVERRIDES_REGEX = /[\u202A-\u202E\u2066-\u2069]/g;

// Lone UTF-16 surrogates: high surrogate not followed by low surrogate, or low surrogate not preceded by high surrogate.
// Note: valid surrogate pairs (e.g. standard emoji or supplemental plane characters) are preserved.
const LONE_SURROGATES_REGEX = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

/**
 * Sanitizes single-line or multi-line text input:
 * 1. Coerces to string
 * 2. Normalizes Unicode (NFC)
 * 3. Strips null bytes, ASCII control characters (preserving newline/tab/carriage return)
 * 4. Strips invisible bidirectional override characters (U+202A-U+202E, U+2066-U+2069)
 * 5. Strips lone UTF-16 surrogates
 * 6. Preserves Zero-Width Joiner (U+200D) & Zero-Width Non-Joiner (U+200C) for complex scripts (e.g. Bangla)
 * 7. Preserves all ordinary printable characters (< > & ' " / * etc.) exactly as typed
 * 8. Trims outer whitespace
 * 9. Enforces maximum character length
 */
export function sanitizeText(input: unknown, maxLength = 255): string {
  if (input === null || input === undefined) return '';

  const raw = String(input);
  if (!raw) return '';

  const cleaned = raw
    .normalize('NFC')
    .replace(CONTROL_CHARS_REGEX, '')
    .replace(BIDI_OVERRIDES_REGEX, '')
    .replace(LONE_SURROGATES_REGEX, '')
    .trim();

  return maxLength > 0 ? cleaned.slice(0, maxLength) : cleaned;
}

/**
 * Sanitizes an email address:
 * - Normalizes Unicode (NFC)
 * - Strips control characters, bidi overrides, lone surrogates
 * - Trims whitespace
 * - Converts to lower case
 * - Restricts to RFC 5321 max length of 254 characters
 */
export function sanitizeEmail(email: unknown): string {
  if (!email || typeof email !== 'string') return '';
  return email
    .normalize('NFC')
    .replace(CONTROL_CHARS_REGEX, '')
    .replace(BIDI_OVERRIDES_REGEX, '')
    .replace(LONE_SURROGATES_REGEX, '')
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
