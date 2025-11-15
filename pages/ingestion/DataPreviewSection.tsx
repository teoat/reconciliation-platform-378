import React, { useState, useMemo } from 'react';
import { Table, Eye, Edit, Trash2, Filter, Search, ArrowUpDown } from 'lucide-react';
import { UploadedFile, TableData, SortConfig, FilterConfig, PaginationConfig } from './types';

interface DataPreviewSectionProps {
  selectedFile: UploadedFile | null;
  tableData: TableData | null;
  onSort: (column: string) => void;
  onFilter: (filters: FilterConfig[]) => void;
  sortConfig: SortConfig;
  filters: FilterConfig[];
  pagination: PaginationConfig;
  onPageChange: (page: number) => void;
}

const DataPreviewSection: React.FC<DataPreviewSectionProps> = ({
  selectedFile,
  tableData,
  onSort,
  onFilter,
  sortConfig,
  filters,
  pagination,
  onPageChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!tableData) return null;

    let filtered = tableData.rows;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((row) =>
        row.some((cell) => String(cell).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply column filters
    filters.forEach((filter) => {
      const columnIndex = tableData.columns.findIndex((col) => col.name === filter.column);
      if (columnIndex !== -1) {
        filtered = filtered.filter((row) => {
          const value = row[columnIndex];
          switch (filter.operator) {
            case 'equals':
              return String(value) === String(filter.value);
            case 'contains':
              return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
            case 'greater':
              return Number(value) > Number(filter.value);
            case 'less':
              return Number(value) < Number(filter.value);
            default:
              return true;
          }
        });
      }
    });

    return filtered;
  }, [tableData, searchTerm, filters]);

  const paginatedData = useMemo(() => {
    if (!filteredData) return null;
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    return filteredData.slice(startIndex, startIndex + pagination.pageSize);
  }, [filteredData, pagination]);

  if (!selectedFile || !tableData) {
    return (
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Data Preview</h3>
        </div>
        <div className="text-center py-8 text-secondary-500">
          <Table className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
          <p>Select a file to preview its data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Data Preview</h3>
        <div className="text-sm text-secondary-500">
          {tableData.totalRows.toLocaleString()} rows • {tableData.columns.length} columns
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
          <input
            type="text"
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center space-x-2 px-3 py-2 border border-secondary-300 rounded-lg hover:bg-secondary-50">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-secondary-200">
              {tableData.columns.map((column) => (
                <th
                  key={column.name}
                  className="text-left py-3 px-4 font-medium text-secondary-700 cursor-pointer hover:bg-secondary-50"
                  onClick={() => onSort(column.name)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.name}</span>
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData?.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-secondary-100 hover:bg-secondary-50">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="py-3 px-4 text-sm">
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-secondary-500">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, tableData.totalRows)} of{' '}
            {tableData.totalRows} entries
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-secondary-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-50"
            >
              Previous
            </button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border border-secondary-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPreviewSection;
