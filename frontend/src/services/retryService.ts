// ============================================================================
// UNIFIED RETRY SERVICE - Exponential Backoff, Circuit Breaker & Error Recovery
// ============================================================================
// Standardized Retry Logic Service - Consistent retry strategies across all components
// Implements comprehensive retry mechanisms with exponential backoff and circuit breaker patterns
// Merged from retryService.ts and enhancedRetryService.ts
// ============================================================================

export interface RetryConfig {
  maxRetries: number
  baseDelay: number // milliseconds
  maxDelay: number // milliseconds
  backoffMultiplier: number
  jitter: boolean
  retryCondition: (error: unknown) => boolean
  onRetry?: (attempt: number, error: unknown) => void
  onMaxRetriesReached?: (error: unknown) => void
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: unknown
  attempts: number
  totalTime: number
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  recoveryTimeout: number // milliseconds
  monitoringPeriod: number // milliseconds
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open'
  failureCount: number
  lastFailureTime?: Date
  nextAttemptTime?: Date
}

class RetryService {
  private static instance: RetryService
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map()
  private defaultConfig: RetryConfig
  private defaultCircuitBreakerConfig: CircuitBreakerConfig

  public static getInstance(): RetryService {
    if (!RetryService.instance) {
      RetryService.instance = new RetryService()
    }
    return RetryService.instance
  }

  constructor() {
    this.defaultConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      retryCondition: (error) => this.isRetryableError(error)
    }

    this.defaultCircuitBreakerConfig = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 300000 // 5 minutes
    }
  }

  public isRetryableError(error: unknown): boolean {
    // Type guard for error objects
    if (typeof error !== 'object' || error === null) {
      return false
    }

    const err = error as Record<string, unknown>

    // Network errors
    if (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT_ERROR') {
      return true
    }

    // HTTP status codes that should be retried
    if (typeof err.status === 'number') {
      const retryableStatuses = [408, 429, 500, 502, 503, 504]
      return retryableStatuses.includes(err.status)
    }

    // Specific error messages
    const retryableMessages = [
      'timeout',
      'network',
      'connection',
      'temporary',
      'unavailable',
      'rate limit'
    ]

    const errorMessage = (typeof err.message === 'string' ? err.message : '').toLowerCase()
    return retryableMessages.some(msg => errorMessage.includes(msg))
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1)
    
    // Cap at max delay
    delay = Math.min(delay, config.maxDelay)
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }
    
    return Math.floor(delay)
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    circuitBreakerKey?: string
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.defaultConfig, ...config }
    const startTime = Date.now()
    let lastError: unknown

    // Check circuit breaker
    if (circuitBreakerKey && !this.isCircuitBreakerOpen(circuitBreakerKey)) {
      return {
        success: false,
        error: new Error('Circuit breaker is open'),
        attempts: 0,
        totalTime: Date.now() - startTime
      }
    }

    for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
      try {
        const result = await operation()
        
        // Success - reset circuit breaker
        if (circuitBreakerKey) {
          this.resetCircuitBreaker(circuitBreakerKey)
        }

        return {
          success: true,
          data: result,
          attempts: attempt,
          totalTime: Date.now() - startTime
        }
      } catch (error) {
        lastError = error

        // Check if we should retry
        if (attempt > finalConfig.maxRetries || !finalConfig.retryCondition(error)) {
          // Update circuit breaker on failure
          if (circuitBreakerKey) {
            this.recordCircuitBreakerFailure(circuitBreakerKey)
          }

          // Call max retries callback
          if (finalConfig.onMaxRetriesReached) {
            finalConfig.onMaxRetriesReached(error)
          }

          break
        }

        // Call retry callback
        if (finalConfig.onRetry) {
          finalConfig.onRetry(attempt, error)
        }

        // Wait before retry (except on last attempt)
        if (attempt <= finalConfig.maxRetries) {
          const delay = this.calculateDelay(attempt, finalConfig)
          await this.sleep(delay)
        }
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: finalConfig.maxRetries + 1,
      totalTime: Date.now() - startTime
    }
  }

  // Circuit Breaker Methods
  private isCircuitBreakerOpen(key: string): boolean {
    const state = this.circuitBreakers.get(key)
    if (!state) return false

    if (state.state === 'open') {
      // Check if we should transition to half-open
      if (state.nextAttemptTime && new Date() >= state.nextAttemptTime) {
        state.state = 'half-open'
        state.nextAttemptTime = undefined
      }
    }

    return state.state === 'open'
  }

  private recordCircuitBreakerFailure(key: string): void {
    const state = this.circuitBreakers.get(key) || {
      state: 'closed',
      failureCount: 0
    }

    state.failureCount++
    state.lastFailureTime = new Date()

    if (state.failureCount >= this.defaultCircuitBreakerConfig.failureThreshold) {
      state.state = 'open'
      state.nextAttemptTime = new Date(
        Date.now() + this.defaultCircuitBreakerConfig.recoveryTimeout
      )
    }

    this.circuitBreakers.set(key, state)
  }

  private resetCircuitBreaker(key: string): void {
    const state = this.circuitBreakers.get(key)
    if (state) {
      state.state = 'closed'
      state.failureCount = 0
      state.lastFailureTime = undefined
      state.nextAttemptTime = undefined
      this.circuitBreakers.set(key, state)
    }
  }

  public getCircuitBreakerState(key: string): CircuitBreakerState | undefined {
    return this.circuitBreakers.get(key)
  }

  public resetCircuitBreakerManually(key: string): void {
    this.resetCircuitBreaker(key)
  }

  // Predefined retry configurations
  public getNetworkRetryConfig(): RetryConfig {
    return {
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      retryCondition: (error) => this.isRetryableError(error)
    }
  }

  public getFileUploadRetryConfig(): RetryConfig {
    return {
      maxRetries: 3,
      baseDelay: 2000,
      maxDelay: 60000,
      backoffMultiplier: 2,
      jitter: true,
      retryCondition: (error) => this.isRetryableError(error)
    }
  }

  public getAPIRetryConfig(): RetryConfig {
    return {
      maxRetries: 3,
      baseDelay: 500,
      maxDelay: 10000,
      backoffMultiplier: 1.5,
      jitter: true,
      retryCondition: (error) => this.isRetryableError(error)
    }
  }

  public getCriticalOperationRetryConfig(): RetryConfig {
    return {
      maxRetries: 10,
      baseDelay: 1000,
      maxDelay: 60000,
      backoffMultiplier: 2,
      jitter: true,
      retryCondition: (error) => this.isRetryableError(error)
    }
  }

  // Utility methods
  public createRetryableFunction<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    config: Partial<RetryConfig> = {}
  ): (...args: T) => Promise<RetryResult<R>> {
    return async (...args: T): Promise<RetryResult<R>> => {
      return this.executeWithRetry(() => fn(...args), config)
    }
  }

  public withCircuitBreaker<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    circuitBreakerKey: string,
    config: Partial<RetryConfig> = {}
  ): (...args: T) => Promise<RetryResult<R>> {
    return async (...args: T): Promise<RetryResult<R>> => {
      return this.executeWithRetry(() => fn(...args), config, circuitBreakerKey)
    }
  }

  public getRetryStats(): {
    totalRetries: number
    successfulRetries: number
    failedRetries: number
    circuitBreakerStates: Record<string, CircuitBreakerState>
  } {
    // This would track actual retry statistics
    // For now, return circuit breaker states
    const circuitBreakerStates: Record<string, CircuitBreakerState> = {}
    this.circuitBreakers.forEach((state, key) => {
      circuitBreakerStates[key] = { ...state }
    })

    return {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      circuitBreakerStates
    }
  }
}

// React hook for retry functionality
export const useRetry = () => {
  const service = RetryService.getInstance()

  const executeWithRetry = <T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    circuitBreakerKey?: string
  ) => {
    return service.executeWithRetry(operation, config, circuitBreakerKey)
  }

  const createRetryableFunction = <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    config: Partial<RetryConfig> = {}
  ) => {
    return service.createRetryableFunction(fn, config)
  }

  const withCircuitBreaker = <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    circuitBreakerKey: string,
    config: Partial<RetryConfig> = {}
  ) => {
    return service.withCircuitBreaker(fn, circuitBreakerKey, config)
  }

  const getCircuitBreakerState = (key: string) => {
    return service.getCircuitBreakerState(key)
  }

  const resetCircuitBreaker = (key: string) => {
    service.resetCircuitBreakerManually(key)
  }

  const getRetryStats = () => {
    return service.getRetryStats()
  }

  return {
    executeWithRetry,
    createRetryableFunction,
    withCircuitBreaker,
    getCircuitBreakerState,
    resetCircuitBreaker,
    getRetryStats
  }
}

// Export singleton instance
export const retryService = RetryService.getInstance()

// ============================================================================
// CONVENIENCE FUNCTIONS (from enhancedRetryService for backward compatibility)
// ============================================================================

/**
 * Retry a function with exponential backoff (convenience wrapper)
 * @deprecated Use retryService.executeWithRetry() instead for more features
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    retryable?: (error: unknown) => boolean;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const service = RetryService.getInstance();
  const result = await service.executeWithRetry(fn, {
    maxRetries: options.maxRetries ?? 3,
    baseDelay: options.baseDelay ?? 1000,
    maxDelay: options.maxDelay ?? 30000,
    backoffMultiplier: options.backoffMultiplier ?? 2,
    jitter: true,
    retryCondition: options.retryable ?? ((error) => service.isRetryableError(error)),
    onRetry: options.onRetry,
  });

  if (result.success && result.data !== undefined) {
    return result.data;
  }
  throw result.error || new Error('Retry failed');
}

/**
 * Retry with jitter (randomized backoff) to prevent thundering herd
 * @deprecated Use retryService.executeWithRetry() with jitter: true instead
 */
export async function retryWithJitter<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    retryable?: (error: unknown) => boolean;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const service = RetryService.getInstance();
  const result = await service.executeWithRetry(fn, {
    maxRetries: options.maxRetries ?? 3,
    baseDelay: options.baseDelay ?? 1000,
    maxDelay: options.maxDelay ?? 30000,
    backoffMultiplier: options.backoffMultiplier ?? 2,
    jitter: true, // Jitter is always enabled in this convenience function
    retryCondition: options.retryable ?? ((error) => service.isRetryableError(error)),
    onRetry: options.onRetry,
  });

  if (result.success && result.data !== undefined) {
    return result.data;
  }
  throw result.error || new Error('Retry failed');
}

/**
 * Create a retryable fetch wrapper
 */
export function createRetryableFetch(
  fetchFn: typeof fetch,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    retryable?: (error: unknown) => boolean;
  } = {}
): typeof fetch {
  const service = RetryService.getInstance();
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const result = await service.executeWithRetry(
      async () => {
        const response = await fetchFn(input, init);
        
        // Treat 5xx errors as retryable
        if (response.status >= 500 && response.status < 600) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      },
      {
        maxRetries: options.maxRetries ?? 3,
        baseDelay: options.baseDelay ?? 1000,
        maxDelay: options.maxDelay ?? 30000,
        backoffMultiplier: options.backoffMultiplier ?? 2,
        jitter: true,
        retryCondition: options.retryable ?? ((error) => service.isRetryableError(error)),
      }
    );

    if (result.success && result.data) {
      return result.data;
    }
    throw result.error || new Error('Fetch retry failed');
  };
}

// Export default for backward compatibility
export default retryService
