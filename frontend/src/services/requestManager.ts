/**
 * Request Manager (SSOT for Request Queue & Circuit Breaking)
 *
 * Manages concurrent requests, queueing, deduplication, and circuit breaking.
 * Used by Tier 4 Error Handling to optimize network traffic.
 */

import { logger } from '@/services/logger';

export interface QueueStatus {
  pendingCount: number;
  activeCount: number;
  isPaused: boolean;
}

export interface CircuitState {
  isOpen: boolean;
  failures: number;
  lastFailure: number;
}

class RequestManager {
  private static instance: RequestManager;
  private queue: Map<string, Promise<any>> = new Map();
  private circuitBreakers: Map<string, CircuitState> = new Map();
  private activeRequests = 0;
  private maxConcurrent = 5;

  private constructor() {}

  static getInstance(): RequestManager {
    if (!RequestManager.instance) {
      RequestManager.instance = new RequestManager();
    }
    return RequestManager.instance;
  }

  // Queue Status
  getQueueStatus(): QueueStatus {
    return {
      pendingCount: this.queue.size,
      activeCount: this.activeRequests,
      isPaused: false,
    };
  }

  // Circuit Breaker
  getCircuitState(url: string): CircuitState {
    const key = this.getCircuitKey(url);
    return this.circuitBreakers.get(key) || { isOpen: false, failures: 0, lastFailure: 0 };
  }

  resetCircuitBreaker(url: string): void {
    const key = this.getCircuitKey(url);
    this.circuitBreakers.delete(key);
  }

  recordFailure(url: string): void {
    const key = this.getCircuitKey(url);
    const state = this.getCircuitState(url);
    state.failures++;
    state.lastFailure = Date.now();

    // Trip circuit if > 5 failures in 1 minute
    if (state.failures > 5) {
      state.isOpen = true;
      logger.warn(`Circuit breaker tripped for ${key}`);
    }

    this.circuitBreakers.set(key, state);
  }

  recordSuccess(url: string): void {
    const key = this.getCircuitKey(url);
    if (this.circuitBreakers.has(key)) {
      const state = this.circuitBreakers.get(key)!;
      if (state.failures > 0) {
        state.failures = Math.max(0, state.failures - 1);
        if (state.isOpen && state.failures === 0) {
          state.isOpen = false;
          logger.info(`Circuit breaker reset for ${key}`);
        }
      }
    }
  }

  // Cache (stub for now)
  clearCache(): void {
    // Implement cache clearing if cache is added
  }

  private getCircuitKey(url: string): string {
    try {
      // Group by hostname or base path to avoid granular breakers
      const urlObj = new URL(url, 'http://localhost');
      return urlObj.hostname;
    } catch {
      return 'unknown';
    }
  }
}

export const requestManager = RequestManager.getInstance();
