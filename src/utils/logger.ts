/**
 * Application Logger with PII / sensitive data redaction
 * and production environment silencing for debug/info levels.
 */

const SENSITIVE_KEYS = new Set([
  'token',
  'access_token',
  'refresh_token',
  'otp',
  'code',
  'pin',
  'newpin',
  'currentpin',
  'pinhash',
  'salt',
  'password',
  'secret',
  'authorization',
  'email',
  'amount',
  'balance',
  'currentbalance',
  'spentamount',
  'targetamount',
  'creditlimit',
  'monthlyincome',
  'financialamount',
]);

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const CODE_PARAM_REGEX = /([?&#](?:code|token|access_token|refresh_token|otp)=)[^&#\s]+/gi;

/**
 * Redacts sensitive fields, tokens, emails, PINs, auth query params, and amounts.
 */
export function redactSensitiveData(data: unknown, depth = 0): unknown {
  if (depth > 6) return '[MAX_DEPTH]';
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    let sanitized = data.replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
    sanitized = sanitized.replace(CODE_PARAM_REGEX, '$1[REDACTED]');
    return sanitized;
  }

  if (typeof data === 'number' || typeof data === 'boolean' || typeof data === 'bigint') {
    return data;
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: redactSensitiveData(data.message, depth + 1),
      stack: import.meta.env.PROD ? undefined : redactSensitiveData(data.stack, depth + 1),
    };
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, depth + 1));
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        if (lowerKey.includes('amount') || lowerKey.includes('balance') || lowerKey.includes('limit') || lowerKey.includes('income')) {
          result[key] = '[REDACTED_AMOUNT]';
        } else if (lowerKey.includes('email')) {
          result[key] = '[REDACTED_EMAIL]';
        } else if (lowerKey.includes('pin')) {
          result[key] = '[REDACTED_PIN]';
        } else {
          result[key] = '[REDACTED]';
        }
      } else {
        result[key] = redactSensitiveData(value, depth + 1);
      }
    }
    return result;
  }

  return data;
}

function shouldSilenceDebugInfo(): boolean {
  return import.meta.env.PROD;
}

export const logger = {
  debug(...args: unknown[]): void {
    if (shouldSilenceDebugInfo()) return;
    const sanitized = args.map((arg) => redactSensitiveData(arg));
    console.debug(...sanitized);
  },

  info(...args: unknown[]): void {
    if (shouldSilenceDebugInfo()) return;
    const sanitized = args.map((arg) => redactSensitiveData(arg));
    console.info(...sanitized);
  },

  warn(...args: unknown[]): void {
    const sanitized = args.map((arg) => redactSensitiveData(arg));
    console.warn(...sanitized);
  },

  error(...args: unknown[]): void {
    const sanitized = args.map((arg) => redactSensitiveData(arg));
    console.error(...sanitized);
  },
};
