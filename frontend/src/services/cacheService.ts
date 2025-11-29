import { logger } from '@/services/logger';
// Implements multi-level caching with Redis, browser cache, and memory cache

import React from 'react';

// Cache configuration factory
const createCacheConfig = () => ({
  // Memory cache
  memoryCacheSize: 1000,
  memoryCacheTTL: 5 * 60 * 1000,

  // Browser cache
  browserCacheSize: 500,
  browserCacheTTL: 15 * 60 * 1000,

  // Redis cache
  redisEnabled: false,
  redisTTL: 60 * 60 * 1000,

  // Cache strategies
  defaultStrategy: 'cache-first',
  strategies: new Map([
    ['api', 'network-first'],
    ['static', 'cache-first'],
    ['user', 'stale-while-revalidate'],
    ['project', 'network-first'],
    ['reconciliation', 'stale-while-revalidate'],
  ]),
});

// Cache strategies
export const CacheStrategy = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  CACHE_ONLY: 'cache-only',
  NETWORK_ONLY: 'network-only',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

// Cache entry factory
const createCacheEntry = (key: string, value: unknown, options: { ttl?: number; strategy?: string; tags?: string[]; metadata?: Record<string, unknown> } = {}) => ({
  key,
  value,
  timestamp: new Date(),
  ttl: options.ttl || 5 * 60 * 1000,
  strategy: options.strategy || 'cache-first',
  tags: options.tags || [],
  metadata: options.metadata || {},
});

// Cache statistics factory
const createCacheStats = () => ({
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  size: 0,
  memoryUsage: 0,
});

class CacheService {
  static instance = null;
  config;
  memoryCache = new Map();
  browserCache = new Map();
  stats = createCacheStats();
  cleanupInterval = null;

  static getInstance() {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  constructor() {
    this.config = createCacheConfig();
    this.init();
  }

  init() {
    // Load browser cache from localStorage
    this.loadBrowserCache();

    // Setup cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute

    // Setup memory monitoring
    this.setupMemoryMonitoring();
  }

  loadBrowserCache() {
    try {
      const cached = localStorage.getItem('cache_browser');
      if (cached) {
        const entries = JSON.parse(cached);
        entries.forEach((entry) => {
          this.browserCache.set(entry.key, {
            ...entry,
            timestamp: new Date(entry.timestamp),
          });
        });
      }
    } catch (error) {
      logger.error('Failed to load browser cache', { error });
    }
  }

  saveBrowserCache() {
    try {
      const entries = Array.from(this.browserCache.values());
      localStorage.setItem('cache_browser', JSON.stringify(entries));
    } catch (error) {
      logger.error('Failed to save browser cache', { error });
    }
  }

  setupMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
        if (memory) {
          this.stats.memoryUsage = memory.usedJSHeapSize;
        }
      }, 5000);
    }
  }

  // Public cache methods
  async get(key: string, strategy?: string) {
    const cacheStrategy = strategy || this.getStrategyForKey(key);

    switch (cacheStrategy) {
      case CacheStrategy.CACHE_FIRST:
        return this.cacheFirst(key);

      case CacheStrategy.NETWORK_FIRST:
        return this.networkFirst(key);

      case CacheStrategy.CACHE_ONLY:
        return this.cacheOnly(key);

      case CacheStrategy.NETWORK_ONLY:
        return this.networkOnly(key);

      case CacheStrategy.STALE_WHILE_REVALIDATE:
        return this.staleWhileRevalidate(key);

      default:
        return this.cacheFirst(key);
    }
  }

  async set(key: string, value: unknown, options: { ttl?: number; strategy?: string; tags?: string[]; metadata?: Record<string, unknown> } = {}) {
    const entry = createCacheEntry(key, value, {
      ttl: options.ttl || this.getTTLForKey(key),
      strategy: options.strategy || this.getStrategyForKey(key),
      tags: options.tags,
      metadata: options.metadata,
    });

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Store in browser cache
    this.browserCache.set(key, entry);
    this.saveBrowserCache();

    // Store in Redis if enabled
    if (this.config.redisEnabled) {
      await this.setRedis(key, entry);
    }

    this.stats.sets++;
    this.updateStats();
  }

  async delete(key) {
    this.memoryCache.delete(key);
    this.browserCache.delete(key);
    this.saveBrowserCache();

    if (this.config.redisEnabled) {
      await this.deleteRedis(key);
    }

    this.stats.deletes++;
    this.updateStats();
  }

  async clear(pattern) {
    if (pattern) {
      // Clear entries matching pattern
      const regex = new RegExp(pattern);

      for (const key of Array.from(this.memoryCache.keys())) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      }

      for (const key of Array.from(this.browserCache.keys())) {
        if (regex.test(key)) {
          this.browserCache.delete(key);
        }
      }

      this.saveBrowserCache();
    } else {
      // Clear all caches
      this.memoryCache.clear();
      this.browserCache.clear();
      this.saveBrowserCache();
    }

    this.updateStats();
  }

  async invalidateByTag(tag) {
    const keysToDelete = [];

    // Find keys with matching tag
    for (const [key, entry] of Array.from(this.memoryCache.entries())) {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    }

    // Delete matching entries
    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }

  // Cache strategy implementations
  async cacheFirst(key) {
    // Try memory cache first
    let entry = this.memoryCache.get(key);
    if (entry && !this.isExpired(entry)) {
      this.stats.hits++;
      return entry.value;
    }

    // Try browser cache
    entry = this.browserCache.get(key);
    if (entry && !this.isExpired(entry)) {
      this.stats.hits++;
      // Promote to memory cache
      this.memoryCache.set(key, entry);
      return entry.value;
    }

    // Try Redis cache
    if (this.config.redisEnabled) {
      const redisEntry = await this.getRedis(key);
      if (redisEntry && !this.isExpired(redisEntry)) {
        this.stats.hits++;
        // Promote to memory and browser cache
        this.memoryCache.set(key, redisEntry);
        this.browserCache.set(key, redisEntry);
        this.saveBrowserCache();
        return redisEntry.value;
      }
    }

    this.stats.misses++;
    return null;
  }

  async networkFirst(key) {
    // Try network first (this would typically be an API call)
    try {
      const networkValue = await this.fetchFromNetwork(key);
      if (networkValue !== null) {
        // Cache the result
        await this.set(key, networkValue);
        return networkValue;
      }
    } catch (error) {
      logger.warning('Network request failed, trying cache', { error });
    }

    // Fallback to cache
    return this.cacheFirst(key);
  }

  async cacheOnly(key) {
    return this.cacheFirst(key);
  }

  async networkOnly(key) {
    try {
      return await this.fetchFromNetwork(key);
    } catch (error) {
      logger.error('Network request failed', { error });
      return null;
    }
  }

  async staleWhileRevalidate(key) {
    // Get stale value from cache
    const staleValue = await this.cacheFirst(key);

    // Revalidate in background
    this.revalidateInBackground(key);

    return staleValue;
  }

  async revalidateInBackground(key) {
    try {
      const networkValue = await this.fetchFromNetwork(key);
      if (networkValue !== null) {
        await this.set(key, networkValue);
      }
    } catch (error) {
      logger.warning('Background revalidation failed', { error });
    }
  }

  // Network fetch simulation
  async fetchFromNetwork(key) {
    // This would typically make an actual API call
    // For now, return null to simulate network failure
    return null;
  }

  // Redis operations (simulated)
  /**
   * Get value from Redis cache.
   * 
   * NOTE: Redis integration is not yet implemented. This method is a placeholder.
   * 
   * @param key - Cache key
   * @returns Promise resolving to cached value or null
   */
  async getRedis(key: string): Promise<unknown> {
    // NOTE: Redis integration pending
    // When implemented, this will use a Redis client to retrieve cached values
    // For now, returns null to indicate no cached value
    return null;
  }

  /**
   * Set value in Redis cache.
   * 
   * NOTE: Redis integration is not yet implemented. This method is a placeholder.
   * 
   * @param key - Cache key
   * @param entry - Value to cache
   */
  async setRedis(key: string, entry: unknown): Promise<void> {
    // NOTE: Redis integration pending
    // When implemented, this will use a Redis client to store cached values
    // For now, this is a no-op
  }

  /**
   * Delete value from Redis cache.
   * 
   * NOTE: Redis integration is not yet implemented. This method is a placeholder.
   * 
   * @param key - Cache key to delete
   */
  async deleteRedis(key: string): Promise<void> {
    // NOTE: Redis integration pending
    // When implemented, this will use a Redis client to delete cached values
    // For now, this is a no-op
  }

  // Utility methods
  isExpired(entry) {
    const now = new Date();
    const expiryTime = new Date(entry.timestamp.getTime() + entry.ttl);
    return now > expiryTime;
  }

  getStrategyForKey(key) {
    // Determine strategy based on key prefix
    const prefixes = Array.from(this.config.strategies.keys());
    for (let i = 0; i < prefixes.length; i++) {
      const prefix = prefixes[i];
      if (key.startsWith(prefix)) {
        return this.config.strategies.get(prefix);
      }
    }
    return this.config.defaultStrategy;
  }

  getTTLForKey(key) {
    // Determine TTL based on key prefix
    if (key.startsWith('api/')) {
      return this.config.redisTTL;
    } else if (key.startsWith('static/')) {
      return this.config.browserCacheTTL;
    } else {
      return this.config.memoryCacheTTL;
    }
  }

  cleanup() {
    // Cleanup memory cache
    const memoryEntries = Array.from(this.memoryCache.entries());
    for (let i = 0; i < memoryEntries.length; i++) {
      const [key, entry] = memoryEntries[i];
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Cleanup browser cache
    const browserEntries = Array.from(this.browserCache.entries());
    for (let i = 0; i < browserEntries.length; i++) {
      const [key, entry] = browserEntries[i];
      if (this.isExpired(entry)) {
        this.browserCache.delete(key);
      }
    }

    // Enforce size limits
    this.enforceSizeLimits();

    this.saveBrowserCache();
    this.updateStats();
  }

  enforceSizeLimits() {
    // Memory cache size limit
    if (this.memoryCache.size > this.config.memoryCacheSize) {
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());

      const toDelete = entries.slice(0, this.memoryCache.size - this.config.memoryCacheSize);
      toDelete.forEach(([key]) => this.memoryCache.delete(key));
    }

    // Browser cache size limit
    if (this.browserCache.size > this.config.browserCacheSize) {
      const entries = Array.from(this.browserCache.entries());
      entries.sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());

      const toDelete = entries.slice(0, this.browserCache.size - this.config.browserCacheSize);
      toDelete.forEach(([key]) => this.browserCache.delete(key));
    }
  }

  updateStats() {
    this.stats.size = this.memoryCache.size + this.browserCache.size;
  }

  // Public utility methods
  getStats() {
    return { ...this.stats };
  }

  getMemoryUsage() {
    return this.stats.memoryUsage;
  }

  getCacheSize() {
    return this.stats.size;
  }

  getHitRate() {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  async preload(keys: string[]) {
    const promises = keys.map((key) => this.get(key, undefined));
    await Promise.all(promises);
  }

  async warmup(entries) {
    const promises = entries.map((entry) => this.set(entry.key, entry.value, { ttl: entry.ttl }));
    await Promise.all(promises);
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.memoryCache.clear();
    this.browserCache.clear();
  }
}

// React hook for caching
export const useCache = () => {
  const [stats, setStats] = React.useState(() => {
    const cache = CacheService.getInstance();
    return cache.getStats();
  });

  React.useEffect(() => {
    const cache = CacheService.getInstance();

    const updateStats = () => {
      setStats(cache.getStats());
    };

    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const cache = CacheService.getInstance();

  return {
    stats,
    get: cache.get.bind(cache),
    set: cache.set.bind(cache),
    delete: cache.delete.bind(cache),
    clear: cache.clear.bind(cache),
    invalidateByTag: cache.invalidateByTag.bind(cache),
    preload: cache.preload.bind(cache),
    warmup: cache.warmup.bind(cache),
    getHitRate: cache.getHitRate.bind(cache),
    getMemoryUsage: cache.getMemoryUsage.bind(cache),
    getCacheSize: cache.getCacheSize.bind(cache),
  };
};

// Cache decorator for functions
export const cached = (key, ttl, strategy) => {
  return function (target, propertyName, descriptor) {
    const method = descriptor.value;
    if (!method) {
      return descriptor;
    }
    const cache = CacheService.getInstance();

    descriptor.value = async function (...args) {
      const cacheKey = `${key}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cached = await cache.get(cacheKey, strategy);
      if (cached !== null) {
        return cached;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      await cache.set(cacheKey, result, { ttl });

      return result;
    };

    return descriptor;
  };
};

// Export singleton instance
export const cacheService = CacheService.getInstance();

export default cacheService;
