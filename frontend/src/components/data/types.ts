// Type definitions for DataProvider
import { UploadedFile, ReconciliationRecord } from '../../services/dataManagement';

export interface WorkflowState {
  id: string;
  currentStage: WorkflowStage<Record<string, unknown>>;
  progress: number;
  status: 'active' | 'paused' | 'completed' | 'error';
  lastUpdated: Date;
  nextStage?: WorkflowStage<Record<string, unknown>>;
  previousStage?: WorkflowStage<Record<string, unknown>>;
}

export interface WorkflowStage<T = Record<string, unknown>> {
  id: string;
  name: string;
  page: string;
  order: number;
  isCompleted: boolean;
  isActive: boolean;
  data: T;
  validation: ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: CorrectionSuggestion[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  page: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  page: string;
}

export interface CorrectionSuggestion {
  field: string;
  currentValue: unknown;
  suggestedValue: unknown;
  reason: string;
  confidence: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: Date;
  pendingChanges: PendingChange[];
  syncErrors: SyncError[];
}

export interface PendingChange {
  id: string;
  page: keyof CrossPageData;
  action: 'create' | 'update' | 'delete';
  data:
    | IngestionData
    | ReconciliationData
    | AdjudicationData
    | AnalyticsData
    | SecurityData
    | ApiData;
  timestamp: Date;
  retryCount: number;
}

export interface SyncError {
  id: string;
  message: string;
  page: string;
  timestamp: Date;
  retryCount: number;
}

export interface WorkflowProgress {
  currentStage: number;
  totalStages: number;
  percentage: number;
  estimatedTimeRemaining: number;
  completedStages: string[];
  upcomingStages: string[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  page: string;
  timestamp: Date;
  isRead: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  type: 'primary' | 'secondary';
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  pages: string[];
  timestamp: Date;
  isDismissed: boolean;
  autoResolve?: boolean;
}

export interface CrossPageData {
  ingestion: IngestionData;
  reconciliation: ReconciliationData;
  adjudication: AdjudicationData;
  analytics: AnalyticsData;
  security: SecurityData;
  api: ApiData;
}

export interface IngestionData {
  files: UploadedFile[];
  processedData: ReconciliationRecord[];
  qualityMetrics: DataQualityMetrics;
  validationResults: ValidationResult;
  lastUpdated: Date;
}

export interface ReconciliationData {
  records: ReconciliationRecord[];
  matchingResults: MatchingResult[];
  discrepancies: DiscrepancyRecord[];
  metrics: ReconciliationMetrics;
  qualityMetrics: ReconciliationMetrics;
  lastUpdated: Date;
}

export interface AdjudicationData {
  workflows: WorkflowInstance[];
  discrepancies: EnhancedDiscrepancyRecord[];
  users: UserProfile[];
  notifications: Notification[];
  lastUpdated: Date;
}

export interface AnalyticsData {
  dashboards: DashboardData[];
  reports: ReportInstance[];
  predictions: PredictionResult[];
  anomalies: AnomalyDetection[];
  lastUpdated: Date;
}

export interface SecurityData {
  policies: SecurityPolicy[];
  auditLogs: AuditLog[];
  complianceStatus: ComplianceStatus;
  encryptionConfigs: EncryptionConfig[];
  lastUpdated: Date;
}

export interface ApiData {
  endpoints: ApiEndpoint[];
  webhooks: WebhookEvent[];
  keys: ApiKey[];
  integrations: Integration[];
  lastUpdated: Date;
}

export interface DataQualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  validity: number;
  overall: number;
}

export interface ReconciliationMetrics {
  matchRate: number;
  processingTime: number;
  discrepancyRate: number;
  autoMatchRate: number;
}

export interface WorkflowInstance {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'paused' | 'error';
  currentStep: string;
  progress: number;
  assignedTo: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnhancedDiscrepancyRecord {
  id: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_review' | 'resolved' | 'escalated';
  systems: SystemData[];
  discrepancyType: string;
  severity: 'low' | 'medium' | 'high';
  metadata: Record<string, unknown>;
  sla: {
    deadline: Date;
    priority: 'high' | 'medium' | 'low';
    assignedTo?: string;
  };
  resolution: {
    type: 'automatic' | 'manual' | 'escalated';
    resolvedAt?: Date;
    resolvedBy?: string;
    notes?: string;
  } | null;
}

export interface SystemData {
  id: string;
  name: string;
  systemName: string;
  recordId: string;
  description: string;
  amount: number;
  date: string;
  confidence: number;
  quality: {
    completeness: number;
    accuracy: number;
    timeliness: number;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  lastSeen?: string;
  currentWorkload: number;
  maxWorkload: number;
}

export interface DashboardData {
  id: string;
  name: string;
  type: string;
  data: Record<string, unknown>;
  lastUpdated: Date;
}

export interface ReportInstance {
  id: string;
  name: string;
  templateId: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  data: Record<string, unknown>;
  generatedAt?: Date;
  generatedBy: string;
}

export interface PredictionResult {
  id: string;
  type: string;
  prediction: Record<string, unknown>;
  confidence: number;
  timestamp: Date;
}

export interface AnomalyDetection {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: number;
  timestamp: Date;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: 'access' | 'data' | 'network' | 'compliance';
  rules: SecurityRule[];
  isActive: boolean;
  lastUpdated: Date;
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  type: 'allow' | 'deny' | 'require';
  conditions: string[];
  actions: string[];
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'denied';
  ipAddress: string;
  userAgent: string;
  details: Record<string, unknown>;
}

export interface ComplianceStatus {
  sox: ComplianceFramework;
  gdpr: ComplianceFramework;
  lastAudit: Date;
  nextAudit: Date;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  status: 'compliant' | 'non-compliant' | 'partial';
  requirements: ComplianceRequirement[];
  lastAudit: Date;
  nextAudit: Date;
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  status: 'met' | 'not_met' | 'partial';
  evidence: string[];
  lastChecked: Date;
}

export interface EncryptionConfig {
  id: string;
  name: string;
  algorithm: string;
  keySize: number;
  status: 'active' | 'inactive';
  lastRotated: Date;
  nextRotation: Date;
}

export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters: ApiParameter[];
  responses: ApiResponse[];
  rateLimit: number;
  authentication: 'none' | 'api_key' | 'oauth' | 'jwt';
  tags: string[];
  isActive: boolean;
}

export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: unknown;
}

export interface ApiResponse {
  status: number;
  description: string;
  schema: Record<string, unknown>;
  example?: unknown;
}

export interface WebhookEvent {
  id: string;
  name: string;
  description: string;
  eventType: string;
  payload: Record<string, unknown>;
  isActive: boolean;
  subscribers: number;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: Date;
  lastUsed?: Date;
  isActive: boolean;
}

export interface Integration {
  id: string;
  name: string;
  type: 'erp' | 'banking' | 'accounting' | 'custom';
  status: 'active' | 'inactive' | 'error';
  lastSync: Date;
  syncFrequency: string;
  dataFlow: 'inbound' | 'outbound' | 'bidirectional';
  endpoints: string[];
}

export interface MatchingResult {
  id: string;
  recordA: Record<string, unknown>;
  recordB: Record<string, unknown>;
  confidence: number;
  matchType: string;
  status: 'matched' | 'unmatched' | 'discrepancy';
}

export interface DiscrepancyRecord {
  id: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_review' | 'resolved' | 'escalated';
  systemA: Record<string, unknown>;
  systemB: Record<string, unknown>;
  difference: number;
  differenceType: string;
}

export interface CashflowData {
  id: string;
  projectId: string;
  records: ReconciliationRecord[];
  lastUpdated: Date;
}
