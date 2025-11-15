// Business Intelligence Service Types
import { Metadata } from '@/types/metadata';

// Report configuration
export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  type: 'dashboard' | 'table' | 'chart' | 'kpi' | 'summary' | 'detailed';
  category: 'financial' | 'operational' | 'compliance' | 'performance' | 'custom';
  dataSource: string;
  filters: ReportFilter[];
  aggregations: ReportAggregation[];
  visualizations: ReportVisualization[];
  schedule?: ReportSchedule;
  permissions: ReportPermissions;
  metadata: ReportMetadata;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface ReportFilter {
  id: string;
  field: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'greater_than'
    | 'less_than'
    | 'between'
    | 'in'
    | 'not_in';
  value: string | number | boolean | string[] | null | undefined;
  isRequired: boolean;
  isDynamic: boolean;
}

export interface ReportAggregation {
  id: string;
  field: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median' | 'stddev' | 'variance';
  alias: string;
  groupBy?: string;
  orderBy?: 'asc' | 'desc';
  limit?: number;
}

export interface ReportVisualization {
  id: string;
  type:
    | 'bar'
    | 'line'
    | 'pie'
    | 'area'
    | 'scatter'
    | 'heatmap'
    | 'sankey'
    | 'treemap'
    | 'gauge'
    | 'table';
  title: string;
  dataField: string;
  xAxis?: string;
  yAxis?: string;
  colorField?: string;
  sizeField?: string;
  options: VisualizationOptions;
  position: { x: number; y: number; width: number; height: number };
}

export interface VisualizationOptions {
  showLegend: boolean;
  showGrid: boolean;
  showLabels: boolean;
  showTooltips: boolean;
  colors: string[];
  animation: boolean;
  responsive: boolean;
  customOptions: Metadata;
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  time: string;
  timezone: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'html';
  deliveryMethod: 'email' | 'ftp' | 'sftp' | 'webhook' | 'api';
  lastRun?: Date;
  nextRun?: Date;
}

export interface ReportPermissions {
  view: string[];
  edit: string[];
  delete: string[];
  share: string[];
  export: string[];
  schedule: string[];
}

export interface ReportMetadata {
  version: string;
  author: string;
  tags: string[];
  lastModifiedBy: string;
  lastModifiedAt: Date;
  viewCount: number;
  shareCount: number;
  exportCount: number;
  performance: ReportPerformance;
}

export interface ReportPerformance {
  averageLoadTime: number;
  lastLoadTime: number;
  cacheHitRate: number;
  errorRate: number;
  userSatisfaction: number;
}

// Dashboard configuration
export interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  permissions: DashboardPermissions;
  metadata: DashboardMetadata;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface DashboardLayout {
  type: 'grid' | 'flex' | 'custom';
  columns: number;
  rows: number;
  gap: number;
  padding: number;
  responsive: boolean;
  breakpoints: Metadata;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'kpi' | 'table' | 'text' | 'image' | 'iframe' | 'custom';
  title: string;
  reportId?: string;
  dataSource?: string;
  position: { x: number; y: number; width: number; height: number };
  options: WidgetOptions;
  refreshInterval?: number;
  isVisible: boolean;
}

export interface WidgetOptions {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: number;
  margin: number;
  shadow: boolean;
  animation: boolean;
  customCss?: string;
}

export interface DashboardFilter {
  id: string;
  field: string;
  type: 'date' | 'select' | 'multiselect' | 'range' | 'text' | 'number';
  label: string;
  options?: Array<{ label: string; value: string | number }>;
  defaultValue?: string | number | boolean | null;
  isRequired: boolean;
  position: { x: number; y: number; width: number; height: number };
}

export interface DashboardPermissions {
  view: string[];
  edit: string[];
  delete: string[];
  share: string[];
  export: string[];
}

export interface DashboardMetadata {
  version: string;
  author: string;
  tags: string[];
  lastModifiedBy: string;
  lastModifiedAt: Date;
  viewCount: number;
  shareCount: number;
  exportCount: number;
  performance: DashboardPerformance;
}

export interface DashboardPerformance {
  averageLoadTime: number;
  lastLoadTime: number;
  cacheHitRate: number;
  errorRate: number;
  userSatisfaction: number;
  widgetLoadTimes: Record<string, number>;
}

// KPI definition
export interface KPIDefinition {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'customer' | 'employee' | 'quality' | 'custom';
  dataSource: string;
  calculation: KPICalculation;
  target: KPITarget;
  visualization: KPIVisualization;
  alerts: KPIAlert[];
  metadata: KPIMetadata;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface KPICalculation {
  formula: string;
  fields: string[];
  aggregations: ReportAggregation[];
  filters: ReportFilter[];
  timeRange: {
    type: 'relative' | 'absolute';
    value: string;
    startDate?: Date;
    endDate?: Date;
  };
  refreshInterval: number;
}

export interface KPITarget {
  value: number;
  operator: 'greater_than' | 'less_than' | 'equals' | 'between';
  minValue?: number;
  maxValue?: number;
  unit: string;
  isRequired: boolean;
}

export interface KPIVisualization {
  type: 'number' | 'gauge' | 'trend' | 'sparkline' | 'progress';
  format: string;
  colors: {
    good: string;
    warning: string;
    critical: string;
  };
  showTrend: boolean;
  showTarget: boolean;
  showComparison: boolean;
}

export interface KPIAlert {
  id: string;
  name: string;
  condition: 'above_target' | 'below_target' | 'threshold' | 'change_percentage';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[];
  channels: ('email' | 'sms' | 'webhook' | 'slack' | 'teams')[];
  isEnabled: boolean;
  lastTriggered?: Date;
}

export interface KPIMetadata {
  version: string;
  author: string;
  tags: string[];
  lastModifiedBy: string;
  lastModifiedAt: Date;
  viewCount: number;
  alertCount: number;
  performance: KPIPerformance;
}

export interface KPIPerformance {
  averageCalculationTime: number;
  lastCalculationTime: number;
  errorRate: number;
  alertRate: number;
  accuracy: number;
}

// Analytics query
export interface AnalyticsQuery {
  id: string;
  name: string;
  description: string;
  dataSource: string;
  query: string;
  parameters: QueryParameter[];
  resultFormat: 'json' | 'csv' | 'table' | 'chart';
  cacheEnabled: boolean;
  cacheTTL: number;
  permissions: QueryPermissions;
  metadata: QueryMetadata;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface QueryParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  defaultValue?: string | number | boolean | string[] | null | undefined;
  isRequired: boolean;
  validation?: string;
}

export interface QueryPermissions {
  execute: string[];
  view: string[];
  edit: string[];
  delete: string[];
  share: string[];
}

export interface QueryMetadata {
  version: string;
  author: string;
  tags: string[];
  lastModifiedBy: string;
  lastModifiedAt: Date;
  executionCount: number;
  averageExecutionTime: number;
  errorRate: number;
}

