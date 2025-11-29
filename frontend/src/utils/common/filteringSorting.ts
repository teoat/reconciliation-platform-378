// Filtering and sorting utilities
import type { UploadedFile } from '@/types/ingestion/index';
import { EnhancedReconciliationRecord } from '@/types/reconciliation/index';

/**
 * Generic filter function for arrays
 */
export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'between';

export const filterByProperty = <T>(
  items: T[],
  property: keyof T,
  value: unknown,
  operator: FilterOperator = 'equals',
  value2?: unknown
): T[] => {
  return items.filter((item) => {
    const itemValue = item[property];

    switch (operator) {
      case 'equals':
        return itemValue === value;
      case 'contains':
        return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
      case 'startsWith':
        return String(itemValue).toLowerCase().startsWith(String(value).toLowerCase());
      case 'endsWith':
        return String(itemValue).toLowerCase().endsWith(String(value).toLowerCase());
      case 'greaterThan':
        return Number(itemValue) > Number(value);
      case 'lessThan':
        return Number(itemValue) < Number(value);
      case 'between':
        return Number(itemValue) >= Number(value) && Number(itemValue) <= Number(value2);
      default:
        return true;
    }
  });
};

/**
 * Generic sort function for arrays
 */
export const sortByProperty = <T>(
  items: T[],
  property: keyof T,
  direction: 'asc' | 'desc' = 'asc',
  transform?: (value: unknown) => unknown
): T[] => {
  return [...items].sort((a, b) => {
    let aValue: unknown = a[property];
    let bValue: unknown = b[property];

    if (transform) {
      aValue = transform(aValue);
      bValue = transform(bValue);
    }

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return direction === 'asc' ? -1 : 1;
    if (bValue == null) return direction === 'asc' ? 1 : -1;

    // Handle string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Advanced filter with multiple criteria
 */
export const advancedFilter = <T>(
  items: T[],
  filters: Array<{
    property: keyof T;
    value: unknown;
    operator?: FilterOperator;
    value2?: unknown;
  }>
): T[] => {
  return items.filter((item) => {
    return filters.every((filter) => {
      return (
        filterByProperty([item], filter.property, filter.value, filter.operator, filter.value2)
          .length > 0
      );
    });
  });
};

/**
 * Chain multiple sorting operations
 */
export const multiSort = <T>(
  items: T[],
  sorts: Array<{
    property: keyof T;
    direction?: 'asc' | 'desc';
    transform?: (value: unknown) => unknown;
  }>
): T[] => {
  let sortedItems = [...items];

  sorts.forEach((sort) => {
    sortedItems = sortByProperty(sortedItems, sort.property, sort.direction, sort.transform);
  });

  return sortedItems;
};

/**
 * Filter uploaded files by various criteria
 */
export const filterUploadedFiles = (
  files: UploadedFile[],
  filters: {
    status?: UploadedFile['status'];
    type?: string;
    sizeMin?: number;
    sizeMax?: number;
    name?: string;
  }
): UploadedFile[] => {
  let filteredFiles = files;

  if (filters.status) {
    filteredFiles = filterByProperty(filteredFiles, 'status', filters.status);
  }

  if (filters.type) {
    filteredFiles = filterByProperty(filteredFiles, 'type', filters.type, 'contains');
  }

  if (filters.sizeMin !== undefined) {
    filteredFiles = filterByProperty(filteredFiles, 'size', filters.sizeMin, 'greaterThan');
  }

  if (filters.sizeMax !== undefined) {
    filteredFiles = filterByProperty(filteredFiles, 'size', filters.sizeMax, 'lessThan');
  }

  if (filters.name) {
    filteredFiles = filterByProperty(filteredFiles, 'name', filters.name, 'contains');
  }

  return filteredFiles;
};

/**
 * Sort uploaded files
 */
export const sortUploadedFiles = (
  files: UploadedFile[],
  sortBy: 'name' | 'size' | 'status' | 'uploadedAt',
  direction: 'asc' | 'desc' = 'asc'
): UploadedFile[] => {
  const transforms: Record<string, (value: unknown) => unknown> = {
    uploadedAt: (value) => (value ? new Date(value as string | Date).getTime() : 0),
    size: (value) => Number(value),
  };

  return sortByProperty(files, sortBy, direction, transforms[sortBy]);
};

/**
 * Filter reconciliation records
 */
export const filterReconciliationRecords = (
  records: EnhancedReconciliationRecord[],
  filters: {
    status?: EnhancedReconciliationRecord['status'];
    confidenceMin?: number;
    confidenceMax?: number;
    riskLevel?: EnhancedReconciliationRecord['riskLevel'];
    priority?: EnhancedReconciliationRecord['metadata']['priority'];
  }
): EnhancedReconciliationRecord[] => {
  let filteredRecords = records;

  if (filters.status) {
    filteredRecords = filterByProperty(filteredRecords, 'status', filters.status);
  }

  if (filters.confidenceMin !== undefined) {
    filteredRecords = filterByProperty(
      filteredRecords,
      'confidence',
      filters.confidenceMin,
      'greaterThan'
    );
  }

  if (filters.confidenceMax !== undefined) {
    filteredRecords = filterByProperty(
      filteredRecords,
      'confidence',
      filters.confidenceMax,
      'lessThan'
    );
  }

  if (filters.riskLevel) {
    filteredRecords = filterByProperty(filteredRecords, 'riskLevel', filters.riskLevel);
  }

  if (filters.priority) {
    filteredRecords = filteredRecords.filter(
      (record) => record.metadata.priority === filters.priority
    );
  }

  return filteredRecords;
};

/**
 * Sort reconciliation records
 */
export const sortReconciliationRecords = (
  records: EnhancedReconciliationRecord[],
  sortBy: 'confidence' | 'status' | 'createdAt' | 'riskLevel',
  direction: 'asc' | 'desc' = 'asc'
): EnhancedReconciliationRecord[] => {
  const transforms: Partial<Record<'confidence' | 'status' | 'createdAt' | 'riskLevel', (value: unknown) => unknown>> = {
    createdAt: (value) => new Date(value as string | number).getTime(),
  };

  return sortByProperty(records, sortBy as keyof EnhancedReconciliationRecord, direction, transforms[sortBy]);
};

/**
 * Paginate results
 */
export const paginate = <T>(
  items: T[],
  page: number,
  pageSize: number
): {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} => {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    items: items.slice(startIndex, endIndex),
    totalItems,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};
