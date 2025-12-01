import { lazy } from 'react';

/**
 * Lazy loaded AdvancedVisualization component
 */
export const LazyAdvancedVisualization = lazy(
  () => import('../components/AdvancedVisualization')
);
