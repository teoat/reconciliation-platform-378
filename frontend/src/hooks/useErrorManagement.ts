/**
 * useErrorManagement Hook
 * Comprehensive error management hook integrating all new error components
 * Accelerates integration of error handling components
 */

import { useState, useCallback, useEffect } from 'react';
import { ErrorHistoryItem, ErrorReport } from '../components/ui';
import { useErrorRecovery } from './useErrorRecovery';
import { getUserFriendlyError, formatErrorForReporting } from '../utils/errorMessages';
import { logger } from '../services/logger';

export interface ErrorManagementOptions {
  component?: string;
  action?: string;
  maxHistoryItems?: number;
  enableErrorHistory?: boolean;
  enableErrorReporting?: boolean;
}

export interface ErrorManagementState {
  currentError: Error | string | null;
  errorHistory: ErrorHistoryItem[];
  errorCode?: string;
  correlationId?: string;
  showErrorReporting: boolean;
}

export interface ErrorManagementActions {
  setError: (error: Error | string | null, errorCode?: string, correlationId?: string) => void;
  clearError: () => void;
  addToHistory: (error: Error | string, errorCode?: string, correlationId?: string) => void;
  removeFromHistory: (errorId: string) => void;
  clearHistory: () => void;
  openErrorReporting: () => void;
  closeErrorReporting: () => void;
  submitErrorReport: (report: ErrorReport) => Promise<void>;
  retry: () => void | Promise<void>;
  reset: () => void;
}

/**
 * useErrorManagement - Comprehensive error management hook
 * Integrates UserFriendlyError, ErrorHistory, and ErrorReportingForm
 */
export const useErrorManagement = (
  options: ErrorManagementOptions = {}
): [ErrorManagementState, ErrorManagementActions, ReturnType<typeof useErrorRecovery>] => {
  const {
    component = 'Unknown',
    action = 'unknown',
    maxHistoryItems = 50,
    enableErrorHistory = true,
    enableErrorReporting = true,
  } = options;

  const [currentError, setCurrentErrorState] = useState<Error | string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [correlationId, setCorrelationId] = useState<string | undefined>();
  const [errorHistory, setErrorHistory] = useState<ErrorHistoryItem[]>([]);
  const [showErrorReporting, setShowErrorReporting] = useState(false);

  // Error recovery hook
  const errorRecovery = useErrorRecovery({
    error: currentError || '',
    context: { component, action },
    onRetry: () => {
      // Retry will be handled by the retry action
    },
    onReset: () => {
      setCurrentErrorState(null);
      setErrorCode(undefined);
      setCorrelationId(undefined);
    },
    onReport: enableErrorReporting
      ? () => {
          setShowErrorReporting(true);
        }
      : undefined,
  });

  // Set error with optional error code and correlation ID
  const setError = useCallback(
    (error: Error | string | null, code?: string, id?: string) => {
      setCurrentErrorState(error);
      setErrorCode(code);
      setCorrelationId(id);

      // Add to history if enabled
      if (error && enableErrorHistory) {
        addToHistory(error, code, id);
      }
    },
    [enableErrorHistory]
  );

  // Clear current error
  const clearError = useCallback(() => {
    setCurrentErrorState(null);
    setErrorCode(undefined);
    setCorrelationId(undefined);
  }, []);

  // Add error to history
  const addToHistory = useCallback(
    (error: Error | string, code?: string, id?: string) => {
      const errorName = error instanceof Error ? error.name : 'Error';

      const { title, severity } = getUserFriendlyError(error);

      const newError: ErrorHistoryItem = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        error,
        title: title || errorName,
        errorCode: code,
        correlationId: id,
        severity: severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'info',
        context: `${component}:${action}`,
      };

      setErrorHistory((prev) => {
        const updated = [newError, ...prev];
        // Limit history size
        return updated.slice(0, maxHistoryItems);
      });

      // Persist to localStorage
      try {
        const stored = localStorage.getItem('errorHistory');
        const storedHistory = stored ? JSON.parse(stored) : [];
        const updatedHistory = [newError, ...storedHistory].slice(0, maxHistoryItems);
        localStorage.setItem('errorHistory', JSON.stringify(updatedHistory));
      } catch (e) {
        // Silently fail if localStorage is unavailable
        logger.warn('Failed to persist error history:', { error: e });
      }
    },
    [component, action, maxHistoryItems]
  );

  // Remove error from history
  const removeFromHistory = useCallback((errorId: string) => {
    setErrorHistory((prev) => prev.filter((err) => err.id !== errorId));

    // Update localStorage
    try {
      const stored = localStorage.getItem('errorHistory');
      if (stored) {
        const storedHistory: ErrorHistoryItem[] = JSON.parse(stored);
        const updatedHistory = storedHistory.filter((err) => err.id !== errorId);
        localStorage.setItem('errorHistory', JSON.stringify(updatedHistory));
      }
    } catch (e) {
      logger.warn('Failed to update error history:', e);
    }
  }, []);

  // Clear error history
  const clearHistory = useCallback(() => {
    setErrorHistory([]);
    try {
      localStorage.removeItem('errorHistory');
    } catch (e) {
      logger.warn('Failed to clear error history:', e);
    }
  }, []);

  // Error reporting
  const openErrorReporting = useCallback(() => {
    setShowErrorReporting(true);
  }, []);

  const closeErrorReporting = useCallback(() => {
    setShowErrorReporting(false);
  }, []);

  const submitErrorReport = useCallback(async (report: ErrorReport) => {
    try {
      // Format error for reporting
      const formattedError = formatErrorForReporting(
        currentError || new Error('Unknown error'),
        { component, action }
      );

      // Submit to backend or error tracking service
      const response = await fetch('/api/errors/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...report,
          formattedError,
          errorCode,
          correlationId,
          component,
          action,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit error report');
      }

      // Close reporting form
      setShowErrorReporting(false);

      // Optionally clear error after successful report
      // clearError();
    } catch (error) {
      logger.error('Failed to submit error report:', { error });
      throw error;
    }
  }, [currentError, component, action, errorCode, correlationId]);

  // Retry action
  const retry = useCallback(async () => {
    // Clear current error
    clearError();
    // Retry logic should be implemented by the component using this hook
  }, [clearError]);

  // Reset action
  const reset = useCallback(() => {
    clearError();
    clearHistory();
  }, [clearError, clearHistory]);

  // Load error history from localStorage on mount
  useEffect(() => {
    if (enableErrorHistory) {
      try {
        const stored = localStorage.getItem('errorHistory');
        if (stored) {
          const storedHistory: ErrorHistoryItem[] = JSON.parse(stored);
          // Convert timestamps back to Date objects
          const parsedHistory = storedHistory.map((err) => ({
            ...err,
            timestamp: new Date(err.timestamp),
          }));
          setErrorHistory(parsedHistory.slice(0, maxHistoryItems));
        }
      } catch (e) {
        logger.warn('Failed to load error history:', e);
      }
    }
  }, [enableErrorHistory, maxHistoryItems]);

  const state: ErrorManagementState = {
    currentError,
    errorHistory,
    errorCode,
    correlationId,
    showErrorReporting,
  };

  const actions: ErrorManagementActions = {
    setError,
    clearError,
    addToHistory,
    removeFromHistory,
    clearHistory,
    openErrorReporting,
    closeErrorReporting,
    submitErrorReport,
    retry,
    reset,
  };

  return [state, actions, errorRecovery];
};

export default useErrorManagement;

