import { z } from 'zod';

// Input validation schemas
export const emailSchema = z
  .string()
  .email({ message: 'Invalid email format' })
  .max(255, { message: 'Email too long' });
export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(128, { message: 'Password too long' })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  });
export const nameSchema = z
  .string()
  .min(1, { message: 'Name is required' })
  .max(100, { message: 'Name too long' })
  .regex(/^[a-zA-Z\s]+$/, { message: 'Name can only contain letters and spaces' });
export const textSchema = z.string().max(5000, { message: 'Text too long' });

// Sanitization function - basic HTML/script tag removal
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

// User input validation schema
export const userInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema.optional(),
});

// Form validation utility
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

// XSS protection for rendering - basic HTML escape
export function sanitizeForRender(content: string): string {
  const div = document.createElement('div');
  div.textContent = content;
  return div.innerHTML;
}

// File validation
export function validateFile(
  file: File,
  options?: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  }
): { valid: boolean; error?: string } {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options || {};

  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }

  return { valid: true };
}
