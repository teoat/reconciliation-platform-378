// Project Management Types

import { User } from '../user';
import { IngestionData } from '../ingestion';
import { ReconciliationData } from '../reconciliation';
import { CashflowData, AdjudicationData, VisualizationData } from './data';

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

