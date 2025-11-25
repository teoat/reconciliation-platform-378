/**
 * Password Validation
 * 
 * @deprecated This file is deprecated. Use `@/utils/common/validation` instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 * 
 * Migration guide:
 * - `passwordSchema` → `@/utils/common/validation::passwordSchema`
 * - `validatePassword()` → `@/utils/common/validation::validatePassword()`
 * - `getPasswordStrength()` → `@/utils/common/validation::getPasswordStrength()`
 * - `getPasswordFeedback()` → `@/utils/common/validation::getPasswordFeedback()`
 */

// Re-export from common module for backward compatibility
export {
  passwordSchema,
  validatePassword,
  getPasswordStrength,
  getPasswordFeedback,
} from './common/validation';

// Keep default export for backward compatibility
import { passwordSchema } from './common/validation';
export default passwordSchema;
