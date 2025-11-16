// Single Source of Truth (SSOT) for all TypeScript types
// This file contains all type definitions used across the application
// 
// NOTE: Types are being split into domain-specific files for better organization.
// Domain files are imported and re-exported here for backward compatibility.

import { ReconciliationMetadata, Metadata } from '../frontend/src/types/metadata';

// Re-export from domain-specific files
export * from './user';
export * from './common';
export * from './websocket';
export * from './project';
export * from './ingestion';
export * from './reconciliation';
export * from './data';

// ============================================================================
// CORE APPLICATION TYPES
// ============================================================================
// CORE APPLICATION TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  avatar?: string;
  department?: string;
  manager?: string;
}

export type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer';
export type Permission = 'read' | 'write' | 'delete' | 'admin' | 'export' | 'import';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: boolean;
  emailNotifications: boolean;
  dashboardLayout: DashboardLayout;
  defaultProject?: string;
}

export type DashboardLayout = 'grid' | 'list' | 'compact';

// ============================================================================
// PROJECT MANAGEMENT TYPES
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  type: ProjectType;
  owner: User;
  team: User[];
  settings: ProjectSettings;
  data: ProjectData;
  analytics: ProjectAnalytics;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  archivedAt?: Date;
}

export type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type ProjectType = 'reconciliation' | 'audit' | 'compliance' | 'analysis';

export interface ProjectSettings {
  autoMatch: boolean;
  notifications: boolean;
  retentionDays: number;
  dataRetention: DataRetentionPolicy;
  securityLevel: SecurityLevel;
  complianceRequirements: ComplianceRequirement[];
  customFields: CustomField[];
}

export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';
export type ComplianceRequirement = 'SOX' | 'GDPR' | 'HIPAA' | 'PCI' | 'ISO27001';

export interface DataRetentionPolicy {
  retentionPeriod: number;
  archiveAfter: number;
  deleteAfter: number;
  encryptionRequired: boolean;
  auditTrailRequired: boolean;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  options?: string[];
  defaultValue?: string | number | boolean | Date | null;
}

export interface ProjectSettings {
  theme?: 'light' | 'dark' | 'auto';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  reconciliationCompleteNotifications?: boolean;
  errorNotifications?: boolean;
  reconciliation?: {
    autoStart?: boolean;
    matchingThreshold?: number;
    algorithms?: string[];
  };
  display?: {
    itemsPerPage?: number;
    dateFormat?: string;
    currencyFormat?: string;
  };
  integrations?: Record<string, unknown>;
}

export interface BaseMetadata {
  createdAt?: string | Date;
  updatedAt?: string | Date;
  version?: number;
  userId?: string;
  checksum?: string;
  [key: string]: unknown;
}

export interface DataSourceMetadata extends BaseMetadata {
  mimeType?: string;
  encoding?: string;
  delimiter?: string;
  hasHeaders?: boolean;
  rowCount?: number;
  columnCount?: number;
  fileSize?: number;
}

// WebSocket Message Types
export interface ReconciliationProgressMessage {
  jobId: string;
  progress: number;
  stage: string;
  status?: 'running' | 'completed' | 'failed' | 'paused';
  message?: string;
  recordsProcessed?: number;
  totalRecords?: number;
  matchesFound?: number;
  errors?: string[];
}

export interface ReconciliationCompletedMessage {
  jobId: string;
  success: boolean;
  duration: number;
  recordsProcessed: number;
  matchesFound: number;
  errors?: string[];
  result?: {
    matchedRecords: number;
    unmatchedRecords: number;
    conflictsResolved: number;
  };
}

export interface ReconciliationErrorMessage {
  jobId: string;
  error: string;
  stage?: string;
  details?: unknown;
}

export interface UserPresenceMessage {
  userId: string;
  action: 'join' | 'leave' | 'update';
  projectId?: string;
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number };
  isOnline?: boolean;
}

export interface ProjectUpdateMessage {
  projectId: string;
  action: 'created' | 'updated' | 'deleted';
  data?: unknown;
}

export interface NotificationMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  userId?: string;
}

export interface ConnectionStatusMessage {
  status: 'connected' | 'disconnected' | 'reconnecting';
  timestamp: string;
  reason?: string;
}

export interface CollaborationUsersMessage {
  projectId: string;
  users: UserPresenceMessage[];
}

export interface CollaborationCommentMessage {
  projectId: string;
  comment: unknown;
}

export type WebSocketMessage =
  | { type: 'reconciliation:progress'; data: ReconciliationProgressMessage }
  | { type: 'reconciliation:completed'; data: ReconciliationCompletedMessage }
  | { type: 'reconciliation:error'; data: ReconciliationErrorMessage }
  | { type: 'user:presence'; data: UserPresenceMessage }
  | { type: 'project:updated'; data: ProjectUpdateMessage }
  | { type: 'notification:new'; data: NotificationMessage }
  | { type: 'connection:status'; data: ConnectionStatusMessage }
  | { type: 'collaboration:users'; data: CollaborationUsersMessage }
  | { type: 'collaboration:comment'; data: CollaborationCommentMessage }
  | { type: 'collaboration:cursor'; data: UserPresenceMessage }
  | { type: 'collaboration:selection'; data: UserPresenceMessage }
  | { type: 'system:alert'; data: NotificationMessage };

export interface ProjectData {
  ingestionData: IngestionData;
  reconciliationData: ReconciliationData;
  cashflowData: CashflowData;
  adjudicationData: AdjudicationData;
  visualizationData: VisualizationData;
}

export interface ProjectAnalytics {
  performance: PerformanceMetrics;
  quality: QualityMetrics;
  trends: TrendAnalysis;
  predictions: PredictiveAnalytics;
}

// Performance and Quality Metrics
export interface PerformanceMetrics {
  processingTime: number;
  throughput: number;
  errorRate: number;
  successRate: number;
}

export interface QualityMetrics {
  accuracy: number;
  completeness: number;
  consistency: number;
  validity: number;
}

export interface TrendAnalysis {
  period: string;
  direction: 'up' | 'down' | 'stable';
  magnitude: number;
}

export interface PredictiveAnalytics {
  forecast: number[];
  confidence: number;
  factors: string[];
}

// ============================================================================
// DATA INGESTION TYPES
// ============================================================================

export interface IngestionData {
  uploadedFiles: UploadedFile[];
  processedData: ProcessedData[];
  dataQuality: DataQualityMetrics;
  transformations: DataTransformation[];
  validations: DataValidation[];
  errors: DataError[];
}

// Data Quality Metrics
export interface DataQualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  validity: number;
  uniqueness: number;
  timeliness: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: FileStatus;
  uploadedAt: Date;
  processedAt?: Date;
  records: number;
  errors: number;
  warnings: number;
  metadata: FileMetadata;
}

export interface IngestionJob {
  id: string;
  projectId: string;
  projectName: string;
  dataSourceId: string;
  dataSourceName: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: Record<string, unknown>;
  qualityMetrics: Record<string, unknown>;
  recordCount: number;
  errorMessage: string;
  createdBy: string;
  createdByFirstName: string;
  createdByLastName: string;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type FileStatus = 'uploading' | 'processing' | 'completed' | 'failed' | 'archived';

export interface FileMetadata {
  originalName: string;
  mimeType: string;
  encoding: string;
  checksum: string;
  uploadedBy: string;
  source: string;
  tags: string[];
}

export interface ProcessedData {
  id: string;
  sourceFile: string;
  recordType: RecordType;
  data: RecordMetadata;
  quality: RecordQuality;
  processedAt: Date;
  processedBy: string;
}

export type RecordType = 'expense' | 'revenue' | 'transaction' | 'journal' | 'cashflow';

export interface RecordQuality {
  completeness: number;
  accuracy: number;
  consistency: number;
  validity: number;
  duplicates: number;
  errors: number;
  warnings: number;
}

export interface DataTransformation {
  id: string;
  name: string;
  type: TransformationType;
  rules: TransformationRule[];
  appliedAt: Date;
  appliedBy: string;
  result: TransformationResult;
}

export type TransformationType = 'format' | 'normalize' | 'enrich' | 'validate' | 'clean';

export interface TransformationRule {
  field: string;
  operation: string;
  parameters: RecordMetadata;
  condition?: string;
}

export interface TransformationResult {
  success: boolean;
  recordsProcessed: number;
  recordsModified: number;
  errors: number;
  warnings: number;
  details: string;
}

export interface DataValidation {
  id: string;
  name: string;
  type: ValidationType;
  rules: ValidationRule[];
  status: ValidationStatus;
  results: ValidationResult[];
  executedAt: Date;
  executedBy: string;
}

export type ValidationType = 'schema' | 'business' | 'data' | 'format' | 'range';
export type ValidationStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ValidationRule {
  field: string;
  rule: string;
  parameters: RecordMetadata;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface ValidationResult {
  recordId: string;
  field: string;
  rule: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  value: unknown;
  expectedValue?: unknown;
}

export interface DataError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details: string;
  source: string;
  recordId?: string;
  field?: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export type ErrorType = 'validation' | 'transformation' | 'processing' | 'system' | 'network';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// ============================================================================
// RECONCILIATION TYPES
// ============================================================================

export interface ReconciliationData {
  records: ReconciliationRecord[];
  matchingRules: MatchingRule[];
  metrics: ReconciliationMetrics;
  batches: ReconciliationBatch[];
  auditTrail: AuditEntry[];
}

export interface ReconciliationRecord {
  id: string;
  reconciliationId: string;
  batchId: string;
  sources: ReconciliationSource[];
  status: ReconciliationStatus;
  confidence: number;
  matchingRules: AppliedMatchingRule[];
  auditTrail: AuditEntry[];
  metadata: RecordMetadata;
  relationships: RecordRelationship[];
  matchScore: number;
  riskLevel: RiskLevel;
}

export type ReconciliationStatus =
  | 'pending'
  | 'matched'
  | 'unmatched'
  | 'discrepancy'
  | 'resolved'
  | 'archived';

export interface ReconciliationSource {
  id: string;
  systemId: string;
  systemName: string;
  recordId: string;
  data: RecordMetadata;
  timestamp: Date;
  quality: RecordQuality;
  confidence: number;
  metadata: ReconciliationMetadata;
}

export interface MatchingRule {
  id: string;
  name: string;
  type: MatchingRuleType;
  criteria: MatchingCriteria[];
  weight: number;
  priority: number;
  enabled: boolean;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MatchingRuleType = 'exact' | 'fuzzy' | 'range' | 'pattern' | 'custom';

export interface MatchingCriteria {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
  weight: number;
  tolerance?: number;
  caseSensitive?: boolean;
}

export type ComparisonOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in'
  | 'not_in';

export interface AppliedMatchingRule {
  id: string;
  name: string;
  type: MatchingRuleType;
  criteria: MatchingCriteria[];
  weight: number;
  applied: boolean;
  result: MatchingResult;
  confidence: number;
}

export interface MatchingResult {
  matched: boolean;
  confidence: number;
  reason: string;
  details: ReconciliationMetadata;
  suggestions?: string[];
}

export interface ReconciliationMetrics {
  totalRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  discrepancyRecords: number;
  matchRate: number;
  accuracy: number;
  processingTime: number;
  throughput: number;
  errorRate: number;
  qualityScore: number;
}

export interface ReconciliationBatch {
  id: string;
  name: string;
  status: BatchStatus;
  records: string[];
  metrics: BatchMetrics;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
}

export type BatchStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface BatchMetrics {
  totalRecords: number;
  processedRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  errorRecords: number;
  processingTime: number;
  successRate: number;
}

export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  timestamp: Date;
  details: Metadata;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'comment'
  | 'assign'
  | 'unassign';

export interface RecordMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  version: number;
  tags: string[];
  priority: Priority;
  notes?: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface RecordRelationship {
  id: string;
  type: RelationshipType;
  targetRecordId: string;
  targetRecordType: string;
  strength: number;
  description: string;
  createdAt: Date;
}

export type RelationshipType =
  | 'parent'
  | 'child'
  | 'sibling'
  | 'related'
  | 'duplicate'
  | 'conflict';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// ============================================================================
// CASHFLOW EVALUATION TYPES
// ============================================================================

export interface CashflowData {
  categories: ExpenseCategory[];
  transactions: CashflowTransaction[];
  metrics: CashflowMetrics;
  analysis: CashflowAnalysis;
  discrepancies: CashflowDiscrepancy[];
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  totalReported: number;
  totalCashflow: number;
  discrepancy: number;
  discrepancyPercentage: number;
  transactionCount: number;
  lastUpdated: Date;
  status: CategoryStatus;
  subcategories: ExpenseSubcategory[];
  trends: CategoryTrend[];
}

export type CategoryStatus = 'balanced' | 'discrepancy' | 'warning' | 'error';

export interface ExpenseSubcategory {
  id: string;
  name: string;
  reportedAmount: number;
  cashflowAmount: number;
  discrepancy: number;
  transactions: CashflowTransaction[];
}

export interface CategoryTrend {
  period: string;
  reportedAmount: number;
  cashflowAmount: number;
  discrepancy: number;
  trend: TrendDirection;
}

export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'volatile';

export interface CashflowTransaction {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  description: string;
  amount: number;
  date: Date;
  source: TransactionSource;
  status: TransactionStatus;
  metadata: TransactionMetadata;
}

export type TransactionSource = 'reported' | 'cashflow' | 'reconciled';
export type TransactionStatus = 'pending' | 'verified' | 'disputed' | 'resolved';

export interface TransactionMetadata {
  originalId: string;
  systemId: string;
  reference: string;
  notes?: string;
  attachments?: string[];
  tags: string[];
}

export interface CashflowMetrics {
  totalReportedExpenses: number;
  totalCashflowExpenses: number;
  totalDiscrepancy: number;
  discrepancyPercentage: number;
  balancedCategories: number;
  discrepancyCategories: number;
  warningCategories: number;
  errorCategories: number;
  averageDiscrepancy: number;
  maxDiscrepancy: number;
  minDiscrepancy: number;
}

export interface CashflowAnalysis {
  id: string;
  type: AnalysisType;
  status: AnalysisStatus;
  results: AnalysisResult[];
  insights: AnalysisInsight[];
  recommendations: AnalysisRecommendation[];
  executedAt: Date;
  executedBy: string;
  duration: number;
}

export type AnalysisType = 'discrepancy' | 'trend' | 'anomaly' | 'pattern' | 'predictive';
export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AnalysisResult {
  category: string;
  metric: string;
  value: number;
  threshold: number;
  status: 'pass' | 'fail' | 'warning';
  confidence: number;
  details: string;
}

export interface AnalysisInsight {
  type: InsightType;
  title: string;
  description: string;
  impact: ImpactLevel;
  confidence: number;
  evidence: string[];
  recommendations: string[];
}

export type InsightType = 'discrepancy' | 'trend' | 'anomaly' | 'pattern' | 'risk';
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AnalysisRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: Priority;
  effort: EffortLevel;
  impact: ImpactLevel;
  status: RecommendationStatus;
  actions: RecommendationAction[];
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
}

export type RecommendationType = 'investigation' | 'correction' | 'process' | 'system' | 'training';
export type EffortLevel = 'low' | 'medium' | 'high';
export type RecommendationStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface RecommendationAction {
  id: string;
  description: string;
  type: ActionType;
  status: ActionStatus;
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
}

export type ActionType = 'review' | 'investigate' | 'correct' | 'document' | 'train';
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface CashflowDiscrepancy {
  id: string;
  categoryId: string;
  type: DiscrepancyType;
  amount: number;
  percentage: number;
  severity: DiscrepancySeverity;
  description: string;
  rootCause?: string;
  status: DiscrepancyStatus;
  resolution?: DiscrepancyResolution;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  dueDate?: Date;
}

export type DiscrepancyType = 'amount' | 'timing' | 'category' | 'duplicate' | 'missing';
export type DiscrepancySeverity = 'low' | 'medium' | 'high' | 'critical';
export type DiscrepancyStatus = 'open' | 'investigating' | 'resolved' | 'closed';
export type DiscrepancyResolution = 'corrected' | 'explained' | 'accepted' | 'rejected';

// ============================================================================
// ADJUDICATION TYPES
// ============================================================================

export interface AdjudicationData {
  cases: AdjudicationCase[];
  workflows: AdjudicationWorkflow[];
  decisions: AdjudicationDecision[];
  metrics: AdjudicationMetrics;
}

export interface AdjudicationCase {
  id: string;
  caseNumber: string;
  type: CaseType;
  status: CaseStatus;
  priority: Priority;
  description: string;
  records: string[];
  evidence: Evidence[];
  decisions: AdjudicationDecision[];
  workflow: AdjudicationWorkflow;
  assignedTo?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type CaseType = 'discrepancy' | 'exception' | 'review' | 'appeal' | 'investigation';
export type CaseStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'pending_review'
  | 'resolved'
  | 'closed';

export interface Evidence {
  id: string;
  type: EvidenceType;
  source: string;
  data: Metadata;
  credibility: number;
  relevance: number;
  timestamp: Date;
  collectedBy: string;
}

export type EvidenceType = 'document' | 'transaction' | 'log' | 'testimony' | 'analysis';

export interface AdjudicationWorkflow {
  id: string;
  name: string;
  type: WorkflowType;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  currentStep: number;
  assignedTo: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type WorkflowType = 'standard' | 'escalation' | 'review' | 'approval';
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  order: number;
  assignedTo: string[];
  dueDate?: Date;
  completedAt?: Date;
  status: StepStatus;
  requirements: StepRequirement[];
  outcomes: StepOutcome[];
}

export type StepType = 'review' | 'approve' | 'investigate' | 'document' | 'escalate';
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
export type StepRequirement = 'documentation' | 'approval' | 'investigation' | 'analysis';
export type StepOutcome = 'approve' | 'reject' | 'escalate' | 'request_info';

export interface AdjudicationDecision {
  id: string;
  caseId: string;
  type: DecisionType;
  decision: DecisionValue;
  reasoning: string;
  evidence: string[];
  confidence: number;
  madeBy: string;
  madeAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  appealable: boolean;
  appealDeadline?: Date;
}

export type DecisionType = 'initial' | 'review' | 'appeal' | 'final';
export type DecisionValue = 'approve' | 'reject' | 'modify' | 'escalate' | 'request_info';

export interface AdjudicationMetrics {
  totalCases: number;
  openCases: number;
  resolvedCases: number;
  averageResolutionTime: number;
  decisionAccuracy: number;
  appealRate: number;
  workloadDistribution: WorkloadDistribution[];
}

export interface WorkloadDistribution {
  userId: string;
  userName: string;
  assignedCases: number;
  completedCases: number;
  averageResolutionTime: number;
  accuracy: number;
}

// ============================================================================
// VISUALIZATION TYPES
// ============================================================================

export interface VisualizationData {
  charts: Chart[];
  dashboards: Dashboard[];
  reports: Report[];
  metrics: VisualizationMetrics;
}

export interface Chart {
  id: string;
  name: string;
  type: ChartType;
  data: ChartData;
  config: ChartConfig;
  filters: ChartFilter[];
  interactions: ChartInteraction[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export type ChartType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'area'
  | 'scatter'
  | 'heatmap'
  | 'sankey'
  | 'treemap'
  | 'gauge'
  | 'funnel';

export interface ChartData {
  datasets: Dataset[];
  labels: string[];
  metadata: ChartMetadata;
}

export interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string[];
  borderColor?: string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartMetadata {
  source: string;
  lastUpdated: Date;
  recordCount: number;
  quality: number;
}

export interface ChartConfig {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: ChartPlugins;
  scales?: ChartScales;
  animation: ChartAnimation;
}

export interface ChartPlugins {
  legend: LegendConfig;
  tooltip: TooltipConfig;
  title?: TitleConfig;
}

export interface LegendConfig {
  display: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  labels: LegendLabels;
}

export interface LegendLabels {
  usePointStyle: boolean;
  padding: number;
  font: FontConfig;
}

export interface TooltipConfig {
  enabled: boolean;
  mode: 'point' | 'nearest' | 'index' | 'dataset';
  intersect: boolean;
  backgroundColor: string;
  titleColor: string;
  bodyColor: string;
  borderColor: string;
  borderWidth: number;
}

export interface TitleConfig {
  display: boolean;
  text: string;
  font: FontConfig;
  color: string;
}

export interface FontConfig {
  family: string;
  size: number;
  weight: 'normal' | 'bold';
  style: 'normal' | 'italic';
}

export interface ChartScales {
  x?: ScaleConfig;
  y?: ScaleConfig;
}

export interface ScaleConfig {
  type: 'linear' | 'logarithmic' | 'category' | 'time';
  display: boolean;
  position: 'left' | 'right' | 'top' | 'bottom';
  title: TitleConfig;
  grid: GridConfig;
  ticks: TicksConfig;
}

export interface GridConfig {
  display: boolean;
  color: string;
  lineWidth: number;
  drawBorder: boolean;
}

export interface TicksConfig {
  display: boolean;
  color: string;
  font: FontConfig;
  maxTicksLimit: number;
}

export interface ChartAnimation {
  duration: number;
  easing: 'linear' | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad';
  delay: number;
}

export interface ChartFilter {
  id: string;
  field: string;
  operator: ComparisonOperator;
  value: unknown;
  enabled: boolean;
}

export interface ChartInteraction {
  id: string;
  type: InteractionType;
  trigger: InteractionTrigger;
  action: InteractionAction;
  enabled: boolean;
}

export type InteractionType = 'click' | 'hover' | 'select' | 'zoom' | 'pan';
export type InteractionTrigger = 'point' | 'bar' | 'line' | 'area' | 'pie';
export type InteractionAction = 'filter' | 'drill_down' | 'navigate' | 'show_details' | 'export';

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  permissions: DashboardPermissions;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface DashboardWidget {
  id: string;
  chartId: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetConfig {
  title: string;
  showTitle: boolean;
  showBorder: boolean;
  backgroundColor: string;
  refreshInterval?: number;
  autoRefresh: boolean;
}

export interface DashboardFilter {
  id: string;
  field: string;
  type: FilterType;
  options: FilterOption[];
  defaultValue?: unknown;
  required: boolean;
}

export type FilterType = 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'text';

export interface FilterOption {
  label: string;
  value: unknown;
  disabled?: boolean;
}

export interface DashboardPermissions {
  view: string[];
  edit: string[];
  share: string[];
}

export interface Report {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  template: ReportTemplate;
  data: ReportData;
  schedule?: ReportSchedule;
  recipients: ReportRecipient[];
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastGenerated?: Date;
}

export type ReportType = 'summary' | 'detailed' | 'exception' | 'trend' | 'compliance';
export type ReportStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface ReportTemplate {
  sections: ReportSection[];
  styling: ReportStyling;
  format: ReportFormat;
}

export interface ReportSection {
  id: string;
  title: string;
  type: SectionType;
  content: SectionContent;
  order: number;
}

export type SectionType = 'text' | 'chart' | 'table' | 'summary' | 'details';

export interface SectionContent {
  text?: string;
  chartId?: string;
  tableId?: string;
  data?: Metadata;
}

export interface ReportStyling {
  theme: 'light' | 'dark' | 'corporate';
  colors: ColorScheme;
  fonts: FontScheme;
  spacing: SpacingScheme;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface FontScheme {
  heading: FontConfig;
  body: FontConfig;
  caption: FontConfig;
}

export interface SpacingScheme {
  margin: number;
  padding: number;
  lineHeight: number;
}

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'html' | 'json';

export interface ReportData {
  source: string;
  filters: ReportFilter[];
  aggregations: ReportAggregation[];
  lastUpdated: Date;
}

export interface ReportFilter {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
}

export interface ReportAggregation {
  field: string;
  function: AggregationFunction;
  alias?: string;
}

export type AggregationFunction = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median';

export interface ReportSchedule {
  frequency: ScheduleFrequency;
  time: string;
  timezone: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface ReportRecipient {
  id: string;
  email: string;
  name: string;
  role: string;
  format: ReportFormat;
  enabled: boolean;
}

export interface VisualizationMetrics {
  totalCharts: number;
  totalDashboards: number;
  totalReports: number;
  activeUsers: number;
  views: number;
  interactions: number;
  performance: VisualizationPerformance;
}

// ============================================================================
// DASHBOARD AND ANALYTICS TYPES
// ============================================================================

export interface DashboardData {
  summary: {
    totalProjects: number;
    activeProjects: number;
    totalUsers: number;
    activeUsers: number;
  };
  recentActivity: ActivityFeed[];
  metrics: {
    reconciliation: ReconciliationMetrics;
    performance: PerformanceMetrics;
    quality: QualityMetrics;
  };
  charts: Chart[];
}

export type ReconciliationStats = ReconciliationMetrics;

export interface VisualizationPerformance {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  errorRate: number;
  uptime: number;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ApiMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: string;
  field?: string;
  timestamp: Date;
}

export interface ApiMetadata {
  pagination?: PaginationInfo;
  filters?: FilterInfo;
  sorting?: SortInfo;
  total?: number;
  processed?: number;
  duration?: number;
  timestamp?: Date;
  requestId?: string;
  version?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FilterInfo {
  applied: Metadata;
  available: FilterOption[];
}

export interface SortInfo {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ApiRequest {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  params?: Metadata;
  query?: Metadata;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  name: string;
  status: WorkflowStatus;
  currentStep: number;
  steps: WorkflowStepInstance[];
  data: Metadata;
  context: WorkflowContext;
  createdAt: Date;
  updatedAt: Date;
  startedBy: string;
  completedAt?: Date;
}

export interface WorkflowStepInstance {
  id: string;
  stepId: string;
  name: string;
  status: StepStatus;
  assignedTo: string[];
  dueDate?: Date;
  completedAt?: Date;
  data: Metadata;
  comments: WorkflowComment[];
  attachments: WorkflowAttachment[];
}

export interface WorkflowContext {
  projectId: string;
  userId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  environment: string;
}

export interface WorkflowComment {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
  type: CommentType;
}

export type CommentType = 'comment' | 'note' | 'question' | 'concern' | 'resolution';

export interface WorkflowAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  type: RuleType;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  enabled: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export type RuleType = 'validation' | 'matching' | 'notification' | 'escalation' | 'approval';

export interface RuleCondition {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
  logicalOperator?: LogicalOperator;
}

export type LogicalOperator = 'AND' | 'OR' | 'NOT';

export interface RuleAction {
  type: ActionType;
  parameters: Metadata;
  delay?: number;
  retry?: number;
}

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  requester: string;
  approvers: ApprovalApprover[];
  subject: string;
  description: string;
  data: Metadata;
  priority: Priority;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type ApprovalType = 'record' | 'batch' | 'project' | 'system' | 'data';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';

export interface ApprovalApprover {
  userId: string;
  userName: string;
  role: string;
  status: ApprovalStatus;
  comments?: string;
  approvedAt?: Date;
  order: number;
}

// ============================================================================
// COLLABORATION TYPES
// ============================================================================

export interface TeamWorkspace {
  id: string;
  name: string;
  description: string;
  members: WorkspaceMember[];
  projects: string[];
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WorkspaceMember {
  userId: string;
  userName: string;
  role: WorkspaceRole;
  permissions: Permission[];
  joinedAt: Date;
  lastActiveAt?: Date;
}

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface WorkspaceSettings {
  notifications: boolean;
  autoAssign: boolean;
  defaultPermissions: Permission[];
  retentionPolicy: DataRetentionPolicy;
}

export interface ActivityFeed {
  id: string;
  type: ActivityType;
  actor: string;
  action: string;
  target: string;
  description: string;
  metadata: Metadata;
  timestamp: Date;
  workspaceId: string;
}

export type ActivityType = 'user' | 'system' | 'workflow' | 'data' | 'project';

export interface Assignment {
  id: string;
  type: AssignmentType;
  assignee: string;
  assigner: string;
  subject: string;
  description: string;
  priority: Priority;
  status: AssignmentStatus;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type AssignmentType = 'review' | 'approve' | 'investigate' | 'correct' | 'document';
export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
  type: CommentType;
  parentId?: string;
  replies: Comment[];
  attachments: CommentAttachment[];
  mentions: string[];
  edited: boolean;
  editedAt?: Date;
}

export interface CommentAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

// ============================================================================
// SECURITY TYPES
// ============================================================================

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  type: PolicyType;
  rules: SecurityRule[];
  enabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export type PolicyType = 'access' | 'data' | 'audit' | 'encryption' | 'retention';

export interface SecurityRule {
  id: string;
  name: string;
  condition: SecurityCondition;
  action: SecurityAction;
  enabled: boolean;
}

export interface SecurityCondition {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
  logicalOperator?: LogicalOperator;
}

export interface SecurityAction {
  type: SecurityActionType;
  parameters: Metadata;
}

export type SecurityActionType = 'allow' | 'deny' | 'log' | 'alert' | 'escalate';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  details: Metadata;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  timestamp: Date;
  severity: AuditSeverity;
  status: AuditStatus;
}

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AuditStatus = 'success' | 'failure' | 'warning' | 'info';

export interface ComplianceReport {
  id: string;
  name: string;
  type: ComplianceType;
  status: ComplianceStatus;
  requirements: ComplianceRequirement[];
  findings: ComplianceFinding[];
  recommendations: ComplianceRecommendation[];
  generatedAt: Date;
  generatedBy: string;
  validUntil: Date;
}

export type ComplianceType = 'SOX' | 'GDPR' | 'HIPAA' | 'PCI' | 'ISO27001' | 'SOC2';
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'partial' | 'pending';

export interface ComplianceFinding {
  id: string;
  requirement: string;
  status: ComplianceStatus;
  description: string;
  evidence: string[];
  risk: RiskLevel;
  remediation: string;
}

export interface ComplianceRecommendation {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  effort: EffortLevel;
  impact: ImpactLevel;
  timeline: string;
}

export interface AccessControl {
  id: string;
  resource: string;
  resourceId: string;
  permissions: Permission[];
  users: string[];
  roles: string[];
  groups: string[];
  conditions: AccessCondition[];
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessCondition {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
}

export interface RiskAssessment {
  id: string;
  name: string;
  type: RiskType;
  status: RiskStatus;
  probability: number;
  impact: number;
  riskScore: number;
  description: string;
  mitigation: RiskMitigation[];
  owner: string;
  assessedAt: Date;
  reviewedAt?: Date;
  nextReview?: Date;
}

export type RiskType = 'operational' | 'financial' | 'compliance' | 'security' | 'reputation';
export type RiskStatus = 'identified' | 'assessed' | 'mitigated' | 'accepted' | 'transferred';

export interface RiskMitigation {
  id: string;
  type: MitigationType;
  description: string;
  effectiveness: number;
  cost: number;
  timeline: string;
  owner: string;
  status: MitigationStatus;
}

export type MitigationType = 'prevent' | 'detect' | 'respond' | 'recover' | 'transfer';
export type MitigationStatus = 'planned' | 'implemented' | 'monitoring' | 'completed';

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface ExportJob {
  id: string;
  type: ExportType;
  format: ExportFormat;
  status: ExportStatus;
  progress: number;
  filters: ExportFilter[];
  options: ExportOptions;
  fileUrl?: string;
  fileSize?: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  requestedBy: string;
  expiresAt?: Date;
}

export type ExportType = 'records' | 'reports' | 'analytics' | 'audit' | 'compliance';
export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json' | 'xml';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ExportFilter {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
}

export interface ExportOptions {
  includeHeaders: boolean;
  includeMetadata: boolean;
  dateFormat: string;
  numberFormat: string;
  compression: boolean;
  encryption: boolean;
  password?: string;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  recipient: string;
  status: NotificationStatus;
  priority: Priority;
  data: Metadata;
  actions: NotificationAction[];
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'reminder';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  url?: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };
export type DeepRequired<T> = { [P in keyof T]-?: DeepRequired<T[P]> };

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
}

export interface SearchParams {
  query: string;
  fields: string[];
  fuzzy?: boolean;
  caseSensitive?: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface Theme {
  name: string;
  colors: ColorScheme;
  fonts: FontScheme;
  spacing: SpacingScheme;
  breakpoints: BreakpointConfig;
}

export interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface AppError {
  code: string;
  message: string;
  details?: string;
  stack?: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  value: unknown;
  rule: string;
}

export interface BusinessError {
  code: string;
  message: string;
  impact: ImpactLevel;
  resolution?: string;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface AppConfig {
  api: ApiConfig;
  database: DatabaseConfig;
  cache: CacheConfig;
  security: SecurityConfig;
  logging: LoggingConfig;
  monitoring: MonitoringConfig;
  features: FeatureConfig;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  rateLimit: RateLimitConfig;
  authentication: AuthConfig;
}

export interface RateLimitConfig {
  requests: number;
  window: number;
  burst: number;
}

export interface AuthConfig {
  type: 'jwt' | 'oauth' | 'api_key';
  secret: string;
  expiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  pool: PoolConfig;
}

export interface PoolConfig {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
}

export interface CacheConfig {
  type: 'redis' | 'memory' | 'file';
  host?: string;
  port?: number;
  password?: string;
  ttl: number;
  maxSize: number;
}

export interface SecurityConfig {
  encryption: EncryptionConfig;
  cors: CorsConfig;
  headers: SecurityHeadersConfig;
  rateLimit: RateLimitConfig;
}

export interface EncryptionConfig {
  algorithm: string;
  key: string;
  iv: string;
}

export interface CorsConfig {
  origin: string[];
  methods: string[];
  headers: string[];
  credentials: boolean;
}

export interface SecurityHeadersConfig {
  contentSecurityPolicy: string;
  xFrameOptions: string;
  xContentTypeOptions: string;
  xXssProtection: string;
  strictTransportSecurity: string;
}

export interface LoggingConfig {
  level: LogLevel;
  format: LogFormat;
  destinations: LogDestination[];
  retention: LogRetentionConfig;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';
export type LogFormat = 'json' | 'text' | 'structured';

export interface LogDestination {
  type: 'console' | 'file' | 'database' | 'remote';
  config: Record<string, unknown>;
}

export interface LogRetentionConfig {
  days: number;
  maxSize: string;
  compression: boolean;
}

export interface MonitoringConfig {
  metrics: MetricsConfig;
  alerts: AlertsConfig;
  health: HealthConfig;
}

export interface MetricsConfig {
  enabled: boolean;
  interval: number;
  retention: number;
  exporters: MetricsExporter[];
}

export interface MetricsExporter {
  type: 'prometheus' | 'influxdb' | 'datadog';
  config: Record<string, unknown>;
}

export interface AlertsConfig {
  enabled: boolean;
  channels: AlertChannel[];
  rules: AlertRule[];
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, unknown>;
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: number;
  severity: AlertSeverity;
  channels: string[];
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface HealthConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  type: 'http' | 'database' | 'cache' | 'external';
  config: Record<string, unknown>;
  timeout: number;
  retries: number;
}

export interface FeatureConfig {
  [key: string]: boolean | FeatureToggle;
}

export interface FeatureToggle {
  enabled: boolean;
  rollout: number;
  conditions: FeatureCondition[];
}

export interface FeatureCondition {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

// All types are already exported above
