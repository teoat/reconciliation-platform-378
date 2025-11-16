import { RequestInterceptor, ResponseInterceptor, ApiError } from './enhancedApiClient'
import { logger } from '@/services/logger'
import { ApiRequestConfig } from '../types/api';

// Request interceptor for adding common headers and logging
export const createRequestInterceptor = (): RequestInterceptor => ({
  onRequest: async (config: ApiRequestConfig): Promise<ApiRequestConfig> => {
    // Add request ID for tracking
    const requestId = Math.random().toString(36).substr(2, 9);
    config.headers = {
      ...config.headers,
      'X-Request-ID': requestId,
      'X-Client-Version': '1.0.0',
      'X-Platform': 'web'
    };

    // Add timestamp for request timing
    config.headers['X-Request-Timestamp'] = Date.now().toString();

    // Log request in development
    if (import.meta.env.DEV) {
      logger.info(`[API Request] ${config.method || 'GET'} ${config.url || ''}`, {
        requestId,
        headers: config.headers,
        body: config.body
      });
    }

    return config;
  },

  onRequestError: async (error: Error | unknown): Promise<never> => {
    logger.error('[API Request Error]', error);
    throw error;
  }
});

// Response interceptor for handling common responses
export const createResponseInterceptor = (): ResponseInterceptor => ({
  onResponse: async (response: Response & { url?: string; status?: number; headers?: Headers }): Promise<Response> => {
    // Log response in development
    if (import.meta.env.DEV) {
      const requestId = response.headers.get('X-Request-ID');
      const requestTimestamp = response.headers.get('X-Request-Timestamp');
      const duration = requestTimestamp 
        ? Date.now() - parseInt(requestTimestamp)
        : 0;

      logger.info(`[API Response] ${response.status} ${response.url}`, {
        requestId,
        duration: `${duration}ms`,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      });
    }

    return response;
  },

  onResponseError: async (error: ApiError): Promise<never> => {
    // Log response error in development
    if (import.meta.env.DEV) {
      logger.error('[API Response Error]', {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        details: error.details
      });
    }

    throw error;
  }
});

// Authentication interceptor
export const createAuthInterceptor = (): RequestInterceptor => ({
  onRequest: async (config: ApiRequestConfig): Promise<ApiRequestConfig> => {
    // Skip auth for certain endpoints
    const skipAuthEndpoints = ['/auth/login', '/auth/register', '/health'];
    const shouldSkipAuth = skipAuthEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );

    if (!shouldSkipAuth) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
      }
    }

    return config;
  }
});

// Retry interceptor for specific error types
export const createRetryInterceptor = (): ResponseInterceptor => ({
  onResponseError: async (error: ApiError): Promise<never> => {
    // Only retry on specific error codes
    const retryableCodes = [408, 429, 500, 502, 503, 504];
    
    if (error.statusCode && retryableCodes.includes(error.statusCode)) {
      // Add retry flag to error
      (error as ApiError & { shouldRetry?: boolean }).shouldRetry = true;
    }

    throw error;
  }
});

// Rate limiting interceptor
export const createRateLimitInterceptor = (): ResponseInterceptor => ({
  onResponseError: async (error: ApiError): Promise<never> => {
    if (error.statusCode === 429) {
      const retryAfter = error.details?.retryAfter || 60;
      
      // Show rate limit notification
      const event = new CustomEvent('rate-limit', {
        detail: { retryAfter, message: error.message }
      });
      window.dispatchEvent(event);
    }

    throw error;
  }
});

// Offline detection interceptor
export const createOfflineInterceptor = (): RequestInterceptor => ({
  onRequest: async (config: ApiRequestConfig): Promise<ApiRequestConfig> => {
    if (!navigator.onLine) {
      const offlineError = new Error('You are currently offline') as ApiError;
      offlineError.statusCode = 0;
      offlineError.code = 'OFFLINE';
      
      // Show offline notification
      const event = new CustomEvent('offline-detected', {
        detail: { message: 'You are currently offline. Please check your connection.' }
      });
      window.dispatchEvent(event);
      
      throw offlineError;
    }

    return config;
  }
});

// Request timing interceptor
export const createTimingInterceptor = (): RequestInterceptor => ({
  onRequest: async (config: ApiRequestConfig): Promise<ApiRequestConfig> => {
    // Add performance timing
    config.startTime = performance.now();

    return config;
  }
});

export const createTimingResponseInterceptor = (): ResponseInterceptor => ({
  onResponse: async (response: Response & { url?: string; status?: number; headers?: Headers; config?: ApiRequestConfig }) => {
    // Calculate request duration
    if (response.config?.startTime) {
      const endTime = performance.now();
      const duration = endTime - response.config.startTime;
      
      // Log slow requests
      if (duration > 5000) { // 5 seconds
        logger.warning(`[Slow Request] ${response.url} took ${duration.toFixed(2)}ms`, { duration, url: response.url });
      }
    }

    return response;
  }
});

// Error reporting interceptor
export const createErrorReportingInterceptor = (): ResponseInterceptor => ({
  onResponseError: async (error: ApiError): Promise<never> => {
    // Report critical errors to monitoring service
    if (error.statusCode && error.statusCode >= 500) {
      const event = new CustomEvent('error-report', {
        detail: {
          message: error.message,
          statusCode: error.statusCode,
          code: error.code,
          details: error.details,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      });
      window.dispatchEvent(event);
    }

    throw error;
  }
});

// Default interceptors
export const defaultRequestInterceptors = [
  createRequestInterceptor(),
  createAuthInterceptor(),
  createOfflineInterceptor(),
  createTimingInterceptor()
];

export const defaultResponseInterceptors = [
  createResponseInterceptor(),
  createRetryInterceptor(),
  createRateLimitInterceptor(),
  createTimingResponseInterceptor(),
  createErrorReportingInterceptor()
];
