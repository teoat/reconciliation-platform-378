// Data quality metrics hook
import { useState, useCallback } from 'react';
import { analyzeDataQuality, calculateFieldCompleteness, detectDuplicates } from '@/utils/ingestion/qualityMetrics';
import type { DataRow, DataQualityMetrics } from '@/types/ingestion/index';

export const useDataQuality = () => {
  const [metrics, setMetrics] = useState<DataQualityMetrics | null>(null);

  const analyze = useCallback((data: DataRow[]) => {
    const results = analyzeDataQuality(data);
    setMetrics(results);
    return results;
  }, []);

  const getFieldCompleteness = useCallback((data: DataRow[], field: string) => {
    return calculateFieldCompleteness(data, field);
  }, []);

  const getDuplicates = useCallback((data: DataRow[]) => {
    return detectDuplicates(data);
  }, []);

  return {
    metrics,
    analyze,
    getFieldCompleteness,
    getDuplicates,
  };
};

