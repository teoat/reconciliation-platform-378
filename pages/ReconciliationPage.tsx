'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useData } from '../components/DataProvider'
import { useProjects, useRealtimeCollaboration } from '../hooks/useApi'
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
  X
} from 'lucide-react'
import { useUnifiedData } from '../components/UnifiedDataProvider'
import WorkflowOrchestrator from '../components/WorkflowOrchestrator'

// Enhanced Interfaces
interface ReconciliationSource {
  id: string
  systemId: string
  systemName: string
  recordId: string
  data: Record<string, any>
  timestamp: string
  quality: DataQuality
  confidence: number
  metadata: Record<string, any>
}

interface DataQuality {
  completeness: number
  accuracy: number
  consistency: number
  validity: number
  duplicates: number
  errors: number
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

interface MatchingCriteria {
  field: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'fuzzy'
  value: any
  tolerance?: number
  weight: number
}

interface MatchingResult {
  matched: boolean
  confidence: number
  reason: string
  details: Record<string, any>
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

interface EnhancedReconciliationRecord {
  id: string
  reconciliationId: string
  batchId: string
  sources: ReconciliationSource[]
  status: 'matched' | 'unmatched' | 'discrepancy' | 'pending' | 'resolved' | 'escalated'
  confidence: number
  matchingRules: MatchingRule[]
  auditTrail: AuditEntry[]
  metadata: {
    createdAt: string
    updatedAt: string
    createdBy: string
    updatedBy: string
    version: number
    tags: string[]
    priority: 'low' | 'medium' | 'high' | 'critical'
  }
  relationships: RecordRelationship[]
  resolution?: Resolution
  matchScore: number
  difference?: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

interface ReconciliationMetrics {
  totalRecords: number
  matchedRecords: number
  unmatchedRecords: number
  discrepancyRecords: number
  pendingRecords: number
  resolvedRecords: number
  escalatedRecords: number
  averageConfidence: number
  averageProcessingTime: number
  matchRate: number
  accuracy: number
  throughput: number
  errorRate: number
  slaCompliance: number
}

interface FilterConfig {
  field: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn'
  value: any
  value2?: any
  active: boolean
}

interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

interface PaginationConfig {
  page: number
  pageSize: number
  totalRecords: number
  totalPages: number
}

interface BulkAction {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  requiresSelection: boolean
  requiresConfirmation: boolean
  action: (selectedIds: string[]) => void
}

interface ReconciliationPageProps {
  project: any
  onProgressUpdate?: (step: string) => void
}

const ReconciliationPage = ({ project, onProgressUpdate }: ReconciliationPageProps) => {
  const { currentProject, getReconciliationData, transformReconciliationToCashflow } = useData()
  const { 
    crossPageData, 
    updateCrossPageData, 
    workflowProgress, 
    advanceWorkflow, 
    addNotification,
    validateCrossPageData 
  } = useUnifiedData()
  const { projects, fetchProjects } = useProjects()
  const { 
    isConnected, 
    activeUsers, 
    liveComments, 
    sendComment, 
    updatePresence 
  } = useRealtimeCollaboration('reconciliation')
  // Enhanced State Management
  const [records, setRecords] = useState<EnhancedReconciliationRecord[]>([])
  const [metrics, setMetrics] = useState<ReconciliationMetrics | null>(null)
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<FilterConfig[]>([])
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: 50,
    totalRecords: 0,
    totalPages: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'timeline'>('table')
  const [showFilters, setShowFilters] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [filterGroups, setFilterGroups] = useState<FilterConfig[][]>([])
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'analytics' | 'workflow'>('overview')
  const [selectedRecord, setSelectedRecord] = useState<EnhancedReconciliationRecord | null>(null)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false)

  // Initialize data from data management system
  useEffect(() => {
    const reconciliationData = getReconciliationData()
    
    if (reconciliationData && reconciliationData.records.length > 0) {
      // Use real data from data management system
      setRecords(reconciliationData.records as EnhancedReconciliationRecord[])
      setMetrics(reconciliationData.metrics)
      setPagination(prev => ({
        ...prev,
        totalRecords: reconciliationData.records.length,
        totalPages: Math.ceil(reconciliationData.records.length / prev.pageSize)
      }))
    } else {
      // Fallback to sample data if no real data available
      initializeSampleData()
    }

    onProgressUpdate?.('reconciliation_started')
  }, [currentProject, getReconciliationData])



  const initializeSampleData = () => {
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
              amount: 1500.00,
              date: '2023-12-01',
              description: 'Payment from Customer A',
              reference: 'INV-001',
              category: 'Revenue'
            },
            timestamp: '2023-12-01T10:00:00Z',
            quality: {
              completeness: 95,
              accuracy: 98,
              consistency: 92,
              validity: 96,
              duplicates: 0,
              errors: 0
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
              amount: 1500.00,
              date: '2023-12-01',
              description: 'Payment from Customer A',
              reference: 'TXN-001',
              category: 'Deposit'
            },
            timestamp: '2023-12-01T10:05:00Z',
            quality: {
              completeness: 98,
              accuracy: 99,
              consistency: 95,
              validity: 97,
              duplicates: 0,
              errors: 0
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
            name: 'Exact Amount Match',
            type: 'exact',
            criteria: [
              {
                field: 'amount',
                operator: 'equals',
                value: 1500.00,
                weight: 0.4
              }
            ],
            weight: 0.4,
            applied: true,
            result: {
              matched: true,
              confidence: 100,
              reason: 'Exact amount match',
              details: { amount: 1500.00 }
            },
            confidence: 100
          },
          {
            id: 'rule-2',
            name: 'Date Proximity Match',
            type: 'fuzzy',
            criteria: [
              {
                field: 'date',
                operator: 'equals',
                value: '2023-12-01',
                tolerance: 1,
                weight: 0.3
              }
            ],
            weight: 0.3,
            applied: true,
            result: {
              matched: true,
              confidence: 100,
              reason: 'Exact date match',
              details: { date: '2023-12-01' }
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
            timestamp: '2023-12-01T10:00:00Z',
            details: { source: 'System A' },
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...'
          }
        ],
        metadata: {
          createdAt: '2023-12-01T10:00:00Z',
          updatedAt: '2023-12-01T10:05:00Z',
          createdBy: 'user-1',
          updatedBy: 'system',
          version: 1,
          tags: ['high-value', 'customer-a'],
          priority: 'medium'
        },
        relationships: [],
        matchScore: 98.5,
        riskLevel: 'low'
      },
      {
        id: '2',
        reconciliationId: 'REC-2023-002',
        batchId: 'BATCH-001',
        sources: [
          {
            id: 'src-3',
            systemId: 'SYS-A',
            systemName: 'Accounting System',
            recordId: 'A002',
            data: {
              amount: 2500.00,
              date: '2023-12-02',
              description: 'Payment from Customer B',
              reference: 'INV-002',
              category: 'Revenue'
            },
            timestamp: '2023-12-02T09:00:00Z',
            quality: {
              completeness: 90,
              accuracy: 95,
              consistency: 88,
              validity: 92,
              duplicates: 0,
              errors: 0
            },
            confidence: 95,
            metadata: {
              source: 'API',
              version: '1.0',
              checksum: 'ghi789'
            }
          },
          {
            id: 'src-4',
            systemId: 'SYS-B',
            systemName: 'Bank System',
            recordId: 'B002',
            data: {
              amount: 2500.00,
              date: '2023-12-02',
              description: 'Payment from Customer B',
              reference: 'TXN-002',
              category: 'Deposit'
            },
            timestamp: '2023-12-02T09:05:00Z',
            quality: {
              completeness: 95,
              accuracy: 98,
              consistency: 90,
              validity: 94,
              duplicates: 0,
              errors: 0
            },
            confidence: 97,
            metadata: {
              source: 'File Upload',
              version: '2.1',
              checksum: 'jkl012'
            }
          }
        ],
        status: 'matched',
        confidence: 96,
        matchingRules: [
          {
            id: 'rule-3',
            name: 'Exact Amount Match',
            type: 'exact',
            criteria: [
              {
                field: 'amount',
                operator: 'equals',
                value: 2500.00,
                weight: 0.4
              }
            ],
            weight: 0.4,
            applied: true,
            result: {
              matched: true,
              confidence: 100,
              reason: 'Exact amount match',
              details: { amount: 2500.00 }
            },
            confidence: 100
          }
        ],
        auditTrail: [
          {
            id: 'audit-2',
            userId: 'user-1',
            userName: 'John Smith',
            action: 'Record Created',
            timestamp: '2023-12-02T09:00:00Z',
            details: { source: 'System A' },
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...'
          }
        ],
        metadata: {
          createdAt: '2023-12-02T09:00:00Z',
          updatedAt: '2023-12-02T09:05:00Z',
          createdBy: 'user-1',
          updatedBy: 'system',
          version: 1,
          tags: ['high-value', 'customer-b'],
          priority: 'high'
        },
        relationships: [],
        matchScore: 96,
        riskLevel: 'low'
      },
      {
        id: '3',
        reconciliationId: 'REC-2023-003',
        batchId: 'BATCH-001',
        sources: [
          {
            id: 'src-5',
            systemId: 'SYS-A',
            systemName: 'Accounting System',
            recordId: 'A003',
            data: {
              amount: 750.00,
              date: '2023-12-03',
              description: 'Payment from Customer C',
              reference: 'INV-003',
              category: 'Revenue'
            },
            timestamp: '2023-12-03T11:00:00Z',
            quality: {
              completeness: 85,
              accuracy: 90,
              consistency: 82,
              validity: 88,
              duplicates: 0,
              errors: 0
            },
            confidence: 90,
            metadata: {
              source: 'API',
              version: '1.0',
              checksum: 'mno345'
            }
          },
          {
            id: 'src-6',
            systemId: 'SYS-B',
            systemName: 'Bank System',
            recordId: 'B003',
            data: {
              amount: 750.50,
              date: '2023-12-03',
              description: 'Payment from Customer C',
              reference: 'TXN-003',
              category: 'Deposit'
            },
            timestamp: '2023-12-03T11:05:00Z',
            quality: {
              completeness: 90,
              accuracy: 95,
              consistency: 85,
              validity: 90,
              duplicates: 0,
              errors: 0
            },
            confidence: 95,
            metadata: {
              source: 'File Upload',
              version: '2.1',
              checksum: 'pqr678'
            }
          }
        ],
        status: 'discrepancy',
        confidence: 85,
        matchingRules: [
          {
            id: 'rule-4',
            name: 'Amount Tolerance Match',
            type: 'fuzzy',
            criteria: [
              {
                field: 'amount',
                operator: 'equals',
                value: 750.00,
                tolerance: 1.0,
                weight: 0.4
              }
            ],
            weight: 0.4,
            applied: true,
            result: {
              matched: false,
              confidence: 85,
              reason: 'Amount difference exceeds tolerance',
              details: { difference: 0.50, tolerance: 1.0 }
            },
            confidence: 85
          }
        ],
        auditTrail: [
          {
            id: 'audit-3',
            userId: 'user-1',
            userName: 'John Smith',
            action: 'Record Created',
            timestamp: '2023-12-03T11:00:00Z',
            details: { source: 'System A' },
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...'
          },
          {
            id: 'audit-4',
            userId: 'system',
            userName: 'System',
            action: 'Discrepancy Detected',
            timestamp: '2023-12-03T11:05:00Z',
            details: { difference: 0.50, threshold: 1.0 },
            ipAddress: '192.168.1.1',
            userAgent: 'System'
          }
        ],
        metadata: {
          createdAt: '2023-12-03T11:00:00Z',
          updatedAt: '2023-12-03T11:05:00Z',
          createdBy: 'user-1',
          updatedBy: 'system',
          version: 2,
          tags: ['discrepancy', 'customer-c'],
          priority: 'high'
        },
        relationships: [],
        matchScore: 85,
        difference: 0.50,
        riskLevel: 'medium',
        resolution: {
          id: 'res-1',
          type: 'manual',
          status: 'pending',
          assignedTo: 'user-2',
          assignedBy: 'user-1',
          assignedAt: '2023-12-03T11:10:00Z',
          resolution: '',
          comments: ['Amount difference detected - needs manual review'],
          attachments: []
        }
      },
      {
        id: '4',
        reconciliationId: 'REC-2023-004',
        batchId: 'BATCH-001',
        sources: [
          {
            id: 'src-7',
            systemId: 'SYS-A',
            systemName: 'Accounting System',
            recordId: 'A004',
            data: {
              amount: 3200.00,
              date: '2023-12-04',
              description: 'Payment from Customer D',
              reference: 'INV-004',
              category: 'Revenue'
            },
            timestamp: '2023-12-04T09:00:00Z',
            quality: {
              completeness: 95,
              accuracy: 98,
              consistency: 92,
              validity: 96,
              duplicates: 0,
              errors: 0
            },
            confidence: 98,
            metadata: {
              source: 'API',
              version: '1.0',
              checksum: 'stu901'
            }
          },
          {
            id: 'src-8',
            systemId: 'SYS-B',
            systemName: 'Bank System',
            recordId: 'B004',
            data: {
              amount: 3200.00,
              date: '2023-12-04',
              description: 'Payment from Customer D',
              reference: 'TXN-004',
              category: 'Deposit'
            },
            timestamp: '2023-12-04T09:05:00Z',
            quality: {
              completeness: 98,
              accuracy: 99,
              consistency: 95,
              validity: 97,
              duplicates: 0,
              errors: 0
            },
            confidence: 99,
            metadata: {
              source: 'File Upload',
              version: '2.1',
              checksum: 'vwx234'
            }
          },
          {
            id: 'src-9',
            systemId: 'SYS-C',
            systemName: 'Payment Gateway',
            recordId: 'C004',
            data: {
              amount: 3200.00,
              date: '2023-12-04',
              description: 'Payment from Customer D',
              reference: 'PG-004',
              category: 'Transaction',
              gateway: 'Stripe',
              fee: 96.00
            },
            timestamp: '2023-12-04T09:03:00Z',
            quality: {
              completeness: 92,
              accuracy: 97,
              consistency: 90,
              validity: 94,
              duplicates: 0,
              errors: 0
            },
            confidence: 97,
            metadata: {
              source: 'Webhook',
              version: '3.0',
              checksum: 'yza567'
            }
          },
          {
            id: 'src-10',
            systemId: 'SYS-D',
            systemName: 'CRM System',
            recordId: 'D004',
            data: {
              amount: 3200.00,
              date: '2023-12-04',
              description: 'Payment from Customer D',
              reference: 'CRM-004',
              category: 'Customer Payment',
              customerId: 'CUST-004',
              salesRep: 'John Doe'
            },
            timestamp: '2023-12-04T09:10:00Z',
            quality: {
              completeness: 88,
              accuracy: 94,
              consistency: 87,
              validity: 91,
              duplicates: 0,
              errors: 0
            },
            confidence: 94,
            metadata: {
              source: 'API',
              version: '2.5',
              checksum: 'bcd890'
            }
          }
        ],
        status: 'matched',
        confidence: 97,
        matchingRules: [
          {
            id: 'rule-5',
            name: 'Multi-System Exact Match',
            type: 'exact',
            criteria: [
              {
                field: 'amount',
                operator: 'equals',
                value: 3200.00,
                weight: 0.4
              },
              {
                field: 'date',
                operator: 'equals',
                value: '2023-12-04',
                weight: 0.3
              },
              {
                field: 'description',
                operator: 'equals',
                value: 'Payment from Customer D',
                weight: 0.3
              }
            ],
            weight: 1.0,
            applied: true,
            result: {
              matched: true,
              confidence: 100,
              reason: 'Perfect match across all 4 systems',
              details: { 
                systemsMatched: 4,
                amountConsistency: 100,
                dateConsistency: 100,
                descriptionConsistency: 100
              }
            },
            confidence: 100
          }
        ],
        auditTrail: [
          {
            id: 'audit-5',
            userId: 'user-1',
            userName: 'John Smith',
            action: 'Multi-System Record Created',
            timestamp: '2023-12-04T09:00:00Z',
            details: { 
              systems: ['SYS-A', 'SYS-B', 'SYS-C', 'SYS-D'],
              totalSources: 4
            },
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...'
          },
          {
            id: 'audit-6',
            userId: 'system',
            userName: 'System',
            action: 'Multi-System Match Confirmed',
            timestamp: '2023-12-04T09:15:00Z',
            details: { 
              matchScore: 97,
              systemsVerified: 4,
              confidence: 97
            },
            ipAddress: '192.168.1.1',
            userAgent: 'System'
          }
        ],
        metadata: {
          createdAt: '2023-12-04T09:00:00Z',
          updatedAt: '2023-12-04T09:15:00Z',
          createdBy: 'user-1',
          updatedBy: 'system',
          version: 1,
          tags: ['multi-system', 'high-value', 'customer-d', 'perfect-match'],
          priority: 'high'
        },
        relationships: [
          {
            id: 'rel-1',
            type: 'parent',
            targetRecordId: 'REC-2023-001',
            confidence: 85,
            reason: 'Same customer payment pattern'
          }
        ],
        matchScore: 97,
        riskLevel: 'low'
      }
    ]

    setRecords(sampleRecords)
    
    // Calculate metrics
    const calculatedMetrics: ReconciliationMetrics = {
      totalRecords: sampleRecords.length,
      matchedRecords: sampleRecords.filter(r => r.status === 'matched').length,
      unmatchedRecords: sampleRecords.filter(r => r.status === 'unmatched').length,
      discrepancyRecords: sampleRecords.filter(r => r.status === 'discrepancy').length,
      pendingRecords: sampleRecords.filter(r => r.status === 'pending').length,
      resolvedRecords: sampleRecords.filter(r => r.status === 'resolved').length,
      escalatedRecords: sampleRecords.filter(r => r.status === 'escalated').length,
      averageConfidence: sampleRecords.reduce((sum, r) => sum + r.confidence, 0) / sampleRecords.length,
      averageProcessingTime: 2.5,
      matchRate: (sampleRecords.filter(r => r.status === 'matched').length / sampleRecords.length) * 100,
      accuracy: 96.5,
      throughput: 150,
      errorRate: 2.1,
      slaCompliance: 98.5
    }
    
    setMetrics(calculatedMetrics)
    setPagination(prev => ({
      ...prev,
      totalRecords: sampleRecords.length,
      totalPages: Math.ceil(sampleRecords.length / prev.pageSize)
    }))
  }

  // Advanced filtering functions
  const applyFilter = (record: EnhancedReconciliationRecord, filter: FilterConfig): boolean => {
    const value = getNestedValue(record, filter.field)
    switch (filter.operator) {
      case 'equals':
        return value === filter.value
      case 'contains':
        return String(value).toLowerCase().includes(String(filter.value).toLowerCase())
      case 'startsWith':
        return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase())
      case 'endsWith':
        return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase())
      case 'greaterThan':
        return Number(value) > Number(filter.value)
      case 'lessThan':
        return Number(value) < Number(filter.value)
      case 'between':
        return Number(value) >= Number(filter.value) && Number(value) <= Number(filter.value2)
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(value)
      case 'notIn':
        return Array.isArray(filter.value) && !filter.value.includes(value)
      default:
        return true
    }
  }

  const applyFilterGroup = (record: EnhancedReconciliationRecord, group: FilterConfig[]): boolean => {
    const activeFilters = group.filter(f => f.active)
    if (activeFilters.length === 0) return true
    
    return activeFilters.every(filter => applyFilter(record, filter))
  }

  // Enhanced filtering and sorting
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = records

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

    // Apply advanced filter groups
    if (filterGroups.length > 0) {
      filtered = filtered.filter(record => {
        if (filterLogic === 'AND') {
          return filterGroups.every(group => applyFilterGroup(record, group))
        } else {
          return filterGroups.some(group => applyFilterGroup(record, group))
        }
      })
    }

    // Apply legacy filters (for backward compatibility)
    filters.forEach(filter => {
      if (!filter.active) return
      filtered = filtered.filter(record => applyFilter(record, filter))
    })

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
  }, [records, searchTerm, filters, filterGroups, filterLogic, sortConfig])

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800'
      case 'medium':
        return 'bg-blue-100 text-blue-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Event handlers
  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev?.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
      page: 1,
      totalPages: Math.ceil(prev.totalRecords / newPageSize)
    }))
  }

  const handleSelectRecord = (recordId: string) => {
    setSelectedRecords(prev => {
      const newSet = new Set(prev)
      if (newSet.has(recordId)) {
        newSet.delete(recordId)
      } else {
        newSet.add(recordId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedRecords.size === paginatedRecords.length) {
      setSelectedRecords(new Set())
    } else {
      setSelectedRecords(new Set(paginatedRecords.map(r => r.id)))
    }
  }

  const handleBulkAction = (action: BulkAction) => {
    if (action.requiresSelection && selectedRecords.size === 0) {
      alert('Please select records first')
      return
    }
    
    if (action.requiresConfirmation) {
      if (!confirm(`Are you sure you want to ${action.name.toLowerCase()} ${selectedRecords.size} records?`)) {
        return
      }
    }
    
    action.action(Array.from(selectedRecords))
    setSelectedRecords(new Set())
  }

  // Advanced Filter Management
  const addFilterGroup = () => {
    const newGroup: FilterConfig[] = [{
      field: 'status',
      operator: 'equals',
      value: 'matched',
      active: true
    }]
    setFilterGroups(prev => [...prev, newGroup])
  }

  const removeFilterGroup = (index: number) => {
    setFilterGroups(prev => prev.filter((_, i) => i !== index))
  }

  const addFilterToGroup = (groupIndex: number) => {
    setFilterGroups(prev => prev.map((group, i) => 
      i === groupIndex 
        ? [...group, {
            field: 'matchScore',
            operator: 'greaterThan',
            value: 80,
            active: true
          }]
        : group
    ))
  }

  const removeFilterFromGroup = (groupIndex: number, filterIndex: number) => {
    setFilterGroups(prev => prev.map((group, i) => 
      i === groupIndex 
        ? group.filter((_, j) => j !== filterIndex)
        : group
    ))
  }

  const updateFilterInGroup = (groupIndex: number, filterIndex: number, updates: Partial<FilterConfig>) => {
    setFilterGroups(prev => prev.map((group, i) => 
      i === groupIndex 
        ? group.map((filter, j) => 
            j === filterIndex 
              ? { ...filter, ...updates }
              : filter
          )
        : group
    ))
  }

  const clearAllFilters = () => {
    setFilterGroups([])
    setFilters([])
    setSearchTerm('')
  }

  const saveFilterPreset = (name: string) => {
    const preset = {
      name,
      filterGroups,
      filterLogic,
      filters,
      searchTerm,
      timestamp: new Date().toISOString()
    }
    // In a real app, this would save to localStorage or backend
    console.log('Saving filter preset:', preset)
  }

  const loadFilterPreset = (preset: any) => {
    setFilterGroups(preset.filterGroups || [])
    setFilterLogic(preset.filterLogic || 'AND')
    setFilters(preset.filters || [])
    setSearchTerm(preset.searchTerm || '')
  }

  // AI Matching Engine
  const matchingEngine = {
    exactMatch: (field1: any, field2: any): boolean => {
      return field1 === field2
    },
    
    fuzzyMatch: (text1: string, text2: string): number => {
      if (!text1 || !text2) return 0
      
      const s1 = text1.toLowerCase().trim()
      const s2 = text2.toLowerCase().trim()
      
      if (s1 === s2) return 100
      
      // Levenshtein distance-based similarity
      const distance = levenshteinDistance(s1, s2)
      const maxLength = Math.max(s1.length, s2.length)
      return maxLength === 0 ? 100 : Math.round(((maxLength - distance) / maxLength) * 100)
    },
    
    dateMatch: (date1: string, date2: string, toleranceDays: number = 1): number => {
      const d1 = new Date(date1)
      const d2 = new Date(date2)
      
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0
      
      const diffDays = Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24)
      
      if (diffDays <= toleranceDays) {
        return Math.max(0, 100 - (diffDays / toleranceDays) * 50)
      }
      
      return 0
    },
    
    amountMatch: (amount1: number, amount2: number, tolerancePercent: number = 1): number => {
      if (amount1 === amount2) return 100
      
      const difference = Math.abs(amount1 - amount2)
      const averageAmount = (amount1 + amount2) / 2
      const percentDifference = (difference / averageAmount) * 100
      
      if (percentDifference <= tolerancePercent) {
        return Math.max(0, 100 - percentDifference)
      }
      
      return 0
    },
    
    mlMatch: (record1: any, record2: any): number => {
      // Simulate ML-based matching with weighted features
      const features = {
        amount: 0.4,
        date: 0.3,
        description: 0.2,
        reference: 0.1
      }
      
      let totalScore = 0
      let totalWeight = 0
      
      Object.entries(features).forEach(([field, weight]) => {
        const val1 = record1[field]
        const val2 = record2[field]
        
        if (val1 !== undefined && val2 !== undefined) {
          let score = 0
          
          if (field === 'amount') {
            score = matchingEngine.amountMatch(val1, val2, 2)
          } else if (field === 'date') {
            score = matchingEngine.dateMatch(val1, val2, 2)
          } else if (typeof val1 === 'string' && typeof val2 === 'string') {
            score = matchingEngine.fuzzyMatch(val1, val2)
          } else {
            score = matchingEngine.exactMatch(val1, val2) ? 100 : 0
          }
          
          totalScore += score * weight
          totalWeight += weight
        }
      })
      
      return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0
    },
    
    multiSystemMatch: (sources: ReconciliationSource[]): number => {
      if (sources.length < 2) return 0
      
      let totalScore = 0
      let comparisons = 0
      
      // Compare each source with every other source
      for (let i = 0; i < sources.length; i++) {
        for (let j = i + 1; j < sources.length; j++) {
          const score = matchingEngine.mlMatch(sources[i].data, sources[j].data)
          totalScore += score
          comparisons++
        }
      }
      
      // Calculate average consistency across all systems
      const averageScore = comparisons > 0 ? totalScore / comparisons : 0
      
      // Bonus for multi-system consistency
      const systemBonus = sources.length >= 3 ? Math.min(10, (sources.length - 2) * 3) : 0
      
      return Math.min(100, Math.round(averageScore + systemBonus))
    }
  }

  // Helper function for Levenshtein distance
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  // Enhanced matching function with workflow integration
  const runAIMatching = async () => {
    setIsProcessing(true)
    setProcessingProgress(0)
    
    try {
      // Sync with ingestion data
      const ingestionData = crossPageData.ingestion
      if (ingestionData.processedData.length > 0) {
        // Use ingested data for reconciliation
        const reconciliationRecords = ingestionData.processedData.map((data, index) => ({
          id: `record-${index}`,
          sources: [{
            id: `source-${index}`,
            systemId: 'system-a',
            systemName: 'System A',
            data: data,
            quality: { completeness: 0.95, accuracy: 0.90, consistency: 0.85, validity: 0.88 },
            confidence: 0.92,
            lastUpdated: new Date().toISOString()
          }],
          status: 'pending' as const,
          confidence: 0,
          discrepancyType: null,
          severity: 'low' as const,
          metadata: {
            version: '1.0',
            category: 'transaction',
            createdAt: new Date().toISOString(),
            createdBy: 'system',
            updatedAt: new Date().toISOString(),
            updatedBy: 'system',
            tags: [],
            source: 'ingestion'
          },
          sla: {
            targetResolutionTime: 24,
            escalationTriggers: ['timeout', 'high_priority'],
            actualResolutionTime: null,
            isOverdue: false
          },
          resolution: null
        }))
        
        setRecords(reconciliationRecords as any)
      }
      
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 15, 100)
          if (newProgress >= 100) {
            clearInterval(interval)
            setIsProcessing(false)
          
          // Apply AI matching to records
          setRecords(prev => prev.map(record => {
            if (record.sources.length >= 2) {
              // Use multi-system matching for records with 2+ sources
              const multiSystemScore = matchingEngine.multiSystemMatch(record.sources)
              
              // Calculate individual field consistency
              const amounts = record.sources.map(s => s.data.amount)
              const dates = record.sources.map(s => s.data.date)
              const descriptions = record.sources.map(s => s.data.description)
              
              const amountConsistency = amounts.every(amount => amount === amounts[0]) ? 100 : 
                Math.max(0, 100 - (Math.max(...amounts) - Math.min(...amounts)) / Math.max(...amounts) * 100)
              
              const dateConsistency = dates.every(date => date === dates[0]) ? 100 : 
                Math.max(0, 100 - Math.abs(new Date(dates[0]).getTime() - new Date(dates[1]).getTime()) / (1000 * 60 * 60 * 24))
              
              const descriptionConsistency = descriptions.every(desc => desc === descriptions[0]) ? 100 :
                Math.round(descriptions.reduce((sum, desc, i) => {
                  if (i === 0) return 100
                  return sum + matchingEngine.fuzzyMatch(descriptions[0], desc)
                }, 0) / descriptions.length)
              
              let newStatus = record.status
              let newConfidence = multiSystemScore
              
              if (multiSystemScore >= 95 && amountConsistency >= 95) {
                newStatus = 'matched'
                newConfidence = Math.max(multiSystemScore, 95)
              } else if (multiSystemScore >= 70) {
                newStatus = 'discrepancy'
                newConfidence = multiSystemScore
              } else {
                newStatus = 'unmatched'
                newConfidence = multiSystemScore
              }
              
              return {
                ...record,
                status: newStatus,
                confidence: newConfidence,
                matchScore: newConfidence,
                matchingRules: [
                  {
                    id: 'ai-multi-system-rule',
                    name: 'AI Multi-System Match',
                    type: 'algorithmic' as const,
                    criteria: [
                      { field: 'amount', operator: 'equals' as const, value: amounts[0], weight: 0.4 },
                      { field: 'date', operator: 'equals' as const, value: dates[0], weight: 0.3 },
                      { field: 'description', operator: 'fuzzy' as const, value: descriptions[0], weight: 0.3 }
                    ],
                    weight: 1.0,
                    applied: true,
                    result: {
                      matched: newStatus === 'matched',
                      confidence: newConfidence,
                      reason: `Multi-system AI matching score: ${multiSystemScore}% (${record.sources.length} systems)`,
                      details: { 
                        multiSystemScore, 
                        amountConsistency, 
                        dateConsistency, 
                        descriptionConsistency,
                        systemsCount: record.sources.length,
                        systemNames: record.sources.map(s => s.systemName)
                      }
                    },
                    confidence: newConfidence
                  }
                ]
              }
            }
            return record
          }))
          
          onProgressUpdate?.('ai_matching_completed')
          
          // Update cross-page data with reconciliation results
          const updatedRecords = records.map(record => {
            if (record.sources.length >= 2) {
              const multiSystemScore = matchingEngine.multiSystemMatch(record.sources)
              const amounts = record.sources.map(s => s.data.amount)
              const amountConsistency = amounts.every(amount => amount === amounts[0]) ? 100 : 
                Math.max(0, 100 - (Math.max(...amounts) - Math.min(...amounts)) / Math.max(...amounts) * 100)
              
              let newStatus = record.status
              let newConfidence = multiSystemScore
              
              if (multiSystemScore >= 95 && amountConsistency >= 95) {
                newStatus = 'matched'
                newConfidence = Math.max(multiSystemScore, 95)
              } else if (multiSystemScore >= 70) {
                newStatus = 'discrepancy'
                newConfidence = multiSystemScore
              } else {
                newStatus = 'unmatched'
                newConfidence = multiSystemScore
              }
              
              return {
                ...record,
                status: newStatus,
                confidence: newConfidence
              }
            }
            return record
          })
          
          // Calculate metrics
          const matchedCount = updatedRecords.filter(r => r.status === 'matched').length
          const discrepancyCount = updatedRecords.filter(r => r.status === 'discrepancy').length
          const unmatchedCount = updatedRecords.filter(r => r.status === 'unmatched').length
          const matchRate = updatedRecords.length > 0 ? (matchedCount / updatedRecords.length) * 100 : 0
          
          // Update cross-page data
          updateCrossPageData('reconciliation', {
            records: updatedRecords,
            matchingResults: updatedRecords.map(r => ({
              id: r.id,
              recordA: r.sources[0]?.data,
              recordB: r.sources[1]?.data,
              confidence: r.confidence,
              matchType: r.status === 'matched' ? 'exact' : r.status === 'discrepancy' ? 'fuzzy' : 'none',
              status: r.status
            })),
            discrepancies: updatedRecords.filter(r => r.status === 'discrepancy'),
            qualityMetrics: {
              matchRate,
              processingTime: 2.5,
              discrepancyRate: (discrepancyCount / updatedRecords.length) * 100,
              autoMatchRate: matchRate
            },
            lastUpdated: new Date()
          })
          
          // Check if we should auto-advance to adjudication
          if (discrepancyCount > 0) {
            addNotification({
              type: 'info',
              title: 'Discrepancies Found',
              message: `${discrepancyCount} discrepancies require adjudication. Advancing to adjudication stage.`,
              page: 'reconciliation',
              isRead: false
            })
            
            // Auto-advance to adjudication after a delay
            setTimeout(async () => {
              await advanceWorkflow({
                id: 'adjudication',
                name: 'Discrepancy Adjudication',
                page: 'adjudication',
                order: 3,
                isCompleted: false,
                isActive: true,
                validation: { isValid: true, errors: [], warnings: [], suggestions: [] },
                data: { discrepancies: discrepancyCount, records: updatedRecords }
              })
            }, 3000)
          } else {
            addNotification({
              type: 'success',
              title: 'Reconciliation Complete',
              message: 'All records matched successfully. No discrepancies found.',
              page: 'reconciliation',
              isRead: false
            })
          }
        }
        return newProgress
      })
    }, 300)
    
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Matching Failed',
        message: 'Failed to run AI matching',
        page: 'reconciliation',
        isRead: false
      })
      setIsProcessing(false)
    }
  }

  const bulkActions: BulkAction[] = [
    {
      id: 'approve',
      name: 'Approve Matches',
      icon: <CheckCircle className="w-4 h-4" />,
      description: 'Approve selected matched records',
      requiresSelection: true,
      requiresConfirmation: true,
      action: (ids) => {
        setRecords(prev => prev.map(record => 
          ids.includes(record.id) && record.status === 'matched'
            ? { 
                ...record, 
                status: 'resolved' as const,
                auditTrail: [...record.auditTrail, {
                  id: `audit-${Date.now()}`,
                  userId: 'current-user',
                  userName: 'Current User',
                  action: 'Bulk Approved',
                  timestamp: new Date().toISOString(),
                  details: { bulkAction: true, recordCount: ids.length },
                  ipAddress: '192.168.1.100',
                  userAgent: 'Mozilla/5.0...'
                }]
              }
            : record
        ))
      }
    },
    {
      id: 'reject',
      name: 'Reject Matches',
      icon: <XCircle className="w-4 h-4" />,
      description: 'Reject selected matched records',
      requiresSelection: true,
      requiresConfirmation: true,
      action: (ids) => {
        setRecords(prev => prev.map(record => 
          ids.includes(record.id) && record.status === 'matched'
            ? { 
                ...record, 
                status: 'unmatched' as const,
                auditTrail: [...record.auditTrail, {
                  id: `audit-${Date.now()}`,
                  userId: 'current-user',
                  userName: 'Current User',
                  action: 'Bulk Rejected',
                  timestamp: new Date().toISOString(),
                  details: { bulkAction: true, recordCount: ids.length },
                  ipAddress: '192.168.1.100',
                  userAgent: 'Mozilla/5.0...'
                }]
              }
            : record
        ))
      }
    },
    {
      id: 'assign',
      name: 'Assign to User',
      icon: <UserCheck className="w-4 h-4" />,
      description: 'Assign selected records to a user',
      requiresSelection: true,
      requiresConfirmation: false,
      action: (ids) => {
        const assignee = prompt('Enter username to assign records to:')
        if (assignee) {
          setRecords(prev => prev.map(record => 
            ids.includes(record.id)
              ? { 
                  ...record, 
                  resolution: {
                    ...record.resolution,
                    id: `res-${Date.now()}`,
                    type: 'manual' as const,
                    status: 'pending' as const,
                    assignedTo: assignee,
                    assignedBy: 'current-user',
                    assignedAt: new Date().toISOString(),
                    resolution: '',
                    comments: [`Assigned to ${assignee} via bulk action`],
                    attachments: []
                  },
                  auditTrail: [...record.auditTrail, {
                    id: `audit-${Date.now()}`,
                    userId: 'current-user',
                    userName: 'Current User',
                    action: 'Bulk Assigned',
                    timestamp: new Date().toISOString(),
                    details: { 
                      bulkAction: true, 
                      recordCount: ids.length, 
                      assignee,
                      previousAssignee: record.resolution?.assignedTo
                    },
                    ipAddress: '192.168.1.100',
                    userAgent: 'Mozilla/5.0...'
                  }]
                }
              : record
          ))
        }
      }
    },
    {
      id: 'escalate',
      name: 'Escalate',
      icon: <AlertCircle className="w-4 h-4" />,
      description: 'Escalate selected records for review',
      requiresSelection: true,
      requiresConfirmation: true,
      action: (ids) => {
        setRecords(prev => prev.map(record => 
          ids.includes(record.id)
            ? { 
                ...record, 
                status: 'escalated' as const,
                auditTrail: [...record.auditTrail, {
                  id: `audit-${Date.now()}`,
                  userId: 'current-user',
                  userName: 'Current User',
                  action: 'Bulk Escalated',
                  timestamp: new Date().toISOString(),
                  details: { bulkAction: true, recordCount: ids.length },
                  ipAddress: '192.168.1.100',
                  userAgent: 'Mozilla/5.0...'
                }]
              }
            : record
        ))
      }
    },
    {
      id: 'change-priority',
      name: 'Change Priority',
      icon: <Flag className="w-4 h-4" />,
      description: 'Change priority of selected records',
      requiresSelection: true,
      requiresConfirmation: false,
      action: (ids) => {
        const priority = prompt('Enter new priority (low, medium, high, critical):')
        if (priority && ['low', 'medium', 'high', 'critical'].includes(priority)) {
          setRecords(prev => prev.map(record => 
            ids.includes(record.id)
              ? { 
                  ...record, 
                  metadata: {
                    ...record.metadata,
                    priority: priority as 'low' | 'medium' | 'high' | 'critical',
                    updatedAt: new Date().toISOString(),
                    updatedBy: 'current-user'
                  },
                  auditTrail: [...record.auditTrail, {
                    id: `audit-${Date.now()}`,
                    userId: 'current-user',
                    userName: 'Current User',
                    action: 'Bulk Priority Changed',
                    timestamp: new Date().toISOString(),
                    details: { 
                      bulkAction: true, 
                      recordCount: ids.length, 
                      newPriority: priority,
                      previousPriority: record.metadata.priority
                    },
                    ipAddress: '192.168.1.100',
                    userAgent: 'Mozilla/5.0...'
                  }]
                }
              : record
          ))
        }
      }
    },
    {
      id: 'add-tags',
      name: 'Add Tags',
      icon: <Tag className="w-4 h-4" />,
      description: 'Add tags to selected records',
      requiresSelection: true,
      requiresConfirmation: false,
      action: (ids) => {
        const tags = prompt('Enter tags (comma-separated):')
        if (tags) {
          const newTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
          setRecords(prev => prev.map(record => 
            ids.includes(record.id)
              ? { 
                  ...record, 
                  metadata: {
                    ...record.metadata,
                    tags: Array.from(new Set([...record.metadata.tags, ...newTags])),
                    updatedAt: new Date().toISOString(),
                    updatedBy: 'current-user'
                  },
                  auditTrail: [...record.auditTrail, {
                    id: `audit-${Date.now()}`,
                    userId: 'current-user',
                    userName: 'Current User',
                    action: 'Bulk Tags Added',
                    timestamp: new Date().toISOString(),
                    details: { 
                      bulkAction: true, 
                      recordCount: ids.length, 
                      addedTags: newTags
                    },
                    ipAddress: '192.168.1.100',
                    userAgent: 'Mozilla/5.0...'
                  }]
                }
              : record
          ))
        }
      }
    },
    {
      id: 'export',
      name: 'Export Selected',
      icon: <Download className="w-4 h-4" />,
      description: 'Export selected records to CSV',
      requiresSelection: true,
      requiresConfirmation: false,
      action: (ids) => {
        const selectedRecordsData = records.filter(r => ids.includes(r.id))
        const csvContent = generateCSV(selectedRecordsData)
        downloadCSV(csvContent, `reconciliation-records-${new Date().toISOString().split('T')[0]}.csv`)
      }
    },
    {
      id: 'reprocess',
      name: 'Reprocess',
      icon: <RefreshCw className="w-4 h-4" />,
      description: 'Reprocess selected records',
      requiresSelection: true,
      requiresConfirmation: true,
      action: (ids) => {
        setIsProcessing(true)
        setProcessingProgress(0)
        
        const interval = setInterval(() => {
          setProcessingProgress(prev => {
            const newProgress = Math.min(prev + Math.random() * 20, 100)
            if (newProgress >= 100) {
              clearInterval(interval)
              setIsProcessing(false)
              onProgressUpdate?.('reconciliation_reprocessed')
            }
            return newProgress
          })
        }, 200)
      }
    }
  ]

  // Helper functions for bulk operations
  const generateCSV = (records: EnhancedReconciliationRecord[]): string => {
    const headers = [
      'Reconciliation ID',
      'Status',
      'Match Score',
      'Risk Level',
      'Priority',
      'System Count',
      'Created At',
      'Updated At',
      'Tags'
    ]
    
    const rows = records.map(record => [
      record.reconciliationId,
      record.status,
      record.matchScore,
      record.riskLevel,
      record.metadata.priority,
      record.sources.length,
      record.metadata.createdAt,
      record.metadata.updatedAt,
      record.metadata.tags.join(';')
    ])
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Advanced Reconciliation
            </h1>
            <p className="text-secondary-600">
              AI-powered matching and reconciliation with comprehensive analytics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={runAIMatching}
              className="btn-secondary flex items-center space-x-2"
              title="Run AI matching"
              aria-label="Run AI matching to automatically match records"
            >
              <Zap className="w-4 h-4" />
              <span>Run AI Matching</span>
            </button>
            <button 
              className="btn-primary flex items-center space-x-2"
              title="Configure matching rules"
              aria-label="Configure matching rules and settings"
            >
              <Settings className="w-4 h-4" />
              <span>Configure Rules</span>
            </button>
          </div>
        </div>
        
        {project && (
          <div className="text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg inline-block">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* Workflow Orchestrator */}
      <WorkflowOrchestrator
        currentStage="reconciliation"
        onStageChange={(stage) => {
          // Handle stage change
          console.log('Stage change requested:', stage)
        }}
        onValidation={(stage) => {
          // Validate current stage
          return validateCrossPageData('reconciliation', stage)
        }}
        onDataSync={async (fromStage, toStage) => {
          // Sync data between stages
          console.log('Syncing data from', fromStage, 'to', toStage)
        }}
      />

      {/* Enhanced Metrics Dashboard */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Records</p>
                <p className="text-2xl font-bold text-secondary-900">{metrics.totalRecords}</p>
                <p className="text-xs text-secondary-500">+12% from last batch</p>
              </div>
              <GitCompare className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Match Rate</p>
                <p className="text-2xl font-bold text-green-600">{metrics.matchRate.toFixed(1)}%</p>
                <p className="text-xs text-secondary-500">Target: 95%</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.averageConfidence.toFixed(1)}%</p>
                <p className="text-xs text-secondary-500">High quality matches</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Processing Time</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.averageProcessingTime}s</p>
                <p className="text-xs text-secondary-500">Per record</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Status Distribution */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="card text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-green-600">{metrics.matchedRecords}</p>
            <p className="text-xs text-secondary-600">Matched</p>
          </div>
          <div className="card text-center">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-yellow-600">{metrics.discrepancyRecords}</p>
            <p className="text-xs text-secondary-600">Discrepancies</p>
          </div>
          <div className="card text-center">
            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-red-600">{metrics.unmatchedRecords}</p>
            <p className="text-xs text-secondary-600">Unmatched</p>
          </div>
          <div className="card text-center">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-blue-600">{metrics.pendingRecords}</p>
            <p className="text-xs text-secondary-600">Pending</p>
          </div>
          <div className="card text-center">
            <CheckSquare className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-green-600">{metrics.resolvedRecords}</p>
            <p className="text-xs text-secondary-600">Resolved</p>
          </div>
          <div className="card text-center">
            <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-red-600">{metrics.escalatedRecords}</p>
            <p className="text-xs text-secondary-600">Escalated</p>
          </div>
        </div>
      )}

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
              title="Toggle filters"
              aria-label="Toggle advanced filters panel"
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
                title="Toggle bulk actions"
                aria-label="Toggle bulk actions menu"
              >
                <span>{selectedRecords.size} selected</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
            
            <button 
              className="btn-secondary flex items-center space-x-2"
              title="Export data"
              aria-label="Export reconciliation data to file"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Bulk Actions Dropdown */}
        {showBulkActions && selectedRecords.size > 0 && (
          <div className="mt-4 pt-4 border-t border-secondary-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-secondary-600">
                Bulk Actions for {selectedRecords.size} records:
              </span>
              {bulkActions.map(action => (
                <button
                  key={action.id}
                  onClick={() => handleBulkAction(action)}
                  className="btn-secondary text-sm flex items-center space-x-1"
                  title={action.description}
                >
                  {action.icon}
                  <span>{action.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-secondary-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-secondary-900">Advanced Filters</h4>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={addFilterGroup}
                    className="btn-secondary text-sm flex items-center space-x-1"
                    title="Add filter group"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Group</span>
                  </button>
                  <button
                    onClick={clearAllFilters}
                    className="btn-secondary text-sm flex items-center space-x-1"
                    title="Clear all filters"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Filter Logic */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-secondary-600">Logic:</span>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="filterLogic"
                      value="AND"
                      checked={filterLogic === 'AND'}
                      onChange={(e) => setFilterLogic(e.target.value as 'AND' | 'OR')}
                      className="rounded border-secondary-300"
                    />
                    <span className="text-sm text-secondary-700">AND (All groups must match)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="filterLogic"
                      value="OR"
                      checked={filterLogic === 'OR'}
                      onChange={(e) => setFilterLogic(e.target.value as 'AND' | 'OR')}
                      className="rounded border-secondary-300"
                    />
                    <span className="text-sm text-secondary-700">OR (Any group can match)</span>
                  </label>
                </div>
              </div>

              {/* Filter Groups */}
              <div className="space-y-3">
                {filterGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="border border-secondary-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-secondary-900">
                        Filter Group {groupIndex + 1}
                      </h5>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => addFilterToGroup(groupIndex)}
                          className="btn-secondary text-xs flex items-center space-x-1"
                          title="Add filter to group"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Filter</span>
                        </button>
                        <button
                          onClick={() => removeFilterGroup(groupIndex)}
                          className="text-red-600 hover:text-red-700 text-xs"
                          title="Remove filter group"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {group.map((filter, filterIndex) => (
                        <div key={filterIndex} className="flex items-center space-x-2">
                          <select
                            value={filter.field}
                            onChange={(e) => updateFilterInGroup(groupIndex, filterIndex, { field: e.target.value })}
                            className="input-field text-sm w-32"
                            title="Filter field"
                          >
                            <option value="status">Status</option>
                            <option value="matchScore">Match Score</option>
                            <option value="riskLevel">Risk Level</option>
                            <option value="metadata.priority">Priority</option>
                            <option value="sources.length">System Count</option>
                            <option value="metadata.tags">Tags</option>
                          </select>

                          <select
                            value={filter.operator}
                            onChange={(e) => updateFilterInGroup(groupIndex, filterIndex, { operator: e.target.value as any })}
                            className="input-field text-sm w-24"
                            title="Filter operator"
                          >
                            <option value="equals">Equals</option>
                            <option value="contains">Contains</option>
                            <option value="greaterThan">Greater Than</option>
                            <option value="lessThan">Less Than</option>
                            <option value="between">Between</option>
                            <option value="in">In</option>
                            <option value="notIn">Not In</option>
                          </select>

                          <input
                            type="text"
                            value={filter.value}
                            onChange={(e) => updateFilterInGroup(groupIndex, filterIndex, { value: e.target.value })}
                            className="input-field text-sm w-32"
                            placeholder="Value"
                            title="Filter value"
                          />

                          {filter.operator === 'between' && (
                            <input
                              type="text"
                              value={filter.value2 || ''}
                              onChange={(e) => updateFilterInGroup(groupIndex, filterIndex, { value2: e.target.value })}
                              className="input-field text-sm w-32"
                              placeholder="To"
                              title="Second value for between"
                            />
                          )}

                          <label className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              checked={filter.active}
                              onChange={(e) => updateFilterInGroup(groupIndex, filterIndex, { active: e.target.checked })}
                              className="rounded border-secondary-300"
                              title="Enable filter"
                            />
                            <span className="text-xs text-secondary-600">Active</span>
                          </label>

                          <button
                            onClick={() => removeFilterFromGroup(groupIndex, filterIndex)}
                            className="text-red-600 hover:text-red-700 text-xs"
                            title="Remove filter"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Filter Presets */}
              <div className="border-t border-secondary-200 pt-4">
                <h5 className="font-medium text-secondary-900 mb-2">Quick Filters</h5>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setFilterGroups([[
                        { field: 'status', operator: 'equals', value: 'matched', active: true }
                      ]])
                    }}
                    className="btn-secondary text-xs"
                    title="Show only matched records"
                  >
                    Matched Only
                  </button>
                  <button
                    onClick={() => {
                      setFilterGroups([[
                        { field: 'status', operator: 'equals', value: 'discrepancy', active: true }
                      ]])
                    }}
                    className="btn-secondary text-xs"
                    title="Show only discrepancy records"
                  >
                    Discrepancies
                  </button>
                  <button
                    onClick={() => {
                      setFilterGroups([[
                        { field: 'matchScore', operator: 'greaterThan', value: 90, active: true }
                      ]])
                    }}
                    className="btn-secondary text-xs"
                    title="Show high confidence matches"
                  >
                    High Confidence
                  </button>
                  <button
                    onClick={() => {
                      setFilterGroups([[
                        { field: 'sources.length', operator: 'greaterThan', value: 2, active: true }
                      ]])
                    }}
                    className="btn-secondary text-xs"
                    title="Show multi-system records"
                  >
                    Multi-System
                  </button>
                  <button
                    onClick={() => {
                      setFilterGroups([[
                        { field: 'riskLevel', operator: 'equals', value: 'high', active: true },
                        { field: 'riskLevel', operator: 'equals', value: 'critical', active: true }
                      ]])
                    }}
                    className="btn-secondary text-xs"
                    title="Show high risk records"
                  >
                    High Risk
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
                    onChange={handleSelectAll}
                    className="rounded border-secondary-300"
                    title="Select all records"
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Reconciliation ID</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Sources</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Match Score</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Risk Level</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Priority</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-700">Last Updated</th>
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
                      onChange={() => handleSelectRecord(record.id)}
                      className="rounded border-secondary-300"
                      aria-label={`Select record ${record.id}`}
                      title={`Select record ${record.id}`}
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
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-medium text-secondary-600">
                          {record.sources.length} System{record.sources.length > 1 ? 's' : ''}
                        </span>
                        {record.sources.length >= 3 && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            Multi-System
                          </span>
                        )}
                      </div>
                      {record.sources.map((source, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            source.confidence >= 95 ? 'bg-green-500' :
                            source.confidence >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm font-medium">{source.systemName}</span>
                          <span className="text-xs text-secondary-500">({source.recordId})</span>
                          <span className="text-xs text-secondary-400">{source.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-secondary-200 rounded-full h-2">
                        <div
                          className={`progress-bar h-2 rounded-full ${
                            record.matchScore >= 90 ? 'progress-bar-green' :
                            record.matchScore >= 70 ? 'progress-bar-yellow' : 'progress-bar-red'
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(record.metadata.priority)}`}>
                      {record.metadata.priority.charAt(0).toUpperCase() + record.metadata.priority.slice(1)}
                    </span>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="text-sm text-secondary-600">
                      {new Date(record.metadata.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-secondary-500">
                      by {record.metadata.updatedBy}
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
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
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
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn-secondary text-sm disabled:opacity-50"
              title="Previous page"
              aria-label="Go to previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-secondary-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="btn-secondary text-sm disabled:opacity-50"
              title="Next page"
              aria-label="Go to next page"
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
                Processing Reconciliation
              </h3>
              <p className="text-secondary-600 mb-4">
                Running AI-powered matching algorithms...
              </p>
              <div className="w-full bg-secondary-200 rounded-full h-2 mb-2">
                <div
                  className="progress-bar progress-bar-primary h-2 rounded-full"
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

      {/* Detailed Record Modal */}
      {showRecordModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-secondary-900">
                Record Details: {selectedRecord.reconciliationId}
              </h3>
              <button
                onClick={() => setShowRecordModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
                title="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Record Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <div className="card">
                  <h4 className="text-lg font-semibold text-secondary-900 mb-4">Record Overview</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Status</label>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusIcon(selectedRecord.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedRecord.status)}`}>
                          {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Match Score</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-20 bg-secondary-200 rounded-full h-2">
                          <div
                            className={`progress-bar h-2 rounded-full ${
                              selectedRecord.matchScore >= 90 ? 'progress-bar-green' :
                              selectedRecord.matchScore >= 70 ? 'progress-bar-yellow' : 'progress-bar-red'
                            }`}
                            style={{ width: `${selectedRecord.matchScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{selectedRecord.matchScore}%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Risk Level</label>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(selectedRecord.riskLevel)}`}>
                        {selectedRecord.riskLevel.charAt(0).toUpperCase() + selectedRecord.riskLevel.slice(1)}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Priority</label>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedRecord.metadata.priority)}`}>
                        {selectedRecord.metadata.priority.charAt(0).toUpperCase() + selectedRecord.metadata.priority.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h4>
                <div className="space-y-2">
                  <button className="w-full btn-primary text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Match
                  </button>
                  <button className="w-full btn-secondary text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Escalate
                  </button>
                  <button className="w-full btn-secondary text-sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Record
                  </button>
                  <button className="w-full btn-secondary text-sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* Data Sources Comparison */}
            <div className="card mb-6">
              <h4 className="text-lg font-semibold text-secondary-900 mb-4">Data Sources Comparison</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedRecord.sources.map((source, index) => (
                  <div key={index} className="border border-secondary-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-secondary-900">{source.systemName}</h5>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-secondary-500">Quality: {source.quality.completeness}%</span>
                        <div className="w-16 bg-secondary-200 rounded-full h-2">
                          <div
                            className="progress-bar progress-bar-green h-2 rounded-full"
                            style={{ width: `${source.quality.completeness}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(source.data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm font-medium text-secondary-600">{key}:</span>
                          <span className="text-sm text-secondary-900">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Matching Rules */}
            <div className="card mb-6">
              <h4 className="text-lg font-semibold text-secondary-900 mb-4">AI Matching Analysis</h4>
              <div className="space-y-4">
                {selectedRecord.matchingRules.map((rule, index) => (
                  <div key={index} className="border border-secondary-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-secondary-900">{rule.name}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          rule.result.matched ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {rule.result.matched ? 'MATCHED' : 'NOT MATCHED'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-secondary-500">Confidence: {rule.confidence}%</span>
                        <div className="w-16 bg-secondary-200 rounded-full h-2">
                          <div
                            className={`progress-bar h-2 rounded-full ${
                              rule.confidence >= 90 ? 'progress-bar-green' :
                              rule.confidence >= 70 ? 'progress-bar-yellow' : 'progress-bar-red'
                            }`}
                            style={{ width: `${rule.confidence}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-secondary-600 mb-3">{rule.result.reason}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-secondary-600">Criteria</label>
                        <div className="space-y-1 mt-1">
                          {rule.criteria.map((criterion, idx) => (
                            <div key={idx} className="text-sm text-secondary-700">
                              {criterion.field} {criterion.operator} {String(criterion.value)} (weight: {criterion.weight})
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-secondary-600">Details</label>
                        <div className="space-y-1 mt-1">
                          {Object.entries(rule.result.details).map(([key, value]) => (
                            <div key={key} className="text-sm text-secondary-700">
                              {key}: {String(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Trail */}
            <div className="card">
              <h4 className="text-lg font-semibold text-secondary-900 mb-4">Audit Trail</h4>
              <div className="space-y-3">
                {selectedRecord.auditTrail.map((entry, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-secondary-50 rounded-lg">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-secondary-900">{entry.userName}</span>
                        <span className="text-sm text-secondary-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-secondary-700 mt-1">{entry.action}</p>
                      {Object.keys(entry.details).length > 0 && (
                        <div className="mt-2 text-xs text-secondary-600">
                          {Object.entries(entry.details).map(([key, value]) => (
                            <span key={key} className="mr-4">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
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

export default ReconciliationPage