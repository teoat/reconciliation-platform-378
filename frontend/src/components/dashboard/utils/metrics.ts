// Metrics Utility Functions
// Extracted from AnalyticsDashboard.tsx

import type { DashboardMetrics, ReconciliationStats, DerivedMetrics } from '../types';

/**
 * Calculate derived metrics from dashboard and reconciliation stats
 */
export function calculateDerivedMetrics(
  dashboardMetrics: DashboardMetrics | null,
  reconciliationStats: ReconciliationStats | null
): DerivedMetrics | null {
  if (!dashboardMetrics || !reconciliationStats) return null;

  return {
    success_rate:
      reconciliationStats.total_jobs > 0
        ? (reconciliationStats.completed_jobs / reconciliationStats.total_jobs) * 100
        : 0,
    match_rate:
      reconciliationStats.total_records_processed > 0
        ? (reconciliationStats.total_matches_found /
            reconciliationStats.total_records_processed) *
          100
        : 0,
    throughput_per_hour:
      reconciliationStats.average_processing_time > 0
        ? 3600000 / reconciliationStats.average_processing_time
        : 0,
    system_health:
      dashboardMetrics.system_uptime > 99
        ? 'excellent'
        : dashboardMetrics.system_uptime > 95
          ? 'good'
          : dashboardMetrics.system_uptime > 90
            ? 'fair'
            : 'poor',
  };
}

/**
 * Get metric color based on value and thresholds
 */
export function getMetricColor(
  value: number,
  thresholds: { good: number; fair: number }
): string {
  if (value >= thresholds.good) return 'text-green-600';
  if (value >= thresholds.fair) return 'text-yellow-600';
  return 'text-red-600';
}

