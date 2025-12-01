/**
 * Data Component Types
 */

export interface DataRecord {
  id: string;
  [key: string]: unknown;
}

export interface DataColumn {
  key: string;
  label: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
  sortable?: boolean;
  filterable?: boolean;
}

export interface DataTableProps {
  data: DataRecord[];
  columns: DataColumn[];
  onSort?: (column: string) => void;
  onFilter?: (filters: Record<string, unknown>) => void;
}
