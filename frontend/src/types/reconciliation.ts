// types/reconciliation.ts

import { Priority } from './common';

export interface Reconciliation {
  id: string;
  projectId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  sourceA: string;
  sourceB: string;
  matchRate: number;
  totalMatches: number;
  totalDiscrepancies: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface ReconciliationRecord {
  id: string;
  reconciliationId: string;
  sourceARecordId: string;
  sourceBRecordId: string;
  status: 'matched' | 'unmatched' | 'discrepancy';
  discrepancyAmount?: number;
  confidenceScore?: number;
  priority?: Priority;
}
