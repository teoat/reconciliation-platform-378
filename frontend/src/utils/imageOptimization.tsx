import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ImageOptimizationConfig {
  quality: number;
  format: 'webp' | 'avif' | 'jpeg' | 'png';
  maxWidth: number;
  maxHeight: number;
  lazy: boolean;
  placeholder: boolean;
  blur: boolean;
  progressive: boolean;
}

export interface ImageOptimizationProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  config?: Partial<ImageOptimizationConfig>;
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
  fallback?: React.ReactNode;
  placeholder?: React.ReactNode;
}

export interface ImageOptimizationState {
  loaded: boolean;
  error: boolean;
  inView: boolean;
  src: string;
  placeholder: string;
}

export interface ResponsiveImageProps {
  src: string;
  alt: string;
  breakpoints?: number[];
  className?: string;
  style?: React.CSSProperties;
  config?: Partial<ImageOptimizationConfig>;
  onLoad?: () => void;
  onError?: () => void;
}

export interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    config?: Partial<ImageOptimizationConfig>;
  }>;
  className?: string;
  style?: React.CSSProperties;
  onImageClick?: (index: number) => void;
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
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const generateOptimizedSrc = (
  src: string,
  config: Partial<ImageOptimizationConfig> = {}
): string => {
  const mergedConfig = { ...defaultImageConfig, ...config };

  // In a real implementation, this would call an image optimization service
  // For now, we'll just return the original src with query parameters
  const params = new URLSearchParams({
    q: mergedConfig.quality.toString(),
    f: mergedConfig.format,
    w: mergedConfig.maxWidth.toString(),
    h: mergedConfig.maxHeight.toString(),
  });

  return `${src}?${params.toString()}`;
};

export const generatePlaceholder = (
  width: number = 100,
  height: number = 100,
  blur: boolean = true
): string => {
  // Generate a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      ${blur ? '<rect width="100%" height="100%" fill="#e5e7eb" opacity="0.5"/>' : ''}
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-size="12">Loading...</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const generateResponsiveSrcSet = (
  src: string,
  breakpoints: number[] = [480, 768, 1024, 1280, 1920],
  config: Partial<ImageOptimizationConfig> = {}
): string => {
  return breakpoints
    .map((width) => {
      const optimizedSrc = generateOptimizedSrc(src, { ...config, maxWidth: width });
      return `${optimizedSrc} ${width}w`;
    })
    .join(', ');
};

export const generateSizes = (breakpoints: number[] = [480, 768, 1024, 1280, 1920]): string => {
  return breakpoints
    .map((width, index) => {
      if (index === breakpoints.length - 1) {
        return `${width}px`;
      }
      return `(max-width: ${width}px) ${width}px`;
    })
    .join(', ');
};

// ============================================================================
// REACT COMPONENTS
// ============================================================================

export const OptimizedImage: React.FC<ImageOptimizationProps> = ({
  src,
  alt,
  width,
  height,
  className,
  style,
  config = {},
  onLoad,
  onError,
  fallback,
  placeholder: customPlaceholder,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);

  const finalConfig = { ...defaultImageConfig, ...config };
  const optimizedSrc = generateOptimizedSrc(src, finalConfig);
  const placeholderSrc = generatePlaceholder(width, height, finalConfig.blur);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!finalConfig.lazy) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => { const entry = entries[0];
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [finalConfig.lazy]);

  // Load image when in view
  useEffect(() => {
    if (!inView) return;

    const img = new Image();
    img.src = optimizedSrc;
    img.onload = () => {
      setLoaded(true);
      setError(false);
      setCurrentSrc(optimizedSrc);
      onLoad?.();
    };
    img.onerror = () => {
      setError(true);
      setLoaded(false);
      onError?.();
    };
  }, [inView, optimizedSrc, onLoad, onError]);

  // Handle load callback
  const handleLoadWithCallback = useCallback(() => {
    setLoaded(true);
    setError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle error callback
  const handleErrorWithCallback = useCallback(() => {
    setError(true);
    setLoaded(false);
    onError?.();
  }, [onError]);

  // Show error fallback
  if (error && fallback) {
    return <>{fallback}</>;
  }

  // Show placeholder while loading
  if (!loaded && !error && (finalConfig.placeholder || customPlaceholder)) {
    return (
      <div
        className={`image-placeholder ${className || ''}`}
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
        {customPlaceholder || <img src={placeholderSrc} alt="" />}
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={currentSrc || (inView ? optimizedSrc : placeholderSrc)}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{
        opacity: loaded ? 1 : 0.5,
        transition: 'opacity 0.3s ease-in-out',
        ...style,
      }}
      onLoad={handleLoadWithCallback}
      onError={handleErrorWithCallback}
      loading={finalConfig.lazy ? 'lazy' : 'eager'}
      decoding={finalConfig.progressive ? 'async' : 'sync'}
    />
  );
};

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  breakpoints = [480, 768, 1024, 1280, 1920],
  className,
  style,
  config = {},
  onLoad,
  onError,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);

  const finalConfig = { ...defaultImageConfig, ...config };
  const optimizedSrc = generateOptimizedSrc(src, finalConfig);
  const responsiveSrcSet = generateResponsiveSrcSet(src, breakpoints, finalConfig);
  const sizes = generateSizes(breakpoints);
  const placeholderSrc = generatePlaceholder();

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!finalConfig.lazy) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => { const entry = entries[0];
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [finalConfig.lazy]);

  // Load image when in view
  useEffect(() => {
    if (!inView) return;

    const img = new Image();
    img.src = optimizedSrc;
    img.onload = () => {
      setLoaded(true);
      setCurrentSrc(optimizedSrc);
      onLoad?.();
    };
    img.onerror = () => {
      setLoaded(false);
      onError?.();
    };
  }, [inView, optimizedSrc, onLoad, onError]);

  // Handle load callback
  const handleLoadWithCallback = useCallback(() => {
    setLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Handle error callback
  const handleErrorWithCallback = useCallback(() => {
    setLoaded(false);
    onError?.();
  }, [onError]);

  return (
    <img
      ref={imgRef}
      src={currentSrc || (inView ? optimizedSrc : placeholderSrc)}
      srcSet={inView ? responsiveSrcSet : ''}
      sizes={inView ? sizes : ''}
      alt={alt}
      className={className}
      style={{
        opacity: loaded ? 1 : 0.5,
        transition: 'opacity 0.3s ease-in-out',
        ...style,
      }}
      onLoad={handleLoadWithCallback}
      onError={handleErrorWithCallback}
      loading={finalConfig.lazy ? 'lazy' : 'eager'}
      decoding={finalConfig.progressive ? 'async' : 'sync'}
    />
  );
};

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className,
  style,
  onImageClick,
}) => {
  return (
    <div className={`image-gallery ${className || ''}`} style={style}>
      {images.map((image, index) => (
        <OptimizedImage
          key={index}
          src={image.src}
          alt={image.alt}
          config={image.config}
          className="gallery-image"
          onClick={() => onImageClick?.(index)}
        />
      ))}
    </div>
  );
};

// ============================================================================
// HOOKS
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
  });

  const optimizedSrc = generateOptimizedSrc(src, { ...defaultImageConfig, ...config });

  useEffect(() => {
    const img = new Image();
    img.src = optimizedSrc;
    img.onload = () => {
      setState((prev) => ({
        ...prev,
        loaded: true,
        error: false,
        src: optimizedSrc,
      }));
    };
    img.onerror = () => {
      setState((prev) => ({
        ...prev,
        loaded: false,
        error: true,
      }));
    };
  }, [optimizedSrc]);

  return {
    ...state,
    optimizedSrc,
  };
};
