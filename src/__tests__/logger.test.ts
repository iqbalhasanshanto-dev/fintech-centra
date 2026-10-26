import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, redactSensitiveData } from '../utils/logger';

describe('Logger utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('redactSensitiveData', () => {
    it('redacts email addresses in strings', () => {
      const input = 'User test.user@example.com logged in successfully';
      const output = redactSensitiveData(input);
      expect(output).toBe('User [REDACTED_EMAIL] logged in successfully');
    });

    it('redacts sensitive query params like ?code= or &token= in URLs', () => {
      const url = 'com.centra.app://auth/callback?code=super-secret-pkce-code&state=xyz';
      const output = redactSensitiveData(url);
      expect(output).toContain('?code=[REDACTED]');
      expect(output).not.toContain('super-secret-pkce-code');
    });

    it('redacts sensitive object fields (tokens, passwords, PINs, OTP)', () => {
      const payload = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        otp: '123456',
        pin: '9876',
        password: 'myPassword123',
        normalField: 'safeValue',
      };
      const sanitized = redactSensitiveData(payload) as Record<string, unknown>;
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.otp).toBe('[REDACTED]');
      expect(sanitized.pin).toBe('[REDACTED_PIN]');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.normalField).toBe('safeValue');
    });

    it('redacts financial amounts and balances in objects', () => {
      const transactionData = {
        id: 'tx_123',
        amount: 450.5,
        balance: 12000.0,
        creditLimit: 5000,
        description: 'Groceries at Supermarket',
      };
      const sanitized = redactSensitiveData(transactionData) as Record<string, unknown>;
      expect(sanitized.amount).toBe('[REDACTED_AMOUNT]');
      expect(sanitized.balance).toBe('[REDACTED_AMOUNT]');
      expect(sanitized.creditLimit).toBe('[REDACTED_AMOUNT]');
      expect(sanitized.description).toBe('Groceries at Supermarket');
    });

    it('handles nested objects, arrays, and Error instances', () => {
      const err = new Error('Failed to send token to user@domain.com');
      const sanitizedErr = redactSensitiveData(err) as { name: string; message: string };
      expect(sanitizedErr.name).toBe('Error');
      expect(sanitizedErr.message).toBe('Failed to send token to [REDACTED_EMAIL]');

      const nested = {
        users: [{ email: 'admin@centra.app', amount: 99 }],
      };
      const sanitizedNested = redactSensitiveData(nested) as { users: Array<{ email: string; amount: string }> };
      expect(sanitizedNested.users[0].email).toBe('[REDACTED_EMAIL]');
      expect(sanitizedNested.users[0].amount).toBe('[REDACTED_AMOUNT]');
    });
  });

  describe('logger methods', () => {
    it('warn and error always output sanitized messages', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logger.warn('Warning for secret@example.com with pin', { pin: '1234' });
      expect(warnSpy).toHaveBeenCalledWith(
        'Warning for [REDACTED_EMAIL] with pin',
        { pin: '[REDACTED_PIN]' }
      );

      logger.error('Error with token', { token: 'secret-token', amount: 50 });
      expect(errorSpy).toHaveBeenCalledWith(
        'Error with token',
        { token: '[REDACTED]', amount: '[REDACTED_AMOUNT]' }
      );
    });

    it('silences debug and info when PROD is true', () => {
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      // In Vitest test environment, import.meta.env.PROD is false
      logger.info('Test info message');
      expect(infoSpy).toHaveBeenCalledWith('Test info message');

      // Test with PROD overridden
      const originalProd = import.meta.env.PROD;
      try {
        (import.meta.env as Record<string, unknown>).PROD = true;
        debugSpy.mockClear();
        infoSpy.mockClear();

        logger.debug('Production debug should be silent');
        logger.info('Production info should be silent');

        expect(debugSpy).not.toHaveBeenCalled();
        expect(infoSpy).not.toHaveBeenCalled();
      } finally {
        (import.meta.env as Record<string, unknown>).PROD = originalProd;
      }
    });
  });
});
