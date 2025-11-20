// ============================================================================
// API CLIENT RESPONSE UTILITIES
// ============================================================================

import { ApiResponse, CacheEntry } from './types';
import { errorTranslationService } from '../errorTranslationService';

export class ResponseHandler {
  private cache = new Map<string, CacheEntry>();

  handleResponse<T>(data: unknown): ApiResponse<T> {
    // Handle different response formats
    if (this.isApiResponse(data)) {
      return data as ApiResponse<T>;
    }

    // Wrap raw data in ApiResponse format
    return {
      success: true,
      data: data as T,
    };
  }

  private isApiResponse(data: unknown): boolean {
    return (
      data && typeof data === 'object' && ('success' in data || 'data' in data || 'error' in data)
    );
  }

  handleError(
    error: Error | Record<string, unknown>,
    endpoint: string,
    method: string
  ): ApiResponse {
    // ✅ ERROR TRANSLATION: Use translation service for backend error context
    let translatedMessage = error.message || error.error || 'An error occurred';
    let errorCode = error.code;

    // Extract correlation ID from error (Agent 1 Task 1.19)
    const correlationId =
      (error as Error & { correlationId?: string }).correlationId ||
      (typeof error === 'object' && 'correlationId' in error
        ? String(error.correlationId)
        : undefined);

    // Handle backend error response format: { error, message, code }
    if (error.code) {
      errorCode = error.code;
    } else if (typeof error === 'object' && error.error) {
      // Backend format: { error: "title", message: "msg", code: "CODE" }
      errorCode = error.code || this.mapErrorTitleToCode(error.error);
      if (error.message) {
        translatedMessage = error.message;
      }
    }

    if (errorCode) {
      // Backend provides error code - translate it to user-friendly message
      const translation = errorTranslationService.translateError(errorCode, {
        component: 'apiClient',
        action: method,
        data: { endpoint, statusCode: error.statusCode },
      });

      translatedMessage = translation.userMessage;
    }

    return {
      success: false,
      error: translatedMessage,
      code: errorCode,
      message: translatedMessage,
      correlationId, // Include correlation ID in API response
    };
  }

  private mapErrorTitleToCode(errorTitle: string): string {
    // Map backend error titles to frontend error codes
    const titleToCodeMap: Record<string, string> = {
      'Authentication Failed': 'AUTH_INVALID_CREDENTIALS',
      'Authorization Failed': 'AUTH_INSUFFICIENT_PERMISSIONS',
      'Validation Error': 'VALIDATION_FAILED',
      'Not Found': 'RESOURCE_NOT_FOUND',
      Conflict: 'RESOURCE_CONFLICT',
      'Internal Server Error': 'INTERNAL_ERROR',
    };

    return titleToCodeMap[errorTitle] || 'UNKNOWN_ERROR';
  }
}

export class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && Date.now() - entry.timestamp <= entry.ttl;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export class ResponseValidator {
  validateResponse<T>(response: ApiResponse<T>, schema?: Record<string, unknown>): ApiResponse<T> {
    if (!response.success) {
      return response;
    }

    // Basic validation
    if (schema && response.data) {
      try {
        this.validateAgainstSchema(response.data, schema);
      } catch (error) {
        return {
          success: false,
          error: `Response validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    return response;
  }

  private validateAgainstSchema(data: unknown, schema: Record<string, unknown>): void {
    // Basic schema validation - could be enhanced with libraries like zod
    if (schema.type === 'object' && typeof data === 'object') {
      if (schema.required) {
        for (const field of schema.required) {
          if (!(field in data)) {
            throw new Error(`Missing required field: ${field}`);
          }
        }
      }
    }
  }
}
