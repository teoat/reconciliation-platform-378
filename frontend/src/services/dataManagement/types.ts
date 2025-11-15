// Centralized Data Management Types
import {
  ProcessedRecordData,
  ReconciliationSourceData,
  MatchingResultDetails,
  AuditEntryDetails,
  UploadedFileData,
  ExtractedContentMetadata,
} from '../../types/data';

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'archived';
  ingestionData: IngestionData;
  reconciliationData: ReconciliationData;
  cashflowData: CashflowData;
  analytics: ProjectAnalytics;
}

export interface IngestionData {
  uploadedFiles: UploadedFile[];
  processedData: ProcessedRecord[];
  dataQuality: DataQualityMetrics;
  mappings: FieldMapping[];
  validations: DataValidation[];
  lastProcessed: string;
}

export interface ReconciliationData {
  records: ReconciliationRecord[];
  matchingRules: MatchingRule[];
  metrics: ReconciliationMetrics;
  auditTrail: AuditEntry[];
  lastReconciled: string;
}

export interface CashflowData {
  categories: ExpenseCategory[];
  metrics: CashflowMetrics;
  discrepancies: DiscrepancyRecord[];
  lastAnalyzed: string;
}

export interface ProcessedRecord {
  id: string;
  sourceFile: string;
  fileType: 'expenses' | 'bank_statement' | 'other';
  data: ProcessedRecordData;
  quality: DataQualityMetrics;
  processedAt: string;
  validated: boolean;
  errors: string[];
}

export interface ReconciliationRecord {
  id: string;
  reconciliationId: string;
  batchId: string;
  sources: ReconciliationSource[];
  status: 'matched' | 'unmatched' | 'discrepancy' | 'pending' | 'resolved' | 'escalated';
  confidence: number;
  matchingRules: MatchingRule[];
  auditTrail: AuditEntry[];
  metadata: RecordMetadata;
  relationships: RecordRelationship[];
  resolution?: Resolution;
  matchScore: number;
  difference?: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReconciliationSource {
  id: string;
  systemId: string;
  systemName: string;
  recordId: string;
  data: ReconciliationSourceData;
  timestamp: string;
  quality: DataQualityMetrics;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface MatchingRule {
  id: string;
  name: string;
  type: 'exact' | 'fuzzy' | 'algorithmic' | 'manual';
  criteria: MatchingCriteria[];
  weight: number;
  applied: boolean;
  result: MatchingResult;
  confidence: number;
}

export interface MatchingCriteria {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'fuzzy';
  value: string | number | boolean | null | undefined;
  tolerance?: number;
  weight: number;
}

export interface MatchingResult {
  matched: boolean;
  confidence: number;
  details: MatchingResultDetails;
}

export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details: AuditEntryDetails;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export interface RecordMetadata {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  version: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface RecordRelationship {
  id: string;
  type: 'parent' | 'child' | 'sibling' | 'related';
  targetRecordId: string;
  confidence: number;
  reason: string;
}

export interface Resolution {
  id: string;
  type: 'automatic' | 'manual' | 'approved';
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  assignedTo?: string;
  assignedBy?: string;
  assignedAt?: string;
  resolvedAt?: string;
  resolution: string;
  comments: string[];
  attachments: string[];
}

export interface ReconciliationMetrics {
  totalRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  discrepancyRecords: number;
  pendingRecords: number;
  resolvedRecords: number;
  escalatedRecords: number;
  averageConfidence: number;
  averageProcessingTime: number;
  matchRate: number;
  accuracy: number;
  throughput: number;
  errorRate: number;
  slaCompliance: number;
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
  lastUpdated: string;
  status: 'balanced' | 'discrepancy' | 'missing' | 'excess';
  subcategories: ExpenseSubcategory[];
}

export interface ExpenseSubcategory {
  id: string;
  name: string;
  reportedAmount: number;
  cashflowAmount: number;
  discrepancy: number;
  transactions: ExpenseTransaction[];
}

export interface ExpenseTransaction {
  id: string;
  date: string;
  description: string;
  reportedAmount: number;
  cashflowAmount: number;
  discrepancy: number;
  source: 'journal' | 'bank_statement' | 'both';
  status: 'matched' | 'discrepancy' | 'missing' | 'excess';
  reference: string;
  category: string;
  subcategory: string;
}

export interface CashflowMetrics {
  totalReportedExpenses: number;
  totalCashflowExpenses: number;
  totalDiscrepancy: number;
  discrepancyPercentage: number;
  balancedCategories: number;
  discrepancyCategories: number;
  missingTransactions: number;
  excessTransactions: number;
  averageDiscrepancy: number;
  largestDiscrepancy: number;
  lastReconciliationDate: string;
  dataQualityScore: number;
}

export interface DiscrepancyRecord {
  id: string;
  type: 'amount' | 'date' | 'description' | 'category' | 'missing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  sourceRecord: string;
  targetRecord: string;
  difference: number;
  confidence: number;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolution?: string;
}

export interface ProjectAnalytics {
  performance: PerformanceMetrics;
  trends: TrendAnalysis;
  patterns: PatternAnalysis;
  quality: QualityMetrics;
  efficiency: EfficiencyMetrics;
  predictions: PredictiveAnalytics;
}

export interface PerformanceMetrics {
  matchRate: number;
  accuracy: number;
  processingTime: number;
  throughput: number;
  errorRate: number;
  slaCompliance: number;
}

export interface TrendAnalysis {
  period: string;
  data: Array<{
    date: string;
    value: number;
    metric: string;
  }>;
}

export interface PatternAnalysis {
  recurringPatterns: Array<{
    pattern: string;
    frequency: number;
    confidence: number;
  }>;
  anomalies: Array<{
    type: string;
    description: string;
    severity: number;
  }>;
}

export interface QualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  validity: number;
  duplicates: number;
  errors: number;
}

export interface EfficiencyMetrics {
  automationRate: number;
  manualInterventionRate: number;
  averageResolutionTime: number;
  costPerTransaction: number;
}

export interface PredictiveAnalytics {
  forecastAccuracy: number;
  riskPredictions: Array<{
    risk: string;
    probability: number;
    impact: number;
  }>;
  recommendations: string[];
}

// Legacy interfaces for compatibility
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status:
    | 'uploading'
    | 'completed'
    | 'error'
    | 'processing'
    | 'validating'
    | 'extracting'
    | 'analyzing';
  progress: number;
  records?: number;
  data?: Array<UploadedFileData>;
  columns?: ColumnInfo[];
  fileType:
    | 'expenses'
    | 'bank_statement'
    | 'chat_history'
    | 'pdf_document'
    | 'image'
    | 'video'
    | 'audio'
    | 'contract'
    | 'other';
  qualityMetrics?: DataQualityMetrics;
  validations?: DataValidation[];
  mappings?: FieldMapping[];
  cleanedData?: Array<Record<string, unknown>>;
  originalData?: Array<Record<string, unknown>>;
  extractedContent?: ExtractedContent;
  chatMessages?: ChatMessage[];
  contractAnalysis?: ContractAnalysis;
  previewUrl?: string;
  thumbnailUrl?: string;
}

export interface DataQualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  validity: number;
  duplicates: number;
  errors: number;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  validation?: string[];
  isRequired: boolean;
}

export interface DataValidation {
  field: string;
  rule: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ColumnInfo {
  name: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'boolean';
  nullable: boolean;
  unique: boolean;
  sampleValues: Array<string | number | boolean | null>;
  statistics?: {
    min?: number;
    max?: number;
    avg?: number;
    count: number;
    nullCount: number;
  };
}

export interface ExtractedContent {
  text?: string;
  metadata?: ExtractedContentMetadata;
  entities?: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  summary?: string;
  keyTerms?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  language?: string;
  pages?: number;
  duration?: number;
  resolution?: string;
  format?: string;
  exif?: Record<string, unknown>;
  videoMetadata?: Record<string, unknown>;
  fileSize?: number;
  creationDate?: string;
  modificationDate?: string;
  mimeType?: string;
  checksum?: string;
}

export interface ChatMessage {
  timestamp: string;
  sender: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
}

export interface ContractAnalysis {
  parties: string[];
  keyTerms: Array<{
    term: string;
    value: string;
    confidence: number;
  }>;
  clauses: Array<{
    clause: string;
    type: string;
    status: 'compliant' | 'non-compliant' | 'unknown';
  }>;
}
