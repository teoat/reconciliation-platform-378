/**
 * HTML sanitization utilities
 * 
 * @deprecated This file is deprecated. Use `@/utils/common/sanitization` instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 * 
 * Migration guide:
 * - `sanitizeHtml()` → `@/utils/common/sanitization::sanitizeHtml()`
 * - `sanitizeForReact()` → `@/utils/common/sanitization::sanitizeForReact()`
 * - `sanitizeTextOnly()` → `@/utils/common/sanitization::sanitizeTextOnly()`
 */

// Re-export from common module for backward compatibility
export {
  sanitizeHtml,
  sanitizeForReact,
  sanitizeTextOnly,
  sanitizeInput,
  escapeHtml,
} from './common/sanitization';
