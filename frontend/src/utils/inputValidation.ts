import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  textSchema,
} from './common/validation';
import { sanitizeInput } from './common/sanitization';

// Re-export validation schemas from common module
export {
  emailSchema,
  passwordSchema,
  nameSchema,
  textSchema,
  sanitizeInput,
};

// User input validation schema
export const userInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema.optional(),
});

// Re-export form validation from common module
export { validateFormInput, validateFile } from './common/validation';

// XSS protection for rendering - basic HTML escape
// Note: This is a simple alias for escapeHtml, consider using common/sanitization::escapeHtml
export function sanitizeForRender(content: string): string {
  const div = document.createElement('div');
  div.textContent = content;
  return div.innerHTML;
}
