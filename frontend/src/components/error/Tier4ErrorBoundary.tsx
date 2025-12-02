import React, { Component, ErrorInfo, ReactNode } from 'react';
import { tier4ErrorHandler } from '@/services/tier4ErrorHandler';
import { unifiedErrorService } from '@/services/unifiedErrorService';
import { APP_CONFIG } from '@/config/AppConfig';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId?: string;
}

/**
 * Tier 4 Error Boundary
 *
 * Captures React lifecycle errors and integrates with the Tier 4 Error Handling system.
 * Provides user-friendly fallback UI based on error type.
 */
export class Tier4ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { componentName = 'UnknownComponent' } = this.props;

    // 1. Collect Context
    const context = tier4ErrorHandler.collectContext(error, {
      component: componentName,
      action: 'react_lifecycle_error',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });

    // 2. Record Error in Tier 4 System (Pattern Detection)
    tier4ErrorHandler.recordError(error, context);

    // 3. Track in Unified Service (User Journey)
    unifiedErrorService.handleError(error, {
      component: componentName,
      action: 'render',
      ...context,
    }).then((unifiedError) => {
      this.setState({ errorId: unifiedError.id });
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default Fallback UI
      const isDev = APP_CONFIG.IS_DEV;
      const errorMessage = this.state.error?.message || 'An unexpected error occurred.';
      const errorId = this.state.errorId || 'generating...';

      return (
        <div className="min-h-[400px] flex items-center justify-center bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-sm text-gray-500 mb-6">
              We've logged this issue and our team has been notified.
              <br />
              <span className="text-xs text-gray-400 mt-2 block">Error ID: {errorId}</span>
            </p>

            {isDev && this.state.error && (
              <div className="mb-6 text-left bg-gray-900 rounded p-4 overflow-auto max-h-48">
                <p className="text-red-400 font-mono text-xs">{this.state.error.toString()}</p>
                <pre className="text-gray-500 font-mono text-xs mt-2">{this.state.error.stack}</pre>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
