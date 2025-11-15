// ============================================================================
// CENTRALIZED HOOKS - SINGLE SOURCE OF TRUTH
// ============================================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import { storage, sessionStorage } from '../utils'

// ============================================================================
// STATE MANAGEMENT HOOKS
// ============================================================================

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = storage.get<T>(key)
      return item !== null ? item : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      storage.set(key, valueToStore)
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      storage.remove(key)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}

export const useSessionStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = sessionStorage.get<T>(key)
      return item !== null ? item : initialValue
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      sessionStorage.set(key, valueToStore)
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      sessionStorage.remove(key)
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}

export const useToggle = (initialValue: boolean = false) => {
  const [value, setValue] = useState(initialValue)
  
  const toggle = useCallback(() => setValue(v => !v), [])
  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])
  
  return [value, { toggle, setTrue, setFalse }] as const
}

export const useCounter = (initialValue: number = 0) => {
  const [count, setCount] = useState(initialValue)
  
  const increment = useCallback(() => setCount(c => c + 1), [])
  const decrement = useCallback(() => setCount(c => c - 1), [])
  const reset = useCallback(() => setCount(initialValue), [initialValue])
  const setValue = useCallback((value: number) => setCount(value), [])
  
  return [count, { increment, decrement, reset, setValue }] as const
}

export const useArray = <T>(initialValue: T[] = []) => {
  const [array, setArray] = useState<T[]>(initialValue)
  
  const push = useCallback((item: T) => setArray(arr => [...arr, item]), [])
  const pop = useCallback(() => setArray(arr => arr.slice(0, -1)), [])
  const shift = useCallback(() => setArray(arr => arr.slice(1)), [])
  const unshift = useCallback((item: T) => setArray(arr => [item, ...arr]), [])
  const insert = useCallback((index: number, item: T) => 
    setArray(arr => [...arr.slice(0, index), item, ...arr.slice(index)]), [])
  const remove = useCallback((index: number) => 
    setArray(arr => [...arr.slice(0, index), ...arr.slice(index + 1)]), [])
  const update = useCallback((index: number, item: T) => 
    setArray(arr => arr.map((val, i) => i === index ? item : val)), [])
  const clear = useCallback(() => setArray([]), [])
  const reset = useCallback(() => setArray(initialValue), [initialValue])
  
  return [array, { push, pop, shift, unshift, insert, remove, update, clear, reset }] as const
}

export const useObject = <T extends Record<string, any>>(initialValue: T) => {
  const [object, setObject] = useState<T>(initialValue)
  
  const setValue = useCallback((key: keyof T, value: T[keyof T]) => 
    setObject(obj => ({ ...obj, [key]: value })), [])
  const setValues = useCallback((values: Partial<T>) => 
    setObject(obj => ({ ...obj, ...values })), [])
  const removeKey = useCallback((key: keyof T) => 
    setObject(obj => {
      const { [key]: removed, ...rest } = obj
      return rest as T
    }), [])
  const reset = useCallback(() => setObject(initialValue), [initialValue])
  
  return [object, { setValue, setValues, removeKey, reset }] as const
}

// ============================================================================
// EFFECT HOOKS
// ============================================================================

export const useMount = (callback: () => void) => {
  useEffect(() => {
    callback()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

export const useUnmount = (callback: () => void) => {
  useEffect(() => {
    return callback
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

export const useUpdateEffect = (callback: () => void, deps: React.DependencyList) => {
  const isFirstRender = useRef(true)
  
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    callback()
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
}

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

export const useThrottle = <T>(value: T, delay: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastExecuted = useRef<number>(Date.now())
  
  useEffect(() => {
    if (Date.now() >= lastExecuted.current + delay) {
      lastExecuted.current = Date.now()
      setThrottledValue(value)
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now()
        setThrottledValue(value)
      }, delay)
      
      return () => clearTimeout(timer)
    }
  }, [value, delay])
  
  return throttledValue
}

export const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback)
  
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])
  
  useEffect(() => {
    if (delay === null) return
    
    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

export const useTimeout = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback)
  
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])
  
  useEffect(() => {
    if (delay === null) return
    
    const id = setTimeout(() => savedCallback.current(), delay)
    return () => clearTimeout(id)
  }, [delay])
}

// ============================================================================
// REF HOOKS
// ============================================================================

export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>()
  
  useEffect(() => {
    ref.current = value
  })
  
  return ref.current
}

export const useIsFirstRender = (): boolean => {
  const isFirst = useRef(true)
  
  if (isFirst.current) {
    isFirst.current = false
    return true
  }
  
  return false
}

export const useIsMounted = (): boolean => {
  const isMounted = useRef(true)
  
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])
  
  return isMounted.current
}

export const useClickOutside = <T extends HTMLElement>(
  callback: () => void
): React.RefObject<T> => {
  const ref = useRef<T>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [callback])
  
  return ref
}

export const useFocus = (): [React.RefObject<HTMLElement>, () => void] => {
  const ref = useRef<HTMLElement>(null)
  
  const focus = useCallback(() => {
    ref.current?.focus()
  }, [])
  
  return [ref, focus]
}

export const useHover = (): [React.RefObject<HTMLElement>, boolean] => {
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef<HTMLElement>(null)
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const handleMouseEnter = () => setIsHovered(true)
    const handleMouseLeave = () => setIsHovered(false)
    
    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])
  
  return [ref, isHovered]
}

// ============================================================================
// ASYNC HOOKS
// ============================================================================

export const useAsync = <T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
) => {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<E | null>(null)
  
  const execute = useCallback(async () => {
    setStatus('pending')
    setData(null)
    setError(null)
    
    try {
      const result = await asyncFunction()
      setData(result)
      setStatus('success')
    } catch (err) {
      setError(err as E)
      setStatus('error')
    }
  }, [asyncFunction])
  
  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])
  
  return { execute, status, data, error }
}

export const useFetch = <T>(
  url: string,
  options?: RequestInit
) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [url, options])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return { data, loading, error, refetch: fetchData }
}

export const useMutation = <T, V = any>(
  mutationFn: (variables: V) => Promise<T>
) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const mutate = useCallback(async (variables: V) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await mutationFn(variables)
      setData(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [mutationFn])
  
  return { mutate, data, loading, error }
}

// ============================================================================
// FORM HOOKS
// ============================================================================

export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: (values: T) => Record<string, string>
) => {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const setValue = useCallback((name: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name as string]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name as string]
        return newErrors
      })
    }
  }, [errors])
  
  const setFieldTouched = useCallback((name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }))
  }, [])
  
  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])
  
  const validate = useCallback(() => {
    if (!validationSchema) return true
    
    const newErrors = validationSchema(values)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values, validationSchema])
  
  const handleSubmit = useCallback(async (
    onSubmit: (values: T) => Promise<void> | void
  ) => {
    setIsSubmitting(true)
    
    try {
      if (validate()) {
        await onSubmit(values)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate])
  
  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])
  
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0
  }, [errors])
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setFieldTouched,
    setFieldError,
    validate,
    handleSubmit,
    reset
  }
}

// ============================================================================
// ROUTER HOOKS
// ============================================================================

export const useQuery = () => {
  const router = useRouter()
  return router.query
}

export const usePathname = () => {
  const router = useRouter()
  return router.pathname
}

export const useRouterPush = () => {
  const router = useRouter()
  return router.push
}

export const useRouterReplace = () => {
  const router = useRouter()
  return router.replace
}

export const useRouterBack = () => {
  const router = useRouter()
  return router.back
}

// ============================================================================
// WINDOW HOOKS
// ============================================================================

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return windowSize
}

export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState({
    x: typeof window !== 'undefined' ? window.pageXOffset : 0,
    y: typeof window !== 'undefined' ? window.pageYOffset : 0
  })
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition({
        x: window.pageXOffset,
        y: window.pageYOffset
      })
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return scrollPosition
}

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return isOnline
}

export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }
    
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])
  
  return matches
}

export const useIsMobile = () => {
  return useMediaQuery('(max-width: 768px)')
}

export const useIsTablet = () => {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
}

export const useIsDesktop = () => {
  return useMediaQuery('(min-width: 1025px)')
}

// ============================================================================
// PERFORMANCE HOOKS
// ============================================================================

export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps)
}

export const useMemoizedValue = <T>(
  value: T,
  deps: React.DependencyList
): T => {
  return useMemo(() => value, deps)
}

export const useRenderCount = () => {
  const renderCount = useRef(0)
  renderCount.current += 1
  return renderCount.current
}

export const useWhyDidYouUpdate = (name: string, props: Record<string, any>) => {
  const previous = useRef<Record<string, any>>()
  
  useEffect(() => {
    if (previous.current) {
      const allKeys = Object.keys({ ...previous.current, ...props })
      const changedProps: Record<string, { from: any; to: any }> = {}
      
      allKeys.forEach(key => {
        if (previous.current![key] !== props[key]) {
          changedProps[key] = {
            from: previous.current![key],
            to: props[key]
          }
        }
      })
      
      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps)
      }
    }
    
    previous.current = props
  })
}

// ============================================================================
// EXPORT ALL HOOKS
// ============================================================================

export * from '../utils'
