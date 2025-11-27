'use client'

import { useState } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Download,
  Eye,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface ReconciliationSummary {
  id: string
  category: string
  totalRecords: number
  matchedRecords: number
  unmatchedRecords: number
  discrepancyRecords: number
  totalAmount: number
  discrepancyAmount: number
  matchRate: number
  status: 'completed' | 'in_progress' | 'pending'
  lastUpdated: string
}

interface PresummaryPageProps {
  project?: any
}

const PresummaryPage = ({ project }: PresummaryPageProps = {}) => {
  const [summaries] = useState<ReconciliationSummary[]>([
    {
      id: '1',
      category: 'Payment Transactions',
      totalRecords: 1250,
      matchedRecords: 1080,
      unmatchedRecords: 120,
      discrepancyRecords: 50,
      totalAmount: 2500000,
      discrepancyAmount: 15000,
      matchRate: 86.4,
      status: 'completed',
      lastUpdated: '2023-12-15T14:30:00Z'
    },
    {
      id: '2',
      category: 'Customer Records',
      totalRecords: 850,
      matchedRecords: 820,
      unmatchedRecords: 20,
      discrepancyRecords: 10,
      totalAmount: 0,
      discrepancyAmount: 0,
      matchRate: 96.5,
      status: 'completed',
      lastUpdated: '2023-12-15T14:25:00Z'
    },
    {
      id: '3',
      category: 'Inventory Items',
      totalRecords: 2100,
      matchedRecords: 1950,
      unmatchedRecords: 100,
      discrepancyRecords: 50,
      totalAmount: 1800000,
      discrepancyAmount: 25000,
      matchRate: 92.9,
      status: 'in_progress',
      lastUpdated: '2023-12-15T14:20:00Z'
    },
    {
      id: '4',
      category: 'Financial Statements',
      totalRecords: 450,
      matchedRecords: 0,
      unmatchedRecords: 0,
      discrepancyRecords: 0,
      totalAmount: 0,
      discrepancyAmount: 0,
      matchRate: 0,
      status: 'pending',
      lastUpdated: '2023-12-15T14:15:00Z'
    }
  ])

  const [selectedSummary, setSelectedSummary] = useState<ReconciliationSummary | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'pending':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      default:
        return null
    }
  }

  const overallStats = {
    totalRecords: summaries.reduce((sum, s) => sum + s.totalRecords, 0),
    matchedRecords: summaries.reduce((sum, s) => sum + s.matchedRecords, 0),
    unmatchedRecords: summaries.reduce((sum, s) => sum + s.unmatchedRecords, 0),
    discrepancyRecords: summaries.reduce((sum, s) => sum + s.discrepancyRecords, 0),
    totalAmount: summaries.reduce((sum, s) => sum + s.totalAmount, 0),
    discrepancyAmount: summaries.reduce((sum, s) => sum + s.discrepancyAmount, 0),
    overallMatchRate: summaries.length > 0 ? 
      summaries.reduce((sum, s) => sum + s.matchRate, 0) / summaries.length : 0
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Pre-Summary
        </h1>
        <p className="text-secondary-600">
          Review reconciliation results before final summary and export
        </p>
        {project && (
          <div className="mt-2 text-sm text-primary-600">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Records</p>
              <p className="text-2xl font-bold text-secondary-900">{overallStats.totalRecords.toLocaleString()}</p>
            </div>
            <FileText className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Matched</p>
              <p className="text-2xl font-bold text-green-600">{overallStats.matchedRecords.toLocaleString()}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Discrepancies</p>
              <p className="text-2xl font-bold text-yellow-600">{overallStats.discrepancyRecords.toLocaleString()}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Match Rate</p>
              <p className="text-2xl font-bold text-primary-600">{overallStats.overallMatchRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-500" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-secondary-900">
              Reconciliation Results by Category
            </h2>
          </div>
          
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button className="btn-secondary flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Configure</span>
            </button>
            <button className="btn-primary flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Preview</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Summary List */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="space-y-4">
              {summaries.map((summary) => (
                <div
                  key={summary.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSummary?.id === summary.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 hover:border-secondary-300'
                  }`}
                  onClick={() => setSelectedSummary(summary)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(summary.status)}
                      <div>
                        <h3 className="font-semibold text-secondary-900">{summary.category}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(summary.status)}`}>
                          {summary.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-secondary-900">{summary.matchRate.toFixed(1)}%</div>
                      <div className="text-sm text-secondary-500">Match Rate</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-secondary-600">Total Records</div>
                      <div className="font-medium">{summary.totalRecords.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-secondary-600">Matched</div>
                      <div className="font-medium text-green-600">{summary.matchedRecords.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-secondary-600">Unmatched</div>
                      <div className="font-medium text-red-600">{summary.unmatchedRecords.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-secondary-600">Discrepancies</div>
                      <div className="font-medium text-yellow-600">{summary.discrepancyRecords.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  {summary.totalAmount > 0 && (
                    <div className="mt-3 pt-3 border-t border-secondary-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary-600">Total Amount:</span>
                        <span className="font-medium">${summary.totalAmount.toLocaleString()}</span>
                      </div>
                      {summary.discrepancyAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary-600">Discrepancy Amount:</span>
                          <span className="font-medium text-red-600">${summary.discrepancyAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-3 text-xs text-secondary-500">
                    Last updated: {new Date(summary.lastUpdated).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedSummary ? (
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                {selectedSummary.category} Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-secondary-700 mb-2">Status</h4>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedSummary.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedSummary.status)}`}>
                      {selectedSummary.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-secondary-700 mb-2">Record Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Total:</span>
                      <span className="font-medium">{selectedSummary.totalRecords.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Matched:</span>
                      <span className="font-medium text-green-600">{selectedSummary.matchedRecords.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Unmatched:</span>
                      <span className="font-medium text-red-600">{selectedSummary.unmatchedRecords.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Discrepancies:</span>
                      <span className="font-medium text-yellow-600">{selectedSummary.discrepancyRecords.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                {selectedSummary.totalAmount > 0 && (
                  <div>
                    <h4 className="font-medium text-secondary-700 mb-2">Amount Analysis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Total Amount:</span>
                        <span className="font-medium">${selectedSummary.totalAmount.toLocaleString()}</span>
                      </div>
                      {selectedSummary.discrepancyAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-secondary-600">Discrepancy:</span>
                          <span className="font-medium text-red-600">${selectedSummary.discrepancyAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Match Rate:</span>
                        <span className="font-medium text-primary-600">{selectedSummary.matchRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-secondary-700 mb-2">Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full btn-secondary text-sm flex items-center justify-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    <button className="w-full btn-secondary text-sm flex items-center justify-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Export Category</span>
                    </button>
                    {selectedSummary.status !== 'completed' && (
                      <button className="w-full btn-primary text-sm">
                        Continue Processing
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-secondary-200">
                  <div className="text-xs text-secondary-500">
                    <div>Last updated: {new Date(selectedSummary.lastUpdated).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
                <p className="text-secondary-600">Select a category to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Actions */}
      <div className="card mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              Ready for Final Summary?
            </h3>
            <p className="text-secondary-600">
              All reconciliation categories have been processed and are ready for final summary and export.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary">
              Review All Results
            </button>
            <button className="btn-primary">
              Proceed to Final Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PresummaryPage
