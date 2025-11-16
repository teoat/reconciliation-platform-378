// Quality metrics utilities for ingestion
import { DataQualityMetrics, DataRow, ColumnInfo } from '../../types/ingestion';

/**
 * Calculates completeness score for a dataset
 */
export const calculateCompleteness = (data: DataRow[], columns: ColumnInfo[]): number => {
  if (!data.length || !columns.length) return 0;

  let totalCells = data.length * columns.length;
  let filledCells = 0;

  data.forEach((row) => {
    columns.forEach((column) => {
      const value = row[column.name];
      if (value !== null && value !== undefined && value !== '') {
        filledCells++;
      }
    });
  });

  return totalCells > 0 ? (filledCells / totalCells) * 100 : 0;
};

/**
 * Calculates accuracy score (placeholder - would need domain-specific rules)
 */
export const calculateAccuracy = (data: DataRow[], columns: ColumnInfo[]): number => {
  // This is a simplified implementation
  // In a real system, this would involve domain-specific validation rules
  let accurateRecords = 0;

  data.forEach((row) => {
    let isAccurate = true;
    columns.forEach((column) => {
      const value = row[column.name];

      // Basic checks
      if (column.type === 'number' && typeof value === 'string') {
        // Try to parse as number
        if (isNaN(Number(value))) {
          isAccurate = false;
        }
      }

      if (column.type === 'date' && typeof value === 'string') {
        // Basic date validation
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          isAccurate = false;
        }
      }
    });

    if (isAccurate) accurateRecords++;
  });

  return data.length > 0 ? (accurateRecords / data.length) * 100 : 0;
};

/**
 * Calculates consistency score
 */
export const calculateConsistency = (data: DataRow[], columns: ColumnInfo[]): number => {
  if (!data.length || !columns.length) return 100;

  let consistencyScore = 100;

  columns.forEach((column) => {
    const values = data
      .map((row) => row[column.name])
      .filter((v) => v !== null && v !== undefined && v !== '');

    if (values.length === 0) return;

    // Check for format consistency
    if (column.type === 'number') {
      const numberValues = values.filter((v) => !isNaN(Number(v)));
      const consistency = numberValues.length / values.length;
      consistencyScore = Math.min(consistencyScore, consistency * 100);
    }

    if (column.type === 'date') {
      const dateValues = values.filter((v) => {
        const date = new Date(v as string);
        return !isNaN(date.getTime());
      });
      const consistency = dateValues.length / values.length;
      consistencyScore = Math.min(consistencyScore, consistency * 100);
    }
  });

  return consistencyScore;
};

/**
 * Calculates validity score
 */
export const calculateValidity = (data: DataRow[], columns: ColumnInfo[]): number => {
  if (!data.length || !columns.length) return 100;

  let validRecords = 0;

  data.forEach((row) => {
    let isValid = true;

    columns.forEach((column) => {
      const value = row[column.name];

      // Check required fields
      if (!column.nullable && (value === null || value === undefined || value === '')) {
        isValid = false;
      }

      // Check data type validity
      if (value !== null && value !== undefined && value !== '') {
        switch (column.type) {
          case 'number':
          case 'currency':
            if (typeof value !== 'number' && isNaN(Number(value))) {
              isValid = false;
            }
            break;
          case 'date':
            if (typeof value === 'string') {
              const date = new Date(value);
              if (isNaN(date.getTime())) {
                isValid = false;
              }
            }
            break;
          case 'boolean':
            if (
              typeof value !== 'boolean' &&
              !['true', 'false', '1', '0'].includes(String(value).toLowerCase())
            ) {
              isValid = false;
            }
            break;
        }
      }
    });

    if (isValid) validRecords++;
  });

  return data.length > 0 ? (validRecords / data.length) * 100 : 0;
};

/**
 * Calculates duplicate records
 */
export const calculateDuplicates = (data: DataRow[]): number => {
  if (!data.length) return 0;

  const seen = new Set<string>();
  let duplicates = 0;

  data.forEach((row) => {
    // Create a simple hash of the row values
    const rowHash = JSON.stringify(row);
    if (seen.has(rowHash)) {
      duplicates++;
    } else {
      seen.add(rowHash);
    }
  });

  return duplicates;
};

/**
 * Calculates total errors from validations
 */
export const calculateErrors = (
  validations: Array<{ severity: 'error' | 'warning' | 'info' }>
): number => {
  return validations.filter((v) => v.severity === 'error').length;
};

/**
 * Calculates comprehensive data quality metrics
 */
export const calculateDataQualityMetrics = (
  data: DataRow[],
  columns: ColumnInfo[],
  validations: Array<{ severity: 'error' | 'warning' | 'info' }> = []
): DataQualityMetrics => {
  return {
    completeness: calculateCompleteness(data, columns),
    accuracy: calculateAccuracy(data, columns),
    consistency: calculateConsistency(data, columns),
    validity: calculateValidity(data, columns),
    duplicates: calculateDuplicates(data),
    errors: calculateErrors(validations),
  };
};

/**
 * Gets overall quality score
 */
export const getOverallQualityScore = (metrics: DataQualityMetrics): number => {
  const weights = {
    completeness: 0.25,
    accuracy: 0.25,
    consistency: 0.2,
    validity: 0.2,
    duplicates: 0.05,
    errors: 0.05,
  };

  // Normalize duplicates and errors (lower is better)
  const normalizedDuplicates = Math.max(0, 100 - metrics.duplicates);
  const normalizedErrors = Math.max(0, 100 - metrics.errors);

  return (
    metrics.completeness * weights.completeness +
    metrics.accuracy * weights.accuracy +
    metrics.consistency * weights.consistency +
    metrics.validity * weights.validity +
    normalizedDuplicates * weights.duplicates +
    normalizedErrors * weights.errors
  );
};
