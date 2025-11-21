// ============================================================================
// REF HOOKS - SINGLE SOURCE OF TRUTH
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'

export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined)
  
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
