import { useState, useCallback } from 'react';
import { MatchingRule, MatchingCriteria } from '../../types/reconciliation';

export interface MatchingRulesState {
  rules: MatchingRule[];
  activeRules: MatchingRule[];
  isLoading: boolean;
  error: string | null;
}

export interface MatchingRulesActions {
  addRule: (rule: Omit<MatchingRule, 'id'>) => void;
  updateRule: (ruleId: string, updates: Partial<MatchingRule>) => void;
  deleteRule: (ruleId: string) => void;
  toggleRule: (ruleId: string) => void;
  duplicateRule: (ruleId: string) => void;
  reorderRules: (ruleIds: string[]) => void;
  importRules: (rules: MatchingRule[]) => void;
  exportRules: () => MatchingRule[];
  validateRules: () => { isValid: boolean; errors: string[] };
  reset: () => void;
}

export const useMatchingRules = () => {
  const [state, setState] = useState<MatchingRulesState>({
    rules: [],
    activeRules: [],
    isLoading: false,
    error: null,
  });

  const addRule = useCallback((ruleData: Omit<MatchingRule, 'id'>) => {
    const newRule: MatchingRule = {
      ...ruleData,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    setState((prev) => ({
      ...prev,
      rules: [...prev.rules, newRule],
      activeRules: newRule.applied ? [...prev.activeRules, newRule] : prev.activeRules,
    }));
  }, []);

  const updateRule = useCallback((ruleId: string, updates: Partial<MatchingRule>) => {
    setState((prev) => {
      const updatedRules = prev.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      );

      const updatedActiveRules = updatedRules.filter((rule) => rule.applied);

      return {
        ...prev,
        rules: updatedRules,
        activeRules: updatedActiveRules,
      };
    });
  }, []);

  const deleteRule = useCallback((ruleId: string) => {
    setState((prev) => ({
      ...prev,
      rules: prev.rules.filter((rule) => rule.id !== ruleId),
      activeRules: prev.activeRules.filter((rule) => rule.id !== ruleId),
    }));
  }, []);

  const toggleRule = useCallback((ruleId: string) => {
    setState((prev) => {
      const updatedRules = prev.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, applied: !rule.applied } : rule
      );

      const updatedActiveRules = updatedRules.filter((rule) => rule.applied);

      return {
        ...prev,
        rules: updatedRules,
        activeRules: updatedActiveRules,
      };
    });
  }, []);

  const duplicateRule = useCallback(
    (ruleId: string) => {
      const ruleToDuplicate = state.rules.find((rule) => rule.id === ruleId);
      if (!ruleToDuplicate) return;

      const duplicatedRule: MatchingRule = {
        ...ruleToDuplicate,
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${ruleToDuplicate.name} (Copy)`,
      };

      setState((prev) => ({
        ...prev,
        rules: [...prev.rules, duplicatedRule],
        activeRules: duplicatedRule.applied
          ? [...prev.activeRules, duplicatedRule]
          : prev.activeRules,
      }));
    },
    [state.rules]
  );

  const reorderRules = useCallback(
    (ruleIds: string[]) => {
      const reorderedRules = ruleIds
        .map((id) => state.rules.find((rule) => rule.id === id))
        .filter(Boolean) as MatchingRule[];

      setState((prev) => ({
        ...prev,
        rules: reorderedRules,
      }));
    },
    [state.rules]
  );

  const importRules = useCallback((importedRules: MatchingRule[]) => {
    // Generate new IDs to avoid conflicts
    const rulesWithNewIds = importedRules.map((rule) => ({
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }));

    setState((prev) => ({
      ...prev,
      rules: [...prev.rules, ...rulesWithNewIds],
      activeRules: [...prev.activeRules, ...rulesWithNewIds.filter((rule) => rule.applied)],
    }));
  }, []);

  const exportRules = useCallback(() => {
    return state.rules;
  }, [state.rules]);

  const validateRules = useCallback(() => {
    const errors: string[] = [];

    state.rules.forEach((rule, index) => {
      if (!rule.name.trim()) {
        errors.push(`Rule ${index + 1}: Name is required`);
      }

      if (!rule.criteria || rule.criteria.length === 0) {
        errors.push(`Rule ${rule.name}: At least one matching criterion is required`);
      }

      rule.criteria.forEach((criterion, criterionIndex) => {
        if (!criterion.field) {
          errors.push(`Rule ${rule.name}, Criterion ${criterionIndex + 1}: Field is required`);
        }
        if (!criterion.operator) {
          errors.push(`Rule ${rule.name}, Criterion ${criterionIndex + 1}: Operator is required`);
        }
      });

      if (rule.weight < 0 || rule.weight > 1) {
        errors.push(`Rule ${rule.name}: Weight must be between 0 and 1`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [state.rules]);

  const reset = useCallback(() => {
    setState({
      rules: [],
      activeRules: [],
      isLoading: false,
      error: null,
    });
  }, []);

  const actions: MatchingRulesActions = {
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    duplicateRule,
    reorderRules,
    importRules,
    exportRules,
    validateRules,
    reset,
  };

  return {
    state,
    actions,
  };
};
