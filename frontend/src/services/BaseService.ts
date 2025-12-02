/**
 * Base Service Module
 * Provides foundation classes for services with caching, persistence, and event handling
 */

type EventCallback = (data: unknown) => void;

export interface BaseServiceOptions {
  persistence?: boolean;
  storageKey?: string;
}

/**
 * Base Service class with event emitter functionality
 */
export abstract class BaseService<T> {
  protected cache: Map<string, T> = new Map();
  private listeners: Map<string, Set<EventCallback>> = new Map();
  protected options: BaseServiceOptions;

  constructor(options: BaseServiceOptions = {}) {
    this.options = options;
    if (options.persistence) {
      this.loadFromStorage();
    }
  }

  /**
   * Generate a unique ID
   */
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set a value in the cache
   */
  public set(key: string, value: T): void {
    this.cache.set(key, value);
    if (this.options.persistence) {
      this.saveToStorage();
    }
  }

  /**
   * Get a value from the cache
   */
  public get(key: string): T | undefined {
    return this.cache.get(key);
  }

  /**
   * Delete a value from the cache
   */
  public delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (this.options.persistence) {
      this.saveToStorage();
    }
    return result;
  }

  /**
   * Check if a key exists
   */
  public has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get all values
   */
  public getAll(): T[] {
    return Array.from(this.cache.values());
  }

  /**
   * Clear all values
   */
  public clear(): void {
    this.cache.clear();
    if (this.options.persistence) {
      this.saveToStorage();
    }
  }

  /**
   * Register an event listener
   */
  public on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  /**
   * Remove an event listener
   */
  public off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emit an event
   */
  protected emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Save cache to local storage
   */
  private saveToStorage(): void {
    try {
      const storageKey = this.options.storageKey || this.constructor.name;
      const data = Array.from(this.cache.entries());
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to storage:', error);
    }
  }

  /**
   * Load cache from local storage
   */
  private loadFromStorage(): void {
    try {
      const storageKey = this.options.storageKey || this.constructor.name;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const data = JSON.parse(stored) as [string, T][];
        this.cache = new Map(data);
      }
    } catch (error) {
      console.warn('Failed to load from storage:', error);
    }
  }
}

/**
 * Persistence Service with additional storage features
 */
export abstract class PersistenceService<T> extends BaseService<T> {
  constructor(options: BaseServiceOptions = {}) {
    super({ ...options, persistence: true });
  }

  /**
   * Add a new item
   */
  public add(value: T): string {
    const id = this.generateId();
    this.set(id, value);
    return id;
  }

  /**
   * Update an existing item
   */
  public update(id: string, updates: Partial<T>): boolean {
    const current = this.get(id);
    if (!current) return false;

    const updated = { ...current, ...updates };
    this.set(id, updated);
    return true;
  }

  /**
   * Find items matching a predicate
   */
  public find(predicate: (value: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }

  /**
   * Find first item matching a predicate
   */
  public findOne(predicate: (value: T) => boolean): T | undefined {
    return this.getAll().find(predicate);
  }
}

export default BaseService;
