// Enhanced Error Boundary Component
// Provides comprehensive error handling with recovery options

import React, { Component, ReactNode } from 'react';
import { logger } from '../services/logger';
import { ErrorHandler, ApplicationError, ErrorSeverity } from '../utils/errorHandling';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: ApplicationError, errorInfo: React.ErrorInfo) => void;
  showRetry?: boolean;
  showReport?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ErrorFallbackProps {
  error: ApplicationError;
  retry: () => void;
  reset: () => void;
  reportError: () => void;
  retryCount: number;
  maxRetries: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: ApplicationError | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  lastErrorTime: Date | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Convert to ApplicationError
    const appError = ErrorHandler.getInstance().handle(error, {
      component: 'ErrorBoundary',
      source: 'getDerivedStateFromError',
    });

    return {
      hasError: true,
      error: appError,
      lastErrorTime: new Date(),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = ErrorHandler.getInstance().handle(error, {
      component: 'ErrorBoundary',
      source: 'componentDidCatch',
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    this.setState({
      error: appError,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }

    // Log additional context
    logger.error('Error boundary caught error', {
      error: appError.message,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      severity: appError.severity,
      category: appError.category,
    });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if props change (for dynamic content)
    if (hasError && resetOnPropsChange && resetKeys) {
      const shouldReset = resetKeys.some((key, index) => {
        const prevKey = Array.isArray(prevProps.resetKeys) ? prevProps.resetKeys[index] : undefined;
        return key !== prevKey;
      });

      if (shouldReset) {
        this.resetError();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      logger.logUserAction('error-boundary-retry', 'ErrorBoundary', {
        retryCount: retryCount + 1,
        maxRetries,
      });

      this.setState((prevState) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private handleReset = () => {
    logger.logUserAction('error-boundary-reset', 'ErrorBoundary', {
      retryCount: this.state.retryCount,
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: null,
    });
  };

  private handleReportError = () => {
    const { error, errorInfo } = this.state;

    if (error) {
      // Report error to external service (e.g., Sentry, LogRocket)
      logger.error('User reported error', {
        error: error.message,
        severity: error.severity,
        category: error.category,
        componentStack: errorInfo?.componentStack,
        userReported: true,
        timestamp: new Date().toISOString(),
      });

      // You could integrate with error reporting services here
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });

      logger.logUserAction('error-reported', 'ErrorBoundary', {
        error: error.message,
        severity: error.severity,
      });
    }
  };

  private resetError() {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: null,
    });
  }

  render() {
    const { hasError, error, retryCount } = this.state;
    const {
      children,
      fallback: Fallback,
      showRetry = true,
      showReport = true,
      maxRetries = 3,
    } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (Fallback) {
        return (
          <Fallback
            error={error}
            retry={this.handleRetry}
            reset={this.handleReset}
            reportError={this.handleReportError}
            retryCount={retryCount}
            maxRetries={maxRetries}
          />
        );
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={error}
          retry={this.handleRetry}
          reset={this.handleReset}
          reportError={this.handleReportError}
          retryCount={retryCount}
          maxRetries={maxRetries}
          showRetry={showRetry}
          showReport={showReport}
        />
      );
    }

    return children;
  }
}

// Default error fallback component
interface DefaultErrorFallbackProps extends ErrorFallbackProps {
  showRetry: boolean;
  showReport: boolean;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  retry,
  reset,
  reportError,
  retryCount,
  maxRetries,
  showRetry,
  showReport,
}) => {
  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'text-red-600 bg-red-50 border-red-200';
      case ErrorSeverity.HIGH:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case ErrorSeverity.MEDIUM:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case ErrorSeverity.LOW:
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return '🚨';
      case ErrorSeverity.HIGH:
        return '⚠️';
      case ErrorSeverity.MEDIUM:
        return '🔔';
      case ErrorSeverity.LOW:
      default:
        return 'ℹ️';
    }
  };

  return (
    <div
      className={`min-h-[400px] flex items-center justify-center p-6 ${getSeverityColor(error.severity)}`}
    >
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3" role="img" aria-label="Error">
            {getSeverityIcon(error.severity)}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {error.severity === ErrorSeverity.CRITICAL
                ? 'Critical Error'
                : error.severity === ErrorSeverity.HIGH
                  ? 'Error Occurred'
                  : 'Something went wrong'}
            </h2>
            <p className="text-sm text-gray-600 capitalize">{error.category.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-2">{error.message}</p>
          {error.code && (
            <p className="text-sm text-gray-500 font-mono">Error code: {error.code}</p>
          )}
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Retry attempts: {retryCount} / {maxRetries}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {showRetry && retryCount < maxRetries && (
            <button
              onClick={retry}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
          )}

          <button
            onClick={reset}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Reset
          </button>

          {showReport && (
            <button
              onClick={reportError}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Report Issue
            </button>
          )}
        </div>

        {import.meta.env.DEV && error.context && (
          <details className="mt-4">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Debug Information
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(error.context, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for imperative error handling
export function useErrorBoundary() {
  const [error, setError] = React.useState<ApplicationError | null>(null);

  const captureError = React.useCallback((error: unknown, context?: Record<string, unknown>) => {
    const appError = ErrorHandler.getInstance().handle(error, context);
    setError(appError);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error to trigger nearest error boundary
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, clearError };
}

export default ErrorBoundary;
