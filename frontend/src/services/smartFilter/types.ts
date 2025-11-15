// Type definitions for Smart Filter Service
export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  category: 'recent' | 'saved' | 'smart' | 'template' | 'default' | 'history';
  filters: FilterConfig[];
  usageCount: number;
  lastUsed: Date;
  createdBy: string;
  isPublic: boolean;
  tags: string[];
  confidence: number; // AI confidence score
  isDefault?: boolean;
  isSmart?: boolean;
  metadata?: {
    projectId?: string;
    workflowStage?: string;
    dataType?: string;
  };
}

export interface FilterConfig {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: unknown;
  label: string;
  isRequired: boolean;
  weight: number; // For AI scoring
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  mappingType: 'exact' | 'fuzzy' | 'semantic' | 'ai_suggested';
  transformation?: {
    type: 'format' | 'convert' | 'extract' | 'combine';
    rules: Array<Record<string, unknown>>;
  };
  validation?: {
    required: boolean;
    format?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface AIMappingSuggestion {
  id: string;
  sourceFields: string[];
  targetFields: string[];
  confidence: number;
  reasoning: string;
  alternatives: FieldMapping[];
  suggestedTransformations: Array<Record<string, unknown>>;
}

export interface SmartDefaults {
  filters: FilterConfig[];
  sorting: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination: {
    pageSize: number;
  };
  viewMode: 'table' | 'cards' | 'timeline';
  columns: string[];
}

