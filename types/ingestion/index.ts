// Extracted types from IngestionPage.tsx for better organization

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

export type ColumnValue = string | number | boolean | null;

export type DataRow = Record<string, ColumnValue> & {
  id: string;
};

export interface ColumnInfo {
  name: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'boolean';
  nullable: boolean;
  unique: boolean;
  sampleValues: ColumnValue[];
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
    exposureMode?: string;
    whiteBalance?: string;
    flash?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    address?: string;
  };
  timestamp?: string;
  software?: string;
  orientation?: number;
  colorSpace?: string;
  compression?: string;
}

export interface VideoMetadata {
  duration?: number;
  resolution?: {
    width: number;
    height: number;
  };
  frameRate?: number;
  bitrate?: number;
  codec?: {
    video?: string;
    audio?: string;
  };
  container?: string;
  creationDate?: string;
  modificationDate?: string;
  fileSize?: number;
  aspectRatio?: string;
  colorSpace?: string;
  audioChannels?: number;
  audioSampleRate?: number;
}

export interface ExtractedContent {
  text?: string;
  metadata?: Record<string, any>;
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
  exif?: EXIFData;
  videoMetadata?: VideoMetadata;
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
  type: 'text' | 'image' | 'file' | 'voice';
  metadata?: Record<string, any>;
}

export interface ContractAnalysis {
  parties: string[];
  keyTerms: Array<{
    term: string;
    value: string;
    importance: number;
  }>;
  dates: Array<{
    type: string;
    date: string;
  }>;
  amounts: Array<{
    description: string;
    amount: number;
    currency: string;
  }>;
  clauses: Array<{
    type: string;
    content: string;
    risk: 'low' | 'medium' | 'high';
  }>;
  compliance: Array<{
    requirement: string;
    status: 'compliant' | 'non-compliant' | 'unknown';
  }>;
}

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
  data?: DataRow[];
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
  cleanedData?: DataRow[];
  originalData?: DataRow[];
  extractedContent?: ExtractedContent;
  chatMessages?: ChatMessage[];
  contractAnalysis?: ContractAnalysis;
  previewUrl?: string;
  thumbnailUrl?: string;
  file?: File;
}

export interface TableData {
  id: string;
  [key: string]: ColumnValue;
}

