//! Common Validation Utilities
//!
//! Single source of truth for validation functions.
//! Consolidates email, password, and file validation from multiple files.

import { z } from 'zod';

/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates an email address format.
 *
 * @param email - Email address to validate
 * @returns True if email is valid, false otherwise
 *
 * @example
 * ```typescript
 * validateEmail('user@example.com'); // Returns: true
 * validateEmail('invalid-email'); // Returns: false
 * ```
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Email validation schema using Zod.
 *
 * @example
 * ```typescript
 * const result = emailSchema.safeParse('user@example.com');
 * if (result.success) {
 *   // Email is valid, use result.data
 * }
 * ```
 */
export const emailSchema = z
  .string()
  .email({ message: 'Invalid email format' })
  .max(255, { message: 'Email too long' });

/**
 * Password validation schema using Zod.
 * Aligned with backend validation requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * @example
 * ```typescript
 * const result = passwordSchema.safeParse('MyP@ssw0rd');
 * if (result.success) {
 *   // Password is valid
 * }
 * ```
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Validates a password against the password schema.
 *
 * @param password - Password to validate
 * @returns Validation result with isValid flag and error messages
 *
 * @example
 * ```typescript
 * const result = validatePassword('weak');
 * // Returns: { isValid: false, errors: ['Password must be at least 8 characters long', ...] }
 * ```
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  try {
    passwordSchema.parse(password);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((e) => e.message),
      };
    }
    return {
      isValid: false,
      errors: ['Invalid password format'],
    };
  }
}

/**
 * Calculates password strength based on various criteria.
 *
 * @param password - Password to evaluate
 * @returns Password strength: 'weak', 'medium', or 'strong'
 *
 * @example
 * ```typescript
 * getPasswordStrength('MyP@ssw0rd'); // Returns: 'strong'
 * getPasswordStrength('password'); // Returns: 'weak'
 * ```
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

/**
 * Gets password validation feedback with individual checks.
 *
 * @param password - Password to evaluate
 * @returns Object with checks array and strength indicator
 *
 * @example
 * ```typescript
 * const feedback = getPasswordFeedback('MyP@ssw0rd');
 * // Returns: { checks: [...], strength: 'strong' }
 * ```
 */
export function getPasswordFeedback(password: string): {
  checks: Array<{ label: string; passed: boolean }>;
  strength: 'weak' | 'medium' | 'strong';
} {
  const checks = [
    {
      label: 'At least 8 characters',
      passed: password.length >= 8,
    },
    {
      label: 'One uppercase letter',
      passed: /[A-Z]/.test(password),
    },
    {
      label: 'One lowercase letter',
      passed: /[a-z]/.test(password),
    },
    {
      label: 'One number',
      passed: /[0-9]/.test(password),
    },
    {
      label: 'One special character',
      passed: /[^A-Za-z0-9]/.test(password),
    },
  ];

  return {
    checks,
    strength: getPasswordStrength(password),
  };
}

/**
 * Validates password strength with detailed feedback (score and messages).
 * This is a more detailed version that returns numeric score and feedback messages.
 * For simple strength indicator, use `getPasswordStrength()` instead.
 *
 * @param password - Password to validate
 * @returns Object with isValid flag, numeric score (0-5), and feedback messages
 *
 * @example
 * ```typescript
 * const result = validatePasswordStrength('MyP@ssw0rd');
 * // Returns: { isValid: true, score: 5, feedback: [] }
 * const result2 = validatePasswordStrength('weak');
 * // Returns: { isValid: false, score: 1, feedback: ['Password must be at least 8 characters long', ...] }
 * ```
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }
  if (password.length > 128) {
    feedback.push('Password must be no more than 128 characters');
  }
  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }
  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else {
    score += 1;
  }
  // Unified banned password list
  const bannedPasswords = [
    'password', 'password123', '123456', '12345678', 'admin123', 'qwerty123',
    'welcome123', 'letmein', 'monkey', 'dragon', 'master', 'abc123', 'qwerty'
  ];
  if (bannedPasswords.some((banned) => password.toLowerCase().includes(banned))) {
    feedback.push('Password is too common');
  }
  // Sequential character check (max 3)
  let sequentialCount = 1;
  const chars = password.split('');
  for (let i = 1; i < chars.length; i++) {
    if (chars[i].charCodeAt(0) === chars[i-1].charCodeAt(0) + 1) {
      sequentialCount++;
      if (sequentialCount > 3) {
        feedback.push('Password contains more than 3 sequential characters');
        break;
      }
    } else {
      sequentialCount = 1;
    }
  }
  // Stub: Password history and expiration checks (to be implemented)
  // feedback.push('Password reuse/history/expiration checks not yet implemented');
  return {
    isValid: score >= 4 && feedback.length === 0,
    score,
    feedback,
  };
}

/**
 * File validation options
 */
export interface FileValidationOptions {
  /** Maximum file size in bytes (default: 10MB) */
  maxSize?: number;
  /** Allowed MIME types (empty array = all types allowed) */
  allowedTypes?: string[];
  /** Allowed file extensions (e.g., ['.csv', '.xlsx']) */
  allowedExtensions?: string[];
  /** Whether to check for suspicious characters in filename */
  validateFileName?: boolean;
}

/**
 * Validates a file against specified criteria.
 *
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result with valid flag and optional error message
 *
 * @example
 * ```typescript
 * const result = validateFile(file, {
 *   maxSize: 5 * 1024 * 1024, // 5MB
 *   allowedTypes: ['text/csv', 'application/json'],
 *   allowedExtensions: ['.csv', '.json']
 * });
 * ```
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    allowedExtensions = [],
    validateFileName = true,
  } = options;

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext.toLowerCase()));
    if (!hasValidExtension) {
      return {
        valid: false,
        error: `File extension not allowed. Allowed: ${allowedExtensions.join(', ')}`,
      };
    }
  }

  // Check filename for suspicious characters
  if (validateFileName) {
    const suspiciousPatterns = /[<>:"|?*]/;
    if (suspiciousPatterns.test(file.name)) {
      return {
        valid: false,
        error: 'File name contains invalid characters',
      };
    }
  }

  return { valid: true };
}

/**
 * Validates file type against allowed extensions.
 *
 * @param file - File to validate
 * @param allowedTypes - Array of allowed file extensions (e.g., ['.csv', '.xlsx'])
 * @returns True if file type is allowed
 *
 * @example
 * ```typescript
 * validateFileType(file, ['.csv', '.xlsx', '.xls', '.json']); // Returns: true/false
 * ```
 */
export function validateFileType(
  file: File,
  allowedTypes: string[] = ['.csv', '.xlsx', '.xls', '.json']
): boolean {
  const fileName = file.name.toLowerCase();
  return allowedTypes.some((type) => fileName.endsWith(type.toLowerCase()));
}

/**
 * Validates file size against maximum size.
 *
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in megabytes (default: 50MB)
 * @returns True if file size is within limit
 *
 * @example
 * ```typescript
 * validateFileSize(file, 50); // Returns: true/false
 * ```
 */
export function validateFileSize(file: File, maxSizeMB: number = 50): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Name validation schema using Zod.
 *
 * @example
 * ```typescript
 * const result = nameSchema.safeParse('John Doe');
 * ```
 */
export const nameSchema = z
  .string()
  .min(1, { message: 'Name is required' })
  .max(100, { message: 'Name too long' })
  .regex(/^[a-zA-Z\s]+$/, {
    message: 'Name can only contain letters and spaces',
  });

/**
 * Text validation schema using Zod.
 *
 * @example
 * ```typescript
 * const result = textSchema.safeParse('Some text content');
 * ```
 */
export const textSchema = z.string().max(5000, { message: 'Text too long' });

/**
 * Generic form input validation using Zod schema.
 *
 * @param schema - Zod schema to validate against
 * @param input - Input data to validate
 * @returns Validation result with success flag, data, or errors
 *
 * @example
 * ```typescript
 * const result = validateFormInput(emailSchema, 'user@example.com');
 * if (result.success) {
 *   // Input is valid, use result.data
 * } else {
 *   // Input is invalid, handle result.errors
 * }
 * ```
 */
export function validateFormInput<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown
): { success: boolean; data?: z.infer<T>; errors?: z.ZodError } {
  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}
