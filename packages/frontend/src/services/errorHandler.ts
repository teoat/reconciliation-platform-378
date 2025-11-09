import { ApiError } from './enhancedApiClient'

export interface ErrorHandlerConfig {
  showNotifications?: boolean;
  logErrors?: boolean;
  retryableErrors?: number[];
  customHandlers?: Record<number, (error: ApiError) => void>;
}

export class ApiErrorHandler {
  private config: ErrorHandlerConfig;

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      showNotifications: true,
      logErrors: true,
      retryableErrors: [408, 429, 500, 502, 503, 504],
      customHandlers: {},
      ...config
    };
  }

  handle(error: ApiError): void {
    // Log error if enabled
    if (this.config.logErrors) {
      console.error('API Error:', {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        details: error.details
      });
    }

    // Check for custom handlers first
    if (error.statusCode && this.config.customHandlers?.[error.statusCode]) {
      this.config.customHandlers[error.statusCode](error);
      return;
    }

    // Handle specific error codes
    switch (error.statusCode) {
      case 401:
        this.handleUnauthorized(error);
        break;
      case 403:
        this.handleForbidden(error);
        break;
      case 404:
        this.handleNotFound(error);
        break;
      case 422:
        this.handleValidationError(error);
        break;
      case 429:
        this.handleRateLimit(error);
        break;
      case 500:
        this.handleServerError(error);
        break;
      case 0:
        this.handleNetworkError(error);
        break;
      default:
        this.handleGenericError(error);
    }
  }

  private handleUnauthorized(error: ApiError): void {
    if (this.config.showNotifications) {
      this.showNotification('Authentication Error', 'Please log in again', 'error');
    }
    
    // Clear auth token and redirect to login
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }

  private handleForbidden(error: ApiError): void {
    if (this.config.showNotifications) {
      this.showNotification('Access Denied', 'You do not have permission to perform this action', 'error');
    }
  }

  private handleNotFound(error: ApiError): void {
    if (this.config.showNotifications) {
      this.showNotification('Not Found', 'The requested resource was not found', 'warning');
    }
  }

  private handleValidationError(error: ApiError): void {
    const message = error.details?.errors 
      ? `Validation failed: ${Object.values(error.details.errors).join(', ')}`
      : error.message;
    
    if (this.config.showNotifications) {
      this.showNotification('Validation Error', message, 'warning');
    }
  }

  private handleRateLimit(error: ApiError): void {
    if (this.config.showNotifications) {
      this.showNotification('Rate Limited', 'Too many requests. Please try again later.', 'warning');
    }
  }

  private handleServerError(error: ApiError): void {
    if (this.config.showNotifications) {
      this.showNotification('Server Error', 'Something went wrong on our end. Please try again.', 'error');
    }
  }

  private handleNetworkError(error: ApiError): void {
    if (this.config.showNotifications) {
      this.showNotification('Network Error', 'Unable to connect to the server. Please check your connection.', 'error');
    }
  }

  private handleGenericError(error: ApiError): void {
    if (this.config.showNotifications) {
      this.showNotification('Error', error.message, 'error');
    }
  }

  private showNotification(title: string, message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    // This would integrate with your notification system
    // For now, we'll use a simple alert or console log
    if (typeof window !== 'undefined') {
      // Dispatch to Redux store if available
      const event = new CustomEvent('api-error', {
        detail: { title, message, type }
      });
      window.dispatchEvent(event);
    }
  }

  isRetryable(error: ApiError): boolean {
    if (!error.statusCode) return true; // Network errors are retryable
    
    return this.config.retryableErrors?.includes(error.statusCode) || false;
  }

  getRetryDelay(error: ApiError, attempt: number): number {
    if (!this.isRetryable(error)) return 0;

    // Exponential backoff with jitter
    const baseDelay = 1000;
    const maxDelay = 10000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    const jitter = Math.random() * 1000;
    
    return delay + jitter;
  }
}

// Default error handler instance
export const defaultErrorHandler = new ApiErrorHandler();

// Error handler hook for React components
export const useApiErrorHandler = (config?: ErrorHandlerConfig) => {
  const handler = new ApiErrorHandler(config);
  
  return {
    handleError: (error: ApiError) => handler.handle(error),
    isRetryable: (error: ApiError) => handler.isRetryable(error),
    getRetryDelay: (error: ApiError, attempt: number) => handler.getRetryDelay(error, attempt)
  };
};

// Utility functions
export const createApiError = (
  message: string,
  statusCode: number = 0,
  code?: string,
  details?: any
): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};

export const isApiError = (error: any): error is ApiError => {
  return error instanceof Error && 'statusCode' in error;
};

export const getErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const getErrorStatusCode = (error: any): number => {
  if (isApiError(error)) {
    return error.statusCode || 0;
  }
  return 0;
};
