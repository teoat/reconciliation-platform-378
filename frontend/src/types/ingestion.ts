// frontend/src/types/ingestion.ts

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'completed' | 'error' | 'processing' | 'validating' | 'extracting' | 'analyzing';
  progress: number;
  records?: number;
  uploadedAt?: Date;
  error?: string;
  data?: Record<string, unknown>;
  columns?: ColumnInfo[];
  qualityMetrics?: DataQualityMetrics;
  validations?: DataValidation[];
  cleanedData?: Record<string, unknown>[];
}

export interface ColumnInfo {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  nullable: boolean;
  unique: boolean;
  sampleValues: (string | number | boolean | null)[];
}

export interface DataValidation {
  id: string;
  field: string;
  rule: string;
  status: 'passed' | 'failed';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DataQualityMetrics {
  completeness: number;
  uniqueness: number;
  consistency: number;
  validity: number;
  overallScore: number;
}

export interface DataRow {
  [key: string]: string | number | boolean | Date | null;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
}
