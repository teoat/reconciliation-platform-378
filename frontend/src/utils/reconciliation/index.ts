// Reconciliation utilities - main export file
export * from './filtering';
// Note: sorting and matching utilities are now defined inline

// ============================================================================
// SORTING AND MATCHING UTILITIES
// ============================================================================

import type {
  EnhancedReconciliationRecord,
  SortConfig,
  MatchingRule,
  MatchingCriteria,
  MatchingResult,
} from '../../types/reconciliation/index';

/**
 * Sorts reconciliation records
 */
export const sortRecords = (
  records: EnhancedReconciliationRecord[],
  sortConfig: SortConfig | null
): EnhancedReconciliationRecord[] => {
  if (!sortConfig) return records;

  return [...records].sort((a, b) => {
    const aVal = getFieldValue(a, sortConfig.field);
    const bVal = getFieldValue(b, sortConfig.field);

    // Handle null values
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return sortConfig.direction === 'asc' ? -1 : 1;
    if (bVal == null) return sortConfig.direction === 'asc' ? 1 : -1;

    // Compare values
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Gets field value from record (supports nested paths)
 */
const getFieldValue = (record: EnhancedReconciliationRecord, field: string): unknown => {
  // Check top-level fields
  if (field in record) {
    return (record as unknown as Record<string, unknown>)[field];
  }

  // Check sources
  if (field.startsWith('source.')) {
    const sourceField = field.replace('source.', '');
    return record.sources[0]?.data[sourceField];
  }

  // Check metadata
  if (field.startsWith('metadata.')) {
    const metaField = field.replace('metadata.', '');
    return record.metadata[metaField as keyof typeof record.metadata];
  }

  return null;
};

// ============================================================================
// MATCHING UTILITIES
// ============================================================================

/**
 * Applies matching rules to records
 */
export const applyMatchingRules = (
  record: EnhancedReconciliationRecord,
  rules: MatchingRule[]
): MatchingResult => {
  let totalConfidence = 0;
  let totalWeight = 0;
  const matchedRules: MatchingRule[] = [];

  rules.forEach((rule) => {
    if (!rule.applied) return;

    const result = evaluateRule(record, rule);
    if (result.matched) {
      matchedRules.push(rule);
      totalConfidence += result.confidence * rule.weight;
      totalWeight += rule.weight;
    }
  });

  const finalConfidence = totalWeight > 0 ? totalConfidence / totalWeight : 0;

  return {
    matched: matchedRules.length > 0,
    confidence: finalConfidence,
    reason:
      matchedRules.length > 0
        ? `Matched by ${matchedRules.length} rule(s)`
        : 'No matching rules applied',
    details: {
      matchedRules: matchedRules.map((r) => r.id),
      totalRules: rules.length,
    },
  };
};

/**
 * Evaluates a single matching rule
 */
const evaluateRule = (record: EnhancedReconciliationRecord, rule: MatchingRule): MatchingResult => {
  let totalScore = 0;
  let totalWeight = 0;

  rule.criteria.forEach((criterion) => {
    const value = getFieldValueMatching(record, criterion.field);
    const matches = evaluateCriterion(value, criterion);

    if (matches) {
      totalScore += criterion.weight;
    }
    totalWeight += criterion.weight;
  });

  const confidence = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  const matched = confidence >= 80; // Threshold for match

  return {
    matched,
    confidence,
    reason: matched ? 'Rule criteria met' : 'Rule criteria not met',
    details: {
      score: totalScore,
      totalWeight,
      threshold: 80,
    },
  };
};

/**
 * Evaluates a single criterion
 */
const evaluateCriterion = (value: unknown, criterion: MatchingCriteria): boolean => {
  switch (criterion.operator) {
    case 'equals':
      return value === criterion.value;
    case 'contains':
      return String(value).toLowerCase().includes(String(criterion.value).toLowerCase());
    case 'startsWith':
      return String(value).toLowerCase().startsWith(String(criterion.value).toLowerCase());
    case 'endsWith':
      return String(value).toLowerCase().endsWith(String(criterion.value).toLowerCase());
    case 'regex':
      return new RegExp(String(criterion.value)).test(String(value));
    case 'fuzzy': {
      const tolerance = criterion.tolerance || 0.1;
      return Math.abs(Number(value) - Number(criterion.value)) <= tolerance;
    }
    default:
      return false;
  }
};

/**
 * Gets field value from record
 */
const getFieldValueMatching = (record: EnhancedReconciliationRecord, field: string): unknown => {
  if (field in record) {
    return (record as unknown as Record<string, unknown>)[field];
  }
  if (field.startsWith('source.')) {
    const sourceField = field.replace('source.', '');
    return record.sources[0]?.data[sourceField];
  }
  return null;
};
