import { lazy } from 'react';
import { logger } from '@/services/logger';
/**
 * Advanced Code Splitting Strategies
 * Implements intelligent lazy loading for large components and features
 */

// ============================================================================
// PAGE-BASED CODE SPLITTING
// ============================================================================

// Main application pages - loaded on route navigation
export const LazyDashboardPage = lazy(() =>
  import('../pages/DashboardPage').then((module) => ({ default: module.DashboardPage }))
);

export const LazyProjectPage = lazy(() =>
  import('../pages/ProjectPage').then((module) => ({ default: module.ProjectPage }))
);

export const LazyIngestionPage = lazy(() =>
  import('../pages/IngestionPage').then((module) => ({ default: module.IngestionPage }))
);

export const LazyReconciliationPage = lazy(() => import('../pages/ReconciliationPage'));

export const LazyAdjudicationPage = lazy(() =>
  import('../pages/AdjudicationPage').then((module) => ({ default: module.AdjudicationPage }))
);

export const LazySummaryPage = lazy(() =>
  import('../pages/SummaryPage').then((module) => ({ default: module.SummaryPage }))
);

export const LazyVisualizationPage = lazy(() =>
  import('../pages/VisualizationPage').then((module) => ({ default: module.VisualizationPage }))
);

// ============================================================================
// COMPONENT-BASED CODE SPLITTING
// ============================================================================

// Large components - loaded when needed
export const LazyDataProvider = lazy(() => import('../components/DataProvider'));

export const LazyReconciliationInterface = lazy(
  () => import('../components/ReconciliationInterface')
);

// Large components - loaded when needed
// export const LazyProjectComponents = lazy(() => import('../components/ProjectComponents'));

// ============================================================================
// FEATURE-BASED CODE SPLITTING
// ============================================================================

// Heavy features - loaded on demand
export const LazyAnalyticsDashboard = lazy(() => import('../components/dashboard/AnalyticsDashboard'));

export const LazyAdvancedVisualization = lazy(() => import('../components/AdvancedVisualization'));

// Bulk operations - loaded when needed
// export const LazyBulkOperations = lazy(() => import('../components/BulkOperations'));

// Enterprise features - loaded for enterprise users
// export const LazyEnterpriseFeatures = lazy(() => import('../components/EnterpriseFeatures'));

// ============================================================================
// UTILITY-BASED CODE SPLITTING
// ============================================================================

// Large utility libraries - loaded when specific features are used
// export const LazyChartLibraries = lazy(() => import('../utils/chartLibraries'));
// export const LazyDataProcessing = lazy(() => import('../utils/dataProcessing'));
// export const LazyExportUtilities = lazy(() => import('../utils/exportUtilities'));

// ============================================================================
// ERROR HANDLING FOR CODE SPLITTING
// ============================================================================

// Type for Sentry on window object
interface WindowWithSentry extends Window {
  Sentry?: {
    captureException: (error: Error, options?: { tags?: Record<string, string> }) => void;
  };
}

export function handleCodeSplittingError(error: Error, componentName: string): void {
  // logger.error(`Failed to load component ${componentName}:`, error);

  // Send to monitoring service
  if (typeof window !== 'undefined') {
    const windowWithSentry = window as WindowWithSentry;
    if (windowWithSentry.Sentry) {
      windowWithSentry.Sentry.captureException(error, {
        tags: {
          component: componentName,
          type: 'code_splitting',
        },
      });
    }
  }
}

// Re-export React.lazy for convenience
export { lazy } from 'react';
