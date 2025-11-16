/**
import { logger } from '../services/logger'; * Error Handling Integration Example
 * Complete integration example showing how to use error components in real pages
 * Demonstrates useErrorManagement hook and error extraction utilities
 */

import React, { useState } from 'react';
import {
  UserFriendlyError,
  ErrorHistory,
  ErrorReportingForm,
  ServiceDegradedBanner,
  FallbackContent,
  CircuitBreakerStatus,
} from '../ui';
import { useErrorManagement } from '../../hooks/useErrorManagement';
import { extractErrorFromApiResponse } from '../../utils/errorExtraction';

/**
 * Complete Error Handling Example Page
 * Shows integration of all error components with hooks and utilities
 */
export const ErrorHandlingExample: React.FC = () => {
  const [state, actions, errorRecovery] = useErrorManagement({
    component: 'ErrorHandlingExample',
    action: 'api-call',
    maxHistoryItems: 20,
    enableErrorHistory: true,
    enableErrorReporting: true,
  });

  const [serviceStatus, setServiceStatus] = useState<'open' | 'half-open' | 'closed'>('closed');
  const [cachedData, setCachedData] = useState<any>(null);

  // Simulate API call with error handling
  const handleApiCall = async () => {
    try {
      const response = await fetch('/api/data');
      
      if (!response.ok) {
        // Extract error from response
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        const extracted = extractErrorFromApiResponse(
          {
            response: {
              status: response.status,
              data: errorData,
              headers: Object.fromEntries(response.headers.entries()),
            },
          },
          new Error('API request failed')
        );
        
        // Set error with extracted information
        actions.setError(
          extracted.error,
          extracted.errorCode,
          extracted.correlationId
        );
        
        // Update service status on failure
        if (response.status >= 500) {
          setServiceStatus('open');
        }
        
        return;
      }

      const data = await response.json();
      logger.info('Success:', data);
      
      // Cache data for fallback
      setCachedData(data);
      
      // Clear error on success
      actions.clearError();
      setServiceStatus('closed');
    } catch (error) {
      // Extract error from exception
      const extracted = extractErrorFromApiResponse(
        error,
        new Error('Network error occurred')
      );
      
      // Set error with extracted information
      actions.setError(extracted.error, extracted.errorCode, extracted.correlationId);
      setServiceStatus('open');
    }
  };

  const handleRetry = async () => {
    await actions.retry();
    await handleApiCall();
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Error Handling Example</h1>

      {/* Service Status */}
      {serviceStatus === 'open' && (
        <ServiceDegradedBanner
          service="Data API"
          status={serviceStatus}
          message="Service is temporarily unavailable"
          onRetry={handleRetry}
          alternativeActions={[
            {
              label: 'Use Cached Data',
              action: () => {
                // Use cached data
                logger.info('Using cached data:', cachedData);
              },
              variant: 'primary',
            },
          ]}
        />
      )}

      {/* Circuit Breaker Status */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">Service Status:</span>
        <CircuitBreakerStatus
          service="Data API"
          status={serviceStatus}
          onRetry={handleRetry}
          showDetails={true}
        />
      </div>

      {/* Fallback Content */}
      {serviceStatus === 'open' && cachedData && (
        <FallbackContent
          service="Data API"
          fallbackData={cachedData}
          cacheTimestamp={new Date()}
          onRefresh={handleApiCall}
        >
          <div className="p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">Cached Data</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(cachedData, null, 2)}
            </pre>
          </div>
        </FallbackContent>
      )}

      {/* Current Error */}
      {state.currentError && (
        <UserFriendlyError
          error={state.currentError}
          errorCode={state.errorCode}
          correlationId={state.correlationId}
          recoveryActions={[
            ...errorRecovery.recoveryActions,
            {
              label: 'Retry API Call',
              action: handleRetry,
              variant: 'primary',
            },
          ]}
          suggestions={errorRecovery.suggestions}
          onDismiss={actions.clearError}
        />
      )}

      {/* Error History */}
      {state.errorHistory.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Errors</h2>
          <ErrorHistory
            errors={state.errorHistory}
            onErrorSelect={(error) => {
              // Could show error details in a modal
              logger.info('Selected error:', error);
            }}
            onErrorDismiss={actions.removeFromHistory}
            maxItems={10}
          />
        </div>
      )}

      {/* Error Reporting Form */}
      {state.showErrorReporting && state.currentError && (
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">Report Error</h2>
          <ErrorReportingForm
            error={state.currentError}
            errorCode={state.errorCode}
            correlationId={state.correlationId}
            onSubmit={actions.submitErrorReport}
            onCancel={actions.closeErrorReporting}
          />
        </div>
      )}

      {/* Demo Actions */}
      <div className="flex space-x-4">
        <button
          onClick={handleApiCall}
          disabled={serviceStatus === 'open'}
          className={`px-4 py-2 rounded ${
            serviceStatus === 'open'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {serviceStatus === 'open' ? 'Service Unavailable' : 'Make API Call'}
        </button>

        <button
          onClick={actions.openErrorReporting}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Report Error
        </button>

        {state.errorHistory.length > 0 && (
          <button
            onClick={actions.clearHistory}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear History
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorHandlingExample;

