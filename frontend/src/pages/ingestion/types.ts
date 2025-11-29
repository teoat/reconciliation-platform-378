// Types and interfaces for the Ingestion Page
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
  sampleValues: unknown[];
  statistics?: {
    min?: number;
    max?: number;
    avg?: number;
    count: number;
    nullCount: number;
  };
}

export interface EXIFData {
  camera?: {
    make?: string;
    model?: string;
    lens?: string;
    serialNumber?: string;
  };
  settings?: {
    aperture?: string;
    shutterSpeed?: string;
    iso?: number;
    focalLength?: string;
    exposureCompensation?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  };
  timestamp?: {
    original?: string;
    digitized?: string;
  };
}

export interface VideoMetadata {
  duration?: number;
  resolution?: string;
  frameRate?: number;
  codec?: string;
  bitrate?: number;
  audioTracks?: number;
  subtitles?: boolean;
}

export interface ExtractedContent {
  text?: string;
  tables?: unknown[][];
  images?: string[];
  metadata?: Record<string, unknown>;
  confidence?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ContractAnalysis {
  parties?: string[];
  amounts?: number[];
  dates?: string[];
  obligations?: string[];
  risks?: string[];
  summary?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  preview?: string;
  exifData?: EXIFData;
  videoMetadata?: VideoMetadata;
  extractedContent?: ExtractedContent;
  contractAnalysis?: ContractAnalysis;
  dataQuality?: DataQualityMetrics;
  validationResults?: DataValidation[];
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface TableData {
  columns: ColumnInfo[];
  rows: unknown[][];
  totalRows: number;
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  column: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: unknown;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IngestionPageProps {
  project?: Record<string, unknown>;
}
