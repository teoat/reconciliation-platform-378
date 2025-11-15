import React, { useState, useEffect } from 'react';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface FontOptimizationConfig {
  preload: boolean;
  display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  fallback: string[];
  subset: boolean;
  unicodeRange: string;
  weight: number[];
  style: 'normal' | 'italic';
  variable: boolean;
}

export interface FontOptimizationProps {
  family: string;
  src: string;
  config?: Partial<FontOptimizationConfig>;
  onLoad?: () => void;
  onError?: () => void;
  children?: React.ReactNode;
}

export interface FontOptimizationState {
  loaded: boolean;
  error: boolean;
  fallback: boolean;
}

export interface FontFallbackProps {
  primary: string;
  fallback: string[];
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// ============================================================================
// FONT OPTIMIZATION CONFIGURATION
// ============================================================================

export const defaultFontConfig: FontOptimizationConfig = {
  preload: true,
  display: 'swap',
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
  subset: true,
  unicodeRange:
    'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  weight: [400, 500, 600, 700],
  style: 'normal',
  variable: false,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const generateFontFace = (
  family: string,
  src: string,
  config: Partial<FontOptimizationConfig> = {}
): string => {
  const mergedConfig = { ...defaultFontConfig, ...config };

  let fontFace = `@font-face {
  font-family: '${family}';
  src: url('${src}')`;

  if (mergedConfig.variable) {
    fontFace += ` format('woff2-variations')`;
  } else {
    fontFace += ` format('woff2')`;
  }

  fontFace += `;
  font-display: ${mergedConfig.display};
  font-weight: ${mergedConfig.weight.join(' ')};
  font-style: ${mergedConfig.style};`;

  if (mergedConfig.unicodeRange) {
    fontFace += `
  unicode-range: ${mergedConfig.unicodeRange};`;
  }

  fontFace += `
}`;

  return fontFace;
};

export const generateFontCSS = (
  family: string,
  src: string,
  config: Partial<FontOptimizationConfig> = {}
): string => {
  return generateFontFace(family, src, config);
};

export const preloadFont = (src: string): void => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = src;
  link.as = 'font';
  link.type = 'font/woff2';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
};

export const loadFont = (family: string, src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const font = new FontFace(family, `url(${src})`, {
      display: 'swap',
    });

    font
      .load()
      .then(() => {
        document.fonts.add(font);
        resolve();
      })
      .catch(reject);
  });
};

// ============================================================================
// REACT COMPONENTS
// ============================================================================

export const FontOptimization: React.FC<FontOptimizationProps> = ({
  family,
  src,
  config = {},
  onLoad,
  onError,
  children,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [fallback, setFallback] = useState(false);

  const mergedConfig = { ...defaultFontConfig, ...config };

  // Preload font if configured
  useEffect(() => {
    if (mergedConfig.preload) {
      preloadFont(src);
    }
  }, [src, mergedConfig.preload]);

  // Load font
  useEffect(() => {
    loadFont(family, src)
      .then(() => {
        setLoaded(true);
        setError(false);
        setFallback(false);
      })
      .catch(() => {
        setError(true);
        setFallback(true);
      });
  }, [family, src]);

  // Handle load callback
  useEffect(() => {
    if (loaded) {
      onLoad?.();
    }
  }, [loaded, onLoad]);

  // Handle error callback
  useEffect(() => {
    if (error) {
      onError?.();
    }
  }, [error, onError]);

  // Generate font CSS
  const fontCSS = generateFontCSS(family, src, config);

  return (
    <>
      <style>{fontCSS}</style>
      <div
        style={{
          fontFamily: fallback ? `${family}, ${mergedConfig.fallback.join(', ')}` : family,
        }}
      >
        {children}
      </div>
    </>
  );
};

export const FontFallback: React.FC<FontFallbackProps> = ({
  primary,
  fallback,
  children,
  className,
  style,
}) => {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    // Check if primary font is available
    document.fonts.ready.then(() => {
      const primaryFont = document.fonts.check(`12px "${primary}"`);
      setFontLoaded(primaryFont);
    });
  }, [primary]);

  return (
    <div
      className={className}
      style={{
        fontFamily: fontLoaded ? primary : `${primary}, ${fallback.join(', ')}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ============================================================================
// FONT PRELOADER COMPONENT
// ============================================================================

export interface FontPreloaderProps {
  fonts: Array<{
    family: string;
    src: string;
    config?: Partial<FontOptimizationConfig>;
  }>;
  onAllLoaded?: () => void;
  onError?: (family: string, error: Error) => void;
}

export const FontPreloader: React.FC<FontPreloaderProps> = ({ fonts, onAllLoaded, onError }) => {
  useEffect(() => {
    const loadPromises = fonts.map(({ family, src }) => {
      return loadFont(family, src).catch((error) => {
        onError?.(family, error as Error);
      });
    });

    Promise.all(loadPromises)
      .then(() => {
        onAllLoaded?.();
      })
      .catch(() => {
        // Some fonts failed to load, but onAllLoaded is still called
        onAllLoaded?.();
      });
  }, [fonts, onAllLoaded, onError]);

  // This component doesn't render anything visible
  return null;
};

// ============================================================================
// HOOKS
// ============================================================================

export const useFontOptimization = (family: string, src: string) => {
  const [state, setState] = useState<FontOptimizationState>({
    loaded: false,
    error: false,
    fallback: false,
  });

  useEffect(() => {
    loadFont(family, src)
      .then(() => {
        setState({ loaded: true, error: false, fallback: false });
      })
      .catch(() => {
        setState({ loaded: false, error: true, fallback: true });
      });
  }, [family, src]);

  return state;
};

export const useFontPreloader = (fonts: Array<{ family: string; src: string }>) => {
  const [loaded, setLoaded] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const promises = fonts.map(({ family, src }) =>
      loadFont(family, src).catch(() => {
        setErrors((prev) => [...prev, family]);
        return Promise.resolve(); // Don't fail the whole promise
      })
    );

    Promise.all(promises).then(() => {
      setLoaded(true);
    });
  }, [fonts]);

  return { loaded, errors };
};
