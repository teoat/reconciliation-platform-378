// ============================================================================
// LAZY LOADING CONFIGURATION - SINGLE SOURCE OF TRUTH
// ============================================================================

import React, { Suspense, lazy } from 'react'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

// ============================================================================
// LAZY LOADED COMPONENTS
// ============================================================================

// Page Components - Lazy load entire pages
export const LazyProjectPage = lazy(() => import('../pages').then(module => ({ default: module.ProjectPage })))
export const LazyIngestionPage = lazy(() => import('../pages').then(module => ({ default: module.IngestionPage })))
export const LazyReconciliationPage = lazy(() => import('../pages').then(module => ({ default: module.ReconciliationPage })))
export const LazyDashboardPage = lazy(() => import('../pages').then(module => ({ default: module.DashboardPage })))
export const LazyAdjudicationPage = lazy(() => import('../pages').then(module => ({ default: module.AdjudicationPage })))
export const LazySummaryPage = lazy(() => import('../pages').then(module => ({ default: module.SummaryPage })))
export const LazyVisualizationPage = lazy(() => import('../pages').then(module => ({ default: module.VisualizationPage })))

// Chart Components - Lazy load heavy chart libraries
export const LazyDataVisualization = lazy(() => import('../components/charts/DataVisualization'))
export const LazyCharts = lazy(() => import('../components/charts/Charts'))

// Complex Components - Lazy load feature-rich components
export const LazyReconciliationAnalytics = lazy(() => import('../components/ReconciliationAnalytics'))
export const LazyDataAnalysis = lazy(() => import('../components/DataAnalysis'))
export const LazyCollaborationPanel = lazy(() => import('../components/CollaborationPanel'))
export const LazyAdvancedFilters = lazy(() => import('../components/AdvancedFilters'))

// Frenly Components - Lazy load AI features
export const LazyFrenlyAI = lazy(() => import('../components/FrenlyAI'))
export const LazyFrenlyAIProvider = lazy(() => import('../components/frenly/FrenlyAIProvider'))
export const LazyFrenlyGuidance = lazy(() => import('../components/frenly/FrenlyGuidance'))

// ============================================================================
// LOADING FALLBACKS
// ============================================================================

// Generic loading fallback
const GenericLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner size="lg" />
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
)

// Page loading fallback
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">Loading page...</p>
    </div>
  </div>
)

// Chart loading fallback
const ChartLoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <LoadingSpinner />
      <p className="mt-2 text-sm text-gray-600">Loading chart...</p>
    </div>
  </div>
)

// Component loading fallback
const ComponentLoadingFallback = () => (
  <div className="flex items-center justify-center p-4">
    <LoadingSpinner size="sm" />
    <span className="ml-2 text-sm text-gray-600">Loading component...</span>
  </div>
)

// ============================================================================
// LAZY COMPONENT WRAPPERS
// ============================================================================

// Page wrappers with page-specific loading
export const LazyProjectPageWrapper = (props: any) => (
  <Suspense fallback={<PageLoadingFallback />}>
    <LazyProjectPage {...props} />
  </Suspense>
)

export const LazyIngestionPageWrapper = (props: any) => (
  <Suspense fallback={<PageLoadingFallback />}>
    <LazyIngestionPage {...props} />
  </Suspense>
)

export const LazyReconciliationPageWrapper = (props: any) => (
  <Suspense fallback={<PageLoadingFallback />}>
    <LazyReconciliationPage {...props} />
  </Suspense>
)

export const LazyDashboardPageWrapper = (props: any) => (
  <Suspense fallback={<PageLoadingFallback />}>
    <LazyDashboardPage {...props} />
  </Suspense>
)

export const LazyAdjudicationPageWrapper = (props: any) => (
  <Suspense fallback={<PageLoadingFallback />}>
    <LazyAdjudicationPage {...props} />
  </Suspense>
)

export const LazySummaryPageWrapper = (props: any) => (
  <Suspense fallback={<PageLoadingFallback />}>
    <LazySummaryPage {...props} />
  </Suspense>
)

export const LazyVisualizationPageWrapper = (props: any) => (
  <Suspense fallback={<PageLoadingFallback />}>
    <LazyVisualizationPage {...props} />
  </Suspense>
)

// Chart wrappers with chart-specific loading
export const LazyDataVisualizationWrapper = (props: any) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyDataVisualization {...props} />
  </Suspense>
)

export const LazyChartsWrapper = (props: any) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyCharts {...props} />
  </Suspense>
)

// Component wrappers with generic loading
export const LazyReconciliationAnalyticsWrapper = (props: any) => (
  <Suspense fallback={<ComponentLoadingFallback />}>
    <LazyReconciliationAnalytics {...props} />
  </Suspense>
)

export const LazyDataAnalysisWrapper = (props: any) => (
  <Suspense fallback={<ComponentLoadingFallback />}>
    <LazyDataAnalysis {...props} />
  </Suspense>
)

export const LazyCollaborationPanelWrapper = (props: any) => (
  <Suspense fallback={<ComponentLoadingFallback />}>
    <LazyCollaborationPanel {...props} />
  </Suspense>
)

export const LazyAdvancedFiltersWrapper = (props: any) => (
  <Suspense fallback={<ComponentLoadingFallback />}>
    <LazyAdvancedFilters {...props} />
  </Suspense>
)

// Frenly component wrappers
export const LazyFrenlyAIWrapper = (props: any) => (
  <Suspense fallback={<ComponentLoadingFallback />}>
    <LazyFrenlyAI {...props} />
  </Suspense>
)

export const LazyFrenlyAIProviderWrapper = (props: any) => (
  <Suspense fallback={<ComponentLoadingFallback />}>
    <LazyFrenlyAIProvider {...props} />
  </Suspense>
)

export const LazyFrenlyGuidanceWrapper = (props: any) => (
  <Suspense fallback={<ComponentLoadingFallback />}>
    <LazyFrenlyGuidance {...props} />
  </Suspense>
)

// ============================================================================
// ROUTE-BASED LAZY LOADING
// ============================================================================

// Route components for React Router
export const routeComponents = {
  '/projects': LazyProjectPageWrapper,
  '/ingestion': LazyIngestionPageWrapper,
  '/reconciliation': LazyReconciliationPageWrapper,
  '/dashboard': LazyDashboardPageWrapper,
  '/adjudication': LazyAdjudicationPageWrapper,
  '/summary': LazySummaryPageWrapper,
  '/visualization': LazyVisualizationPageWrapper,
}

// ============================================================================
// CONDITIONAL LAZY LOADING
// ============================================================================

// Hook for conditional lazy loading based on user interaction
export const useConditionalLazyLoad = (shouldLoad: boolean) => {
  const [isLoaded, setIsLoaded] = React.useState(false)
  
  React.useEffect(() => {
    if (shouldLoad && !isLoaded) {
      setIsLoaded(true)
    }
  }, [shouldLoad, isLoaded])
  
  return isLoaded
}

// Component for conditional lazy loading
export const ConditionalLazyComponent = ({ 
  shouldLoad, 
  children, 
  fallback 
}: { 
  shouldLoad: boolean
  children: React.ReactNode
  fallback?: React.ReactNode 
}) => {
  const isLoaded = useConditionalLazyLoad(shouldLoad)
  
  if (!isLoaded) {
    return fallback || <ComponentLoadingFallback />
  }
  
  return <>{children}</>
}

// ============================================================================
// PRELOADING UTILITIES
// ============================================================================

// Preload components for better UX
export const preloadComponents = () => {
  // Preload critical components
  import('../pages')
  import('../components/charts/DataVisualization')
  import('../components/charts/Charts')
}

// Preload on user interaction
export const preloadOnHover = (componentImport: () => Promise<any>) => {
  let hasPreloaded = false
  
  return () => {
    if (!hasPreloaded) {
      hasPreloaded = true
      componentImport()
    }
  }
}

// ============================================================================
// BUNDLE ANALYSIS UTILITIES
// ============================================================================

// Get component bundle size (for development)
export const getComponentBundleSize = async (componentPath: string) => {
  if (process.env.NODE_ENV === 'development') {
    try {
      const module = await import(componentPath)
      console.log(`Bundle size for ${componentPath}:`, module)
    } catch (error) {
      console.warn(`Could not analyze bundle size for ${componentPath}:`, error)
    }
  }
}

// ============================================================================
// EXPORT ALL LAZY LOADING UTILITIES
// ============================================================================

export default {
  // Lazy components
  LazyProjectPage,
  LazyIngestionPage,
  LazyReconciliationPage,
  LazyDashboardPage,
  LazyAdjudicationPage,
  LazySummaryPage,
  LazyVisualizationPage,
  LazyDataVisualization,
  LazyCharts,
  LazyReconciliationAnalytics,
  LazyDataAnalysis,
  LazyCollaborationPanel,
  LazyAdvancedFilters,
  LazyFrenlyAI,
  LazyFrenlyAIProvider,
  LazyFrenlyGuidance,
  
  // Wrappers
  LazyProjectPageWrapper,
  LazyIngestionPageWrapper,
  LazyReconciliationPageWrapper,
  LazyDashboardPageWrapper,
  LazyAdjudicationPageWrapper,
  LazySummaryPageWrapper,
  LazyVisualizationPageWrapper,
  LazyDataVisualizationWrapper,
  LazyChartsWrapper,
  LazyReconciliationAnalyticsWrapper,
  LazyDataAnalysisWrapper,
  LazyCollaborationPanelWrapper,
  LazyAdvancedFiltersWrapper,
  LazyFrenlyAIWrapper,
  LazyFrenlyAIProviderWrapper,
  LazyFrenlyGuidanceWrapper,
  
  // Utilities
  routeComponents,
  useConditionalLazyLoad,
  ConditionalLazyComponent,
  preloadComponents,
  preloadOnHover,
  getComponentBundleSize,
  
  // Fallbacks
  GenericLoadingFallback,
  PageLoadingFallback,
  ChartLoadingFallback,
  ComponentLoadingFallback
}
