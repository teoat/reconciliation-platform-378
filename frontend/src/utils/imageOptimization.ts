// ============================================================================
// IMAGE OPTIMIZATION UTILITIES - SINGLE SOURCE OF TRUTH
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ImageOptimizationConfig {
  quality: number
  format: 'webp' | 'avif' | 'jpeg' | 'png'
  maxWidth: number
  maxHeight: number
  lazy: boolean
  placeholder: boolean
  blur: boolean
  progressive: boolean
}

export interface ImageOptimizationProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
  config?: Partial<ImageOptimizationConfig>
  onLoad?: () => void
  onError?: () => void
  fallback?: React.ReactNode
  placeholder?: React.ReactNode
}

export interface ImageOptimizationState {
  loaded: boolean
  error: boolean
  inView: boolean
  src: string
  placeholder: string
}

// ============================================================================
// IMAGE OPTIMIZATION CONFIGURATION
// ============================================================================

export const defaultImageConfig: ImageOptimizationConfig = {
  quality: 80,
  format: 'webp',
  maxWidth: 1920,
  maxHeight: 1080,
  lazy: true,
  placeholder: true,
  blur: true,
  progressive: true,
}

// ============================================================================
// IMAGE OPTIMIZATION UTILITIES
// ============================================================================

// Generate optimized image URL
export const generateOptimizedImageUrl = (
  src: string,
  config: Partial<ImageOptimizationConfig> = {}
): string => {
  const finalConfig = { ...defaultImageConfig, ...config }
  
  // If it's a data URL or external URL, return as is
  if (src.startsWith('data:') || src.startsWith('http')) {
    return src
  }

  // Generate optimized URL with parameters
  const url = new URL(src, window.location.origin)
  url.searchParams.set('quality', finalConfig.quality.toString())
  url.searchParams.set('format', finalConfig.format)
  url.searchParams.set('maxWidth', finalConfig.maxWidth.toString())
  url.searchParams.set('maxHeight', finalConfig.maxHeight.toString())
  
  if (finalConfig.progressive) {
    url.searchParams.set('progressive', 'true')
  }

  return url.toString()
}

// Generate placeholder image
export const generatePlaceholderImage = (
  width: number,
  height: number,
  color: string = '#f3f4f6'
): string => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)
  }
  
  return canvas.toDataURL()
}

// Generate blur placeholder
export const generateBlurPlaceholder = (
  src: string,
  width: number,
  height: number
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Draw scaled down image
        ctx.drawImage(img, 0, 0, width, height)
        
        // Apply blur effect
        ctx.filter = 'blur(10px)'
        ctx.drawImage(canvas, 0, 0)
        
        resolve(canvas.toDataURL('image/jpeg', 0.1))
      } else {
        resolve(generatePlaceholderImage(width, height))
      }
    }
    
    img.onerror = () => {
      resolve(generatePlaceholderImage(width, height))
    }
    
    img.src = src
  })
}

// Preload image
export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// ============================================================================
// IMAGE OPTIMIZATION HOOK
// ============================================================================

export const useImageOptimization = (
  src: string,
  config: Partial<ImageOptimizationConfig> = {}
) => {
  const [state, setState] = useState<ImageOptimizationState>({
    loaded: false,
    error: false,
    inView: false,
    src: '',
    placeholder: '',
  })

  const finalConfig = { ...defaultImageConfig, ...config }
  const imgRef = useRef<HTMLImageElement>(null)

  // Generate optimized image URL
  const optimizedSrc = generateOptimizedImageUrl(src, finalConfig)

  // Generate placeholder
  useEffect(() => {
    if (finalConfig.placeholder) {
      const placeholder = generatePlaceholderImage(
        finalConfig.maxWidth,
        finalConfig.maxHeight
      )
      setState(prev => ({ ...prev, placeholder }))
    }
  }, [finalConfig.placeholder, finalConfig.maxWidth, finalConfig.maxHeight])

  // Handle image load
  const handleLoad = useCallback(() => {
    setState(prev => ({ ...prev, loaded: true, error: false }))
  }, [])

  // Handle image error
  const handleError = useCallback(() => {
    setState(prev => ({ ...prev, error: true, loaded: false }))
  }, [])

  // Intersection observer for lazy loading
  useEffect(() => {
    if (!finalConfig.lazy || !imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState(prev => ({ ...prev, inView: true, src: optimizedSrc }))
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [finalConfig.lazy, optimizedSrc])

  return {
    ...state,
    imgRef,
    handleLoad,
    handleError,
    optimizedSrc,
  }
}

// ============================================================================
// IMAGE OPTIMIZATION COMPONENT
// ============================================================================

export const OptimizedImage: React.FC<ImageOptimizationProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  style = {},
  config = {},
  onLoad,
  onError,
  fallback,
  placeholder: customPlaceholder,
}) => {
  const {
    loaded,
    error,
    inView,
    src: currentSrc,
    placeholder,
    imgRef,
    handleLoad,
    handleError,
    optimizedSrc,
  } = useImageOptimization(src, config)

  const finalConfig = { ...defaultImageConfig, ...config }

  // Handle load with callback
  const handleLoadWithCallback = useCallback(() => {
    handleLoad()
    onLoad?.()
  }, [handleLoad, onLoad])

  // Handle error with callback
  const handleErrorWithCallback = useCallback(() => {
    handleError()
    onError?.()
  }, [handleError, onError])

  // Show error fallback
  if (error && fallback) {
    return <>{fallback}</>
  }

  // Show placeholder while loading
  if (!loaded && !error && (finalConfig.placeholder || customPlaceholder)) {
    return (
      <div
        className={`image-placeholder ${className}`}
        style={{
          width,
          height,
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        {customPlaceholder || (
          <div className="animate-pulse bg-gray-300 rounded w-full h-full" />
        )}
      </div>
    )
  }

  return (
    <img
      ref={imgRef}
      src={finalConfig.lazy ? (inView ? currentSrc : '') : optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={`optimized-image ${className}`}
      style={{
        transition: 'opacity 0.3s ease-in-out',
        opacity: loaded ? 1 : 0.7,
        ...style,
      }}
      onLoad={handleLoadWithCallback}
      onError={handleErrorWithCallback}
      loading={finalConfig.lazy ? 'lazy' : 'eager'}
      decoding="async"
    />
  )
}

// ============================================================================
// RESPONSIVE IMAGE COMPONENT
// ============================================================================

export interface ResponsiveImageProps extends ImageOptimizationProps {
  sizes: string
  srcSet: string[]
  breakpoints: number[]
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  style = {},
  config = {},
  sizes,
  srcSet,
  breakpoints,
  onLoad,
  onError,
  fallback,
  placeholder: customPlaceholder,
}) => {
  const {
    loaded,
    error,
    inView,
    src: currentSrc,
    placeholder,
    imgRef,
    handleLoad,
    handleError,
    optimizedSrc,
  } = useImageOptimization(src, config)

  const finalConfig = { ...defaultImageConfig, ...config }

  // Generate responsive srcSet
  const responsiveSrcSet = srcSet.map((src, index) => {
    const breakpoint = breakpoints[index] || 1
    const optimizedSrc = generateOptimizedImageUrl(src, {
      ...finalConfig,
      maxWidth: breakpoint,
    })
    return `${optimizedSrc} ${breakpoint}w`
  }).join(', ')

  // Handle load with callback
  const handleLoadWithCallback = useCallback(() => {
    handleLoad()
    onLoad?.()
  }, [handleLoad, onLoad])

  // Handle error with callback
  const handleErrorWithCallback = useCallback(() => {
    handleError()
    onError?.()
  }, [handleError, onError])

  // Show error fallback
  if (error && fallback) {
    return <>{fallback}</>
  }

  // Show placeholder while loading
  if (!loaded && !error && (finalConfig.placeholder || customPlaceholder)) {
    return (
      <div
        className={`responsive-image-placeholder ${className}`}
        style={{
          width,
          height,
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        {customPlaceholder || (
          <div className="animate-pulse bg-gray-300 rounded w-full h-full" />
        )}
      </div>
    )
  }

  return (
    <img
      ref={imgRef}
      src={finalConfig.lazy ? (inView ? currentSrc : '') : optimizedSrc}
      srcSet={responsiveSrcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      className={`responsive-image ${className}`}
      style={{
        transition: 'opacity 0.3s ease-in-out',
        opacity: loaded ? 1 : 0.7,
        ...style,
      }}
      onLoad={handleLoadWithCallback}
      onError={handleErrorWithCallback}
      loading={finalConfig.lazy ? 'lazy' : 'eager'}
      decoding="async"
    />
  )
}

// ============================================================================
// IMAGE GALLERY COMPONENT
// ============================================================================

export interface ImageGalleryProps {
  images: string[]
  alt: string[]
  config?: Partial<ImageOptimizationConfig>
  onImageClick?: (index: number) => void
  className?: string
  style?: React.CSSProperties
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  alt,
  config = {},
  onImageClick,
  className = '',
  style = {},
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set([...prev, index]))
  }, [])

  return (
    <div className={`image-gallery ${className}`} style={style}>
      {images.map((src, index) => (
        <div
          key={index}
          className="image-gallery-item"
          onClick={() => onImageClick?.(index)}
        >
          <OptimizedImage
            src={src}
            alt={alt[index] || `Image ${index + 1}`}
            config={config}
            onLoad={() => handleImageLoad(index)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          />
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// EXPORT ALL IMAGE OPTIMIZATION UTILITIES
// ============================================================================

export default {
  generateOptimizedImageUrl,
  generatePlaceholderImage,
  generateBlurPlaceholder,
  preloadImage,
  useImageOptimization,
  OptimizedImage,
  ResponsiveImage,
  ImageGallery,
  defaultImageConfig,
}
