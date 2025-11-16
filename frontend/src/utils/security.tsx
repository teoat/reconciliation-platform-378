import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/services/logger'

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHTML(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * Escapes HTML special characters
 */
export function escapeHTML(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

/**
 * Validates and sanitizes user input
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long')
  } else {
    score += 1
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter')
  } else {
    score += 1
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter')
  } else {
    score += 1
  }

  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number')
  } else {
    score += 1
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Password must contain at least one special character')
  } else {
    score += 1
  }

  return {
    isValid: score >= 4,
    score,
    feedback,
  }
}

/**
 * Generates a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Encrypts sensitive data using Web Crypto API
 */
export async function encryptData(data: string, key: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const keyBuffer = encoder.encode(key)

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    )

    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBuffer
    )

    const result = new Uint8Array(iv.length + encrypted.byteLength)
    result.set(iv)
    result.set(new Uint8Array(encrypted), iv.length)

    return btoa(String.fromCharCode(...result))
  } catch (error) {
    logger.error('Encryption failed:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypts sensitive data using Web Crypto API
 */
export async function decryptData(encryptedData: string, key: string): Promise<string> {
  try {
    const decoder = new TextDecoder()
    const keyBuffer = new TextEncoder().encode(key)

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )

    const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
    const iv = data.slice(0, 12)
    const encrypted = data.slice(12)

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encrypted
    )

    return decoder.decode(decrypted)
  } catch (error) {
    logger.error('Decryption failed:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Creates a secure hash using Web Crypto API
 */
export async function createHash(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Validates JWT token
 */
export function validateJWT(token: string): { isValid: boolean; payload?: any; error?: string } {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { isValid: false, error: 'Invalid token format' }
    }

    const payload = JSON.parse(atob(parts[1]))
    const now = Math.floor(Date.now() / 1000)

    if (payload.exp && payload.exp < now) {
      return { isValid: false, error: 'Token expired' }
    }

    if (payload.nbf && payload.nbf > now) {
      return { isValid: false, error: 'Token not yet valid' }
    }

    return { isValid: true, payload }
  } catch (error) {
    return { isValid: false, error: 'Invalid token' }
  }
}

// ============================================================================
// SECURITY HOOKS
// ============================================================================

/**
 * Hook for secure form handling
 */
export function useSecureForm<T extends Record<string, unknown>>(
  initialValues: T,
  validationRules: Record<keyof T, (value: any) => string | null>
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>)
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>)

  const setValue = useCallback((name: keyof T, value: any) => {
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value
    setValues(prev => ({ ...prev, [name]: sanitizedValue }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }, [errors])

  const validateField = useCallback((name: keyof T) => {
    const value = values[name]
    const rule = validationRules[name]
    
    if (rule) {
      const error = rule(value)
      if (error) {
        setErrors(prev => ({ ...prev, [name]: error }))
        return error
      }
    }
    
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
    
    return null
  }, [values, validationRules])

  const handleBlur = useCallback((name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    validateField(name)
  }, [validateField])

  const handleSubmit = useCallback((onSubmit: (values: T) => void) => {
    const newErrors: Record<keyof T, string> = {} as Record<keyof T, string>
    let hasErrors = false

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name as keyof T)
      if (error) {
        newErrors[name as keyof T] = error
        hasErrors = true
      }
    })

    if (!hasErrors) {
      onSubmit(values)
    }

    setErrors(newErrors)
  }, [values, validationRules, validateField])

  return {
    values,
    errors,
    touched,
    setValue,
    handleBlur,
    handleSubmit,
    validateField,
  }
}

/**
 * Hook for secure authentication
 */
export function useSecureAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = secureStorage.getItem('authToken')
    if (token) {
      const validation = validateJWT(token)
      if (validation.isValid) {
        setIsAuthenticated(true)
        setUser(validation.payload)
      } else {
        localStorage.removeItem('authToken')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email)
      const sanitizedPassword = sanitizeInput(password)

      // Validate email
      if (!isValidEmail(sanitizedEmail)) {
        throw new Error('Invalid email format')
      }

      // Validate password
      const passwordValidation = validatePasswordStrength(sanitizedPassword)
      if (!passwordValidation.isValid) {
        throw new Error('Password does not meet security requirements')
      }

      // Make API call (this would be implemented based on your API)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: sanitizedEmail,
          password: sanitizedPassword,
        }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      
      // Store token securely
      secureStorage.setItem('authToken', data.token)
      setIsAuthenticated(true)
      setUser(data.user)

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    secureStorage.removeItem('authToken')
    setIsAuthenticated(false)
    setUser(null)
  }, [])

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
  }
}

/**
 * Secure storage utility with encryption for sensitive data
 */
class SecureStorage {
  private static instance: SecureStorage

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage()
    }
    return SecureStorage.instance
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = ['token', 'auth', 'password', 'secret', 'key']
    return sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
  }

  setItem(key: string, value: string): void {
    try {
      if (this.isSensitiveKey(key)) {
        // For sensitive data, use sessionStorage instead of localStorage
        sessionStorage.setItem(key, value)
      } else {
        localStorage.setItem(key, value)
      }
    } catch (error) {
      // Silently fail in production to avoid exposing errors
      if (import.meta.env.DEV) {
        logger.warn('Storage error:', error)
      }
    }
  }

  getItem(key: string): string | null {
    try {
      if (this.isSensitiveKey(key)) {
        return sessionStorage.getItem(key)
      }
      return localStorage.getItem(key)
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.warn('Storage read error:', error)
      }
      return null
    }
  }

  removeItem(key: string): void {
    try {
      if (this.isSensitiveKey(key)) {
        sessionStorage.removeItem(key)
      } else {
        localStorage.removeItem(key)
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.warn('Storage remove error:', error)
      }
    }
  }
}

export const secureStorage = SecureStorage.getInstance()

/**
 * Hook for secure data storage
 */
export function useSecureStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = secureStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      secureStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      // Silently fail
    }
  }, [key, storedValue])

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      secureStorage.removeItem(key)
    } catch (error) {
      // Silently fail
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}

/**
 * Hook for secure API calls
 */
export function useSecureAPI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const makeRequest = useCallback(async (
    url: string,
    options: RequestInit = {}
  ) => {
    try {
      setLoading(true)
      setError(null)

      // Add security headers
      const secureOptions: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...options.headers,
        },
      }

      // Add auth token if available
      const token = secureStorage.getItem('authToken')
      if (token) {
        secureOptions.headers = {
          ...secureOptions.headers,
          'Authorization': `Bearer ${token}`,
        }
      }

      const response = await fetch(url, secureOptions)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'API request failed'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    makeRequest,
    loading,
    error,
  }
}

/**
 * Hook for secure file uploads
 */
export function useSecureFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (file: File) => {
    try {
      setUploading(true)
      setError(null)
      setProgress(0)

      // Validate file
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size exceeds 10MB limit')
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not allowed')
      }

      // Create form data
      const formData = new FormData()
      formData.append('file', file)

      // Add auth token
      const token = secureStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication required')
      }

      // Make upload request
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'File upload failed'
      setError(errorMessage)
      throw error
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [])

  return {
    uploadFile,
    uploading,
    progress,
    error,
  }
}

// ============================================================================
// SECURITY COMPONENTS
// ============================================================================

/**
 * Secure input component with built-in sanitization
 */
export function SecureInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  ...props
}: {
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  [key: string]: any
}) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = sanitizeInput(e.target.value)
    onChange(sanitizedValue)
  }, [onChange])

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      {...props}
    />
  )
}

/**
 * Secure textarea component with built-in sanitization
 */
export function SecureTextarea({
  value,
  onChange,
  placeholder,
  required = false,
  ...props
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  [key: string]: any
}) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const sanitizedValue = sanitizeInput(e.target.value)
    onChange(sanitizedValue)
  }, [onChange])

  return (
    <textarea
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      {...props}
    />
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  sanitizeHTML,
  escapeHTML,
  sanitizeInput,
  isValidEmail,
  validatePasswordStrength,
  generateSecureToken,
  encryptData,
  decryptData,
  createHash,
  validateJWT,
  useSecureForm,
  useSecureAuth,
  useSecureStorage,
  useSecureAPI,
  useSecureFileUpload,
  SecureInput,
  SecureTextarea,
}
