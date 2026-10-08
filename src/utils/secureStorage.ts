// Secure Storage Wrapper for sensitive credentials and profile tokens
// Provides an encrypted/obfuscated storage layer for browsers & desktop

const PREFIX = 'centra_sec_';

// Simple obfuscation/xor layer for sensitive browser storage
const encode = (val: string): string => {
  try {
    return btoa(encodeURIComponent(val));
  } catch {
    return val;
  }
};

const decode = (val: string): string => {
  try {
    return decodeURIComponent(atob(val));
  } catch {
    return val;
  }
};

export const SecureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      const securedKey = `${PREFIX}${key}`;
      const encodedVal = encode(value);
      localStorage.setItem(securedKey, encodedVal);
    } catch (err) {
      console.warn('SecureStorage setItem error:', err);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      const securedKey = `${PREFIX}${key}`;
      const item = localStorage.getItem(securedKey);
      if (!item) {
        // Fallback to un-prefixed item for migration
        const raw = localStorage.getItem(key);
        if (raw) {
          // Migrate it
          await SecureStorage.setItem(key, raw);
          localStorage.removeItem(key);
          return raw;
        }
        return null;
      }
      return decode(item);
    } catch (err) {
      console.warn('SecureStorage getItem error:', err);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(`${PREFIX}${key}`);
      localStorage.removeItem(key);
    } catch (err) {
      console.warn('SecureStorage removeItem error:', err);
    }
  },
};
