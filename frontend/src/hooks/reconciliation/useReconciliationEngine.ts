import { useState, useCallback, useEffect } from 'react';
import {
  EnhancedReconciliationRecord,
  MatchingRule,
  ReconciliationMetrics,
} from '@/types/reconciliation';
import { findMatches, createReconciliationRecords } from '@/utils/reconciliation/matching';

type MatchResult = ReturnType<typeof findMatches>[number];

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
      processingTime: 0,
      matchRate: 0,
      lastUpdated: new Date().toISOString(),


    },
    isProcessing: false,
    isMatching: false,
    progress: 0,
    currentStep: 'idle',
    error: null,
  });

  // Helper functions to reduce complexity
  const updateProgress = useCallback(
    (progress: number, step: ReconciliationEngineState['currentStep']) => {
      setState((prev) => ({ ...prev, progress, currentStep: step }));
    },
    []
  );

  const findMatchesStep = useCallback(
    (
      sourceData: Record<string, unknown>[],
      targetData: Record<string, unknown>[],
      rules: MatchingRule[],
      threshold: number
    ) => {
      updateProgress(25, 'matching');
      return findMatches(sourceData, targetData, rules, threshold);
    },
    [updateProgress]
  );

  const createRecordsStep = useCallback(
    (
      sourceData: Record<string, unknown>[],
      targetData: Record<string, unknown>[],
      matches: MatchResult[]
    ) => {
      updateProgress(50, 'scoring');
      return createReconciliationRecords(sourceData, targetData, matches);
    },
    [updateProgress]
  );

  const calculateMetricsStep = useCallback(
    (records: EnhancedReconciliationRecord[], duration: number) => {
      updateProgress(75, 'complete');
      return calculateMetrics(records, duration);
    },
    [updateProgress]
  );

  const completeReconciliation = useCallback(
    (records: EnhancedReconciliationRecord[], metrics: ReconciliationMetrics) => {
      setState((prev) => ({
        ...prev,
        records,
        metrics,
        isProcessing: false,
        isMatching: false,
        progress: 100,
        currentStep: 'complete',
      }));
    },
    []
  );

  const handleReconciliationError = useCallback((error: unknown) => {
    setState((prev) => ({
      ...prev,
      isProcessing: false,
      isMatching: false,
      error: error instanceof Error ? error.message : 'Reconciliation failed',
    }));
  }, []);

  const startReconciliation = useCallback(
    async (
      sourceData: Record<string, unknown>[],
      targetData: Record<string, unknown>[],
      rules: MatchingRule[],
      threshold: number = 80
    ) => {
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

        const matches = findMatchesStep(sourceData, targetData, rules, threshold);
        const records = createRecordsStep(sourceData, targetData, matches);
        const metrics = calculateMetricsStep(records, Date.now() - startTime);

        completeReconciliation(records, metrics);
      } catch (error) {
        handleReconciliationError(error);
      }
    },
    [
      findMatchesStep,
      createRecordsStep,
      calculateMetricsStep,
      completeReconciliation,
      handleReconciliationError,
    ]
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
      processingTime: 0,
      matchRate: 0,
      lastUpdated: new Date().toISOString(),
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
  const pendingRecords = records.filter((r) => (r.resolution as any)?.status === 'pending').length;
  const resolvedRecords = records.filter(
    (r) => (r.resolution as any)?.status === 'approved' || (r.resolution as any)?.status === 'rejected'
  ).length;
  const escalatedRecords = records.filter((r) => (r.resolution as any)?.status === 'escalated').length;

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
    processingTime: processingTime || 0,
    matchRate,
    lastUpdated: new Date().toISOString(),

  };
}
