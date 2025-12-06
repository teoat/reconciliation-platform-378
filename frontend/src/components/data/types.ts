// Data Component Types

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
}

export interface DataTableRow {
  id: string;
  [key: string]: unknown;
}

export interface DataTableProps {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  onRowClick?: (row: DataTableRow) => void;
  loading?: boolean;
}
