// ============================================================================
// API CLIENT REQUEST UTILITIES
// ============================================================================

import { RequestConfig, ApiClientConfig } from './types';

/**
 * Safely extract error message from unknown error type
 */
function getErrorMessage(error: Error | unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Network request failed';
}

export class RequestBuilder {
  private config: RequestConfig = {};
  private clientConfig: ApiClientConfig;

  constructor(clientConfig: ApiClientConfig) {
    this.clientConfig = clientConfig;
  }

  method(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'): this {
    this.config.method = method;
    return this;
  }

  headers(headers: Record<string, string>): this {
    this.config.headers = { ...this.config.headers, ...headers };
    return this;
  }

  body(data: unknown): this {
    this.config.body = data;
    return this;
  }

  timeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  retries(count: number): this {
    this.config.retries = count;
    return this;
  }

  skipAuth(): this {
    this.config.skipAuth = true;
    return this;
  }

  noCache(): this {
    this.config.cache = false;
    return this;
  }

  build(): RequestConfig {
    return {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      timeout: this.config.timeout || this.clientConfig.timeout,
      retries: this.config.retries || this.clientConfig.retryConfig.maxRetries,
      skipAuth: this.config.skipAuth || false,
      cache: this.config.cache !== false && this.clientConfig.cacheEnabled,
      ...this.config,
    };
  }
}

export class RequestExecutor {
  private clientConfig: ApiClientConfig;

  constructor(clientConfig: ApiClientConfig) {
    this.clientConfig = clientConfig;
  }

  async execute<T = unknown>(endpoint: string, config: RequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint);
    const requestInit = this.buildRequestInit(config);

    try {
      const response = await this.makeRequest(url, requestInit, config);
      return await this.handleResponse(response);
    } catch (error) {
      // handleError throws, so we don't return its result
      this.handleError(error, endpoint, config);
    }
  }

  private buildUrl(endpoint: string): string {
    const baseUrl = this.clientConfig.baseURL.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  }

  private buildRequestInit(config: RequestConfig): {
    init: RequestInit;
    abortController?: AbortController;
    timeoutId?: ReturnType<typeof setTimeout>;
  } {
    const init: RequestInit = {
      method: config.method,
      headers: config.headers,
    };

    if (config.body && config.method !== 'GET') {
      init.body = typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
    }

    let abortController: AbortController | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (config.timeout) {
      // Create AbortController for timeout
      abortController = new AbortController();
      init.signal = abortController.signal;

      // Store timeout ID so it can be cleared
      timeoutId = setTimeout(() => {
        if (abortController && !abortController.signal.aborted) {
          abortController.abort();
        }
      }, config.timeout);
    }

    return { init, abortController, timeoutId };
  }

  private async makeRequest(
    url: string,
    requestInit: { init: RequestInit; abortController?: AbortController; timeoutId?: ReturnType<typeof setTimeout> },
    config: RequestConfig
  ): Promise<Response> {
    const { init, timeoutId } = requestInit;
    let lastError: Error | null = null;

    try {
      for (let attempt = 0; attempt <= (config.retries || 0); attempt++) {
        try {
          const response = await fetch(url, init);

          // Clear timeout on successful response
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          // Don't retry successful responses or client errors (4xx)
          if (response.ok || (response.status >= 400 && response.status < 500)) {
            return response;
          }

          // Retry server errors (5xx) and network errors
          if (attempt < (config.retries || 0)) {
            const delay = this.calculateDelay(attempt);
            await this.delay(delay);
            continue;
          }

          return response;
        } catch (error) {
          // Clear timeout on error
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          if (error instanceof Error) {
            lastError = error;
            // Don't retry abort errors (timeout or manual abort)
            if (error.name === 'AbortError') {
              throw new Error('Request timeout or aborted');
            }
            // Don't retry client errors
            if (error.name === 'TypeError') {
              throw error;
            }
          } else {
            lastError = error instanceof Error ? error : new Error(String(error));
          }

          if (attempt < (config.retries || 0)) {
            const delay = this.calculateDelay(attempt);
            await this.delay(delay);
            continue;
          }
        }
      }

      throw lastError || new Error('Request failed after retries');
    } finally {
      // Ensure timeout is cleared even if request completes
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private calculateDelay(attempt: number): number {
    const baseDelay = this.clientConfig.retryConfig.baseDelay;
    const backoffFactor = this.clientConfig.retryConfig.backoffFactor;
    const maxDelay = this.clientConfig.retryConfig.maxDelay;

    const delay = baseDelay * Math.pow(backoffFactor, attempt);
    return Math.min(delay, maxDelay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async handleResponse<T = unknown>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    // Extract correlation ID from response headers (Agent 1 Task 1.19)
    const correlationId =
      response.headers.get('x-correlation-id') ||
      response.headers.get('X-Correlation-ID') ||
      undefined;

    if (contentType && contentType.includes('application/json')) {
      // Parse JSON with proper error handling
      let data: unknown;
      try {
        data = await response.json();
      } catch (parseError) {
        // JSON parsing failed - try to get text for better error message
        let errorText = '';
        try {
          errorText = await response.text();
        } catch {
          errorText = 'Unable to read response body';
        }

        const error = new Error(
          `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        ) as Error & {
          correlationId?: string;
          statusCode?: number;
          responseData?: unknown;
          originalError?: unknown;
        };
        error.statusCode = response.status;
        error.correlationId = correlationId;
        error.responseData = { raw: errorText };
        error.originalError = parseError;
        throw error;
      }

      if (!response.ok) {
        // Backend sends errors as: { error: "title", message: "user-friendly message", code: "ERROR_CODE" }
        const errorMessage =
          (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
            ? data.message
            : null) ||
          (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
            ? data.error
            : null) ||
          `HTTP ${response.status}`;
        const error = new Error(errorMessage) as Error & {
          correlationId?: string;
          statusCode?: number;
          responseData?: unknown;
        };
        error.statusCode = response.status;
        error.correlationId = correlationId;
        error.responseData = data;
        throw error;
      }

      return data as T;
    } else {
      // Non-JSON response
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch {
          errorText = response.statusText || 'Unknown error';
        }

        const error = new Error(`HTTP ${response.status}: ${errorText}`) as Error & {
          correlationId?: string;
          statusCode?: number;
          responseData?: unknown;
        };
        error.statusCode = response.status;
        error.correlationId = correlationId;
        error.responseData = { raw: errorText };
        throw error;
      }

      // Read text response with error handling
      try {
        return (await response.text()) as T;
      } catch (readError) {
        const error = new Error(
          `Failed to read response body: ${readError instanceof Error ? readError.message : String(readError)}`
        ) as Error & {
          correlationId?: string;
          statusCode?: number;
          originalError?: unknown;
        };
        error.statusCode = response.status;
        error.correlationId = correlationId;
        error.originalError = readError;
        throw error;
      }
    }
  }

  private handleError(error: Error | unknown, endpoint: string, config: RequestConfig): never {
    let errorMessage = getErrorMessage(error);
    
    // Provide better error messages for abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      if (config.timeout) {
        errorMessage = `Request timeout after ${config.timeout}ms`;
      } else {
        errorMessage = 'Request was aborted';
      }
    }
    
    const apiError = {
      message: errorMessage,
      statusCode:
        error instanceof Error && 'statusCode' in error
          ? (error as Error & { statusCode?: number }).statusCode
          : 0,
      timestamp: new Date().toISOString(),
      path: endpoint,
      method: config.method || 'GET',
    };

    throw apiError;
  }
}
