// Sorting utilities for reconciliation
import type { EnhancedReconciliationRecord, SortConfig } from '@/types/reconciliation/index';

/**
 * Sorts reconciliation records
 */
export const sortRecords = (
  records: EnhancedReconciliationRecord[],
  sortConfig: SortConfig | null
): EnhancedReconciliationRecord[] => {
  if (!sortConfig) return records;

  return [...records].sort((a, b) => {
    const aVal = getFieldValue(a, sortConfig.field);
    const bVal = getFieldValue(b, sortConfig.field);

    // Handle null values
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return sortConfig.direction === 'asc' ? -1 : 1;
    if (bVal == null) return sortConfig.direction === 'asc' ? 1 : -1;

    // Compare values
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Gets field value from record (supports nested paths)
 */
const getFieldValue = (record: EnhancedReconciliationRecord, field: string): unknown => {
  // Check top-level fields
  if (field in record) {
    return (record as unknown as Record<string, unknown>)[field];
  }

  // Check sources
  if (field.startsWith('source.')) {
    const sourceField = field.replace('source.', '');
    return record.sources[0]?.data[sourceField];
  }

  // Check metadata
  if (field.startsWith('metadata.')) {
    const metaField = field.replace('metadata.', '');
    return record.metadata[metaField as keyof typeof record.metadata];
  }

  return null;
};
