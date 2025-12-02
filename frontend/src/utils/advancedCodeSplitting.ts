import { lazy } from 'react';

/**
 * Lazy loaded AdvancedVisualization component with error handling
 * When using this component, wrap it with React.Suspense and an error boundary
 */
export const LazyAdvancedVisualization = lazy(
  () =>
    import('../components/AdvancedVisualization').catch(() => ({
      default: () => null,
    }))
);
