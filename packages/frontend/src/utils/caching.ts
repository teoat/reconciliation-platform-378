// ============================================================================
// CACHING UTILITIES - SINGLE SOURCE OF TRUTH
// ============================================================================

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface CacheConfig {
  maxAge: number
  staleWhileRevalidate: number
  maxSize: number
  ttl: number
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  accessCount: number
  lastAccessed: number
}

export interface CacheStats {
  hits: number
  misses: number
  size: number
  maxSize: number
  hitRate: number
  missRate: number
}

// ============================================================================
// MEMORY CACHE IMPLEMENTATION
// ============================================================================

export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private config: CacheConfig
  private stats = {
    hits: 0,
    misses: 0,
  }

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxAge: 5 * 60 * 1000, // 5 minutes
      staleWhileRevalidate: 10 * 60 * 1000, // 10 minutes
      maxSize: 100,
      ttl: 15 * 60 * 1000, // 15 minutes
      ...config,
    }
  }

  // Set cache entry
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const expiresAt = now + (ttl || this.config.ttl)

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
      accessCount: 0,
      lastAccessed: now,
    })
  }

  // Get cache entry
  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    const now = Date.now()

    // Check if entry is expired
    if (now > entry.expiresAt) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = now
    this.stats.hits++

    return entry.data
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    const now = Date.now()
    if (now > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  // Delete cache entry
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear()
    this.stats.hits = 0
    this.stats.misses = 0
  }

  // Get cache statistics
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      missRate: total > 0 ? this.stats.misses / total : 0,
    }
  }

  // Evict oldest entries
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  // Clean expired entries
  cleanExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// ============================================================================
// LOCAL STORAGE CACHE IMPLEMENTATION
// ============================================================================

export class LocalStorageCache<T = any> {
  private prefix: string
  private config: CacheConfig

  constructor(prefix: string = 'cache_', config: Partial<CacheConfig> = {}) {
    this.prefix = prefix
    this.config = {
      maxAge: 5 * 60 * 1000, // 5 minutes
      staleWhileRevalidate: 10 * 60 * 1000, // 10 minutes
      maxSize: 50,
      ttl: 15 * 60 * 1000, // 15 minutes
      ...config,
    }
  }

  // Set cache entry
  set(key: string, data: T, ttl?: number): void {
    try {
      const now = Date.now()
      const expiresAt = now + (ttl || this.config.ttl)

      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt,
        accessCount: 0,
        lastAccessed: now,
      }

      localStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(entry)
      )
    } catch (error) {
      console.warn('Failed to set cache entry:', error)
    }
  }

  // Get cache entry
  get(key: string): T | null {
    try {
      const stored = localStorage.getItem(`${this.prefix}${key}`)
      
      if (!stored) {
        return null
      }

      const entry: CacheEntry<T> = JSON.parse(stored)
      const now = Date.now()

      // Check if entry is expired
      if (now > entry.expiresAt) {
        localStorage.removeItem(`${this.prefix}${key}`)
        return null
      }

      // Update access statistics
      entry.accessCount++
      entry.lastAccessed = now
      localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(entry))

      return entry.data
    } catch (error) {
      console.warn('Failed to get cache entry:', error)
      return null
    }
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    try {
      const stored = localStorage.getItem(`${this.prefix}${key}`)
      
      if (!stored) {
        return false
      }

      const entry: CacheEntry<T> = JSON.parse(stored)
      const now = Date.now()

      if (now > entry.expiresAt) {
        localStorage.removeItem(`${this.prefix}${key}`)
        return false
      }

      return true
    } catch (error) {
      console.warn('Failed to check cache entry:', error)
      return false
    }
  }

  // Delete cache entry
  delete(key: string): boolean {
    try {
      localStorage.removeItem(`${this.prefix}${key}`)
      return true
    } catch (error) {
      console.warn('Failed to delete cache entry:', error)
      return false
    }
  }

  // Clear all cache entries
  clear(): void {
    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn('Failed to clear cache:', error)
    }
  }

  // Clean expired entries
  cleanExpired(): void {
    try {
      const keys = Object.keys(localStorage)
      const now = Date.now()

      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          const stored = localStorage.getItem(key)
          if (stored) {
            try {
              const entry: CacheEntry<T> = JSON.parse(stored)
              if (now > entry.expiresAt) {
                localStorage.removeItem(key)
              }
            } catch (error) {
              // Remove corrupted entries
              localStorage.removeItem(key)
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clean expired cache entries:', error)
    }
  }
}

// ============================================================================
// SESSION STORAGE CACHE IMPLEMENTATION
// ============================================================================

export class SessionStorageCache<T = any> {
  private prefix: string
  private config: CacheConfig

  constructor(prefix: string = 'session_cache_', config: Partial<CacheConfig> = {}) {
    this.prefix = prefix
    this.config = {
      maxAge: 5 * 60 * 1000, // 5 minutes
      staleWhileRevalidate: 10 * 60 * 1000, // 10 minutes
      maxSize: 50,
      ttl: 15 * 60 * 1000, // 15 minutes
      ...config,
    }
  }

  // Set cache entry
  set(key: string, data: T, ttl?: number): void {
    try {
      const now = Date.now()
      const expiresAt = now + (ttl || this.config.ttl)

      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt,
        accessCount: 0,
        lastAccessed: now,
      }

      sessionStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(entry)
      )
    } catch (error) {
      console.warn('Failed to set session cache entry:', error)
    }
  }

  // Get cache entry
  get(key: string): T | null {
    try {
      const stored = sessionStorage.getItem(`${this.prefix}${key}`)
      
      if (!stored) {
        return null
      }

      const entry: CacheEntry<T> = JSON.parse(stored)
      const now = Date.now()

      // Check if entry is expired
      if (now > entry.expiresAt) {
        sessionStorage.removeItem(`${this.prefix}${key}`)
        return null
      }

      // Update access statistics
      entry.accessCount++
      entry.lastAccessed = now
      sessionStorage.setItem(`${this.prefix}${key}`, JSON.stringify(entry))

      return entry.data
    } catch (error) {
      console.warn('Failed to get session cache entry:', error)
      return null
    }
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    try {
      const stored = sessionStorage.getItem(`${this.prefix}${key}`)
      
      if (!stored) {
        return false
      }

      const entry: CacheEntry<T> = JSON.parse(stored)
      const now = Date.now()

      if (now > entry.expiresAt) {
        sessionStorage.removeItem(`${this.prefix}${key}`)
        return false
      }

      return true
    } catch (error) {
      console.warn('Failed to check session cache entry:', error)
      return false
    }
  }

  // Delete cache entry
  delete(key: string): boolean {
    try {
      sessionStorage.removeItem(`${this.prefix}${key}`)
      return true
    } catch (error) {
      console.warn('Failed to delete session cache entry:', error)
      return false
    }
  }

  // Clear all cache entries
  clear(): void {
    try {
      const keys = Object.keys(sessionStorage)
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          sessionStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn('Failed to clear session cache:', error)
    }
  }

  // Clean expired entries
  cleanExpired(): void {
    try {
      const keys = Object.keys(sessionStorage)
      const now = Date.now()

      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          const stored = sessionStorage.getItem(key)
          if (stored) {
            try {
              const entry: CacheEntry<T> = JSON.parse(stored)
              if (now > entry.expiresAt) {
                sessionStorage.removeItem(key)
              }
            } catch (error) {
              // Remove corrupted entries
              sessionStorage.removeItem(key)
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clean expired session cache entries:', error)
    }
  }
}

// ============================================================================
// MULTI-LEVEL CACHE IMPLEMENTATION
// ============================================================================

export class MultiLevelCache<T = any> {
  private memoryCache: MemoryCache<T>
  private localStorageCache: LocalStorageCache<T>
  private sessionStorageCache: SessionStorageCache<T>
  private config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxAge: 5 * 60 * 1000, // 5 minutes
      staleWhileRevalidate: 10 * 60 * 1000, // 10 minutes
      maxSize: 100,
      ttl: 15 * 60 * 1000, // 15 minutes
      ...config,
    }

    this.memoryCache = new MemoryCache(this.config)
    this.localStorageCache = new LocalStorageCache('ml_cache_', this.config)
    this.sessionStorageCache = new SessionStorageCache('ml_session_', this.config)
  }

  // Set cache entry
  set(key: string, data: T, ttl?: number): void {
    this.memoryCache.set(key, data, ttl)
    this.localStorageCache.set(key, data, ttl)
    this.sessionStorageCache.set(key, data, ttl)
  }

  // Get cache entry
  get(key: string): T | null {
    // Try memory cache first
    let data = this.memoryCache.get(key)
    if (data !== null) {
      return data
    }

    // Try session storage cache
    data = this.sessionStorageCache.get(key)
    if (data !== null) {
      // Populate memory cache
      this.memoryCache.set(key, data)
      return data
    }

    // Try local storage cache
    data = this.localStorageCache.get(key)
    if (data !== null) {
      // Populate memory and session caches
      this.memoryCache.set(key, data)
      this.sessionStorageCache.set(key, data)
      return data
    }

    return null
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    return this.memoryCache.has(key) || 
           this.sessionStorageCache.has(key) || 
           this.localStorageCache.has(key)
  }

  // Delete cache entry
  delete(key: string): boolean {
    const memoryDeleted = this.memoryCache.delete(key)
    const sessionDeleted = this.sessionStorageCache.delete(key)
    const localDeleted = this.localStorageCache.delete(key)
    
    return memoryDeleted || sessionDeleted || localDeleted
  }

  // Clear all cache entries
  clear(): void {
    this.memoryCache.clear()
    this.localStorageCache.clear()
    this.sessionStorageCache.clear()
  }

  // Clean expired entries
  cleanExpired(): void {
    this.memoryCache.cleanExpired()
    this.localStorageCache.cleanExpired()
    this.sessionStorageCache.cleanExpired()
  }

  // Get combined cache statistics
  getStats(): CacheStats {
    const memoryStats = this.memoryCache.getStats()
    const sessionStats = this.sessionStorageCache.getStats()
    const localStats = this.localStorageCache.getStats()

    return {
      hits: memoryStats.hits + sessionStats.hits + localStats.hits,
      misses: memoryStats.misses + sessionStats.misses + localStats.misses,
      size: memoryStats.size + sessionStats.size + localStats.size,
      maxSize: memoryStats.maxSize + sessionStats.maxSize + localStats.maxSize,
      hitRate: (memoryStats.hitRate + sessionStats.hitRate + localStats.hitRate) / 3,
      missRate: (memoryStats.missRate + sessionStats.missRate + localStats.missRate) / 3,
    }
  }
}

// ============================================================================
// CACHE UTILITIES
// ============================================================================

// Create cache instance
export const createCache = <T = any>(type: 'memory' | 'localStorage' | 'sessionStorage' | 'multi', config?: Partial<CacheConfig>) => {
  switch (type) {
    case 'memory':
      return new MemoryCache<T>(config)
    case 'localStorage':
      return new LocalStorageCache<T>('cache_', config)
    case 'sessionStorage':
      return new SessionStorageCache<T>('session_cache_', config)
    case 'multi':
      return new MultiLevelCache<T>(config)
    default:
      throw new Error(`Unknown cache type: ${type}`)
  }
}

// Cache decorator for functions
export const cacheable = <T extends (...args: any[]) => any>(
  fn: T,
  cache: MemoryCache<ReturnType<T>>,
  keyGenerator?: (...args: Parameters<T>) => string
): T => {
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
    
    let result = cache.get(key)
    if (result === null) {
      result = fn(...args)
      cache.set(key, result)
    }
    
    return result
  }) as T
}

// ============================================================================
// EXPORT ALL CACHING UTILITIES
// ============================================================================

export default {
  MemoryCache,
  LocalStorageCache,
  SessionStorageCache,
  MultiLevelCache,
  createCache,
  cacheable,
}
