// Reconciliation engine hook
import { useState, useCallback, useMemo } from 'react';
import type {
  EnhancedReconciliationRecord,
  MatchingRule,
  ReconciliationMetrics,
} from '../../types/reconciliation';
import { applyMatchingRules } from '../../utils/reconciliation/matching';

export const useReconciliationEngine = (initialRecords: EnhancedReconciliationRecord[] = []) => {
  const [records, setRecords] = useState<EnhancedReconciliationRecord[]>(initialRecords);
  const [rules, setRules] = useState<MatchingRule[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate metrics from current records
  const metrics = useMemo<ReconciliationMetrics>(() => {
    const totalRecords = records.length;
    const matchedRecords = records.filter((r) => r.status === 'matched').length;
    const unmatchedRecords = records.filter((r) => r.status === 'unmatched').length;
    const discrepancyRecords = records.filter((r) => r.status === 'discrepancy').length;
    const pendingRecords = records.filter((r) => r.status === 'pending').length;
    const resolvedRecords = records.filter((r) => r.status === 'resolved').length;
    const escalatedRecords = records.filter((r) => r.status === 'escalated').length;

    const totalConfidence = records.reduce((sum, r) => sum + r.confidence, 0);
    const averageConfidence = totalRecords > 0 ? totalConfidence / totalRecords : 0;

    const matchRate = totalRecords > 0 ? (matchedRecords / totalRecords) * 100 : 0;
    const accuracy = totalRecords > 0 ? (resolvedRecords / totalRecords) * 100 : 0;

    return {
      totalRecords,
      matchedRecords,
      unmatchedRecords,
      discrepancyRecords,
      pendingRecords,
      resolvedRecords,
      escalatedRecords,
      averageConfidence,
      averageProcessingTime: 0, // Could be calculated if we track processing times
      matchRate,
      accuracy,
      throughput: 0, // Could be calculated if we track throughput
      errorRate: 0, // Could be calculated if we track errors
      slaCompliance: 0, // Could be calculated if we track SLA
    };
  }, [records]);

  // Process records with matching rules
  const processRecords = useCallback(async (): Promise<EnhancedReconciliationRecord[]> => {
    setIsProcessing(true);
    try {
      const processed = records.map((record) => {
        // Apply matching rules if any exist
        if (rules.length > 0) {
          const result = applyMatchingRules(record, rules);
          
          // Update record based on matching result
          const updatedRecord: EnhancedReconciliationRecord = {
            ...record,
            confidence: result.confidence,
            matchScore: result.confidence,
            matchingRules: rules.filter((r) => r.applied && result.details.matchedRules?.includes(r.id)),
          };

          // Update status based on confidence
          if (result.matched && result.confidence >= 80) {
            updatedRecord.status = 'matched';
          } else if (result.matched && result.confidence >= 50) {
            updatedRecord.status = 'discrepancy';
          } else {
            updatedRecord.status = 'unmatched';
          }

          return updatedRecord;
        }
        return record;
      });

      setRecords(processed);
      return processed;
    } catch (error) {
      console.error('Error processing records:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [records, rules]);

  // Update rules
  const updateRules = useCallback((newRules: MatchingRule[]) => {
    setRules(newRules);
  }, []);

  // Add a rule
  const addRule = useCallback((rule: MatchingRule) => {
    setRules((prev) => [...prev, rule]);
  }, []);

  // Update a rule
  const updateRule = useCallback((ruleId: string, updates: Partial<MatchingRule>) => {
    setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)));
  }, []);

  // Remove a rule
  const removeRule = useCallback((ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  }, []);

  // Update records
  const updateRecords = useCallback((newRecords: EnhancedReconciliationRecord[]) => {
    setRecords(newRecords);
  }, []);

  return {
    rules,
    records,
    metrics,
    isProcessing,
    processRecords,
    updateRules,
    addRule,
    updateRule,
    removeRule,
    updateRecords,
  };
};

