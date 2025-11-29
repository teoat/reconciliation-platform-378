// types/ingestion.ts

import { ComparisonOperator } from './common';

export interface FilterConfig {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
}

export interface PaginationConfig {
  page: number;
  limit: number;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface IngestionJob {
  id: string;
  projectId: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  errorCount: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface IngestionStatistics {
  totalFiles: number;
  totalRows: number;
  totalErrors: number;
  averageProcessingTime: number;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
}
