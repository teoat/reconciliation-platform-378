// Data preview hook
import { useState, useCallback, useMemo } from 'react';
import type { DataRow, SortConfig, FilterConfig, PaginationConfig, ColumnValue } from '@/types/ingestion/index';

export const useDataPreview = (data: DataRow[] = []) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: 50,
    totalRecords: data.length,
  } as PaginationConfig);

  const handleSort = useCallback((field: string) => {
    setSortConfig((prev) => ({
      field,
      direction: prev?.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

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

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, page: 1 }));
  }, []);

  // Process data with filters and sorting
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    filters.forEach((filter) => {
      result = result.filter((row) => {
        const value = row[filter.field];
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
        }
        // eslint-disable-next-line no-unreachable
        return true; // Fallback (should never reach here due to exhaustive switch)
      });
    });

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.field];
        const bVal = b[sortConfig.field];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bVal == null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, filters, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const pageSize = 'pageSize' in pagination ? (pagination.pageSize as number) : 50;
    const startIndex = (pagination.page - 1) * pageSize;
    const endIndex = startIndex + (pageSize as number);
    return processedData.slice(startIndex, endIndex);
  }, [processedData, pagination]);

  // Update total records when data changes
  useMemo(() => {
    setPagination((prev) => ({ ...prev, totalRecords: processedData.length }));
  }, [processedData.length]);

  return {
    sortConfig,
    filters,
    pagination,
    processedData,
    paginatedData,
    handleSort,
    addFilter,
    removeFilter,
    clearFilters,
    handlePageChange,
    handlePageSizeChange,
  };
};

