import { lazy, ComponentType } from 'react';

/**
 * Helper to lazy load route components
 * @param importPath Path to the component relative to src/pages
 * @returns Lazy loaded component
 */
export const lazyRoute = (importFn: () => Promise<{ default: ComponentType<any> }>) => {
    return lazy(importFn);
};

// Example usage:
// const DashboardPage = lazyRoute(() => import('../pages/DashboardPage'));
