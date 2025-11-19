// Reconciliation matching utilities
import {
  ReconciliationRecord,
  MatchingRule,
  MatchingCriteria,
  MatchingResult,
  EnhancedReconciliationRecord,
} from '../../types/reconciliation';

/**
 * Calculates confidence score based on matching criteria
 */
export const calculateConfidenceScore = (
  criteria: MatchingCriteria[],
  data1: Record<string, unknown>,
  data2: Record<string, unknown>
): number => {
  let totalWeight = 0;
  let weightedScore = 0;

  criteria.forEach((criterion) => {
    totalWeight += criterion.weight;

    const value1 = data1[criterion.field];
    const value2 = data2[criterion.field];
    let matchScore = 0;

    switch (criterion.operator) {
      case 'equals':
        matchScore = value1 === value2 ? 1 : 0;
        break;
      case 'contains':
        matchScore = String(value1).toLowerCase().includes(String(value2).toLowerCase()) ? 1 : 0;
        break;
      case 'startsWith':
        matchScore = String(value1).toLowerCase().startsWith(String(value2).toLowerCase()) ? 1 : 0;
        break;
      case 'endsWith':
        matchScore = String(value1).toLowerCase().endsWith(String(value2).toLowerCase()) ? 1 : 0;
        break;
      case 'regex':
        try {
          const regex = new RegExp(criterion.value, 'i');
          matchScore = regex.test(String(value1)) ? 1 : 0;
        } catch {
          matchScore = 0;
        }
        break;
      case 'fuzzy':
        // Simple fuzzy matching - could be enhanced with a proper library
        matchScore = calculateStringSimilarity(String(value1), String(value2));
        break;
    }

    // Apply tolerance if specified
    if (criterion.tolerance && matchScore < criterion.tolerance) {
      matchScore = 0;
    }

    weightedScore += matchScore * criterion.weight;
  });

  return totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
};

/**
 * Simple string similarity calculation (Levenshtein distance based)
 */
export const calculateStringSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

/**
 * Calculate Levenshtein distance between two strings
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

/**
 * Applies matching rules to find potential matches
 */
export const findMatches = (
  sourceData: Record<string, unknown>[],
  targetData: Record<string, unknown>[],
  rules: MatchingRule[],
  threshold: number = 80
): Array<{
  sourceIndex: number;
  targetIndex: number;
  confidence: number;
  appliedRules: MatchingRule[];
}> => {
  const matches: Array<{
    sourceIndex: number;
    targetIndex: number;
    confidence: number;
    appliedRules: MatchingRule[];
  }> = [];

  sourceData.forEach((sourceItem, sourceIndex) => {
    targetData.forEach((targetItem, targetIndex) => {
      let totalConfidence = 0;
      let appliedRules: MatchingRule[] = [];

      rules.forEach((rule) => {
        if (rule.applied) {
          const confidence = calculateConfidenceScore(rule.criteria, sourceItem, targetItem);
          if (confidence >= threshold) {
            totalConfidence = Math.max(totalConfidence, confidence);
            appliedRules.push(rule);
          }
        }
      });

      if (totalConfidence >= threshold) {
        matches.push({
          sourceIndex,
          targetIndex,
          confidence: totalConfidence,
          appliedRules,
        });
      }
    });
  });

  return matches;
};

/**
 * Groups matches by source record to handle one-to-many relationships
 */
export const groupMatchesBySource = (
  matches: Array<{
    sourceIndex: number;
    targetIndex: number;
    confidence: number;
    appliedRules: MatchingRule[];
  }>
) => {
  const grouped = new Map<
    number,
    Array<{
      targetIndex: number;
      confidence: number;
      appliedRules: MatchingRule[];
    }>
  >();

  matches.forEach((match) => {
    if (!grouped.has(match.sourceIndex)) {
      grouped.set(match.sourceIndex, []);
    }
    grouped.get(match.sourceIndex)!.push({
      targetIndex: match.targetIndex,
      confidence: match.confidence,
      appliedRules: match.appliedRules,
    });
  });

  return grouped;
};

/**
 * Resolves conflicts when multiple matches exist for the same source
 */
export const resolveConflicts = (
  groupedMatches: Map<
    number,
    Array<{
      targetIndex: number;
      confidence: number;
      appliedRules: MatchingRule[];
    }>
  >
): Array<{
  sourceIndex: number;
  targetIndex: number;
  confidence: number;
  appliedRules: MatchingRule[];
}> => {
  const resolved: Array<{
    sourceIndex: number;
    targetIndex: number;
    confidence: number;
    appliedRules: MatchingRule[];
  }> = [];

  groupedMatches.forEach((matches, sourceIndex) => {
    if (matches.length === 1) {
      // Only one match, use it
      resolved.push({
        sourceIndex,
        targetIndex: matches[0].targetIndex,
        confidence: matches[0].confidence,
        appliedRules: matches[0].appliedRules,
      });
    } else if (matches.length > 1) {
      // Multiple matches, pick the one with highest confidence
      const bestMatch = matches.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );

      resolved.push({
        sourceIndex,
        targetIndex: bestMatch.targetIndex,
        confidence: bestMatch.confidence,
        appliedRules: bestMatch.appliedRules,
      });
    }
  });

  return resolved;
};

/**
 * Creates reconciliation records from matched data
 */
export const createReconciliationRecords = (
  sourceData: Record<string, unknown>[],
  targetData: Record<string, unknown>[],
  resolvedMatches: Array<{
    sourceIndex: number;
    targetIndex: number;
    confidence: number;
    appliedRules: MatchingRule[];
  }>
): EnhancedReconciliationRecord[] => {
  const records: EnhancedReconciliationRecord[] = [];

  // Handle matched records
  resolvedMatches.forEach((match, index) => {
    records.push({
      id: `rec_${index}`,
      reconciliationId: `recon_${Date.now()}`,
      batchId: `batch_${Date.now()}`,
      sources: [
        {
          id: `source_${match.sourceIndex}`,
          systemId: 'source_system',
          systemName: 'Source System',
          recordId: String(match.sourceIndex),
          data: sourceData[match.sourceIndex],
          timestamp: new Date().toISOString(),
          quality: {
            completeness: 100,
            accuracy: 100,
            consistency: 100,
            validity: 100,
            duplicates: 0,
            errors: 0,
          },
          confidence: 100,
          metadata: {},
        },
        {
          id: `target_${match.targetIndex}`,
          systemId: 'target_system',
          systemName: 'Target System',
          recordId: String(match.targetIndex),
          data: targetData[match.targetIndex],
          timestamp: new Date().toISOString(),
          quality: {
            completeness: 100,
            accuracy: 100,
            consistency: 100,
            validity: 100,
            duplicates: 0,
            errors: 0,
          },
          confidence: 100,
          metadata: {},
        },
      ],
      status: 'matched',
      confidence: match.confidence,
      matchingRules: match.appliedRules,
      auditTrail: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
        tags: [],
        priority: 'medium',
      },
      relationships: [],
      matchScore: match.confidence,
      riskLevel: match.confidence > 90 ? 'low' : match.confidence > 70 ? 'medium' : 'high',
    });
  });

  // Handle unmatched source records
  const matchedSourceIndices = new Set(resolvedMatches.map((m) => m.sourceIndex));
  sourceData.forEach((sourceItem, index) => {
    if (!matchedSourceIndices.has(index)) {
      records.push({
        id: `rec_unmatched_source_${index}`,
        reconciliationId: `recon_${Date.now()}`,
        batchId: `batch_${Date.now()}`,
        sources: [
          {
            id: `source_${index}`,
            systemId: 'source_system',
            systemName: 'Source System',
            recordId: String(index),
            data: sourceItem,
            timestamp: new Date().toISOString(),
            quality: {
              completeness: 100,
              accuracy: 100,
              consistency: 100,
              validity: 100,
              duplicates: 0,
              errors: 0,
            },
            confidence: 100,
            metadata: {},
          },
        ],
        status: 'unmatched',
        confidence: 0,
        matchingRules: [],
        auditTrail: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          updatedBy: 'system',
          version: 1,
          tags: [],
          priority: 'medium',
        },
        relationships: [],
        matchScore: 0,
        riskLevel: 'high',
      });
    }
  });

  return records;
};
