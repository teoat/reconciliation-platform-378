import React, { memo, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
    period?: string
  }
  icon?: React.ReactNode
  className?: string
  loading?: boolean
}

const MetricCard: React.FC<MetricCardProps> = memo(({
  title,
  value,
  change,
  icon,
  className = '',
  loading = false
}) => {
  // Memoize change icon
  const changeIcon = useMemo(() => {
    if (!change) return null
    
    switch (change.type) {
      case 'increase':
        return <TrendingUp className="w-4 h-4" />
      case 'decrease':
        return <TrendingDown className="w-4 h-4" />
      case 'neutral':
        return <Minus className="w-4 h-4" />
      default:
        return null
    }
  }, [change])
  
  // Memoize change color
  const changeColor = useMemo(() => {
    if (!change) return ''
    
    switch (change.type) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      case 'neutral':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }, [change])
  
  // Memoize card classes
  const cardClasses = useMemo(() => 
    `bg-white rounded-lg shadow-sm border p-6 ${className}`,
    [className]
  )
  
  // Memoize change section classes
  const changeClasses = useMemo(() => 
    `flex items-center mt-2 ${changeColor}`,
    [changeColor]
  )
  
  if (loading) {
    return (
      <div className={cardClasses}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cardClasses}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={changeClasses}>
              {changeIcon}
              <span className="text-sm font-medium ml-1">
                {Math.abs(change.value)}%
              </span>
              {change.period && (
                <span className="text-xs text-gray-500 ml-1">
                  {change.period}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export { MetricCard };
export default MetricCard
