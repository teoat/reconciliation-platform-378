/*
 * Correlation ID Integration Example
 * Complete example showing correlation ID extraction and display
 * Ready for Agent 1's correlation ID implementation
 */

import React, { useState } from 'react';
import { logger } from '@/services/logger';
import { UserFriendlyError, ErrorCodeDisplay, ErrorHistory } from '../ui';
import { useApiErrorHandler } from '../../hooks/useApiErrorHandler';
import { extractErrorFromFetchResponseAsync } from '../../utils/errorExtractionAsync';

/**
 * Correlation ID Integration Example
 * Demonstrates automatic correlation ID extraction from API responses
 */
export const CorrelationIdIntegrationExample: React.FC = () => {
  const { state, actions, handleApiCall } = useApiErrorHandler({
    component: 'CorrelationIdExample',
    action: 'fetch-data',
    enableErrorHistory: true,
    enableErrorReporting: true,
  });

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  // Example 1: Using handleApiCall (automatic correlation ID extraction)
  const fetchDataWithAutoExtraction = async () => {
    setLoading(true);
    try {
      const result = await handleApiCall(fetch('/api/data'), {
        onSuccess: (data) => {
          setData(data as Record<string, unknown>);
          logger.info('Success:', data as any);
        },
        onError: (extracted) => {
          logger.info('Error with correlation ID:', String(extracted.correlationId || '') as any);
        },
      });

      if (result) {
        setData(result as Record<string, unknown>);
      }
    } finally {
      setLoading(false);
    }
  };

  // Example 2: Manual extraction for custom handling
  const fetchDataWithManualExtraction = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data');

      if (!response.ok) {
        // Extract error with correlation ID
        const extracted = await extractErrorFromFetchResponseAsync(
          response,
          new Error('Request failed')
        );

        // Set error with correlation ID
        actions.setError(
          extracted.error,
          extracted.errorCode ? String(extracted.errorCode) : undefined,
          extracted.correlationId ? String(extracted.correlationId) : undefined
        );

        logger.info('Correlation ID:', String(extracted.correlationId || '') as any);
        logger.info('Error Code:', String(extracted.errorCode || '') as any);

        return;
      }

      const result = await response.json();
      setData(result);
      actions.clearError();
    } catch (error) {
      // Network errors
      actions.setError(error);
    } finally {
      setLoading(false);
    }
  };

  // Example 3: Direct correlation ID extraction from Response
  const fetchDataWithDirectExtraction = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data');

      // Extract correlation ID directly from headers
      const correlationId =
        response.headers.get('x-correlation-id') ||
        response.headers.get('X-Correlation-ID') ||
        undefined;

      logger.info('Correlation ID from headers:', String(correlationId || '') as any);

      if (!response.ok) {
        const extracted = await extractErrorFromFetchResponseAsync(response);

        // Verify correlation ID was extracted
        if (correlationId && extracted.correlationId === correlationId) {
          logger.info('✅ Correlation ID matches!');
        }

        actions.setError(
          extracted.error,
          extracted.errorCode ? String(extracted.errorCode) : undefined,
          extracted.correlationId ? String(extracted.correlationId) : undefined
        );
        return;
      }

      const result = await response.json();
      setData(result);
      actions.clearError();
    } catch (error) {
      actions.setError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Correlation ID Integration Example</h1>

      {/* Current Error with Correlation ID */}
      {state.currentError && (
        <div className="space-y-4">
          <UserFriendlyError
            error={state.currentError}
            errorCode={state.errorCode}
            correlationId={state.correlationId}
            recoveryActions={[
              {
                label: 'Retry',
                action: fetchDataWithAutoExtraction,
                variant: 'primary',
              },
            ]}
            onDismiss={actions.clearError}
          />

          {/* Correlation ID Display */}
          {state.correlationId && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Correlation ID</h3>
              <ErrorCodeDisplay
                correlationId={state.correlationId}
                errorCode={state.errorCode}
                timestamp={new Date()}
              />
              <p className="mt-2 text-sm text-blue-700">
                Use this correlation ID when reporting the error to support.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error History with Correlation IDs */}
      {state.errorHistory.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Error History</h2>
          <ErrorHistory
            errors={state.errorHistory}
            onErrorSelect={(error) => {
              logger.info('Selected error with correlation ID:', String(error.correlationId || '') as any);
            }}
            onErrorDismiss={actions.removeFromHistory}
            maxItems={10}
          />
        </div>
      )}

      {/* Demo Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Integration Examples</h3>

        <div className="space-y-2">
          <button
            onClick={fetchDataWithAutoExtraction}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Example 1: Auto Correlation ID Extraction'}
          </button>
          <p className="text-sm text-gray-600">
            Uses <code>handleApiCall</code> hook for automatic correlation ID extraction
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={fetchDataWithManualExtraction}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Example 2: Manual Correlation ID Extraction'}
          </button>
          <p className="text-sm text-gray-600">
            Uses <code>extractErrorFromFetchResponseAsync</code> for manual extraction
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={fetchDataWithDirectExtraction}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Example 3: Direct Header Extraction'}
          </button>
          <p className="text-sm text-gray-600">
            Extracts correlation ID directly from response headers
          </p>
        </div>
      </div>

      {/* Data Display */}
      {data && (
        <div className="bg-gray-50 border rounded p-4">
          <h3 className="font-semibold mb-2">Response Data</h3>
          <pre className="text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default CorrelationIdIntegrationExample;
