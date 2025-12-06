// Advanced Code Splitting Utilities
import { lazy } from 'react';

export interface CodeSplitConfig {
  preload?: boolean;
  timeout?: number;
  retries?: number;
}

export const createLazyComponent = <T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  config: CodeSplitConfig = {}
) => {
  const LazyComponent = lazy(importFn);
  
  // Preload if configured
  if (config.preload) {
    importFn().catch(() => {
      // Silently fail preload
    });
  }

  return LazyComponent;
};

export const preloadComponent = (importFn: () => Promise<unknown>): void => {
  importFn().catch(() => {
    // Silently fail preload
  });
};
