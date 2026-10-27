import { describe, it, expect } from 'vitest';
import {
  validateName,
  validateLabel,
  validateNote,
  validateEmail,
  validatePhone,
  validateAddress,
  validateAmount,
} from '../utils/validators';

describe('Validators Unit Tests (src/utils/validators.ts)', () => {
  describe('validateName', () => {
    it('accepts valid western and international names with dots, hyphens, and apostrophes', () => {
      expect(validateName('Md. Iqbal Hasan')).toEqual({
        ok: true,
        value: 'Md. Iqbal Hasan',
      });
      expect(validateName("O'Brien")).toEqual({
        ok: true,
        value: "O'Brien",
      });
      expect(validateName('Anne-Marie')).toEqual({
        ok: true,
        value: 'Anne-Marie',
      });
      expect(validateName('Martin Luther King, Jr.')).toEqual({
        ok: false,
        value: 'Martin Luther King, Jr.',
        error: 'Name can only contain letters, spaces, hyphens, dots, and apostrophes.',
      });
      expect(validateName('Renée Zellweger')).toEqual({
        ok: true,
        value: 'Renée Zellweger',
      });
    });

    it('accepts Bangla names with combining marks, conjuncts, and vowel signs', () => {
      expect(validateName('মোঃ ইকবাল হাসান')).toEqual({
        ok: true,
        value: 'মোঃ ইকবাল হাসান',
      });
      expect(validateName('শামিম')).toEqual({
        ok: true,
        value: 'শামিম',
      });
    });

    it('collapses repeated whitespace in names', () => {
      expect(validateName('   John    Doe   ')).toEqual({
        ok: true,
        value: 'John Doe',
      });
    });

    it('rejects script tags, symbols, punctuation outside allowed set, and emoji', () => {
      expect(validateName('Bob<script>').ok).toBe(false);
      expect(validateName('(admin)').ok).toBe(false);
      expect(validateName('*').ok).toBe(false);
      expect(validateName('a;b').ok).toBe(false);
      expect(validateName('{x}').ok).toBe(false);
      expect(validateName('Bob 👨‍💻').ok).toBe(false);
      expect(validateName('John 2nd').ok).toBe(false);
    });

    it('rejects empty input or strings exceeding 80 characters', () => {
      expect(validateName('').ok).toBe(false);
      expect(validateName('   ').ok).toBe(false);
      expect(validateName(null).ok).toBe(false);
      expect(validateName('A'.repeat(81)).ok).toBe(false);
      expect(validateName('A'.repeat(80)).ok).toBe(true);
    });
  });

  describe('validateLabel', () => {
    it('accepts valid account, category, goal, budget, and merchant names', () => {
      expect(validateLabel('Main Checking', 'Account')).toEqual({
        ok: true,
        value: 'Main Checking',
      });
      expect(validateLabel('Groceries & Food', 'Category')).toEqual({
        ok: true,
        value: 'Groceries & Food',
      });
      expect(validateLabel('Trip (2026)', 'Goal')).toEqual({
        ok: true,
        value: 'Trip (2026)',
      });
      expect(validateLabel('Account #1 + Bonus', 'Account')).toEqual({
        ok: true,
        value: 'Account #1 + Bonus',
      });
      expect(validateLabel('Dinner / Drinks - Bar', 'Merchant')).toEqual({
        ok: true,
        value: 'Dinner / Drinks - Bar',
      });
      expect(validateLabel('Coffee Shop_01, Downtown', 'Merchant')).toEqual({
        ok: true,
        value: 'Coffee Shop_01, Downtown',
      });
    });

    it('rejects disallowed characters: < > { } * = ; \\ ` and emoji', () => {
      expect(validateLabel('Coffee <script>', 'Merchant').ok).toBe(false);
      expect(validateLabel('Special * Item', 'Category').ok).toBe(false);
      expect(validateLabel('{Budget}', 'Budget').ok).toBe(false);
      expect(validateLabel('a=b', 'Label').ok).toBe(false);
      expect(validateLabel('x;y', 'Label').ok).toBe(false);
      expect(validateLabel('Back\\Slash', 'Label').ok).toBe(false);
      expect(validateLabel('`code`', 'Label').ok).toBe(false);
      expect(validateLabel('Coffee ☕', 'Merchant').ok).toBe(false);
    });

    it('enforces 1 to 60 characters and handles optional mode', () => {
      expect(validateLabel('', 'Merchant', true).ok).toBe(false);
      expect(validateLabel('', 'Bank name', false)).toEqual({ ok: true, value: '' });
      expect(validateLabel('A'.repeat(61), 'Label').ok).toBe(false);
      expect(validateLabel('A'.repeat(60), 'Label').ok).toBe(true);
    });
  });

  describe('validateNote', () => {
    it('accepts 0 to 500 characters of any printable text without deleting symbols', () => {
      expect(validateNote('')).toEqual({ ok: true, value: '' });
      expect(validateNote(null)).toEqual({ ok: true, value: '' });

      const noteText = 'Balance < $100 and > $50 & "metadata: paid" * (flag/tag)';
      expect(validateNote(noteText)).toEqual({
        ok: true,
        value: noteText,
      });

      const scriptNote = '<script>alert(1)</script>';
      expect(validateNote(scriptNote)).toEqual({
        ok: true,
        value: scriptNote,
      });
    });

    it('rejects notes exceeding 500 characters', () => {
      expect(validateNote('A'.repeat(501)).ok).toBe(false);
      expect(validateNote('A'.repeat(500)).ok).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('accepts and normalizes valid emails', () => {
      expect(validateEmail(' USER@Example.Com ')).toEqual({
        ok: true,
        value: 'user@example.com',
      });
      expect(validateEmail('test.account+centra@sub.domain.co.uk')).toEqual({
        ok: true,
        value: 'test.account+centra@sub.domain.co.uk',
      });
    });

    it('rejects invalid email formats', () => {
      expect(validateEmail('notanemail').ok).toBe(false);
      expect(validateEmail('user@').ok).toBe(false);
      expect(validateEmail('@domain.com').ok).toBe(false);
      expect(validateEmail('user@domain').ok).toBe(false);
      expect(validateEmail('user@@domain.com').ok).toBe(false);
      expect(validateEmail('user@dom ain.com').ok).toBe(false);
      expect(validateEmail('').ok).toBe(false);
      expect(validateEmail(null).ok).toBe(false);
    });

    it('rejects emails exceeding 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@domain.com';
      expect(validateEmail(longEmail).ok).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('accepts valid phone numbers with 7 to 15 digits', () => {
      expect(validatePhone('+1 (555) 123-4567')).toEqual({
        ok: true,
        value: '+1 (555) 123-4567',
      });
      expect(validatePhone('+880 1711 234567')).toEqual({
        ok: true,
        value: '+880 1711 234567',
      });
      expect(validatePhone('1234567')).toEqual({
        ok: true,
        value: '1234567',
      });
    });

    it('rejects numbers with fewer than 7 or more than 15 digits', () => {
      expect(validatePhone('123456').ok).toBe(false);
      expect(validatePhone('1234567890123456').ok).toBe(false);
    });

    it('rejects phone numbers containing letters or invalid symbols', () => {
      expect(validatePhone('123-456-7890 ext 12').ok).toBe(false);
      expect(validatePhone('+1 555-CALL-NOW').ok).toBe(false);
      expect(validatePhone('123#456').ok).toBe(false);
    });

    it('handles optional phone number field', () => {
      expect(validatePhone('', false)).toEqual({ ok: true, value: '' });
      expect(validatePhone('', true).ok).toBe(false);
    });
  });

  describe('validateAddress', () => {
    it('accepts valid addresses with allowed punctuation', () => {
      expect(validateAddress('123 Main St, Apt #4B, Springfield.')).toEqual({
        ok: true,
        value: '123 Main St, Apt #4B, Springfield.',
      });
      expect(validateAddress("House 12/A, Road 5, Block-C, O'Connor")).toEqual({
        ok: true,
        value: "House 12/A, Road 5, Block-C, O'Connor",
      });
    });

    it('rejects disallowed characters like < > { } * = ; \\ `', () => {
      expect(validateAddress('123 Main St <script>').ok).toBe(false);
      expect(validateAddress('Address * line').ok).toBe(false);
      expect(validateAddress('Line ; other').ok).toBe(false);
    });

    it('enforces 200 characters length cap and handles optional mode', () => {
      expect(validateAddress('', false)).toEqual({ ok: true, value: '' });
      expect(validateAddress('A'.repeat(201)).ok).toBe(false);
      expect(validateAddress('A'.repeat(200)).ok).toBe(true);
    });
  });

  describe('validateAmount', () => {
    it('accepts valid positive numbers and formatted amounts', () => {
      expect(validateAmount('150.50', 'USD')).toEqual({ ok: true, value: 150.5 });
      expect(validateAmount('1,500.00', 'USD')).toEqual({ ok: true, value: 1500 });
      expect(validateAmount(25, 'EUR')).toEqual({ ok: true, value: 25 });
    });

    it('rejects negative numbers and zero by default', () => {
      expect(validateAmount('-50', 'USD').ok).toBe(false);
      expect(validateAmount('0', 'USD').ok).toBe(false);
      expect(validateAmount('0', 'USD', { allowZero: true })).toEqual({ ok: true, value: 0 });
    });

    it('rejects amounts exceeding 999,999,999,999.99', () => {
      expect(validateAmount('1000000000000.00', 'USD').ok).toBe(false);
      expect(validateAmount('999999999999.99', 'USD').ok).toBe(true);
    });

    it('rejects amounts with more decimal places than allowed by currency', () => {
      // USD allows 2 decimal places
      expect(validateAmount('12.345', 'USD').ok).toBe(false);
      expect(validateAmount('12.34', 'USD').ok).toBe(true);

      // JPY allows 0 decimal places
      expect(validateAmount('500.5', 'JPY').ok).toBe(false);
      expect(validateAmount('500', 'JPY').ok).toBe(true);
    });

    it('rejects invalid strings or letters', () => {
      expect(validateAmount('abc', 'USD').ok).toBe(false);
      expect(validateAmount('12.34.56', 'USD').ok).toBe(false);
      expect(validateAmount('', 'USD').ok).toBe(false);
    });
  });
});
