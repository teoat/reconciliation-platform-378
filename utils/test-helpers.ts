/**
 * Testing Utilities for Memory Leaks and Stale Data Detection
 * 
 * This module provides utilities to help detect and prevent common issues:
 * - Memory leaks from event listeners, intervals, and subscriptions
 * - Stale data in caches and state management
 * - Performance regressions
 */

/**
 * Memory leak detector for React components and hooks
 */
export class MemoryLeakDetector {
  private static activeListeners = new Map<string, Set<EventListener>>();
  private static activeIntervals = new Set<number>();
  private static activeTimeouts = new Set<number>();
  private static activeSubscriptions = new Set<{ unsubscribe: () => void }>();

  /**
   * Track an event listener for cleanup verification
   */
  static trackListener(target: string, listener: EventListener): void {
    if (!this.activeListeners.has(target)) {
      this.activeListeners.set(target, new Set());
    }
    this.activeListeners.get(target)!.add(listener);
  }

  /**
   * Remove tracked listener
   */
  static untrackListener(target: string, listener: EventListener): void {
    const listeners = this.activeListeners.get(target);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.activeListeners.delete(target);
      }
    }
  }

  /**
   * Track an interval for cleanup verification
   */
  static trackInterval(id: number): void {
    this.activeIntervals.add(id);
  }

  /**
   * Remove tracked interval
   */
  static untrackInterval(id: number): void {
    this.activeIntervals.delete(id);
  }

  /**
   * Track a timeout for cleanup verification
   */
  static trackTimeout(id: number): void {
    this.activeTimeouts.add(id);
  }

  /**
   * Remove tracked timeout
   */
  static untrackTimeout(id: number): void {
    this.activeTimeouts.delete(id);
  }

  /**
   * Track a subscription for cleanup verification
   */
  static trackSubscription(subscription: { unsubscribe: () => void }): void {
    this.activeSubscriptions.add(subscription);
  }

  /**
   * Remove tracked subscription
   */
  static untrackSubscription(subscription: { unsubscribe: () => void }): void {
    this.activeSubscriptions.delete(subscription);
  }

  /**
   * Get current memory usage statistics
   */
  static getMemoryStats(): {
    activeListeners: number;
    activeIntervals: number;
    activeTimeouts: number;
    activeSubscriptions: number;
  } {
    return {
      activeListeners: Array.from(this.activeListeners.values()).reduce(
        (sum, set) => sum + set.size,
        0
      ),
      activeIntervals: this.activeIntervals.size,
      activeTimeouts: this.activeTimeouts.size,
      activeSubscriptions: this.activeSubscriptions.size,
    };
  }

  /**
   * Clear all tracked resources (use in test cleanup)
   */
  static cleanup(): void {
    this.activeListeners.clear();
    this.activeIntervals.forEach((id) => clearInterval(id));
    this.activeIntervals.clear();
    this.activeTimeouts.forEach((id) => clearTimeout(id));
    this.activeTimeouts.clear();
    this.activeSubscriptions.forEach((sub) => sub.unsubscribe());
    this.activeSubscriptions.clear();
  }

  /**
   * Verify all resources have been cleaned up
   */
  static verify(): { hasLeaks: boolean; details: string[] } {
    const stats = this.getMemoryStats();
    const details: string[] = [];
    let hasLeaks = false;

    if (stats.activeListeners > 0) {
      details.push(`${stats.activeListeners} event listeners not removed`);
      hasLeaks = true;
    }
    if (stats.activeIntervals > 0) {
      details.push(`${stats.activeIntervals} intervals not cleared`);
      hasLeaks = true;
    }
    if (stats.activeTimeouts > 0) {
      details.push(`${stats.activeTimeouts} timeouts not cleared`);
      hasLeaks = true;
    }
    if (stats.activeSubscriptions > 0) {
      details.push(`${stats.activeSubscriptions} subscriptions not unsubscribed`);
      hasLeaks = true;
    }

    return { hasLeaks, details };
  }
}

/**
 * Stale data detector for caches and state management
 */
export class StaleDataDetector {
  private static cacheTimestamps = new Map<string, number>();
  private static cacheMaxAge = new Map<string, number>();

  /**
   * Register a cache entry with its timestamp
   */
  static registerCache(key: string, maxAgeMs: number = 5 * 60 * 1000): void {
    this.cacheTimestamps.set(key, Date.now());
    this.cacheMaxAge.set(key, maxAgeMs);
  }

  /**
   * Update cache timestamp
   */
  static updateCache(key: string): void {
    if (this.cacheTimestamps.has(key)) {
      this.cacheTimestamps.set(key, Date.now());
    }
  }

  /**
   * Check if cache is stale
   */
  static isStale(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    const maxAge = this.cacheMaxAge.get(key);

    if (timestamp === undefined || maxAge === undefined) {
      return false;
    }

    return Date.now() - timestamp > maxAge;
  }

  /**
   * Get all stale cache keys
   */
  static getStaleCaches(): string[] {
    const stale: string[] = [];
    this.cacheTimestamps.forEach((_, key) => {
      if (this.isStale(key)) {
        stale.push(key);
      }
    });
    return stale;
  }

  /**
   * Clear a specific cache
   */
  static clearCache(key: string): void {
    this.cacheTimestamps.delete(key);
    this.cacheMaxAge.delete(key);
  }

  /**
   * Clear all caches
   */
  static clearAll(): void {
    this.cacheTimestamps.clear();
    this.cacheMaxAge.clear();
  }

  /**
   * Get cache statistics
   */
  static getStats(): {
    totalCaches: number;
    staleCaches: number;
    freshCaches: number;
  } {
    const stale = this.getStaleCaches();
    return {
      totalCaches: this.cacheTimestamps.size,
      staleCaches: stale.length,
      freshCaches: this.cacheTimestamps.size - stale.length,
    };
  }
}

/**
 * Performance regression detector
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number[]>();
  private static thresholds = new Map<string, number>();

  /**
   * Record a performance measurement
   */
  static measure(key: string, durationMs: number): void {
    const MAX_SAMPLES = 200; // cap to prevent unbounded growth
    if (!this.measurements.has(key)) {
      this.measurements.set(key, []);
    }
    const arr = this.measurements.get(key)!;
    arr.push(durationMs);
    if (arr.length > MAX_SAMPLES) {
      arr.shift(); // drop oldest sample
    }
  }

  /**
   * Set performance threshold for a measurement
   */
  static setThreshold(key: string, maxDurationMs: number): void {
    if (!Number.isFinite(maxDurationMs) || maxDurationMs < 0) {
      throw new Error(`Invalid threshold for "${key}": ${maxDurationMs}`);
    }
    this.thresholds.set(key, Math.floor(maxDurationMs));
  }

  /**
   * Check if any measurements exceed threshold
   */
  static checkRegressions(): { hasRegressions: boolean; details: string[] } {
    const details: string[] = [];
    let hasRegressions = false;

    this.measurements.forEach((durations, key) => {
      const threshold = this.thresholds.get(key);
      if (!threshold) return;

      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const max = Math.max(...durations);

      if (avg > threshold) {
        details.push(
          `${key}: Average ${avg.toFixed(2)}ms exceeds threshold ${threshold}ms`
        );
        hasRegressions = true;
      }
      if (max > threshold * 1.5) {
        details.push(
          `${key}: Max ${max.toFixed(2)}ms significantly exceeds threshold`
        );
        hasRegressions = true;
      }
    });

    return { hasRegressions, details };
  }

  /**
   * Get statistics for a measurement
   */
  static getStats(key: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    threshold?: number;
  } | null {
    const durations = this.measurements.get(key);
    if (!durations || durations.length === 0) return null;

    return {
      count: durations.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      threshold: this.thresholds.get(key),
    };
  }

  /**
   * Clear measurements
   */
  static clear(key?: string): void {
    if (key) {
      this.measurements.delete(key);
      this.thresholds.delete(key);
    } else {
      this.measurements.clear();
      this.thresholds.clear();
    }
  }
}

/**
 * Helper function to wrap a test to detect memory leaks
 */
export function detectMemoryLeaks<T>(
  testFn: () => T | Promise<T>
): () => Promise<void> {
  return async () => {
    MemoryLeakDetector.cleanup();

    try {
      await testFn();
    } finally {
      const { hasLeaks, details } = MemoryLeakDetector.verify();
      if (hasLeaks) {
        throw new Error(
          `Memory leaks detected:\n${details.map((d) => `  - ${d}`).join('\n')}`
        );
      }
    }
  };
}

/**
 * Helper function to wrap a test to detect stale data
 */
export function detectStaleData<T>(
  testFn: () => T | Promise<T>
): () => Promise<void> {
  return async () => {
    StaleDataDetector.clearAll();

    try {
      await testFn();
    } finally {
      const staleCaches = StaleDataDetector.getStaleCaches();
      if (staleCaches.length > 0) {
        console.warn(
          `Stale caches detected: ${staleCaches.join(', ')}`
        );
      }
    }
  };
}

/**
 * Helper function to wrap a test to detect performance regressions
 */
export function detectPerformanceRegression<T>(
  testFn: () => T | Promise<T>
): () => Promise<void> {
  return async () => {
    const startTime = performance.now();

    try {
      await testFn();
    } finally {
      const duration = performance.now() - startTime;
      PerformanceMonitor.measure('test-execution', duration);

      const { hasRegressions, details } = PerformanceMonitor.checkRegressions();
      if (hasRegressions) {
        console.warn(
          `Performance regressions detected:\n${details.map((d) => `  - ${d}`).join('\n')}`
        );
      }
    }
  };
}
