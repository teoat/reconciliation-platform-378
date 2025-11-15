// ============================================================================
// WINDOW HOOKS - SINGLE SOURCE OF TRUTH
// ============================================================================

import { useState, useEffect } from 'react'

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
