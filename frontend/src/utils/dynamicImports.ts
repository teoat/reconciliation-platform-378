import { lazy, ComponentType } from 'react';

/**
 * Dynamic import utilities for heavy components
 * These components are loaded only when needed to reduce initial bundle size
 */

// Chart components - loaded only when analytics/dashboard is viewed
export const LazyLineChart = lazy(() =>
  import('../components/charts').then((module) => ({ default: module.LineChart }))
);
export const LazyBarChart = lazy(() =>
  import('../components/charts').then((module) => ({ default: module.BarChart }))
);
export const LazyPieChart = lazy(() =>
  import('../components/charts').then((module) => ({ default: module.PieChart }))
);

// Heavy form components - loaded only when forms are opened
export const LazyAdvancedFilters = lazy(() => import('../components/AdvancedFilters'));
export const LazyCustomReports = lazy(() => import('../components/CustomReports'));

// Enterprise features - loaded only for enterprise users
export const LazyEnterpriseSecurity = lazy(() => import('../components/EnterpriseSecurity'));
export const LazyAdvancedVisualization = lazy(() => import('../components/AdvancedVisualization'));
export const LazyFrenlyAI = lazy(() => import('../components/FrenlyAI'));

// File processing components - loaded only during file operations
export const LazyFileUploadInterface = lazy(() => import('../components/FileUploadInterface'));

// Modal components - loaded only when modals are opened
export const LazyModal = lazy(() => import('../components/ui/Modal'));
export const LazyLazyModal = lazy(() => import('../components/ui/LazyModal'));

// Utility function to create dynamic imports with error boundaries
export function createDynamicImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      // console.error('Failed to load component:', error);
      // Return a fallback component or re-throw
      if (fallback) {
        return { default: fallback };
      }
      throw error;
    }
  });
}

// Preload function for critical components
export function preloadComponent(importFn: () => Promise<any>) {
  // Use requestIdleCallback if available, otherwise setTimeout
  const schedulePreload =
    typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? window.requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 100);

  schedulePreload(() => {
    importFn().catch(() => {
      // Silently fail preloading - not critical
    });
  });
}

// Preload analytics components when user hovers over analytics nav
export function preloadAnalytics() {
  preloadComponent(() => import('../components/charts'));
  preloadComponent(() => import('../components/AnalyticsDashboard'));
}

// Preload file upload components when user hovers over upload areas
export function preloadFileUpload() {
  preloadComponent(() => import('../components/FileUploadInterface'));
  preloadComponent(() => import('../components/EnhancedDropzone'));
}
