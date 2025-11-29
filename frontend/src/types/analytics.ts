// ============================================================================
// ANALYTICS & REPORTING TYPES
// ============================================================================

import type { ID, Timestamp } from './backend';
import type { User } from './backend';

export interface DashboardData {
  overview: DashboardOverview;
  metrics: Metric[];
  charts: Chart[];
  recentActivity: Activity[];
  alerts: Alert[];
  lastUpdated: Timestamp;
}

export interface DashboardOverview {
  totalProjects: number;
  activeReconciliations: number;
  pendingDiscrepancies: number;
  matchRate: number;
  processingTime: number;
  dataVolume: number;
}

export interface Metric {
  id: ID;
  name: string;
  value: number;
  unit: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  period: string;
  trend: TrendData[];
}

export interface TrendData {
  timestamp: Timestamp;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface Chart {
  id: ID;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'heatmap';
  title: string;
  data: ChartData[];
  config: ChartConfig;
  lastUpdated: Timestamp;
}

export interface ChartData {
  label: string;
  value: number;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface ChartConfig {
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  colors?: string[];
  animations?: boolean;
  responsive?: boolean;
}

export interface AxisConfig {
  label: string;
  min?: number;
  max?: number;
  format?: string;
}

export interface Activity {
  id: ID;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  timestamp: Timestamp;
  user?: User;
  metadata?: Record<string, unknown>;
}

export interface Alert {
  id: ID;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: Timestamp;
  acknowledgedAt?: Timestamp;
  resolvedAt?: Timestamp;
  acknowledgedBy?: User;
  resolvedBy?: User;
}
