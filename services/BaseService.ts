// Generic Service Base Classes
// Provides common functionality for all services to reduce duplication

// Factory functions for creating objects
export const createServiceConfig = (config = {}) => ({
  enabled: true,
  persistence: false,
  caching: false,
  events: false,
  compression: false,
  encryption: false,
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
  listeners = new Map();
  config;
  cache = new Map();
  timers = new Map();

  constructor(config = { enabled: true }) {
    this.config = createServiceConfig(config);
  }

  // Abstract methods that must be implemented by subclasses
  save() {
    throw new Error('save() method must be implemented by subclass');
  }

  load() {
    throw new Error('load() method must be implemented by subclass');
  }

  validate(data) {
    throw new Error('validate() method must be implemented by subclass');
  }

  // Common CRUD operations
  get(id) {
    if (!this.config.enabled) return undefined;

    // Check cache first
    if (this.config.caching && this.cache.has(id)) {
      return this.cache.get(id);
    }

    const item = this.data.get(id);

    // Cache result
    if (this.config.caching && item) {
      this.cache.set(id, item);
    }

    return item;
  }

  set(id, value) {
    if (!this.config.enabled) return false;

    // Validate data
    if (!this.validate(value)) {
      this.emit('validationError', { id, value });
      return false;
    }

    this.data.set(id, value);

    // Update cache
    if (this.config.caching) {
      this.cache.set(id, value);
    }

    // Persist if enabled
    if (this.config.persistence) {
      this.save();
    }

    this.emit('dataChanged', { id, value });
    return true;
  }

  delete(id) {
    if (!this.config.enabled) return false;

    const deleted = this.data.delete(id);

    if (deleted) {
      // Remove from cache
      if (this.config.caching) {
        this.cache.delete(id);
      }

      // Persist if enabled
      if (this.config.persistence) {
        this.save();
      }

      this.emit('dataDeleted', { id });
    }

    return deleted;
  }

  getAll() {
    if (!this.config.enabled) return [];
    return Array.from(this.data.values());
  }

  has(id) {
    if (!this.config.enabled) return false;
    return this.data.has(id);
  }

  size() {
    return this.data.size;
  }

  clear() {
    this.data.clear();
    this.cache.clear();

    // Clear timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    if (this.config.persistence) {
      this.save();
    }

    this.emit('dataCleared', {});
  }

  // Event system
  addListener(eventType, callback) {
    if (!this.config.events) return;

    const key = `${eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.listeners.set(key, callback);
  }

  removeListener(eventType) {
    if (!this.config.events) return;

    for (const [key, listener] of this.listeners.entries()) {
      if (key.startsWith(eventType)) {
        this.listeners.delete(key);
      }
    }
  }

  emit(eventType, data) {
    if (!this.config.events) return;

    const event = createServiceEvent(eventType, data, this.constructor.name);

    for (const listener of this.listeners.values()) {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    }
  }

  // Utility methods
  generateId() {
    return `${this.constructor.name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setTimer(id, callback, delay) {
    // Clear existing timer
    const existingTimer = this.timers.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      callback();
      this.timers.delete(id);
    }, delay);

    this.timers.set(id, timer);
  }

  clearTimer(id) {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  // Configuration methods
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', { config: this.config });
  }

  getConfig() {
    return { ...this.config };
  }

  // Cleanup method
  cleanup() {
    // Clear timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // Clear listeners
    this.listeners.clear();

    // Clear cache
    this.cache.clear();

    this.emit('serviceCleanedUp', {});
  }
}

export interface ServiceEvent {
  type: string;
  data: any;
  timestamp: number;
  source: string;
}

export abstract class BaseService<T> {
  protected data: Map<string, T> = new Map();
  protected listeners: Map<string, (event: ServiceEvent) => void> = new Map();
  protected config: ServiceConfig;
  protected cache: Map<string, any> = new Map();
  protected timers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: ServiceConfig = { enabled: true }) {
    this.config = {
      enabled: true,
      persistence: false,
      caching: false,
      events: false,
      compression: false,
      encryption: false,
      ...config,
    };
  }

  // Abstract methods that must be implemented by subclasses
  abstract save(): void;
  abstract load(): void;
  abstract validate(data: T): boolean;

  // Common CRUD operations
  public get(id: string): T | undefined {
    if (!this.config.enabled) return undefined;

    // Check cache first
    if (this.config.caching && this.cache.has(id)) {
      return this.cache.get(id);
    }

    const item = this.data.get(id);

    // Cache the result
    if (this.config.caching && item) {
      this.cache.set(id, item);
    }

    return item;
  }

  public set(id: string, value: T): boolean {
    if (!this.config.enabled) return false;

    // Validate the data
    if (!this.validate(value)) {
      this.emit('validationError', { id, value });
      return false;
    }

    this.data.set(id, value);

    // Update cache
    if (this.config.caching) {
      this.cache.set(id, value);
    }

    // Persist if enabled
    if (this.config.persistence) {
      this.save();
    }

    this.emit('dataChanged', { id, value });
    return true;
  }

  public delete(id: string): boolean {
    if (!this.config.enabled) return false;

    const deleted = this.data.delete(id);

    if (deleted) {
      // Remove from cache
      if (this.config.caching) {
        this.cache.delete(id);
      }

      // Persist if enabled
      if (this.config.persistence) {
        this.save();
      }

      this.emit('dataDeleted', { id });
    }

    return deleted;
  }

  public getAll(): T[] {
    if (!this.config.enabled) return [];
    return Array.from(this.data.values());
  }

  public has(id: string): boolean {
    if (!this.config.enabled) return false;
    return this.data.has(id);
  }

  public size(): number {
    return this.data.size;
  }

  public clear(): void {
    this.data.clear();
    this.cache.clear();

    // Clear timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    if (this.config.persistence) {
      this.save();
    }

    this.emit('dataCleared', {});
  }

  // Event system
  public addListener(eventType: string, callback: (event: ServiceEvent) => void): void {
    if (!this.config.events) return;

    const key = `${eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.listeners.set(key, callback);
  }

  public removeListener(eventType: string): void {
    if (!this.config.events) return;

    for (const [key, listener] of this.listeners.entries()) {
      if (key.startsWith(eventType)) {
        this.listeners.delete(key);
      }
    }
  }

  protected emit(eventType: string, data: any): void {
    if (!this.config.events) return;

    const event: ServiceEvent = {
      type: eventType,
      data,
      timestamp: Date.now(),
      source: this.constructor.name,
    };

    for (const listener of this.listeners.values()) {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    }
  }

  // Utility methods
  protected generateId(): string {
    return `${this.constructor.name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected setTimer(id: string, callback: () => void, delay: number): void {
    // Clear existing timer
    const existingTimer = this.timers.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      callback();
      this.timers.delete(id);
    }, delay);

    this.timers.set(id, timer);
  }

  protected clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  // Configuration methods
  public updateConfig(newConfig: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', { config: this.config });
  }

  public getConfig(): ServiceConfig {
    return { ...this.config };
  }

  // Cleanup method
  public cleanup(): void {
    // Clear timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // Clear listeners
    this.listeners.clear();

    // Clear cache
    this.cache.clear();

    this.emit('serviceCleanedUp', {});
  }
}

// Specialized service base classes for common patterns

export abstract class PersistenceService<T> extends BaseService<T> {
  protected storageKey: string;

  constructor(storageKey: string, config: ServiceConfig = {}) {
    super({ ...config, persistence: true });
    this.storageKey = storageKey;
    this.load();
  }

  public save(): void {
    try {
      const data = Array.from(this.data.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save ${this.storageKey}:`, error);
    }
  }

  public load(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.data = new Map(data);
      }
    } catch (error) {
      console.error(`Failed to load ${this.storageKey}:`, error);
    }
  }
}

export abstract class CachingService<T> extends BaseService<T> {
  protected cacheTimeout: number = 300000; // 5 minutes default

  constructor(config: ServiceConfig = {}) {
    super({ ...config, caching: true });
  }

  public get(id: string): T | undefined {
    const cached = this.cache.get(id);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const item = this.data.get(id);
    if (item) {
      this.cache.set(id, {
        data: item,
        timestamp: Date.now(),
      });
    }

    return item;
  }

  public setCacheTimeout(timeout: number): void {
    this.cacheTimeout = timeout;
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export abstract class EventService<T> extends BaseService<T> {
  constructor(config: ServiceConfig = {}) {
    super({ ...config, events: true });
  }

  // Additional event methods can be added here
  public emitToAll(eventType: string, data: any): void {
    this.emit(eventType, data);
  }
}
