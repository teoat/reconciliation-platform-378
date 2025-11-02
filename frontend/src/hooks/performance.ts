// ============================================================================
import { logger } from '@/services/logger'
// PERFORMANCE HOOKS - SINGLE SOURCE OF TRUTH
// ============================================================================

import { useCallback, useMemo, useRef, useEffect } from 'react'

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

export const useWhyDidYouUpdate = (name: string, props: Record<string, unknown>) => {
  const previous = useRef<Record<string, unknown>>()
  
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
        logger.log('[why-did-you-update]', name, changedProps)
      }
    }
    
    previous.current = props
  })
}
