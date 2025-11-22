import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/services/logger';
import { AlertCircle } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import { Home } from 'lucide-react';
import { X } from 'lucide-react';
import Button from './Button';
import { errorContextService } from '../../services/errorContextService';
import { errorTranslationService } from '../../services/errorTranslationService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  translatedError?: {
    title: string;
    message: string;
    code?: string;
    suggestion?: string;
  };
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Track error with context service
    try {
      errorContextService.trackError(error, {
        component: 'ErrorBoundary',
        metadata: {
          componentStack: errorInfo.componentStack,
          errorName: error.name,
          errorMessage: error.message,
          stack: error.stack,
        },
      });

      // Try to translate error for better user experience
const translation = errorTranslationService.translateError(
        error.name || 'UNKNOWN_ERROR',
        {
          component: 'ErrorBoundary',
          action: 'error_boundary_catch',
        }
      );481751c1

      // Store translation for display
      if (translation) {
        this.setState((prevState) => ({
          ...prevState,
          translatedError: {
title: 'An error occurred',
            message: translation.userMessage,
            code: error.name,481751c1
            suggestion: translation.suggestion,
          },
        }));
      }
    } catch (contextError) {
      // Fail silently if context service fails
      const errorObj =
        contextError instanceof Error ? contextError : new Error(String(contextError));
      logger.warn('Failed to track error context:', { error: errorObj.message });
    }

    // Log error to console in development
if (process.env.NODE_ENV === 'development') {
      logger.error('ErrorBoundary caught an error:', { error: error.message, stack: error.stack, errorInfo });481751c1
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to external service in production
    if (import.meta.env.PROD) {
      // Try to use Sentry if available (optional dependency)
      // Note: @sentry/react is optional - if not installed, this will gracefully fail
      // Use IIFE to handle async import since componentDidCatch cannot be async
      (async () => {
        try {
          // Check if Sentry is available via window object (if loaded via script tag)
          const win = window as unknown as {
            Sentry?: { captureException: (error: Error, options?: unknown) => void };
          };
          if (win.Sentry?.captureException) {
            win.Sentry.captureException(error, {
              contexts: {
                react: {
                  componentStack: errorInfo.componentStack,
                },
              },
            });
          } else {
            // Sentry not available - use logger
logger.error('Production error:', { error: error.message, stack: error.stack, errorInfo });
          }
        });
      } catch (importError) {
        // Sentry not available or not configured - use logger
        logger.error('Production error:', { error: error.message, stack: error.stack, errorInfo });
      }
    } else {
      // Always log in development
      logger.error('Development error:', { error: error.message, stack: error.stack, errorInfo });481751c1
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>

            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page or
              contact support if the problem persists.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Error Details:</h3>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="primary" onClick={this.handleRetry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              <p>If this problem continues, please contact support.</p>
              <p className="mt-1">Error ID: {this.state.error?.name || 'Unknown'}</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: string) => {
logger.error('Error caught by useErrorHandler:', { error: error.message, stack: error.stack, errorInfo });481751c1

    // Log to external service in production
    if (import.meta.env.PROD) {
      // Send to error tracking service
logger.error('Production error:', { error: error.message, stack: error.stack, errorInfo });481751c1
    }
  };

  return { handleError };
};

// Error types for better error handling
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export const createError = (
  type: ErrorType,
  message: string,
  code?: string,
  details?: Record<string, unknown>
): AppError => ({
  type,
  message,
  code,
  details,
  timestamp: new Date(),
});

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'An unknown error occurred';
};

export const isRetryableError = (error: AppError): boolean => {
  const retryableTypes = [ErrorType.NETWORK, ErrorType.SERVER];

  return retryableTypes.includes(error.type);
};

// Error display component for inline errors
interface ErrorDisplayProps {
  error: AppError | Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
}) => {
  const errorMessage = getErrorMessage(error);
  const isRetryable =
    error && typeof error === 'object' && 'type' in error
      ? isRetryableError(error as AppError)
      : false;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="mt-1 text-sm text-red-700">{errorMessage}</p>

          {isRetryable && onRetry && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 text-red-400 hover:text-red-600"
            aria-label="Dismiss error"
            title="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Global error handler for unhandled promise rejections
export const setupGlobalErrorHandling = () => {
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection:', event.reason);

    // Log to external service in production
    if (import.meta.env.PROD) {
      logger.error('Production unhandled rejection:', event.reason);
    }

    // Prevent the default browser behavior
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    logger.error('Global error:', event.error);

    // Log to external service in production
    if (import.meta.env.PROD) {
      logger.error('Production global error:', event.error);
    }
  });
};

// Initialize global error handling
if (typeof window !== 'undefined') {
  setupGlobalErrorHandling();
}
