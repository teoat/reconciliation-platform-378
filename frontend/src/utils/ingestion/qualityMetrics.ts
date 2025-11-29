// Data quality metrics utilities
import type { DataRow, DataQualityMetrics } from '@/types/ingestion/index';

/**
 * Analyzes data quality and returns metrics
 */
export const analyzeDataQuality = (data: DataRow[]): DataQualityMetrics => {
  if (!data.length) {
    return {
      completeness: 0,
      accuracy: 0,
      consistency: 0,
      validity: 0,
      duplicates: 0,
      errors: 0,
    };
  }

  const totalRecords = data.length;
  const totalPossibleValues = totalRecords * Object.keys(data[0] || {}).length;
  let nullCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  const seenRecords = new Set<string>();

  data.forEach((record) => {
    // Check for duplicates
    const recordStr = JSON.stringify(record);
    if (seenRecords.has(recordStr)) {
      duplicateCount++;
    } else {
      seenRecords.add(recordStr);
    }

    // Check for null/empty values
    Object.values(record).forEach((value) => {
      if (value === null || value === undefined || value === '') {
        nullCount++;
      }
    });
  });

  return {
    completeness: Math.round(((totalPossibleValues - nullCount) / totalPossibleValues) * 100),
    accuracy: Math.round(((totalRecords - duplicateCount) / totalRecords) * 100),
    consistency: Math.round(((totalRecords - duplicateCount) / totalRecords) * 100),
    validity: Math.round(((totalRecords - errorCount) / totalRecords) * 100),
    duplicates: duplicateCount,
    errors: errorCount,
  };
};

/**
 * Calculates completeness percentage for a field
 */
export const calculateFieldCompleteness = (data: DataRow[], field: string): number => {
  if (!data.length) return 0;
  const nonNullCount = data.filter((row) => {
    const value = row[field];
    return value !== null && value !== undefined && value !== '';
  }).length;
  return Math.round((nonNullCount / data.length) * 100);
};

/**
 * Detects duplicate records
 */
export const detectDuplicates = (data: DataRow[]): DataRow[] => {
  const seen = new Map<string, DataRow>();
  const duplicates: DataRow[] = [];

  data.forEach((record) => {
    const key = JSON.stringify(record);
    if (seen.has(key)) {
      duplicates.push(record);
    } else {
      seen.set(key, record);
    }
  });

  return duplicates;
};
