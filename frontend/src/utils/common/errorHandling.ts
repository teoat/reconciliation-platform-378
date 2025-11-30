//! Common Error Handling Utilities
//!
//! Single source of truth for error extraction and handling functions.
//! Consolidates error handling from errorExtraction.ts, services/errorHandling.ts, and utils/index.ts

/**
 * Extracted error information from various error sources
 */
export interface ExtractedErrorInfo {
  error: Error | string;
  errorCode?: string;
  correlationId?: string;
  statusCode?: number;
  timestamp?: Date;
}

/**
 * Safely extracts error message from any error type with fallback.
 * Consolidates the common pattern: error instanceof Error ? error.message : fallback
 *
 * @param error - Error of any type (Error, string, object, etc.)
 * @param fallback - Fallback message if error cannot be extracted (default: 'An error occurred')
 * @returns Extracted error message
 *
 * @example
 * ```typescript
 * getErrorMessage(new Error('Something went wrong')); // Returns: 'Something went wrong'
 * getErrorMessage('String error'); // Returns: 'String error'
 * getErrorMessage({ message: 'Object error' }); // Returns: 'An error occurred' (fallback)
 * getErrorMessage(null, 'Custom fallback'); // Returns: 'Custom fallback'
 * ```
 */
export function getErrorMessage(error: unknown, fallback: string = 'An error occurred'): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as { message?: string; error?: string };
    return err.message || err.error || fallback;
  }
  return fallback;
}

/**
 * Safely extract error message from ApiErrorValue type (string | { message: string }).
 * Used to safely access response.error.message
 *
 * @param error - API error value (string or object with message property)
 * @returns Extracted error message
 *
 * @example
 * ```typescript
 * getErrorMessageFromApiError('String error'); // Returns: 'String error'
 * getErrorMessageFromApiError({ message: 'Object error' }); // Returns: 'Object error'
 * getErrorMessageFromApiError(undefined); // Returns: 'An error occurred'
 * ```
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
 * Extract error message from various error types.
 * Alias for getErrorMessage for backward compatibility.
 *
 * @param error - Error of any type
 * @returns Extracted error message
 *
 * @example
 * ```typescript
 * extractErrorMessage(new Error('Test')); // Returns: 'Test'
 * extractErrorMessage('String error'); // Returns: 'String error'
 * ```
 */
export function extractErrorMessage(error: unknown): string {
  return getErrorMessage(error, 'An unknown error occurred');
}

/**
 * Creates an Error object from any error type.
 * Consolidates the common pattern: error instanceof Error ? error : new Error(String(error))
 *
 * @param error - Error of any type
 * @param fallbackMessage - Fallback message if error cannot be converted (default: 'An error occurred')
 * @returns Error object
 *
 * @example
 * ```typescript
 * toError(new Error('Test')); // Returns: Error('Test')
 * toError('String error'); // Returns: Error('String error')
 * toError(null); // Returns: Error('An error occurred')
 * ```
 */
export function toError(error: unknown, fallbackMessage: string = 'An error occurred'): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === 'string' ? error : fallbackMessage);
}

/**
 * Extract error code from error object or string.
 *
 * @param error - Error object or string
 * @returns Error code if available, undefined otherwise
 *
 * @example
 * ```typescript
 * const error = new Error('Test');
 * (error as Error & { code?: string }).code = 'TEST_ERROR';
 * extractErrorCode(error); // Returns: 'TEST_ERROR'
 * ```
 */
export function extractErrorCode(error: unknown): string | undefined {
  if (error instanceof Error) {
    return (error as Error & { code?: string }).code;
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string };
    return err.code;
  }
  return undefined;
}

/**
 * Extract correlation ID from error object.
 *
 * @param error - Error object
 * @returns Correlation ID if available, undefined otherwise
 *
 * @example
 * ```typescript
 * const error = new Error('Test');
 * (error as Error & { correlationId?: string }).correlationId = 'corr-123';
 * extractCorrelationId(error); // Returns: 'corr-123'
 * ```
 */
export function extractCorrelationId(error: unknown): string | undefined {
  if (error instanceof Error) {
    return (error as Error & { correlationId?: string }).correlationId;
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as { correlationId?: string };
    return err.correlationId;
  }
  return undefined;
}

/**
 * Extract error code from error object or string.
 * Handles various error formats including Error objects, API responses, and Axios errors.
 *
 * @param error - Error object
 * @returns Error code if available, undefined otherwise
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
 * Extract correlation ID from Error object.
 * Handles various correlation ID property names and header locations.
 *
 * @param error - Error object
 * @returns Correlation ID if available, undefined otherwise
 */
function extractCorrelationIdFromError(error: unknown): string | undefined {
  if (!error) return undefined;

  if (typeof error !== 'object' || error === null) return undefined;

  const err = error as Record<string, unknown>;

  // Check common correlation ID property names
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
 * Extract correlation ID from Response headers.
 *
 * @param response - Response object
 * @returns Correlation ID if available, undefined otherwise
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
 * Extract error code from HTTP status code.
 *
 * @param statusCode - HTTP status code
 * @returns Error code string
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
 * Extract error information from API error response.
 * Supports various error response formats including Error objects, Response objects, and API response objects.
 *
 * @param error - Error of various types
 * @param defaultError - Default error if error is null/undefined
 * @returns Extracted error information
 *
 * @example
 * ```typescript
 * extractErrorFromApiResponse(new Error('Test')); // Returns: { error: Error, timestamp: Date }
 * extractErrorFromApiResponse({ error: 'API Error', code: 'API_ERROR' }); // Returns: { error: 'API Error', errorCode: 'API_ERROR' }
 * ```
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
      errorCode: extractErrorCodeFromError(error),
      correlationId: extractCorrelationIdFromError(error),
    };
  }

  // Handle fetch Response objects directly
  if (error instanceof Response) {
    const correlationId = extractCorrelationIdFromResponse(error);
    const errorCode = error.status ? getErrorCodeFromStatusCode(error.status) : undefined;
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

  // Handle API response objects
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;

    // Check for ApiResponse structure (from API client)
    if ('success' in errorObj && !errorObj.success && ('error' in errorObj || 'code' in errorObj)) {
      return {
        error: new Error((errorObj.error || errorObj.message || 'API request failed') as string),
        errorCode: errorObj.code as string | undefined,
        correlationId: errorObj.correlationId as string | undefined,
        timestamp: new Date(),
      };
    }

    // Check for Axios error structure
    if (errorObj.response) {
      const response = errorObj.response as Record<string, unknown>;
      const data = (response.data || {}) as Record<string, unknown>;

      const errorMessage = (data.message || errorObj.message || 'API request failed') as string;
      return {
        error: typeof errorMessage === 'string' ? new Error(errorMessage) : (errorMessage as Error),
        errorCode: (data.code || data.errorCode || extractErrorCodeFromError(errorObj)) as
          | string
          | undefined,
        correlationId: ((response.headers as Record<string, unknown>)?.['x-correlation-id'] ||
          (response.headers as Record<string, unknown>)?.['X-Correlation-ID'] ||
          data.correlationId ||
          data.correlation_id ||
          extractCorrelationIdFromError(errorObj)) as string | undefined,
        statusCode: response.status as number | undefined,
        timestamp: new Date(),
      };
    }

    // Check for fetch API error structure (Response-like object)
    if (errorObj.status || errorObj.statusText) {
      let correlationId: string | undefined;

      if (errorObj.headers) {
        if (errorObj.headers instanceof Headers) {
          correlationId =
            errorObj.headers.get('x-correlation-id') ||
            errorObj.headers.get('X-Correlation-ID') ||
            errorObj.headers.get('X-Request-ID') ||
            undefined;
        } else if (typeof errorObj.headers === 'object') {
          const headers = errorObj.headers as Record<string, unknown>;
          correlationId = (headers['x-correlation-id'] ||
            headers['X-Correlation-ID'] ||
            headers['X-Request-ID'] ||
            undefined) as string | undefined;
        }
      }

      return {
        error: (errorObj.message || new Error('HTTP request failed')) as Error,
        errorCode: (errorObj.code || extractErrorCodeFromError(errorObj)) as string | undefined,
        correlationId: correlationId || extractCorrelationIdFromError(errorObj),
        statusCode: errorObj.status as number | undefined,
        timestamp: new Date(),
      };
    }

    // Handle generic object with error properties
    if (errorObj.message || errorObj.error) {
      return {
        error: (errorObj.message || errorObj.error || new Error('Error occurred')) as
          | Error
          | string,
        errorCode: (errorObj.code || errorObj.errorCode || extractErrorCodeFromError(errorObj)) as
          | string
          | undefined,
        correlationId: (errorObj.correlationId ||
          errorObj.correlation_id ||
          errorObj.requestId ||
          extractCorrelationIdFromError(errorObj)) as string | undefined,
        statusCode: (errorObj.statusCode || errorObj.status) as number | undefined,
        timestamp: new Date(),
      };
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      error: new Error(error),
      timestamp: new Date(),
    };
  }

  return defaultErrorObj;
}

/**
 * Create a standardized error from various error sources with context.
 *
 * @param error - Error of various types
 * @param context - Optional context information
 * @returns Extracted error information with context
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
 * Check if error is retryable based on error message or type.
 *
 * @param error - Error to check
 * @returns True if error is retryable, false otherwise
 *
 * @example
 * ```typescript
 * isRetryableError(new Error('Network timeout')); // Returns: true
 * isRetryableError(new Error('Validation error')); // Returns: false
 * ```
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Network errors are retryable
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('connection')
    ) {
      return true;
    }
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as { retryable?: boolean; code?: string };
    if (err.retryable !== undefined) {
      return err.retryable;
    }
    // 5xx errors are retryable
    if (err.code && err.code.startsWith('5')) {
      return true;
    }
  }
  return false;
}

/**
 * Patterns that should be sanitized from error messages.
 * Used to remove sensitive information from error strings.
 */
const SENSITIVE_ERROR_PATTERNS: RegExp[] = [
  // Password patterns
  /password\s*[:=]\s*['"]?[^'"]+['"]?/gi,
  /pwd\s*[:=]\s*['"]?[^'"]+['"]?/gi,
  /passwd\s*[:=]\s*['"]?[^'"]+['"]?/gi,

  // Token patterns
  /token\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?/gi,
  /api[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?/gi,
  /auth[_-]?token\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?/gi,
  /bearer\s+[a-zA-Z0-9_-]{20,}/gi,

  // SQL query patterns
  /SELECT\s+.+\s+FROM/gi,
  /INSERT\s+INTO/gi,
  /UPDATE\s+.+\s+SET/gi,
  /DELETE\s+FROM/gi,

  // File paths (may contain sensitive info)
  /\/[\w/.-]+\.(key|pem|p12|pfx|crt|cer)/gi,
  /C:\\[\w\\.-]+\.(key|pem|p12|pfx|crt|cer)/gi,

  // Stack traces
  /at\s+[^\n]+\([^\n]+\)/g,
  /Stack\s+Trace:/gi,

  // Internal paths
  /\/home\/[^/]+\/[^:]+/gi,
  /\/Users\/[^/]+\/[^:]+/gi,
];

/**
 * Sanitize an error message by removing sensitive information.
 *
 * @param message - Raw error message
 * @returns Sanitized message safe for user display/logging
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return 'An error occurred';
  }

  let sanitized = message;

  // Remove sensitive patterns
  for (const pattern of SENSITIVE_ERROR_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  // Remove email addresses (may contain sensitive info)
  sanitized = sanitized.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL_REDACTED]'
  );

  // Remove IP addresses
  sanitized = sanitized.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_REDACTED]');

  // Remove long hex strings (potential tokens/keys)
  sanitized = sanitized.replace(/\b[a-fA-F0-9]{32,}\b/g, '[HEX_REDACTED]');

  // Truncate very long messages
  if (sanitized.length > 500) {
    sanitized = `${sanitized.substring(0, 500)}... [truncated]`;
  }

  // If message is empty after sanitization, provide generic message
  if (sanitized.trim().length === 0) {
    return 'An error occurred';
  }

  return sanitized;
}

/**
 * Sanitize an error-like value and return a safe string representation.
 *
 * @param error - Error value of various types
 * @returns Sanitized error message
 */
export function sanitizeError(error: unknown): string {
  if (!error) {
    return 'An error occurred';
  }

  if (typeof error === 'string') {
    return sanitizeErrorMessage(error);
  }

  if (error instanceof Error) {
    return sanitizeErrorMessage(error.message);
  }

  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;

    // Try to get message from common properties
    const message = err.message || err.error || err.msg || err.toString();

    if (message) {
      return sanitizeErrorMessage(String(message));
    }
  }

  return 'An error occurred';
}

/**
 * Check if an error message contains potentially sensitive information.
 *
 * @param message - Error message to check
 * @returns True if sensitive info patterns are detected, false otherwise
 */
export function containsSensitiveInfo(message: string): boolean {
  if (!message || typeof message !== 'string') {
    return false;
  }

  for (const pattern of SENSITIVE_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}

/**
 * Extract error from fetch Response object asynchronously.
 * Reads response body to extract error details and correlation IDs.
 *
 * @param response - Fetch Response object
 * @param defaultError - Optional default error if response body cannot be parsed
 * @returns Promise resolving to extracted error information
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
    // Prefer correlation ID from headers
    const headerCorrelationId =
      response.headers.get('x-correlation-id') ||
      response.headers.get('X-Correlation-ID') ||
      correlationId;

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json().catch(() => ({}));
      const dataRecord = data as Record<string, unknown>;
      errorMessage =
        (dataRecord.message as string) ||
        (dataRecord.error as string) ||
        (dataRecord.errorMessage as string) ||
        errorMessage;
      bodyErrorCode =
        (dataRecord.code as string) || (dataRecord.errorCode as string) || bodyErrorCode;
      bodyCorrelationId =
        (dataRecord.correlationId as string) ||
        (dataRecord.correlation_id as string) ||
        headerCorrelationId ||
        bodyCorrelationId;
    } else {
      // Try to get text response
      const text = await response.text().catch(() => '');
      if (text) {
        // Try to parse as JSON even if content-type wasn't set correctly
        try {
          const data = JSON.parse(text) as Record<string, unknown>;
          errorMessage =
            (data.message as string) ||
            (data.error as string) ||
            (data.errorMessage as string) ||
            errorMessage;
          bodyErrorCode = (data.code as string) || (data.errorCode as string) || bodyErrorCode;
          bodyCorrelationId =
            bodyCorrelationId ||
            (data.correlationId as string) ||
            (data.correlation_id as string) ||
            bodyCorrelationId;
        } catch {
          // Not JSON, use text as error message if it's reasonable length
          if (text.length < 200) {
            errorMessage = text;
          }
        }
      }
    }
  } catch {
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
 * Extract error from fetch API call result.
 * Handles both Response objects and errors thrown.
 *
 * @param fetchCall - Promise resolving to a fetch Response
 * @param defaultError - Optional default error if no detailed error is available
 * @returns Promise resolving to extracted error information
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
    const result = extractErrorFromApiResponse(error, defaultError);

    return result;
  }
}

/**
 * Create a standardized error handler for fetch API calls.
 * Extracts correlation IDs automatically from responses.
 *
 * @param defaultError - Optional default error if response body cannot be parsed
 * @returns Handler function that extracts error information from Response
 */
export function createFetchErrorHandler(defaultError?: Error | string) {
  return async (response: Response): Promise<ExtractedErrorInfo> => {
    return await extractErrorFromFetchResponseAsync(response, defaultError);
  };
}

/**
 * Handle crypto operation errors with standardized logging and error throwing.
 * Consolidates error handling for encryption/decryption operations.
 *
 * @param operation - The operation that failed (e.g., 'encrypt data', 'decrypt data')
 * @param error - The error that occurred
 * @throws Always throws an Error with a standardized message
 */
export function handleCryptoError(operation: string, error: unknown): never {
  // Use the unified error handler
  const appError = {
    id: `crypto_error_${Date.now()}`,
    type: 'CLIENT' as const,
    category: 'CLIENT' as const,
    severity: 'HIGH' as const,
    message: `${operation} failed`,
    code: 'CRYPTO_ERROR',
    userMessage: `Failed to ${operation.toLowerCase()}`,
    recoverable: false,
    retryable: false,
    timestamp: new Date(),
    correlationId: `crypto_${Date.now()}`,
  };

  // Log the error (would use proper logger in production)
  console.error(`[CRYPTO ERROR] ${operation} failed:`, {
    error: error instanceof Error ? error.message : String(error),
    correlationId: appError.correlationId,
  });

  throw new Error(appError.userMessage);
}
