'use client'
import { logger } from '@/services/logger'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { FileText } from 'lucide-react'
import { CheckCircle } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { X } from 'lucide-react'
import { Database } from 'lucide-react'
import { Settings } from 'lucide-react'
import { Table } from 'lucide-react'
import { Eye } from 'lucide-react'
import { Edit } from 'lucide-react'
import { Trash2 } from 'lucide-react'
import { Filter } from 'lucide-react'
import { Search } from 'lucide-react'
import { ArrowUpDown } from 'lucide-react'
import { ChevronUp } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { ChevronLeft } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { MapPin } from 'lucide-react'
import { Wand2 } from 'lucide-react'
import { Shield } from 'lucide-react'
import { BarChart3 } from 'lucide-react'
import { Save } from 'lucide-react'
import { Copy } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'
import { Columns } from 'lucide-react'
import { SortAsc } from 'lucide-react'
import { SortDesc } from 'lucide-react'
import { Calendar } from 'lucide-react'
import { DollarSign } from 'lucide-react'
import { Hash } from 'lucide-react'
import { Type } from 'lucide-react'
import { CheckSquare } from 'lucide-react'
import { Square } from 'lucide-react'
import { AlertTriangle } from 'lucide-react'
import { Info } from 'lucide-react'
import { Zap } from 'lucide-react'
import { Globe } from 'lucide-react'
import { RefreshCw } from 'lucide-react'
import { GitBranch } from 'lucide-react'
import { GitCommit } from 'lucide-react'
import { GitMerge } from 'lucide-react'
import { GitPullRequest } from 'lucide-react'
import { Workflow } from 'lucide-react'
import { Layers } from 'lucide-react'
import { Network } from 'lucide-react'
import { Activity } from 'lucide-react'
import { TrendingUp } from 'lucide-react'
import { Target } from 'lucide-react'
import { Clock } from 'lucide-react'
import { Users } from 'lucide-react'
import { Bell } from 'lucide-react'
import { MessageSquare } from 'lucide-react'
import { Share2 } from 'lucide-react'
import { ExternalLink } from 'lucide-react'
import { Lock } from 'lucide-react'
import { Unlock } from 'lucide-react'
import { Key } from 'lucide-react'
import { Crown } from 'lucide-react'
import { Award } from 'lucide-react'
import { Trophy } from 'lucide-react'
import { Medal } from 'lucide-react'
import { Flag } from 'lucide-react'
import { Tag } from 'lucide-react'
import { Folder } from 'lucide-react'
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
import { FileSpreadsheet } from 'lucide-react'
import { FileCode } from 'lucide-react'
import { FileJson } from 'lucide-react'
import { 
  IndonesianDataProcessor, 
  ProcessedExpenseRecord, 
  ProcessedBankRecord 
} from '../../../utils/indonesianDataProcessor'

// Enhanced Interfaces for Integration
interface SynchronizedDataState {
  ingestionData: ProcessedData[]
  reconciliationData: ReconciliationRecord[]
  indonesianData: IndonesianProcessedData[]
  dataFlow: 'idle' | 'processing' | 'syncing' | 'error'
  synchronizationStatus: 'synchronized' | 'pending' | 'conflict' | 'error'
  lastSyncTime: string
  syncQueue: SynchronizationTask[]
}

// CSV record type for parsed data
export interface CSVRecord {
  [key: string]: string | number | boolean | null
}

interface ProcessedData {
  id: string
  source: 'ingestion' | 'reconciliation' | 'indonesian'
  type: 'expense' | 'bank' | 'mixed'
  data: CSVRecord | ProcessedExpenseRecord | ProcessedBankRecord
  quality: DataQualityMetrics
  isIndonesian: boolean
  processedAt: string
  metadata: Record<string, string | number | boolean>
}

interface ReconciliationRecord {
  id: string
  sources: ReconciliationSource[]
  status: 'matched' | 'unmatched' | 'discrepancy' | 'pending' | 'resolved' | 'escalated'
  confidence: number
  matchScore: number
  difference?: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  metadata: RecordMetadata
  auditTrail: AuditEntry[]
  resolution?: Resolution
}

interface IndonesianProcessedData extends ProcessedData {
  indonesianFormat: {
    amountFormat: 'indonesian' | 'standard'
    dateFormat: 'indonesian' | 'iso'
    textFormat: 'indonesian' | 'standard'
  }
  culturalContext: {
    currency: 'IDR'
    locale: 'id-ID'
    numberFormat: 'indonesian'
    dateFormat: 'indonesian'
  }
  normalizationApplied: {
    amountNormalized: boolean
    dateNormalized: boolean
    textNormalized: boolean
  }
}

interface SynchronizationTask {
  id: string
  type: 'ingestion_to_reconciliation' | 'reconciliation_to_ingestion' | 'indonesian_processing'
  data: Record<string, unknown> | unknown[] | ProcessedData
  timestamp: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  source: string
  target: string
}

interface DataQualityMetrics {
  completeness: number
  accuracy: number
  consistency: number
  validity: number
  duplicates: number
  errors: number
  indonesianFormatCompliance?: number
  amountFormatAccuracy?: number
  dateFormatConsistency?: number
  textNormalizationQuality?: number
  culturalContextAccuracy?: number
}

interface ReconciliationSource {
  id: string
  systemId: string
  systemName: string
  recordId: string
  data: Record<string, unknown>
  timestamp: string
  quality: DataQualityMetrics
  confidence: number
  metadata: Record<string, unknown>
}

interface RecordMetadata {
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  version: number
  tags: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface AuditEntry {
  id: string
  userId: string
  userName: string
  action: string
  timestamp: string
  details: Record<string, unknown>
  previousValue?: unknown
  newValue?: unknown
  ipAddress?: string
  userAgent?: string
}

interface Resolution {
  id: string
  type: 'automatic' | 'manual' | 'approved'
  status: 'pending' | 'approved' | 'rejected' | 'escalated'
  assignedTo?: string
  assignedBy?: string
  assignedAt?: string
  resolvedAt?: string
  resolution: string
  comments: string[]
  attachments: string[]
}

// Utility functions
const readFileContent = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

  const parseCSVContent = (content: string): CSVRecord[] => {
    const lines = content.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const record: CSVRecord = {}
      headers.forEach((header, index) => {
        record[header] = values[index] || ''
      })
      return record
    }).filter(record => Object.values(record).some(value => value !== ''))
  }

  const calculateIndonesianQualityMetrics = (data: CSVRecord | ProcessedExpenseRecord | ProcessedBankRecord): DataQualityMetrics => {
    const metrics = {
      completeness: 0,
      accuracy: 0,
      consistency: 0,
      validity: 0,
      duplicates: 0,
      errors: 0,
      overall: 0
    }

    const dataRecord = data as Record<string, unknown>;
    
    // Calculate completeness based on required fields
    const requiredFields = ['tanggal', 'deskripsi', 'jumlah', 'kategori', 'date', 'description', 'amount']
    const filledFields = requiredFields.filter(field => dataRecord[field] && String(dataRecord[field]).trim() !== '')
    metrics.completeness = (filledFields.length / Math.min(4, requiredFields.length)) * 100

    // Calculate accuracy based on data format validation
    let accuracyScore = 0
    if ((dataRecord.tanggal || dataRecord.date) && /^\d{4}-\d{2}-\d{2}/.test(String(dataRecord.tanggal || dataRecord.date))) accuracyScore += 25
    if ((dataRecord.jumlah || dataRecord.amount) && !isNaN(parseFloat(String(dataRecord.jumlah || dataRecord.amount)))) accuracyScore += 25
    if ((dataRecord.deskripsi || dataRecord.description) && String(dataRecord.deskripsi || dataRecord.description).length > 5) accuracyScore += 25
    if ((dataRecord.kategori || dataRecord.category1) && String(dataRecord.kategori || dataRecord.category1).length > 2) accuracyScore += 25
    metrics.accuracy = accuracyScore

    // Calculate consistency (simplified)
    metrics.consistency = metrics.completeness * 0.8 + metrics.accuracy * 0.2

    // Calculate validity (simplified)
    metrics.validity = metrics.accuracy

    // Calculate overall score
    metrics.overall = (metrics.completeness + metrics.accuracy + metrics.consistency + metrics.validity) / 4

    return metrics
  }

// Enhanced Ingestion Page with Indonesian Integration
const EnhancedIngestionPage = () => {
  const [dataState, setDataState] = useState<SynchronizedDataState>({
    ingestionData: [],
    reconciliationData: [],
    indonesianData: [],
    dataFlow: 'idle',
    synchronizationStatus: 'synchronized',
    lastSyncTime: '',
    syncQueue: []
  })

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [processedData, setProcessedData] = useState<ProcessedData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [showDataAnalysis, setShowDataAnalysis] = useState(false)
  const [activeTab, setActiveTab] = useState<'upload' | 'process' | 'analyze' | 'sync'>('upload')

  // Indonesian file detection
  const detectIndonesianFormat = useCallback((file: File): boolean => {
    const fileName = file.name.toLowerCase()
    const indonesianIndicators = [
      'expenses-table',
      'bank-statements',
      'indonesia',
      'idr',
      'rupiah'
    ]
    
    return indonesianIndicators.some(indicator => fileName.includes(indicator))
  }, [])

  // Process Indonesian files
  const processIndonesianFile = useCallback(async (file: File): Promise<ProcessedData[]> => {
    const content = await readFileContent(file)
    const rawData = parseCSVContent(content)
    
    let processedData: ProcessedData[]
    
    if (file.name.includes('expenses')) {
      const expenses = IndonesianDataProcessor.processExpensesData(rawData)
      processedData = expenses.map((expense: ProcessedExpenseRecord) => ({
        id: expense.id,
        source: 'ingestion' as const,
        type: 'expense' as const,
        data: expense,
        quality: calculateIndonesianQualityMetrics(expense),
        isIndonesian: true,
        processedAt: new Date().toISOString(),
        metadata: {
          originalFile: file.name,
          processingMethod: 'indonesian',
          format: 'expenses'
        }
      }))
    } else if (file.name.includes('bank')) {
      const bankRecords = IndonesianDataProcessor.processBankData(rawData)
      processedData = bankRecords.map((bank: ProcessedBankRecord) => ({
        id: bank.id,
        source: 'ingestion' as const,
        type: 'bank' as const,
        data: bank,
        quality: calculateIndonesianQualityMetrics(bank),
        isIndonesian: true,
        processedAt: new Date().toISOString(),
        metadata: {
          originalFile: file.name,
          processingMethod: 'indonesian',
          format: 'bank'
        }
      }))
    } else {
      // Mixed data
      processedData = rawData.map((record, index) => ({
        id: `MIXED-${index + 1}`,
        source: 'ingestion' as const,
        type: 'mixed' as const,
        data: record,
        quality: calculateIndonesianQualityMetrics(record),
        isIndonesian: true,
        processedAt: new Date().toISOString(),
        metadata: {
          originalFile: file.name,
          processingMethod: 'indonesian',
          format: 'mixed'
        }
      }))
    }
    
    return processedData
  }, [])

  // Process standard files
  const processStandardFile = useCallback(async (file: File): Promise<ProcessedData[]> => {
    const content = await readFileContent(file)
    const rawData = parseCSVContent(content)
    
    return rawData.map((record, index) => ({
      id: `STD-${index + 1}`,
      source: 'ingestion' as const,
      type: 'mixed' as const,
      data: record,
      quality: calculateIndonesianQualityMetrics(record),
      isIndonesian: false,
      processedAt: new Date().toISOString(),
      metadata: {
        originalFile: file.name,
        processingMethod: 'standard',
        format: 'csv'
      }
    }))
  }, [])

  // Sync to reconciliation
  const syncToReconciliation = useCallback(async (data: ProcessedData[]) => {
    setDataState(prev => ({ 
      ...prev, 
      synchronizationStatus: 'pending',
      syncQueue: data.map(item => ({
        id: item.id,
        type: 'ingestion_to_reconciliation',
        status: 'pending',
        data: item,
        timestamp: Date.now(),
        source: 'ingestion',
        target: 'reconciliation'
      }))
    }))

    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setDataState(prev => ({ 
      ...prev, 
      synchronizationStatus: 'synchronized',
      lastSyncTime: new Date().toISOString(),
      syncQueue: []
    }))
  }, [])

  // Enhanced file processing with Indonesian support
  const processFiles = useCallback(async (files: File[]) => {
    setIsProcessing(true)
    setProcessingProgress(0)
    setDataState(prev => ({ ...prev, dataFlow: 'processing' }))

    try {
      const processedFiles: ProcessedData[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setProcessingProgress((i / files.length) * 100)

        // Detect Indonesian format
        const isIndonesian = detectIndonesianFormat(file)
        
        if (isIndonesian) {
          // Process with Indonesian data processor
          const indonesianData = await processIndonesianFile(file)
          processedFiles.push(...indonesianData)
        } else {
          // Process with standard processor
          const standardData = await processStandardFile(file)
          processedFiles.push(...standardData)
        }
      }

      setProcessedData(processedFiles)
      setDataState(prev => ({
        ...prev,
        ingestionData: processedFiles,
        dataFlow: 'syncing'
      }))

      // Auto-sync to reconciliation
      await syncToReconciliation(processedFiles)

    } catch (error) {
      logger.error('Error processing files:', error)
      setDataState(prev => ({ ...prev, dataFlow: 'error' }))
    } finally {
      setIsProcessing(false)
      setProcessingProgress(100)
    }
   }, [processIndonesianFile, processStandardFile, syncToReconciliation, detectIndonesianFormat])

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Enhanced Data Ingestion
            </h1>
            <p className="text-secondary-600">
              Intelligent data processing with Indonesian format support and real-time synchronization
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              dataState.synchronizationStatus === 'synchronized' ? 'bg-green-100 text-green-800' :
              dataState.synchronizationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              dataState.synchronizationStatus === 'error' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              <RefreshCw className="w-4 h-4 inline mr-1" />
              {dataState.synchronizationStatus}
            </div>
            <button
              onClick={() => setShowDataAnalysis(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Data Analysis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200 mb-6">
        <nav className="flex space-x-8">
          {([
            { id: 'upload', label: 'Upload', icon: Upload },
            { id: 'process', label: 'Processing', icon: Settings },
            { id: 'analyze', label: 'Analysis', icon: BarChart3 },
            { id: 'sync', label: 'Synchronization', icon: RefreshCw }
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

      {/* Tab Content */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* File Upload */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">File Upload</h3>
            <div className="border-2 border-dashed border-secondary-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600 mb-4">
                Drag and drop files here, or click to select files
              </p>
              <p className="text-sm text-secondary-500 mb-4">
                Supports CSV, Excel, and Indonesian format files
              </p>
              <input
                type="file"
                multiple
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  setUploadedFiles(files)
                  processFiles(files)
                }}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="btn-primary cursor-pointer"
              >
                Select Files
              </label>
            </div>
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Uploaded Files</h3>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-primary-600" />
                      <div>
                        <div className="font-medium text-secondary-900">{file.name}</div>
                        <div className="text-sm text-secondary-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {detectIndonesianFormat(file) && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Indonesian Format
                        </span>
                      )}
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'process' && (
        <div className="space-y-6">
          {/* Processing Status */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Processing Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Data Flow Status</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  dataState.dataFlow === 'idle' ? 'bg-gray-100 text-gray-800' :
                  dataState.dataFlow === 'processing' ? 'bg-blue-100 text-blue-800' :
                  dataState.dataFlow === 'syncing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {dataState.dataFlow}
                </span>
              </div>
              
              {isProcessing && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-secondary-600">Processing Progress</span>
                    <span className="text-sm font-medium text-secondary-900">
                      {Math.round(processingProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Last Sync Time</span>
                <span className="text-sm text-secondary-900">
                  {dataState.lastSyncTime ? new Date(dataState.lastSyncTime).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Processed Data */}
          {processedData.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Processed Data</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-secondary-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-700">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-700">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-700">Format</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-700">Quality</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedData.slice(0, 10).map((item) => (
                      <tr key={item.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                        <td className="py-3 px-4 font-medium text-secondary-900">{item.id}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {item.isIndonesian ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Indonesian
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              Standard
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-secondary-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${item.quality.completeness}%` }}
                              />
                            </div>
                            <span className="text-sm text-secondary-600">
                              {item.quality.completeness.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-primary-600 hover:text-primary-700 text-sm" title="View details" aria-label="View details">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analyze' && (
        <div className="space-y-6">
          {/* Data Analysis */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Data Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{processedData.length}</div>
                <div className="text-sm text-secondary-600">Total Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {processedData.filter(d => d.isIndonesian).length}
                </div>
                <div className="text-sm text-secondary-600">Indonesian Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {processedData.length > 0 ? 
                    (processedData.reduce((sum, d) => sum + d.quality.completeness, 0) / processedData.length).toFixed(1) : 0
                  }%
                </div>
                <div className="text-sm text-secondary-600">Avg Quality</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sync' && (
        <div className="space-y-6">
          {/* Synchronization Status */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Synchronization Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Reconciliation Records</span>
                <span className="text-sm font-bold text-secondary-900">
                  {dataState.reconciliationData.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Matched Records</span>
                <span className="text-sm font-bold text-green-600">
                  {dataState.reconciliationData.filter(r => r.status === 'matched').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Pending Records</span>
                <span className="text-sm font-bold text-yellow-600">
                  {dataState.reconciliationData.filter(r => r.status === 'pending').length}
                </span>
              </div>
            </div>
          </div>

          {/* Sync Queue */}
          {dataState.syncQueue.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Synchronization Queue</h3>
              <div className="space-y-2">
                {dataState.syncQueue.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <RefreshCw className="w-4 h-4 text-primary-600" />
                      <div>
                        <div className="font-medium text-secondary-900">{task.type}</div>
                        <div className="text-sm text-secondary-500">
                          {new Date(task.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EnhancedIngestionPage
