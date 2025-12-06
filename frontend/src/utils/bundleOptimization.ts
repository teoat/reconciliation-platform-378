// ============================================================================
import { logger } from '@/services/logger';
// BUNDLE OPTIMIZATION CONFIGURATION - SINGLE SOURCE OF TRUTH
// ============================================================================

// ============================================================================
// WEBPACK OPTIMIZATION SETTINGS
// ============================================================================

export const webpackOptimizationConfig = {
  // Split chunks configuration
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      // Vendor libraries
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10,
      },
      // React and React DOM
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
        name: 'react',
        chunks: 'all',
        priority: 20,
      },
      // Chart libraries
      charts: {
        test: /[\\/]node_modules[\\/](chart\.js|recharts|d3)[\\/]/,
        name: 'charts',
        chunks: 'all',
        priority: 15,
      },
      // UI libraries
      ui: {
        test: /[\\/]node_modules[\\/](lucide-react|tailwindcss)[\\/]/,
        name: 'ui',
        chunks: 'all',
        priority: 12,
      },
      // Common components
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all',
        priority: 5,
      },
    },
  },

  // Runtime chunk
  runtimeChunk: {
    name: 'runtime',
  },

  // Module concatenation
  concatenateModules: true,

  // Tree shaking
  usedExports: true,
  sideEffects: false,
};

// ============================================================================
// DYNAMIC IMPORTS CONFIGURATION
// ============================================================================

export const dynamicImportConfig = {
  // Critical components (load immediately)
  critical: [
    'components/ui/Button',
    'components/ui/Input',
    'components/ui/Modal',
    'components/layout/AppLayout',
    'components/layout/Navigation',
  ],

  // Heavy components (lazy load)
  heavy: [
    'components/charts/DataVisualization',
    'components/charts/Charts',
    'components/ReconciliationAnalytics',
    'components/DataAnalysis',
    'components/CollaborationPanel',
  ],

  // Page components (route-based loading)
  pages: [
    'pages/ProjectPage',
    'pages/IngestionPage',
    'pages/ReconciliationPage',
    'pages/DashboardPage',
    'pages/AdjudicationPage',
    'pages/SummaryPage',
    'pages/VisualizationPage',
  ],

  // AI components (conditional loading)
  ai: [
    'components/FrenlyAI',
    'components/frenly/FrenlyAIProvider',
    'components/frenly/FrenlyGuidance',
  ],
};

// ============================================================================
// PRELOADING STRATEGY
// ============================================================================

export const preloadingStrategy = {
  // Preload on route change
  routePreload: {
    '/dashboard': ['components/charts/DataVisualization'],
    '/reconciliation': ['components/ReconciliationAnalytics'],
    '/projects': ['components/DataAnalysis'],
  },

  // Preload on user interaction
  interactionPreload: {
    hover: ['components/charts/Charts', 'components/CollaborationPanel'],
    click: ['components/AdvancedFilters', 'components/FrenlyAI'],
  },

  // Preload after initial load
  delayedPreload: {
    delay: 2000, // 2 seconds after initial load
    components: ['components/frenly/FrenlyAIProvider', 'components/frenly/FrenlyGuidance'],
  },
};

// ============================================================================
// BUNDLE SIZE TARGETS
// ============================================================================

export const bundleSizeTargets = {
  // Initial bundle (critical path)
  initial: {
    maxSize: '200kb',
    targetSize: '150kb',
  },

  // Vendor bundle
  vendor: {
    maxSize: '500kb',
    targetSize: '400kb',
  },

  // Page bundles
  page: {
    maxSize: '100kb',
    targetSize: '75kb',
  },

  // Component bundles
  component: {
    maxSize: '50kb',
    targetSize: '30kb',
  },

  // Total bundle size
  total: {
    maxSize: '2MB',
    targetSize: '1.5MB',
  },
};

// ============================================================================
// COMPRESSION SETTINGS
// ============================================================================

export const compressionConfig = {
  // Gzip compression
  gzip: {
    enabled: true,
    level: 6,
    threshold: 1024,
  },

  // Brotli compression
  brotli: {
    enabled: true,
    level: 4,
    threshold: 1024,
  },

  // Minification
  minification: {
    enabled: true,
    removeComments: true,
    removeEmptyAttributes: true,
    collapseWhitespace: true,
  },
};

// ============================================================================
// CACHING STRATEGY
// ============================================================================

export const cachingStrategy = {
  // Static assets
  static: {
    maxAge: 31536000, // 1 year
    immutable: true,
  },

  // JavaScript bundles
  js: {
    maxAge: 86400, // 1 day
    immutable: true,
  },

  // CSS bundles
  css: {
    maxAge: 86400, // 1 day
    immutable: true,
  },

  // API responses
  api: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 3600, // 1 hour
  },
};

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export const performanceMonitoring = {
  // Core Web Vitals thresholds
  coreWebVitals: {
    LCP: 2500, // Largest Contentful Paint (ms)
    FID: 100, // First Input Delay (ms)
    CLS: 0.1, // Cumulative Layout Shift
  },

  // Bundle analysis
  bundleAnalysis: {
    enabled: import.meta.env.DEV,
    outputPath: './bundle-analysis',
  },

  // Performance budgets
  performanceBudget: {
    maxInitialBundleSize: '200kb',
    maxTotalBundleSize: '2MB',
    maxAssetSize: '100kb',
  },
};

// ============================================================================
// OPTIMIZATION UTILITIES
// ============================================================================

// Bundle size analyzer
export const analyzeBundleSize = async () => {
  if (import.meta.env.DEV) {
    try {
      // @ts-expect-error - webpack-bundle-analyzer is dev dependency and may not be available
      const { BundleAnalyzerPlugin } = await import('webpack-bundle-analyzer');
      return BundleAnalyzerPlugin;
    } catch (error) {
      logger.warn('Bundle analyzer not available:', error);
      return null;
    }
  }
  return null;
};

// Tree shaking analyzer
export const analyzeTreeShaking = () => {
  if (import.meta.env.DEV) {
    logger.info('Tree shaking analysis enabled');
    return {
      usedExports: true,
      sideEffects: false,
    };
  }
  return {};
};

// Code splitting analyzer
export const analyzeCodeSplitting = () => {
  if (import.meta.env.DEV) {
    logger.info('Code splitting analysis enabled');
    return {
      chunks: 'all',
      cacheGroups: webpackOptimizationConfig.splitChunks.cacheGroups,
    };
  }
  return {};
};

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

export default {
  webpackOptimizationConfig,
  dynamicImportConfig,
  preloadingStrategy,
  bundleSizeTargets,
  compressionConfig,
  cachingStrategy,
  performanceMonitoring,
  analyzeBundleSize,
  analyzeTreeShaking,
  analyzeCodeSplitting,
};
