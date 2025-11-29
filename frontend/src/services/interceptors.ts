// Migrated to use SSOT types from apiClient
import type { RequestInterceptor, ResponseInterceptor } from './apiClient/interceptors';
import { ApiErrorLike as ApiError, RequestConfig, ApiResponse } from './apiClient/types';
import { logger } from '@/services/logger';

// Request interceptor for adding common headers and logging
export const createRequestInterceptor = (): RequestInterceptor => {
  return async (config: RequestConfig): Promise<RequestConfig> => {
    // Add request ID for tracking
    const requestId = Math.random().toString(36).substr(2, 9);
    config.headers = {
      ...config.headers,
      'X-Request-ID': requestId,
      'X-Client-Version': '1.0.0',
      'X-Platform': 'web',
    };

    // Add timestamp for request timing
    config.headers['X-Request-Timestamp'] = Date.now().toString();

    // Log request in development
    if (import.meta.env.DEV) {
      logger.info(`[API Request] ${config.method || 'GET'} ${config.url || ''}`, {
        requestId,
        headers: config.headers,
        body: (config as { body?: unknown }).body,
      });
    }

    return config;
  };
};

// Response interceptor for handling common responses
export const createResponseInterceptor = (): ResponseInterceptor => {
  return async <T = unknown>(
    response: ApiResponse<T> | Response,
    _config: RequestConfig
  ): Promise<ApiResponse<T> | Response> => {
    // Log response in development
    if (import.meta.env.DEV) {
      const resp = response as any;
      logger.info(`[API Response]`, {
        success: resp.success,
        message: resp.message,
        timestamp: resp.timestamp,
      });
    }

    return response;
  };
};

// Authentication interceptor
export const createAuthInterceptor = (): RequestInterceptor => {
  return async (config: RequestConfig): Promise<RequestConfig> => {
    // Skip auth for certain endpoints
    const skipAuthEndpoints = ['/auth/login', '/auth/register', '/health'];
    const shouldSkipAuth = skipAuthEndpoints.some((endpoint) => config.url?.includes(endpoint));

    if (!shouldSkipAuth) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    return config;
  };
};

// Retry interceptor for specific error types
export const createRetryInterceptor = (): ResponseInterceptor => {
  return async <T = unknown>(response: ApiResponse<T> | Response): Promise<ApiResponse<T> | Response> => {
    // This interceptor doesn't handle errors directly - errors are thrown, not returned
    // For retry logic, use error handling in the API client
    return response;
  };
};

// Rate limiting interceptor
export const createRateLimitInterceptor = (): ResponseInterceptor => {
  return async <T = unknown>(
    response: ApiResponse<T> | Response,
    _config: RequestConfig
  ): Promise<ApiResponse<T> | Response> => {
    // Check for rate limit (if response indicates rate limiting)
    if (!response.success && response.message?.toLowerCase().includes('rate limit')) {
      const retryAfter = 60; // Default retry after 60 seconds
      const event = new CustomEvent('rate-limit', {
        detail: { retryAfter, message: 'Rate limit exceeded' },
      });
      window.dispatchEvent(event);
    }
    return response;
  };
};

// Offline detection interceptor
export const createOfflineInterceptor = (): RequestInterceptor => {
  return async (config: RequestConfig): Promise<RequestConfig> => {
    if (!navigator.onLine) {
      const offlineError = new Error('You are currently offline. Please check your internet connection and try again.') as ApiError;
      (offlineError as { status?: number }).status = 0;

      // Show offline notification
      const event = new CustomEvent('offline-detected', {
        detail: { message: 'You are currently offline. Please check your connection.' },
      });
      window.dispatchEvent(event);

      throw offlineError;
    }

    return config;
  };
};

// Request timing interceptor
export const createTimingInterceptor = (): RequestInterceptor => {
  return async (config: RequestConfig): Promise<RequestConfig> => {
    // Add performance timing
    (config as RequestConfig & { startTime?: number }).startTime = performance.now();

    return config;
  };
};

export const createTimingResponseInterceptor = (): ResponseInterceptor => {
  return async <T = unknown>(
    response: ApiResponse<T> | Response,
    _config: RequestConfig
  ): Promise<ApiResponse<T> | Response> => {
    // Log response timing
    if (import.meta.env.DEV) {
      const resp = response as any;
      logger.info(`[API Response Timing]`, {
        success: resp.success,
        timestamp: resp.timestamp,
      });
    }

    return response;
  };
};

// Error reporting interceptor
export const createErrorReportingInterceptor = (): ResponseInterceptor => {
  return async <T = unknown>(response: ApiResponse<T> | Response): Promise<ApiResponse<T> | Response> => {
    // Check for error status codes
    if ('status' in response && response.status >= 500) {
      const event = new CustomEvent('error-report', {
        detail: {
          message: `Server error: ${response.status}`,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
      });
      window.dispatchEvent(event);
    }
    return response;
  };
};

// Default interceptors
export const defaultRequestInterceptors = [
  createRequestInterceptor(),
  createAuthInterceptor(),
  createOfflineInterceptor(),
  createTimingInterceptor(),
];

export const defaultResponseInterceptors = [
  createResponseInterceptor(),
  createRetryInterceptor(),
  createRateLimitInterceptor(),
  createTimingResponseInterceptor(),
  createErrorReportingInterceptor(),
];
