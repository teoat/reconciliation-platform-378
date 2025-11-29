// ============================================================================
// COMMON TYPES - SSOT
// ============================================================================
// Single source of truth for common type definitions used across the application

/**
 * Validation error structure
 * Used for form and data validation across components
 * 
 * @example
 * ```typescript
 * const errors: ValidationError[] = [
 *   { field: 'email', message: 'Email is required' },
 *   { field: 'password', message: 'Password must be at least 8 characters' }
 * ];
 * ```
 */
export interface ValidationError {
  /** Field name that has the validation error */
  field: string;
  /** Human-readable error message */
  message: string;
}

/**
 * Validation result structure
 * 
 * @example
 * ```typescript
 * const result: ValidationResult = {
 *   isValid: false,
 *   errors: [
 *     { field: 'email', message: 'Invalid email format' }
 *   ]
 * };
 * ```
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Array of validation errors */
  errors: ValidationError[];
}

