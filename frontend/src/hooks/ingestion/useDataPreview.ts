import { useState, useCallback } from 'react';
import { DataRow, ColumnInfo } from '@/types/ingestion';
import { sortByProperty, filterByProperty, paginate } from '@/utils/common/filteringSorting';

export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'between';

export interface DataPreviewState {
  data: DataRow[];
  columns: ColumnInfo[];
  filteredData: DataRow[];
  sortedData: DataRow[];
  paginatedData: DataRow[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  filters: Array<{
    field: string;
    value: unknown;
    operator: FilterOperator;
  }>;
  isLoading: boolean;
  error: string | null;
}

export interface DataPreviewActions {
  setData: (data: DataRow[], columns: ColumnInfo[]) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  sort: (field: string, direction?: 'asc' | 'desc') => void;
  addFilter: (field: string, value: unknown, operator?: string) => void;
  removeFilter: (field: string) => void;
  clearFilters: () => void;
  clearSort: () => void;
  refresh: () => void;
  exportData: (format: 'csv' | 'json') => void;
}

export const useDataPreview = () => {
  const [state, setState] = useState<DataPreviewState>({
    data: [],
    columns: [],
    filteredData: [],
    sortedData: [],
    paginatedData: [],
    currentPage: 1,
    pageSize: 25,
    totalPages: 0,
    totalRecords: 0,
    sortField: null,
    sortDirection: 'asc',
    filters: [],
    isLoading: false,
    error: null,
  });

  const setData = useCallback((data: DataRow[], columns: ColumnInfo[]) => {
    setState((prev) => ({
      ...prev,
      data,
      columns,
      filteredData: data,
      sortedData: data,
      totalRecords: data.length,
      currentPage: 1,
    }));

    // Apply current filters and sorting
    updateFilteredData(data);
  }, []);

  const updateFilteredData = useCallback((data: DataRow[]) => {
    setState((prev) => {
      let filteredData = data;

      // Apply filters
      prev.filters.forEach((filter) => {
        filteredData = filterByProperty(filteredData, filter.field, filter.value, filter.operator);
      });

      // Apply sorting
      let sortedData = filteredData;
      if (prev.sortField) {
        sortedData = sortByProperty(filteredData, prev.sortField, prev.sortDirection);
      }

      // Apply pagination
      const paginationResult = paginate(sortedData, prev.currentPage, prev.pageSize);

      return {
        ...prev,
        filteredData,
        sortedData,
        paginatedData: paginationResult.items,
        totalPages: paginationResult.totalPages,
        totalRecords: paginationResult.totalItems,
      };
    });
  }, []);

  const setPage = useCallback((page: number) => {
    setState((prev) => {
      const paginationResult = paginate(prev.sortedData, page, prev.pageSize);
      return {
        ...prev,
        currentPage: page,
        paginatedData: paginationResult.items,
      };
    });
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setState((prev) => {
      const paginationResult = paginate(prev.sortedData, 1, pageSize);
      return {
        ...prev,
        pageSize,
        currentPage: 1,
        paginatedData: paginationResult.items,
        totalPages: paginationResult.totalPages,
      };
    });
  }, []);

  const sort = useCallback((field: string, direction: 'asc' | 'desc' = 'asc') => {
    setState((prev) => {
      const sortedData = sortByProperty(prev.filteredData, field, direction);
      const paginationResult = paginate(sortedData, prev.currentPage, prev.pageSize);

      return {
        ...prev,
        sortField: field,
        sortDirection: direction,
        sortedData,
        paginatedData: paginationResult.items,
      };
    });
  }, []);

  const addFilter = useCallback((field: string, value: unknown, operator: string = 'equals') => {
    setState((prev) => {
      const newFilters = [
        ...prev.filters.filter((f) => f.field !== field),
        { field, value, operator: operator as FilterOperator },
      ];

      let filteredData = prev.data;
      newFilters.forEach((filter) => {
        filteredData = filterByProperty(filteredData, filter.field, filter.value, filter.operator);
      });

      const sortedData = prev.sortField
        ? sortByProperty(filteredData, prev.sortField, prev.sortDirection)
        : filteredData;

      const paginationResult = paginate(sortedData, 1, prev.pageSize);

      return {
        ...prev,
        filters: newFilters,
        filteredData,
        sortedData,
        paginatedData: paginationResult.items,
        currentPage: 1,
        totalPages: paginationResult.totalPages,
        totalRecords: paginationResult.totalItems,
      };
    });
  }, []);

  const removeFilter = useCallback((field: string) => {
    setState((prev) => {
      const newFilters = prev.filters.filter((f) => f.field !== field);

      let filteredData = prev.data;
      newFilters.forEach((filter) => {
        filteredData = filterByProperty(filteredData, filter.field, filter.value, filter.operator);
      });

      const sortedData = prev.sortField
        ? sortByProperty(filteredData, prev.sortField, prev.sortDirection)
        : filteredData;

      const paginationResult = paginate(sortedData, prev.currentPage, prev.pageSize);

      return {
        ...prev,
        filters: newFilters,
        filteredData,
        sortedData,
        paginatedData: paginationResult.items,
        totalPages: paginationResult.totalPages,
        totalRecords: paginationResult.totalItems,
      };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setState((prev) => {
      const sortedData = prev.sortField
        ? sortByProperty(prev.data, prev.sortField, prev.sortDirection)
        : prev.data;

      const paginationResult = paginate(sortedData, 1, prev.pageSize);

      return {
        ...prev,
        filters: [],
        filteredData: prev.data,
        sortedData,
        paginatedData: paginationResult.items,
        currentPage: 1,
        totalPages: paginationResult.totalPages,
        totalRecords: paginationResult.totalItems,
      };
    });
  }, []);

  const clearSort = useCallback(() => {
    setState((prev) => {
      const paginationResult = paginate(prev.filteredData, prev.currentPage, prev.pageSize);

      return {
        ...prev,
        sortField: null,
        sortDirection: 'asc',
        sortedData: prev.filteredData,
        paginatedData: paginationResult.items,
      };
    });
  }, []);

  const refresh = useCallback(() => {
    // In a real implementation, this would re-fetch data
    updateFilteredData(state.data);
  }, [state.data, updateFilteredData]);

  const exportData = useCallback(
    (format: 'csv' | 'json') => {
      const dataToExport = state.sortedData;

      if (format === 'csv') {
        const headers = state.columns.map((col) => col.name).join(',');
        const rows = dataToExport.map((row) =>
          state.columns.map((col) => JSON.stringify(row[col.name] || '')).join(',')
        );
        const csv = [headers, ...rows].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data_export.csv';
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'json') {
        const json = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data_export.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [state.sortedData, state.columns]
  );

  const actions: DataPreviewActions = {
    setData,
    setPage,
    setPageSize,
    sort,
    addFilter,
    removeFilter,
    clearFilters,
    clearSort,
    refresh,
    exportData,
  };

  return {
    state,
    actions,
  };
};
