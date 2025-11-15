// Password Validation - SSOT for frontend password rules
// Aligned with backend validation requirements

import { z } from 'zod'

/**
 * Password Validation Schema
 * 
 * Frontend validation aligned with backend requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")

/**
 * Password validation utility
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  try {
    passwordSchema.parse(password)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(e => e.message)
      }
    }
    return {
      isValid: false,
      errors: ["Invalid password format"]
    }
  }
}

/**
 * Password strength indicator
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0
  
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  
  if (score <= 2) return 'weak'
  if (score <= 4) return 'medium'
  return 'strong'
}

/**
 * Password validation feedback component data
 */
export function getPasswordFeedback(password: string): {
  checks: Array<{ label: string; passed: boolean }>
  strength: 'weak' | 'medium' | 'strong'
} {
  const checks = [
    {
      label: 'At least 8 characters',
      passed: password.length >= 8
    },
    {
      label: 'One uppercase letter',
      passed: /[A-Z]/.test(password)
    },
    {
      label: 'One lowercase letter',
      passed: /[a-z]/.test(password)
    },
    {
      label: 'One number',
      passed: /[0-9]/.test(password)
    },
    {
      label: 'One special character',
      passed: /[^A-Za-z0-9]/.test(password)
    }
  ]
  
  return {
    checks,
    strength: getPasswordStrength(password)
  }
}

export default passwordSchema

