// ============================================================================
// ENHANCED RETRY SERVICE - Exponential Backoff & Error Recovery
// ============================================================================
// Provides robust retry mechanisms with exponential backoff for failed operations
// ============================================================================

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryable?: (error: any) => boolean
  onRetry?: (attempt: number, error: any) => void
}

export class EnhancedRetryService {
  private static instance: EnhancedRetryService

  static getInstance(): EnhancedRetryService {
    if (!EnhancedRetryService.instance) {
      EnhancedRetryService.instance = new EnhancedRetryService()
    }
    return EnhancedRetryService.instance
  }

  /**
   * Retry a function with exponential backoff
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
      retryable = () => true,
      onRetry
    } = options

    let lastError: any

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error

        // Check if error is retryable
        if (!retryable(error)) {
          throw error
        }

        // Don't retry on last attempt
        if (attempt === maxRetries - 1) {
          throw error
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(backoffMultiplier, attempt),
          maxDelay
        )

        // Notify retry handler
        if (onRetry) {
          onRetry(attempt + 1, error)
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * Retry with jitter (randomized backoff) to prevent thundering herd
   */
  async retryWithJitter<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
      retryable = () => true,
      onRetry
    } = options

    let lastError: any

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error

        if (!retryable(error)) {
          throw error
        }

        if (attempt === maxRetries - 1) {
          throw error
        }

        // Add jitter (random value between 0 and delay)
        const base = baseDelay * Math.pow(backoffMultiplier, attempt)
        const delay = Math.min(
          base + Math.random() * base * 0.3, // 30% jitter
          maxDelay
        )

        if (onRetry) {
          onRetry(attempt + 1, error)
        }

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * Check if an error is retryable
   */
  isRetryableError(error: any): boolean {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true
    }

    // HTTP 5xx errors
    if (error?.status >= 500 && error?.status < 600) {
      return true
    }

    // HTTP 429 (Too Many Requests)
    if (error?.status === 429) {
      return true
    }

    // Timeout errors
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      return true
    }

    return false
  }

  /**
   * Create a retryable fetch wrapper
   */
  createRetryableFetch(
    fetchFn: typeof fetch,
    options: RetryOptions = {}
  ): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
      return this.retryWithJitter(
        async () => {
          const response = await fetchFn(input, init)
          
          // Treat 5xx errors as retryable
          if (response.status >= 500 && response.status < 600) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          return response
        },
        {
          ...options,
          retryable: (error) => {
            if (options.retryable) {
              return options.retryable(error)
            }
            return this.isRetryableError(error)
          }
        }
      )
    }
  }
}

// Export singleton instance
export const retryService = EnhancedRetryService.getInstance()

// Export convenience functions
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return retryService.retryWithBackoff(fn, options)
}

export async function retryWithJitter<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return retryService.retryWithJitter(fn, options)
}

export default retryService
