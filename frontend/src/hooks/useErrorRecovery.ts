/**
 * useErrorRecovery Hook
 * Provides error recovery suggestions and actions
 * Essential for Task 5.4: Error Messaging UX
 */

import { useMemo } from 'react';
import { ErrorRecoveryAction } from '../components/ui/UserFriendlyError';

export interface ErrorContext {
  component?: string;
  action?: string;
  data?: Record<string, unknown>;
  timestamp?: Date;
}

export interface ErrorRecoveryOptions {
  error: Error | string;
  context?: ErrorContext;
  onRetry?: () => void | Promise<void>;
  onReset?: () => void;
  onReport?: () => void;
}

/**
 * useErrorRecovery - Provides error recovery suggestions and actions
 */
export const useErrorRecovery = ({
  error,
  context,
  onRetry,
  onReset,
  onReport,
}: ErrorRecoveryOptions) => {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorType = error instanceof Error ? error.constructor.name : 'Error';

  // Generate recovery actions based on error type and context
  const recoveryActions = useMemo<ErrorRecoveryAction[]>(() => {
    const actions: ErrorRecoveryAction[] = [];

    // Retry action
    if (onRetry) {
      actions.push({
        label: 'Retry',
        action: onRetry,
        variant: 'primary',
      });
    }

    // Reset action
    if (onReset) {
      actions.push({
        label: 'Reset',
        action: onReset,
        variant: 'secondary',
      });
    }

    // Report action
    if (onReport) {
      actions.push({
        label: 'Report Issue',
        action: onReport,
        variant: 'outline',
      });
    }

    return actions;
  }, [onRetry, onReset, onReport]);

  // Generate suggestions based on error type
  const suggestions = useMemo<string[]>(() => {
    const suggestionsList: string[] = [];

    // Network errors
    if (
      errorMessage.toLowerCase().includes('network') ||
      errorMessage.toLowerCase().includes('fetch')
    ) {
      suggestionsList.push('Check your internet connection');
      suggestionsList.push('Verify that the server is reachable');
      suggestionsList.push('Try again in a few moments');
    }

    // Authentication errors
    if (
      errorMessage.toLowerCase().includes('auth') ||
      errorMessage.toLowerCase().includes('unauthorized')
    ) {
      suggestionsList.push('Please log in again');
      suggestionsList.push("Check that your session hasn't expired");
      suggestionsList.push('Verify your account permissions');
    }

    // Validation errors
    if (
      errorMessage.toLowerCase().includes('valid') ||
      errorMessage.toLowerCase().includes('required')
    ) {
      suggestionsList.push('Check that all required fields are filled');
      suggestionsList.push('Verify that input values are correct');
      suggestionsList.push('Review the form for highlighted errors');
    }

    // Permission errors
    if (
      errorMessage.toLowerCase().includes('permission') ||
      errorMessage.toLowerCase().includes('forbidden')
    ) {
      suggestionsList.push('Contact your administrator for access');
      suggestionsList.push('Verify that you have the necessary permissions');
    }

    // Generic suggestions
    if (suggestionsList.length === 0) {
      suggestionsList.push('Refresh the page and try again');
      suggestionsList.push('Clear your browser cache if the problem persists');
      suggestionsList.push('Contact support if the error continues');
    }

    return suggestionsList;
  }, [errorMessage]);

  // Get user-friendly error title
  const errorTitle = useMemo(() => {
    if (errorMessage.toLowerCase().includes('network')) {
      return 'Connection Error';
    }
    if (
      errorMessage.toLowerCase().includes('auth') ||
      errorMessage.toLowerCase().includes('unauthorized')
    ) {
      return 'Authentication Error';
    }
    if (
      errorMessage.toLowerCase().includes('permission') ||
      errorMessage.toLowerCase().includes('forbidden')
    ) {
      return 'Access Denied';
    }
    if (errorMessage.toLowerCase().includes('valid')) {
      return 'Validation Error';
    }
    if (errorMessage.toLowerCase().includes('not found')) {
      return 'Not Found';
    }
    return errorType || 'Error';
  }, [errorMessage, errorType]);

  return {
    recoveryActions,
    suggestions,
    errorTitle,
    errorMessage,
  };
};

export default useErrorRecovery;
