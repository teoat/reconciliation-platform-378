/**
 * Unified Error Boundary - SSOT for Error Boundaries
 * 
 * Consolidates all error boundary implementations into a single, comprehensive solution.
 * Integrates with Tier 4 error handling for advanced error tracking and recovery.
 * 
 * Replaces:
 * - components/ui/ErrorBoundary.tsx
 * - components/ErrorBoundary.tsx
 * - components/reports/components/ErrorBoundary.tsx
 * - utils/lazyLoading.tsx (ErrorBoundary implementation)
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/services/logger';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import Button from './Button';
import { UnifiedErrorService } from '@/services/unifiedErrorService';
import { tier4ErrorHandler } from '@/services/tier4ErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((props: ErrorFallbackProps) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
  showReport?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  level?: 'app' | 'page' | 'feature' | 'component';
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  lastErrorTime: Date | null;
  translatedError?: {
    title: string;
    message: string;
    code?: string;
    suggestion?: string;
  };
  correlationId?: string;
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  retry: () => void;
  reset: () => void;
  reportError: () => void;
  retryCount: number;
  maxRetries: number;
  correlationId?: string;
  translatedError?: {
    title: string;
    message: string;
    code?: string;
    suggestion?: string;
  };
}

// ============================================================================
// UNIFIED ERROR BOUNDARY
// ============================================================================

export class UnifiedErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      lastErrorTime: new Date(),
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Collect Tier 4 context
    const context = tier4ErrorHandler.collectContext(error, {
      component: this.props.componentName || 'UnifiedErrorBoundary',
      action: 'component_error',
      level: this.props.level || 'component',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
        retryCount: this.state.retryCount,
      },
    });

    // Record error with Tier 4
    tier4ErrorHandler.recordError(error, context);

    // Get translated error from UnifiedErrorService
    let translatedError;
    try {
      const errorResult = await UnifiedErrorService.handleErrorWithTranslation(error, {
        component: this.props.componentName || 'UnifiedErrorBoundary',
        action: 'error_boundary_catch',
        metadata: {
          componentStack: errorInfo.componentStack,
          errorName: error.name,
          errorMessage: error.message,
          stack: error.stack,
          correlationId: context.correlationId,
        },
      });

      translatedError = {
        title: 'An error occurred',
        message: errorResult.userMessage,
        code: errorResult.parsed.code,
        suggestion: errorResult.translation?.suggestion,
      };
    } catch (contextError) {
      const errorObj =
        contextError instanceof Error ? contextError : new Error(String(contextError));
      logger.warn('Failed to translate error:', { error: errorObj.message });
    }

    // Update state
    this.setState({
      error,
      errorInfo,
      translatedError,
      correlationId: context.correlationId,
    });

    // Log error
    logger.error('UnifiedErrorBoundary caught error', {
      error: error.message,
      component: this.props.componentName,
      level: this.props.level,
      correlationId: context.correlationId,
      stack: error.stack,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to external service in production
    if (import.meta.env.PROD) {
      (async () => {
        try {
          const win = window as unknown as {
            Sentry?: { captureException: (error: Error, options?: unknown) => void };
          };
          if (win.Sentry?.captureException) {
            win.Sentry.captureException(error, {
              contexts: {
                react: {
                  componentStack: errorInfo.componentStack,
                },
                tier4: {
                  correlationId: context.correlationId,
                  level: this.props.level,
                },
              },
            });
          }
        } catch (importError) {
          logger.error('Failed to log to Sentry:', {
            error: importError instanceof Error ? importError.message : String(importError),
          });
        }
      })();
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if props change
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
    if (this.resetTimeoutId !== null) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      logger.warn('Max retries reached', { retryCount, maxRetries });
      return;
    }

    logger.info('Retrying after error', { retryCount: retryCount + 1 });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1,
      lastErrorTime: null,
    });
  };

  handleReset = () => {
    this.resetError();
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    const { error, errorInfo, correlationId } = this.state;
    if (!error) return;

    // Prepare error report
    const report = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo?.componentStack,
      },
      correlationId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log report (could be sent to backend)
    logger.info('Error report generated', report);

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(report, null, 2)).then(
      () => {
        alert('Error report copied to clipboard');
      },
      (err) => {
        logger.error('Failed to copy error report', { error: err });
      }
    );
  };

  private resetError() {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: null,
      translatedError: undefined,
      correlationId: undefined,
    });
  }

  render() {
    const { hasError, error, errorInfo, retryCount, correlationId, translatedError } = this.state;
    const {
      children,
      fallback,
      showRetry = true,
      showReport = true,
      maxRetries = 3,
      level = 'component',
    } = this.props;

    if (hasError && error) {
      // Custom fallback
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback({
            error,
            errorInfo,
            retry: this.handleRetry,
            reset: this.handleReset,
            reportError: this.handleReportError,
            retryCount,
            maxRetries,
            correlationId,
            translatedError,
          });
        }
        return fallback;
      }

      // Default error UI based on level
      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          retry={this.handleRetry}
          reset={this.handleReset}
          goHome={this.handleGoHome}
          reportError={this.handleReportError}
          retryCount={retryCount}
          maxRetries={maxRetries}
          showRetry={showRetry}
          showReport={showReport}
          level={level}
          correlationId={correlationId}
          translatedError={translatedError}
        />
      );
    }

    return children;
  }
}

// ============================================================================
// DEFAULT ERROR FALLBACK
// ============================================================================

interface DefaultErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  retry: () => void;
  reset: () => void;
  goHome: () => void;
  reportError: () => void;
  retryCount: number;
  maxRetries: number;
  showRetry: boolean;
  showReport: boolean;
  level: 'app' | 'page' | 'feature' | 'component';
  correlationId?: string;
  translatedError?: {
    title: string;
    message: string;
    code?: string;
    suggestion?: string;
  };
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  errorInfo,
  retry,
  reset,
  goHome,
  reportError,
  retryCount,
  maxRetries,
  showRetry,
  showReport,
  level,
  correlationId,
  translatedError,
}) => {
  // Different UI based on error level
  const isFullScreen = level === 'app' || level === 'page';

  const errorDisplay = (
    <div className={isFullScreen ? 'min-h-screen bg-gray-50 flex items-center justify-center p-4' : 'bg-red-50 border border-red-200 rounded-lg p-4'}>
      <div className={isFullScreen ? 'max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center' : 'w-full'}>
        <div className={isFullScreen ? 'mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6' : 'flex items-start mb-4'}>
          <AlertCircle className={isFullScreen ? 'h-8 w-8 text-red-600' : 'h-5 w-5 text-red-400 mr-3 flex-shrink-0'} />
          {!isFullScreen && (
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
            </div>
          )}
        </div>

        {isFullScreen && (
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {translatedError?.title || 'Something went wrong'}
          </h1>
        )}

        <p className={isFullScreen ? 'text-gray-600 mb-6' : 'text-sm text-red-700 mb-3'}>
          {translatedError?.message ||
            "We're sorry, but something unexpected happened. Please try refreshing or contact support if the problem persists."}
        </p>

        {translatedError?.suggestion && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-left">
            <p className="text-sm text-blue-800">
              <strong>Suggestion:</strong> {translatedError.suggestion}
            </p>
          </div>
        )}

        {import.meta.env.DEV && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Error Details:</h3>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all">
              {error.toString()}
            </pre>
            {errorInfo && (
              <pre className="text-xs text-gray-500 mt-2 whitespace-pre-wrap break-all">
                {errorInfo.componentStack}
              </pre>
            )}
            {correlationId && (
              <p className="text-xs text-gray-500 mt-2">
                <strong>Correlation ID:</strong> {correlationId}
              </p>
            )}
          </div>
        )}

        <div className={isFullScreen ? 'flex flex-col sm:flex-row gap-3 mb-4' : 'flex flex-wrap gap-2 mb-3'}>
          {showRetry && retryCount < maxRetries && (
            <Button
              variant="primary"
              onClick={retry}
              className={isFullScreen ? 'flex-1' : ''}
              size={isFullScreen ? 'md' : 'sm'}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
            </Button>
          )}

          {isFullScreen && (
            <>
              <Button
                variant="outline"
                onClick={reset}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
              <Button
                variant="outline"
                onClick={goHome}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </>
          )}

          {showReport && (
            <Button
              variant="outline"
              onClick={reportError}
              size={isFullScreen ? 'md' : 'sm'}
            >
              <Bug className="h-4 w-4 mr-2" />
              Report
            </Button>
          )}
        </div>

        {translatedError?.code && (
          <div className="text-sm text-gray-500">
            <p>Error Code: {translatedError.code}</p>
            {correlationId && <p className="mt-1">ID: {correlationId}</p>}
          </div>
        )}
      </div>
    </div>
  );

  return errorDisplay;
};

// ============================================================================
// HIGHER-ORDER COMPONENT
// ============================================================================

export function withUnifiedErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <UnifiedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </UnifiedErrorBoundary>
  );

  WrappedComponent.displayName = `withUnifiedErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// ============================================================================
// HOOK FOR IMPERATIVE ERROR HANDLING
// ============================================================================

export function useUnifiedErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const showError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { showError, resetError };
}

// ============================================================================
// EXPORT
// ============================================================================

export default UnifiedErrorBoundary;

// Re-export for backward compatibility
export { UnifiedErrorBoundary as ErrorBoundary };

