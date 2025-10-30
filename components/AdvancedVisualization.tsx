'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  Zap, 
  Shield, 
  Eye, 
  Download, 
  Settings, 
  Filter, 
  RefreshCw, 
  Maximize, 
  Minimize, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal, 
  MoreVertical, 
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
  Building2, 
  Factory, 
  Store, 
  CreditCard, 
  DollarSign, 
  Euro, 
  PoundSterling, 
  Bitcoin, 
  Minus, 
  Plus, 
  Equal, 
  Divide, 
  Percent, 
  Calculator, 
  File, 
  FileCheck, 
  FileX, 
  FilePlus, 
  FileMinus, 
  FileEdit, 
  FileSearch, 
  Folder, 
  FolderOpen, 
  FolderPlus, 
  FolderMinus, 
  FolderCheck, 
  FolderX, 
  Database, 
  Server, 
  Cloud, 
  Wifi, 
  Lock, 
  Unlock, 
  Key, 
  Hash, 
  Type, 
  Layers, 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  CheckSquare, 
  Square, 
  Smile, 
  Frown, 
  Meh, 
  ThumbsUp, 
  ThumbsDown, 
  Hand, 
  Heart, 
  Workflow, 
  Bell, 
  MessageSquare, 
  Calendar, 
  Clock, 
  MapPin, 
  Settings as SettingsIcon
} from 'lucide-react'
import { CHART_CONFIG } from '../constants'
import { useData } from './DataProvider'

// Advanced Visualization Interfaces
interface ChartData {
  id: string
  name: string
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'sankey' | 'treemap'
  data: any[]
  config: {
    title: string
    xAxis?: string
    yAxis?: string
    color?: string
    showLegend?: boolean
    showGrid?: boolean
    animation?: boolean
  }
  insights: string[]
  lastUpdated: string
}

interface VisualizationDashboardProps {
  project: any
  onProgressUpdate?: (step: string) => void
}

const AdvancedVisualization = ({ project, onProgressUpdate }: VisualizationDashboardProps) => {
  const { currentProject, getReconciliationData, getCashflowData } = useData()
  const [charts, setCharts] = useState<ChartData[]>([])
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null)
  const [showChartModal, setShowChartModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<string>('all')

  const initializeVisualizations = useCallback(() => {
    setIsLoading(true)
    
    // Simulate data processing
    setTimeout(() => {
      const reconciliationData = getReconciliationData()
      const cashflowData = getCashflowData()
      
      const sampleCharts: ChartData[] = [
        {
          id: 'chart-001',
          name: 'Reconciliation Performance Trend',
          type: 'line',
          data: [
            { date: '2024-01-01', matchRate: 92.5, accuracy: 94.2, throughput: 150 },
            { date: '2024-01-02', matchRate: 93.1, accuracy: 95.1, throughput: 165 },
            { date: '2024-01-03', matchRate: 94.8, accuracy: 96.3, throughput: 180 },
            { date: '2024-01-04', matchRate: 95.2, accuracy: 96.8, throughput: 175 },
            { date: '2024-01-05', matchRate: 96.1, accuracy: 97.2, throughput: 190 }
          ],
          config: {
            title: 'Reconciliation Performance Over Time',
            xAxis: 'date',
            yAxis: 'matchRate',
            color: '#3B82F6',
            showLegend: true,
            showGrid: true,
            animation: true
          },
          insights: [
            'Match rate has improved by 3.6% over the last 5 days',
            'Throughput shows consistent growth trend',
            'Accuracy remains stable above 94%'
          ],
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'chart-002',
          name: 'Expense Category Distribution',
          type: 'pie',
          data: [
            { category: 'Operational', value: 45.2, amount: 12500000 },
            { category: 'Company', value: 32.8, amount: 9100000 },
            { category: 'Personal', value: 15.6, amount: 4300000 },
            { category: 'Utilities', value: 6.4, amount: 1800000 }
          ],
          config: {
            title: 'Expense Distribution by Category',
            color: '#10B981',
            showLegend: true,
            animation: true
          },
          insights: [
            'Operational expenses represent the largest portion at 45.2%',
            'Company expenses show significant volume at 32.8%',
            'Personal expenses are well-controlled at 15.6%'
          ],
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'chart-003',
          name: 'Discrepancy Analysis',
          type: 'bar',
          data: [
            { type: 'Amount', count: 15, severity: 'high' },
            { type: 'Date', count: 8, severity: 'medium' },
            { type: 'Description', count: 12, severity: 'low' },
            { type: 'Category', count: 5, severity: 'medium' }
          ],
          config: {
            title: 'Discrepancy Types and Frequency',
            xAxis: 'type',
            yAxis: 'count',
            color: '#EF4444',
            showLegend: true,
            showGrid: true,
            animation: true
          },
          insights: [
            'Amount discrepancies are the most common type',
            'Date discrepancies require attention',
            'Description mismatches are frequent but low severity'
          ],
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'chart-004',
          name: 'Data Flow Sankey',
          type: 'sankey',
          data: [
            { source: 'Ingestion', target: 'Validation', value: 1000 },
            { source: 'Validation', target: 'Reconciliation', value: 950 },
            { source: 'Reconciliation', target: 'Matched', value: 890 },
            { source: 'Reconciliation', target: 'Discrepancy', value: 60 },
            { source: 'Discrepancy', target: 'Resolved', value: 45 },
            { source: 'Discrepancy', target: 'Escalated', value: 15 }
          ],
          config: {
            title: 'Data Processing Flow',
            color: '#8B5CF6',
            showLegend: true,
            animation: true
          },
          insights: [
            '95% of records pass validation',
            '89% achieve automatic matching',
            '6% require manual intervention',
            '75% of discrepancies are resolved'
          ],
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'chart-005',
          name: 'Performance Heatmap',
          type: 'heatmap',
          data: [
            { day: 'Monday', hour: 9, performance: 85 },
            { day: 'Monday', hour: 10, performance: 92 },
            { day: 'Monday', hour: 11, performance: 88 },
            { day: 'Tuesday', hour: 9, performance: 90 },
            { day: 'Tuesday', hour: 10, performance: 95 },
            { day: 'Tuesday', hour: 11, performance: 87 }
          ],
          config: {
            title: 'Performance by Day and Hour',
            color: '#F59E0B',
            showLegend: true,
            animation: true
          },
          insights: [
            'Tuesday 10 AM shows highest performance',
            'Monday mornings need optimization',
            'Consistent performance in late morning hours'
          ],
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'chart-006',
          name: 'Category Tree Map',
          type: 'treemap',
          data: [
            { name: 'Operational', value: 12500000, children: [
              { name: 'Field Operations', value: 7500000 },
              { name: 'Office Operations', value: 5000000 }
            ]},
            { name: 'Company', value: 9100000, children: [
              { name: 'Projects', value: 6000000 },
              { name: 'Tenders', value: 3100000 }
            ]},
            { name: 'Personal', value: 4300000, children: [
              { name: 'Family', value: 2800000 },
              { name: 'Personal', value: 1500000 }
            ]}
          ],
          config: {
            title: 'Expense Categories Hierarchy',
            color: '#06B6D4',
            showLegend: true,
            animation: true
          },
          insights: [
            'Field Operations dominate operational expenses',
            'Project-related company expenses are significant',
            'Family expenses are the largest personal category'
          ],
          lastUpdated: new Date().toISOString()
        }
      ]
      
      setCharts(sampleCharts)
      setIsLoading(false)
     }, 1500)
   }, [getReconciliationData, getCashflowData])

  // Initialize visualizations
  useEffect(() => {
    initializeVisualizations()
    onProgressUpdate?.('advanced_visualization_started')
   }, [currentProject, initializeVisualizations, onProgressUpdate])

  // Filter charts by type
  const filteredCharts = charts.filter(chart => 
    filterType === 'all' || chart.type === filterType
  )

  // Helper functions
  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="w-5 h-5" />
      case 'line':
        return <LineChart className="w-5 h-5" />
      case 'pie':
        return <PieChart className="w-5 h-5" />
      case 'area':
        return <TrendingUp className="w-5 h-5" />
      case 'scatter':
        return <Target className="w-5 h-5" />
      case 'heatmap':
        return <Activity className="w-5 h-5" />
      case 'sankey':
        return <Workflow className="w-5 h-5" />
      case 'treemap':
        return <Layers className="w-5 h-5" />
      default:
        return <BarChart3 className="w-5 h-5" />
    }
  }

  const getChartColor = (type: string) => {
    switch (type) {
      case 'line':
        return 'text-blue-600'
      case 'pie':
        return 'text-green-600'
      case 'bar':
        return 'text-red-600'
      case 'area':
        return 'text-purple-600'
      case 'scatter':
        return 'text-orange-600'
      case 'heatmap':
        return 'text-yellow-600'
      case 'sankey':
        return 'text-indigo-600'
      case 'treemap':
        return 'text-cyan-600'
      default:
        return 'text-gray-600'
    }
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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              Loading Visualizations
            </h3>
            <p className="text-secondary-600">
              Processing data and generating charts...
            </p>
          </div>
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
              Advanced Visualizations
            </h1>
            <p className="text-secondary-600">
              Interactive charts, graphs, and data visualizations for comprehensive analysis
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field"
            >
              <option value="all">All Types</option>
              <option value={CHART_CONFIG.TYPES.BAR}>Bar Charts</option>
              <option value={CHART_CONFIG.TYPES.LINE}>Line Charts</option>
              <option value={CHART_CONFIG.TYPES.PIE}>Pie Charts</option>
              <option value={CHART_CONFIG.TYPES.AREA}>Area Charts</option>
              <option value={CHART_CONFIG.TYPES.SCATTER}>Scatter Plots</option>
              <option value={CHART_CONFIG.TYPES.HEATMAP}>Heatmaps</option>
              <option value={CHART_CONFIG.TYPES.SANKEY}>Sankey Diagrams</option>
              <option value={CHART_CONFIG.TYPES.TREEMAP}>Tree Maps</option>
            </select>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="btn-secondary flex items-center space-x-2"
            >
              {viewMode === 'grid' ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              <span>{viewMode === 'grid' ? 'List' : 'Grid'}</span>
            </button>
            <button
              onClick={initializeVisualizations}
              className="btn-primary flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        {project && (
          <div className="text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg inline-block">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* Charts Grid/List */}
      <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
        {filteredCharts.map((chart) => (
          <div key={chart.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getChartColor(chart.type)}`}>
                  {getChartIcon(chart.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900">{chart.name}</h3>
                  <p className="text-sm text-secondary-600">{chart.config.title}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedChart(chart)
                  setShowChartModal(true)
                }}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* Chart Placeholder */}
            <div className="h-48 bg-secondary-50 rounded-lg flex items-center justify-center mb-4">
              <div className="text-center">
                <div className={`w-12 h-12 mx-auto mb-2 ${getChartColor(chart.type)}`}>
                  {getChartIcon(chart.type)}
                </div>
                <p className="text-sm text-secondary-600">
                  {chart.type.charAt(0).toUpperCase() + chart.type.slice(1)} Chart
                </p>
                <p className="text-xs text-secondary-500">
                  {chart.data.length} data points
                </p>
              </div>
            </div>

            {/* Insights */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-secondary-900">Key Insights:</h4>
              <ul className="space-y-1">
                {chart.insights.slice(0, 2).map((insight, index) => (
                  <li key={index} className="text-xs text-secondary-600 flex items-start space-x-1">
                    <span className="text-primary-600 mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 pt-4 border-t border-secondary-200">
              <div className="flex items-center justify-between text-xs text-secondary-500">
                <span>Updated: {new Date(chart.lastUpdated).toLocaleDateString()}</span>
                <button className="text-primary-600 hover:text-primary-700">
                  <Download className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Detail Modal */}
      {showChartModal && selectedChart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-secondary-900">
                {selectedChart.name}
              </h3>
              <button
                onClick={() => setShowChartModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Full Chart Visualization */}
            <div className="h-96 bg-secondary-50 rounded-lg flex items-center justify-center mb-6">
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 ${getChartColor(selectedChart.type)}`}>
                  {getChartIcon(selectedChart.type)}
                </div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-2">
                  {selectedChart.config.title}
                </h4>
                <p className="text-secondary-600 mb-4">
                  Interactive {selectedChart.type} chart would be rendered here
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-secondary-600">Data Points</div>
                    <div className="font-semibold text-secondary-900">{selectedChart.data.length}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-secondary-600">Chart Type</div>
                    <div className="font-semibold text-secondary-900 capitalize">{selectedChart.type}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-secondary-600">Animation</div>
                    <div className="font-semibold text-secondary-900">
                      {selectedChart.config.animation ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-secondary-600">Legend</div>
                    <div className="font-semibold text-secondary-900">
                      {selectedChart.config.showLegend ? 'Visible' : 'Hidden'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-secondary-900 mb-4">Data Points</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-secondary-200">
                      {Object.keys(selectedChart.data[0] || {}).map((key) => (
                        <th key={key} className="text-left py-2 px-3 font-medium text-secondary-600">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedChart.data.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-b border-secondary-100">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="py-2 px-3 text-secondary-900">
                            {typeof value === 'number' && value > 1000000 
                              ? formatCurrency(value)
                              : typeof value === 'number' && value < 1
                              ? formatPercentage(value * 100)
                              : String(value)
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Insights */}
            <div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-4">Detailed Insights</h4>
              <div className="space-y-3">
                {selectedChart.insights.map((insight, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedVisualization



