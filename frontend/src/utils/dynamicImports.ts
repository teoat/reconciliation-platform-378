import React, { lazy, ComponentType } from 'react';
/**
 * Dynamic import utilities for heavy components
 * These components are loaded only when needed to reduce initial bundle size
 */

// Chart components - loaded only when analytics/dashboard is viewed
// @ts-expect-error - charts module may not exist
export const LazyLineChart = lazy(() =>
  import('../components/charts').then((module) => ({ default: module.LineChart }))
);
// @ts-expect-error - charts module may not exist
export const LazyBarChart = lazy(() =>
  import('../components/charts').then((module) => ({ default: module.BarChart }))
);
// @ts-expect-error - charts module may not exist
export const LazyPieChart = lazy(() =>
  import('../components/charts').then((module) => ({ default: module.PieChart }))
);

// Heavy form components - loaded only when forms are opened
// @ts-expect-error - AdvancedFilters may not exist
export const LazyAdvancedFilters = lazy(() => import('../components/AdvancedFilters'));
// @ts-expect-error - CustomReports may not exist
export const LazyCustomReports = lazy(() => import('../components/reports/CustomReports'));

// Enterprise features - loaded only for enterprise users
// @ts-expect-error - EnterpriseSecurity may not exist
export const LazyEnterpriseSecurity = lazy(() => import('../components/security/EnterpriseSecurity'));
// @ts-expect-error - AdvancedVisualization may not exist
export const LazyAdvancedVisualization = lazy(() => import('../components/AdvancedVisualization'));
export const LazyFrenlyAI = lazy(() => import('../components/FrenlyAI'));

// File processing components - loaded only during file operations
// Note: FileUploadInterface may not exist, using FileUpload page component instead
// @ts-expect-error - FileUpload page may not exist
export const LazyFileUploadInterface = lazy(() => import('../components/pages/FileUpload'));

// Modal components - loaded only when modals are opened
// @ts-expect-error - Modal may not exist
export const LazyModal = lazy(() => import('../components/ui/Modal'));
// @ts-expect-error - LazyModal may not exist
export const LazyLazyModal = lazy(() => import('../components/ui/LazyModal'));

// Utility function to create dynamic imports with error boundaries
export function createDynamicImport<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      // logger.error('Failed to load component:', error);
      // Return a fallback component or re-throw
      if (fallback) {
        return { default: fallback };
      }
      throw error;
    }
  });
}

// Preload function for critical components
export function preloadComponent(importFn: () => Promise<{ default?: React.ComponentType<unknown> | undefined }>) {
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
  // Charts module doesn't have default export, preload individual charts
  preloadComponent(() => 
    // @ts-expect-error - charts module may not exist
    import('../components/charts').then(m => ({ 
      default: m.LineChart as React.ComponentType<unknown> 
    }))
  );
  // AnalyticsDashboard has both named and default exports
  preloadComponent(() => 
    // @ts-expect-error - AnalyticsDashboard may not exist
    import('../components/dashboard/AnalyticsDashboard').then(m => ({ 
      default: (m.default || m.AnalyticsDashboard) as React.ComponentType<unknown>
    }))
  );
}

// Preload file upload components when user hovers over upload areas
export function preloadFileUpload() {
  // FileUpload is a default export
  preloadComponent(() => 
    // @ts-expect-error - FileUpload may not exist
    import('../components/pages/FileUpload').then(m => ({ 
      default: m.default as React.ComponentType<unknown>
    }))
  );
  // FileUploadDropzone - named export only
  preloadComponent(() => 
    // @ts-expect-error - FileUploadDropzone may not exist
    import('../components/fileUpload/FileUploadDropzone').then(m => ({ 
      default: m.FileUploadDropzone as React.ComponentType<unknown>
    })).catch(() => {
      // Component may not exist, return empty promise
      return Promise.resolve({ default: undefined });
    })
  );
}
