import React, { useState, useMemo, memo, useCallback } from 'react';
import { useVirtualScroll, VirtualScrollResult } from '../../utils/virtualScrolling';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { ChevronUp } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { MoreHorizontal } from 'lucide-react';
import { Search } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Select from './Select';

export interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  className?: string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  virtualized?: boolean;
  virtualRowHeight?: number;
  virtualContainerHeight?: number;
}

const DataTableComponent = <T extends Record<string, unknown>>({
  data,
  columns,
  searchable = true,
  filterable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  className = '',
  onRowClick,
  emptyMessage = 'No data available',
  virtualized,
  virtualRowHeight = 44,
  virtualContainerHeight = 480,
}: DataTableProps<T>) => {
  // Auto-enable virtualization for large datasets (>1k rows)
  const shouldVirtualize = virtualized !== undefined ? virtualized : data.length > 1000;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1);

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter((row) =>
        columns.some((column) => {
          const value = row[column.key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter((row) => {
          const cellValue = row[key];
          return cellValue && cellValue.toString().toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    return filtered;
  }, [data, searchTerm, filters, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data (disabled when virtualized)
  const paginatedData = useMemo(() => {
    if (!pagination || shouldVirtualize) return sortedData;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination, shouldVirtualize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const v: VirtualScrollResult | null = shouldVirtualize
    ? useVirtualScroll(sortedData, {
        itemHeight: virtualRowHeight,
        containerHeight: virtualContainerHeight,
        overscan: 8,
      })
    : null;

  const handleSort = (key: keyof T) => {
    if (!sortable) return;

    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Keyboard navigation for row selection
  const navigateToRow = useCallback(
    (index: number) => {
      const displayData = shouldVirtualize ? sortedData : paginatedData;
      if (index >= 0 && index < displayData.length) {
        setSelectedRowIndex(index);
        // Scroll into view if needed (for virtualized tables, this is handled by the virtual scroll)
        if (!shouldVirtualize && pagination) {
          const pageIndex = Math.floor(index / pageSize);
          if (pageIndex + 1 !== currentPage) {
            setCurrentPage(pageIndex + 1);
          }
        }
        // Focus the row for accessibility
        const rowElement = document.querySelector(`[data-row-index="${index}"]`) as HTMLElement;
        if (rowElement) {
          rowElement.focus();
        }
      }
    },
    [shouldVirtualize, sortedData, paginatedData, pageSize, currentPage, pagination]
  );

  const handleArrowUp = useCallback(() => {
    const newIndex = Math.max(0, selectedRowIndex - 1);
    navigateToRow(newIndex);
  }, [selectedRowIndex, navigateToRow]);

  const handleArrowDown = useCallback(() => {
    const displayData = shouldVirtualize ? sortedData : paginatedData;
    const newIndex = Math.min(displayData.length - 1, selectedRowIndex + 1);
    navigateToRow(newIndex);
  }, [selectedRowIndex, navigateToRow, shouldVirtualize, sortedData, paginatedData]);

  const handleEnter = useCallback(() => {
    const displayData = shouldVirtualize ? sortedData : paginatedData;
    if (selectedRowIndex >= 0 && selectedRowIndex < displayData.length) {
      onRowClick?.(displayData[selectedRowIndex]);
    }
  }, [selectedRowIndex, onRowClick, shouldVirtualize, sortedData, paginatedData]);

  const handleHome = useCallback(() => {
    navigateToRow(0);
  }, [navigateToRow]);

  const handleEnd = useCallback(() => {
    const displayData = shouldVirtualize ? sortedData : paginatedData;
    navigateToRow(displayData.length - 1);
  }, [navigateToRow, shouldVirtualize, sortedData, paginatedData]);

  useKeyboardNavigation({
    onArrowUp: handleArrowUp,
    onArrowDown: handleArrowDown,
    onEnter: handleEnter,
    onHome: handleHome,
    onEnd: handleEnd,
    enabled: !!onRowClick,
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Toolbar */}
      {(searchable || filterable) && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {searchable && (
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    className="pl-10"
                    aria-label="Search table data"
                  />
                </div>
              </div>
            )}

            {filterable && (
              <div className="flex gap-2">
                {columns
                  .filter((col) => col.filterable)
                  .map((column) => (
                    <div key={String(column.key)} className="min-w-32">
                      <Select
                        value={filters[String(column.key)] || ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleFilterChange(String(column.key), e.target.value)
                        }
                        className="text-sm"
                        options={[
                          { value: '', label: `All ${column.header}` },
                          ...Array.from(new Set(data.map((row) => row[column.key])))
                            .filter(Boolean)
                            .map((value) => ({
                              value: String(value),
                              label: String(value),
                            })),
                        ]}
                      />
                    </div>
                  ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="whitespace-nowrap"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Data table">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.className || ''
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {sortable && column.sortable && (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        aria-label={`Sort by ${column.header}`}
                      >
                        {sortConfig.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )
                        ) : (
                          <MoreHorizontal className="h-4 w-4 opacity-50" />
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(!shouldVirtualize ? paginatedData : sortedData).length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : shouldVirtualize ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <div
                    ref={v!.containerRef}
                    onScroll={v!.handleScroll}
                    style={{
                      height: virtualContainerHeight,
                      overflow: 'auto',
                      position: 'relative',
                    }}
                  >
                    <div style={{ height: v!.totalHeight, position: 'relative' }}>
                      {v!.visibleItems.map(({ index, top, height }) => {
                        const row = sortedData[index];
                        return (
                          <div
                            key={index}
                            style={{ position: 'absolute', top, height, left: 0, right: 0 }}
                            data-row-index={index}
                          >
                            <div
                              role="row"
                              aria-rowindex={index + 2}
                              className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500' : ''} transition-colors duration-150 ${
                                index === selectedRowIndex
                                  ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset'
                                  : ''
                              }`}
                              onClick={() => {
                                setSelectedRowIndex(index);
                                onRowClick?.(row);
                              }}
                              tabIndex={onRowClick ? 0 : undefined}
                              onKeyDown={(e) => {
                                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                                  e.preventDefault();
                                  onRowClick(row);
                                }
                              }}
                              aria-selected={index === selectedRowIndex}
                            >
                              <div className="table-row">
                                {columns.map((column) => (
                                  <div
                                    key={String(column.key)}
                                    className={`table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                                  >
                                    {column.render
                                      ? column.render(row[column.key], row)
                                      : String(row[column.key] || '-')}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index;
                const isSelected = globalIndex === selectedRowIndex;
                return (
                  <tr
                    key={index}
                    data-row-index={globalIndex}
                    role="row"
                    aria-rowindex={globalIndex + 2}
                    className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500' : ''} transition-colors duration-150 ${
                      isSelected ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''
                    }`}
                    onClick={() => {
                      setSelectedRowIndex(globalIndex);
                      onRowClick?.(row);
                    }}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }}
                    aria-selected={isSelected}
                  >
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : String(row[column.key] || '-')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && !shouldVirtualize && totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {Math.min((currentPage - 1) * pageSize + 1, sortedData.length)} to{' '}
              {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const DataTable = memo(DataTableComponent) as <T extends Record<string, unknown>>(
  props: DataTableProps<T>
) => React.JSX.Element;
