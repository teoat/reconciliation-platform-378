'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Target,
  Zap,
  Shield,
  Clock,
  Users,
  FileText,
  Database,
  Calculator,
  Eye,
  Download,
  RefreshCw,
  Settings,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  Info,
  AlertCircle,
  CheckSquare,
  Square,
  Star,
  Award,
  Trophy,
  Medal,
  Flag,
  Tag,
  Bookmark,
  Share2,
  Copy,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  User,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  Crown,
  Building,
  Home,
  Search,
  Bell,
  MessageSquare,
  Workflow,
  Layers,
  Hash,
  Type,
  MapPin,
  Wifi,
  Lock,
  Unlock,
  Key,
  Cloud,
  Server,
  Folder,
  File,
  FileCheck,
  FileX,
  FilePlus,
  FileMinus,
  FileEdit,
  FileSearch,
  X
} from 'lucide-react'
import { useData } from '../components/DataProvider'

// Analytics Interfaces
interface AnalyticsMetrics {
  performance: PerformanceMetrics
  trends: TrendMetrics
  quality: QualityMetrics
  efficiency: EfficiencyMetrics
  compliance: ComplianceMetrics
  predictions: PredictionMetrics
}

interface PerformanceMetrics {
  matchRate: number
  accuracy: number
  processingTime: number
  throughput: number
  errorRate: number
  slaCompliance: number
  trend: 'up' | 'down' | 'stable'
  change: number
}

interface TrendMetrics {
  dailyMatches: Array<{ date: string; value: number }>
  weeklyAccuracy: Array<{ week: string; value: number }>
  monthlyThroughput: Array<{ month: string; value: number }>
  errorTrends: Array<{ date: string; errors: number }>
}

interface QualityMetrics {
  completeness: number
  accuracy: number
  consistency: number
  validity: number
  duplicates: number
  errors: number
  trend: 'up' | 'down' | 'stable'
  change: number
}

interface EfficiencyMetrics {
  automationRate: number
  manualInterventionRate: number
  averageResolutionTime: number
  costPerTransaction: number
  trend: 'up' | 'down' | 'stable'
  change: number
}

interface ComplianceMetrics {
  auditTrailCompleteness: number
  dataRetentionCompliance: number
  securityCompliance: number
  regulatoryCompliance: number
  trend: 'up' | 'down' | 'stable'
  change: number
}

interface PredictionMetrics {
  forecastAccuracy: number
  riskPredictions: Array<{
    risk: string
    probability: number
    impact: 'low' | 'medium' | 'high' | 'critical'
    recommendation: string
  }>
  recommendations: string[]
  nextWeekForecast: Array<{ metric: string; predicted: number; confidence: number }>
}

interface AnalyticsDashboardProps {
  project: any
  onProgressUpdate?: (step: string) => void
}

const AnalyticsDashboard = ({ project, onProgressUpdate }: AnalyticsDashboardProps) => {
  const { currentProject, getReconciliationData, getCashflowData } = useData()
  const [analytics, setAnalytics] = useState<AnalyticsMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedMetric, setSelectedMetric] = useState<'performance' | 'quality' | 'efficiency' | 'compliance'>('performance')
  const [showPredictions, setShowPredictions] = useState(false)

  const initializeAnalytics = useCallback(() => {
    setIsLoading(true)
    
    // Simulate data processing
    setTimeout(() => {
      const reconciliationData = getReconciliationData()
      const cashflowData = getCashflowData()
      
      const analyticsData: AnalyticsMetrics = {
        performance: {
          matchRate: reconciliationData?.metrics?.matchRate || 94.5,
          accuracy: reconciliationData?.metrics?.accuracy || 96.8,
          processingTime: reconciliationData?.metrics?.averageProcessingTime || 2.3,
          throughput: reconciliationData?.metrics?.throughput || 180,
          errorRate: reconciliationData?.metrics?.errorRate || 1.8,
          slaCompliance: reconciliationData?.metrics?.slaCompliance || 98.2,
          trend: 'up',
          change: 2.3
        },
        trends: {
          dailyMatches: generateDailyTrendData(30),
          weeklyAccuracy: generateWeeklyTrendData(12),
          monthlyThroughput: generateMonthlyTrendData(6),
          errorTrends: generateErrorTrendData(30)
        },
        quality: {
          completeness: cashflowData?.metrics?.dataQualityScore || 95.5,
          accuracy: 96.8,
          consistency: 94.2,
          validity: 97.1,
          duplicates: 0.8,
          errors: 1.2,
          trend: 'up',
          change: 1.5
        },
        efficiency: {
          automationRate: 87.3,
          manualInterventionRate: 12.7,
          averageResolutionTime: 4.2,
          costPerTransaction: 0.15,
          trend: 'up',
          change: 5.2
        },
        compliance: {
          auditTrailCompleteness: 99.1,
          dataRetentionCompliance: 98.7,
          securityCompliance: 97.9,
          regulatoryCompliance: 96.3,
          trend: 'stable',
          change: 0.3
        },
        predictions: {
          forecastAccuracy: 89.4,
          riskPredictions: [
            {
              risk: 'Data Quality Degradation',
              probability: 15,
              impact: 'medium',
              recommendation: 'Implement additional validation rules'
            },
            {
              risk: 'Processing Bottleneck',
              probability: 8,
              impact: 'high',
              recommendation: 'Scale infrastructure resources'
            },
            {
              risk: 'Compliance Violation',
              probability: 3,
              impact: 'critical',
              recommendation: 'Review audit procedures'
            }
          ],
          recommendations: [
            'Optimize matching algorithms for better accuracy',
            'Implement automated quality checks',
            'Scale processing capacity for peak loads',
            'Enhance audit trail documentation'
          ],
          nextWeekForecast: [
            { metric: 'Match Rate', predicted: 95.2, confidence: 92 },
            { metric: 'Processing Time', predicted: 2.1, confidence: 88 },
            { metric: 'Error Rate', predicted: 1.5, confidence: 85 },
            { metric: 'Throughput', predicted: 195, confidence: 90 }
          ]
        }
      }
      
      setAnalytics(analyticsData)
      setIsLoading(false)
     }, 1000)
   }, [getReconciliationData, getCashflowData])

  // Initialize analytics data
  useEffect(() => {
    initializeAnalytics()
    onProgressUpdate?.('analytics_dashboard_started')
   }, [currentProject, selectedTimeRange, initializeAnalytics, onProgressUpdate])

  // Helper functions
  const generateDailyTrendData = (count: number) => {
    const data = []
    const baseValue = 150
    const variance = 20
    
    for (let i = 0; i < count; i++) {
      const value = baseValue + (Math.random() - 0.5) * variance
      const date = new Date()
      date.setDate(date.getDate() - (count - i))
      data.push({ date: date.toISOString().split('T')[0], value: Math.round(value) })
    }
    
    return data.reverse()
  }

  const generateWeeklyTrendData = (count: number) => {
    const data = []
    const baseValue = 95
    const variance = 5
    
    for (let i = 0; i < count; i++) {
      const value = baseValue + (Math.random() - 0.5) * variance
      data.push({ week: `Week ${count - i}`, value: Math.round(value * 100) / 100 })
    }
    
    return data.reverse()
  }

  const generateMonthlyTrendData = (count: number) => {
    const data = []
    const baseValue = 180
    const variance = 30
    
    for (let i = 0; i < count; i++) {
      const value = baseValue + (Math.random() - 0.5) * variance
      const date = new Date()
      date.setMonth(date.getMonth() - (count - i))
      data.push({ month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), value: Math.round(value) })
    }
    
    return data.reverse()
  }

  const generateErrorTrendData = (days: number) => {
    const data = []
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (days - i))
      data.push({ 
        date: date.toISOString().split('T')[0], 
        errors: Math.floor(Math.random() * 10) + 1 
      })
    }
    return data.reverse()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              Loading Analytics Dashboard
            </h3>
            <p className="text-secondary-600">
              Processing performance metrics and trends...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-secondary-900 mb-2">
            No Analytics Data Available
          </h3>
          <p className="text-secondary-600 mb-4">
            Analytics will be available once reconciliation data is processed.
          </p>
          <button
            onClick={initializeAnalytics}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-secondary-600">
              Comprehensive performance metrics and business insights
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="input-field"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={initializeAnalytics}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button className="btn-primary flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
        
        {project && (
          <div className="text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg inline-block">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Match Rate</p>
              <p className="text-2xl font-bold text-secondary-900">
                {formatPercentage(analytics.performance.matchRate)}
              </p>
              <div className="flex items-center space-x-1 mt-1">
                {getTrendIcon(analytics.performance.trend)}
                <span className={`text-sm ${getTrendColor(analytics.performance.trend)}`}>
                  +{analytics.performance.change}%
                </span>
              </div>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Accuracy</p>
              <p className="text-2xl font-bold text-secondary-900">
                {formatPercentage(analytics.performance.accuracy)}
              </p>
              <div className="flex items-center space-x-1 mt-1">
                {getTrendIcon(analytics.performance.trend)}
                <span className={`text-sm ${getTrendColor(analytics.performance.trend)}`}>
                  +{analytics.performance.change}%
                </span>
              </div>
            </div>
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Processing Time</p>
              <p className="text-2xl font-bold text-secondary-900">
                {analytics.performance.processingTime}s
              </p>
              <div className="flex items-center space-x-1 mt-1">
                {getTrendIcon(analytics.performance.trend)}
                <span className={`text-sm ${getTrendColor(analytics.performance.trend)}`}>
                  -{analytics.performance.change}s
                </span>
              </div>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Throughput</p>
              <p className="text-2xl font-bold text-secondary-900">
                {analytics.performance.throughput}/hr
              </p>
              <div className="flex items-center space-x-1 mt-1">
                {getTrendIcon(analytics.performance.trend)}
                <span className={`text-sm ${getTrendColor(analytics.performance.trend)}`}>
                  +{analytics.performance.change}%
                </span>
              </div>
            </div>
            <Zap className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Metrics Tabs */}
      <div className="card mb-6">
        <div className="border-b border-secondary-200">
          <nav className="flex space-x-8">
            {[
              { id: 'performance', label: 'Performance', icon: BarChart3 },
              { id: 'quality', label: 'Data Quality', icon: Shield },
              { id: 'efficiency', label: 'Efficiency', icon: Zap },
              { id: 'compliance', label: 'Compliance', icon: CheckCircle }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedMetric(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedMetric === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Performance Metrics */}
        {selectedMetric === 'performance' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Match Rate Trend</h3>
                <div className="h-64 flex items-center justify-center bg-secondary-50 rounded-lg">
                  <div className="text-center">
                    <LineChart className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
                    <p className="text-secondary-600">Chart visualization would be implemented here</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Processing Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600">Average Processing Time</span>
                    <span className="text-sm font-semibold text-secondary-900">
                      {analytics.performance.processingTime}s
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600">Throughput</span>
                    <span className="text-sm font-semibold text-secondary-900">
                      {analytics.performance.throughput} records/hour
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600">Error Rate</span>
                    <span className="text-sm font-semibold text-red-600">
                      {formatPercentage(analytics.performance.errorRate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600">SLA Compliance</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatPercentage(analytics.performance.slaCompliance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quality Metrics */}
        {selectedMetric === 'quality' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Data Quality Score</h3>
                <div className="h-64 flex items-center justify-center bg-secondary-50 rounded-lg">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
                    <p className="text-secondary-600">Quality metrics visualization would be implemented here</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Quality Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600">Completeness</span>
                    <span className="text-sm font-semibold text-secondary-900">
                      {formatPercentage(analytics.quality.completeness)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600">Accuracy</span>
                    <span className="text-sm font-semibold text-secondary-900">
                      {formatPercentage(analytics.quality.accuracy)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600">Consistency</span>
                    <span className="text-sm font-semibold text-secondary-900">
                      {formatPercentage(analytics.quality.consistency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600">Validity</span>
                    <span className="text-sm font-semibold text-secondary-900">
                      {formatPercentage(analytics.quality.validity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Efficiency Metrics */}
        {selectedMetric === 'efficiency' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Automation Rate</h3>
                <div className="h-64 flex items-center justify-center bg-secondary-50 rounded-lg">
                  <div className="text-center">
                    <Activity className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
                    <p className="text-secondary-600">Efficiency metrics visualization would be implemented here</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Efficiency Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600">Automation Rate</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatPercentage(analytics.efficiency.automationRate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600">Manual Intervention</span>
                    <span className="text-sm font-semibold text-yellow-600">
                      {formatPercentage(analytics.efficiency.manualInterventionRate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600">Avg Resolution Time</span>
                    <span className="text-sm font-semibold text-secondary-900">
                      {analytics.efficiency.averageResolutionTime}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600">Cost per Transaction</span>
                    <span className="text-sm font-semibold text-secondary-900">
                      {formatCurrency(analytics.efficiency.costPerTransaction)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Metrics */}
        {selectedMetric === 'compliance' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Compliance Score</h3>
                <div className="h-64 flex items-center justify-center bg-secondary-50 rounded-lg">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
                    <p className="text-secondary-600">Compliance metrics visualization would be implemented here</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Compliance Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600">Audit Trail</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatPercentage(analytics.compliance.auditTrailCompleteness)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600">Data Retention</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatPercentage(analytics.compliance.dataRetentionCompliance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600">Security</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatPercentage(analytics.compliance.securityCompliance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600">Regulatory</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatPercentage(analytics.compliance.regulatoryCompliance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Risk Predictions and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">Risk Predictions</h3>
            <button
              onClick={() => setShowPredictions(!showPredictions)}
              className="btn-secondary text-sm flex items-center space-x-1"
            >
              <Eye className="w-4 h-4" />
              <span>{showPredictions ? 'Hide' : 'Show'} Details</span>
            </button>
          </div>
          <div className="space-y-3">
            {analytics.predictions.riskPredictions.map((risk, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-secondary-900">{risk.risk}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(risk.impact)}`}>
                      {risk.impact.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-600">{risk.recommendation}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-secondary-900">
                    {risk.probability}%
                  </div>
                  <div className="w-16 bg-secondary-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${risk.probability}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Recommendations</h3>
          <div className="space-y-3">
            {analytics.predictions.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                </div>
                <p className="text-sm text-blue-900">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Forecast Section */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Next Week Forecast</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.predictions.nextWeekForecast.map((forecast, index) => (
            <div key={index} className="p-4 bg-secondary-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-secondary-600">{forecast.metric}</span>
                <span className="text-xs text-secondary-500">{forecast.confidence}% confidence</span>
              </div>
              <div className="text-lg font-bold text-secondary-900 mb-1">
                {forecast.metric === 'Processing Time' ? `${forecast.predicted}s` : 
                 forecast.metric === 'Error Rate' ? `${forecast.predicted}%` :
                 forecast.metric === 'Throughput' ? `${forecast.predicted}/hr` :
                 `${forecast.predicted}%`}
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full"
                  style={{ width: `${forecast.confidence}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard



