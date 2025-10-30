import React, { memo, useMemo } from 'react'
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react'

export interface StatusBadgeProps {
  status: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const StatusBadge: React.FC<StatusBadgeProps> = memo(({
  status,
  children,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  // Memoize status configuration
  const statusConfig = useMemo(() => ({
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      iconColor: 'text-green-500'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      iconColor: 'text-red-500'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500'
    },
    pending: {
      icon: Clock,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500'
    },
    info: {
      icon: AlertCircle,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      iconColor: 'text-gray-500'
    }
  }), [])
  
  // Memoize size classes
  const sizeClasses = useMemo(() => ({
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  }), [])
  
  const iconSizeClasses = useMemo(() => ({
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }), [])
  
  // Memoize computed values
  const config = useMemo(() => statusConfig[status as keyof typeof statusConfig] || statusConfig.info, [statusConfig, status])
  const Icon = useMemo(() => config.icon, [config.icon])
  
  // Memoize badge classes
  const badgeClasses = useMemo(() => 
    `inline-flex items-center font-medium rounded-full ${config.bgColor} ${config.textColor} ${sizeClasses[size]} ${className}`,
    [config.bgColor, config.textColor, sizeClasses, size, className]
  )
  
  const iconClasses = useMemo(() => 
    `${iconSizeClasses[size]} ${config.iconColor} mr-1.5`,
    [iconSizeClasses, size, config.iconColor]
  )
  
  return (
    <span className={badgeClasses}>
      {showIcon && (
        <Icon className={iconClasses} />
      )}
      {children}
    </span>
  )
})

export { StatusBadge };
export default StatusBadge
