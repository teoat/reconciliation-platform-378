// Matching rules hook
import { useState, useCallback } from 'react';
import type { MatchingRule, MatchingCriteria } from '../../types/reconciliation/index';

export const useMatchingRules = () => {
  const [rules, setRules] = useState<MatchingRule[]>([]);

  const addRule = useCallback((rule: MatchingRule) => {
    setRules((prev) => [...prev, rule]);
  }, []);

  const updateRule = useCallback((id: string, updates: Partial<MatchingRule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addCriteria = useCallback((ruleId: string, criteria: MatchingCriteria) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId ? { ...r, criteria: [...r.criteria, criteria] } : r
      )
    );
  }, []);

  const removeCriteria = useCallback((ruleId: string, criteriaIndex: number) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? { ...r, criteria: r.criteria.filter((_, i) => i !== criteriaIndex) }
          : r
      )
    );
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, applied: !r.applied } : r))
    );
  }, []);

  return {
    rules,
    addRule,
    updateRule,
    removeRule,
    addCriteria,
    removeCriteria,
    toggleRule,
  };
};

