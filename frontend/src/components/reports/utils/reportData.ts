/**
 * Report data generation and filtering utilities
 */

import type { CustomReport, ReportData, ReportFilter } from '../types';
import { adaptReconciliationRecord } from '../adapters';

/**
 * Apply filters to data based on report filter configuration
 */
export function applyFilters(
  data: Record<string, unknown>[],
  filters: ReportFilter[]
): Record<string, unknown>[] {
  return data.filter((record) => {
    return filters.every((filter) => {
      const recordValue = record[filter.field];
      const filterValue = filter.value;

      switch (filter.operator) {
        case 'equals': {
          return recordValue === filterValue;
        }
        case 'contains': {
          return String(recordValue).toLowerCase().includes(String(filterValue).toLowerCase());
        }
        case 'greater_than': {
          return Number(recordValue) > Number(filterValue);
        }
        case 'less_than': {
          return Number(recordValue) < Number(filterValue);
        }
        case 'between': {
          if (Array.isArray(filterValue) && filterValue.length >= 2) {
            return (
              Number(recordValue) >= Number(filterValue[0]) &&
              Number(recordValue) <= Number(filterValue[1])
            );
          }
          return false;
        }
        case 'in': {
          return Array.isArray(filterValue) && typeof recordValue !== 'undefined'
            ? filterValue.some((val) => {
                const valStr = String(val);
                const recordStr = String(recordValue);
                return val === recordValue || valStr === recordStr;
              })
            : false;
        }
        default: {
          return true;
        }
      }
    });
  });
}

/**
 * Calculate metrics from filtered data
 */
export function calculateMetrics(
  data: Record<string, unknown>[],
  report: CustomReport
): Record<string, number> {
  const metricsData: Record<string, number> = {};

  report.metrics.forEach((metric) => {
    switch (metric.type) {
      case 'count': {
        metricsData[metric.id] = data.length;
        break;
      }
      case 'sum': {
        if (metric.field) {
          metricsData[metric.id] = data.reduce((sum: number, record) => {
            const fieldValue = record[metric.field!];
            return sum + (Number(fieldValue) || 0);
          }, 0);
        }
        break;
      }
      case 'average': {
        if (metric.field) {
          const values = data
            .map((record) => {
              const fieldValue = record[metric.field!];
              return Number(fieldValue) || 0;
            })
            .filter((v) => v > 0);
          metricsData[metric.id] =
            values.length > 0
              ? values.reduce((sum: number, val) => sum + val, 0) / values.length
              : 0;
        }
        break;
      }
      case 'percentage': {
        if (metric.calculation) {
          // Simple calculation parser (would need more robust implementation)
          const [numerator, denominator] = metric.calculation.split('/');
          const num = metricsData[numerator] || 0;
          const den = metricsData[denominator] || 1;
          metricsData[metric.id] = (num / den) * 100;
        }
        break;
      }
    }
  });

  return metricsData;
}

/**
 * Generate report data from reconciliation or cashflow data
 */
export function generateReportData(
  report: CustomReport,
  reconciliationData: { records?: unknown[] } | null,
  cashflowData: { records?: unknown[] } | null
): ReportData {
  // Get base data based on data source
  let data: unknown[] = [];
  switch (report.dataSource) {
    case 'reconciliation': {
      // Use adapter function to properly convert types
      data = (reconciliationData?.records || []).map(adaptReconciliationRecord);
      break;
    }
    case 'cashflow': {
      // Use adapter function to properly convert types
      data = (cashflowData?.records || []).map(adaptReconciliationRecord);
      break;
    }
    case 'projects': {
      data = []; // Would fetch project data
      break;
    }
    case 'users': {
      data = []; // Would fetch user data
      break;
    }
  }

  // Apply filters
  const filteredData = applyFilters(data as Record<string, unknown>[], report.filters);

  // Calculate metrics
  const metrics = calculateMetrics(filteredData, report);

  return { data: filteredData, metrics };
}

