// Single Source of Truth (SSOT) for all utility functions
// This file contains all utility functions used across the application

import { APP_CONFIG, VALIDATION_RULES, CURRENCY_FORMATS, DATE_FORMATS } from '../constants'

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isString = (value: any): value is string => typeof value === 'string'
export const isNumber = (value: any): value is number => typeof value === 'number' && !isNaN(value)
export const isBoolean = (value: any): value is boolean => typeof value === 'boolean'
export const isArray = (value: any): value is any[] => Array.isArray(value)
export const isObject = (value: any): value is Record<string, any> => 
  value !== null && typeof value === 'object' && !Array.isArray(value)
export const isFunction = (value: any): value is Function => typeof value === 'function'
export const isDate = (value: any): value is Date => value instanceof Date
export const isNull = (value: any): value is null => value === null
export const isUndefined = (value: any): value is undefined => value === undefined
export const isNullish = (value: any): value is null | undefined => value == null

// ============================================================================
// STRING UTILITIES
// ============================================================================

export const capitalize = (str: string): string => {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const capitalizeWords = (str: string): string => {
  if (!str) return str
  return str.split(' ').map(word => capitalize(word)).join(' ')
}

export const camelCase = (str: string): string => {
  if (!str) return str
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase()
    })
    .replace(/\s+/g, '')
}

export const kebabCase = (str: string): string => {
  if (!str) return str
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

export const snakeCase = (str: string): string => {
  if (!str) return str
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

export const pascalCase = (str: string): string => {
  if (!str) return str
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
    .replace(/\s+/g, '')
}

export const truncate = (str: string, length: number, suffix = '...'): string => {
  if (!str || str.length <= length) return str
  return str.slice(0, length) + suffix
}

export const slugify = (str: string): string => {
  if (!str) return str
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const removeAccents = (str: string): string => {
  if (!str) return str
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export const escapeHtml = (str: string): string => {
  if (!str) return str
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return str.replace(/[&<>"']/g, m => map[m])
}

export const unescapeHtml = (str: string): string => {
  if (!str) return str
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  }
  return str.replace(/&(amp|lt|gt|quot|#39);/g, m => map[m])
}

// ============================================================================
// NUMBER UTILITIES
// ============================================================================

export const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
  if (!isNumber(num)) return '0'
  return new Intl.NumberFormat('id-ID', options).format(num)
}

export const formatCurrency = (amount: number, currency = 'IDR'): string => {
  if (!isNumber(amount)) return 'Rp 0'
  
  const config = CURRENCY_FORMATS[currency as keyof typeof CURRENCY_FORMATS] || CURRENCY_FORMATS.IDR
  
  if (amount < 0) {
    return config.NEGATIVE_FORMAT.replace('#,##0', Math.abs(amount).toLocaleString('id-ID'))
  }
  
  return config.FORMAT.replace('#,##0', amount.toLocaleString('id-ID'))
}

export const formatPercentage = (value: number, decimals = 2): string => {
  if (!isNumber(value)) return '0%'
  return `${value.toFixed(decimals)}%`
}

export const parseNumber = (str: string): number => {
  if (!str) return 0
  const cleaned = str.replace(/[^\d.-]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

export const round = (value: number, decimals = 2): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

export const random = (min: number, max: number): number => {
  return Math.random() * (max - min) + min
}

export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const isEven = (num: number): boolean => num % 2 === 0
export const isOdd = (num: number): boolean => num % 2 !== 0

// ============================================================================
// DATE UTILITIES
// ============================================================================

export const formatDate = (date: Date | string, format = 'DD/MM/YYYY'): string => {
  if (!date) return ''
  
  const d = isDate(date) ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const seconds = d.getSeconds().toString().padStart(2, '0')
  
  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year.toString())
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export const parseDate = (str: string, format = 'DD/MM/YYYY'): Date | null => {
  if (!str) return null
  
  let day: string, month: string, year: string
  
  if (format === 'DD/MM/YYYY') {
    const parts = str.split('/')
    if (parts.length !== 3) return null
    ;[day, month, year] = parts
  } else if (format === 'YYYY-MM-DD') {
    const parts = str.split('-')
    if (parts.length !== 3) return null
    ;[year, month, day] = parts
  } else {
    return null
  }
  
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return isNaN(date.getTime()) ? null : date
}

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export const addYears = (date: Date, years: number): Date => {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)
  return result
}

export const getDaysBetween = (start: Date, end: Date): number => {
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const isToday = (date: Date): boolean => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.toDateString() === yesterday.toDateString()
}

export const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date.toDateString() === tomorrow.toDateString()
}

export const getStartOfDay = (date: Date): Date => {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

export const getEndOfDay = (date: Date): Date => {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

export const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export const getStartOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 0, 1)
}

export const getEndOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 11, 31)
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const validateEmail = (email: string): boolean => {
  if (!email) return false
  return VALIDATION_RULES.EMAIL.test(email)
}

export const validatePhone = (phone: string): boolean => {
  if (!phone) return false
  return VALIDATION_RULES.PHONE.test(phone)
}

export const validateURL = (url: string): boolean => {
  if (!url) return false
  return VALIDATION_RULES.URL.test(url)
}

export const validatePassword = (password: string): boolean => {
  if (!password) return false
  return VALIDATION_RULES.PASSWORD.test(password)
}

export const validateUsername = (username: string): boolean => {
  if (!username) return false
  return VALIDATION_RULES.USERNAME.test(username)
}

export const validateAmount = (amount: any): boolean => {
  if (isNullish(amount)) return false
  const num = isNumber(amount) ? amount : parseNumber(amount.toString())
  return isNumber(num) && num >= 0
}

export const validateRequired = (value: any): boolean => {
  if (isNullish(value)) return false
  if (isString(value)) return value.trim().length > 0
  if (isArray(value)) return value.length > 0
  if (isObject(value)) return Object.keys(value).length > 0
  return true
}

export const validateMinLength = (value: string, minLength: number): boolean => {
  if (!isString(value)) return false
  return value.length >= minLength
}

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  if (!isString(value)) return false
  return value.length <= maxLength
}

export const validateRange = (value: number, min: number, max: number): boolean => {
  if (!isNumber(value)) return false
  return value >= min && value <= max
}

export const validateFileSize = (file: File, maxSize: number = APP_CONFIG.MAX_FILE_SIZE): boolean => {
  if (!file) return false
  return file.size <= maxSize
}

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  if (!file) return false
  return allowedTypes.includes(file.type)
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array))
}

export const uniqueBy = <T>(array: T[], key: keyof T): T[] => {
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const value = String(item[key])
    if (!groups[value]) groups[value] = []
    groups[value].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export const flatten = <T>(array: T[][]): T[] => {
  return array.reduce((flat, item) => flat.concat(item), [])
}

export const deepFlatten = <T>(array: any[]): T[] => {
  return array.reduce((flat, item) => {
    return flat.concat(Array.isArray(item) ? deepFlatten(item) : item)
  }, [])
}

export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export const sample = <T>(array: T[], count = 1): T[] => {
  const shuffled = shuffle(array)
  return shuffled.slice(0, count)
}

export const intersection = <T>(array1: T[], array2: T[]): T[] => {
  return array1.filter(item => array2.includes(item))
}

export const difference = <T>(array1: T[], array2: T[]): T[] => {
  return array1.filter(item => !array2.includes(item))
}

export const union = <T>(array1: T[], array2: T[]): T[] => {
  return unique([...array1, ...array2])
}

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as any
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any
  if (typeof obj === 'object') {
    const cloned = {} as any
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  return obj
}

export const deepMerge = <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
  const result = { ...target }
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key]
      const targetValue = result[key]
      
      if (isObject(sourceValue) && isObject(targetValue)) {
        result[key] = deepMerge(targetValue as any, sourceValue as any)
      } else {
        result[key] = sourceValue as any
      }
    }
  }
  
  return result
}

export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj }
  keys.forEach(key => {
    delete result[key]
  })
  return result
}

export const isEmpty = (obj: any): boolean => {
  if (isNullish(obj)) return true
  if (isArray(obj)) return obj.length === 0
  if (isObject(obj)) return Object.keys(obj).length === 0
  if (isString(obj)) return obj.trim().length === 0
  return false
}

export const has = (obj: any, path: string): boolean => {
  if (!isObject(obj)) return false
  
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (!isObject(current) || !(key in current)) return false
    current = current[key]
  }
  
  return true
}

export const get = (obj: any, path: string, defaultValue?: any): any => {
  if (!isObject(obj)) return defaultValue
  
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (!isObject(current) || !(key in current)) return defaultValue
    current = current[key]
  }
  
  return current
}

export const set = (obj: any, path: string, value: any): any => {
  if (!isObject(obj)) return obj
  
  const keys = path.split('.')
  const lastKey = keys.pop()!
  let current = obj
  
  for (const key of keys) {
    if (!isObject(current[key])) {
      current[key] = {}
    }
    current = current[key]
  }
  
  current[lastKey] = value
  return obj
}

// ============================================================================
// FUNCTION UTILITIES
// ============================================================================

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export const once = <T extends (...args: any[]) => any>(func: T): T => {
  let called = false
  let result: ReturnType<T>
  
  return ((...args: Parameters<T>) => {
    if (!called) {
      called = true
      result = func(...args)
    }
    return result
  }) as T
}

export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>()
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }
    
    const result = func(...args)
    cache.set(key, result)
    return result
  }) as T
}

export const retry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
      return retry(fn, retries - 1, delay)
    }
    throw error
  }
}

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch {
      return defaultValue || null
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to remove from localStorage:', error)
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  },
  
  exists: (key: string): boolean => {
    return localStorage.getItem(key) !== null
  },
  
  keys: (): string[] => {
    return Object.keys(localStorage)
  },
}

export const sessionStorage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = window.sessionStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch {
      return defaultValue || null
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save to sessionStorage:', error)
    }
  },
  
  remove: (key: string): void => {
    try {
      window.sessionStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to remove from sessionStorage:', error)
    }
  },
  
  clear: (): void => {
    try {
      window.sessionStorage.clear()
    } catch (error) {
      console.error('Failed to clear sessionStorage:', error)
    }
  },
  
  exists: (key: string): boolean => {
    return window.sessionStorage.getItem(key) !== null
  },
  
  keys: (): string[] => {
    return Object.keys(window.sessionStorage)
  },
}

// ============================================================================
// URL UTILITIES
// ============================================================================

export const buildURL = (base: string, params: Record<string, any>): string => {
  const url = new URL(base)
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  })
  
  return url.toString()
}

export const parseURL = (url: string): Record<string, string> => {
  const urlObj = new URL(url)
  const params: Record<string, string> = {}
  
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value
  })
  
  return params
}

export const isValidURL = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// ============================================================================
// ERROR UTILITIES
// ============================================================================

export const createError = (message: string, code?: string, details?: any): Error => {
  const error = new Error(message)
  if (code) (error as any).code = code
  if (details) (error as any).details = details
  return error
}

export const isError = (value: any): value is Error => {
  return value instanceof Error
}

export const getErrorMessage = (error: any): string => {
  if (isError(error)) return error.message
  if (isString(error)) return error
  if (isObject(error) && error.message) return error.message
  return 'An unknown error occurred'
}

export const getErrorCode = (error: any): string | undefined => {
  if (isObject(error) && error.code) return error.code
  return undefined
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

export const measureTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> => {
  const start = performance.now()
  const result = await fn()
  const time = performance.now() - start
  return { result, time }
}

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const timeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), ms)
    )
  ])
}

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

// All utilities are already exported above