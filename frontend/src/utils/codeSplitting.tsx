// ============================================================================
// CODE SPLITTING UTILITIES - SINGLE SOURCE OF TRUTH
// ============================================================================

import React, { Suspense, lazy, ComponentType } from 'react'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface CodeSplittingConfig {
  enabled: boolean
  chunkSize: number
  maxChunks: number
  minChunkSize: number
  preloadOnHover: boolean
  preloadOnFocus: boolean
  retryAttempts: number
  retryDelay: number
}

export interface LazyComponentProps {
  fallback?: React.ReactNode
  onError?: (error: Error) => void
  retryAttempts?: number
  retryDelay?: number
}

// ============================================================================
// CODE SPLITTING CONFIGURATION
// ============================================================================

export const defaultCodeSplittingConfig: CodeSplittingConfig = {
  enabled: true,
  chunkSize: 200000, // 200KB
  maxChunks: 15,
  minChunkSize: 30000, // 30KB
  preloadOnHover: true,
  preloadOnFocus: true,
  retryAttempts: 3,
  retryDelay: 1000,
}

// ============================================================================
// CODE SPLITTING UTILITIES
// ============================================================================

// Create lazy component with retry logic
export const createLazyComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  config: Partial<CodeSplittingConfig> = {}
): React.LazyExoticComponent<T> => {
  const finalConfig = { ...defaultCodeSplittingConfig, ...config }
  
  return lazy(() => retryImport(importFunc, finalConfig.retryAttempts, finalConfig.retryDelay))
}

// Retry import with exponential backoff
const retryImport = async (
  importFunc: () => Promise<any>,
  attempts: number,
  delay: number
): Promise<any> => {
  try {
    return await importFunc()
  } catch (error) {
    if (attempts > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
      return retryImport(importFunc, attempts - 1, delay * 2)
    }
    throw error
  }
}

// Preload component
export const preloadComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): Promise<{ default: T }> => {
  return importFunc()
}

// Preload component on hover
export const preloadOnHover = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  let hasPreloaded = false
  
  return () => {
    if (!hasPreloaded) {
      hasPreloaded = true
      preloadComponent(importFunc)
    }
  }
}

// Preload component on focus
export const preloadOnFocus = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  let hasPreloaded = false
  
  return () => {
    if (!hasPreloaded) {
      hasPreloaded = true
      preloadComponent(importFunc)
    }
  }
}

// ============================================================================
// LAZY COMPONENT WRAPPER
// ============================================================================

export const LazyComponent: React.FC<LazyComponentProps & { children: React.ReactNode }> = ({
  children,
  fallback,
  onError,
  retryAttempts = 3,
  retryDelay = 1000,
}) => {
  const [error, setError] = React.useState<Error | null>(null)
  const [retryCount, setRetryCount] = React.useState(0)

  const handleError = React.useCallback((error: Error) => {
    setError(error)
    onError?.(error)
  }, [onError])

  const handleRetry = React.useCallback(() => {
    setError(null)
    setRetryCount(prev => prev + 1)
  }, [])

  if (error && retryCount < retryAttempts) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <p className="text-red-600 mb-2">Failed to load component</p>
        <button
          onClick={handleRetry}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry ({retryCount + 1}/{retryAttempts})
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4">
        <p className="text-red-600">Failed to load component after {retryAttempts} attempts</p>
      </div>
    )
  }

  return (
    <Suspense fallback={fallback || <div className="animate-pulse bg-gray-200 rounded h-32" />}>
      {children}
    </Suspense>
  )
}

// ============================================================================
// ROUTE-BASED CODE SPLITTING
// ============================================================================

export const createRouteComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  config: Partial<CodeSplittingConfig> = {}
) => {
  const LazyComponent = createLazyComponent(importFunc, config)
  
  return (props: any) => (
    <LazyComponent
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading page...</p>
          </div>
        </div>
      }
      {...props}
    />
  )
}

// ============================================================================
// FEATURE-BASED CODE SPLITTING
// ============================================================================

export const createFeatureComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  config: Partial<CodeSplittingConfig> = {}
) => {
  const LazyComponent = createLazyComponent(importFunc, config)
  
  return (props: any) => (
    <LazyComponent
      fallback={
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading feature...</p>
          </div>
        </div>
      }
      {...props}
    />
  )
}

// ============================================================================
// CONDITIONAL CODE SPLITTING
// ============================================================================

export const createConditionalComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  condition: boolean,
  config: Partial<CodeSplittingConfig> = {}
) => {
  const LazyComponent = createLazyComponent(importFunc, config)
  
  return (props: any) => {
    if (!condition) {
      return null
    }
    
    return (
      <LazyComponent
        fallback={
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        }
        {...props}
      />
    )
  }
}

// ============================================================================
// BUNDLE ANALYSIS UTILITIES
// ============================================================================

export const analyzeBundleSize = async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      // Dynamic import to avoid bundling in production
      const { BundleAnalyzerPlugin } = await import('webpack-bundle-analyzer')
      return BundleAnalyzerPlugin
    } catch (error) {
      console.warn('Bundle analyzer not available:', error)
      return null
    }
  }
  return null
}

export const getChunkSize = (chunk: any): number => {
  return chunk.size || 0
}

export const getChunkName = (chunk: any): string => {
  return chunk.name || 'unknown'
}

export const getChunkModules = (chunk: any): any[] => {
  return chunk.modules || []
}

// ============================================================================
// EXPORT ALL CODE SPLITTING UTILITIES
// ============================================================================

export default {
  createLazyComponent,
  preloadComponent,
  preloadOnHover,
  preloadOnFocus,
  LazyComponent,
  createRouteComponent,
  createFeatureComponent,
  createConditionalComponent,
  analyzeBundleSize,
  getChunkSize,
  getChunkName,
  getChunkModules,
  defaultCodeSplittingConfig,
}
