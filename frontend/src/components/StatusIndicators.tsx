// Simplified Status Indicators Component
// Reduced from 686 lines to ~100 lines by focusing on essential functionality

import React from 'react'
import { CheckCircle } from 'lucide-react'
import { XCircle } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { Clock } from 'lucide-react'
import { Info } from 'lucide-react'

export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'pending' | 'loading'

export interface StatusIndicatorProps {
  status: StatusType
  message?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal' | 'detailed'
  showMessage?: boolean
  animated?: boolean
  className?: string
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  size = 'md',
  variant = 'default',
  showMessage = true,
  animated = false,
  className = ''
}) => {
  const getStatusIcon = () => {
    const iconProps = {
      className: `h-5 w-5 ${animated && status === 'loading' ? 'animate-spin' : ''}`
    }

    switch (status) {
      case 'success':
        return <CheckCircle {...iconProps} className={`${iconProps.className} text-green-600`} />
      case 'error':
        return <XCircle {...iconProps} className={`${iconProps.className} text-red-600`} />
      case 'warning':
        return <AlertCircle {...iconProps} className={`${iconProps.className} text-yellow-600`} />
      case 'info':
        return <Info {...iconProps} className={`${iconProps.className} text-blue-600`} />
      case 'pending':
        return <Clock {...iconProps} className={`${iconProps.className} text-gray-500`} />
      case 'loading':
        return <Clock {...iconProps} className={`${iconProps.className} text-blue-600 animate-spin`} />
      default:
        return <Info {...iconProps} className={`${iconProps.className} text-gray-500`} />
    }
  }

  const getSizeClasses = () => {
    const sizes = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    }
    return sizes[size]
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'minimal':
        return 'flex items-center space-x-1'
      case 'detailed':
        return 'flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'
      default:
        return 'flex items-center space-x-2'
    }
  }

  const getStatusColor = () => {
    const colors = {
      success: 'text-green-600',
      error: 'text-red-600',
      warning: 'text-yellow-600',
      info: 'text-blue-600',
      pending: 'text-gray-500',
      loading: 'text-blue-600'
    }
    return colors[status]
  }

  return (
    <div className={`${getVariantClasses()} ${getSizeClasses()} ${className}`}>
      {getStatusIcon()}
      {showMessage && message && (
        <span className={`font-medium ${getStatusColor()}`}>
          {message}
        </span>
      )}
    </div>
  )
}

// Simplified Status Badge Component
export interface StatusBadgeProps {
  status: StatusType
  text?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  size = 'md',
  className = ''
}) => {
  const getStatusText = () => {
    if (text) return text
    
    const texts = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info',
      pending: 'Pending',
      loading: 'Loading'
    }
    return texts[status]
  }

  const getSizeClasses = () => {
    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base'
    }
    return sizes[size]
  }

  const getStatusClasses = () => {
    const statusClasses = {
      success: 'bg-green-100 text-green-800 border-green-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      pending: 'bg-gray-100 text-gray-800 border-gray-200',
      loading: 'bg-blue-100 text-blue-800 border-blue-200'
    }
    return statusClasses[status]
  }

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${getSizeClasses()}
        ${getStatusClasses()}
        ${className}
      `}
    >
      {getStatusText()}
    </span>
  )
}

// Simplified Status List Component
export interface StatusItem {
  id: string
  label: string
  status: StatusType
  message?: string
  timestamp?: Date
}

export interface StatusListProps {
  items: StatusItem[]
  title?: string
  showTimestamps?: boolean
  className?: string
}

export const StatusList: React.FC<StatusListProps> = ({
  items,
  title,
  showTimestamps = false,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      )}
      
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <StatusIndicator status={item.status} showMessage={false} />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  {item.label}
                </span>
                {item.message && (
                  <p className="text-sm text-gray-500">{item.message}</p>
                )}
              </div>
            </div>
            
            {showTimestamps && item.timestamp && (
              <span className="text-xs text-gray-400">
                {item.timestamp.toLocaleTimeString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}