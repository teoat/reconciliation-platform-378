// ============================================================================
// COMPREHENSIVE FRONTEND API INTEGRATION WITH TIER 2 ERROR HANDLING
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '../services/apiClient'
import { serviceIntegrationService } from '../services/serviceIntegrationService'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ApiIntegrationConfig {
  enableRetry: boolean
  maxRetries: number
  retryDelay: number
  enableOfflineMode: boolean
  enableCaching: boolean
  cacheTimeout: number
  enableRealTimeSync: boolean
  enableErrorReporting: boolean
  enablePerformanceMonitoring: boolean
}

export interface ApiError {
  code: string
  message: string
  statusCode?: number
  details?: any
  retryable: boolean
  timestamp: Date
}

export interface ApiResponse<T> {
  data?: T
  error?: ApiError
  loading: boolean
  retryCount: number
  lastUpdated?: Date
}

export interface ApiState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
  retryCount: number
  lastUpdated: Date | null
  offline: boolean
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const defaultConfig: ApiIntegrationConfig = {
  enableRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  enableOfflineMode: true,
  enableCaching: true,
  cacheTimeout: 300000, // 5 minutes
  enableRealTimeSync: true,
  enableErrorReporting: true,
  enablePerformanceMonitoring: true,
}

// ============================================================================
// API INTEGRATION HOOK
// ============================================================================

export function useApiIntegration<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    data?: any
    config?: Partial<ApiIntegrationConfig>
    dependencies?: any[]
    enabled?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: ApiError) => void
    onRetry?: (retryCount: number) => void
  } = {}
) {
  const {
    method = 'GET',
    data,
    config = {},
    dependencies = [],
    enabled = true,
    onSuccess,
    onError,
    onRetry,
  } = options

  const finalConfig = { ...defaultConfig, ...config }
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
    lastUpdated: null,
    offline: false,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ============================================================================
  // API CALL FUNCTION
  // ============================================================================

  const executeApiCall = useCallback(async (
    retryCount: number = 0,
    isRetry: boolean = false
  ): Promise<void> => {
    if (!enabled) return

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    // Set loading state
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      retryCount,
    }))

    try {
      const startTime = performance.now()

      // Make API call
      const response = await apiClient.makeRequest<T>(endpoint, {
        method,
        body: data ? JSON.stringify(data) : undefined,
        signal: abortControllerRef.current.signal,
        timeout: 30000, // 30 seconds timeout
      })

      const duration = performance.now() - startTime

      // Record performance metric
      if (finalConfig.enablePerformanceMonitoring) {
        serviceIntegrationService.recordPerformanceMetric('api_call_duration', duration, {
          endpoint,
          method,
          success: true,
        })
      }

      // Update state with success
      setState(prev => ({
        ...prev,
        data: response.data || null,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        offline: false,
      }))

      // Call success callback
      if (response.data && onSuccess) {
        onSuccess(response.data)
      }

    } catch (error: any) {
      const duration = performance.now() - startTime

      // Record performance metric
      if (finalConfig.enablePerformanceMonitoring) {
        serviceIntegrationService.recordPerformanceMetric('api_call_duration', duration, {
          endpoint,
          method,
          success: false,
          error: error.message,
        })
      }

      // Handle error with tier 2 error handling
      const apiError = await serviceIntegrationService.handleError(error, {
        component: 'ApiIntegration',
        action: `${method} ${endpoint}`,
        data: { endpoint, method, retryCount },
        retryable: finalConfig.enableRetry && retryCount < finalConfig.maxRetries,
        maxRetries: finalConfig.maxRetries,
      })

      // Check if request was aborted
      if (error.name === 'AbortError') {
        return
      }

      // Check if we should retry
      if (finalConfig.enableRetry && retryCount < finalConfig.maxRetries && apiError.retryable) {
        const delay = finalConfig.retryDelay * Math.pow(2, retryCount) // Exponential backoff
        
        // Call retry callback
        if (onRetry) {
          onRetry(retryCount + 1)
        }

        // Schedule retry
        retryTimeoutRef.current = setTimeout(() => {
          executeApiCall(retryCount + 1, true)
        }, delay)

        return
      }

      // Update state with error
      setState(prev => ({
        ...prev,
        loading: false,
        error: {
          code: apiError.code,
          message: apiError.message,
          statusCode: error.statusCode,
          details: apiError.context,
          retryable: apiError.retryable,
          timestamp: new Date(),
        },
        offline: !navigator.onLine,
      }))

      // Call error callback
      if (onError) {
        onError({
          code: apiError.code,
          message: apiError.message,
          statusCode: error.statusCode,
          details: apiError.context,
          retryable: apiError.retryable,
          timestamp: new Date(),
        })
      }
    }
  }, [endpoint, method, data, enabled, finalConfig, onSuccess, onError, onRetry])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initial load
  useEffect(() => {
    if (enabled) {
      executeApiCall()
    }

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [enabled, ...dependencies])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, offline: false }))
      if (enabled && state.error) {
        // Retry failed request when coming back online
        executeApiCall()
      }
    }

    const handleOffline = () => {
      setState(prev => ({ ...prev, offline: true }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [enabled, state.error, executeApiCall])

  // ============================================================================
  // MANUAL ACTIONS
  // ============================================================================

  const refetch = useCallback(() => {
    executeApiCall()
  }, [executeApiCall])

  const retry = useCallback(() => {
    if (state.error && state.error.retryable) {
      executeApiCall(state.retryCount + 1)
    }
  }, [state.error, state.retryCount, executeApiCall])

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
    setState(prev => ({ ...prev, loading: false }))
  }, [])

  return {
    ...state,
    refetch,
    retry,
    cancel,
  }
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

// GET request hook
export function useApiGet<T>(
  endpoint: string,
  options: {
    config?: Partial<ApiIntegrationConfig>
    dependencies?: any[]
    enabled?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: ApiError) => void
  } = {}
) {
  return useApiIntegration<T>(endpoint, {
    method: 'GET',
    ...options,
  })
}

// POST request hook
export function useApiPost<T>(
  endpoint: string,
  data: any,
  options: {
    config?: Partial<ApiIntegrationConfig>
    dependencies?: any[]
    enabled?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: ApiError) => void
  } = {}
) {
  return useApiIntegration<T>(endpoint, {
    method: 'POST',
    data,
    ...options,
  })
}

// PUT request hook
export function useApiPut<T>(
  endpoint: string,
  data: any,
  options: {
    config?: Partial<ApiIntegrationConfig>
    dependencies?: any[]
    enabled?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: ApiError) => void
  } = {}
) {
  return useApiIntegration<T>(endpoint, {
    method: 'PUT',
    data,
    ...options,
  })
}

// DELETE request hook
export function useApiDelete<T>(
  endpoint: string,
  options: {
    config?: Partial<ApiIntegrationConfig>
    dependencies?: any[]
    enabled?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: ApiError) => void
  } = {}
) {
  return useApiIntegration<T>(endpoint, {
    method: 'DELETE',
    ...options,
  })
}

// ============================================================================
// MUTATION HOOK FOR DATA MODIFICATION
// ============================================================================

export function useApiMutation<T, V = any>(
  endpoint: string,
  options: {
    method?: 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    config?: Partial<ApiIntegrationConfig>
    onSuccess?: (data: T) => void
    onError?: (error: ApiError) => void
    onMutate?: (variables: V) => void
  } = {}
) {
  const {
    method = 'POST',
    config = {},
    onSuccess,
    onError,
    onMutate,
  } = options

  const finalConfig = { ...defaultConfig, ...config }
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
    lastUpdated: null,
    offline: false,
  })

  const mutate = useCallback(async (variables: V) => {
    // Call mutate callback
    if (onMutate) {
      onMutate(variables)
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }))

    try {
      const startTime = performance.now()

      const response = await apiClient.makeRequest<T>(endpoint, {
        method,
        body: JSON.stringify(variables),
        timeout: 30000,
      })

      const duration = performance.now() - startTime

      // Record performance metric
      if (finalConfig.enablePerformanceMonitoring) {
        serviceIntegrationService.recordPerformanceMetric('api_mutation_duration', duration, {
          endpoint,
          method,
          success: true,
        })
      }

      setState(prev => ({
        ...prev,
        data: response.data || null,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      }))

      if (response.data && onSuccess) {
        onSuccess(response.data)
      }

      return response.data

    } catch (error: any) {
      const duration = performance.now() - startTime

      // Record performance metric
      if (finalConfig.enablePerformanceMonitoring) {
        serviceIntegrationService.recordPerformanceMetric('api_mutation_duration', duration, {
          endpoint,
          method,
          success: false,
          error: error.message,
        })
      }

      // Handle error with tier 2 error handling
      const apiError = await serviceIntegrationService.handleError(error, {
        component: 'ApiMutation',
        action: `${method} ${endpoint}`,
        data: { endpoint, method, variables },
        retryable: false, // Mutations are typically not retried automatically
      })

      setState(prev => ({
        ...prev,
        loading: false,
        error: {
          code: apiError.code,
          message: apiError.message,
          statusCode: error.statusCode,
          details: apiError.context,
          retryable: apiError.retryable,
          timestamp: new Date(),
        },
      }))

      if (onError) {
        onError({
          code: apiError.code,
          message: apiError.message,
          statusCode: error.statusCode,
          details: apiError.context,
          retryable: apiError.retryable,
          timestamp: new Date(),
        })
      }

      throw error
    }
  }, [endpoint, method, finalConfig, onSuccess, onError, onMutate])

  return {
    ...state,
    mutate,
  }
}

// ============================================================================
// REAL-TIME SYNC HOOK
// ============================================================================

export function useRealTimeSync<T>(
  endpoint: string,
  options: {
    interval?: number
    config?: Partial<ApiIntegrationConfig>
    onData?: (data: T) => void
    onError?: (error: ApiError) => void
  } = {}
) {
  const {
    interval = 30000, // 30 seconds
    config = {},
    onData,
    onError,
  } = options

  const finalConfig = { ...defaultConfig, ...config }
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
    lastUpdated: null,
    offline: false,
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const sync = useCallback(async () => {
    if (!finalConfig.enableRealTimeSync) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await apiClient.makeRequest<T>(endpoint, {
        method: 'GET',
        timeout: 10000,
      })

      setState(prev => ({
        ...prev,
        data: response.data || null,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      }))

      if (response.data && onData) {
        onData(response.data)
      }

    } catch (error: any) {
      const apiError = await serviceIntegrationService.handleError(error, {
        component: 'RealTimeSync',
        action: `GET ${endpoint}`,
        data: { endpoint },
        retryable: true,
      })

      setState(prev => ({
        ...prev,
        loading: false,
        error: {
          code: apiError.code,
          message: apiError.message,
          statusCode: error.statusCode,
          details: apiError.context,
          retryable: apiError.retryable,
          timestamp: new Date(),
        },
      }))

      if (onError) {
        onError({
          code: apiError.code,
          message: apiError.message,
          statusCode: error.statusCode,
          details: apiError.context,
          retryable: apiError.retryable,
          timestamp: new Date(),
        })
      }
    }
  }, [endpoint, finalConfig, onData, onError])

  useEffect(() => {
    if (finalConfig.enableRealTimeSync) {
      // Initial sync
      sync()

      // Set up interval
      intervalRef.current = setInterval(sync, interval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [sync, interval, finalConfig.enableRealTimeSync])

  return {
    ...state,
    sync,
  }
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: any
}

export class ApiErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>
    onError?: (error: Error, errorInfo: any) => void
  }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Report error to service integration
    serviceIntegrationService.handleError(error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      data: { errorInfo },
    })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error}
          retry={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      )
    }

    return this.props.children
  }
}

const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
    <div className="text-red-600 text-lg font-semibold mb-2">Something went wrong</div>
    <div className="text-red-500 text-sm mb-4">{error.message}</div>
    <button
      onClick={retry}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Try Again
    </button>
  </div>
)

// ============================================================================
// EXPORT ALL HOOKS AND COMPONENTS
// ============================================================================

export default {
  useApiIntegration,
  useApiGet,
  useApiPost,
  useApiPut,
  useApiDelete,
  useApiMutation,
  useRealTimeSync,
  ApiErrorBoundary,
  defaultConfig,
}
