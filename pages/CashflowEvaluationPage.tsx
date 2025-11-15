'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Filter,
  Search,
  Download,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  FileText,
  Calculator,
  Target,
  Activity,
  Zap,
  Shield,
  AlertCircle,
  Info,
  Eye,
  Edit,
  Trash2,
  Plus,
  Minus,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Users,
  Clock,
  Hash,
  Type,
  MapPin,
  Layers,
  Workflow,
  MessageSquare,
  Bell,
  Star,
  Bookmark,
  Share2,
  Copy,
  ExternalLink,
  Database,
  Cloud,
  Server,
  Wifi,
  Lock,
  Unlock,
  Key,
  Globe,
  Mail,
  Phone,
  User,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  Crown,
  Award,
  Trophy,
  Medal,
  Flag,
  Tag,
  Folder,
  File,
  FileCheck,
  FileX,
  FilePlus,
  FileMinus,
  FileEdit,
  FileSearch,
  X,
  Building2 as Building
} from 'lucide-react'
import { useData } from '../components/DataProvider'

// Enhanced Interfaces for Cashflow Evaluation
interface ExpenseCategory {
  id: string
  name: string
  description: string
  color: string
  icon: React.ReactNode
  totalReported: number
  totalCashflow: number
  discrepancy: number
  discrepancyPercentage: number
  transactionCount: number
  lastUpdated: string
  status: 'balanced' | 'discrepancy' | 'missing' | 'excess'
  subcategories: ExpenseSubcategory[]
}

interface ExpenseSubcategory {
  id: string
  name: string
  reportedAmount: number
  cashflowAmount: number
  discrepancy: number
  transactions: ExpenseTransaction[]
}

interface ExpenseTransaction {
  id: string
  date: string
  description: string
  reportedAmount: number
  cashflowAmount: number
  discrepancy: number
  source: 'journal' | 'bank_statement' | 'both'
  status: 'matched' | 'discrepancy' | 'missing' | 'excess'
  reference: string
  category: string
  subcategory: string
}

interface CashflowMetrics {
  totalReportedExpenses: number
  totalCashflowExpenses: number
  totalDiscrepancy: number
  discrepancyPercentage: number
  balancedCategories: number
  discrepancyCategories: number
  missingTransactions: number
  excessTransactions: number
  averageDiscrepancy: number
  largestDiscrepancy: number
  lastReconciliationDate: string
  dataQualityScore: number
}

interface FilterConfig {
  field: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn'
  value: any
  value2?: any
  active: boolean
}

interface CashflowEvaluationPageProps {
  project: any
  onProgressUpdate?: (step: string) => void
}

const CashflowEvaluationPage = ({ project, onProgressUpdate }: CashflowEvaluationPageProps) => {
  const { currentProject, getCashflowData, transformReconciliationToCashflow } = useData()
  // State Management
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [metrics, setMetrics] = useState<CashflowMetrics | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [filters, setFilters] = useState<FilterConfig[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'chart'>('cards')
  const [showFilters, setShowFilters] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [dateRange, setDateRange] = useState({
    start: '2020-01-01',
    end: '2020-12-31'
  })

  // Initialize data from data management system
  useEffect(() => {
    const cashflowData = getCashflowData()
    
    if (cashflowData && cashflowData.categories.length > 0) {
      // Use real data from data management system
      setExpenseCategories(cashflowData.categories)
      setMetrics(cashflowData.metrics)
    } else {
      // Fallback to sample data if no real data available
      initializeSampleData()
    }
    
    onProgressUpdate?.('cashflow_evaluation_started')
   }, [currentProject, getCashflowData, onProgressUpdate])

  const initializeSampleData = () => {
    const sampleCategories: ExpenseCategory[] = [
      {
        id: 'operational',
        name: 'Operational Expenses',
        description: 'Day-to-day operational costs and field expenses',
        color: 'blue',
        icon: <Activity className="w-6 h-6" />,
        totalReported: 15750000,
        totalCashflow: 15200000,
        discrepancy: -550000,
        discrepancyPercentage: -3.49,
        transactionCount: 45,
        lastUpdated: '2020-12-31T23:59:59Z',
        status: 'discrepancy',
        subcategories: [
          {
            id: 'kas-lapangan',
            name: 'Kas & Lapangan',
            reportedAmount: 8500000,
            cashflowAmount: 8200000,
            discrepancy: -300000,
            transactions: [
              {
                id: 'op-001',
                date: '2020-01-15',
                description: 'BIAYA FALDY OPERASIONAL URUSAN DI AMBON',
                reportedAmount: 2000000,
                cashflowAmount: 2000000,
                discrepancy: 0,
                source: 'both',
                status: 'matched',
                reference: '134',
                category: 'Operational',
                subcategory: 'Kas & Lapangan'
              },
              {
                id: 'op-002',
                date: '2020-01-30',
                description: 'BIAYA OPERASIONAL FALDI',
                reportedAmount: 1000000,
                cashflowAmount: 1000000,
                discrepancy: 0,
                source: 'both',
                status: 'matched',
                reference: '252',
                category: 'Operational',
                subcategory: 'Kas & Lapangan'
              }
            ]
          },
          {
            id: 'tunai',
            name: 'Tunai',
            reportedAmount: 7250000,
            cashflowAmount: 7000000,
            discrepancy: -250000,
            transactions: [
              {
                id: 'op-003',
                date: '2020-01-21',
                description: 'PENGAMBILAN CASH UNTUK OPS DIJKT ALDI',
                reportedAmount: 500000,
                cashflowAmount: 500000,
                discrepancy: 0,
                source: 'both',
                status: 'matched',
                reference: '181',
                category: 'Operational',
                subcategory: 'Tunai'
              }
            ]
          }
        ]
      },
      {
        id: 'perusahaan',
        name: 'Company Expenses',
        description: 'Business-related expenses including tenders and projects',
        color: 'green',
        icon: <Building className="w-6 h-6" />,
        totalReported: 28500000,
        totalCashflow: 28000000,
        discrepancy: -500000,
        discrepancyPercentage: -1.75,
        transactionCount: 23,
        lastUpdated: '2020-12-31T23:59:59Z',
        status: 'discrepancy',
        subcategories: [
          {
            id: 'lelang',
            name: 'Lelang',
            reportedAmount: 20000000,
            cashflowAmount: 19500000,
            discrepancy: -500000,
            transactions: [
              {
                id: 'comp-001',
                date: '2020-01-31',
                description: 'BIAYA TENDER KO HENGKY JAM,PEN, DAN SKA',
                reportedAmount: 15000000,
                cashflowAmount: 15000000,
                discrepancy: 0,
                source: 'both',
                status: 'matched',
                reference: '194',
                category: 'Company',
                subcategory: 'Lelang'
              }
            ]
          },
          {
            id: 'akomodasi',
            name: 'Akomodasi',
            reportedAmount: 8500000,
            cashflowAmount: 8500000,
            discrepancy: 0,
            transactions: [
              {
                id: 'comp-002',
                date: '2020-01-24',
                description: 'BIAYA JJN TIKET AEU ABO AMQ MNADO',
                reportedAmount: 1581000,
                cashflowAmount: 1581000,
                discrepancy: 0,
                source: 'both',
                status: 'matched',
                reference: '221',
                category: 'Company',
                subcategory: 'Akomodasi'
              }
            ]
          }
        ]
      },
      {
        id: 'personal',
        name: 'Personal Expenses',
        description: 'Personal and family-related expenses',
        color: 'purple',
        icon: <User className="w-6 h-6" />,
        totalReported: 30000000,
        totalCashflow: 30000000,
        discrepancy: 0,
        discrepancyPercentage: 0,
        transactionCount: 2,
        lastUpdated: '2020-12-31T23:59:59Z',
        status: 'balanced',
        subcategories: [
          {
            id: 'keluarga',
            name: 'Keluarga',
            reportedAmount: 30000000,
            cashflowAmount: 30000000,
            discrepancy: 0,
            transactions: [
              {
                id: 'per-001',
                date: '2020-01-24',
                description: 'FALDI CANDIKA ARWA',
                reportedAmount: 30000000,
                cashflowAmount: 30000000,
                discrepancy: 0,
                source: 'both',
                status: 'matched',
                reference: '217',
                category: 'Personal',
                subcategory: 'Keluarga'
              }
            ]
          }
        ]
      },
      {
        id: 'utilities',
        name: 'Utilities & Services',
        description: 'Phone, internet, and utility expenses',
        color: 'orange',
        icon: <Wifi className="w-6 h-6" />,
        totalReported: 350000,
        totalCashflow: 350000,
        discrepancy: 0,
        discrepancyPercentage: 0,
        transactionCount: 2,
        lastUpdated: '2020-12-31T23:59:59Z',
        status: 'balanced',
        subcategories: [
          {
            id: 'emoney',
            name: 'E-Money',
            reportedAmount: 350000,
            cashflowAmount: 350000,
            discrepancy: 0,
            transactions: [
              {
                id: 'util-001',
                date: '2020-01-19',
                description: 'BIAYA PULSA OPS ALDI',
                reportedAmount: 150000,
                cashflowAmount: 150000,
                discrepancy: 0,
                source: 'both',
                status: 'matched',
                reference: '128',
                category: 'Utilities',
                subcategory: 'E-Money'
              }
            ]
          }
        ]
      }
    ]

    setExpenseCategories(sampleCategories)

    // Calculate metrics
    const calculatedMetrics: CashflowMetrics = {
      totalReportedExpenses: sampleCategories.reduce((sum, cat) => sum + cat.totalReported, 0),
      totalCashflowExpenses: sampleCategories.reduce((sum, cat) => sum + cat.totalCashflow, 0),
      totalDiscrepancy: sampleCategories.reduce((sum, cat) => sum + cat.discrepancy, 0),
      discrepancyPercentage: 0,
      balancedCategories: sampleCategories.filter(cat => cat.status === 'balanced').length,
      discrepancyCategories: sampleCategories.filter(cat => cat.status === 'discrepancy').length,
      missingTransactions: 0,
      excessTransactions: 0,
      averageDiscrepancy: 0,
      largestDiscrepancy: Math.max(...sampleCategories.map(cat => Math.abs(cat.discrepancy))),
      lastReconciliationDate: '2020-12-31T23:59:59Z',
      dataQualityScore: 95.5
    }

    calculatedMetrics.discrepancyPercentage = (calculatedMetrics.totalDiscrepancy / calculatedMetrics.totalReportedExpenses) * 100
    calculatedMetrics.averageDiscrepancy = calculatedMetrics.totalDiscrepancy / sampleCategories.length

    setMetrics(calculatedMetrics)
  }

  // Filtered categories based on search and filters
  const filteredCategories = useMemo(() => {
    let filtered = expenseCategories

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.subcategories.some(sub => 
          sub.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply active filters
    filters.forEach(filter => {
      if (!filter.active) return
      
      filtered = filtered.filter(category => {
        const value = getNestedValue(category, filter.field)
        switch (filter.operator) {
          case 'equals':
            return value === filter.value
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase())
          case 'greaterThan':
            return Number(value) > Number(filter.value)
          case 'lessThan':
            return Number(value) < Number(filter.value)
          case 'between':
            return Number(value) >= Number(filter.value) && Number(value) <= Number(filter.value2)
          default:
            return true
        }
      })
    })

    return filtered
  }, [expenseCategories, searchTerm, filters])

  // Helper functions
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'balanced':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'discrepancy':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'missing':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'excess':
        return <TrendingUp className="w-5 h-5 text-blue-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'balanced':
        return 'bg-green-100 text-green-800'
      case 'discrepancy':
        return 'bg-yellow-100 text-yellow-800'
      case 'missing':
        return 'bg-red-100 text-red-800'
      case 'excess':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500'
      case 'green':
        return 'bg-green-500'
      case 'purple':
        return 'bg-purple-500'
      case 'orange':
        return 'bg-orange-500'
      case 'red':
        return 'bg-red-500'
      case 'yellow':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`
  }

  const handleCategoryClick = (category: ExpenseCategory) => {
    setSelectedCategory(category)
    setShowCategoryModal(true)
  }

  const runDiscrepancyAnalysis = async () => {
    setIsProcessing(true)
    setProcessingProgress(0)
    
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 15, 100)
        if (newProgress >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          
          // Transform reconciliation data to cashflow analysis
          if (currentProject) {
            const updatedProject = transformReconciliationToCashflow(currentProject.id)
            if (updatedProject) {
              const cashflowData = updatedProject.cashflowData
              setExpenseCategories(cashflowData.categories)
              setMetrics(cashflowData.metrics)
              console.log('Cashflow analysis completed:', cashflowData)
            }
          }
          
          onProgressUpdate?.('discrepancy_analysis_completed')
        }
        return newProgress
      })
    }, 300)
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Cashflow Evaluation Balance Sheet
            </h1>
            <p className="text-secondary-600">
              Analyze expense discrepancies between reported journal entries and actual cashflows
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={runDiscrepancyAnalysis}
              className="btn-secondary flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Run Analysis</span>
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

      {/* Metrics Dashboard */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Reported</p>
                <p className="text-2xl font-bold text-secondary-900">{formatCurrency(metrics.totalReportedExpenses)}</p>
                <p className="text-xs text-secondary-500">Journal entries</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Cashflow</p>
                <p className="text-2xl font-bold text-secondary-900">{formatCurrency(metrics.totalCashflowExpenses)}</p>
                <p className="text-xs text-secondary-500">Bank statements</p>
              </div>
              <Database className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Discrepancy</p>
                <p className={`text-2xl font-bold ${metrics.totalDiscrepancy < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(metrics.totalDiscrepancy)}
                </p>
                <p className="text-xs text-secondary-500">{formatPercentage(metrics.discrepancyPercentage)}</p>
              </div>
              <Calculator className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Data Quality</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.dataQualityScore}%</p>
                <p className="text-xs text-secondary-500">Accuracy score</p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Status Distribution */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-green-600">{metrics.balancedCategories}</p>
            <p className="text-xs text-secondary-600">Balanced Categories</p>
          </div>
          <div className="card text-center">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-yellow-600">{metrics.discrepancyCategories}</p>
            <p className="text-xs text-secondary-600">Discrepancy Categories</p>
          </div>
          <div className="card text-center">
            <TrendingDown className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-red-600">{metrics.missingTransactions}</p>
            <p className="text-xs text-secondary-600">Missing Transactions</p>
          </div>
          <div className="card text-center">
            <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-blue-600">{metrics.excessTransactions}</p>
            <p className="text-xs text-secondary-600">Excess Transactions</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search categories, subcategories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full sm:w-64"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center space-x-2 ${filters.some(f => f.active) ? 'bg-primary-100 text-primary-700' : ''}`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {filters.filter(f => f.active).length > 0 && (
                <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                  {filters.filter(f => f.active).length}
                </span>
              )}
            </button>

            <div className="flex items-center space-x-1 bg-secondary-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded ${viewMode === 'cards' ? 'bg-white shadow-sm' : 'hover:bg-secondary-200'}`}
                title="Card view"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-secondary-200'}`}
                title="Table view"
              >
                <Hash className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`p-2 rounded ${viewMode === 'chart' ? 'bg-white shadow-sm' : 'hover:bg-secondary-200'}`}
                title="Chart view"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-secondary-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-secondary-900">Advanced Filters</h4>
                <button
                  onClick={() => setFilters([])}
                  className="btn-secondary text-sm flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              </div>

              {/* Quick Filters */}
              <div className="border-t border-secondary-200 pt-4">
                <h5 className="font-medium text-secondary-900 mb-2">Quick Filters</h5>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setFilters([{
                        field: 'status',
                        operator: 'equals',
                        value: 'balanced',
                        active: true
                      }])
                    }}
                    className="btn-secondary text-xs"
                  >
                    Balanced Only
                  </button>
                  <button
                    onClick={() => {
                      setFilters([{
                        field: 'status',
                        operator: 'equals',
                        value: 'discrepancy',
                        active: true
                      }])
                    }}
                    className="btn-secondary text-xs"
                  >
                    Discrepancies Only
                  </button>
                  <button
                    onClick={() => {
                      setFilters([{
                        field: 'discrepancy',
                        operator: 'greaterThan',
                        value: 0,
                        active: true
                      }])
                    }}
                    className="btn-secondary text-xs"
                  >
                    Positive Discrepancies
                  </button>
                  <button
                    onClick={() => {
                      setFilters([{
                        field: 'discrepancy',
                        operator: 'lessThan',
                        value: 0,
                        active: true
                      }])
                    }}
                    className="btn-secondary text-xs"
                  >
                    Negative Discrepancies
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expense Categories Cards */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCategoryClick(category)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(category.color)} text-white`}>
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900">{category.name}</h3>
                    <p className="text-sm text-secondary-600">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(category.status)}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(category.status)}`}>
                    {category.status.charAt(0).toUpperCase() + category.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-secondary-600">Reported:</span>
                  <span className="text-sm font-semibold text-secondary-900">{formatCurrency(category.totalReported)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-secondary-600">Cashflow:</span>
                  <span className="text-sm font-semibold text-secondary-900">{formatCurrency(category.totalCashflow)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-secondary-600">Discrepancy:</span>
                  <span className={`text-sm font-semibold ${category.discrepancy < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(category.discrepancy)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-secondary-600">Percentage:</span>
                  <span className={`text-sm font-semibold ${category.discrepancyPercentage < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatPercentage(category.discrepancyPercentage)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-secondary-200">
                <div className="flex justify-between items-center text-sm text-secondary-500">
                  <span>{category.transactionCount} transactions</span>
                  <span>{category.subcategories.length} subcategories</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">Reported</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">Cashflow</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">Discrepancy</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">Percentage</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">Transactions</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-1 rounded ${getCategoryColor(category.color)} text-white`}>
                          {category.icon}
                        </div>
                        <div>
                          <div className="font-medium text-secondary-900">{category.name}</div>
                          <div className="text-sm text-secondary-500">{category.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(category.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(category.status)}`}>
                          {category.status.charAt(0).toUpperCase() + category.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-semibold text-secondary-900">{formatCurrency(category.totalReported)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-semibold text-secondary-900">{formatCurrency(category.totalCashflow)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-sm font-semibold ${category.discrepancy < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(category.discrepancy)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-sm font-semibold ${category.discrepancyPercentage < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatPercentage(category.discrepancyPercentage)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-secondary-600">{category.transactionCount}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleCategoryClick(category)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-secondary-600 hover:text-secondary-700 text-sm font-medium"
                          title="Edit category"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Discrepancy Analysis</h3>
            <div className="h-64 flex items-center justify-center bg-secondary-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
                <p className="text-secondary-600">Chart visualization would be implemented here</p>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Category Distribution</h3>
            <div className="h-64 flex items-center justify-center bg-secondary-50 rounded-lg">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
                <p className="text-secondary-600">Pie chart visualization would be implemented here</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Analyzing Discrepancies
              </h3>
              <p className="text-secondary-600 mb-4">
                Running cashflow analysis algorithms...
              </p>
              <div className="w-full bg-secondary-200 rounded-full h-2 mb-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p className="text-sm text-secondary-500">
                {Math.round(processingProgress)}% complete
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category Detail Modal */}
      {showCategoryModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-secondary-900">
                {selectedCategory.name} - Detailed Analysis
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
                title="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Category Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <div className="card">
                  <h4 className="text-lg font-semibold text-secondary-900 mb-4">Category Overview</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Total Reported</label>
                      <p className="text-lg font-bold text-secondary-900">{formatCurrency(selectedCategory.totalReported)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Total Cashflow</label>
                      <p className="text-lg font-bold text-secondary-900">{formatCurrency(selectedCategory.totalCashflow)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Discrepancy</label>
                      <p className={`text-lg font-bold ${selectedCategory.discrepancy < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(selectedCategory.discrepancy)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Status</label>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedCategory.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedCategory.status)}`}>
                          {selectedCategory.status.charAt(0).toUpperCase() + selectedCategory.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h4>
                <div className="space-y-2">
                  <button className="w-full btn-primary text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolve Discrepancy
                  </button>
                  <button className="w-full btn-secondary text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Flag for Review
                  </button>
                  <button className="w-full btn-secondary text-sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Category
                  </button>
                  <button className="w-full btn-secondary text-sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export Details
                  </button>
                </div>
              </div>
            </div>

            {/* Subcategories */}
            <div className="card mb-6">
              <h4 className="text-lg font-semibold text-secondary-900 mb-4">Subcategories Breakdown</h4>
              <div className="space-y-4">
                {selectedCategory.subcategories.map((subcategory, index) => (
                  <div key={index} className="border border-secondary-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-secondary-900">{subcategory.name}</h5>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-secondary-500">
                          Reported: {formatCurrency(subcategory.reportedAmount)}
                        </span>
                        <span className="text-sm text-secondary-500">
                          Cashflow: {formatCurrency(subcategory.cashflowAmount)}
                        </span>
                        <span className={`text-sm font-semibold ${subcategory.discrepancy < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          Discrepancy: {formatCurrency(subcategory.discrepancy)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {subcategory.transactions.map((transaction, tIndex) => (
                        <div key={tIndex} className="flex items-center justify-between p-2 bg-secondary-50 rounded">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${
                              transaction.status === 'matched' ? 'bg-green-500' :
                              transaction.status === 'discrepancy' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <div>
                              <div className="text-sm font-medium text-secondary-900">{transaction.description}</div>
                              <div className="text-xs text-secondary-500">{transaction.date} • {transaction.reference}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-secondary-600">{formatCurrency(transaction.reportedAmount)}</span>
                            <span className="text-sm text-secondary-600">{formatCurrency(transaction.cashflowAmount)}</span>
                            <span className={`text-sm font-semibold ${transaction.discrepancy < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(transaction.discrepancy)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
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

export default CashflowEvaluationPage

