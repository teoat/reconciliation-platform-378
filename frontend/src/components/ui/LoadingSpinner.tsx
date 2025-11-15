import React from 'react'
import { Loader2 } from 'lucide-react'

// Base loading spinner
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  )
}

// Full page loading
export const LoadingPage: React.FC<{
  message?: string
  className?: string
}> = ({ message = 'Loading...', className = '' }) => (
  <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
    <div className="text-center">
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
)

// Card loading skeleton
export const LoadingCard: React.FC<{
  className?: string
}> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  </div>
)

// Button loading state
export const LoadingButton: React.FC<{
  loading?: boolean
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}> = ({ loading = false, children, className = '', onClick, disabled = false, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    disabled={loading || disabled}
  >
    {loading && <LoadingSpinner size="sm" className="mr-2" />}
    {children}
  </button>
)

// Table loading skeleton
export const SkeletonTable: React.FC<{
  rows?: number
  columns?: number
  className?: string
}> = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4">
          <div className="animate-pulse">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="flex-1">
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Dashboard loading skeleton
export const SkeletonDashboard: React.FC<{
  className?: string
}> = ({ className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {/* Header skeleton */}
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>

    {/* Metrics skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </div>

    {/* Charts skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <LoadingCard />
      <LoadingCard />
    </div>

    {/* Table skeleton */}
    <SkeletonTable />
  </div>
)

// Form loading skeleton
export const SkeletonForm: React.FC<{
  fields?: number
  className?: string
}> = ({ fields = 4, className = '' }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
    <div className="animate-pulse space-y-6">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
      <div className="flex justify-end space-x-3">
        <div className="h-10 bg-gray-200 rounded w-20"></div>
        <div className="h-10 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  </div>
)

// Specific loading states for different sections
export const ProjectsLoading: React.FC = () => (
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </div>
  </div>
)

export const ReconciliationLoading: React.FC = () => (
  <div className="space-y-6">
    {/* Tabs skeleton */}
    <div className="border-b border-gray-200">
      <div className="animate-pulse">
        <div className="flex space-x-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-10 bg-gray-200 rounded w-24"></div>
          ))}
        </div>
      </div>
    </div>

    {/* Content skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </div>

    <SkeletonTable rows={8} columns={5} />
  </div>
)

export const AnalyticsLoading: React.FC = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>

    {/* Metrics skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </div>

    {/* Charts skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <LoadingCard />
      <LoadingCard />
    </div>

    {/* Performance metrics skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </div>

    <SkeletonTable rows={7} columns={4} />
  </div>
)

export const UsersLoading: React.FC = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>

    {/* Stats cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </div>

    {/* Filters skeleton */}
    <LoadingCard />

    {/* Users table skeleton */}
    <SkeletonTable rows={10} columns={6} />
  </div>
)

// Loading overlay for modals and forms
export const LoadingOverlay: React.FC<{
  isLoading: boolean
  children: React.ReactNode
  message?: string
  className?: string
}> = ({ isLoading, children, message = 'Loading...', className = '' }) => (
  <div className={`relative ${className}`}>
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-2" />
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
      </div>
    )}
  </div>
)

// Progress bar component
export const ProgressBar: React.FC<{
  progress: number
  className?: string
  showPercentage?: boolean
  color?: 'blue' | 'green' | 'yellow' | 'red'
}> = ({ 
  progress, 
  className = '', 
  showPercentage = true,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600'
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>Progress</span>
        {showPercentage && (
          <span>{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
}

// Circular progress indicator
export const CircularProgress: React.FC<{
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
  showPercentage?: boolean
}> = ({ 
  progress, 
  size = 40, 
  strokeWidth = 4, 
  className = '',
  showPercentage = true
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-blue-600 transition-all duration-300"
        />
      </svg>
      {showPercentage && (
        <span className="absolute text-xs font-medium text-gray-600">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  )
}