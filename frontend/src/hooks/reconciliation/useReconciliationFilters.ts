// Reconciliation filtering hook
import { useState, useCallback, useMemo } from 'react';
import { applyFilters } from '../../utils/reconciliation/filtering';
import type { EnhancedReconciliationRecord, FilterConfig } from '../../types/reconciliation';

export const useReconciliationFilters = (records: EnhancedReconciliationRecord[]) => {
  const [filters, setFilters] = useState<FilterConfig[]>([]);

  const addFilter = useCallback((filter: FilterConfig) => {
    setFilters((prev) => {
      const existing = prev.find((f) => f.field === filter.field);
      if (existing) {
        return prev.map((f) => (f.field === filter.field ? filter : f));
      }
      return [...prev, filter];
    });
  }, []);

  const removeFilter = useCallback((field: string) => {
    setFilters((prev) => prev.filter((f) => f.field !== field));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  const toggleFilter = useCallback((field: string) => {
    setFilters((prev) =>
      prev.map((f) => (f.field === field ? { ...f, active: !f.active } : f))
    );
  }, []);

  const filteredRecords = useMemo(() => {
    return applyFilters(records, filters);
  }, [records, filters]);

  return {
    filters,
    filteredRecords,
    addFilter,
    removeFilter,
    clearFilters,
    toggleFilter,
  };
};

