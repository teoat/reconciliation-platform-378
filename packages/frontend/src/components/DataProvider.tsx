'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react'
import DataManagementService, { ProjectData, UploadedFile, ReconciliationRecord, ExpenseCategory } from '../services/dataManagement'
import { useRealtimeCollaboration, useRealtimeDataSync } from '../hooks/useWebSocket'
import { useSecurity } from '../hooks/useSecurity'

// ============================================================================
// CONSOLIDATED DATA PROVIDER - SINGLE SOURCE OF TRUTH
// ============================================================================

// Enhanced interfaces for unified data management
interface WorkflowState {
  id: string
  currentStage: WorkflowStage
  progress: number
  status: 'active' | 'paused' | 'completed' | 'error'
  lastUpdated: Date
  nextStage?: WorkflowStage
  previousStage?: WorkflowStage
}

interface WorkflowStage {
  id: string
  name: string
  page: string
  order: number
  isCompleted: boolean
  isActive: boolean
  data: any
  validation: ValidationResult
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: CorrectionSuggestion[]
}

interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning' | 'info'
  page: string
}

interface ValidationWarning {
  field: string
  message: string
  page: string
}

interface CorrectionSuggestion {
  field: string
  currentValue: any
  suggestedValue: any
  reason: string
  confidence: number
}

interface SyncStatus {
  isOnline: boolean
  lastSyncTime: Date
  pendingChanges: PendingChange[]
  syncErrors: SyncError[]
}

interface PendingChange {
  id: string
  page: string
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: Date
  retryCount: number
}

interface SyncError {
  id: string
  message: string
  page: string
  timestamp: Date
  retryCount: number
}

interface WorkflowProgress {
  currentStage: number
  totalStages: number
  percentage: number
  estimatedTimeRemaining: number
  completedStages: string[]
  upcomingStages: string[]
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  page: string
  timestamp: Date
  isRead: boolean
  actions?: NotificationAction[]
}

interface NotificationAction {
  label: string
  action: () => void
  type: 'primary' | 'secondary'
}

interface Alert {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  pages: string[]
  timestamp: Date
  isDismissed: boolean
  autoResolve?: boolean
}

interface CrossPageData {
  ingestion: IngestionData
  reconciliation: ReconciliationData
  adjudication: AdjudicationData
  analytics: AnalyticsData
  security: SecurityData
  api: ApiData
}

interface IngestionData {
  files: UploadedFile[]
  processedData: any[]
  qualityMetrics: DataQualityMetrics
  validationResults: ValidationResult
  lastUpdated: Date
}

interface ReconciliationData {
  records: ReconciliationRecord[]
  matchingResults: MatchingResult[]
  discrepancies: DiscrepancyRecord[]
  qualityMetrics: ReconciliationMetrics
  lastUpdated: Date
}

interface AdjudicationData {
  workflows: WorkflowInstance[]
  discrepancies: EnhancedDiscrepancyRecord[]
  users: UserProfile[]
  notifications: Notification[]
  lastUpdated: Date
}

interface AnalyticsData {
  dashboards: DashboardData[]
  reports: ReportInstance[]
  predictions: PredictionResult[]
  anomalies: AnomalyDetection[]
  lastUpdated: Date
}

interface SecurityData {
  policies: SecurityPolicy[]
  auditLogs: AuditLog[]
  complianceStatus: ComplianceStatus
  encryptionConfigs: EncryptionConfig[]
  lastUpdated: Date
}

interface ApiData {
  endpoints: ApiEndpoint[]
  webhooks: WebhookEvent[]
  keys: ApiKey[]
  integrations: Integration[]
  lastUpdated: Date
}

interface DataQualityMetrics {
  completeness: number
  accuracy: number
  consistency: number
  validity: number
  overall: number
}

interface ReconciliationMetrics {
  matchRate: number
  processingTime: number
  discrepancyRate: number
  autoMatchRate: number
}

interface WorkflowInstance {
  id: string
  name: string
  status: 'active' | 'completed' | 'paused' | 'error'
  currentStep: string
  progress: number
  assignedTo: string
  createdAt: Date
  updatedAt: Date
}

interface EnhancedDiscrepancyRecord {
  id: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_review' | 'resolved' | 'escalated'
  systems: SystemData[]
  discrepancyType: string
  severity: 'low' | 'medium' | 'high'
  metadata: any
  sla: any
  resolution: any
}

interface SystemData {
  id: string
  name: string
  systemName: string
  recordId: string
  description: string
  amount: number
  date: string
  confidence: number
  quality: any
}

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  lastSeen?: string
  currentWorkload: number
  maxWorkload: number
}

interface DashboardData {
  id: string
  name: string
  type: string
  data: any
  lastUpdated: Date
}

interface ReportInstance {
  id: string
  name: string
  templateId: string
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  data: any
  generatedAt?: Date
  generatedBy: string
}

interface PredictionResult {
  id: string
  type: string
  prediction: any
  confidence: number
  timestamp: Date
}

interface AnomalyDetection {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high'
  description: string
  impact: number
  timestamp: Date
}

interface SecurityPolicy {
  id: string
  name: string
  description: string
  category: 'access' | 'data' | 'network' | 'compliance'
  rules: SecurityRule[]
  isActive: boolean
  lastUpdated: Date
}

interface SecurityRule {
  id: string
  name: string
  description: string
  type: 'allow' | 'deny' | 'require'
  conditions: string[]
  actions: string[]
}

interface AuditLog {
  id: string
  timestamp: Date
  userId: string
  action: string
  resource: string
  result: 'success' | 'failure' | 'denied'
  ipAddress: string
  userAgent: string
  details: any
}

interface ComplianceStatus {
  sox: ComplianceFramework
  gdpr: ComplianceFramework
  lastAudit: Date
  nextAudit: Date
}

interface ComplianceFramework {
  id: string
  name: string
  status: 'compliant' | 'non-compliant' | 'partial'
  requirements: ComplianceRequirement[]
  lastAudit: Date
  nextAudit: Date
}

interface ComplianceRequirement {
  id: string
  title: string
  description: string
  status: 'met' | 'not_met' | 'partial'
  evidence: string[]
  lastChecked: Date
}

interface EncryptionConfig {
  id: string
  name: string
  algorithm: string
  keySize: number
  status: 'active' | 'inactive'
  lastRotated: Date
  nextRotation: Date
}

interface ApiEndpoint {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
  parameters: ApiParameter[]
  responses: ApiResponse[]
  rateLimit: number
  authentication: 'none' | 'api_key' | 'oauth' | 'jwt'
  tags: string[]
  isActive: boolean
}

interface ApiParameter {
  name: string
  type: string
  required: boolean
  description: string
  example?: any
}

interface ApiResponse {
  status: number
  description: string
  schema: any
  example?: any
}

interface WebhookEvent {
  id: string
  name: string
  description: string
  eventType: string
  payload: any
  isActive: boolean
  subscribers: number
}

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  rateLimit: number
  expiresAt?: Date
  lastUsed?: Date
  isActive: boolean
}

interface Integration {
  id: string
  name: string
  type: 'erp' | 'banking' | 'accounting' | 'custom'
  status: 'active' | 'inactive' | 'error'
  lastSync: Date
  syncFrequency: string
  dataFlow: 'inbound' | 'outbound' | 'bidirectional'
  endpoints: string[]
}

interface MatchingResult {
  id: string
  recordA: any
  recordB: any
  confidence: number
  matchType: string
  status: 'matched' | 'unmatched' | 'discrepancy'
}

interface DiscrepancyRecord {
  id: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_review' | 'resolved' | 'escalated'
  systemA: any
  systemB: any
  difference: number
  differenceType: string
}

// Consolidated Data Context Interface
interface DataContextType {
  // Current project data
  currentProject: ProjectData | null
  setCurrentProject: (project: ProjectData | null) => void
  
  // Workflow state
  workflowState: WorkflowState | null
  setWorkflowState: (state: WorkflowState | null) => void
  
  // Cross-page data synchronization
  crossPageData: CrossPageData
  updateCrossPageData: (page: keyof CrossPageData, data: any) => void
  
  // Real-time synchronization
  syncStatus: SyncStatus
  syncData: () => Promise<void>
  
  // Workflow orchestration
  workflowProgress: WorkflowProgress
  advanceWorkflow: (toStage: WorkflowStage) => Promise<void>
  
  // Cross-page notifications
  notifications: Notification[]
  alerts: Alert[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void
  dismissAlert: (alertId: string) => void
  
  // Data validation
  validateCrossPageData: (fromPage: string, toPage: string) => ValidationResult
  validateWorkflowConsistency: () => ValidationResult
  
  // WebSocket integration
  isConnected: boolean
  activeUsers: Array<{ id: string; name: string; page: string; lastSeen: string }>
  liveComments: Array<{ id: string; userId: string; userName: string; message: string; timestamp: string; page: string }>
  sendComment: (userId: string, userName: string, message: string) => void
  updatePresence: (userId: string, userName: string) => void
  
  // Security integration
  securityPolicies: any[]
  auditLogs: any[]
  isSecurityEnabled: boolean
  checkPermission: (userId: string, resource: string, action: string) => boolean
  logAuditEvent: (userId: string, action: string, resource: string, result: 'success' | 'failure', details?: any) => void
  encryptData: (data: any, dataType: string) => any
  decryptData: (encryptedData: any, dataType: string) => any
  checkCompliance: (framework: string) => any[]
  createSecurityPolicy: (policy: any) => any
  updateSecurityPolicy: (policyId: string, updates: any) => void
  deleteSecurityPolicy: (policyId: string) => void
  exportAuditLogs: (format?: 'csv' | 'json') => string
  
  // Legacy compatibility methods
  createProject: (project: Partial<ProjectData>) => ProjectData
  updateProject: (projectId: string, updates: Partial<ProjectData>) => ProjectData | null
  addIngestionData: (projectId: string, ingestionData: any) => ProjectData | null
  getIngestionData: () => any
  addReconciliationData: (projectId: string, reconciliationData: any) => ProjectData | null
  getReconciliationData: () => any
  addCashflowData: (projectId: string, cashflowData: any) => ProjectData | null
  getCashflowData: () => any
  transformIngestionToReconciliation: (projectId: string) => ProjectData | null
  transformReconciliationToCashflow: (projectId: string) => ProjectData | null
  subscribeToProject: (projectId: string, callback: (data: ProjectData) => void) => () => void
  
  // Real-time updates
  subscribeToUpdates: (callback: (data: any) => void) => () => void
  
  // Loading states
  isLoading: boolean
  error: string | null
  
  // Utility methods
  exportProject: (projectId: string) => string
  importProject: (data: string) => ProjectData | null
  resetWorkflow: () => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

interface DataProviderProps {
  children: ReactNode
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // WebSocket integration
  const { isConnected: collaborationConnected, activeUsers, liveComments, sendComment, updatePresence } = useRealtimeCollaboration('unified')
  const { isConnected: syncConnected, syncStatus: wsSyncStatus, syncData: wsSyncData } = useRealtimeDataSync()
  
  // Security integration
  const {
    securityPolicies,
    auditLogs,
    isSecurityEnabled,
    checkPermission,
    logAuditEvent,
    encryptData,
    decryptData,
    checkCompliance,
    createSecurityPolicy,
    updateSecurityPolicy,
    deleteSecurityPolicy,
    exportAuditLogs
  } = useSecurity()
  
  // Core state
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null)
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Cross-page data
  const [crossPageData, setCrossPageData] = useState<CrossPageData>({
    ingestion: {
      files: [],
      processedData: [],
      qualityMetrics: { completeness: 0, accuracy: 0, consistency: 0, validity: 0, overall: 0 },
      validationResults: { isValid: false, errors: [], warnings: [], suggestions: [] },
      lastUpdated: new Date()
    },
    reconciliation: {
      records: [],
      matchingResults: [],
      discrepancies: [],
      qualityMetrics: { matchRate: 0, processingTime: 0, discrepancyRate: 0, autoMatchRate: 0 },
      lastUpdated: new Date()
    },
    adjudication: {
      workflows: [],
      discrepancies: [],
      users: [],
      notifications: [],
      lastUpdated: new Date()
    },
    analytics: {
      dashboards: [],
      reports: [],
      predictions: [],
      anomalies: [],
      lastUpdated: new Date()
    },
    security: {
      policies: [],
      auditLogs: [],
      complianceStatus: {
        sox: { id: '', name: '', status: 'partial', requirements: [], lastAudit: new Date(), nextAudit: new Date() },
        gdpr: { id: '', name: '', status: 'partial', requirements: [], lastAudit: new Date(), nextAudit: new Date() },
        lastAudit: new Date(),
        nextAudit: new Date()
      },
      encryptionConfigs: [],
      lastUpdated: new Date()
    },
    api: {
      endpoints: [],
      webhooks: [],
      keys: [],
      integrations: [],
      lastUpdated: new Date()
    }
  })
  
  // Sync status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSyncTime: new Date(),
    pendingChanges: [],
    syncErrors: []
  })
  
  // Notifications and alerts
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  
  const dataService = DataManagementService.getInstance()

  // Initialize with sample project if none exists
  useEffect(() => {
    if (!currentProject) {
      const sampleProject = dataService.createProject({
        id: 'sample-project',
        name: 'Sample Reconciliation Project',
        description: 'A sample project for testing the reconciliation workflow',
        status: 'active'
      })
      setCurrentProject(sampleProject)
    }
  }, [currentProject, dataService])

  // Subscribe to project updates
  useEffect(() => {
    if (currentProject) {
      const unsubscribe = dataService.subscribe(currentProject.id, (updatedProject) => {
        setCurrentProject(updatedProject)
      })
      return unsubscribe
    }
  }, [currentProject, dataService])
  
  // Workflow progress
  const workflowProgress = useMemo((): WorkflowProgress => {
    if (!workflowState) {
      return {
        currentStage: 0,
        totalStages: 6,
        percentage: 0,
        estimatedTimeRemaining: 0,
        completedStages: [],
        upcomingStages: ['ingestion', 'reconciliation', 'adjudication', 'analytics', 'security', 'api']
      }
    }
    
    const stages = ['ingestion', 'reconciliation', 'adjudication', 'analytics', 'security', 'api']
    const currentIndex = stages.indexOf(workflowState.currentStage.name)
    
    return {
      currentStage: currentIndex + 1,
      totalStages: stages.length,
      percentage: Math.round(((currentIndex + 1) / stages.length) * 100),
      estimatedTimeRemaining: (stages.length - currentIndex - 1) * 30, // 30 minutes per stage
      completedStages: stages.slice(0, currentIndex),
      upcomingStages: stages.slice(currentIndex + 1)
    }
  }, [workflowState])
  
  // Update cross-page data with WebSocket sync and security
  const updateCrossPageData = useCallback((page: keyof CrossPageData, data: any) => {
    // Check permission before updating data
    const hasPermission = checkPermission('current-user', page, 'update')
    if (!hasPermission) {
      logAuditEvent('current-user', 'unauthorized_update_attempt', page, 'failure', {
        page,
        data: typeof data === 'object' ? Object.keys(data) : 'unknown'
      })
      return
    }

    // Encrypt sensitive data if security is enabled
    const processedData = isSecurityEnabled ? encryptData(data, page) : data

    setCrossPageData(prev => ({
      ...prev,
      [page]: {
        ...prev[page],
        ...processedData,
        lastUpdated: new Date()
      }
    }))
    
    // Sync data via WebSocket if connected
    if (syncConnected) {
      wsSyncData('unified', page, processedData)
    }

    // Log successful update
    logAuditEvent('current-user', 'update_cross_page_data', page, 'success', {
      page,
      dataKeys: typeof data === 'object' ? Object.keys(data) : 'unknown',
      encrypted: isSecurityEnabled
    })
  }, [syncConnected, wsSyncData, checkPermission, logAuditEvent, encryptData, isSecurityEnabled])
  
  // Add notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}`,
      timestamp: new Date()
    }
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]) // Keep last 50
  }, [])
  
  // Sync data
  const performDataSync = useCallback(async () => {
    setIsLoading(true)
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSyncStatus(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        pendingChanges: [],
        syncErrors: []
      }))
      
      addNotification({
        type: 'success',
        title: 'Data Synchronized',
        message: 'All data has been synchronized successfully',
        page: 'system',
        isRead: false
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      addNotification({
        type: 'error',
        title: 'Sync Failed',
        message: 'Failed to synchronize data',
        page: 'system',
        isRead: false
      })
     } finally {
       setIsLoading(false)
     }
   }, [addNotification])
  
  // Validate cross-page data
  const validateCrossPageData = useCallback((fromPage: string, toPage: string): ValidationResult => {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: CorrectionSuggestion[] = []
    
    // Add validation logic based on page transitions
    if (fromPage === 'ingestion' && toPage === 'reconciliation') {
      const ingestionData = crossPageData.ingestion
      if (ingestionData.files.length === 0) {
        errors.push({
          field: 'files',
          message: 'No files uploaded for processing',
          severity: 'error',
          page: 'ingestion'
        })
      }
      
      if (ingestionData.qualityMetrics.overall < 0.8) {
        warnings.push({
          field: 'quality',
          message: 'Data quality is below recommended threshold',
          page: 'ingestion'
        })
      }
    }
    
    if (fromPage === 'reconciliation' && toPage === 'review') {
      const reconciliationData = crossPageData.reconciliation
      if (reconciliationData.discrepancies.length > 0) {
        warnings.push({
          field: 'discrepancies',
          message: `${reconciliationData.discrepancies.length} discrepancies remain unresolved`,
          page: 'reconciliation'
        })
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }, [crossPageData])
  
  // Add alert
  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'timestamp'>) => {
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}`,
      timestamp: new Date()
    }
    
    setAlerts(prev => [newAlert, ...prev.slice(0, 19)]) // Keep last 20
  }, [])
  
  // Advance workflow
  const advanceWorkflow = useCallback(async (toStage: WorkflowStage) => {
    if (!workflowState) return
    
    setIsLoading(true)
    try {
      // Validate transition
      const validation = validateCrossPageData(workflowState.currentStage.page, toStage.page)
      if (!validation.isValid) {
        throw new Error(`Cannot advance to ${toStage.name}: ${validation.errors.map(e => e.message).join(', ')}`)
      }
      
      // Update workflow state
      setWorkflowState(prev => prev ? {
        ...prev,
        currentStage: toStage,
        progress: (toStage.order / 6) * 100,
        lastUpdated: new Date(),
        previousStage: prev.currentStage,
        nextStage: undefined
      } : null)
      
      // Notify users
      addNotification({
        type: 'info',
        title: 'Workflow Advanced',
        message: `Advanced to ${toStage.name}`,
        page: toStage.page,
        isRead: false
      })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Workflow advance failed')
      addAlert({
        severity: 'high',
        title: 'Workflow Error',
        message: err instanceof Error ? err.message : 'Failed to advance workflow',
        pages: [workflowState.currentStage.page, toStage.page],
        isDismissed: false
      })
     } finally {
       setIsLoading(false)
     }
   }, [workflowState, addAlert, addNotification, validateCrossPageData])
  
  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isDismissed: true } : alert
    ))
  }, [])
  
  // Validate workflow consistency
  const validateWorkflowConsistency = useCallback((): ValidationResult => {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: CorrectionSuggestion[] = []
    
    // Check data consistency across pages
    const ingestionData = crossPageData.ingestion
    const reconciliationData = crossPageData.reconciliation
    
    if (ingestionData.processedData.length !== reconciliationData.records.length) {
      errors.push({
        field: 'recordCount',
        message: 'Record count mismatch between ingestion and reconciliation',
        severity: 'error',
        page: 'system'
      })
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }, [crossPageData])
  
  // Subscribe to updates
  const subscribeToUpdates = useCallback((callback: (data: any) => void) => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      callback({
        timestamp: new Date(),
        data: crossPageData
      })
    }, 5000) // Update every 5 seconds
    
    return () => clearInterval(interval)
  }, [crossPageData])
  
  // Reset workflow
  const resetWorkflow = useCallback(() => {
    setWorkflowState(null)
    setCrossPageData({
      ingestion: {
        files: [],
        processedData: [],
        qualityMetrics: { completeness: 0, accuracy: 0, consistency: 0, validity: 0, overall: 0 },
        validationResults: { isValid: false, errors: [], warnings: [], suggestions: [] },
        lastUpdated: new Date()
      },
      reconciliation: {
        records: [],
        matchingResults: [],
        discrepancies: [],
        qualityMetrics: { matchRate: 0, processingTime: 0, discrepancyRate: 0, autoMatchRate: 0 },
        lastUpdated: new Date()
      },
      adjudication: {
        workflows: [],
        discrepancies: [],
        users: [],
        notifications: [],
        lastUpdated: new Date()
      },
      analytics: {
        dashboards: [],
        reports: [],
        predictions: [],
        anomalies: [],
        lastUpdated: new Date()
      },
      security: {
        policies: [],
        auditLogs: [],
        complianceStatus: {
          sox: { id: '', name: '', status: 'partial', requirements: [], lastAudit: new Date(), nextAudit: new Date() },
          gdpr: { id: '', name: '', status: 'partial', requirements: [], lastAudit: new Date(), nextAudit: new Date() },
          lastAudit: new Date(),
          nextAudit: new Date()
        },
        encryptionConfigs: [],
        lastUpdated: new Date()
      },
      api: {
        endpoints: [],
        webhooks: [],
        keys: [],
        integrations: [],
        lastUpdated: new Date()
      }
    })
    setNotifications([])
    setAlerts([])
  }, [])

  // Legacy compatibility methods
  const createProject = (project: Partial<ProjectData>): ProjectData => {
    setIsLoading(true)
    setError(null)
    
    try {
      const newProject = dataService.createProject(project)
      setCurrentProject(newProject)
      return newProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateProject = (projectId: string, updates: Partial<ProjectData>): ProjectData | null => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedProject = dataService.updateProject(projectId, updates)
      if (updatedProject && currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
      return updatedProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const addIngestionData = (projectId: string, ingestionData: any): ProjectData | null => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedProject = dataService.addIngestionData(projectId, ingestionData)
      if (updatedProject && currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
      return updatedProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add ingestion data')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const getIngestionData = () => {
    return currentProject?.ingestionData || null
  }

  const addReconciliationData = (projectId: string, reconciliationData: any): ProjectData | null => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedProject = dataService.addReconciliationData(projectId, reconciliationData)
      if (updatedProject && currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
      return updatedProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reconciliation data')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const getReconciliationData = () => {
    return currentProject?.reconciliationData || null
  }

  const addCashflowData = (projectId: string, cashflowData: any): ProjectData | null => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedProject = dataService.addCashflowData(projectId, cashflowData)
      if (updatedProject && currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
      return updatedProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add cashflow data')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const getCashflowData = () => {
    return currentProject?.cashflowData || null
  }

  const transformIngestionToReconciliation = (projectId: string): ProjectData | null => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedProject = dataService.transformIngestionToReconciliation(projectId)
      if (updatedProject && currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
      return updatedProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transform data')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const transformReconciliationToCashflow = (projectId: string): ProjectData | null => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedProject = dataService.transformReconciliationToCashflow(projectId)
      if (updatedProject && currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
      return updatedProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transform data')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToProject = (projectId: string, callback: (data: ProjectData) => void) => {
    return dataService.subscribe(projectId, callback)
  }

  const exportProject = (projectId: string): string => {
    return dataService.exportProject(projectId)
  }

  const importProject = (data: string): ProjectData | null => {
    setIsLoading(true)
    setError(null)
    
    try {
      const project = dataService.importProject(data)
      if (project) {
        setCurrentProject(project)
      }
      return project
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import project')
      return null
    } finally {
      setIsLoading(false)
    }
  }
  
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }))
      performDataSync()
    }
    
    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }))
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [performDataSync])
  
  const contextValue: DataContextType = {
    currentProject,
    setCurrentProject,
    workflowState,
    setWorkflowState,
    crossPageData,
    updateCrossPageData,
    syncStatus,
    syncData: performDataSync,
    workflowProgress,
    advanceWorkflow,
    notifications,
    alerts,
    addNotification,
    addAlert,
    dismissAlert,
    validateCrossPageData,
    validateWorkflowConsistency,
    subscribeToUpdates,
    isLoading,
    error,
    // WebSocket integration
    isConnected: collaborationConnected && syncConnected,
    activeUsers,
    liveComments,
    sendComment,
    updatePresence,
    // Security integration
    securityPolicies,
    auditLogs,
    isSecurityEnabled,
    checkPermission,
    logAuditEvent,
    encryptData,
    decryptData,
    checkCompliance,
    createSecurityPolicy,
    updateSecurityPolicy,
    deleteSecurityPolicy,
    exportAuditLogs,
    // Legacy compatibility
    createProject,
    updateProject,
    addIngestionData,
    getIngestionData,
    addReconciliationData,
    getReconciliationData,
    addCashflowData,
    getCashflowData,
    transformIngestionToReconciliation,
    transformReconciliationToCashflow,
    subscribeToProject,
    exportProject,
    importProject,
    resetWorkflow
  }
  
  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = (): DataContextType => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

// Legacy compatibility exports
export const useUnifiedData = useData
export const UnifiedDataProvider = DataProvider

export default DataProvider
