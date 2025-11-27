/**
 * Type definitions for Custom Reports feature
 */

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: string | number | boolean | string[] | null;
  label: string;
}

export interface ReportMetric {
  id: string;
  name: string;
  type: 'count' | 'sum' | 'average' | 'percentage' | 'trend';
  field?: string;
  calculation?: string;
  format: 'number' | 'currency' | 'percentage' | 'date';
}

export interface ReportVisualization {
  type: 'table' | 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  metrics: string[];
  groupBy?: string;
  sortBy?: string;
  limit?: number;
}

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  dataSource: 'reconciliation' | 'cashflow' | 'projects' | 'users';
  filters: ReportFilter[];
  metrics: ReportMetric[];
  visualizations: ReportVisualization[];
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  tags: string[];
}

export interface CustomReportsProps {
  project: import('../services/apiClient/types').BackendProject;
  onProgressUpdate?: (step: string) => void;
}

export interface ReportData {
  data: unknown[];
  metrics: Record<string, number>;
}

