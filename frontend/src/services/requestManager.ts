/**
 * Request Manager Service
 *
 * Provides request deduplication, caching, and circuit breaker functionality.
 */

import { logger } from './logger';

interface RequestOptions {
  priority?: number;
  timeout?: number;
  deduplicate?: boolean;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

class RequestManager {
  private pendingRequests: Map<string, PendingRequest<unknown>> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 30000; // 30 seconds

  /**
   * Execute a request with deduplication support
   */
  async execute<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    const { deduplicate = true } = options;

    // Check circuit breaker
    if (this.isCircuitOpen(key)) {
      throw new Error(`Circuit breaker is open for ${key}`);
    }

    // Check for pending request with same key
    if (deduplicate) {
      const pending = this.pendingRequests.get(key);
      if (pending) {
        logger.debug(`Deduplicating request for key: ${key}`);
        return pending.promise as Promise<T>;
      }
    }

    // Create new request
    const promise = this.executeWithCircuitBreaker(key, requestFn);

    if (deduplicate) {
      this.pendingRequests.set(key, {
        promise,
        timestamp: Date.now(),
      });
    }

    try {
      const result = await promise;
      return result;
    } finally {
      if (deduplicate) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Execute request with circuit breaker logic
   */
  private async executeWithCircuitBreaker<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    try {
      const result = await requestFn();
      this.recordSuccess(key);
      return result;
    } catch (error) {
      this.recordFailure(key);
      throw error;
    }
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(key: string): boolean {
    const state = this.circuitBreakers.get(key);
    if (!state?.isOpen) return false;

    // Check if reset timeout has passed
    if (Date.now() - state.lastFailure > this.resetTimeout) {
      state.isOpen = false;
      state.failures = 0;
      return false;
    }

    return true;
  }

  /**
   * Record successful request
   */
  private recordSuccess(key: string): void {
    const state = this.circuitBreakers.get(key);
    if (state) {
      state.failures = 0;
      state.isOpen = false;
    }
  }

  /**
   * Record failed request
   */
  private recordFailure(key: string): void {
    let state = this.circuitBreakers.get(key);
    if (!state) {
      state = { failures: 0, lastFailure: 0, isOpen: false };
      this.circuitBreakers.set(key, state);
    }

    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= this.failureThreshold) {
      state.isOpen = true;
      logger.warn(`Circuit breaker opened for key: ${key}`);
    }
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
    this.circuitBreakers.clear();
  }

  /**
   * Get pending request count
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { pending: number; circuits: number } {
    return {
      pending: this.pendingRequests.size,
      circuits: this.circuitBreakers.size,
    };
  }

  /**
   * Get circuit breaker state for a specific key
   */
  getCircuitState(key: string): { isOpen: boolean; failures: number } {
    const state = this.circuitBreakers.get(key);
    return {
      isOpen: state?.isOpen ?? false,
      failures: state?.failures ?? 0,
    };
  }

  /**
   * Clear cache (pending requests)
   */
  clearCache(): void {
    this.pendingRequests.clear();
  }

  /**
   * Reset circuit breaker for a specific key
   */
  resetCircuitBreaker(key: string): void {
    const state = this.circuitBreakers.get(key);
    if (state) {
      state.failures = 0;
      state.isOpen = false;
    }
  }
}

export const requestManager = new RequestManager();
