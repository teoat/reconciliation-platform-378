'use client'
import { logger } from '@/services/logger'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { BarChart3 } from 'lucide-react'
import { PieChart } from 'lucide-react'
import { TrendingUp } from 'lucide-react'
import { TrendingDown } from 'lucide-react'
import { Activity } from 'lucide-react'
import { Target } from 'lucide-react'
import { Clock } from 'lucide-react'
import { Shield } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { CheckCircle } from 'lucide-react'
import { XCircle } from 'lucide-react'
import { AlertTriangle } from 'lucide-react'
import { Users } from 'lucide-react'
import { Database } from 'lucide-react'
import { Zap } from 'lucide-react'
import { Star } from 'lucide-react'
import { Award } from 'lucide-react'
import { Trophy } from 'lucide-react'
import { Medal } from 'lucide-react'
import { Flag } from 'lucide-react'
import { Tag } from 'lucide-react'
import { Calendar } from 'lucide-react'
import { DollarSign } from 'lucide-react'
import { Hash } from 'lucide-react'
import { Type } from 'lucide-react'
import { Eye } from 'lucide-react'
import { EyeOff } from 'lucide-react'
import { RefreshCw } from 'lucide-react'
import { Settings } from 'lucide-react'
import { Filter } from 'lucide-react'
import { Search } from 'lucide-react'
import { Plus } from 'lucide-react'
import { Minus } from 'lucide-react'
import { ArrowUpDown } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { ChevronUp } from 'lucide-react'
import { ChevronLeft } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'
import { Info } from 'lucide-react'
import { CheckSquare } from 'lucide-react'
import { Square } from 'lucide-react'
import { Lock } from 'lucide-react'
import { Unlock } from 'lucide-react'
import { Key } from 'lucide-react'
import { Globe } from 'lucide-react'
import { Mail } from 'lucide-react'
import { Phone } from 'lucide-react'
import { User } from 'lucide-react'
import { UserCheck } from 'lucide-react'
import { UserX } from 'lucide-react'
import { UserPlus } from 'lucide-react'
import { UserMinus } from 'lucide-react'
import { Crown } from 'lucide-react'
import { Bell } from 'lucide-react'
import { BellOff } from 'lucide-react'
import { Bookmark } from 'lucide-react'
import { Share2 } from 'lucide-react'
import { ExternalLink } from 'lucide-react'
import { File } from 'lucide-react'
import { FileCheck } from 'lucide-react'
import { FileX } from 'lucide-react'
import { FilePlus } from 'lucide-react'
import { FileMinus } from 'lucide-react'
import { FileEdit } from 'lucide-react'
import { FileSearch } from 'lucide-react'
import { Download } from 'lucide-react'
import { Upload } from 'lucide-react'
import { FileArchive } from 'lucide-react'
import { FileImage } from 'lucide-react'
import { FileVideo } from 'lucide-react'
import { FileAudio } from 'lucide-react'
import { FileText } from 'lucide-react'
import { FileSpreadsheet } from 'lucide-react'
import { FileCode } from 'lucide-react'
import { FileJson } from 'lucide-react'
import { X } from 'lucide-react'

// Temporary stub types and class until indonesianDataProcessor module is implemented
type ProcessedExpenseRecord = any;
type ProcessedBankRecord = any;
type IndonesianMatchingResult = any;
class IndonesianDataProcessor {
  /**
   * @deprecated Stub implementation. Not yet implemented.
   */
  static processExpensesData(data: any[]): any[] {
    throw new Error('IndonesianDataProcessor.processExpensesData is not yet implemented.');
  }
  /**
   * @deprecated Stub implementation. Not yet implemented.
   */
  static processBankData(data: any[]): any[] {
    throw new Error('IndonesianDataProcessor.processBankData is not yet implemented.');
  }
  /**
   * @deprecated Stub implementation. Not yet implemented.
   */
  static matchRecords(expenses: any[], bank: any[]): any[] {
    throw new Error('IndonesianDataProcessor.matchRecords is not yet implemented.');
  }
  /**
   * @deprecated Stub implementation. Not yet implemented.
   */
  static batchMatchRecords(expenses: any[], bank: any[]): any[] {
    throw new Error('IndonesianDataProcessor.batchMatchRecords is not yet implemented.');
  }
  /**
   * @deprecated Stub implementation. Not yet implemented.
   */
  static generateSummary(expenses: any[], bank: any[], matches: any[]): any {
    throw new Error('IndonesianDataProcessor.generateSummary is not yet implemented.');
  }
  /**
   * @deprecated Stub implementation. Not yet implemented.
   */
  static generateReconciliationSummary(expenses: any[], bank: any[], matches: any[]): any {
    throw new Error('IndonesianDataProcessor.generateReconciliationSummary is not yet implemented.');
  }
}

interface DataAnalysisProps {
  isVisible: boolean
  onClose: () => void
  expensesData?: any[]
  bankData?: any[]
}

const DataAnalysis: React.FC<DataAnalysisProps> = ({
  isVisible,
  onClose,
  expensesData = [],
  bankData = []
}) => {
  const [processedExpenses, setProcessedExpenses] = useState<ProcessedExpenseRecord[]>([])
  const [processedBankRecords, setProcessedBankRecords] = useState<ProcessedBankRecord[]>([])
  const [matches, setMatches] = useState<Array<{
    expense: ProcessedExpenseRecord
    bank: ProcessedBankRecord
    match: IndonesianMatchingResult
  }>>([])
  const [summary, setSummary] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<'overview' | 'matching' | 'categories' | 'timeline'>('overview')

  // Process data when component mounts or data changes
  const processData = useCallback(async () => {
    setIsProcessing(true)
    setProcessingProgress(0)

    try {
      // Process expenses data
      if (expensesData.length > 0) {
        setProcessingProgress(25)
        const processedExpenses = IndonesianDataProcessor.processExpensesData(expensesData)
        setProcessedExpenses(processedExpenses)
      }

      // Process bank data
      if (bankData.length > 0) {
        setProcessingProgress(50)
        const processedBankRecords = IndonesianDataProcessor.processBankData(bankData)
        setProcessedBankRecords(processedBankRecords)
      }

      // Perform matching
      if (processedExpenses.length > 0 && processedBankRecords.length > 0) {
        setProcessingProgress(75)
        const matches = IndonesianDataProcessor.batchMatchRecords(processedExpenses, processedBankRecords)
        setMatches(matches)
      }

      // Generate summary
      setProcessingProgress(90)
      const summary = IndonesianDataProcessor.generateReconciliationSummary(
        processedExpenses,
        processedBankRecords,
        matches
      )
      setSummary(summary)

      setProcessingProgress(100)
    } catch (error) {
      logger.error('Error processing data:', error)
     } finally {
       setIsProcessing(false)
     }
   }, [expensesData, bankData, matches, processedBankRecords, processedExpenses])

  useEffect(() => {
    if (expensesData.length > 0 || bankData.length > 0) {
      processData()
    }
   }, [expensesData, bankData, processData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600'
    if (confidence >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceBgColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-100'
    if (confidence >= 70) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-secondary-900">
              Indonesian Data Analysis
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={processData}
              disabled={isProcessing}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Refresh Analysis</span>
            </button>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <div className="p-6 border-b border-secondary-200">
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-secondary-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <span className="text-sm text-secondary-600">
                {Math.round(processingProgress)}% complete
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-secondary-200">
          <nav className="flex space-x-8 px-6">
            {([
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'matching', label: 'Matching Results', icon: Target },
              { id: 'categories', label: 'Categories', icon: Tag },
              { id: 'timeline', label: 'Timeline', icon: Calendar }
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && summary && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-secondary-900">
                        {formatNumber(summary.summary.totalExpenses)}
                      </p>
                      <p className="text-xs text-secondary-500">
                        {formatCurrency(summary.summary.totalExpenseAmount)}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Bank Transactions</p>
                      <p className="text-2xl font-bold text-secondary-900">
                        {formatNumber(summary.summary.totalBankRecords)}
                      </p>
                      <p className="text-xs text-secondary-500">
                        {formatCurrency(summary.summary.totalBankAmount)}
                      </p>
                    </div>
                    <Database className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Match Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {summary.summary.matchRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-secondary-500">
                        {formatNumber(summary.summary.matchedRecords)} matched
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Avg Confidence</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {summary.quality.averageConfidence.toFixed(1)}%
                      </p>
                      <p className="text-xs text-secondary-500">
                        High quality matches
                      </p>
                    </div>
                    <Shield className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Matching Quality Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Matching Quality</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-secondary-700">High Confidence (≥90%)</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">
                        {summary.quality.highConfidenceMatches}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-medium text-secondary-700">Medium Confidence (70-89%)</span>
                      </div>
                      <span className="text-sm font-bold text-yellow-600">
                        {summary.quality.mediumConfidenceMatches}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-secondary-700">Low Confidence (&lt;70%)</span>
                      </div>
                      <span className="text-sm font-bold text-red-600">
                        {summary.quality.lowConfidenceMatches}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Unmatched Records</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">Unmatched Expenses</span>
                      <span className="text-sm font-bold text-red-600">
                        {formatNumber(summary.summary.unmatchedExpenses)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">Unmatched Bank Records</span>
                      <span className="text-sm font-bold text-red-600">
                        {formatNumber(summary.summary.unmatchedBankRecords)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">Discrepancy Amount</span>
                      <span className="text-sm font-bold text-orange-600">
                        {formatCurrency(summary.summary.discrepancyAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Matching Results Tab */}
          {activeTab === 'matching' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Matching Results</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary-200">
                        <th className="text-left py-3 px-4 font-medium text-secondary-700">Expense</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-700">Bank Transaction</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-700">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-700">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-700">Confidence</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-700">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.slice(0, 20).map((match, index) => (
                        <tr key={index} className="border-b border-secondary-100 hover:bg-secondary-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-secondary-900">{match.expense.id}</div>
                              <div className="text-sm text-secondary-600 truncate max-w-32">
                                {match.expense.description}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-secondary-900">{match.bank.id}</div>
                              <div className="text-sm text-secondary-600 truncate max-w-32">
                                {match.bank.description}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-medium text-secondary-900">
                              {formatCurrency(match.expense.amount)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-secondary-600">
                              {match.expense.date}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-secondary-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    match.match.confidence >= 90 ? 'bg-green-500' :
                                    match.match.confidence >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${match.match.confidence}%` }}
                                />
                              </div>
                              <span className={`text-sm font-medium ${getConfidenceColor(match.match.confidence)}`}>
                                {match.match.confidence}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <button className="text-primary-600 hover:text-primary-700 text-sm">
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && summary && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Expense Categories</h3>
                  <div className="space-y-3">
                    {Object.entries(summary.categories.expenses).slice(0, 10).map(([category, data]: [string, any]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-secondary-700">{category}</span>
                          <div className="text-xs text-secondary-500">{data.count} records</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-secondary-900">
                            {formatCurrency(data.totalAmount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Bank Transaction Categories</h3>
                  <div className="space-y-3">
                    {Object.entries(summary.categories.bankRecords).slice(0, 10).map(([category, data]: [string, any]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-secondary-700">{category}</span>
                          <div className="text-xs text-secondary-500">{data.count} records</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-secondary-900">
                            {formatCurrency(data.totalAmount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Timeline Analysis</h3>
                <div className="h-64 flex items-center justify-center bg-secondary-50 rounded-lg">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
                    <p className="text-secondary-600">Timeline visualization would go here</p>
                    <p className="text-sm text-secondary-500">Using Chart.js or similar library</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-6 border-t border-secondary-200">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Analysis</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DataAnalysis
