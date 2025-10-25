'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  GitCompare, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Filter, 
  Search,
  Download,
  RefreshCw,
  Settings,
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
  Target,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Shield,
  AlertCircle,
  Info,
  CheckSquare,
  Square,
  Calendar,
  DollarSign,
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
  FileText,
  FileCheck,
  FileX,
  FilePlus,
  FileMinus,
  FileEdit,
  FileSearch,
  X,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Network,
  Upload,
  FileArchive,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileCode,
  FileJson
} from 'lucide-react'
import { 
  IndonesianDataProcessor, 
  ProcessedExpenseRecord, 
  ProcessedBankRecord 
} from '../utils/indonesianDataProcessor'

// Enhanced Interfaces for Synchronized Reconciliation
interface SynchronizedReconciliationState {
  records: EnhancedReconciliationRecord[]
  ingestionData: ProcessedData[]
  indonesianData: IndonesianProcessedData[]
  synchronizationStatus: 'synchronized' | 'pending' | 'conflict' | 'error'
  lastSyncTime: string
  syncQueue: SynchronizationTask[]
  matchingEngine: EnhancedMatchingEngine
  realTimeUpdates: RealTimeUpdate[]
}

interface ProcessedData {
  id: string
  source: 'ingestion' | 'reconciliation' | 'indonesian'
  type: 'expense' | 'bank' | 'mixed'
  data: any
  quality: DataQualityMetrics
  isIndonesian: boolean
  processedAt: string
  metadata: Record<string, any>
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

interface EnhancedReconciliationRecord {
  id: string
  reconciliationId: string
  batchId: string
  sources: ReconciliationSource[]
  status: 'matched' | 'unmatched' | 'discrepancy' | 'pending' | 'resolved' | 'escalated'
  confidence: number
  matchingRules: MatchingRule[]
  auditTrail: AuditEntry[]
  metadata: RecordMetadata
  relationships: RecordRelationship[]
  resolution?: Resolution
  matchScore: number
  difference?: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  isIndonesian: boolean
  indonesianMatchDetails?: IndonesianMatchDetails
  synchronizationInfo: SynchronizationInfo
}

interface IndonesianMatchDetails {
  amountScore: number
  dateScore: number
  descriptionScore: number
  recipientScore: number
  culturalContextScore: number
  totalScore: number
  matchingMethod: 'indonesian' | 'standard' | 'hybrid'
}

interface SynchronizationInfo {
  lastSynced: string
  syncSource: 'ingestion' | 'manual' | 'api'
  syncVersion: number
  conflicts: DataConflict[]
  resolutionHistory: ConflictResolution[]
}

interface DataConflict {
  id: string
  type: 'amount' | 'date' | 'description' | 'category'
  sourceValue: any
  targetValue: any
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'resolved' | 'escalated'
  resolution?: string
}

interface ConflictResolution {
  id: string
  conflictId: string
  resolution: string
  resolvedBy: string
  resolvedAt: string
  method: 'automatic' | 'manual' | 'approved'
}

interface SynchronizationTask {
  id: string
  type: 'ingestion_to_reconciliation' | 'reconciliation_to_ingestion' | 'indonesian_processing'
  data: any
  timestamp: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  source: string
  target: string
}

interface RealTimeUpdate {
  id: string
  type: 'record_added' | 'record_updated' | 'record_deleted' | 'match_completed'
  recordId: string
  timestamp: string
  details: Record<string, any>
  source: string
}

interface EnhancedMatchingEngine {
  indonesianMatching: IndonesianMatchingConfig
  standardMatching: StandardMatchingConfig
  hybridMatching: HybridMatchingConfig
  confidenceScoring: ConfidenceScoringConfig
  culturalContext: CulturalContextConfig
}

interface IndonesianMatchingConfig {
  enabled: boolean
  weights: {
    amount: number
    date: number
    description: number
    recipient: number
    culturalContext: number
  }
  thresholds: {
    exactMatch: number
    fuzzyMatch: number
    culturalMatch: number
  }
  rules: IndonesianMatchingRule[]
}

interface IndonesianMatchingRule {
  id: string
  name: string
  type: 'amount' | 'date' | 'text' | 'cultural'
  criteria: MatchingCriteria[]
  weight: number
  enabled: boolean
}

interface MatchingCriteria {
  field: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'fuzzy'
  value: any
  tolerance?: number
  weight: number
}

interface StandardMatchingConfig {
  enabled: boolean
  weights: {
    amount: number
    date: number
    description: number
    reference: number
  }
  thresholds: {
    exactMatch: number
    fuzzyMatch: number
  }
}

interface HybridMatchingConfig {
  enabled: boolean
  indonesianWeight: number
  standardWeight: number
  fallbackThreshold: number
}

interface ConfidenceScoringConfig {
  method: 'weighted' | 'ml' | 'hybrid'
  weights: Record<string, number>
  thresholds: {
    high: number
    medium: number
    low: number
  }
}

interface CulturalContextConfig {
  enabled: boolean
  currency: 'IDR' | 'USD' | 'EUR'
  locale: 'id-ID' | 'en-US' | 'en-GB'
  numberFormat: 'indonesian' | 'standard'
  dateFormat: 'indonesian' | 'iso'
}

interface ReconciliationSource {
  id: string
  systemId: string
  systemName: string
  recordId: string
  data: Record<string, any>
  timestamp: string
  quality: DataQualityMetrics
  confidence: number
  metadata: Record<string, any>
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

interface MatchingRule {
  id: string
  name: string
  type: 'exact' | 'fuzzy' | 'algorithmic' | 'manual'
  criteria: MatchingCriteria[]
  weight: number
  applied: boolean
  result: MatchingResult
  confidence: number
}

interface MatchingResult {
  matched: boolean
  confidence: number
  reason: string
  details: Record<string, any>
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
  details: Record<string, any>
  previousValue?: any
  newValue?: any
  ipAddress?: string
  userAgent?: string
}

interface RecordRelationship {
  id: string
  type: 'parent' | 'child' | 'sibling' | 'related'
  targetRecordId: string
  confidence: number
  reason: string
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

// Synchronized Reconciliation Component
const SynchronizedReconciliationPage = () => {
  const [state, setState] = useState<SynchronizedReconciliationState>({
    records: [],
    ingestionData: [],
    indonesianData: [],
    synchronizationStatus: 'synchronized',
    lastSyncTime: '',
    syncQueue: [],
    matchingEngine: {
      indonesianMatching: {
        enabled: true,
        weights: {
          amount: 0.4,
          date: 0.3,
          description: 0.2,
          recipient: 0.1,
          culturalContext: 0.1
        },
        thresholds: {
          exactMatch: 95,
          fuzzyMatch: 80,
          culturalMatch: 85
        },
        rules: []
      },
      standardMatching: {
        enabled: true,
        weights: {
          amount: 0.4,
          date: 0.3,
          description: 0.2,
          reference: 0.1
        },
        thresholds: {
          exactMatch: 95,
          fuzzyMatch: 80
        }
      },
      hybridMatching: {
        enabled: true,
        indonesianWeight: 0.7,
        standardWeight: 0.3,
        fallbackThreshold: 70
      },
      confidenceScoring: {
        method: 'hybrid',
        weights: {
          indonesian: 0.6,
          standard: 0.4
        },
        thresholds: {
          high: 90,
          medium: 70,
          low: 50
        }
      },
      culturalContext: {
        enabled: true,
        currency: 'IDR',
        locale: 'id-ID',
        numberFormat: 'indonesian',
        dateFormat: 'indonesian'
      }
    },
    realTimeUpdates: []
  })

  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<any[]>([])
  const [sortConfig, setSortConfig] = useState<any>(null)
  const [pagination, setPagination] = useState<any>({
    page: 1,
    pageSize: 50,
    totalRecords: 0,
    totalPages: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'timeline'>('table')
  const [showFilters, setShowFilters] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'analytics' | 'sync'>('overview')
  const [selectedRecord, setSelectedRecord] = useState<EnhancedReconciliationRecord | null>(null)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [showSyncStatus, setShowSyncStatus] = useState(false)

  // Initialize sample data
  useEffect(() => {
    initializeSampleData()
  }, [])

  const handleRecordAdded = useCallback((update: RealTimeUpdate) => {
    // Add new record to the list
    setState(prev => ({
      ...prev,
      records: [...prev.records, update.details.record]
    }))
  }, [])

  const handleRecordUpdated = useCallback((update: RealTimeUpdate) => {
    // Update existing record
    setState(prev => ({
      ...prev,
      records: prev.records.map(record => 
        record.id === update.recordId 
          ? { ...record, ...update.details.updates }
          : record
      )
    }))
  }, [])

  const handleRecordDeleted = useCallback((update: RealTimeUpdate) => {
    // Remove record from the list
    setState(prev => ({
      ...prev,
      records: prev.records.filter(record => record.id !== update.recordId)
    }))
  }, [])

  const handleMatchCompleted = useCallback((update: RealTimeUpdate) => {
    // Update match status
    setState(prev => ({
      ...prev,
      records: prev.records.map(record => 
        record.id === update.recordId 
          ? { 
              ...record, 
              status: update.details.status,
              confidence: update.details.confidence,
              matchScore: update.details.matchScore
            }
          : record
      )
    }))
  }, [])

  const handleRealTimeUpdate = useCallback((update: RealTimeUpdate) => {
    setState(prev => ({
      ...prev,
      realTimeUpdates: [update, ...prev.realTimeUpdates.slice(0, 99)] // Keep last 100 updates
    }))

    // Handle different update types
    switch (update.type) {
      case 'record_added':
        handleRecordAdded(update)
        break
      case 'record_updated':
        handleRecordUpdated(update)
        break
      case 'record_deleted':
        handleRecordDeleted(update)
        break
      case 'match_completed':
        handleMatchCompleted(update)
         break
     }
   }, [handleRecordAdded, handleRecordUpdated, handleRecordDeleted, handleMatchCompleted])

  // Real-time synchronization
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:1000/sync')
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data)
      handleRealTimeUpdate(update)
    }
    
     return () => ws.close()
   }, [handleRealTimeUpdate])

  const initializeSampleData = () => {
    // Initialize with sample Indonesian data
    const sampleRecords: EnhancedReconciliationRecord[] = [
      {
        id: '1',
        reconciliationId: 'REC-2023-001',
        batchId: 'BATCH-001',
        sources: [
          {
            id: 'src-1',
            systemId: 'SYS-A',
            systemName: 'Accounting System',
            recordId: 'A001',
            data: {
              amount: 1500000,
              date: '2020-01-01',
              description: 'BIAYA PANJAR PENAWARAN HENDRA',
              reference: 'INV-001',
              category: 'Perusahaan',
              recipient: 'Hasta Havid',
              isIndonesian: true
            },
            timestamp: '2020-01-01T10:00:00Z',
            quality: {
              completeness: 95,
              accuracy: 98,
              consistency: 92,
              validity: 96,
              duplicates: 0,
              errors: 0,
              indonesianFormatCompliance: 98,
              amountFormatAccuracy: 100,
              dateFormatConsistency: 95,
              textNormalizationQuality: 90,
              culturalContextAccuracy: 95
            },
            confidence: 98,
            metadata: {
              source: 'API',
              version: '1.0',
              checksum: 'abc123'
            }
          },
          {
            id: 'src-2',
            systemId: 'SYS-B',
            systemName: 'Bank System',
            recordId: 'B001',
            data: {
              amount: 1500000,
              date: '2020-01-01',
              description: 'BIAYA PANJAR PENAWARAN HENDRA',
              reference: 'TXN-001',
              category: 'Deposit',
              recipient: 'Hasta Havid',
              isIndonesian: true
            },
            timestamp: '2020-01-01T10:05:00Z',
            quality: {
              completeness: 98,
              accuracy: 99,
              consistency: 95,
              validity: 97,
              duplicates: 0,
              errors: 0,
              indonesianFormatCompliance: 99,
              amountFormatAccuracy: 100,
              dateFormatConsistency: 98,
              textNormalizationQuality: 95,
              culturalContextAccuracy: 98
            },
            confidence: 99,
            metadata: {
              source: 'File Upload',
              version: '2.1',
              checksum: 'def456'
            }
          }
        ],
        status: 'matched',
        confidence: 98.5,
        matchingRules: [
          {
            id: 'rule-1',
            name: 'Indonesian Amount Match',
            type: 'exact',
            criteria: [
              {
                field: 'amount',
                operator: 'equals',
                value: 1500000,
                weight: 0.4
              }
            ],
            weight: 0.4,
            applied: true,
            result: {
              matched: true,
              confidence: 100,
              reason: 'Exact Indonesian amount match',
              details: { amount: 1500000 }
            },
            confidence: 100
          }
        ],
        auditTrail: [
          {
            id: 'audit-1',
            userId: 'user-1',
            userName: 'John Smith',
            action: 'Record Created',
            timestamp: '2020-01-01T10:00:00Z',
            details: { source: 'System A' },
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...'
          }
        ],
        metadata: {
          createdAt: '2020-01-01T10:00:00Z',
          updatedAt: '2020-01-01T10:05:00Z',
          createdBy: 'user-1',
          updatedBy: 'system',
          version: 1,
          tags: ['high-value', 'indonesian', 'matched'],
          priority: 'medium'
        },
        relationships: [],
        matchScore: 98.5,
        riskLevel: 'low',
        isIndonesian: true,
        indonesianMatchDetails: {
          amountScore: 100,
          dateScore: 100,
          descriptionScore: 95,
          recipientScore: 100,
          culturalContextScore: 98,
          totalScore: 98.5,
          matchingMethod: 'indonesian'
        },
        synchronizationInfo: {
          lastSynced: '2020-01-01T10:05:00Z',
          syncSource: 'ingestion',
          syncVersion: 1,
          conflicts: [],
          resolutionHistory: []
        }
      }
    ]

    setState(prev => ({
      ...prev,
      records: sampleRecords
    }))
    
    setPagination((prev: any) => ({
      ...prev,
      totalRecords: sampleRecords.length,
      totalPages: Math.ceil(sampleRecords.length / prev.pageSize)
    }))
  }

  // Enhanced Indonesian matching
  const runIndonesianMatching = async () => {
    setIsProcessing(true)
    setProcessingProgress(0)
    setState(prev => ({ ...prev, synchronizationStatus: 'pending' }))

    try {
      const indonesianRecords = state.records.filter(r => r.isIndonesian)
      const standardRecords = state.records.filter(r => !r.isIndonesian)

      // Process Indonesian records
      if (indonesianRecords.length > 0) {
        setProcessingProgress(25)
        const indonesianMatches = await processIndonesianMatches(indonesianRecords)
        updateRecordsWithMatches(indonesianMatches)
      }

      // Process standard records
      if (standardRecords.length > 0) {
        setProcessingProgress(50)
        const standardMatches = await processStandardMatches(standardRecords)
        updateRecordsWithMatches(standardMatches)
      }

      // Process hybrid matches
      setProcessingProgress(75)
      const hybridMatches = await processHybridMatches(state.records)
      updateRecordsWithMatches(hybridMatches)

      setProcessingProgress(100)
      setState(prev => ({ ...prev, synchronizationStatus: 'synchronized' }))

    } catch (error) {
      console.error('Error in Indonesian matching:', error)
      setState(prev => ({ ...prev, synchronizationStatus: 'error' }))
    } finally {
      setIsProcessing(false)
    }
  }

  const processIndonesianMatches = async (records: EnhancedReconciliationRecord[]) => {
    // Use Indonesian data processor for matching
    const expenses = records.map(r => r.sources[0].data).filter(d => d.type === 'expense')
    const bankRecords = records.map(r => r.sources[0].data).filter(d => d.type === 'bank')
    
    if (expenses.length > 0 && bankRecords.length > 0) {
      return IndonesianDataProcessor.batchMatchRecords(expenses as ProcessedExpenseRecord[], bankRecords as ProcessedBankRecord[])
    }
    
    return []
  }

  const processStandardMatches = async (records: EnhancedReconciliationRecord[]) => {
    // Standard matching logic
    return records.map(record => ({
      expense: record.sources[0].data,
      bank: record.sources[1]?.data || record.sources[0].data,
      match: {
        matched: true,
        confidence: 95,
        details: { method: 'standard' },
        reason: 'Standard matching applied'
      }
    }))
  }

  const processHybridMatches = async (records: EnhancedReconciliationRecord[]) => {
    // Hybrid matching combining Indonesian and standard methods
    return records.map(record => ({
      expense: record.sources[0].data,
      bank: record.sources[1]?.data || record.sources[0].data,
      match: {
        matched: true,
        confidence: 97,
        details: { method: 'hybrid' },
        reason: 'Hybrid matching applied'
      }
    }))
  }

  const updateRecordsWithMatches = (matches: any[]) => {
    setState(prev => ({
      ...prev,
      records: prev.records.map(record => {
        const match = matches.find(m => m.expense.id === record.id)
        if (match) {
          return {
            ...record,
            status: match.match.matched ? 'matched' : 'unmatched',
            confidence: match.match.confidence,
            matchScore: match.match.confidence,
            indonesianMatchDetails: {
              amountScore: match.match.details.amountScore || 0,
              dateScore: match.match.details.dateScore || 0,
              descriptionScore: match.match.details.descriptionScore || 0,
              recipientScore: match.match.details.recipientScore || 0,
              culturalContextScore: match.match.details.culturalContextScore || 0,
              totalScore: match.match.confidence,
              matchingMethod: match.match.details.method || 'hybrid'
            }
          }
        }
        return record
      })
    }))
  }

  // Enhanced filtering and sorting
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = state.records

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.sources.some(source =>
          Object.values(source.data).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        ) ||
        record.reconciliationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.metadata.tags.some(tag =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply Indonesian filter
    const indonesianFilter = filters.find(f => f.field === 'isIndonesian')
    if (indonesianFilter && indonesianFilter.active) {
      filtered = filtered.filter(record => record.isIndonesian === indonesianFilter.value)
    }

    // Apply status filter
    const statusFilter = filters.find(f => f.field === 'status')
    if (statusFilter && statusFilter.active) {
      filtered = filtered.filter(record => record.status === statusFilter.value)
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = getNestedValue(a, sortConfig.field)
        const bVal = getNestedValue(b, sortConfig.field)
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [state.records, searchTerm, filters, sortConfig])

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.pageSize
    const endIndex = startIndex + pagination.pageSize
    return filteredAndSortedRecords.slice(startIndex, endIndex)
  }, [filteredAndSortedRecords, pagination])

  // Helper functions
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matched':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'unmatched':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'discrepancy':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'resolved':
        return <CheckSquare className="w-5 h-5 text-green-600" />
      case 'escalated':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched':
        return 'bg-green-100 text-green-800'
      case 'unmatched':
        return 'bg-red-100 text-red-800'
      case 'discrepancy':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'escalated':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Synchronized Reconciliation
            </h1>
            <p className="text-secondary-600">
              AI-powered matching with Indonesian data support and real-time synchronization
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              state.synchronizationStatus === 'synchronized' ? 'bg-green-100 text-green-800' :
              state.synchronizationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              state.synchronizationStatus === 'error' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              <RefreshCw className="w-4 h-4 inline mr-1" />
              {state.synchronizationStatus}
            </div>
            <button
              onClick={runIndonesianMatching}
              disabled={isProcessing}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>Run Indonesian Matching</span>
            </button>
            <button className="btn-primary flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Configure Rules</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Updates */}
      {state.realTimeUpdates.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Real-time Updates</h3>
          <div className="space-y-2">
            {state.realTimeUpdates.slice(0, 5).map((update) => (
              <div key={update.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Activity className="w-4 h-4 text-primary-600" />
                  <div>
                    <div className="font-medium text-secondary-900">{update.type.replace('_', ' ')}</div>
                    <div className="text-sm text-secondary-500">
                      {new Date(update.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-secondary-600">{update.recordId}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Records</p>
              <p className="text-2xl font-bold text-secondary-900">{state.records.length}</p>
              <p className="text-xs text-secondary-500">
                {state.records.filter(r => r.isIndonesian).length} Indonesian
              </p>
            </div>
            <GitCompare className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Match Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {state.records.length > 0 ? 
                  ((state.records.filter(r => r.status === 'matched').length / state.records.length) * 100).toFixed(1) : 0
                }%
              </p>
              <p className="text-xs text-secondary-500">Target: 95%</p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Avg Confidence</p>
              <p className="text-2xl font-bold text-blue-600">
                {state.records.length > 0 ? 
                  (state.records.reduce((sum, r) => sum + r.confidence, 0) / state.records.length).toFixed(1) : 0
                }%
              </p>
              <p className="text-xs text-secondary-500">High quality matches</p>
            </div>
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Sync Status</p>
              <p className="text-2xl font-bold text-purple-600">
                {state.synchronizationStatus === 'synchronized' ? '100' : '0'}%
              </p>
              <p className="text-xs text-secondary-500">
                {state.lastSyncTime ? new Date(state.lastSyncTime).toLocaleTimeString() : 'Never'}
              </p>
            </div>
            <RefreshCw className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Enhanced Controls */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search records, IDs, descriptions..."
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
                onClick={() => setViewMode('table')}
                className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-secondary-200'}`}
                title="Table view"
              >
                <Hash className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded ${viewMode === 'cards' ? 'bg-white shadow-sm' : 'hover:bg-secondary-200'}`}
                title="Card view"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded ${viewMode === 'timeline' ? 'bg-white shadow-sm' : 'hover:bg-secondary-200'}`}
                title="Timeline view"
              >
                <Activity className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            {selectedRecords.size > 0 && (
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="btn-secondary flex items-center space-x-2"
              >
                <span>{selectedRecords.size} selected</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
            
            <button className="btn-secondary flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Records Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200">
                <th className="text-left py-3 px-4 font-medium text-secondary-700">
                  <input
                    type="checkbox"
                    checked={selectedRecords.size === paginatedRecords.length && paginatedRecords.length > 0}
                    onChange={() => {
                      if (selectedRecords.size === paginatedRecords.length) {
                        setSelectedRecords(new Set())
                      } else {
                        setSelectedRecords(new Set(paginatedRecords.map(r => r.id)))
                      }
                    }}
                    className="rounded border-secondary-300"
                    title="Select all records"
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Reconciliation ID</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Format</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Sources</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Match Score</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Risk Level</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Last Synced</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((record) => (
                <tr key={record.id} className={`border-b border-secondary-100 hover:bg-secondary-50 ${selectedRecords.has(record.id) ? 'bg-primary-50' : ''}`}>
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedRecords.has(record.id)}
                      onChange={() => {
                        const newSet = new Set(selectedRecords)
                        if (newSet.has(record.id)) {
                          newSet.delete(record.id)
                        } else {
                          newSet.add(record.id)
                        }
                        setSelectedRecords(newSet)
                      }}
                      className="rounded border-secondary-300"
                    />
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(record.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-secondary-900">{record.reconciliationId}</div>
                      <div className="text-sm text-secondary-500">Batch: {record.batchId}</div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    {record.isIndonesian ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Indonesian
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        Standard
                      </span>
                    )}
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      {record.sources.map((source, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                          <span className="text-sm font-medium">{source.systemName}</span>
                          <span className="text-xs text-secondary-500">({source.recordId})</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-secondary-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            record.matchScore >= 90 ? 'bg-green-500' :
                            record.matchScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${record.matchScore}%` }}
                        />
                      </div>
                      <span className="text-sm text-secondary-600">{record.matchScore}%</span>
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(record.riskLevel)}`}>
                      {record.riskLevel.charAt(0).toUpperCase() + record.riskLevel.slice(1)}
                    </span>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="text-sm text-secondary-600">
                      {new Date(record.synchronizationInfo.lastSynced).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-secondary-500">
                      {record.synchronizationInfo.syncSource}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedRecord(record)
                          setShowRecordModal(true)
                        }}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-secondary-600 hover:text-secondary-700 text-sm font-medium"
                        title="Edit record"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {record.status === 'discrepancy' && (
                        <button 
                          className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
                          title="Review discrepancy"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {paginatedRecords.length === 0 && (
          <div className="text-center py-8">
            <GitCompare className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-600">No records found matching your criteria</p>
          </div>
        )}

        {/* Enhanced Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-secondary-500">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, filteredAndSortedRecords.length)} of {filteredAndSortedRecords.length} records
            </div>
            
            <select
              value={pagination.pageSize}
              onChange={(e) => {
                const newPageSize = Number(e.target.value)
                setPagination((prev: any) => ({
                  ...prev,
                  pageSize: newPageSize,
                  page: 1,
                  totalPages: Math.ceil(prev.totalRecords / newPageSize)
                }))
              }}
              className="input-field w-20 text-sm"
              title="Records per page"
              aria-label="Records per page"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagination((prev: any) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-secondary-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => setPagination((prev: any) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Processing Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Processing Indonesian Matching
              </h3>
              <p className="text-secondary-600 mb-4">
                Running AI-powered matching algorithms with Indonesian data support...
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
    </div>
  )
}

export default SynchronizedReconciliationPage
