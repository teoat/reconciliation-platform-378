// ============================================================================
// UNIFIED RETRY UTILITY - SINGLE SOURCE OF TRUTH
// ============================================================================

export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

/**
 * Unified retry utility with exponential backoff
 * Consolidates retry logic from:
 * - frontend/src/services/retryService.ts
 * - frontend/src/utils/apiClient.ts
 * - frontend/src/utils/errorHandler.ts
 */
export class RetryUtility {
  private static calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    multiplier: number
  ): number {
    return Math.min(baseDelay * Math.pow(multiplier, attempt - 1), maxDelay);
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Execute an operation with retry logic and exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig: Required<Omit<RetryConfig, 'onRetry' | 'onMaxRetriesReached'>> & {
      onRetry?: (attempt: number, error: Error) => void;
      onMaxRetriesReached?: (error: Error) => void;
    } = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryCondition: (error: Error) => {
        // Retry on network errors and 5xx errors
        return (
          error.name === 'NetworkError' || (error.message && error.message.includes('timeout'))
        );
      },
      ...config,
    };

    let lastError: Error;

    for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        if (attempt > finalConfig.maxRetries || !finalConfig.retryCondition(lastError)) {
          // Call max retries callback
          if (finalConfig.onMaxRetriesReached) {
            finalConfig.onMaxRetriesReached(lastError);
          }
          throw lastError;
        }

        // Call retry callback
        if (finalConfig.onRetry) {
          finalConfig.onRetry(attempt, lastError);
        }

        // Wait before retry (exponential backoff)
        if (attempt <= finalConfig.maxRetries) {
          const delay = this.calculateDelay(
            attempt,
            finalConfig.baseDelay,
            finalConfig.maxDelay,
            finalConfig.backoffMultiplier
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Execute with retry and return detailed result
   */
  static async withRetryResult<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: Error;
    let attempts = 0;

    try {
      const data = await this.withRetry(operation, config);

      return {
        success: true,
        data,
        attempts: finalConfig.maxRetries + 1,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        attempts: attempts,
        totalTime: Date.now() - startTime,
      };
    }
  }
}

export default RetryUtility;
