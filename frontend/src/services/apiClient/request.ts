// ============================================================================
// API CLIENT REQUEST UTILITIES
// ============================================================================

import { RequestConfig, ApiClientConfig } from './types';

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

  body(data: any): this {
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
      return this.handleError(error, endpoint, config);
    }
  }

  private buildUrl(endpoint: string): string {
    const baseUrl = this.clientConfig.baseURL.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  }

  private buildRequestInit(config: RequestConfig): RequestInit {
    const init: RequestInit = {
      method: config.method,
      headers: config.headers,
    };

    if (config.body && config.method !== 'GET') {
      init.body = typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
    }

    if (config.timeout) {
      // Note: fetch doesn't support timeout directly, would need AbortController
      const controller = new AbortController();
      init.signal = controller.signal;

      setTimeout(() => controller.abort(), config.timeout);
    }

    return init;
  }

  private async makeRequest(
    url: string,
    init: RequestInit,
    config: RequestConfig
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= (config.retries || 0); attempt++) {
      try {
        const response = await fetch(url, init);

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
        lastError = error as Error;

        // Don't retry client errors
        if (error instanceof Error && error.name === 'TypeError') {
          throw error;
        }

        if (attempt < (config.retries || 0)) {
          const delay = this.calculateDelay(attempt);
          await this.delay(delay);
          continue;
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
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

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      if (!response.ok) {
        // Backend sends errors as: { error: "title", message: "user-friendly message", code: "ERROR_CODE" }
        const errorMessage = data.message || data.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } else {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    }
  }

  private handleError(error: Error | unknown, endpoint: string, config: RequestConfig): never {
    const apiError = {
      message: error.message || 'Network request failed',
      statusCode: 0,
      timestamp: new Date().toISOString(),
      path: endpoint,
      method: config.method || 'GET',
    };

    throw apiError;
  }
}
