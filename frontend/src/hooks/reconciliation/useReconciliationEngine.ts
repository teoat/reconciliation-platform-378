import { useState, useCallback, useEffect } from 'react';
import {
  EnhancedReconciliationRecord,
  MatchingRule,
  ReconciliationMetrics,
} from '../../types/reconciliation';
import { findMatches, createReconciliationRecords } from '../../utils/reconciliation/matching';

export interface ReconciliationEngineState {
  records: EnhancedReconciliationRecord[];
  metrics: ReconciliationMetrics;
  isProcessing: boolean;
  isMatching: boolean;
  progress: number;
  currentStep: 'idle' | 'matching' | 'scoring' | 'complete';
  error: string | null;
}

export interface ReconciliationEngineActions {
  startReconciliation: (
    sourceData: Record<string, unknown>[],
    targetData: Record<string, unknown>[],
    rules: MatchingRule[],
    threshold?: number
  ) => Promise<void>;
  updateRecord: (recordId: string, updates: Partial<EnhancedReconciliationRecord>) => void;
  bulkUpdateRecords: (recordIds: string[], updates: Partial<EnhancedReconciliationRecord>) => void;
  deleteRecord: (recordId: string) => void;
  recalculateMetrics: () => void;
  reset: () => void;
}

export const useReconciliationEngine = () => {
  const [state, setState] = useState<ReconciliationEngineState>({
    records: [],
    metrics: {
      totalRecords: 0,
      matchedRecords: 0,
      unmatchedRecords: 0,
      discrepancyRecords: 0,
      pendingRecords: 0,
      resolvedRecords: 0,
      escalatedRecords: 0,
      averageConfidence: 0,
      averageProcessingTime: 0,
      matchRate: 0,
      accuracy: 0,
      throughput: 0,
      errorRate: 0,
      slaCompliance: 0,
    },
    isProcessing: false,
    isMatching: false,
    progress: 0,
    currentStep: 'idle',
    error: null,
  });

  const startReconciliation = useCallback(
    async (sourceData: Record<string, unknown>[], targetData: Record<string, unknown>[], rules: MatchingRule[], threshold: number = 80) => {
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        isMatching: true,
        progress: 0,
        currentStep: 'matching',
        error: null,
      }));

      try {
        const startTime = Date.now();

        // Step 1: Find matches
        setState((prev) => ({ ...prev, progress: 25 }));
        const matches = findMatches(sourceData, targetData, rules, threshold);

        // Step 2: Create reconciliation records
        setState((prev) => ({ ...prev, progress: 50, currentStep: 'scoring' }));
        const records = createReconciliationRecords(sourceData, targetData, matches);

        // Step 3: Calculate metrics
        setState((prev) => ({ ...prev, progress: 75 }));
        const metrics = calculateMetrics(records, Date.now() - startTime);

        // Step 4: Complete
        setState((prev) => ({
          ...prev,
          records,
          metrics,
          isProcessing: false,
          isMatching: false,
          progress: 100,
          currentStep: 'complete',
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          isMatching: false,
          error: error instanceof Error ? error.message : 'Reconciliation failed',
        }));
      }
    },
    []
  );

  const updateRecord = useCallback(
    (recordId: string, updates: Partial<EnhancedReconciliationRecord>) => {
      setState((prev) => ({
        ...prev,
        records: prev.records.map((record) =>
          record.id === recordId ? { ...record, ...updates } : record
        ),
      }));

      // Recalculate metrics after update
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          metrics: calculateMetrics(prev.records),
        }));
      }, 0);
    },
    []
  );

  const bulkUpdateRecords = useCallback(
    (recordIds: string[], updates: Partial<EnhancedReconciliationRecord>) => {
      setState((prev) => ({
        ...prev,
        records: prev.records.map((record) =>
          recordIds.includes(record.id) ? { ...record, ...updates } : record
        ),
      }));

      // Recalculate metrics after bulk update
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          metrics: calculateMetrics(prev.records),
        }));
      }, 0);
    },
    []
  );

  const deleteRecord = useCallback((recordId: string) => {
    setState((prev) => ({
      ...prev,
      records: prev.records.filter((record) => record.id !== recordId),
    }));

    // Recalculate metrics after deletion
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        metrics: calculateMetrics(prev.records),
      }));
    }, 0);
  }, []);

  const recalculateMetrics = useCallback(() => {
    setState((prev) => ({
      ...prev,
      metrics: calculateMetrics(prev.records),
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      records: [],
      metrics: {
        totalRecords: 0,
        matchedRecords: 0,
        unmatchedRecords: 0,
        discrepancyRecords: 0,
        pendingRecords: 0,
        resolvedRecords: 0,
        escalatedRecords: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        matchRate: 0,
        accuracy: 0,
        throughput: 0,
        errorRate: 0,
        slaCompliance: 0,
      },
      isProcessing: false,
      isMatching: false,
      progress: 0,
      currentStep: 'idle',
      error: null,
    });
  }, []);

  const actions: ReconciliationEngineActions = {
    startReconciliation,
    updateRecord,
    bulkUpdateRecords,
    deleteRecord,
    recalculateMetrics,
    reset,
  };

  return {
    state,
    actions,
  };
};

// Helper function to calculate reconciliation metrics
function calculateMetrics(
  records: EnhancedReconciliationRecord[],
  processingTime?: number
): ReconciliationMetrics {
  const totalRecords = records.length;
  const matchedRecords = records.filter((r) => r.status === 'matched').length;
  const unmatchedRecords = records.filter((r) => r.status === 'unmatched').length;
  const discrepancyRecords = records.filter((r) => r.status === 'discrepancy').length;
  const pendingRecords = records.filter((r) => r.resolution?.status === 'pending').length;
  const resolvedRecords = records.filter(
    (r) => r.resolution?.status === 'approved' || r.resolution?.status === 'rejected'
  ).length;
  const escalatedRecords = records.filter((r) => r.resolution?.status === 'escalated').length;

  const confidences = records.map((r) => r.confidence).filter((c) => c > 0);
  const averageConfidence =
    confidences.length > 0 ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length : 0;

  const matchRate = totalRecords > 0 ? (matchedRecords / totalRecords) * 100 : 0;

  return {
    totalRecords,
    matchedRecords,
    unmatchedRecords,
    discrepancyRecords,
    pendingRecords,
    resolvedRecords,
    escalatedRecords,
    averageConfidence,
    averageProcessingTime: processingTime || 0,
    matchRate,
    accuracy: averageConfidence, // Simplified
    throughput: totalRecords / ((processingTime || 1) / 1000), // records per second
    errorRate: 0, // Would need error tracking
    slaCompliance: 95, // Mock value
  };
}
