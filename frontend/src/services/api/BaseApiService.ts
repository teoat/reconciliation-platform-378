// ============================================================================
// BASE API SERVICE - UNIFIED API SERVICE ARCHITECTURE
// ============================================================================
// Provides common functionality for all API services:
// - Error handling
// - Response transformation
// - Retry logic
// - Caching
// ============================================================================

import { apiClient, type ApiResponse } from '../apiClient';
import { handleServiceError, type ErrorHandlingResult, type ErrorHandlingOptions } from '../errorHandling';
import { getErrorMessageFromApiError } from '@/utils/common/errorHandling';
import { retryService } from '../retryService';
import { cacheService } from '../cacheService';

/**
 * Service context for error handling
 */
export interface ServiceContext {
  component: string;
  action: string;
  projectId?: string;
  userId?: string;
  workflowStage?: string;
}

/**
 * Paginated result structure
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: string[];
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: [
    'ERR_NETWORK',
    'ERR_TIMEOUT',
    'ERR_SERVICE_UNAVAILABLE',
    'ERR_BAD_GATEWAY',
    'ERR_GATEWAY_TIMEOUT'
  ]
};

/**
 * Cache TTL configuration (in milliseconds)
 */
const CACHE_TTL = {
  users: 300000,        // 5 minutes
  projects: 600000,     // 10 minutes
  reconciliation: 60000, // 1 minute (frequently updated)
  files: 300000,        // 5 minutes
  default: 300000       // 5 minutes
};

/**
 * Base API Service Class
 * 
 * Provides common functionality for all API services:
 * - Standardized error handling
 * - Response transformation
 * - Retry logic with exponential backoff
 * - Service-level caching
 * 
 * @example
 * ```typescript
 * export class UsersApiService extends BaseApiService {
 *   static async getUsers(params: GetUsersParams = {}): Promise<ErrorHandlingResult<PaginatedResult<User>>> {
 *     return this.withErrorHandling(
 *       async () => {
 *         const cacheKey = `users:${JSON.stringify(params)}`;
 *         return this.getCached(cacheKey, async () => {
 *           const response = await apiClient.getUsers(params.page, params.per_page);
 *           return this.transformPaginatedResponse<User>(response);
 *         }, CACHE_TTL.users);
 *       },
 *       { component: 'UsersApiService', action: 'getUsers', projectId: params.projectId }
 *     );
 *   }
 * }
 * ```
 */
export abstract class BaseApiService {
  /**
   * Handle errors with standardized error handling
   */
  protected static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: ServiceContext
  ): Promise<ErrorHandlingResult<T>> {
    try {
      const data = await operation();
      return {
        success: true,
        data
      };
    } catch (error) {
      return handleServiceError<T>(error, {
        component: context.component,
        action: context.action,
        projectId: context.projectId,
        userId: context.userId,
        workflowStage: context.workflowStage
      });
    }
  }

  /**
   * Transform API response to typed data
   */
  protected static transformResponse<T>(
    response: ApiResponse<T>,
    dataPath?: string
  ): T {
    if (response.error) {
      throw new Error(getErrorMessageFromApiError(response.error));
    }

    // Use dataPath if provided, otherwise use response.data directly
    if (dataPath && response.data) {
      const data = (response.data as Record<string, unknown>)[dataPath];
      if (data === undefined) {
        throw new Error(`Data path "${dataPath}" not found in response`);
      }
      return data as T;
    }

    return response.data as T;
  }

  /**
   * Transform paginated API response to standardized format
   */
  protected static transformPaginatedResponse<T>(
    response: ApiResponse<{ data?: T[]; items?: T[]; pagination?: unknown }>
  ): PaginatedResult<T> {
    if (response.error) {
      throw new Error(getErrorMessageFromApiError(response.error));
    }

    const data = response.data as { data?: T[]; items?: T[]; pagination?: {
      page: number;
      per_page: number;
      total: number;
      total_pages: number;
    } } | undefined;

    const items = data?.data || data?.items || [];
    const pagination = data?.pagination || {
      page: 1,
      per_page: items.length,
      total: items.length,
      total_pages: 1
    };

    return {
      items,
      pagination: {
        page: pagination.page || 1,
        per_page: pagination.per_page || items.length,
        total: pagination.total || items.length,
        total_pages: pagination.total_pages || 1
      }
    };
  }

  /**
   * Execute operation with retry logic
   */
  protected static async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

    const result = await retryService.executeWithRetry(
      operation,
      {
        maxRetries: finalConfig.maxRetries,
        baseDelay: finalConfig.baseDelay,
        maxDelay: finalConfig.maxDelay,
        backoffMultiplier: finalConfig.backoffFactor,
        jitter: true,
        retryCondition: (error) => {
          const errorCode = this.extractErrorCode(error);
          return finalConfig.retryableErrors.includes(errorCode);
        }
      }
    );

    if (!result.success) {
      throw result.error || new Error('Operation failed after retries');
    }

    return result.data as T;
  }

  /**
   * Get cached data or fetch and cache
   */
  protected static async getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.default
  ): Promise<T> {
    try {
      const cached = await cacheService.get(key);
      if (cached !== null && cached !== undefined) {
        return cached as T;
      }
    } catch (error) {
      // Cache miss or error, continue to fetch
    }

    const data = await fetcher();
    
    try {
      await cacheService.set(key, data, { ttl });
    } catch (error) {
      // Cache set failed, but we have the data, so continue
    }

    return data;
  }

  /**
   * Invalidate cache by pattern
   */
  protected static async invalidateCache(pattern: string): Promise<void> {
    try {
      // cacheService.clear accepts a pattern string
      await cacheService.clear(pattern);
    } catch (error) {
      // Cache invalidation failed, log but don't throw
      // This is a best-effort operation
    }
  }

  /**
   * Extract error code from error
   */
  private static extractErrorCode(error: unknown): string {
    if (error instanceof Error) {
      return (error as Error & { code?: string }).code || 'UNKNOWN_ERROR';
    }
    if (typeof error === 'object' && error !== null) {
      const err = error as { code?: string; errorCode?: string };
      return err.code || err.errorCode || 'UNKNOWN_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  /**
   * Create default pagination object
   */
  protected static createDefaultPagination(page: number = 1, perPage: number = 20, total: number = 0) {
    return {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage)
    };
  }
}

