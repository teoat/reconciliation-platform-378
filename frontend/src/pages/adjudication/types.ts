// Types for AdjudicationPage

export type ReconciliationStatus = 'matched' | 'unmatched' | 'discrepancy' | 'pending' | 'reviewed';

// Extended type for AdjudicationPage that includes additional properties from API
export interface ExtendedReconciliationRecord {
  id: string;
  reconciliationId?: string;
  sourceARecordId?: string;
  sourceBRecordId?: string;
  sources?: Array<{
    systemName?: string;
    data?: { amount?: number; [key: string]: unknown };
    [key: string]: unknown;
  }>;
  difference?: number;
  discrepancyAmount?: number;
  discrepancy_amount?: number;
  confidence?: number;
  confidenceScore?: number;
  confidence_score?: number;
  matchScore?: number;
  status: ReconciliationStatus;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

