import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cleanTransactionNote,
  formatSmartTxDate,
  getTransactionDisplay,
} from '../utils/formatters';

describe('Smart Transactions & Formatting Helpers', () => {
  describe('cleanTransactionNote', () => {
    it('returns empty string for undefined or empty note', () => {
      expect(cleanTransactionNote(undefined)).toBe('');
      expect(cleanTransactionNote('')).toBe('');
      expect(cleanTransactionNote('   ')).toBe('');
    });

    it('returns trimmed note when no attachment tag is present', () => {
      expect(cleanTransactionNote('Chanachur')).toBe('Chanachur');
      expect(cleanTransactionNote('  Bought snacks at station  ')).toBe('Bought snacks at station');
    });

    it('strips trailing attachment tag cleanly', () => {
      expect(cleanTransactionNote('Chanachur [Attached: receipt.jpg]')).toBe('Chanachur');
      expect(cleanTransactionNote('Dinner with friends   [Attached: img_9401.png]  ')).toBe('Dinner with friends');
      expect(cleanTransactionNote('[Attached: scan.pdf]')).toBe('');
    });
  });

  describe('formatSmartTxDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // Set fixed local time: 2026-10-31 22:00:00 local time
      vi.setSystemTime(new Date(2026, 9, 31, 22, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns raw string for invalid date', () => {
      expect(formatSmartTxDate('invalid-date')).toBe('invalid-date');
    });

    it('returns Today • time for same calendar day', () => {
      const todayDate = new Date(2026, 9, 31, 21, 0, 0).toISOString();
      const res = formatSmartTxDate(todayDate);
      expect(res).toMatch(/^Today • /);
    });

    it('returns Yesterday • time for 1 calendar day ago', () => {
      const yesterdayDate = new Date(2026, 9, 30, 3, 40, 0).toISOString();
      const res = formatSmartTxDate(yesterdayDate);
      expect(res).toMatch(/^Yesterday • /);
    });

    it('returns N days ago for 2 to 6 days ago', () => {
      const twoDaysAgo = new Date(2026, 9, 29, 14, 0, 0).toISOString();
      expect(formatSmartTxDate(twoDaysAgo)).toBe('2 days ago');

      const fiveDaysAgo = new Date(2026, 9, 26, 12, 0, 0).toISOString();
      expect(formatSmartTxDate(fiveDaysAgo)).toBe('5 days ago');

      const sixDaysAgo = new Date(2026, 9, 25, 12, 0, 0).toISOString();
      expect(formatSmartTxDate(sixDaysAgo)).toBe('6 days ago');
    });

    it('returns 1 week ago for exactly 7 days ago', () => {
      const sevenDaysAgo = new Date(2026, 9, 24, 12, 0, 0).toISOString();
      expect(formatSmartTxDate(sevenDaysAgo)).toBe('1 week ago');
    });

    it('returns short month and day for > 7 days ago in same year', () => {
      const tenDaysAgo = new Date(2026, 9, 21, 12, 0, 0).toISOString();
      expect(formatSmartTxDate(tenDaysAgo)).toBe('Oct 21');
    });

    it('includes year if date is from a different calendar year', () => {
      const lastYear = new Date(2025, 9, 31, 12, 0, 0).toISOString();
      expect(formatSmartTxDate(lastYear)).toBe('Oct 31, 2025');
    });
  });

  describe('getTransactionDisplay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 9, 31, 21, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('Priority 1: Uses custom merchant (Paid To / Received From) as title when provided', () => {
      const res = getTransactionDisplay({
        categoryName: 'Gifts / Allowance',
        merchant: 'Abbu',
        note: 'Eid Salami',
        date: new Date(2026, 9, 31, 21, 0, 0).toISOString(),
        accountName: 'Cash',
      });

      expect(res.title).toBe('Abbu');
      expect(res.hasCustomMerchant).toBe(true);
      expect(res.subtitle).toMatch(/^Gifts \/ Allowance • Today •/);
    });

    it('Priority 1 without note: Subtitle shows category and smart date', () => {
      const res = getTransactionDisplay({
        categoryName: 'Groceries',
        merchant: 'Shwapno',
        note: '',
        date: new Date(2026, 9, 31, 21, 0, 0).toISOString(),
      });

      expect(res.title).toBe('Shwapno');
      expect(res.hasCustomMerchant).toBe(true);
      expect(res.subtitle).toMatch(/^Groceries • Today •/);
    });

    it('Priority 2: Uses note as title when custom merchant is empty', () => {
      const res = getTransactionDisplay({
        categoryName: 'Groceries',
        note: 'Chanachur',
        merchant: '',
        date: new Date(2026, 9, 31, 21, 0, 0).toISOString(),
        accountName: 'Cash',
      });

      expect(res.title).toBe('Chanachur');
      expect(res.hasCustomMerchant).toBe(false);
      expect(res.subtitle).toMatch(/^Groceries • Today •/);
    });

    it('Priority 3: Falls back to category name and eliminates duplicate in subtitle', () => {
      const res = getTransactionDisplay({
        categoryName: 'Groceries',
        note: '',
        merchant: '',
        date: new Date(2026, 9, 31, 21, 0, 0).toISOString(),
        accountName: 'Cash',
      });

      expect(res.title).toBe('Groceries');
      // Subtitle must NEVER repeat Groceries or prepend Cash!
      expect(res.subtitle).not.toContain('Groceries');
      expect(res.subtitle).not.toContain('Cash');
      expect(res.subtitle).toMatch(/^Today •/);
    });

    it('Handles legacy transactions where merchant was set to category name', () => {
      const res = getTransactionDisplay({
        categoryName: 'Groceries',
        merchant: 'Groceries', // legacy duplicate
        note: '',
        date: new Date(2026, 9, 31, 21, 0, 0).toISOString(),
        accountName: 'City Bank',
      });

      expect(res.hasCustomMerchant).toBe(false);
      expect(res.title).toBe('Groceries');
      expect(res.subtitle).not.toContain('Groceries');
      expect(res.subtitle).not.toContain('City Bank');
      expect(res.subtitle).toMatch(/^Today •/);
    });

    it('Handles default merchant names like income/expense/other as non-custom', () => {
      const res = getTransactionDisplay({
        categoryName: 'Freelance',
        merchant: 'Income',
        note: '',
        date: new Date(2026, 9, 31, 21, 0, 0).toISOString(),
      });

      expect(res.hasCustomMerchant).toBe(false);
      expect(res.title).toBe('Freelance');
    });

    it('Formats relative date correctly in subtitle for older transactions', () => {
      const res = getTransactionDisplay({
        categoryName: 'Dining',
        merchant: 'Starbucks',
        note: 'Latte & Croissant',
        date: new Date(2026, 9, 29, 14, 0, 0).toISOString(),
      });

      expect(res.title).toBe('Starbucks');
      expect(res.subtitle).toBe('Dining • 2 days ago');
    });
  });

  describe('Pinned transactions comparator sorting', () => {
    it('sorts pinned items to the top before unpinned items and orders chronologically within groups', () => {
      const items = [
        { id: '1', title: 'Unpinned New', isPinned: false, date: '2026-10-31T20:00:00Z' },
        { id: '2', title: 'Unpinned Old', isPinned: false, date: '2026-10-25T10:00:00Z' },
        { id: '3', title: 'Pinned Old', isPinned: true, date: '2026-10-20T10:00:00Z' },
        { id: '4', title: 'Pinned New', isPinned: true, date: '2026-10-30T10:00:00Z' },
      ];

      const sorted = [...items].sort((a, b) => {
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) return a.isPinned ? -1 : 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      expect(sorted.map(x => x.id)).toEqual(['4', '3', '1', '2']);
    });
  });
});

