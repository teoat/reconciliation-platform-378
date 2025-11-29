/**
 * Adapter functions for converting between different data types
 */

import type { ReconciliationRecord as BaseReconciliationRecord } from '@/types/index';
import type { ReconciliationRecord as DataManagementRecord } from '../../services/dataManagement/types';
import type { RecordMetadata } from '../../types/reconciliation/index';
import { extractNumber, extractString, extractDate } from '../../types/sourceData';

// Extended ReconciliationRecord for reports with additional properties
interface ReportReconciliationRecord extends Omit<BaseReconciliationRecord, 'status'> {
  projectId?: string;
  sourceId?: string;
  targetId?: string;
  sourceSystem?: string;
  targetSystem?: string;
  amount?: number;
  currency?: string;
  transactionDate?: string;
  description?: string;
  status: 'matched' | 'unmatched' | 'discrepancy' | 'pending' | 'reviewed';
  matchType?: string;
  confidence?: number;
  discrepancies?: Array<{
    field: string;
    expected: string | number;
    actual: string | number;
    type: string;
  }>;
  metadata?: RecordMetadata;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Map discrepancies from DataManagement record
 */
function mapDiscrepancies(record: DataManagementRecord): ReportReconciliationRecord['discrepancies'] {
  // Extract discrepancies from record.resolution or other fields
  const resolution = record.resolution as { discrepancies?: Array<{ field: string; expected: string | number; actual: string | number; type: string }> } | undefined;
  if (resolution?.discrepancies) {
    return resolution.discrepancies.map((d) => ({
      field: d.field || 'unknown',
      expected: d.expected || '',
      actual: d.actual || '',
      type: d.type || 'mismatch',
    }));
  }
  // Check for discrepancies in metadata
  const metadata = record.metadata as { discrepancies?: Array<{ field: string; expected: string | number; actual: string | number; type: string }> } | undefined;
  if (metadata?.discrepancies) {
    return metadata.discrepancies.map((d) => ({
      field: d.field || 'unknown',
      expected: d.expected || '',
      actual: d.actual || '',
      type: d.type || 'mismatch',
    }));
  }
  return [];
}

/**
 * Map DataManagement status to ReportReconciliationRecord status
 * Both use compatible status types, but we validate for type safety
 */
export function mapStatus(status: DataManagementRecord['status']): ReportReconciliationRecord['status'] {
  // Type-safe mapping - both types have compatible values
  const statusMap: Record<string, ReportReconciliationRecord['status']> = {
    matched: 'matched',
    unmatched: 'unmatched',
    discrepancy: 'discrepancy',
    pending: 'pending',
    resolved: 'reviewed', // Map resolved to reviewed
    escalated: 'pending', // Map escalated to pending
  };
  return statusMap[status] || 'pending';
}

/**
 * Adapter to convert DataManagement ReconciliationRecord to Report ReconciliationRecord
 * This bridges the incompatible type definitions from different modules
 *
 * **Type-Safe**: Uses type guards and safe extraction functions instead of `as any`
 */
export function adaptReconciliationRecord(record: DataManagementRecord): ReportReconciliationRecord {
  // Extract first source if available for mapping
  const firstSource = record.sources?.[0];
  const sourceData = firstSource?.data;

  // Type-safe extraction of source data fields using utility functions
  const amount = extractNumber(sourceData, 'amount', 0);
  const currency = extractString(sourceData, 'currency', 'USD');
  const transactionDate = extractDate(sourceData, 'date', new Date().toISOString());
  const description = extractString(sourceData, 'description', '');

  // Build metadata with discrepancies if available
  const metadata: RecordMetadata = (record.metadata as unknown as RecordMetadata) || {
    source: {},
    target: {},
    computed: {},
    tags: [],
    notes: [],
  };
  
  // Store discrepancies in metadata if they exist
  const resolution = record.resolution as { discrepancies?: Array<{ field: string; expected: string | number; actual: string | number; type: string }> } | undefined;
  if (resolution?.discrepancies) {
    metadata.computed = {
      ...metadata.computed,
      discrepancies: resolution.discrepancies,
    };
  } else if (record.metadata && typeof record.metadata === 'object' && 'discrepancies' in record.metadata) {
    metadata.computed = {
      ...metadata.computed,
      discrepancies: (record.metadata as { discrepancies?: unknown }).discrepancies,
    };
  }

  return {
    id: record.id,
    reconciliationId: record.reconciliationId,
    sourceARecordId: firstSource?.id || record.id,
    sourceBRecordId: record.batchId,
    status: mapStatus(record.status), // Type-safe status mapping
    discrepancyAmount: extractNumber(sourceData, 'amount', undefined),
    confidenceScore: record.confidence ?? undefined,
  };
}

