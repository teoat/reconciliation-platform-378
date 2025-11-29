import React, { ComponentType, ReactNode, Suspense } from 'react';
import { logger } from '@/services/logger';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
);

// Error boundary for lazy components
class LazyErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Lazy component error:', { error: error.message, stack: error.stack, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center p-8">
            <div className="text-red-600">Failed to load component</div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export const withLazyLoading = <P extends Record<string, unknown>>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <LazyErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <Component {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
};

const LazyLoadingUtils = {
  withLazyLoading,
  LoadingSpinner,
  LazyErrorBoundary,
};

export default LazyLoadingUtils;
