/**
 * Error Message Sanitization Utilities (Deprecated Wrapper)
 *
 * These exports are kept for backward compatibility and delegate to the
 * single source of truth in `./common/errorHandling`.
 */
export {
  sanitizeErrorMessage,
  sanitizeError,
  containsSensitiveInfo,
} from './common/errorHandling';
