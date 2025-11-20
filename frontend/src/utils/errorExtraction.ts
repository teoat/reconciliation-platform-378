/**
 * Error Extraction Utilities
 * Utilities for extracting error codes and correlation IDs from various error sources
 * Ready for integration when Agent 1 completes correlation ID implementation
 */

/**
 * Extracts error code and correlation ID from an API error response
 */
export interface ExtractedErrorInfo {
  error: Error | string;
  errorCode?: string;
  correlationId?: string;
  statusCode?: number;
  timestamp?: Date;
}

/**
 * Extract error information from API error response
 * Supports various error response formats
 */
export function extractErrorFromApiResponse(
  error: unknown,
  defaultError?: Error | string
): ExtractedErrorInfo {
  const defaultErrorObj: ExtractedErrorInfo = {
    error: defaultError || new Error('Unknown error occurred'),
    timestamp: new Date(),
  };

  if (!error) {
    return defaultErrorObj;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return {
      error,
      timestamp: new Date(),
      // Try to extract error code from error name or message
      errorCode: extractErrorCodeFromError(error),
      // Try to extract correlation ID from error properties
      correlationId: extractCorrelationIdFromError(error),
    };
  }

  // Handle fetch Response objects directly
  // Note: Response objects require async body reading, so we extract what we can synchronously
  if (error instanceof Response) {
    // Extract correlation ID from headers (always available)
    const correlationId = extractCorrelationIdFromResponse(error);

    // Extract error code from status
    const errorCode = error.status ? getErrorCodeFromStatusCode(error.status) : undefined;

    // Use status text or default error message
    const errorMessage =
      error.statusText ||
      (defaultError instanceof Error ? defaultError.message : defaultError) ||
      'Request failed';

    return {
      error: new Error(errorMessage),
      errorCode,
      correlationId,
      statusCode: error.status,
      timestamp: new Date(),
    };
  }

  // Handle ApiResponse objects (Agent 1 Task 1.19)
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;

    // Check for ApiResponse structure (from API client)
    if ('success' in errorObj && !errorObj.success && ('error' in errorObj || 'code' in errorObj)) {
      return {
        error: new Error(errorObj.error || errorObj.message || 'API request failed'),
        errorCode: errorObj.code,
        correlationId: errorObj.correlationId,
        timestamp: new Date(),
      };
    }

    // Check for Axios error structure
    if (errorObj.response) {
      const response = errorObj.response;
      const data = response.data || {};

      const errorMessage = data.message || errorObj.message || 'API request failed';
      return {
        error: errorMessage instanceof Error ? errorMessage : new Error(errorMessage),
        errorCode: data.code || data.errorCode || extractErrorCodeFromError(errorObj),
        correlationId:
          response.headers?.['x-correlation-id'] ||
          response.headers?.['X-Correlation-ID'] ||
          data.correlationId ||
          data.correlation_id ||
          extractCorrelationIdFromError(errorObj),
        statusCode: response.status,
        timestamp: new Date(),
      };
    }

    // Check for fetch API error structure (Response-like object)
    if (errorObj.status || errorObj.statusText) {
      // Try to extract correlation ID from headers if available
      let correlationId: string | undefined;

      if (errorObj.headers) {
        if (errorObj.headers instanceof Headers) {
          correlationId =
            errorObj.headers.get('x-correlation-id') ||
            errorObj.headers.get('X-Correlation-ID') ||
            errorObj.headers.get('X-Request-ID') ||
            undefined;
        } else if (typeof errorObj.headers === 'object') {
          correlationId =
            errorObj.headers['x-correlation-id'] ||
            errorObj.headers['X-Correlation-ID'] ||
            errorObj.headers['X-Request-ID'] ||
            undefined;
        }
      }

      return {
        error: errorObj.message || new Error('HTTP request failed'),
        errorCode: errorObj.code || extractErrorCodeFromError(errorObj),
        correlationId: correlationId || extractCorrelationIdFromError(errorObj),
        statusCode: errorObj.status,
        timestamp: new Date(),
      };
    }

    // Handle generic object with error properties
    if (errorObj.message || errorObj.error) {
      return {
        error: errorObj.message || errorObj.error || new Error('Error occurred'),
        errorCode: errorObj.code || errorObj.errorCode || extractErrorCodeFromError(errorObj),
        correlationId:
          errorObj.correlationId ||
          errorObj.correlation_id ||
          errorObj.requestId ||
          extractCorrelationIdFromError(errorObj),
        statusCode: errorObj.statusCode || errorObj.status,
        timestamp: new Date(),
      };
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      error,
      timestamp: new Date(),
    };
  }

  return defaultErrorObj;
}

/**
 * Extract error code from Error object
 */
function extractErrorCodeFromError(error: unknown): string | undefined {
  if (!error) return undefined;

  if (typeof error !== 'object' || error === null) return undefined;

  const err = error as Record<string, unknown>;

  // Check custom errorCode property
  if (err.errorCode || err.code) {
    return String(err.errorCode || err.code);
  }

  // Check error name for code-like patterns
  if (err.name && typeof err.name === 'string' && /^[A-Z_]+$/.test(err.name)) {
    return err.name;
  }

  // Try to extract from message
  const message = err.message ? String(err.message) : '';
  const codeMatch = message.match(/(?:error|code)[\s:]?([A-Z0-9_]+)/i);
  if (codeMatch) {
    return codeMatch[1];
  }

  return undefined;
}

/**
 * Extract correlation ID from Error object
 * Ready for Agent 1's correlation ID implementation
 */
function extractCorrelationIdFromError(error: unknown): string | undefined {
  if (!error) return undefined;

  if (typeof error !== 'object' || error === null) return undefined;

  const err = error as Record<string, unknown>;

  // Check common correlation ID property names using bracket notation
  const correlationId =
    (typeof err['correlationId'] === 'string' ? err['correlationId'] : undefined) ||
    (typeof err['correlation_id'] === 'string' ? err['correlation_id'] : undefined) ||
    (typeof err['correlationID'] === 'string' ? err['correlationID'] : undefined) ||
    (typeof err['requestId'] === 'string' ? err['requestId'] : undefined) ||
    (typeof err['request_id'] === 'string' ? err['request_id'] : undefined) ||
    (typeof err['traceId'] === 'string' ? err['traceId'] : undefined) ||
    (typeof err['trace_id'] === 'string' ? err['trace_id'] : undefined) ||
    (typeof err['xRequestId'] === 'string' ? err['xRequestId'] : undefined) ||
    (typeof err['x_request_id'] === 'string' ? err['x_request_id'] : undefined);

  if (correlationId) {
    return correlationId;
  }

  // Check headers if available
  const headersObj = err['headers'];
  if (headersObj && typeof headersObj === 'object' && headersObj !== null) {
    const headers = headersObj as Record<string, unknown>;
    const headerId =
      (typeof headers['x-correlation-id'] === 'string' ? headers['x-correlation-id'] : undefined) ||
      (typeof headers['X-Correlation-ID'] === 'string' ? headers['X-Correlation-ID'] : undefined) ||
      (typeof headers['x-request-id'] === 'string' ? headers['x-request-id'] : undefined) ||
      (typeof headers['X-Request-ID'] === 'string' ? headers['X-Request-ID'] : undefined) ||
      (typeof headers['x-trace-id'] === 'string' ? headers['x-trace-id'] : undefined) ||
      (typeof headers['X-Trace-ID'] === 'string' ? headers['X-Trace-ID'] : undefined);
    if (headerId) {
      return headerId;
    }
  }

  // Check response headers if available
  const responseObj = err['response'];
  if (responseObj && typeof responseObj === 'object' && responseObj !== null) {
    const response = responseObj as Record<string, unknown>;
    const responseHeaders = response['headers'];
    if (responseHeaders && typeof responseHeaders === 'object' && responseHeaders !== null) {
      const headers = responseHeaders as Record<string, unknown>;
      const headerId =
        (typeof headers['x-correlation-id'] === 'string'
          ? headers['x-correlation-id']
          : undefined) ||
        (typeof headers['X-Correlation-ID'] === 'string'
          ? headers['X-Correlation-ID']
          : undefined) ||
        (typeof headers['x-request-id'] === 'string' ? headers['x-request-id'] : undefined) ||
        (typeof headers['X-Request-ID'] === 'string' ? headers['X-Request-ID'] : undefined);
      if (headerId) {
        return headerId;
      }
    }
  }

  return undefined;
}

/**
 * Create a standardized error from various error sources
 */
export function createStandardizedError(
  error: unknown,
  context?: {
    component?: string;
    action?: string;
    defaultMessage?: string;
  }
): ExtractedErrorInfo {
  const extracted = extractErrorFromApiResponse(
    error,
    context?.defaultMessage ? new Error(context.defaultMessage) : undefined
  );

  // Add context if provided
  if (context && extracted.error instanceof Error) {
    // Add context as metadata (non-enumerable)
    Object.defineProperty(extracted.error, 'context', {
      value: context,
      enumerable: false,
      writable: false,
    });
  }

  return extracted;
}

/**
 * Extract error code from HTTP status code
 */
export function getErrorCodeFromStatusCode(statusCode: number): string {
  const statusCodeMap: Record<number, string> = {
    400: 'ERR_BAD_REQUEST',
    401: 'ERR_UNAUTHORIZED',
    403: 'ERR_FORBIDDEN',
    404: 'ERR_NOT_FOUND',
    408: 'ERR_REQUEST_TIMEOUT',
    409: 'ERR_CONFLICT',
    422: 'ERR_VALIDATION_ERROR',
    429: 'ERR_RATE_LIMIT_EXCEEDED',
    500: 'ERR_INTERNAL_SERVER_ERROR',
    502: 'ERR_BAD_GATEWAY',
    503: 'ERR_SERVICE_UNAVAILABLE',
    504: 'ERR_GATEWAY_TIMEOUT',
  };

  return statusCodeMap[statusCode] || `ERR_HTTP_${statusCode}`;
}

/**
 * Extract correlation ID from Response headers
 * Ready for Agent 1's correlation ID implementation (backend already uses X-Correlation-ID)
 */
export function extractCorrelationIdFromResponse(response: Response): string | undefined {
  return (
    response.headers.get('x-correlation-id') ||
    response.headers.get('X-Correlation-ID') ||
    response.headers.get('X-Request-ID') ||
    undefined
  );
}

/**
 * Safely extract error message from ApiErrorValue type (string | { message: string })
 * Used to safely access response.error.message
 */
export function getErrorMessageFromApiError(
  error: string | { message: string } | undefined
): string {
  if (!error) {
    return 'An error occurred';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return error.message || 'An error occurred';
  }
  return 'An error occurred';
}

/**
 * Safely extracts error message from any error type with fallback
 * Consolidates the common pattern: error instanceof Error ? error.message : fallback
 */
export function getErrorMessage(error: unknown, fallback: string = 'An error occurred'): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

/**
 * Creates an Error object from any error type
 * Consolidates the common pattern: error instanceof Error ? error : new Error(String(error))
 */
export function toError(error: unknown, fallbackMessage: string = 'An error occurred'): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === 'string' ? error : fallbackMessage);
}
