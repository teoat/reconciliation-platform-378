// ============================================================================
// API CLIENT UTILITIES
// ============================================================================

import { ApiClientConfig, RetryConfig, ApiErrorLike } from './types';
import { buildQueryString } from '../utils/params';

export class UrlBuilder {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  build(endpoint: string, params?: Record<string, unknown>): string {
    let url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    url = `${this.baseUrl}${url}`;

    const qs = buildQueryString(params);
    return qs ? `${url}${qs}` : url;
  }

  join(...parts: string[]): string {
    return parts
      .map((part) => part.replace(/^\/+|\/+$/g, '')) // Remove leading/trailing slashes
      .filter((part) => part.length > 0) // Remove empty parts
      .join('/');
  }
}

export class ConfigBuilder {
  static createDefaultConfig(): ApiClientConfig {
    // Use import.meta.env for Vite compatibility, fallback to process.env for tests/Node, or default
    // In development, use relative URL to leverage Vite proxy
    // In production, use full URL from environment variable
    const isDevelopment = import.meta.env?.DEV || import.meta.env?.MODE === 'development';
    
    let apiUrl: string;
    if (import.meta.env?.VITE_API_URL) {
      apiUrl = import.meta.env.VITE_API_URL;
    } else if (isDevelopment) {
      // Use relative URL in development to leverage Vite proxy
      apiUrl = '/api/v1';
    } else {
      // Production fallback with /v1 suffix
      apiUrl = 'http://localhost:2000/api/v1';
    }

    return {
      baseURL: apiUrl,
      timeout: 30000, // 30 seconds
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000, // 1 second
        maxDelay: 10000, // 10 seconds
        backoffFactor: 2,
      },
      cacheEnabled: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    };
  }

  static mergeConfigs(base: ApiClientConfig, overrides: Partial<ApiClientConfig>): ApiClientConfig {
    return {
      ...base,
      ...overrides,
      retryConfig: {
        ...base.retryConfig,
        ...overrides.retryConfig,
      },
    };
  }
}

export class ErrorClassifier {
  static isRetryableError(error: ApiErrorLike): boolean {
    // Network errors are retryable
    const name = error instanceof Error ? error.name : error.name;
    const message = error instanceof Error ? error.message : error.message;
    const statusCode =
      (error as ApiErrorLike & { statusCode?: number }).statusCode ||
      (error instanceof Error && 'statusCode' in error
        ? (error as ApiErrorLike & { statusCode?: number }).statusCode
        : undefined);

    if (name === 'TypeError' || (message && message.includes('fetch'))) {
      return true;
    }

    // Server errors (5xx) are retryable
    if (statusCode && statusCode >= 500) {
      return true;
    }

    // Timeout errors are retryable
    if (name === 'AbortError' || (message && message.includes('timeout'))) {
      return true;
    }

    // Client errors (4xx) are not retryable (except 429 Too Many Requests)
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return statusCode === 429; // Too Many Requests
    }

    return false;
  }

  static isAuthError(error: ApiErrorLike): boolean {
    const statusCode =
      (error as ApiErrorLike & { statusCode?: number }).statusCode ||
      (error instanceof Error && 'statusCode' in error
        ? (error as ApiErrorLike & { statusCode?: number }).statusCode
        : undefined);
    return statusCode === 401 || statusCode === 403;
  }

  static isNetworkError(error: ApiErrorLike): boolean {
    const name = error instanceof Error ? error.name : error.name;
    const message = error instanceof Error ? error.message : error.message;
    return (
      name === 'TypeError' ||
      (message && (message.includes('fetch') || message.includes('network')))
    );
  }

  static getErrorCategory(error: ApiErrorLike): string {
    if (this.isAuthError(error)) return 'auth';
    if (this.isNetworkError(error)) return 'network';
    const statusCode =
      (error as ApiErrorLike & { statusCode?: number }).statusCode ||
      (error instanceof Error && 'statusCode' in error
        ? (error as ApiErrorLike & { statusCode?: number }).statusCode
        : undefined);
    if (statusCode && statusCode >= 500) return 'server';
    if (statusCode && statusCode >= 400) return 'client';
    return 'unknown';
  }
}

export class RequestIdGenerator {
  private static counter = 0;

  static generate(): string {
    return `req_${Date.now()}_${++this.counter}`;
  }
}

export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  recordRequest(endpoint: string, duration: number): void {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }

    const timings = this.metrics.get(endpoint)!;
    timings.push(duration);

    // Keep only last 100 measurements
    if (timings.length > 100) {
      timings.shift();
    }
  }

  getAverageResponseTime(endpoint: string): number {
    const timings = this.metrics.get(endpoint);
    if (!timings || timings.length === 0) return 0;

    return timings.reduce((sum, time) => sum + time, 0) / timings.length;
  }

  getMetrics(): Record<string, { average: number; count: number; min: number; max: number }> {
    const result: Record<string, { average: number; count: number; min: number; max: number }> = {};

    for (const [endpoint, timings] of this.metrics.entries()) {
      if (timings.length === 0) continue;

      result[endpoint] = {
        average: timings.reduce((sum, time) => sum + time, 0) / timings.length,
        count: timings.length,
        min: Math.min(...timings),
        max: Math.max(...timings),
      };
    }

    return result;
  }

  clear(): void {
    this.metrics.clear();
  }
}

export class CacheKeyGenerator {
  static generate(endpoint: string, params?: Record<string, unknown>): string {
    let key = endpoint;

    if (params) {
      // Sort keys for consistent cache keys
      const sortedKeys = Object.keys(params).sort();
      const paramString = sortedKeys.map((key) => `${key}=${params[key]}`).join('&');

      if (paramString) {
        key += `?${paramString}`;
      }
    }

    return key;
  }
}
