/**
 * Error Message Utilities
 * Provides user-friendly error messages and recovery guidance
 * Essential for Task 5.4: Error Messaging UX
 */

export interface UserFriendlyErrorInfo {
  title: string;
  message: string;
  suggestions: string[];
  recoveryActions?: {
    label: string;
    action: string;
  }[];
  severity: 'error' | 'warning' | 'info';
}

/**
 * Convert technical errors to user-friendly messages
 */
export const getUserFriendlyError = (error: Error | string): UserFriendlyErrorInfo => {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorName = error instanceof Error ? error.name : 'Error';

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout')
  ) {
    return {
      title: 'Connection Problem',
      message:
        'Unable to connect to the server. Please check your internet connection and try again.',
      suggestions: [
        'Check your internet connection',
        'Verify that the server is reachable',
        'Try again in a few moments',
        'If the problem persists, contact support',
      ],
      severity: 'error',
    };
  }

  // Authentication errors
  if (
    errorMessage.includes('auth') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('401')
  ) {
    return {
      title: 'Authentication Required',
      message: 'Your session has expired or you need to log in again.',
      suggestions: [
        'Please log in again',
        "Check that your session hasn't expired",
        'Verify your account credentials',
      ],
      recoveryActions: [{ label: 'Go to Login', action: '/login' }],
      severity: 'warning',
    };
  }

  // Permission errors
  if (
    errorMessage.includes('permission') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('403')
  ) {
    return {
      title: 'Access Denied',
      message: "You don't have permission to perform this action.",
      suggestions: [
        'Contact your administrator for access',
        'Verify that you have the necessary permissions',
        "Check that you're using the correct account",
      ],
      severity: 'error',
    };
  }

  // Validation errors
  if (
    errorMessage.includes('valid') ||
    errorMessage.includes('required') ||
    errorMessage.includes('invalid')
  ) {
    return {
      title: 'Validation Error',
      message:
        'Some information is missing or incorrect. Please review and correct the highlighted fields.',
      suggestions: [
        'Check that all required fields are filled',
        'Verify that input values are correct',
        'Review the form for highlighted errors',
      ],
      severity: 'warning',
    };
  }

  // Not found errors
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return {
      title: 'Not Found',
      message: 'The requested resource could not be found.',
      suggestions: [
        'Check the URL or resource ID',
        'Verify that the resource exists',
        'Return to the previous page',
      ],
      severity: 'info',
    };
  }

  // Server errors
  if (
    errorMessage.includes('server') ||
    errorMessage.includes('500') ||
    errorMessage.includes('503')
  ) {
    return {
      title: 'Server Error',
      message: 'The server encountered an error while processing your request.',
      suggestions: [
        'Try again in a few moments',
        'If the problem persists, contact support',
        'Check the system status page',
      ],
      severity: 'error',
    };
  }

  // Generic error
  return {
    title: 'Something Went Wrong',
    message: errorMessage || 'An unexpected error occurred. Please try again.',
    suggestions: [
      'Refresh the page and try again',
      'Clear your browser cache if the problem persists',
      'Contact support if the error continues',
    ],
    severity: 'error',
  };
};

/**
 * Get contextual error message based on component and action
 */
export const getContextualError = (
  error: Error | string,
  component?: string,
  action?: string
): UserFriendlyErrorInfo => {
  const baseError = getUserFriendlyError(error);
  const context =
    component && action ? `in ${component} while ${action}` : component ? `in ${component}` : '';

  return {
    ...baseError,
    message: context ? `${baseError.message} (Error ${context})` : baseError.message,
  };
};

/**
 * Format error for logging and reporting
 */
export const formatErrorForReporting = (
  error: Error | string,
  context?: Record<string, unknown>
): string => {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;
  const timestamp = new Date().toISOString();

  return JSON.stringify(
    {
      error: errorMessage,
      stack: errorStack,
      context,
      timestamp,
    },
    null,
    2
  );
};
