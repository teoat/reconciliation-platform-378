import React, { lazy, Suspense, ComponentType } from 'react';
import { logger } from '@/services/logger';
import { toRecord } from './typeHelpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ============================================================================
// LAZY LOADING UTILITIES
// ============================================================================

/**
 * Creates a lazy-loaded component with error boundary and loading fallback
 */
export function createLazyComponent<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    const FallbackComponent = fallback;
    return (
      <Suspense fallback={FallbackComponent ? <FallbackComponent /> : <LoadingSpinner />}>
        <LazyComponent {...(props as React.ComponentProps<typeof LazyComponent>)} />
      </Suspense>
    );
  };
}

/**
 * Creates a lazy-loaded component with custom loading component
 */
export function createLazyComponentWithLoader<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  LoadingComponent: ComponentType
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...(props as React.ComponentProps<typeof LazyComponent>)} />
      </Suspense>
    );
  };
}

/**
 * Creates a lazy-loaded component with error boundary
 */
export function createLazyComponentWithErrorBoundary<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  ErrorComponent: ComponentType<{ error: Error; retry: () => void }>
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <ErrorBoundary fallback={ErrorComponent}>
        <Suspense fallback={<LoadingSpinner />}>
          <LazyComponent {...(props as React.ComponentProps<typeof LazyComponent>)} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: ComponentType<{ error: Error; retry: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Error caught by boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// ============================================================================
// PRELOADING UTILITIES
// ============================================================================

/**
 * Preloads a component for faster future loading
 */
export function preloadComponent<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>
) {
  return importFn();
}

/**
 * Preloads multiple components
 */
export function preloadComponents(importFns: Array<() => Promise<{ default?: ComponentType<unknown> }>>) {
  return Promise.all(importFns.map((fn) => fn()));
}

/**
 * Creates a preloadable component that can be preloaded on hover/focus
 */
export function createPreloadableComponent<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  preloadTrigger: 'hover' | 'focus' | 'both' = 'hover'
) {
  const LazyComponent = lazy(importFn);
  let preloaded = false;

  const preload = () => {
    if (!preloaded) {
      preloaded = true;
      importFn();
    }
  };

  return function PreloadableWrapper(props: React.ComponentProps<T>) {
    const handleMouseEnter =
      preloadTrigger === 'hover' || preloadTrigger === 'both' ? preload : undefined;
    const handleFocus =
      preloadTrigger === 'focus' || preloadTrigger === 'both' ? preload : undefined;

    return (
      <div onMouseEnter={handleMouseEnter} onFocus={handleFocus}>
        <Suspense fallback={<LoadingSpinner />}>
          <LazyComponent {...(props as React.ComponentProps<typeof LazyComponent>)} />
        </Suspense>
      </div>
    );
  };
}

// ============================================================================
// ROUTE-BASED CODE SPLITTING
// ============================================================================

/**
 * Creates lazy-loaded routes for React Router
 */
export function createLazyRoute<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
) {
  const LazyComponent = lazy(importFn);

  return function LazyRoute(props: React.ComponentProps<T>) {
    const FallbackComponent = fallback;
    return (
      <Suspense fallback={FallbackComponent ? <FallbackComponent /> : <LoadingSpinner />}>
        <LazyComponent {...(props as React.ComponentProps<typeof LazyComponent>)} />
      </Suspense>
    );
  };
}

// ============================================================================
// DYNAMIC IMPORTS WITH RETRY
// ============================================================================

/**
 * Creates a dynamic import with retry logic
 */
export function createRetryableImport<T>(
  importFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): () => Promise<T> {
  return async () => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Import attempt ${attempt} failed:`, toRecord(error));

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw lastError!;
  };
}

// ============================================================================
// BUNDLE ANALYSIS UTILITIES
// ============================================================================

/**
 * Measures component load time
 */
export function measureComponentLoadTime<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  componentName: string
) {
  return async () => {
    const startTime = performance.now();
    try {
      const result = await importFn();
      return result;
    } catch (error) {
      const endTime = performance.now();
      logger.error(`${componentName} failed to load after ${endTime - startTime}ms:`, toRecord(error));
      throw error;
    }
  };
}

/**
 * Creates a component with load time measurement
 */
export function createMeasuredLazyComponent<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  componentName: string
) {
  const measuredImport = measureComponentLoadTime(importFn, componentName);
  return createLazyComponent(measuredImport);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { lazy, Suspense, ErrorBoundary };

export default {
  createLazyComponent,
  createLazyComponentWithLoader,
  createLazyComponentWithErrorBoundary,
  createPreloadableComponent,
  createLazyRoute,
  createRetryableImport,
  measureComponentLoadTime,
  createMeasuredLazyComponent,
  preloadComponent,
  preloadComponents,
};
