// Standardized Loading Component Library - Consistent loading indicators across all pages
// Implements comprehensive loading states with skeleton screens and progress indicators

import React from 'react';

// ============================================================================
// LOADING SPINNER COMPONENTS
// ============================================================================

export interface LoadingSpinnerComponentProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

const LoadingSpinnerComponent: React.FC<LoadingSpinnerComponentProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  return (
    <div className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

// ============================================================================
// PROGRESS BAR COMPONENTS
// ============================================================================

export interface ProgressBarProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  color = 'primary',
  showPercentage = false,
  animated = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div
      className={`w-full ${sizeClasses[size]} bg-gray-200 rounded-full overflow-hidden ${className}`}
    >
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full transition-all duration-300 ${
          animated ? 'animate-pulse' : ''
        }`}
        style={{ width: `${clampedProgress}%` }}
      />
      {showPercentage && (
        <div className="text-xs text-gray-600 mt-1 text-center">{Math.round(clampedProgress)}%</div>
      )}
    </div>
  );
};

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  animated?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  animated = true,
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`bg-gray-200 rounded ${animated ? 'animate-pulse' : ''} ${className}`}
      style={style}
    />
  );
};

const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} height="1rem" width={index === lines - 1 ? '75%' : '100%'} />
      ))}
    </div>
  );
};

const SkeletonAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <Skeleton
      width={sizeClasses[size]}
      height={sizeClasses[size]}
      className={`rounded-full ${className}`}
    />
  );
};

// ============================================================================
// TABLE SKELETON COMPONENTS
// ============================================================================

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      <table className="w-full">
        {showHeader && (
          <thead>
            <tr className="border-b border-gray-200">
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-4 py-3 text-left">
                  <Skeleton height="1rem" width="80%" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-100">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <Skeleton height="1rem" width={colIndex === 0 ? '90%' : '70%'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// CARD SKELETON COMPONENTS
// ============================================================================

export interface CardSkeletonProps {
  showAvatar?: boolean;
  showActions?: boolean;
  className?: string;
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({
  showAvatar = false,
  showActions = false,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        {showAvatar && <SkeletonAvatar size="md" />}
        <div className="flex-1 space-y-3">
          <Skeleton height="1.25rem" width="60%" />
          <SkeletonText lines={2} />
          {showActions && (
            <div className="flex space-x-2 pt-2">
              <Skeleton height="2rem" width="4rem" />
              <Skeleton height="2rem" width="4rem" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// LOADING OVERLAY COMPONENTS
// ============================================================================

export interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  children: React.ReactNode;
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  progress,
  children,
  className = '',
}) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <div className="text-center">
          <LoadingSpinnerComponent size="lg" />
          {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
          {progress !== undefined && (
            <div className="mt-4 w-48">
              <ProgressBar progress={progress} showPercentage />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// LOADING STATES COMPONENTS
// ============================================================================

export interface LoadingStateProps {
  isLoading: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  error,
  empty = false,
  emptyMessage = 'No data available',
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className={className}>
        {loadingComponent || (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinnerComponent size="lg" />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        {errorComponent || (
          <div className="flex items-center justify-center py-8 text-red-600">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-lg font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className={className}>
        {emptyComponent || (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-lg font-medium">No Data</p>
              <p className="text-sm">{emptyMessage}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

// ============================================================================
// PULSE LOADING COMPONENTS
// ============================================================================

export interface PulseLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

const PulseLoading: React.FC<PulseLoadingProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const colorClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    white: 'bg-white',
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-pulse`}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  LoadingSpinnerComponent,
  ProgressBar,
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  TableSkeleton,
  CardSkeleton,
  LoadingOverlay,
  LoadingState,
  PulseLoading,
};

// Default export for easy importing
export default {
  ProgressBar,
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  TableSkeleton,
  CardSkeleton,
  LoadingOverlay,
  LoadingState,
  PulseLoading,
};
