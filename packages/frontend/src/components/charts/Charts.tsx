import React, { useState, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity } from 'lucide-react'

export interface ChartData {
  label: string
  value: number
  color?: string
}

export interface LineChartProps {
  data: ChartData[]
  width?: number
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  className?: string
  title?: string
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 400,
  height = 200,
  showGrid = true,
  showLegend = true,
  className = '',
  title
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width, height })

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const margin = { top: 20, right: 30, bottom: 40, left: 40 }
  const chartWidth = dimensions.width - margin.left - margin.right
  const chartHeight = dimensions.height - margin.top - margin.bottom

  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const valueRange = maxValue - minValue

  const xScale = (index: number) => (index / (data.length - 1)) * chartWidth
  const yScale = (value: number) => chartHeight - ((value - minValue) / valueRange) * chartHeight

  const pathData = data
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xScale(index)} ${yScale(point.value)}`)
    .join(' ')

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {title && (
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="p-4">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          
          {/* Grid */}
          {showGrid && (
            <g>
              {Array.from({ length: 5 }).map((_, i) => (
                <line
                  key={i}
                  x1={margin.left}
                  y1={margin.top + (i * chartHeight) / 4}
                  x2={margin.left + chartWidth}
                  y2={margin.top + (i * chartHeight) / 4}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              ))}
            </g>
          )}

          {/* Chart Area */}
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points */}
            {data.map((point, index) => (
              <circle
                key={index}
                cx={xScale(index)}
                cy={yScale(point.value)}
                r="4"
                fill="#3B82F6"
                className="hover:r-6 transition-all duration-200"
              >
                <title>{`${point.label}: ${point.value}`}</title>
              </circle>
            ))}
          </g>

          {/* Y-axis labels */}
          {Array.from({ length: 5 }).map((_, i) => {
            const value = minValue + (valueRange * i) / 4
            return (
              <text
                key={i}
                x={margin.left - 10}
                y={margin.top + (i * chartHeight) / 4 + 5}
                textAnchor="end"
                className="text-xs fill-gray-500"
              >
                {value.toFixed(0)}
              </text>
            )
          })}

          {/* X-axis labels */}
          {data.map((point, index) => (
            <text
              key={index}
              x={margin.left + xScale(index)}
              y={margin.top + chartHeight + 20}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {point.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}

export interface BarChartProps {
  data: ChartData[]
  width?: number
  height?: number
  showLegend?: boolean
  className?: string
  title?: string
  orientation?: 'vertical' | 'horizontal'
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  width = 400,
  height = 200,
  showLegend = true,
  className = '',
  title,
  orientation = 'vertical'
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width, height })

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const margin = { top: 20, right: 30, bottom: 40, left: 40 }
  const chartWidth = dimensions.width - margin.left - margin.right
  const chartHeight = dimensions.height - margin.top - margin.bottom

  const maxValue = Math.max(...data.map(d => d.value))
  const barWidth = chartWidth / data.length * 0.8
  const barSpacing = chartWidth / data.length * 0.2

  const colors = [
    '#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {title && (
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="p-4">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="w-full h-full"
        >
          {/* Chart Area */}
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {data.map((item, index) => {
              const barHeight = (item.value / maxValue) * chartHeight
              const x = index * (barWidth + barSpacing)
              const y = chartHeight - barHeight
              
              return (
                <g key={index}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={item.color || colors[index % colors.length]}
                    className="hover:opacity-80 transition-opacity duration-200"
                  >
                    <title>{`${item.label}: ${item.value}`}</title>
                  </rect>
                  
                  {/* Value labels */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
                  >
                    {item.value}
                  </text>
                </g>
              )
            })}
          </g>

          {/* Y-axis labels */}
          {Array.from({ length: 5 }).map((_, i) => {
            const value = (maxValue * i) / 4
            return (
              <text
                key={i}
                x={margin.left - 10}
                y={margin.top + chartHeight - (i * chartHeight) / 4 + 5}
                textAnchor="end"
                className="text-xs fill-gray-500"
              >
                {value.toFixed(0)}
              </text>
            )
          })}

          {/* X-axis labels */}
          {data.map((item, index) => (
            <text
              key={index}
              x={margin.left + index * (barWidth + barSpacing) + barWidth / 2}
              y={margin.top + chartHeight + 20}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {item.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}

export interface PieChartProps {
  data: ChartData[]
  width?: number
  height?: number
  showLegend?: boolean
  className?: string
  title?: string
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  width = 300,
  height = 300,
  showLegend = true,
  className = '',
  title
}) => {
  const colors = [
    '#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = Math.min(width, height) / 2 - 20
  const centerX = width / 2
  const centerY = height / 2

  let currentAngle = 0

  const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle)
    const end = polarToCartesian(centerX, centerY, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    
    return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`
  }

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {title && (
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-center">
          <svg width={width} height={height} className="mr-4">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const startAngle = currentAngle
              const endAngle = currentAngle + (percentage / 100) * 360
              currentAngle = endAngle

              return (
                <path
                  key={index}
                  d={createArc(startAngle, endAngle)}
                  fill={item.color || colors[index % colors.length]}
                  className="hover:opacity-80 transition-opacity duration-200"
                >
                  <title>{`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}</title>
                </path>
              )
            })}
          </svg>
          
          {showLegend && (
            <div className="space-y-2">
              {data.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color || colors[index % colors.length] }}
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <span className="text-sm text-gray-500">
                    ({((item.value / total) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
