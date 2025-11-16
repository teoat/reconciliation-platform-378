// Extracted types from ReconciliationPage.tsx for better organization

export interface ReconciliationSource {
  id: string;
  systemId: string;
  systemName: string;
  recordId: string;
  data: Record<string, any>;
  timestamp: string;
  quality: DataQuality;
  confidence: number;
  metadata: Record<string, any>;
}

export interface DataQuality {
  completeness: number;
  accuracy: number;
  consistency: number;
  validity: number;
  duplicates: number;
  errors: number;
}

export interface MatchingRule {
  id: string;
  name: string;
  type: 'exact' | 'fuzzy' | 'algorithmic' | 'manual';
  criteria: MatchingCriteria[];
  weight: number;
  applied: boolean;
  result: MatchingResult;
  confidence: number;
}

export interface MatchingCriteria {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'fuzzy';
  value: any;
  tolerance?: number;
  weight: number;
}

export interface MatchingResult {
  matched: boolean;
  confidence: number;
  reason: string;
  details: Record<string, any>;
}

export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details: Record<string, any>;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface RecordRelationship {
  id: string;
  type: 'parent' | 'child' | 'sibling' | 'related';
  targetRecordId: string;
  confidence: number;
  reason: string;
}

export interface Resolution {
  id: string;
  type: 'automatic' | 'manual' | 'approved';
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  assignedTo?: string;
  assignedBy?: string;
  assignedAt?: string;
  resolvedAt?: string;
  resolution: string;
  comments: string[];
  attachments: string[];
}

export interface EnhancedReconciliationRecord {
  id: string;
  reconciliationId: string;
  batchId: string;
  sources: ReconciliationSource[];
  status: 'matched' | 'unmatched' | 'discrepancy' | 'pending' | 'resolved' | 'escalated';
  confidence: number;
  matchingRules: MatchingRule[];
  auditTrail: AuditEntry[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    version: number;
    tags: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  relationships: RecordRelationship[];
  resolution?: Resolution;
  matchScore: number;
  difference?: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReconciliationMetrics {
  totalRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  discrepancyRecords: number;
  pendingRecords: number;
  resolvedRecords: number;
  escalatedRecords: number;
  averageConfidence: number;
  averageProcessingTime: number;
  matchRate: number;
  accuracy: number;
  throughput: number;
  errorRate: number;
  slaCompliance: number;
}

export interface FilterConfig {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn';
  value: any;
  value2?: any;
  active: boolean;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface BulkAction {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  requiresSelection: boolean;
  requiresConfirmation: boolean;
  action: (selectedIds: string[]) => void;
}

export interface ReconciliationPageProps {
  project: any;
  onProgressUpdate?: (step: string) => void;
}

