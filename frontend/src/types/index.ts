// ============================================================================
// BACKEND-ALIGNED TYPE DEFINITIONS - SINGLE SOURCE OF TRUTH
// ============================================================================

// Export all backend-aligned types
export * from './backend-aligned'

// Legacy exports for backward compatibility
export * from './api'
export * from './auth'
export * from './project'
export * from './reconciliation'
export * from './ingestion'
export * from './analytics'
export * from './ui'
export * from './settings'
export * from './forms'
export * from './hooks'
export * from './services'
export * from './components'
export * from './utils'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

export interface Project {
  id: ID
  name: string
  description: string
  status: Status
  priority: Priority
  owner: User
  team: User[]
  settings: ProjectSettings
  metadata: ProjectMetadata
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ProjectSettings {
  autoSave: boolean
  notifications: boolean
  sharing: boolean
  versioning: boolean
}

export interface ProjectMetadata {
  tags: string[]
  category: string
  source: string
  version: string
}

// ============================================================================
// DATA INGESTION TYPES
// ============================================================================

export interface IngestionJob {
  id: ID
  projectId: ID
  name: string
  description: string
  status: Status
  type: 'file' | 'api' | 'database' | 'stream'
  source: DataSource
  destination: DataDestination
  config: IngestionConfig
  schedule?: ScheduleConfig
  statistics: IngestionStatistics
  createdAt: Timestamp
  updatedAt: Timestamp
  startedAt?: Timestamp
  completedAt?: Timestamp
}

export interface DataSource {
  type: 'file' | 'api' | 'database' | 'stream'
  connection: ConnectionConfig
  format: 'csv' | 'json' | 'xml' | 'parquet' | 'avro'
  schema?: DataSchema
}

export interface DataDestination {
  type: 'database' | 'warehouse' | 'lake' | 'api'
  connection: ConnectionConfig
  table?: string
  partition?: PartitionConfig
}

export interface ConnectionConfig {
  host: string
  port: number
  database?: string
  username: string
  password: string
  ssl: boolean
  timeout: number
}

export interface DataSchema {
  fields: SchemaField[]
  primaryKey?: string[]
  indexes?: IndexConfig[]
}

export interface SchemaField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
  nullable: boolean
  defaultValue?: any
  constraints?: FieldConstraints
}

export interface FieldConstraints {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  enum?: any[]
}

export interface IndexConfig {
  fields: string[]
  unique: boolean
  type: 'btree' | 'hash' | 'gin' | 'gist'
}

export interface PartitionConfig {
  field: string
  type: 'range' | 'list' | 'hash'
  values?: any[]
}

export interface IngestionConfig {
  batchSize: number
  maxRetries: number
  retryDelay: number
  timeout: number
  validation: ValidationConfig
  transformation?: TransformationConfig
}

export interface ValidationConfig {
  enabled: boolean
  rules: ValidationRule[]
  strict: boolean
}

export interface ValidationRule {
  field: string
  type: 'required' | 'format' | 'range' | 'custom'
  value?: any
  message?: string
}

export interface TransformationConfig {
  enabled: boolean
  rules: TransformationRule[]
}

export interface TransformationRule {
  field: string
  operation: 'map' | 'filter' | 'aggregate' | 'custom'
  config: any
}

export interface ScheduleConfig {
  enabled: boolean
  frequency: 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly'
  cron?: string
  timezone: string
  startDate: Timestamp
  endDate?: Timestamp
}

export interface IngestionStatistics {
  totalRecords: number
  processedRecords: number
  failedRecords: number
  skippedRecords: number
  processingTime: number
  averageRecordSize: number
  throughput: number
}

// ============================================================================
// RECONCILIATION TYPES
// ============================================================================

export interface ReconciliationRecord {
  id: ID
  projectId: ID
  sourceId: ID
  targetId: ID
  sourceSystem: string
  targetSystem: string
  amount: number
  currency: string
  transactionDate: Timestamp
  description: string
  status: ReconciliationStatus
  matchType?: MatchType
  confidence?: number
  discrepancies: Discrepancy[]
  metadata: RecordMetadata
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type ReconciliationStatus = 'matched' | 'unmatched' | 'discrepancy' | 'pending' | 'reviewed'
export type MatchType = 'exact' | 'fuzzy' | 'manual' | 'rule-based'

export interface Discrepancy {
  id: ID
  type: 'amount' | 'date' | 'description' | 'currency' | 'custom'
  field: string
  sourceValue: any
  targetValue: any
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  resolution?: DiscrepancyResolution
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface DiscrepancyResolution {
  type: 'accept' | 'reject' | 'adjust' | 'investigate'
  value?: any
  reason: string
  resolvedBy: User
  resolvedAt: Timestamp
}

export interface RecordMetadata {
  source: Record<string, any>
  target: Record<string, any>
  computed: Record<string, any>
  tags: string[]
  notes: string[]
}

export interface ReconciliationConfig {
  projectId: ID
  rules: ReconciliationRule[]
  thresholds: ReconciliationThresholds
  automation: AutomationConfig
  notifications: NotificationConfig
}

export interface ReconciliationRule {
  id: ID
  name: string
  description: string
  enabled: boolean
  priority: number
  conditions: RuleCondition[]
  actions: RuleAction[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface RuleCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in'
  value: any
  caseSensitive?: boolean
}

export interface RuleAction {
  type: 'match' | 'flag' | 'auto_resolve' | 'notify' | 'escalate'
  config: any
}

export interface ReconciliationThresholds {
  amountTolerance: number
  dateTolerance: number
  confidenceThreshold: number
  autoMatchThreshold: number
}

export interface AutomationConfig {
  enabled: boolean
  autoMatch: boolean
  autoResolve: boolean
  escalationRules: EscalationRule[]
}

export interface EscalationRule {
  condition: string
  action: 'notify' | 'escalate' | 'pause'
  recipients: User[]
  delay: number
}

export interface NotificationConfig {
  enabled: boolean
  channels: NotificationChannel[]
  triggers: NotificationTrigger[]
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'teams' | 'webhook'
  config: any
}

export interface NotificationTrigger {
  event: 'match' | 'discrepancy' | 'escalation' | 'completion'
  conditions: RuleCondition[]
  recipients: User[]
}

// ============================================================================
// ANALYTICS & REPORTING TYPES
// ============================================================================

export interface DashboardData {
  overview: DashboardOverview
  metrics: Metric[]
  charts: Chart[]
  recentActivity: Activity[]
  alerts: Alert[]
  lastUpdated: Timestamp
}

export interface DashboardOverview {
  totalProjects: number
  activeReconciliations: number
  pendingDiscrepancies: number
  matchRate: number
  processingTime: number
  dataVolume: number
}

export interface Metric {
  id: ID
  name: string
  value: number
  unit: string
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  period: string
  trend: TrendData[]
}

export interface TrendData {
  timestamp: Timestamp
  value: number
  metadata?: Record<string, any>
}

export interface Chart {
  id: ID
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'heatmap'
  title: string
  data: ChartData[]
  config: ChartConfig
  lastUpdated: Timestamp
}

export interface ChartData {
  label: string
  value: number
  category?: string
  metadata?: Record<string, any>
}

export interface ChartConfig {
  xAxis?: AxisConfig
  yAxis?: AxisConfig
  colors?: string[]
  animations?: boolean
  responsive?: boolean
}

export interface AxisConfig {
  label: string
  min?: number
  max?: number
  format?: string
}

export interface Activity {
  id: ID
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  timestamp: Timestamp
  user?: User
  metadata?: Record<string, any>
}

export interface Alert {
  id: ID
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'acknowledged' | 'resolved'
  createdAt: Timestamp
  acknowledgedAt?: Timestamp
  resolvedAt?: Timestamp
  acknowledgedBy?: User
  resolvedBy?: User
}

// ============================================================================
// UI & COMPONENT TYPES
// ============================================================================

export interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  notifications: Notification[]
  modals: ModalState
  loadingStates: LoadingStates
  errors: ErrorState[]
  breadcrumbs: Breadcrumb[]
}

export interface Notification {
  id: ID
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  persistent: boolean
  actions?: NotificationAction[]
  read: boolean
  timestamp: Timestamp
}

export interface NotificationAction {
  label: string
  action: () => void
  type: 'primary' | 'secondary'
}

export interface ModalState {
  [key: string]: boolean
}

export interface LoadingStates {
  global: boolean
  [key: string]: boolean
}

export interface ErrorState {
  id: ID
  type: 'network' | 'validation' | 'permission' | 'system'
  message: string
  details?: string
  retryable: boolean
  dismissed: boolean
  timestamp: Timestamp
}

export interface Breadcrumb {
  label: string
  path: string
  active: boolean
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file' | 'date'
  required: boolean
  placeholder?: string
  options?: SelectOption[]
  validation?: FieldValidation
  defaultValue?: any
}

export interface SelectOption {
  value: any
  label: string
  disabled?: boolean
}

export interface FieldValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  custom?: (value: any) => string | null
}

export interface FormState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isValid: boolean
  isSubmitting: boolean
  isDirty: boolean
}

// ============================================================================
// API TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
  timestamp: Timestamp
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: PaginationInfo
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: Timestamp
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  data?: any
  params?: Record<string, any>
  headers?: Record<string, string>
  timeout?: number
  retries?: number
}

// ============================================================================
// WEBSOCKET TYPES
// ============================================================================

export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: Timestamp
  id?: ID
}

export interface WebSocketConfig {
  url: string
  protocols?: string[]
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
}

// ============================================================================
// FILE TYPES
// ============================================================================

export interface FileUpload {
  id: ID
  name: string
  size: number
  type: string
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  progress: number
  url?: string
  error?: string
  metadata?: Record<string, any>
  uploadedAt?: Timestamp
}

export interface FileInfo {
  name: string
  size: number
  type: string
  lastModified: Timestamp
  path: string
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export default {
  // Base types
  ID,
  Timestamp,
  Status,
  Priority,
  
  // User & Auth
  User,
  UserPreferences,
  NotificationSettings,
  DashboardSettings,
  AuthTokens,
  LoginCredentials,
  
  // Project
  Project,
  ProjectSettings,
  ProjectMetadata,
  
  // Ingestion
  IngestionJob,
  DataSource,
  DataDestination,
  ConnectionConfig,
  DataSchema,
  SchemaField,
  FieldConstraints,
  IndexConfig,
  PartitionConfig,
  IngestionConfig,
  ValidationConfig,
  ValidationRule,
  TransformationConfig,
  TransformationRule,
  ScheduleConfig,
  IngestionStatistics,
  
  // Reconciliation
  ReconciliationRecord,
  ReconciliationStatus,
  MatchType,
  Discrepancy,
  DiscrepancyResolution,
  RecordMetadata,
  ReconciliationConfig,
  ReconciliationRule,
  RuleCondition,
  RuleAction,
  ReconciliationThresholds,
  AutomationConfig,
  EscalationRule,
  NotificationConfig,
  NotificationChannel,
  NotificationTrigger,
  
  // Analytics
  DashboardData,
  DashboardOverview,
  Metric,
  TrendData,
  Chart,
  ChartData,
  ChartConfig,
  AxisConfig,
  Activity,
  Alert,
  
  // UI
  UIState,
  Notification,
  NotificationAction,
  ModalState,
  LoadingStates,
  ErrorState,
  Breadcrumb,
  
  // Forms
  FormField,
  SelectOption,
  FieldValidation,
  FormState,
  
  // API
  ApiResponse,
  PaginatedResponse,
  PaginationInfo,
  ApiError,
  RequestConfig,
  
  // WebSocket
  WebSocketMessage,
  WebSocketConfig,
  
  // Files
  FileUpload,
  FileInfo,
}