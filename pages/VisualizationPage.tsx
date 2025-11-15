'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Activity,
  Zap,
  Clock,
  AlertCircle,
  Target,
  Layers,
  Eye,
  X,
  FileText
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts'
import { useUnifiedData } from '../components/UnifiedDataProvider'
import WorkflowOrchestrator from '../components/WorkflowOrchestrator'

interface VisualizationPageProps {
  project: any
}

// New interfaces for enhanced analytics
interface TrendPoint {
  date: string
  actual: number
  predicted: number
  confidence: number
}

interface AnomalyDetection {
  id: string
  date: string
  type: string
  severity: 'low' | 'medium' | 'high'
  description: string
  impact: number
}

interface PerformanceMetric {
  name: string
  current: number
  previous: number
  target: number
  unit: string
}

// Report Builder Interfaces
interface ReportTemplate {
  id: string
  name: string
  description: string
  category: string
  dataSources: string[]
  visualizations: ReportVisualization[]
  filters: ReportFilter[]
  schedule?: ReportSchedule
  isPublic: boolean
  createdAt: string
  createdBy: string
}

interface ReportVisualization {
  id: string
  type: 'chart' | 'table' | 'metric' | 'text'
  title: string
  dataSource: string
  config: any
  position: { x: number; y: number; width: number; height: number }
}

interface ReportFilter {
  id: string
  field: string
  operator: string
  value: any
  label: string
}

interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  time: string
  recipients: string[]
  format: 'pdf' | 'excel' | 'powerpoint'
}

interface ReportInstance {
  id: string
  templateId: string
  name: string
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  data: any
  generatedAt?: string
  generatedBy: string
}

const VisualizationPage = ({ project }: VisualizationPageProps) => {
  const { 
    crossPageData, 
    updateCrossPageData, 
    workflowProgress, 
    advanceWorkflow, 
    addNotification,
    validateCrossPageData 
  } = useUnifiedData()
  
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [selectedChart, setSelectedChart] = useState('overview')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [showPredictive, setShowPredictive] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'predictive' | 'anomalies' | 'reports'>('overview')
  
  // Report Builder State
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([])
  const [reportInstances, setReportInstances] = useState<ReportInstance[]>([])
  const [showReportBuilder, setShowReportBuilder] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [currentReport, setCurrentReport] = useState<ReportTemplate | null>(null)

  // Enhanced sample data for charts with real-time updates
  const [reconciliationData, setReconciliationData] = useState([
    { date: '2023-11-15', matched: 45, unmatched: 5, discrepancy: 3, processingTime: 2.3 },
    { date: '2023-11-16', matched: 52, unmatched: 3, discrepancy: 2, processingTime: 1.8 },
    { date: '2023-11-17', matched: 48, unmatched: 7, discrepancy: 4, processingTime: 3.1 },
    { date: '2023-11-18', matched: 55, unmatched: 2, discrepancy: 1, processingTime: 1.5 },
    { date: '2023-11-19', matched: 49, unmatched: 6, discrepancy: 3, processingTime: 2.7 },
    { date: '2023-11-20', matched: 51, unmatched: 4, discrepancy: 2, processingTime: 2.1 },
    { date: '2023-11-21', matched: 47, unmatched: 8, discrepancy: 5, processingTime: 3.4 },
    { date: '2023-11-22', matched: 53, unmatched: 3, discrepancy: 2, processingTime: 1.9 },
    { date: '2023-11-23', matched: 46, unmatched: 6, discrepancy: 4, processingTime: 2.8 },
    { date: '2023-11-24', matched: 58, unmatched: 2, discrepancy: 1, processingTime: 1.6 },
  ])

  // Enhanced data with real-time updates
  const [statusData, setStatusData] = useState([
    { name: 'Matched', value: 347, color: '#10B981', trend: 2.1 },
    { name: 'Unmatched', value: 35, color: '#EF4444', trend: -1.2 },
    { name: 'Discrepancy', value: 20, color: '#F59E0B', trend: 0.8 },
    { name: 'Processing', value: 8, color: '#3B82F6', trend: 0.5 },
  ])

  const [amountTrendData, setAmountTrendData] = useState([
    { date: '2023-11-15', systemA: 125000, systemB: 124500, difference: 500, predicted: 125200 },
    { date: '2023-11-16', systemA: 132000, systemB: 132000, difference: 0, predicted: 131800 },
    { date: '2023-11-17', systemA: 118000, systemB: 117800, difference: 200, predicted: 118200 },
    { date: '2023-11-18', systemA: 145000, systemB: 145000, difference: 0, predicted: 144800 },
    { date: '2023-11-19', systemA: 128000, systemB: 127500, difference: 500, predicted: 128200 },
    { date: '2023-11-20', systemA: 139000, systemB: 139000, difference: 0, predicted: 138800 },
    { date: '2023-11-21', systemA: 121000, systemB: 120800, difference: 200, predicted: 121200 },
    { date: '2023-11-22', systemA: 135000, systemB: 134800, difference: 200, predicted: 135200 },
    { date: '2023-11-23', systemA: 142000, systemB: 142000, difference: 0, predicted: 141800 },
    { date: '2023-11-24', systemA: 138000, systemB: 137500, difference: 500, predicted: 138200 },
  ])

  const [discrepancyByType, setDiscrepancyByType] = useState([
    { type: 'Amount Mismatch', count: 12, amount: 2500, trend: -0.5, severity: 'medium' },
    { type: 'Date Mismatch', count: 5, amount: 0, trend: 0.2, severity: 'low' },
    { type: 'Missing Record', count: 8, amount: 1800, trend: -1.1, severity: 'high' },
    { type: 'Description Mismatch', count: 3, amount: 0, trend: 0.8, severity: 'low' },
    { type: 'Currency Mismatch', count: 2, amount: 450, trend: -0.3, severity: 'medium' },
  ])

  // Predictive analytics data
  const [predictiveData, setPredictiveData] = useState<TrendPoint[]>([
    { date: '2023-11-25', actual: 0, predicted: 52, confidence: 85 },
    { date: '2023-11-26', actual: 0, predicted: 48, confidence: 82 },
    { date: '2023-11-27', actual: 0, predicted: 55, confidence: 88 },
    { date: '2023-11-28', actual: 0, predicted: 49, confidence: 79 },
    { date: '2023-11-29', actual: 0, predicted: 53, confidence: 84 },
  ])

  // Anomaly detection data
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([
    {
      id: 'anomaly-1',
      date: '2023-11-21',
      type: 'Processing Time Spike',
      severity: 'high',
      description: 'Processing time increased by 150% compared to average',
      impact: 3.4
    },
    {
      id: 'anomaly-2',
      date: '2023-11-19',
      type: 'Discrepancy Spike',
      severity: 'medium',
      description: 'Unusual increase in discrepancy count',
      impact: 2.7
    },
    {
      id: 'anomaly-3',
      date: '2023-11-17',
      type: 'Match Rate Drop',
      severity: 'low',
      description: 'Match rate dropped below 90% threshold',
      impact: 1.8
    }
  ])

  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([
    { name: 'Match Rate', current: 86.3, previous: 84.2, target: 90, unit: '%' },
    { name: 'Processing Time', current: 2.1, previous: 2.3, target: 1.5, unit: 'min' },
    { name: 'Discrepancy Rate', current: 5.0, previous: 5.8, target: 3.0, unit: '%' },
    { name: 'Auto-Match Rate', current: 78.5, previous: 76.2, target: 85, unit: '%' },
  ])

  const [totalStats, setTotalStats] = useState({
    totalRecords: 402,
    matchedRecords: 347,
    unmatchedRecords: 35,
    discrepancies: 20,
    totalAmount: 920000,
    discrepancyAmount: 4300,
    matchRate: 86.3,
    processingTime: 2.1,
    autoMatchRate: 78.5,
    lastUpdated: new Date().toISOString()
  })

  // Sync with adjudication data
  useEffect(() => {
    const adjudicationData = crossPageData.adjudication
    if (adjudicationData && adjudicationData.discrepancies) {
      // Update analytics with resolved discrepancies
      const resolvedCount = adjudicationData.discrepancies.filter(d => d.status === 'resolved').length
      const totalCount = adjudicationData.discrepancies.length
      
      // Update cross-page data
      updateCrossPageData('analytics', {
        resolvedDiscrepancies: resolvedCount,
        totalDiscrepancies: totalCount,
        resolutionRate: totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0,
        lastUpdated: new Date()
      })
      
      addNotification({
        type: 'info',
        title: 'Analytics Updated',
        message: `Analytics updated with ${resolvedCount}/${totalCount} resolved discrepancies`,
        page: 'visualization',
        isRead: false
      })
    }
  }, [crossPageData.adjudication])

  // Initialize report templates
  useEffect(() => {
    const templates: ReportTemplate[] = [
      {
        id: 'template-1',
        name: 'Daily Reconciliation Summary',
        description: 'Daily summary of reconciliation activities and performance metrics',
        category: 'Operational',
        dataSources: ['reconciliation', 'discrepancies'],
        visualizations: [
          {
            id: 'viz-1',
            type: 'metric',
            title: 'Match Rate',
            dataSource: 'reconciliation',
            config: { metric: 'matchRate', format: 'percentage' },
            position: { x: 0, y: 0, width: 3, height: 2 }
          },
          {
            id: 'viz-2',
            type: 'chart',
            title: 'Daily Trends',
            dataSource: 'reconciliation',
            config: { chartType: 'line', fields: ['matched', 'unmatched'] },
            position: { x: 3, y: 0, width: 6, height: 4 }
          }
        ],
        filters: [
          { id: 'filter-1', field: 'date', operator: 'range', value: '30d', label: 'Date Range' }
        ],
        schedule: {
          frequency: 'daily',
          time: '08:00',
          recipients: ['admin@company.com'],
          format: 'pdf'
        },
        isPublic: true,
        createdAt: '2023-12-01T00:00:00Z',
        createdBy: 'user-1'
      },
      {
        id: 'template-2',
        name: 'Executive Dashboard',
        description: 'High-level executive summary with key performance indicators',
        category: 'Executive',
        dataSources: ['reconciliation', 'performance'],
        visualizations: [
          {
            id: 'viz-3',
            type: 'metric',
            title: 'Total Amount Processed',
            dataSource: 'reconciliation',
            config: { metric: 'totalAmount', format: 'currency' },
            position: { x: 0, y: 0, width: 3, height: 2 }
          },
          {
            id: 'viz-4',
            type: 'chart',
            title: 'Performance Trends',
            dataSource: 'performance',
            config: { chartType: 'area', fields: ['matchRate', 'processingTime'] },
            position: { x: 3, y: 0, width: 6, height: 4 }
          }
        ],
        filters: [
          { id: 'filter-2', field: 'period', operator: 'equals', value: 'monthly', label: 'Period' }
        ],
        schedule: {
          frequency: 'monthly',
          time: '09:00',
          recipients: ['ceo@company.com', 'cfo@company.com'],
          format: 'powerpoint'
        },
        isPublic: false,
        createdAt: '2023-12-01T00:00:00Z',
        createdBy: 'user-1'
      }
    ]

    const instances: ReportInstance[] = [
      {
        id: 'instance-1',
        templateId: 'template-1',
        name: 'Daily Summary - Dec 15, 2023',
        status: 'published',
        data: { matchRate: 86.3, totalRecords: 402 },
        generatedAt: '2023-12-15T08:00:00Z',
        generatedBy: 'system'
      },
      {
        id: 'instance-2',
        templateId: 'template-2',
        name: 'Executive Dashboard - November 2023',
        status: 'published',
        data: { totalAmount: 920000, matchRate: 86.3 },
        generatedAt: '2023-12-01T09:00:00Z',
        generatedBy: 'user-1'
      }
    ]

    setReportTemplates(templates)
    setReportInstances(instances)
  }, [])

  // Real-time data simulation
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Simulate real-time data updates
      setReconciliationData(prev => {
        const newData = [...prev]
        const lastEntry = newData[newData.length - 1]
        const newEntry = {
          date: new Date(Date.now()).toISOString().split('T')[0],
          matched: Math.floor(Math.random() * 20) + 40,
          unmatched: Math.floor(Math.random() * 10) + 1,
          discrepancy: Math.floor(Math.random() * 5) + 1,
          processingTime: Math.random() * 2 + 1
        }
        return [...newData.slice(-9), newEntry]
      })

      setLastUpdated(new Date())
    }, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  // Enhanced data calculations
  const calculatedMetrics = useMemo(() => {
    const avgProcessingTime = reconciliationData.reduce((sum, item) => sum + item.processingTime, 0) / reconciliationData.length
    const totalMatched = reconciliationData.reduce((sum, item) => sum + item.matched, 0)
    const totalUnmatched = reconciliationData.reduce((sum, item) => sum + item.unmatched, 0)
    const totalDiscrepancy = reconciliationData.reduce((sum, item) => sum + item.discrepancy, 0)
    const matchRate = totalMatched / (totalMatched + totalUnmatched + totalDiscrepancy) * 100

    return {
      avgProcessingTime: avgProcessingTime.toFixed(1),
      totalMatched,
      totalUnmatched,
      totalDiscrepancy,
      matchRate: matchRate.toFixed(1)
    }
  }, [reconciliationData])

  const refreshData = () => {
    setLastUpdated(new Date())
    // Simulate data refresh
    console.log('Refreshing data...')
  }

  // Report Builder Functions
  const createReportTemplate = (name: string, description: string, category: string) => {
    const newTemplate: ReportTemplate = {
      id: `template-${Date.now()}`,
      name,
      description,
      category,
      dataSources: [],
      visualizations: [],
      filters: [],
      isPublic: false,
      createdAt: new Date().toISOString(),
      createdBy: 'user-1'
    }
    setReportTemplates(prev => [...prev, newTemplate])
    setCurrentReport(newTemplate)
    setShowReportBuilder(true)
  }

  const generateReport = (templateId: string) => {
    const template = reportTemplates.find(t => t.id === templateId)
    if (!template) return

    const instance: ReportInstance = {
      id: `instance-${Date.now()}`,
      templateId,
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      status: 'published',
      data: { /* Generated data based on template */ },
      generatedAt: new Date().toISOString(),
      generatedBy: 'user-1'
    }
    setReportInstances(prev => [instance, ...prev])
  }

  const exportReport = (instanceId: string, format: 'pdf' | 'excel' | 'powerpoint') => {
    const instance = reportInstances.find(i => i.id === instanceId)
    if (!instance) return

    console.log(`Exporting report ${instance.name} as ${format}`)
    // Simulate export
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Visualization & Analytics
        </h1>
        <p className="text-secondary-600">
          Analyze reconciliation data with interactive charts and insights
        </p>
        {project && (
          <div className="mt-2 text-sm text-primary-600">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* Workflow Orchestrator */}
      <WorkflowOrchestrator
        currentStage="analytics"
        onStageChange={(stage) => {
          // Handle stage change
          console.log('Stage change requested:', stage)
        }}
        onValidation={(stage) => {
          // Validate current stage
          return validateCrossPageData('analytics', stage)
        }}
        onDataSync={async (fromStage, toStage) => {
          // Sync data between stages
          console.log('Syncing data from', fromStage, 'to', toStage)
        }}
      />

      {/* Enhanced Controls */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2 inline" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'trends'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-2 inline" />
              Trends
            </button>
            <button
              onClick={() => setActiveTab('predictive')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'predictive'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Target className="w-4 h-4 mr-2 inline" />
              Predictive
            </button>
            <button
              onClick={() => setActiveTab('anomalies')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'anomalies'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <AlertCircle className="w-4 h-4 mr-2 inline" />
              Anomalies
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'reports'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4 mr-2 inline" />
              Reports
            </button>
          </div>

          {/* Filters and Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input-field w-full sm:w-48"
              title="Select time period for data analysis"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <select
              value={selectedChart}
              onChange={(e) => setSelectedChart(e.target.value)}
              className="input-field w-full sm:w-48"
              title="Select chart type to display"
            >
              <option value="overview">Overview</option>
              <option value="trends">Trends</option>
              <option value="discrepancies">Discrepancies</option>
              <option value="amounts">Amount Analysis</option>
            </select>
          </div>
          
          {/* Real-time Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>Auto-refresh</span>
              </label>
              {autoRefresh && (
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                  title="Select auto-refresh interval"
                >
                  <option value="10">10s</option>
                  <option value="30">30s</option>
                  <option value="60">1m</option>
                  <option value="300">5m</option>
                </select>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={refreshData}
                className="btn-secondary flex items-center space-x-2"
                title="Refresh data"
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
        </div>
      </div>

      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Records</p>
              <p className="text-2xl font-bold text-secondary-900">{calculatedMetrics.totalMatched + calculatedMetrics.totalUnmatched + calculatedMetrics.totalDiscrepancy}</p>
              <div className="flex items-center mt-1">
                <Activity className={`w-3 h-3 mr-1 ${autoRefresh ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
                <span className="text-xs text-gray-500">
                  {autoRefresh ? 'Live' : 'Static'}
                </span>
              </div>
            </div>
            <BarChart3 className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Match Rate</p>
              <p className="text-2xl font-bold text-green-600">{calculatedMetrics.matchRate}%</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                <span className="text-xs text-green-600">+2.1%</span>
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Processing Time</p>
              <p className="text-2xl font-bold text-blue-600">{calculatedMetrics.avgProcessingTime}m</p>
              <div className="flex items-center mt-1">
                <Clock className="w-3 h-3 mr-1 text-blue-500" />
                <span className="text-xs text-blue-600">Avg</span>
              </div>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Discrepancies</p>
              <p className="text-2xl font-bold text-red-600">{calculatedMetrics.totalDiscrepancy}</p>
              <div className="flex items-center mt-1">
                <AlertCircle className="w-3 h-3 mr-1 text-red-500" />
                <span className="text-xs text-red-600">Active</span>
              </div>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {performanceMetrics.map((metric, index) => {
          const isImproving = metric.current > metric.previous
          const isOnTarget = metric.current >= metric.target
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">{metric.name}</h3>
                <div className={`w-2 h-2 rounded-full ${isOnTarget ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xl font-bold text-gray-900">{metric.current}{metric.unit}</p>
                  <p className="text-xs text-gray-500">Target: {metric.target}{metric.unit}</p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center text-xs ${isImproving ? 'text-green-600' : 'text-red-600'}`}>
                    {isImproving ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {Math.abs(((metric.current - metric.previous) / metric.previous) * 100).toFixed(1)}%
                  </div>
                  <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className={`progress-bar h-1 rounded-full ${isOnTarget ? 'progress-bar-green' : 'progress-bar-yellow'}`}
                      style={{ width: `${Math.min((metric.current / metric.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Reconciliation Status Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Reconciliation Status Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Reconciliation Trends */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Daily Reconciliation Trends
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reconciliationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="matched" fill="#10B981" name="Matched" />
                <Bar dataKey="unmatched" fill="#EF4444" name="Unmatched" />
                <Bar dataKey="discrepancy" fill="#F59E0B" name="Discrepancy" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Amount Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Amount Trend Comparison */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Amount Trend Comparison
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={amountTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="systemA" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="System A" />
                <Area type="monotone" dataKey="systemB" stackId="1" stroke="#10B981" fill="#10B981" name="System B" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Discrepancy Analysis */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Discrepancy Analysis by Type
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={discrepancyByType} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Statistics Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Detailed Statistics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200">
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Metric</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Count</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Percentage</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-secondary-100">
                <td className="py-3 px-4 font-medium text-secondary-900">Matched Records</td>
                <td className="py-3 px-4">{totalStats.matchedRecords.toLocaleString()}</td>
                <td className="py-3 px-4 text-green-600">86.3%</td>
                <td className="py-3 px-4">${(totalStats.totalAmount - totalStats.discrepancyAmount).toLocaleString()}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">+2.1%</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-secondary-100">
                <td className="py-3 px-4 font-medium text-secondary-900">Unmatched Records</td>
                <td className="py-3 px-4">{totalStats.unmatchedRecords.toLocaleString()}</td>
                <td className="py-3 px-4 text-red-600">8.7%</td>
                <td className="py-3 px-4">${totalStats.discrepancyAmount.toLocaleString()}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center text-red-600">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    <span className="text-sm">-1.2%</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-secondary-100">
                <td className="py-3 px-4 font-medium text-secondary-900">Discrepancies</td>
                <td className="py-3 px-4">{totalStats.discrepancies.toLocaleString()}</td>
                <td className="py-3 px-4 text-yellow-600">5.0%</td>
                <td className="py-3 px-4">${(totalStats.discrepancyAmount * 0.3).toLocaleString()}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center text-yellow-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">+0.8%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Processing Time Trends */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Processing Time Trends
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reconciliationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}m`, 'Processing Time']} />
                    <Line type="monotone" dataKey="processingTime" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Match Rate Trends */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Match Rate Trends
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reconciliationData.map(item => ({
                    ...item,
                    matchRate: (item.matched / (item.matched + item.unmatched + item.discrepancy)) * 100
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Match Rate']} />
                    <Area type="monotone" dataKey="matchRate" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Historical Performance */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Historical Performance Comparison
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reconciliationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="matched" fill="#10B981" name="Matched" />
                  <Bar dataKey="unmatched" fill="#EF4444" name="Unmatched" />
                  <Bar dataKey="discrepancy" fill="#F59E0B" name="Discrepancy" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Predictive Tab */}
      {activeTab === 'predictive' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Predictive Analytics */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Predictive Analytics
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...reconciliationData, ...predictiveData]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="matched" stroke="#10B981" strokeWidth={2} name="Actual" />
                    <Line type="monotone" dataKey="predicted" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 5" name="Predicted" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Confidence Intervals */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Prediction Confidence
              </h3>
              <div className="space-y-4">
                {predictiveData.map((point, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{point.date}</p>
                      <p className="text-sm text-gray-600">Predicted: {point.predicted} records</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="progress-bar progress-bar-blue h-2 rounded-full"
                            style={{ width: `${point.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{point.confidence}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ML Model Performance */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Machine Learning Model Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">94.2%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">0.89</div>
                <div className="text-sm text-gray-600">Precision</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">0.91</div>
                <div className="text-sm text-gray-600">Recall</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Anomalies Tab */}
      {activeTab === 'anomalies' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Anomaly Detection */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Detected Anomalies
              </h3>
              <div className="space-y-4">
                {anomalies.map((anomaly) => (
                  <div key={anomaly.id} className={`p-4 border-l-4 rounded-lg ${
                    anomaly.severity === 'high' ? 'border-red-500 bg-red-50' :
                    anomaly.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{anomaly.type}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        anomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
                        anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {anomaly.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{anomaly.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{anomaly.date}</span>
                      <span>Impact: {anomaly.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Anomaly Trends */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Anomaly Frequency
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={discrepancyByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Anomaly Prevention */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Anomaly Prevention Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Processing Time Optimization</h4>
                <p className="text-sm text-blue-700">Implement caching mechanisms to reduce processing spikes</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Data Quality Monitoring</h4>
                <p className="text-sm text-green-700">Set up automated alerts for data quality degradation</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Threshold Adjustments</h4>
                <p className="text-sm text-yellow-700">Review and adjust matching thresholds based on historical data</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">System Load Balancing</h4>
                <p className="text-sm text-purple-700">Distribute processing load across multiple instances</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-8">
          {/* Report Templates */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-secondary-900">Report Templates</h3>
              <button
                onClick={() => {
                  const name = prompt('Enter report name:')
                  const description = prompt('Enter report description:')
                  const category = prompt('Enter category:')
                  if (name && description && category) {
                    createReportTemplate(name, description, category)
                  }
                }}
                className="btn-primary flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Create Report</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportTemplates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      template.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>Category: {template.category}</span>
                    <span>{template.visualizations.length} visualizations</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => generateReport(template.id)}
                      className="flex-1 btn-secondary text-sm"
                    >
                      Generate
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowReportBuilder(true)
                      }}
                      className="flex-1 btn-primary text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generated Reports */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-6">Generated Reports</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Report Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Template</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Generated</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reportInstances.map((instance) => {
                    const template = reportTemplates.find(t => t.id === instance.templateId)
                    return (
                      <tr key={instance.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-900">{instance.name}</td>
                        <td className="py-3 px-4 text-gray-600">{template?.name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            instance.status === 'published' ? 'bg-green-100 text-green-800' :
                            instance.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            instance.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {instance.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {instance.generatedAt ? new Date(instance.generatedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => exportReport(instance.id, 'pdf')}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                              title="Export as PDF"
                            >
                              PDF
                            </button>
                            <button
                              onClick={() => exportReport(instance.id, 'excel')}
                              className="text-green-600 hover:text-green-800 text-sm"
                              title="Export as Excel"
                            >
                              Excel
                            </button>
                            <button
                              onClick={() => exportReport(instance.id, 'powerpoint')}
                              className="text-purple-600 hover:text-purple-800 text-sm"
                              title="Export as PowerPoint"
                            >
                              PPT
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report Builder Modal */}
      {showReportBuilder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Report Builder</h3>
                <button
                  onClick={() => setShowReportBuilder(false)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Close report builder"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Report Configuration */}
                <div className="lg:col-span-1">
                  <h4 className="font-semibold text-gray-900 mb-4">Report Configuration</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Report Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter report name"
                        defaultValue={selectedTemplate?.name || ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Enter report description"
                        defaultValue={selectedTemplate?.description || ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Select dashboard category"
                        title="Select dashboard category"
                      >
                        <option value="operational">Operational</option>
                        <option value="executive">Executive</option>
                        <option value="financial">Financial</option>
                        <option value="compliance">Compliance</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Visualization Builder */}
                <div className="lg:col-span-2">
                  <h4 className="font-semibold text-gray-900 mb-4">Visualization Builder</h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Drag and drop visualizations to build your report</p>
                    <div className="flex justify-center space-x-4">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Add Chart
                      </button>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        Add Metric
                      </button>
                      <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                        Add Table
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowReportBuilder(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Save Template
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VisualizationPage
