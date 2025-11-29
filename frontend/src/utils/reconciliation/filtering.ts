// Filtering utilities for reconciliation
import type { EnhancedReconciliationRecord, FilterConfig } from '@/types/reconciliation/index';

/**
 * Applies filters to reconciliation records
 */
export const applyFilters = (
  records: EnhancedReconciliationRecord[],
  filters: FilterConfig[]
): EnhancedReconciliationRecord[] => {
  if (!filters.length) return records;

  return records.filter((record) => {
    return filters.every((filter) => {
      if (!filter.active) return true;

      const value = getFieldValue(record, filter.field);

      switch (filter.operator) {
        case 'equals':
          return value === filter.value;
        case 'contains':
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'startsWith':
          return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
        case 'endsWith':
          return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
        case 'greaterThan':
          return Number(value) > Number(filter.value);
        case 'lessThan':
          return Number(value) < Number(filter.value);
        case 'between':
          return (
            Number(value) >= Number(filter.value) &&
            Number(value) <= Number(filter.value2 || 0)
          );
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(value);
        case 'notIn':
          return Array.isArray(filter.value) && !filter.value.includes(value);
        default:
          return true;
      }
    });
  });
};

/**
 * Gets field value from record (supports nested paths)
 */
const getFieldValue = (record: EnhancedReconciliationRecord, field: string): unknown => {
  // Check top-level fields
  if (field in record) {
    return (record as Record<string, unknown>)[field];
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
