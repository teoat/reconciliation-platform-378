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

export const createServiceEvent = (type, data, source = '') => ({
  type,
  data,
  timestamp: Date.now(),
  source,
});

export class BaseService {
  data = new Map();
  config;
  listeners = new Map();

  constructor(config = {}) {
    this.config = createServiceConfig(config);
    this.listeners = new Map();
  }

  get(id) {
    return this.data.get(id);
  }

  set(id, value) {
    this.data.set(id, value);
    this.emit('change', { id, value });
  }

  delete(id) {
    this.data.delete(id);
    this.emit('delete', { id });
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  unsubscribe(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
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

export class PersistenceService extends BaseService {
  storageKey;

  constructor(storageKey, config = {}) {
    super({ ...config, persistence: true });
    this.storageKey = storageKey;
    this.load();
  }

  save() {
    try {
      const data = Array.from(this.data.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      logger.error(`Failed to save ${this.storageKey}:`, { error });
    }
  }

  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.data = new Map(data);
      }
    } catch (error) {
      logger.error(`Failed to load ${this.storageKey}:`, { error });
    }
  }
}

export class CachingService extends BaseService {
  cache = new Map();

  constructor(config = {}) {
    super({ ...config, caching: true });
    this.cache = new Map();
  }

  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.value;
    }
    this.cache.delete(key);
    return undefined;
  }

  setCached(key, value, ttl = 300000) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }
}
