// types/common.ts

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type ComparisonOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'startsWith'
  | 'endsWith';

export interface ReconciliationMetrics {
  totalRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  matchRate: number;
  processingTime: number;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  throughput: number;
  errorRate: number;
}

export interface QualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
}

export type Permission =
  | 'project:create'
  | 'project:read'
  | 'project:update'
  | 'project:delete'
  | 'reconciliation:run'
  | 'reconciliation:read'
  | 'reconciliation:update'
  | 'reconciliation:delete'
  | 'user:create'
  | 'user:read'
  | 'user:update'
  | 'user:delete';

export interface DataRetentionPolicy {
  duration: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
}

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'run'
  | 'export';

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  status: 'compliant' | 'non-compliant' | 'pending';
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
