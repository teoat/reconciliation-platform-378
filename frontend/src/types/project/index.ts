// Project Management Types

import { User } from '../user';
// Note: These imports will be resolved from the main index.ts to avoid circular dependencies
// For now, we'll use type references that will be available at runtime

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

// ProjectData references types from ingestion and reconciliation modules
// Using proper types to avoid circular dependencies
import type { CashflowData, AdjudicationData, VisualizationData } from '../ingestion/data';
import type { ReconciliationRecord, EnhancedReconciliationRecord } from '../reconciliation/index';

// IngestionData is a union of all ingestion-related data types
export type IngestionData = {
  cashflow?: CashflowData;
  adjudication?: AdjudicationData;
  visualization?: VisualizationData;
  [key: string]: unknown; // Allow additional ingestion data types
};

// ReconciliationData contains reconciliation records and metrics
export interface ReconciliationData {
  records: ReconciliationRecord[] | EnhancedReconciliationRecord[];
  metrics?: {
    totalRecords: number;
    matchedRecords: number;
    unmatchedRecords: number;
    [key: string]: unknown;
  };
  [key: string]: unknown; // Allow additional reconciliation data
}

export interface ProjectData {
  ingestionData?: IngestionData;
  reconciliationData?: ReconciliationData;
  cashflowData?: CashflowData;
  adjudicationData?: AdjudicationData;
  visualizationData?: VisualizationData;
  [key: string]: unknown; // Allow additional project data types
}

export interface ProjectAnalytics {
  performance: PerformanceMetrics;
  quality: QualityMetrics;
  trends: TrendAnalysis;
  predictions: PredictiveAnalytics;
  // Extended properties for dashboard/analytics views
  totalProjects?: number;
  activeProjects?: number;
  completedProjects?: number;
  averageMatchRate?: number;
  departmentStats?: Array<{
    department: string;
    count: number;
    matchRate: number;
    projectCount?: number;
    averageMatchRate?: number;
  }>;
}

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

// Extended project types for enhanced features
export type EnhancedProject = Project & {
  enhanced?: {
    tags?: string[];
    priority?: 'low' | 'medium' | 'high' | 'critical';
    customMetadata?: Record<string, unknown>;
  };
  // Direct properties for easier access
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  department?: string;
  recordCount?: number;
  matchRate?: number;
  budget?: number;
  lastActivity?: string | Date | {
    user: string;
    action: string;
    timestamp: string | Date;
  };
  alerts?: Array<{
    id: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
  }>;
  progress?: {
    current: number;
    total: number;
    percentage: number;
    completionPercentage?: number;
    currentStep?: number;
  };
  // Additional project metadata
  fiscalPeriod?: string;
  complianceRequirements?: string[];
  template?: string;
  estimatedDuration?: number;
};

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  settings: Partial<ProjectSettings>;
  defaultFields: CustomField[];
  category?: string;
  color?: string;
  icon?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
  estimatedDuration?: number;
}

export interface ProjectFilters {
  status?: ProjectStatus[];
  type?: ProjectType[];
  owner?: string[];
  tags?: string[];
  category?: string[];
  priority?: Array<'low' | 'medium' | 'high' | 'critical'>;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  search?: string;
}

