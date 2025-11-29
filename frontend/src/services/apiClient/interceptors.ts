// ============================================================================
// API CLIENT INTERCEPTORS
// ============================================================================
import { logger } from '@/services/logger';
import { csrfManager } from '../authSecurity';


import { RequestConfig, ApiResponse, ApiErrorLike } from './types';

export interface RequestInterceptor {
  (config: RequestConfig): RequestConfig | Promise<RequestConfig>;
}

export interface ResponseInterceptor {
  <T = unknown>(
    response: ApiResponse<T> | Response,
    config: RequestConfig
  ): ApiResponse<T> | Response | Promise<ApiResponse<T> | Response>;
}

export interface ErrorInterceptor {
  (error: ApiErrorLike, config: RequestConfig): ApiErrorLike | Promise<ApiErrorLike>;
}

export class InterceptorManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  // Request interceptors
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  removeRequestInterceptor(interceptor: RequestInterceptor): void {
    const index = this.requestInterceptors.indexOf(interceptor);
    if (index > -1) {
      this.requestInterceptors.splice(index, 1);
    }
  }

  async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;

    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }

    return processedConfig;
  }

  // Response interceptors
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  removeResponseInterceptor(interceptor: ResponseInterceptor): void {
    const index = this.responseInterceptors.indexOf(interceptor);
    if (index > -1) {
      this.responseInterceptors.splice(index, 1);
    }
  }

  async applyResponseInterceptors<T = unknown>(
    response: ApiResponse<T> | Response,
    config: RequestConfig
  ): Promise<ApiResponse<T> | Response> {
    let processedResponse = response;

    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse, config);
    }

    return processedResponse;
  }

  // Error interceptors
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  removeErrorInterceptor(interceptor: ErrorInterceptor): void {
    const index = this.errorInterceptors.indexOf(interceptor);
    if (index > -1) {
      this.errorInterceptors.splice(index, 1);
    }
  }

  async applyErrorInterceptors(error: ApiErrorLike, config: RequestConfig): Promise<ApiErrorLike> {
    let processedError = error;

    for (const interceptor of this.errorInterceptors) {
      processedError = await interceptor(processedError, config);
    }

    return processedError;
  }

  // Clear all interceptors
  clear(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorInterceptors = [];
  }
}

// ============================================================================
// BUILT-IN INTERCEPTORS
// ============================================================================

export class AuthInterceptor {
  private refreshTokenInProgress = false;
  private refreshTokenPromise: Promise<string | null> | null = null;

  private getAuthToken(): string | null {
    return localStorage.getItem('better-auth-token');
  }

  private async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshTokenInProgress && this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenInProgress = true;
    this.refreshTokenPromise = this._doRefreshToken();

    try {
      const result = await this.refreshTokenPromise;
      return result;
    } finally {
      this.refreshTokenInProgress = false;
      this.refreshTokenPromise = null;
    }
  }

  private async _doRefreshToken(): Promise<string | null> {
    try {
      // Use better-auth client to refresh session
      // We need to dynamically import to avoid circular dependencies if auth-client imports apiClient
      // But auth-client seems independent.
      // However, to be safe and clean:
      const { authClient } = await import('../../lib/auth-client');

      // better-auth refresh usually happens automatically or via getSession
      // But we can force it if needed. 
      // authClient.refreshSession() is not always available depending on config, 
      // but getSession() usually refreshes if close to expiry.
      // Actually, better-auth has a specific endpoint for refresh if using tokens.

      // For now, let's try to get the session which might trigger refresh
      await authClient.getSession();

      // better-auth updates localStorage automatically
      const newToken = localStorage.getItem('better-auth-token');

      if (newToken) {
        logger.info('Token refreshed successfully via better-auth');
        return newToken;
      }
    } catch (error) {
      logger.error('Token refresh failed', { error });
    }

    return null;
  }

  async request(config: RequestConfig): Promise<RequestConfig> {
    if (!config.skipAuth) {
      // Add CSRF token for state-changing requests
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method || 'GET')) {
        try {
          const csrfToken = await csrfManager.getToken();
          config.headers = {
            ...config.headers,
            'X-CSRF-Token': csrfToken,
          };
        } catch (error) {
          logger.warning('Failed to get CSRF token', { error });
        }
      }

      // Add auth token from better-auth
      const token = this.getAuthToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }
    return config;
  }

  response<T = unknown>(
    response: ApiResponse<T> | Response,
    config: RequestConfig
  ): ApiResponse<T> | Response {
    return response;
  }

  async error(error: ApiErrorLike, config: RequestConfig): Promise<ApiErrorLike> {
    // Handle 401 unauthorized - try token refresh
    if ((error as ApiErrorLike & { statusCode?: number }).statusCode === 401 && !config.skipAuth && !config.skipTokenRefresh) {
      logger.info('Attempting token refresh due to 401');
      const newToken = await this.refreshAccessToken();

      if (newToken) {
        // Retry the request with new token
        logger.info('Token refreshed, request can be retried');
        // Note: Actual retry would need to be handled by the API client
        // For now, we just update the token for future requests
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
        };
      } else {
        // Refresh failed - trigger logout
        logger.error('Token refresh failed, clearing auth');
        // Clear better-auth token
        localStorage.removeItem('better-auth-token');

        // Dispatch custom event for logout
        window.dispatchEvent(new CustomEvent('auth:logout-required'));
      }
    }
    return error;
  }
}

export class LoggingInterceptor {
  request(config: RequestConfig): RequestConfig {
    logger.info(`[API Request] ${config.method} ${config}`);
    return config;
  }

  response<T = unknown>(
    response: ApiResponse<T> | Response,
    config: RequestConfig
  ): ApiResponse<T> | Response {
    logger.info(`[API Response] ${config.method} ${config} - Success`);
    return response;
  }

  error(error: ApiErrorLike, config: RequestConfig): ApiErrorLike {
    const message = error instanceof Error ? error.message : error.message || 'Unknown error';
    logger.error(`[API Error] ${config.method} ${config} - ${message}`);
    return error;
  }
}

export class LoadingInterceptor {
  private activeRequests = 0;
  private loadingCallbacks: Array<(loading: boolean) => void> = [];

  onLoadingChange(callback: (loading: boolean) => void): void {
    this.loadingCallbacks.push(callback);
  }

  removeLoadingCallback(callback: (loading: boolean) => void): void {
    const index = this.loadingCallbacks.indexOf(callback);
    if (index > -1) {
      this.loadingCallbacks.splice(index, 1);
    }
  }

  request(config: RequestConfig): RequestConfig {
    this.activeRequests++;
    this.notifyLoadingChange();
    return config;
  }

  response<T = unknown>(
    response: ApiResponse<T> | Response,
    config: RequestConfig
  ): ApiResponse<T> | Response {
    this.activeRequests--;
    this.notifyLoadingChange();
    return response;
  }

  error(error: ApiErrorLike, config: RequestConfig): ApiErrorLike {
    this.activeRequests--;
    this.notifyLoadingChange();
    return error;
  }

  private notifyLoadingChange(): void {
    const isLoading = this.activeRequests > 0;
    this.loadingCallbacks.forEach((callback) => callback(isLoading));
  }
}
