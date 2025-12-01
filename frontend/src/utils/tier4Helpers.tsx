/**
 * Tier 4 Helper Utilities
 * 
 * Provides HOCs and utility functions for wrapping components and functions
 * with Tier 4 error handling capabilities.
 */

import React, { ComponentType, useCallback, useEffect } from 'react';
import { tier4ErrorHandler } from '@/services/tier4ErrorHandler';
import { requestManager } from '@/services/requestManager';
import { logger } from '@/services/logger';

// ============================================================================
// TYPES
// ============================================================================

interface Tier4Options {
  componentName?: string;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  enableCircuitBreaker?: boolean;
  enableDeduplication?: boolean;
}

interface AsyncFunctionOptions extends Tier4Options {
  timeout?: number;
  priority?: number;
}

// ============================================================================
// FUNCTION WRAPPING
// ============================================================================

/**
 * Wrap an async function with Tier 4 error handling
 */
export function withTier4ErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: AsyncFunctionOptions = {}
): T {
  const {
    componentName = fn.name || 'anonymous',
    enableRetry = true,
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000,
  } = options;

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    let attempt = 0;
    let lastError: Error | null = null;

    // Collect initial context
    const context = tier4ErrorHandler.collectContext(new Error('Function execution'), {
      component: componentName,
      action: 'function_execution',
      metadata: {
        functionName: fn.name,
        arguments: args,
      },
    });

    while (attempt < maxRetries) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Function ${componentName} timed out after ${timeout}ms`));
          }, timeout);
        });

        // Execute function with timeout
        const result = await Promise.race([fn(...args), timeoutPromise]);

        // Success - record if not first attempt
        if (attempt > 0) {
          logger.info('Function succeeded after retry', {
            componentName,
            attempt,
            correlationId: context.correlationId,
          });
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;

        // Record error
        const errorContext = tier4ErrorHandler.collectContext(lastError, {
          component: componentName,
          action: 'function_error',
          metadata: {
            functionName: fn.name,
            attempt,
            maxRetries,
            arguments: args,
          },
        });
        tier4ErrorHandler.recordError(lastError, errorContext);

        // Check if should retry
        if (attempt >= maxRetries || !enableRetry) {
          logger.error('Function failed after all retries', {
            componentName,
            attempts: attempt,
            error: lastError.message,
            correlationId: errorContext.correlationId,
          });
          throw lastError;
        }

        // Wait before retry (exponential backoff)
        const delay = retryDelay * Math.pow(2, attempt - 1);
        logger.warn('Function failed, retrying', {
          componentName,
          attempt,
          nextRetryIn: delay,
          error: lastError.message,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Should never reach here, but TypeScript needs this
    throw lastError || new Error('Unknown error');
  }) as T;
}

/**
 * Wrap a sync function with Tier 4 error handling
 */
export function withTier4ErrorHandlingSync<T extends (...args: any[]) => any>(
  fn: T,
  options: Tier4Options = {}
): T {
  const { componentName = fn.name || 'anonymous' } = options;

  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Record error
      const context = tier4ErrorHandler.collectContext(err, {
        component: componentName,
        action: 'sync_function_error',
        metadata: {
          functionName: fn.name,
          arguments: args,
        },
      });
      tier4ErrorHandler.recordError(err, context);

      // Re-throw
      throw err;
    }
  }) as T;
}

// ============================================================================
// COMPONENT WRAPPING
// ============================================================================

/**
 * HOC to wrap component with Tier 4 error tracking
 */
export function withTier4Tracking<P extends object>(
  Component: ComponentType<P>,
  options: Tier4Options = {}
): ComponentType<P> {
  const { componentName = Component.displayName || Component.name || 'Component' } = options;

  const WrappedComponent: React.FC<P> = (props) => {
    // Track component mount/unmount
    useEffect(() => {
      const context = tier4ErrorHandler.collectContext(new Error('Component lifecycle'), {
        component: componentName,
        action: 'component_mount',
      });

      logger.debug('Component mounted with Tier 4 tracking', {
        component: componentName,
        correlationId: context.correlationId,
      });

      return () => {
        logger.debug('Component unmounted', {
          component: componentName,
          correlationId: context.correlationId,
        });
      };
    }, []);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withTier4Tracking(${componentName})`;

  return WrappedComponent;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to create a Tier 4 tracked async callback
 */
export function useTier4Callback<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  deps: React.DependencyList,
  options: AsyncFunctionOptions = {}
): T {
  return useCallback(
    withTier4ErrorHandling(callback, options),
    deps
  );
}

/**
 * Hook to get Tier 4 error analytics
 */
export function useTier4Analytics() {
  const [analytics, setAnalytics] = React.useState(() =>
    tier4ErrorHandler.getErrorAnalytics()
  );

  useEffect(() => {
    // Update analytics periodically
    const interval = setInterval(() => {
      setAnalytics(tier4ErrorHandler.getErrorAnalytics());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return analytics;
}

/**
 * Hook to get request manager status
 */
export function useRequestManagerStatus() {
  const [status, setStatus] = React.useState(() => requestManager.getQueueStatus());

  useEffect(() => {
    // Update status periodically
    const interval = setInterval(() => {
      setStatus(requestManager.getQueueStatus());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  return status;
}

/**
 * Hook to check circuit breaker state for a URL
 */
export function useCircuitBreakerState(url: string) {
  const [state, setState] = React.useState(() => requestManager.getCircuitState(url));

  useEffect(() => {
    // Update state periodically
    const interval = setInterval(() => {
      setState(requestManager.getCircuitState(url));
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [url]);

  return state;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate correlation ID for tracking
 */
export function generateCorrelationId(): string {
  return tier4ErrorHandler.generateCorrelationId();
}

/**
 * Track correlation with data
 */
export function trackCorrelation(correlationId: string, data: unknown): void {
  tier4ErrorHandler.trackCorrelation(correlationId, data);
}

/**
 * Get correlation context
 */
export function getCorrelationContext(correlationId: string) {
  return tier4ErrorHandler.getCorrelationContext(correlationId);
}

/**
 * Clear error history
 */
export function clearErrorHistory(): void {
  tier4ErrorHandler.clearHistory();
}

/**
 * Clear request cache
 */
export function clearRequestCache(): void {
  requestManager.clearCache();
}

/**
 * Reset circuit breaker for a URL
 */
export function resetCircuitBreaker(url: string): void {
  requestManager.resetCircuitBreaker(url);
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  withTier4ErrorHandling,
  withTier4ErrorHandlingSync,
  withTier4Tracking,
  useTier4Callback,
  useTier4Analytics,
  useRequestManagerStatus,
  useCircuitBreakerState,
  generateCorrelationId,
  trackCorrelation,
  getCorrelationContext,
  clearErrorHistory,
  clearRequestCache,
  resetCircuitBreaker,
};

