import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import { debounce, throttle } from '@/utils'
import { performanceMonitor } from '../services/performanceMonitor'

// Performance optimization hooks

// Debounced callback hook
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T => {
  const debouncedCallback = useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  )

  useEffect(() => {
    return () => {
      (debouncedCallback as any).cancel?.()
    }
  }, [debouncedCallback])

  return debouncedCallback as T
}

// Throttled callback hook
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 1000
): T => {
  const throttledCallback = useMemo(
    () => throttle(callback, delay),
    [callback, delay]
  )

  useEffect(() => {
    return () => {
      (throttledCallback as any).cancel?.()
    }
  }, [throttledCallback])

  return throttledCallback as T
}

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [hasIntersected, options])

  return { ref, isIntersecting, hasIntersected }
}

// Resize Observer hook
export const useResizeObserver = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDimensions({ width, height })
      }
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.unobserve(element)
    }
  }, [])

  return { ref, dimensions }
}

// Performance measurement hook
export const usePerformanceMeasure = (name: string) => {
  const startTime = useRef<number>()
  const [duration, setDuration] = useState<number>(0)

  const start = useCallback(() => {
    startTime.current = performance.now()
  }, [])

  const end = useCallback(() => {
    if (startTime.current) {
      const endTime = performance.now()
      const measuredDuration = endTime - startTime.current
      setDuration(measuredDuration)
      performanceMonitor.markCustomMetric(name, measuredDuration)
    }
  }, [name])

  const measure = useCallback(<T>(fn: () => T): T => {
    return performanceMonitor.measureCustomFunction(name, fn)
  }, [name])

  const measureAsync = useCallback(<T>(fn: () => Promise<T>): Promise<T> => {
    return performanceMonitor.measureAsyncFunction(name, fn)
  }, [name])

  return {
    start,
    end,
    measure,
    measureAsync,
    duration,
  }
}

// Memory usage hook
export const useMemoryUsage = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number
    total: number
    limit: number
  } | null>(null)

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMemoryInfo({
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        })
      }
    }

    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, 5000)

    return () => clearInterval(interval)
  }, [])

  return memoryInfo
}

// Network information hook
export const useNetworkInfo = () => {
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType: string
    downlink: number
    rtt: number
    saveData: boolean
  } | null>(null)

  useEffect(() => {
    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        setNetworkInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        })
      }
    }

    updateNetworkInfo()
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection.addEventListener('change', updateNetworkInfo)
      
      return () => {
        connection.removeEventListener('change', updateNetworkInfo)
      }
    }
  }, [])

  return networkInfo
}

// Virtual scrolling hook
export const useVirtualScrolling = (
  items: any[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleItems = Math.ceil(containerHeight / itemHeight) + overscan
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - Math.floor(overscan / 2))
  const endIndex = Math.min(items.length, startIndex + visibleItems)

  const visibleItemsData = items.slice(startIndex, endIndex).map((item, index) => ({
    ...item,
    index: startIndex + index,
    top: (startIndex + index) * itemHeight,
  }))

  const totalHeight = items.length * itemHeight

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement
    setScrollTop(target.scrollTop)
  }, [])

  return {
    visibleItems: visibleItemsData,
    totalHeight,
    handleScroll,
    scrollTop,
  }
}

// Infinite scrolling hook
export const useInfiniteScroll = (
  loadMore: () => Promise<void>,
  hasMore: boolean,
  threshold: number = 100
) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadMoreDebounced = useDebouncedCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    setError(null)

    try {
      await loadMore()
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, 300)

  const { ref } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: `${threshold}px`,
  })

  useEffect(() => {
    if (hasMore && !isLoading) {
      loadMoreDebounced()
    }
  }, [hasMore, isLoading, loadMoreDebounced])

  return {
    ref,
    isLoading,
    error,
    loadMore: loadMoreDebounced,
  }
}

// Optimized state hook
export const useOptimizedState = <T>(initialState: T) => {
  const [state, setState] = useState(initialState)
  const stateRef = useRef(state)

  const setOptimizedState = useCallback((newState: T | ((prev: T) => T)) => {
    const nextState = typeof newState === 'function' 
      ? (newState as (prev: T) => T)(stateRef.current)
      : newState

    if (nextState !== stateRef.current) {
      stateRef.current = nextState
      setState(nextState)
    }
  }, [])

  return [state, setOptimizedState] as const
}

// Batch updates hook
export const useBatchUpdates = () => {
  const updatesRef = useRef<(() => void)[]>([])
  const timeoutRef = useRef<NodeJS.Timeout>()

  const batchUpdate = useCallback((update: () => void) => {
    updatesRef.current.push(update)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      const updates = updatesRef.current
      updatesRef.current = [] as any

      // Batch all updates
      (React as any).unstable_batchedUpdates(() => {
        updates.forEach(update => update())
      })
    }, 0)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return batchUpdate
}

// Resource preloading hook
export const useResourcePreload = () => {
  const preloadedResources = useRef<Set<string>>(new Set())

  const preloadResource = useCallback((url: string, type: 'image' | 'script' | 'style' = 'image') => {
    if (preloadedResources.current.has(url)) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    
    switch (type) {
      case 'image':
        link.as = 'image'
        break
      case 'script':
        link.as = 'script'
        break
      case 'style':
        link.as = 'style'
        break
    }

    document.head.appendChild(link)
    preloadedResources.current.add(url)

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }
      preloadedResources.current.delete(url)
    }
  }, [])

  const preloadImage = useCallback((url: string) => {
    return preloadResource(url, 'image')
  }, [preloadResource])

  const preloadScript = useCallback((url: string) => {
    return preloadResource(url, 'script')
  }, [preloadResource])

  const preloadStyle = useCallback((url: string) => {
    return preloadResource(url, 'style')
  }, [preloadResource])

  return {
    preloadResource,
    preloadImage,
    preloadScript,
    preloadStyle,
  }
}

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<Record<string, number>>({})

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics() as any)
    }

    const interval = setInterval(updateMetrics, 1000)
    return () => clearInterval(interval)
  }, [])

  const markMetric = useCallback((name: string, value: number) => {
    performanceMonitor.markCustomMetric(name, value)
  }, [])

  const measureFunction = useCallback(<T>(name: string, fn: () => T): T => {
    return performanceMonitor.measureCustomFunction(name, fn)
  }, [])

  const measureAsyncFunction = useCallback(<T>(name: string, fn: () => Promise<T>): Promise<T> => {
    return performanceMonitor.measureAsyncFunction(name, fn)
  }, [])

  return {
    metrics,
    markMetric,
    measureFunction,
    measureAsyncFunction,
    getPerformanceScore: () => performanceMonitor.getPerformanceScore(),
  }
}

const PerformanceHooks = {
  useDebouncedCallback,
  useThrottledCallback,
  useIntersectionObserver,
  useResizeObserver,
  usePerformanceMeasure,
  useMemoryUsage,
  useNetworkInfo,
  useVirtualScrolling,
  useInfiniteScroll,
  useOptimizedState,
  useBatchUpdates,
  useResourcePreload,
  usePerformanceMonitoring,
}

export default PerformanceHooks

