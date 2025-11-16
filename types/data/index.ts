// Generic data types for data handling, mapping, and transfer

import { BaseMetadata, DataSourceMetadata } from '../common';

// Data source types
export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  connection: DataSourceConnection;
  metadata: DataSourceMetadata;
  status: DataSourceStatus;
  lastSyncAt?: Date;
  syncInterval?: number;
  enabled: boolean;
}

export type DataSourceType = 
  | 'database'
  | 'api'
  | 'file'
  | 'stream'
  | 'webhook'
  | 'sftp'
  | 's3'
  | 'azure_blob'
  | 'gcs';

export interface DataSourceConnection {
  type: DataSourceType;
  config: Record<string, unknown>;
  credentials?: DataSourceCredentials;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

export interface DataSourceCredentials {
  type: 'basic' | 'oauth' | 'api_key' | 'token' | 'certificate';
  data: Record<string, unknown>;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay?: number;
}

export type DataSourceStatus = 
  | 'active'
  | 'inactive'
  | 'error'
  | 'syncing'
  | 'paused';

// Data mapping types
export interface DataMapping {
  id: string;
  name: string;
  sourceId: string;
  targetId: string;
  mappings: FieldMapping[];
  transformations?: DataTransformation[];
  validationRules?: MappingValidationRule[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: FieldTransformation;
  defaultValue?: unknown;
  required: boolean;
  validation?: FieldValidation;
}

export interface FieldTransformation {
  type: TransformationType;
  parameters?: Record<string, unknown>;
  script?: string;
}

export type TransformationType =
  | 'none'
  | 'copy'
  | 'format'
  | 'calculate'
  | 'lookup'
  | 'concat'
  | 'split'
  | 'custom';

export interface FieldValidation {
  type: ValidationType;
  rules: ValidationRule[];
  errorMessage?: string;
}

export type ValidationType = 
  | 'required'
  | 'type'
  | 'range'
  | 'pattern'
  | 'custom';

export interface ValidationRule {
  name: string;
  parameters: Record<string, unknown>;
}

export interface MappingValidationRule {
  field: string;
  rule: string;
  parameters: Record<string, unknown>;
  severity: 'error' | 'warning';
}

// Data transfer types
export interface DataTransfer {
  id: string;
  name: string;
  source: DataSource;
  target: DataSource;
  mapping: DataMapping;
  status: TransferStatus;
  progress: TransferProgress;
  startedAt?: Date;
  completedAt?: Date;
  error?: TransferError;
  metadata: BaseMetadata;
}

export type TransferStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface TransferProgress {
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  percentage: number;
  currentBatch?: number;
  totalBatches?: number;
  estimatedTimeRemaining?: number;
}

export interface TransferError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  retryable: boolean;
}

// Data transformation types
export interface DataTransformation {
  id: string;
  name: string;
  type: TransformationType;
  sourceFields: string[];
  targetField: string;
  script?: string;
  parameters?: Record<string, unknown>;
  enabled: boolean;
}

// Re-export common types for convenience
export type { BaseMetadata, DataSourceMetadata } from '../common';

