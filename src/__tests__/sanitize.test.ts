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

    it('strips HTML tags and script elements', () => {
      const malicious = '<script>alert("XSS")</script>Coffee Shop';
      expect(sanitizeText(malicious)).toBe('Coffee Shop');

      const imgTag = '<img src=x onerror=alert(1) />Dinner';
      expect(sanitizeText(imgTag)).toBe('Dinner');
    });

    it('strips null bytes and control characters', () => {
      const input = 'Salary\x00\x07\x1F Bonus';
      expect(sanitizeText(input)).toBe('Salary Bonus');
    });

    it('disarms javascript: pseudo-protocols', () => {
      const malicious = 'javascript:stealCredentials()';
      expect(sanitizeText(malicious)).toBe('stealCredentials()');
    });

    it('enforces maximum character lengths', () => {
      const longInput = 'A'.repeat(500);
      expect(sanitizeText(longInput, 100).length).toBe(100);
      expect(sanitizeText(longInput, 50).length).toBe(50);
    });

    it('normalizes Unicode characters', () => {
      const decomposed = 'e\u0301'; // é decomposed
      const sanitized = sanitizeText(decomposed);
      expect(sanitized).toBe('é');
    });
  });

  describe('sanitizeEmail', () => {
    it('normalizes, trims, and lowercases emails', () => {
      expect(sanitizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
    });

    it('strips control characters from emails', () => {
      expect(sanitizeEmail('user\x00@domain.com')).toBe('user@domain.com');
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
