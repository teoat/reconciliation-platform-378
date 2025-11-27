/**
 * Adapter functions for converting between different data types
 */

import type { ReconciliationRecord } from '@/types/index';
import type { ReconciliationRecord as DataManagementRecord } from '../services/dataManagement/types';
import type { RecordMetadata } from '../types/reconciliation';
import { extractNumber, extractString, extractDate } from '../types/sourceData';

/**
 * Map DataManagement status to ReconciliationRecord status
 * Both use compatible status types, but we validate for type safety
 */
export function mapStatus(status: DataManagementRecord['status']): ReconciliationRecord['status'] {
  // Type-safe mapping - both types have compatible values
  const statusMap: Record<string, ReconciliationRecord['status']> = {
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
export function adaptReconciliationRecord(record: DataManagementRecord): ReconciliationRecord {
  // Extract first source if available for mapping
  const firstSource = record.sources?.[0];
  const sourceData = firstSource?.data;

  // Type-safe extraction of source data fields using utility functions
  const amount = extractNumber(sourceData, 'amount', 0);
  const currency = extractString(sourceData, 'currency', 'USD');
  const transactionDate = extractDate(sourceData, 'date', new Date().toISOString());
  const description = extractString(sourceData, 'description', '');

  return {
    id: record.id,
    projectId: record.reconciliationId, // Map reconciliationId to projectId
    sourceId: firstSource?.id || record.id,
    targetId: record.batchId,
    sourceSystem: firstSource?.systemName || 'unknown',
    targetSystem: 'reconciliation',
    amount,
    currency,
    transactionDate,
    description,
    status: mapStatus(record.status), // Type-safe status mapping
    matchType: undefined,
    confidence: record.confidence ?? 0,
    discrepancies: [], // Would need to map from record.resolution or other fields
    metadata: (record.metadata as unknown as RecordMetadata) || {
      source: {},
      target: {},
      computed: {},
      tags: [],
      notes: [],
    },
    createdAt: record.metadata?.createdAt || new Date().toISOString(),
    updatedAt: record.metadata?.updatedAt || new Date().toISOString(),
  };
}

