// ============================================================================
// FONT OPTIMIZATION UTILITIES - SINGLE SOURCE OF TRUTH
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface FontOptimizationConfig {
  preload: boolean
  display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
  fallback: string[]
  subset: boolean
  unicodeRange: string
  weight: number[]
  style: 'normal' | 'italic'
  variable: boolean
}

export interface FontOptimizationProps {
  family: string
  src: string
  config?: Partial<FontOptimizationConfig>
  onLoad?: () => void
  onError?: () => void
  children?: React.ReactNode
}

export interface FontOptimizationState {
  loaded: boolean
  error: boolean
  fallback: boolean
}

// ============================================================================
// FONT OPTIMIZATION CONFIGURATION
// ============================================================================

export const defaultFontConfig: FontOptimizationConfig = {
  preload: true,
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  subset: true,
  unicodeRange: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  weight: [400, 500, 600, 700],
  style: 'normal',
  variable: false,
}

// ============================================================================
// FONT OPTIMIZATION UTILITIES
// ============================================================================

// Generate optimized font URL
export const generateOptimizedFontUrl = (
  src: string,
  config: Partial<FontOptimizationConfig> = {}
): string => {
  const finalConfig = { ...defaultFontConfig, ...config }
  
  // If it's a data URL or external URL, return as is
  if (src.startsWith('data:') || src.startsWith('http')) {
    return src
  }

  // Generate optimized URL with parameters
  const url = new URL(src, window.location.origin)
  
  if (finalConfig.subset) {
    url.searchParams.set('subset', 'true')
  }
  
  if (finalConfig.unicodeRange) {
    url.searchParams.set('unicodeRange', finalConfig.unicodeRange)
  }
  
  if (finalConfig.weight.length > 0) {
    url.searchParams.set('weight', finalConfig.weight.join(','))
  }
  
  if (finalConfig.style !== 'normal') {
    url.searchParams.set('style', finalConfig.style)
  }

  return url.toString()
}

// Preload font
export const preloadFont = (src: string, family: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.href = src
    link.crossOrigin = 'anonymous'
    
    link.onload = () => resolve()
    link.onerror = reject
    
    document.head.appendChild(link)
  })
}

// Load font dynamically
export const loadFont = (src: string, family: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = src
    
    link.onload = () => resolve()
    link.onerror = reject
    
    document.head.appendChild(link)
  })
}

// Check if font is loaded
export const isFontLoaded = (family: string): boolean => {
  try {
    return document.fonts.check(`16px "${family}"`)
  } catch (error) {
    return false
  }
}

// Wait for font to load
export const waitForFont = (family: string, timeout: number = 3000): Promise<boolean> => {
  return new Promise((resolve) => {
    const startTime = Date.now()
    
    const checkFont = () => {
      if (isFontLoaded(family)) {
        resolve(true)
        return
      }
      
      if (Date.now() - startTime > timeout) {
        resolve(false)
        return
      }
      
      requestAnimationFrame(checkFont)
    }
    
    checkFont()
  })
}

// Generate font CSS
export const generateFontCSS = (
  family: string,
  src: string,
  config: Partial<FontOptimizationConfig> = {}
): string => {
  const finalConfig = { ...defaultFontConfig, ...config }
  
  let css = `@font-face {\n`
  css += `  font-family: "${family}";\n`
  css += `  src: url("${src}") format("woff2");\n`
  css += `  font-display: ${finalConfig.display};\n`
  
  if (finalConfig.weight.length > 0) {
    css += `  font-weight: ${finalConfig.weight.join(' ')};\n`
  }
  
  if (finalConfig.style !== 'normal') {
    css += `  font-style: ${finalConfig.style};\n`
  }
  
  if (finalConfig.unicodeRange) {
    css += `  unicode-range: ${finalConfig.unicodeRange};\n`
  }
  
  css += `}\n`
  
  return css
}

// ============================================================================
// FONT OPTIMIZATION HOOK
// ============================================================================

export const useFontOptimization = (
  family: string,
  src: string,
  config: Partial<FontOptimizationConfig> = {}
) => {
  const [state, setState] = useState<FontOptimizationState>({
    loaded: false,
    error: false,
    fallback: false,
  })

  const finalConfig = { ...defaultFontConfig, ...config }

  // Load font
  useEffect(() => {
    const loadFontAsync = async () => {
      try {
        // Preload font if enabled
        if (finalConfig.preload) {
          await preloadFont(src, family)
        }
        
        // Load font
        await loadFont(src, family)
        
        // Wait for font to be available
        const loaded = await waitForFont(family, 5000)
        
        if (loaded) {
          setState(prev => ({ ...prev, loaded: true, error: false }))
        } else {
          setState(prev => ({ ...prev, fallback: true, error: false }))
        }
      } catch (error) {
        console.warn(`Failed to load font ${family}:`, error)
        setState(prev => ({ ...prev, error: true, fallback: true }))
      }
    }

    loadFontAsync()
  }, [family, src, finalConfig.preload])

  return state
}

// ============================================================================
// FONT OPTIMIZATION COMPONENT
// ============================================================================

export const OptimizedFont: React.FC<FontOptimizationProps> = ({
  family,
  src,
  config = {},
  onLoad,
  onError,
  children,
}) => {
  const { loaded, error, fallback } = useFontOptimization(family, src, config)

  // Handle load callback
  useEffect(() => {
    if (loaded) {
      onLoad?.()
    }
  }, [loaded, onLoad])

  // Handle error callback
  useEffect(() => {
    if (error) {
      onError?.()
    }
  }, [error, onError])

  // Generate font CSS
  const fontCSS = generateFontCSS(family, src, config)

  return (
    <>
      <style>{fontCSS}</style>
      <div
        style={{
          fontFamily: fallback 
            ? `${family}, ${config.fallback?.join(', ') || defaultFontConfig.fallback.join(', ')}`
            : family,
          fontDisplay: config.display || defaultFontConfig.display,
        }}
      >
        {children}
      </div>
    </>
  )
}

// ============================================================================
// FONT PRELOADER COMPONENT
// ============================================================================

export interface FontPreloaderProps {
  fonts: Array<{
    family: string
    src: string
    config?: Partial<FontOptimizationConfig>
  }>
  onAllLoaded?: () => void
  onError?: (family: string, error: Error) => void
}

export const FontPreloader: React.FC<FontPreloaderProps> = ({
  fonts,
  onAllLoaded,
  onError,
}) => {
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set())
  const [errorFonts, setErrorFonts] = useState<Set<string>>(new Set())

  // Load all fonts
  useEffect(() => {
    const loadAllFonts = async () => {
      const promises = fonts.map(async (font) => {
        try {
          const config = { ...defaultFontConfig, ...font.config }
          
          if (config.preload) {
            await preloadFont(font.src, font.family)
          }
          
          await loadFont(font.src, font.family)
          const loaded = await waitForFont(font.family, 5000)
          
          if (loaded) {
            setLoadedFonts(prev => new Set([...prev, font.family]))
          } else {
            setErrorFonts(prev => new Set([...prev, font.family]))
            onError?.(font.family, new Error('Font load timeout'))
          }
        } catch (error) {
          setErrorFonts(prev => new Set([...prev, font.family]))
          onError?.(font.family, error as Error)
        }
      })

      await Promise.allSettled(promises)
    }

    loadAllFonts()
  }, [fonts, onError])

  // Check if all fonts are loaded
  useEffect(() => {
    if (loadedFonts.size === fonts.length) {
      onAllLoaded?.()
    }
  }, [loadedFonts.size, fonts.length, onAllLoaded])

  return null
}

// ============================================================================
// FONT FALLBACK COMPONENT
// ============================================================================

export interface FontFallbackProps {
  primary: string
  fallback: string[]
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export const FontFallback: React.FC<FontFallbackProps> = ({
  primary,
  fallback,
  children,
  className = '',
  style = {},
}) => {
  const [useFallback, setUseFallback] = useState(false)

  // Check if primary font is available
  useEffect(() => {
    const checkFont = async () => {
      const loaded = await waitForFont(primary, 1000)
      setUseFallback(!loaded)
    }

    checkFont()
  }, [primary])

  const fontFamily = useFallback 
    ? fallback.join(', ')
    : `${primary}, ${fallback.join(', ')}`

  return (
    <div
      className={className}
      style={{
        fontFamily,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ============================================================================
// FONT OPTIMIZATION PROVIDER
// ============================================================================

export interface FontOptimizationProviderProps {
  fonts: Array<{
    family: string
    src: string
    config?: Partial<FontOptimizationConfig>
  }>
  children: React.ReactNode
}

export const FontOptimizationProvider: React.FC<FontOptimizationProviderProps> = ({
  fonts,
  children,
}) => {
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set())
  const [errorFonts, setErrorFonts] = useState<Set<string>>(new Set())

  // Load all fonts
  useEffect(() => {
    const loadAllFonts = async () => {
      const promises = fonts.map(async (font) => {
        try {
          const config = { ...defaultFontConfig, ...font.config }
          
          if (config.preload) {
            await preloadFont(font.src, font.family)
          }
          
          await loadFont(font.src, font.family)
          const loaded = await waitForFont(font.family, 5000)
          
          if (loaded) {
            setLoadedFonts(prev => new Set([...prev, font.family]))
          } else {
            setErrorFonts(prev => new Set([...prev, font.family]))
          }
        } catch (error) {
          setErrorFonts(prev => new Set([...prev, font.family]))
        }
      })

      await Promise.allSettled(promises)
    }

    loadAllFonts()
  }, [fonts])

  // Generate CSS for all fonts
  const fontCSS = fonts.map(font => 
    generateFontCSS(font.family, font.src, font.config)
  ).join('\n')

  return (
    <>
      <style>{fontCSS}</style>
      {children}
    </>
  )
}

// ============================================================================
// EXPORT ALL FONT OPTIMIZATION UTILITIES
// ============================================================================

export default {
  generateOptimizedFontUrl,
  preloadFont,
  loadFont,
  isFontLoaded,
  waitForFont,
  generateFontCSS,
  useFontOptimization,
  OptimizedFont,
  FontPreloader,
  FontFallback,
  FontOptimizationProvider,
  defaultFontConfig,
}
