// Unified Base Service Architecture
import { logger } from '@/services/logger';
// Factory functions for creating objects
export const createServiceConfig = (config = {}) => ({
  persistence: false,
  caching: false,
  retries: 3,
  timeout: 5000,
  ...config,
});

export const createServiceEvent = (type: string, data: unknown, source = '') => ({
  type,
  data,
  timestamp: Date.now(),
  source,
});

export class BaseService<T = unknown> {
  data = new Map<string, T>();
  config: ReturnType<typeof createServiceConfig>;
  listeners = new Map<string, Array<(data: unknown) => void>>();

  constructor(config = {}) {
    this.config = createServiceConfig(config);
    this.listeners = new Map();
  }

  get(id: string): T | undefined {
    return this.data.get(id);
  }

  set(id: string, value: T): void {
    this.data.set(id, value);
    this.emit('change', { id, value });
  }

  delete(id: string): void {
    this.data.delete(id);
    this.emit('delete', { id });
  }

  subscribe(event: string, callback: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  unsubscribe(event: string, callback: (data: unknown) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  cleanup() {
    this.data.clear();
    this.listeners.clear();
  }
}

export class PersistenceService<T = unknown> extends BaseService<T> {
  storageKey: string;

  constructor(storageKey: string, config = {}) {
    super({ ...config, persistence: true });
    this.storageKey = storageKey;
    this.load();
  }

  save(): void {
    try {
      const data = Array.from(this.data.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      logger.error(`Failed to save ${this.storageKey}:`, { error });
    }
  }

  load(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored) as Array<[string, T]>;
        this.data = new Map(data);
      }
    } catch (error) {
      logger.error(`Failed to load ${this.storageKey}:`, { error });
    }
  }
}

export class CachingService<T = unknown> extends BaseService<T> {
  cache = new Map<string, { value: T; timestamp: number; ttl: number }>();

  constructor(config = {}) {
    super({ ...config, caching: true });
    this.cache = new Map();
  }

  getCached(key: string): T | undefined {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.value;
    }
    this.cache.delete(key);
    return undefined;
  }

  setCached(key: string, value: T, ttl = 300000): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }
}
