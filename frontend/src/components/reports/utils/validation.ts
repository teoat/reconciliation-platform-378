/**
 * Validation utilities for reports
 */

import type { CustomReport, ReportFilter, ReportMetric } from '../types';
import type { ValidationError } from '@/utils/common/types';

/**
 * Validate report data
 */
export function validateReport(report: Partial<CustomReport>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!report.name || report.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Report name is required' });
  }

  if (!report.description || report.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Description is required' });
  }

  if (!report.dataSource) {
    errors.push({ field: 'dataSource', message: 'Data source is required' });
  }

  if (!report.metrics || report.metrics.length === 0) {
    errors.push({ field: 'metrics', message: 'At least one metric is required' });
  }

  // Validate metrics
  report.metrics?.forEach((metric, index) => {
    if (!metric.name || metric.name.trim().length === 0) {
      errors.push({ field: `metrics[${index}].name`, message: 'Metric name is required' });
    }
    if (metric.type !== 'count' && !metric.field) {
      errors.push({
        field: `metrics[${index}].field`,
        message: 'Field is required for this metric type',
      });
    }
    if (metric.type === 'percentage' && !metric.calculation) {
      errors.push({
        field: `metrics[${index}].calculation`,
        message: 'Calculation is required for percentage metrics',
      });
    }
  });

  // Validate filters
  report.filters?.forEach((filter, index) => {
    if (!filter.field || filter.field.trim().length === 0) {
      errors.push({ field: `filters[${index}].field`, message: 'Filter field is required' });
    }
    if (!filter.label || filter.label.trim().length === 0) {
      errors.push({ field: `filters[${index}].label`, message: 'Filter label is required' });
    }
  });

  return errors;
}

/**
 * Validate filter
 */
export function validateFilter(filter: Partial<ReportFilter>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!filter.field || filter.field.trim().length === 0) {
    errors.push({ field: 'field', message: 'Field is required' });
  }

  if (!filter.operator) {
    errors.push({ field: 'operator', message: 'Operator is required' });
  }

  if (filter.operator === 'between' && (!Array.isArray(filter.value) || filter.value.length < 2)) {
    errors.push({ field: 'value', message: 'Between operator requires two values' });
  }

  return errors;
}

/**
 * Validate metric
 */
export function validateMetric(metric: Partial<ReportMetric>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!metric.name || metric.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Metric name is required' });
  }

  if (!metric.type) {
    errors.push({ field: 'type', message: 'Metric type is required' });
  }

  if (metric.type !== 'count' && !metric.field) {
    errors.push({ field: 'field', message: 'Field is required for this metric type' });
  }

  if (metric.type === 'percentage' && !metric.calculation) {
    errors.push({ field: 'calculation', message: 'Calculation is required for percentage metrics' });
  }

  return errors;
}

