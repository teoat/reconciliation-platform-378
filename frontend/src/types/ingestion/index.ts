// ============================================================================
// DATA INGESTION TYPES
// ============================================================================

import type { ID, Status, Timestamp } from '../backend-aligned';

export interface IngestionJob {
  id: ID;
  projectId: ID;
  name: string;
  description: string;
  status: Status;
  type: 'file' | 'api' | 'database' | 'stream';
  source: DataSource;
  destination: DataDestination;
  config: IngestionConfig;
  schedule?: ScheduleConfig;
  statistics: IngestionStatistics;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
}

export interface DataSource {
  type: 'file' | 'api' | 'database' | 'stream';
  connection: ConnectionConfig;
  format: 'csv' | 'json' | 'xml' | 'parquet' | 'avro';
  schema?: DataSchema;
}

export interface DataDestination {
  type: 'database' | 'warehouse' | 'lake' | 'api';
  connection: ConnectionConfig;
  table?: string;
  partition?: PartitionConfig;
}

export interface ConnectionConfig {
  host: string;
  port: number;
  database?: string;
  username: string;
  password: string;
  ssl: boolean;
  timeout: number;
}

export interface DataSchema {
  fields: SchemaField[];
  primaryKey?: string[];
  indexes?: IndexConfig[];
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  nullable: boolean;
  defaultValue?: string | number | boolean | Date | object | unknown[];
  constraints?: FieldConstraints;
}

export interface FieldConstraints {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: (string | number | boolean)[];
}

export interface IndexConfig {
  fields: string[];
  unique: boolean;
  type: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface PartitionConfig {
  field: string;
  type: 'range' | 'list' | 'hash';
  values?: (string | number | Date)[];
}

export interface IngestionConfig {
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  validation: ValidationConfig;
  transformation?: TransformationConfig;
}

export interface ValidationConfig {
  enabled: boolean;
  rules: ValidationRule[];
  strict: boolean;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  value?: string | number | boolean | RegExp;
  message?: string;
}

export interface TransformationConfig {
  enabled: boolean;
  rules: TransformationRule[];
}

export interface TransformationRule {
  field: string;
  operation: 'map' | 'filter' | 'aggregate' | 'custom';
  config: Record<string, unknown>;
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  cron?: string;
  timezone: string;
  startDate: Timestamp;
  endDate?: Timestamp;
}

export interface IngestionStatistics {
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  skippedRecords: number;
  processingTime: number;
  averageRecordSize: number;
  throughput: number;
}

