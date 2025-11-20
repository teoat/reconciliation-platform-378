/**
 * useApiErrorHandler Hook
 * Convenience hook for handling API errors with automatic correlation ID extraction
 * Ready for Agent 1's correlation ID implementation
 */

import { useCallback } from 'react';
import { useErrorManagement } from './useErrorManagement';
import {
  extractErrorFromFetchCall,
  extractErrorFromFetchResponseAsync,
} from '../utils/errorExtractionAsync';
import type { ExtractedErrorInfo } from '../utils/errorExtraction';

export interface ApiErrorHandlerOptions {
  component?: string;
  action?: string;
  enableErrorHistory?: boolean;
  enableErrorReporting?: boolean;
}

/**
 * useApiErrorHandler - Convenience hook for API error handling
 * Automatically extracts correlation IDs from responses
 */
export const useApiErrorHandler = (options: ApiErrorHandlerOptions = {}) => {
  const {
    component = 'Unknown',
    action = 'api-call',
    enableErrorHistory = true,
    enableErrorReporting = true,
  } = options;

  const [state, actions, errorRecovery] = useErrorManagement({
    component,
    action,
    enableErrorHistory,
    enableErrorReporting,
  });

  // Handle fetch API calls with automatic error extraction
  const handleApiCall = useCallback(
    async <T>(
      fetchCall: Promise<Response>,
      options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: ExtractedErrorInfo) => void;
        defaultError?: Error | string;
      }
    ): Promise<T | null> => {
      try {
        const response = await fetchCall;

        if (!response.ok) {
          // Extract error with correlation ID
          const extracted = await extractErrorFromFetchResponseAsync(
            response,
            options?.defaultError
          );

          // Set error with correlation ID
          actions.setError(extracted.error, extracted.errorCode, extracted.correlationId);

          // Call custom error handler if provided
          if (options?.onError) {
            options.onError(extracted);
          }

          return null;
        }

        // Parse successful response
        const contentType = response.headers.get('content-type');
        let data: T;

        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = (await response.text()) as unknown as T;
        }

        // Call success handler if provided
        if (options?.onSuccess) {
          options.onSuccess(data);
        }

        // Clear any previous errors
        actions.clearError();

        return data;
      } catch (error) {
        // Handle network errors and other exceptions
        const extracted = await extractErrorFromFetchCall(fetchCall, options?.defaultError);

        // Set error with correlation ID
        actions.setError(extracted.error, extracted.errorCode, extracted.correlationId);

        // Call custom error handler if provided
        if (options?.onError) {
          options.onError(extracted);
        }

        return null;
      }
    },
    [actions, component, action]
  );

  return {
    state,
    actions,
    errorRecovery,
    handleApiCall,
  };
};

export default useApiErrorHandler;
