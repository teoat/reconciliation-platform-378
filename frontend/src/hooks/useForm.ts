import React, { useState, useCallback } from 'react'
import { logger } from '@/services/logger'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  custom?: (value: any) => string | null
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export interface FormData {
  [key: string]: any
}

export interface FormErrors {
  [key: string]: string
}

export interface UseFormOptions {
  initialValues?: FormData
  validationRules?: ValidationRules
  onSubmit?: (values: FormData) => void | Promise<void>
}

export interface UseFormReturn {
  values: FormData
  errors: FormErrors
  touched: { [key: string]: boolean }
  isSubmitting: boolean
  isValid: boolean
  setValue: (name: string, value: any) => void
  setError: (name: string, error: string) => void
  clearError: (name: string) => void
  handleChange: (name: string, value: any) => void
  handleBlur: (name: string) => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  reset: () => void
  validateField: (name: string) => string | null
  validateForm: () => FormErrors
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateField = (value: any, rules: ValidationRule): string | null => {
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return 'This field is required'
  }

  if (value && typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `Minimum length is ${rules.minLength} characters`
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `Maximum length is ${rules.maxLength} characters`
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return 'Invalid format'
    }

    if (rules.email && !validateEmail(value)) {
      return 'Invalid email address'
    }
  }

  if (rules.custom) {
    return rules.custom(value)
  }

  return null
}

export const useForm = ({
  initialValues = {},
  validationRules = {},
  onSubmit
}: UseFormOptions = {}): UseFormReturn => {
  const [values, setValues] = useState<FormData>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateFieldValue = useCallback((name: string): string | null => {
    const value = values[name]
    const rules = validationRules[name]
    
    if (!rules) return null
    
    return validateField(value, rules)
  }, [values, validationRules])

  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {}
    
    Object.keys(validationRules).forEach(name => {
      const error = validateFieldValue(name)
      if (error) {
        newErrors[name] = error
      }
    })
    
    return newErrors
  }, [validationRules, validateFieldValue])

  const isValid = Object.keys(errors).length === 0 && Object.keys(validateForm()).length === 0

  const setValue = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }, [errors])

  const setError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])

  const clearError = useCallback((name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
  }, [])

  const handleChange = useCallback((name: string, value: any) => {
    setValue(name, value)
  }, [setValue])

  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    
    const error = validateFieldValue(name)
    if (error) {
      setError(name, error)
    } else {
      clearError(name)
    }
  }, [validateFieldValue, setError, clearError])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    setIsSubmitting(true)
    
    // Mark all fields as touched
    const allTouched = Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as { [key: string]: boolean })
    setTouched(allTouched)

    // Validate all fields
    const formErrors = validateForm()
    setErrors(formErrors)

    if (Object.keys(formErrors).length === 0 && onSubmit) {
      try {
        await onSubmit(values)
      } catch (error) {
        logger.error('Form submission error:', error)
      }
    }

    setIsSubmitting(false)
  }, [validationRules, validateForm, onSubmit, values])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setError,
    clearError,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    validateField: validateFieldValue,
    validateForm
  }
}
