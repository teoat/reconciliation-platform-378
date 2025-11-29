/**
 * Tier 4 Interceptor for API Client
 * 
 * Integrates Tier 4 error handling (request deduplication, circuit breaker, queuing)
 * with the existing API client interceptor system.
 */

import { RequestConfig, ApiResponse } from './types';
import { requestManager } from '../requestManager';
import { tier4ErrorHandler, ErrorCategory } from '../tier4ErrorHandler';
import { logger } from '../logger';

export class Tier4Interceptor {
  /**
   * Process request through Tier 4 mechanisms
   */
  async request(config: RequestConfig): Promise<RequestConfig> {
    const url = config.url || '';

    // Check circuit breaker
    const circuitState = requestManager.getCircuitState(url);
    if (circuitState === 'OPEN') {
      throw new Error(`Circuit breaker is OPEN for ${url}. Service is temporarily unavailable.`);
    }

    // Check for duplicate request
    if (requestManager.isDuplicate(config as any)) {
      logger.info('Duplicate request detected, using cache', { url });
      // Request will be handled by response interceptor
    }

    return config;
  }

  /**
   * Process response through Tier 4 mechanisms
   */
  async response<T>(
    response: ApiResponse<T> | Response,
    config: RequestConfig
  ): Promise<ApiResponse<T> | Response> {
    const url = config.url || '';

    // Handle duplicate request - return cached response
    if (requestManager.isDuplicate(config as any)) {
      const cached = requestManager.getCachedResponse(config as any);
      if (cached) {
        // Convert Response to ApiResponse format
        const data = await cached.json();
        return {
          success: true,
          data: data as T,
        } as ApiResponse<T>;
      }
    }

    // Check if response is successful
    if (response instanceof Response) {
      if (response.ok) {
        requestManager.recordSuccess(url);
        
        // Cache successful GET responses
        if (config.method === 'GET' || !config.method) {
          requestManager.cacheResponse(config as any, response);
        }
      } else {
        // Record failure for non-2xx responses
        requestManager.recordFailure(url);
        
        // Record error with Tier 4 handler
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        const context = tier4ErrorHandler.collectContext(error, {
          component: 'Tier4Interceptor',
          action: 'response_processing',
          url,
          status: response.status,
        });
        tier4ErrorHandler.recordError(error, context);
      }
    } else {
      // ApiResponse format
      if (response.success) {
        requestManager.recordSuccess(url);
      } else {
        requestManager.recordFailure(url);
        
        // Record error
        const error = new Error(response.error?.message || 'API request failed');
        const context = tier4ErrorHandler.collectContext(error, {
          component: 'Tier4Interceptor',
          action: 'response_processing',
          url,
        });
        tier4ErrorHandler.recordError(error, context);
      }
    }

    return response;
  }

  /**
   * Process errors through Tier 4 mechanisms
   */
  async error(error: Error, config: RequestConfig): Promise<Error> {
    const url = config.url || '';

    // Record failure
    requestManager.recordFailure(url);

    // Categorize error
    const category = tier4ErrorHandler.categorizeError(error);

    // Collect context
    const context = tier4ErrorHandler.collectContext(error, {
      component: 'Tier4Interceptor',
      action: 'error_handling',
      url,
      method: config.method || 'GET',
      category,
    });

    // Record error
    tier4ErrorHandler.recordError(error, context);

    // Detect pattern
    const pattern = tier4ErrorHandler.detectPattern(error, context);

    // Log with context
    logger.error('Tier4Interceptor error', {
      error: error.message,
      url,
      category,
      correlationId: context.correlationId,
      pattern: pattern ? {
        frequency: pattern.frequency,
        severity: pattern.severity,
        shouldPrevent: pattern.shouldPrevent,
      } : undefined,
    });

    return error;
  }
}

