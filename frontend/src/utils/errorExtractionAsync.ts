/**
 * Async Error Extraction Utilities
 * Async versions for handling fetch Response objects that require body parsing
 * Ready for Agent 1's correlation ID implementation
 */

import {
  ExtractedErrorInfo,
  getErrorCodeFromStatusCode,
  extractCorrelationIdFromResponse,
} from './common/errorHandling';

/**
 * Extract error from fetch Response object asynchronously
 * Reads response body to extract error details and correlation IDs
 * Ready for Agent 1's correlation ID implementation
 */
export async function extractErrorFromFetchResponseAsync(
  response: Response,
  defaultError?: Error | string
): Promise<ExtractedErrorInfo> {
  // Extract correlation ID from response headers (always available)
  const correlationId = extractCorrelationIdFromResponse(response);

  // Extract error code from status code
  const errorCode = response.status ? getErrorCodeFromStatusCode(response.status) : undefined;

  // Try to parse error message from response body
  let errorMessage =
    defaultError instanceof Error ? defaultError.message : defaultError || 'Request failed';
  let bodyErrorCode = errorCode;
  let bodyCorrelationId = correlationId;

  try {
    // ✅ CORRELATION ID: Extract from response headers first (primary source)
    const headerCorrelationId = response.headers.get('x-correlation-id') ||
                                 response.headers.get('X-Correlation-ID') ||
                                 correlationId;
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json().catch(() => ({}));
      errorMessage = data.message || data.error || data.errorMessage || errorMessage;
      bodyErrorCode = data.code || data.errorCode || errorCode;
      // ✅ CORRELATION ID: Prefer JSON body, fallback to header, then original
      bodyCorrelationId = data.correlationId || 
                          data.correlation_id || 
                          headerCorrelationId ||
                          bodyCorrelationId;
    } else {
      // Try to get text response
      const text = await response.text().catch(() => '');
      if (text) {
        // Try to parse as JSON even if content-type wasn't set correctly
        try {
          const data = JSON.parse(text);
          errorMessage = data.message || data.error || data.errorMessage || errorMessage;
          bodyErrorCode = data.code || data.errorCode || errorCode;
          bodyCorrelationId = bodyCorrelationId || data.correlationId || data.correlation_id;
        } catch {
          // Not JSON, use text as error message if it's reasonable length
          if (text.length < 200) {
            errorMessage = text;
          }
        }
      }
    }
  } catch (e) {
    // If parsing fails, use status text or default
    errorMessage = response.statusText || errorMessage;
  }

  return {
    error: new Error(errorMessage),
    errorCode: bodyErrorCode,
    correlationId: bodyCorrelationId,
    statusCode: response.status,
    timestamp: new Date(),
  };
}

/**
 * Extract error from fetch API call result
 * Handles both Response objects and errors thrown
 */
export async function extractErrorFromFetchCall(
  fetchCall: Promise<Response>,
  defaultError?: Error | string
): Promise<ExtractedErrorInfo> {
  try {
    const response = await fetchCall;

    if (!response.ok) {
      return await extractErrorFromFetchResponseAsync(response, defaultError);
    }

    // If response is ok, there's no error
    return {
      error:
        defaultError instanceof Error
          ? defaultError
          : new Error(String(defaultError || 'No error')),
      timestamp: new Date(),
    };
  } catch (error) {
    // Handle network errors and other exceptions
    if (error instanceof Response) {
      return await extractErrorFromFetchResponseAsync(error, defaultError);
    }

    // Fall back to regular error extraction
    const { extractErrorFromApiResponse } = await import('./common/errorHandling');
    const result = extractErrorFromApiResponse(error, defaultError);

    // Handle both sync and async results
    if (result instanceof Promise) {
      return await result;
    }

    return result;
  }
}

/**
 * Create a standardized error handler for fetch API calls
 * Extracts correlation IDs automatically from responses
 */
export function createFetchErrorHandler(defaultError?: Error | string) {
  return async (response: Response): Promise<ExtractedErrorInfo> => {
    return await extractErrorFromFetchResponseAsync(response, defaultError);
  };
}
