import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeEmail, sanitizeAmount } from '../utils/sanitize';

describe('Input Sanitization Utility (src/utils/sanitize.ts)', () => {
  describe('sanitizeText', () => {
    it('returns empty string for null, undefined, or empty input', () => {
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText('   ')).toBe('');
    });

    it('strips null bytes and non-printable control characters', () => {
      const input = 'Salary\x00\x07\x1F Bonus';
      expect(sanitizeText(input)).toBe('Salary Bonus');
    });

    it('strips invisible bidirectional overrides and isolates', () => {
      // U+202E is Right-to-Left Override, \x00 is null byte
      const input = 'Hello\x00\u202EWorld';
      expect(sanitizeText(input)).toBe('HelloWorld');

      // Other bidi overrides U+202A-U+202E, U+2066-U+2069
      const allOverrides = 'A\u202AB\u202BC\u202CD\u202DE\u202EF\u2066G\u2067H\u2068I\u2069J';
      expect(sanitizeText(allOverrides)).toBe('ABCDEFGHIJ');
    });

    it('strips lone surrogates but preserves valid surrogate pairs', () => {
      // Lone high surrogate \uD800 without low surrogate
      expect(sanitizeText('test\uD800string')).toBe('teststring');
      // Lone low surrogate \uDC00 without high surrogate
      expect(sanitizeText('test\uDC00string')).toBe('teststring');
      // Valid surrogate pair (emoji 😀 \uD83D\uDE00) is preserved by sanitizeText
      expect(sanitizeText('Hello 😀')).toBe('Hello 😀');
    });

    it('PRESERVES ordinary characters, punctuation, and HTML-like tags without silent deletion', () => {
      // NOTE: Deliberate behavior change from legacy tag-stripping:
      // Characters < > ( ) * & " ' / and words like "metadata:" are preserved as typed.
      // Output escaping in React renders them as literal text nodes safely.
      expect(sanitizeText('Balance < $100 and > $50')).toBe('Balance < $100 and > $50');
      expect(sanitizeText('metadata: paid')).toBe('metadata: paid');
      expect(sanitizeText('Coffee & Tea (Special * / "Promo")')).toBe('Coffee & Tea (Special * / "Promo")');
      expect(sanitizeText('<script>alert("XSS")</script>Coffee Shop')).toBe('<script>alert("XSS")</script>Coffee Shop');
      expect(sanitizeText('<img src=x onerror=alert(1)>')).toBe('<img src=x onerror=alert(1)>');
      expect(sanitizeText('javascript:stealCredentials()')).toBe('javascript:stealCredentials()');
    });

    it('PRESERVES international names, complex scripts, and ZWJ / ZWNJ', () => {
      expect(sanitizeText('Md. Iqbal Hasan')).toBe('Md. Iqbal Hasan');
      expect(sanitizeText("O'Brien")).toBe("O'Brien");
      expect(sanitizeText('Anne-Marie')).toBe('Anne-Marie');

      // Bangla text and complex conjuncts requiring ZWJ (\u200D) and ZWNJ (\u200C)
      const banglaName = 'মোঃ ইকবাল হাসান';
      expect(sanitizeText(banglaName)).toBe(banglaName);

      const banglaWithZwj = 'শামিম\u200Dরকেট';
      expect(sanitizeText(banglaWithZwj)).toBe(banglaWithZwj);

      const banglaWithZwnj = 'শামিম\u200Cহাসান';
      expect(sanitizeText(banglaWithZwnj)).toBe(banglaWithZwnj);
    });

    it('enforces maximum character lengths', () => {
      const longInput = 'A'.repeat(500);
      expect(sanitizeText(longInput, 100).length).toBe(100);
      expect(sanitizeText(longInput, 50).length).toBe(50);
    });

    it('normalizes Unicode characters to NFC', () => {
      const decomposed = 'e\u0301'; // é decomposed (NFD)
      const sanitized = sanitizeText(decomposed);
      expect(sanitized).toBe('é');
      expect(sanitized.normalize('NFC')).toBe('é');
    });
  });

  describe('sanitizeEmail', () => {
    it('normalizes, trims, and lowercases emails', () => {
      expect(sanitizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
    });

    it('strips control characters, bidi overrides, and lone surrogates from emails', () => {
      expect(sanitizeEmail('user\x00\u202E@domain.com')).toBe('user@domain.com');
    });

    it('caps email length at 254 characters', () => {
      const longEmail = 'a'.repeat(300) + '@domain.com';
      expect(sanitizeEmail(longEmail).length).toBe(254);
    });

    it('handles non-string or falsy input', () => {
      expect(sanitizeEmail(null)).toBe('');
      expect(sanitizeEmail(undefined)).toBe('');
      expect(sanitizeEmail(12345)).toBe('');
    });
  });

  describe('sanitizeAmount', () => {
    it('returns valid numeric amounts rounded to 2 decimal places', () => {
      expect(sanitizeAmount(45.999)).toBe(46);
      expect(sanitizeAmount('123.456')).toBe(123.46);
      expect(sanitizeAmount(0)).toBe(0);
    });

    it('falls back to default for negative, NaN, or infinite numbers', () => {
      expect(sanitizeAmount(-50)).toBe(0);
      expect(sanitizeAmount(NaN)).toBe(0);
      expect(sanitizeAmount(Infinity)).toBe(0);
      expect(sanitizeAmount('invalid-number')).toBe(0);
      expect(sanitizeAmount(-10, 100)).toBe(100);
    });

    it('caps at maximum allowable financial amount', () => {
      expect(sanitizeAmount(2_000_000_000)).toBe(0);
      expect(sanitizeAmount(500_000, 0, 1_000_000)).toBe(500_000);
    });
  });
});
