// Reconciliation sorting hook
import { useState, useCallback, useMemo } from 'react';
import { sortRecords } from '../../utils/reconciliation/sorting';
import type { EnhancedReconciliationRecord, SortConfig } from '../../types/reconciliation/index';

export const useReconciliationSort = (records: EnhancedReconciliationRecord[]) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const handleSort = useCallback((field: string) => {
    setSortConfig((prev) => ({
      field,
      direction: prev?.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const clearSort = useCallback(() => {
    setSortConfig(null);
  }, []);

  const sortedRecords = useMemo(() => {
    return sortRecords(records, sortConfig);
  }, [records, sortConfig]);

  return {
    sortConfig,
    sortedRecords,
    handleSort,
    clearSort,
  };
};

