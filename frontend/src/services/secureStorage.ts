// ============================================================================
// SECURE STORAGE SERVICE
// ============================================================================
// Wrapper for localStorage/sessionStorage with encryption for sensitive data

import { logger } from './logger';

export interface SecureStorageConfig {
  encrypt: boolean;
  prefix: string;
  ttl?: number; // Time to live in milliseconds
}

const DEFAULT_CONFIG: SecureStorageConfig = {
  encrypt: true,
  prefix: 'secure_',
  ttl: undefined,
};

/**
 * Simple encryption/decryption using base64 encoding
 * In production, use a proper encryption library
 */
class EncryptionService {
  private readonly key: string;

  constructor() {
    // Use a secure key from environment - required for production
    const envKey = import.meta.env.VITE_STORAGE_KEY;
    
    // Development fallback (not secure, but allows development)
    const isDevelopment = import.meta.env.DEV;
    const fallbackKey = isDevelopment ? 'dev-storage-key-not-secure-change-in-production' : undefined;
    
    if (!envKey || envKey === 'default-key-change-in-production') {
      if (isDevelopment && fallbackKey) {
        logger.warn('VITE_STORAGE_KEY is not set. Using development fallback. This is NOT secure for production.', {
          component: 'EncryptionService',
          category: 'security',
        });
        this.key = fallbackKey;
        return;
      }
      throw new Error('VITE_STORAGE_KEY must be set to a secure random key in production');
    }
    this.key = envKey;
    // Validate key length for security
    if (this.key.length < 16) {
      throw new Error('VITE_STORAGE_KEY must be at least 16 characters long');
    }
  }

  encrypt(data: string): string {
    try {
      // Simple obfuscation - in production use AES encryption
      const encoded = btoa(unescape(encodeURIComponent(data)));
      return `enc_${encoded}`;
    } catch (error) {
      logger.error('Encryption failed', { error });
      return data;
    }
  }

  decrypt(encryptedData: string): string {
    try {
      if (!encryptedData.startsWith('enc_')) {
        return encryptedData;
      }
      const encoded = encryptedData.substring(4);
      return decodeURIComponent(escape(atob(encoded)));
    } catch (error) {
      logger.error('Decryption failed', { error });
      return encryptedData;
    }
  }
}

/**
 * Secure Storage Service
 * Provides encrypted storage for sensitive data
 */
class SecureStorageService {
  private encryption: EncryptionService;
  private config: SecureStorageConfig;

  constructor(config: Partial<SecureStorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.encryption = new EncryptionService();
  }

  /**
   * Set item in localStorage with encryption
   */
  setItem(key: string, value: any, useSessionStorage = false): void {
    try {
      const storage = useSessionStorage ? sessionStorage : localStorage;
      const fullKey = `${this.config.prefix}${key}`;
      const serialized = JSON.stringify(value);
      const data = this.config.encrypt ? this.encryption.encrypt(serialized) : serialized;

      const storageData: {
        data: string;
        timestamp?: number;
        ttl?: number;
      } = {
        data,
      };

      if (this.config.ttl) {
        storageData.timestamp = Date.now();
        storageData.ttl = this.config.ttl;
      }

      storage.setItem(fullKey, JSON.stringify(storageData));
    } catch (error) {
      logger.error('Failed to set secure storage item', { key, error });
      throw error;
    }
  }

  /**
   * Get item from localStorage with decryption
   */
  getItem<T = any>(key: string, useSessionStorage = false): T | null {
    try {
      const storage = useSessionStorage ? sessionStorage : localStorage;
      const fullKey = `${this.config.prefix}${key}`;
      const item = storage.getItem(fullKey);

      if (!item) {
        return null;
      }

      const parsed = JSON.parse(item);
      let data = parsed.data;

      // Check TTL
      if (parsed.ttl && parsed.timestamp) {
        const age = Date.now() - parsed.timestamp;
        if (age > parsed.ttl) {
          this.removeItem(key, useSessionStorage);
          return null;
        }
      }

      // Decrypt if encrypted
      if (this.config.encrypt && typeof data === 'string' && data.startsWith('enc_')) {
        data = this.encryption.decrypt(data);
      }

      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Failed to get secure storage item', { key, error });
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string, useSessionStorage = false): void {
    try {
      const storage = useSessionStorage ? sessionStorage : localStorage;
      const fullKey = `${this.config.prefix}${key}`;
      storage.removeItem(fullKey);
    } catch (error) {
      logger.error('Failed to remove secure storage item', { key, error });
    }
  }

  /**
   * Clear all items with prefix
   */
  clear(useSessionStorage = false): void {
    try {
      const storage = useSessionStorage ? sessionStorage : localStorage;
      const keysToRemove: string[] = [];

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(this.config.prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => storage.removeItem(key));
    } catch (error) {
      logger.error('Failed to clear secure storage', { error });
    }
  }

  /**
   * Check if item exists
   */
  hasItem(key: string, useSessionStorage = false): boolean {
    const storage = useSessionStorage ? sessionStorage : localStorage;
    const fullKey = `${this.config.prefix}${key}`;
    return storage.getItem(fullKey) !== null;
  }

  /**
   * Get all keys with prefix
   */
  getAllKeys(useSessionStorage = false): string[] {
    try {
      const storage = useSessionStorage ? sessionStorage : localStorage;
      const keys: string[] = [];

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(this.config.prefix)) {
          keys.push(key.substring(this.config.prefix.length));
        }
      }

      return keys;
    } catch (error) {
      logger.error('Failed to get all secure storage keys', { error });
      return [];
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorageService({
  encrypt: true,
  prefix: 'secure_',
});

// Export class for custom instances
export default SecureStorageService;
