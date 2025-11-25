/**
 * Error Message Sanitization Utilities
 *
 * Sanitizes error messages to prevent information leakage and security issues.
 * Removes sensitive data like passwords, tokens, SQL queries, and stack traces
 * from error messages before displaying them to users.
 */

/**
 * Patterns that should be sanitized from error messages
 */
const SENSITIVE_PATTERNS = [
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
 * Sanitize an error message by removing sensitive information
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return 'An error occurred';
  }

  let sanitized = message;

  // Remove sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
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
    sanitized = sanitized.substring(0, 500) + '... [truncated]';
  }

  // If message is empty after sanitization, provide generic message
  if (sanitized.trim().length === 0) {
    return 'An error occurred';
  }

  return sanitized;
}

/**
 * Sanitize an error object
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
 * Check if an error message contains potentially sensitive information
 */
export function containsSensitiveInfo(message: string): boolean {
  if (!message || typeof message !== 'string') {
    return false;
  }

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}
