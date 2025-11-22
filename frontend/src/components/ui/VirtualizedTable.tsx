/**
 * VirtualizedTable Component
 * Provides virtual scrolling for large data tables to improve performance
 * Optimized for tables with >1000 rows
 */

import React, { useMemo, useRef, useCallback, useState } from 'react';
import { useVirtualScroll } from '../../utils/virtualScrolling';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
}

export interface VirtualizedTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  estimatedRowHeight?: number;
  overscan?: number;
  onRowClick?: (row: T) => void;
  onRowSelect?: (row: T, index: number) => void;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  getRowId?: (row: T) => string;
  enableKeyboardNavigation?: boolean;
}

/**
 * VirtualizedTable - A performant table component with virtual scrolling
 * Use this component for tables with >1k rows to prevent UI blocking
 */
export const VirtualizedTable = React.memo(function VirtualizedTable<T extends { id?: string }>({
  data,
  columns,
  estimatedRowHeight = 50,
  overscan = 5,
  onRowClick,
  onRowSelect,
  className = '',
  headerClassName = '',
  rowClassName = '',
  getRowId,
  enableKeyboardNavigation = true,
}: VirtualizedTableProps<T>) {
  const containerHeight = 600; // Fixed height for virtual scrolling
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1);

  const { visibleItems, totalHeight, handleScroll } = useVirtualScroll(data, {
    itemHeight: estimatedRowHeight,
    containerHeight,
    overscan,
  });

  const navigateToRow = useCallback(
    (index: number) => {
      if (index >= 0 && index < data.length) {
        setSelectedRowIndex(index);
        onRowSelect?.(data[index], index);
        // Scroll to make the row visible if needed
        const rowTop = index * estimatedRowHeight;
        const container = containerRef.current;
        if (container) {
          const scrollTop = container.scrollTop;
          const containerBottom = scrollTop + containerHeight;
          if (rowTop < scrollTop) {
            container.scrollTop = rowTop;
          } else if (rowTop + estimatedRowHeight > containerBottom) {
            container.scrollTop = rowTop + estimatedRowHeight - containerHeight;
          }
        }
      }
    },
    [data, estimatedRowHeight, containerHeight, onRowSelect]
  );

  const handleArrowUp = useCallback(() => {
    const newIndex = Math.max(0, selectedRowIndex - 1);
    navigateToRow(newIndex);
  }, [selectedRowIndex, navigateToRow]);

  const handleArrowDown = useCallback(() => {
    const newIndex = Math.min(data.length - 1, selectedRowIndex + 1);
    navigateToRow(newIndex);
  }, [selectedRowIndex, data.length, navigateToRow]);

  const handleEnter = useCallback(() => {
    if (selectedRowIndex >= 0 && selectedRowIndex < data.length) {
      onRowClick?.(data[selectedRowIndex]);
    }
  }, [selectedRowIndex, data, onRowClick]);

  const handleHome = useCallback(() => {
    navigateToRow(0);
  }, [navigateToRow]);

  const handleEnd = useCallback(() => {
    navigateToRow(data.length - 1);
  }, [data.length, navigateToRow]);

  useKeyboardNavigation({
    onArrowUp: handleArrowUp,
    onArrowDown: handleArrowDown,
    onEnter: handleEnter,
    onHome: handleHome,
    onEnd: handleEnd,
    enabled: enableKeyboardNavigation,
  });

  const totalWidth = useMemo(() => {
    return columns.reduce((sum, col) => {
      const width =
        typeof col.width === 'string'
          ? parseFloat(col.width.replace('px', '')) || 150
          : col.width || 150;
      return sum + width;
    }, 0);
  }, [columns]);

  const getRowKey = useCallback(
    (index: number): string => {
      const row = data[index];
      if (getRowId) {
        return getRowId(row);
      }
      return row?.id || `row-${index}`;
    },
    [data, getRowId]
  );

  const getRowClass = useCallback(
    (row: T, index: number): string => {
      if (typeof rowClassName === 'function') {
        return rowClassName(row, index);
      }
      return rowClassName || '';
    },
    [rowClassName]
  );

  return (
    <div className={`virtualized-table-container ${className}`}>
      <div
        ref={containerRef}
        className="virtualized-table-scroll border border-gray-200 rounded-lg overflow-hidden bg-white"
        style={{
          height: containerHeight,
          overflow: 'auto',
        }}
        onScroll={handleScroll}
      >
        <table
          className="virtualized-table min-w-full"
          style={{
            width: totalWidth,
            height: totalHeight,
            position: 'relative',
          }}
          role="table"
          aria-label="Data table with virtual scrolling"
        >
          <thead
            className={`virtualized-table-header sticky top-0 bg-gray-50 border-b border-gray-200 z-10 ${headerClassName}`}
          >
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{
                    width: column.width || 150,
                    minWidth: column.minWidth || 100,
                    maxWidth: column.maxWidth,
                  }}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {visibleItems.map((virtualRow) => {
              const row = data[virtualRow.index];
              const isSelected = virtualRow.index === selectedRowIndex;
              return (
                <tr
                  key={getRowKey(virtualRow.index)}
                  className={`hover:bg-gray-50 transition-colors border-b border-gray-200 ${
                    isSelected ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''
                  } ${getRowClass(row, virtualRow.index)}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.top}px)`,
                    height: virtualRow.height,
                  }}
                  onClick={() => {
                    setSelectedRowIndex(virtualRow.index);
                    onRowSelect?.(row, virtualRow.index);
                    onRowClick?.(row);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedRowIndex(virtualRow.index);
                      onRowSelect?.(row, virtualRow.index);
                      onRowClick?.(row);
                    }
                  }}
                  tabIndex={isSelected ? 0 : -1}
                  aria-selected={isSelected}
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                      style={{
                        width: column.width || 150,
                        minWidth: column.minWidth || 100,
                        maxWidth: column.maxWidth,
                      }}
                    >
                      {column.accessor(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

VirtualizedTable.displayName = 'VirtualizedTable';

export default VirtualizedTable;
