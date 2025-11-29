/**
 * Request Manager Service
 * 
 * Provides request deduplication, circuit breaker pattern, and request queuing/throttling.
 * Part of Tier 4 error handling implementation.
 */

import { logger } from './logger';
import { APP_CONFIG } from '@/config/AppConfig';

// ============================================================================
// TYPES
// ============================================================================

export interface RequestConfig {
  url: string;
  method: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface QueuedRequest {
  id: string;
  config: RequestConfig;
  resolve: (value: Response) => void;
  reject: (error: Error) => void;
  timestamp: Date;
  priority: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  successThreshold: number; // Number of successes before closing circuit
  timeout: number; // Time to wait before trying half-open
  resetTimeout: number; // Time before attempting to close circuit
}

// ============================================================================
// REQUEST MANAGER
// ============================================================================

export class RequestManager {
  private static instance: RequestManager;
  private requestCache: Map<string, { response: Response; timestamp: Date }> = new Map();
  private requestQueue: QueuedRequest[] = [];
  private circuitBreakers: Map<string, {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime: Date | null;
    lastSuccessTime: Date | null;
  }> = new Map();
  private readonly cacheTTL = 5000; // 5 seconds
  private readonly maxQueueSize = 100;
  private readonly defaultCircuitConfig: CircuitBreakerConfig = {
    failureThreshold: APP_CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD,
    successThreshold: APP_CONFIG.CIRCUIT_BREAKER.SUCCESS_THRESHOLD,
    timeout: APP_CONFIG.CIRCUIT_BREAKER.TIMEOUT,
    resetTimeout: APP_CONFIG.CIRCUIT_BREAKER.RESET_TIMEOUT,
  };
  private processingQueue = false;

  private constructor() {
    // Start queue processor
    this.processQueue();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RequestManager {
    if (!RequestManager.instance) {
      RequestManager.instance = new RequestManager();
    }
    return RequestManager.instance;
  }

  /**
   * Generate request key for deduplication
   */
  private generateRequestKey(config: RequestConfig): string {
    const bodyStr = config.body ? JSON.stringify(config.body) : '';
    return `${config.method}:${config.url}:${bodyStr}`;
  }

  /**
   * Check if request is duplicate
   */
  public isDuplicate(config: RequestConfig): boolean {
    const key = this.generateRequestKey(config);
    const cached = this.requestCache.get(key);

    if (!cached) {
      return false;
    }

    // Check if cache is still valid
    const age = Date.now() - cached.timestamp.getTime();
    if (age > this.cacheTTL) {
      this.requestCache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cached response
   */
  public getCachedResponse(config: RequestConfig): Response | null {
    const key = this.generateRequestKey(config);
    const cached = this.requestCache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    const age = Date.now() - cached.timestamp.getTime();
    if (age > this.cacheTTL) {
      this.requestCache.delete(key);
      return null;
    }

    return cached.response;
  }

  /**
   * Cache response
   */
  public cacheResponse(config: RequestConfig, response: Response): void {
    const key = this.generateRequestKey(config);
    this.requestCache.set(key, {
      response: response.clone(),
      timestamp: new Date(),
    });

    // Clean old cache entries
    if (this.requestCache.size > 100) {
      const entries = Array.from(this.requestCache.entries());
      entries.sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
      const toDelete = entries.slice(0, 20);
      toDelete.forEach(([key]) => this.requestCache.delete(key));
    }
  }

  /**
   * Check circuit breaker state
   */
  public getCircuitState(url: string): CircuitState {
    const circuit = this.circuitBreakers.get(url);
    if (!circuit) {
      return CircuitState.CLOSED;
    }

    // Check if circuit should transition
    if (circuit.state === CircuitState.OPEN) {
      const timeSinceFailure = circuit.lastFailureTime
        ? Date.now() - circuit.lastFailureTime.getTime()
        : Infinity;

      if (timeSinceFailure > this.defaultCircuitConfig.resetTimeout) {
        // Transition to half-open
        circuit.state = CircuitState.HALF_OPEN;
        circuit.successes = 0;
      }
    }

    return circuit.state;
  }

  /**
   * Record circuit breaker success
   */
  public recordSuccess(url: string): void {
    let circuit = this.circuitBreakers.get(url);
    if (!circuit) {
      circuit = {
        state: CircuitState.CLOSED,
        failures: 0,
        successes: 0,
        lastFailureTime: null,
        lastSuccessTime: new Date(),
      };
      this.circuitBreakers.set(url, circuit);
    }

    circuit.successes += 1;
    circuit.lastSuccessTime = new Date();

    // If half-open and enough successes, close circuit
    if (
      circuit.state === CircuitState.HALF_OPEN &&
      circuit.successes >= this.defaultCircuitConfig.successThreshold
    ) {
      circuit.state = CircuitState.CLOSED;
      circuit.failures = 0;
      logger.info('Circuit breaker closed', { url });
    }
  }

  /**
   * Record circuit breaker failure
   */
  public recordFailure(url: string): void {
    let circuit = this.circuitBreakers.get(url);
    if (!circuit) {
      circuit = {
        state: CircuitState.CLOSED,
        failures: 0,
        successes: 0,
        lastFailureTime: new Date(),
        lastSuccessTime: null,
      };
      this.circuitBreakers.set(url, circuit);
    }

    circuit.failures += 1;
    circuit.lastFailureTime = new Date();
    circuit.successes = 0;

    // If enough failures, open circuit
    if (circuit.failures >= this.defaultCircuitConfig.failureThreshold) {
      circuit.state = CircuitState.OPEN;
      logger.warn('Circuit breaker opened', { url, failures: circuit.failures });
    }
  }

  /**
   * Queue request
   */
  public queueRequest(
    config: RequestConfig,
    priority: number = 0
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      // Check queue size
      if (this.requestQueue.length >= this.maxQueueSize) {
        reject(new Error('Request queue is full'));
        return;
      }

      const queuedRequest: QueuedRequest = {
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        config,
        resolve,
        reject,
        timestamp: new Date(),
        priority,
      };

      // Insert by priority
      const insertIndex = this.requestQueue.findIndex(
        (req) => req.priority < priority
      );
      if (insertIndex === -1) {
        this.requestQueue.push(queuedRequest);
      } else {
        this.requestQueue.splice(insertIndex, 0, queuedRequest);
      }

      // Process queue
      this.processQueue();
    });
  }

  /**
   * Process request queue
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (!request) {
        break;
      }

      try {
        // Check circuit breaker
        const circuitState = this.getCircuitState(request.config.url);
        if (circuitState === CircuitState.OPEN) {
          request.reject(
            new Error(`Circuit breaker is OPEN for ${request.config.url}`)
          );
          continue;
        }

        // Check for duplicate
        if (this.isDuplicate(request.config)) {
          const cached = this.getCachedResponse(request.config);
          if (cached) {
            request.resolve(cached);
            continue;
          }
        }

        // Execute request
        const response = await this.executeRequest(request.config);

        // Record success
        this.recordSuccess(request.config.url);

        // Cache response
        this.cacheResponse(request.config, response);

        request.resolve(response);
      } catch (error) {
        // Record failure
        this.recordFailure(request.config.url);

        request.reject(
          error instanceof Error ? error : new Error(String(error))
        );
      }

      // Throttle: wait a bit between requests
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    this.processingQueue = false;
  }

  /**
   * Execute request
   */
  private async executeRequest(config: RequestConfig): Promise<Response> {
    const controller = new AbortController();
    const timeout = config.timeout || 30000;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.requestCache.clear();
  }

  /**
   * Reset circuit breaker
   */
  public resetCircuitBreaker(url: string): void {
    this.circuitBreakers.delete(url);
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): {
    queueLength: number;
    cacheSize: number;
    circuitBreakers: number;
  } {
    return {
      queueLength: this.requestQueue.length,
      cacheSize: this.requestCache.size,
      circuitBreakers: this.circuitBreakers.size,
    };
  }
}

// Export singleton instance
export const requestManager = RequestManager.getInstance();

