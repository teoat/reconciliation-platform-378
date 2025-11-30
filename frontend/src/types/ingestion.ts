export interface DataQualityField {
  fieldName: string;
  value: any;
  quality: number;
  notes: string[];
}

export interface DataQualityRecord {
  id: string;
  quality: number;
  fields: DataQualityField[];
}

export interface IngestionFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  records: DataQualityRecord[];
  quality: number;
}
