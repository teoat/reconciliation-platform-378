// AI Suggestion Module
import { FieldMapping, AIMappingSuggestion, FilterPreset, FilterConfig } from './types';
import { logger } from '../logger';

export class AISuggestionEngine {
  public async suggestMapping(
    sourceFields: string[],
    targetFields: string[],
    context?: Record<string, unknown>
  ): Promise<AIMappingSuggestion> {
    // Simulate AI-powered mapping suggestion
    await this.delay(500);

    const suggestions: FieldMapping[] = [];
    const confidenceScores: number[] = [];

    for (const sourceField of sourceFields) {
      for (const targetField of targetFields) {
        const confidence = this.calculateSimilarity(sourceField, targetField);
        if (confidence > 0.5) {
          suggestions.push({
            sourceField,
            targetField,
            confidence,
            mappingType: confidence > 0.9 ? 'exact' : confidence > 0.7 ? 'fuzzy' : 'semantic',
          });
          confidenceScores.push(confidence);
        }
      }
    }

    const avgConfidence =
      confidenceScores.length > 0
        ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
        : 0;

    return {
      id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sourceFields,
      targetFields,
      confidence: avgConfidence,
      reasoning: `Matched ${suggestions.length} fields with average confidence of ${avgConfidence.toFixed(2)}`,
      alternatives: suggestions,
      suggestedTransformations: [],
    };
  }

  public async suggestPreset(
    data: Array<Record<string, unknown>>,
    context?: Record<string, unknown>
  ): Promise<FilterPreset> {
    // Simulate AI-powered preset suggestion
    await this.delay(500);

    const filters: FilterConfig[] = [];

    // Analyze data and suggest common filters
    if (data.length > 0) {
      const firstRecord = data[0];
      const keys = Object.keys(firstRecord);

      // Suggest filters based on field types
      for (const key of keys) {
        const value = firstRecord[key];
        if (typeof value === 'string' && key.toLowerCase().includes('status')) {
          filters.push({
            field: key,
            operator: 'in',
            value: this.extractUniqueValues(data, key),
            label: `Filter by ${key}`,
            isRequired: false,
            weight: 0.8,
          });
        } else if (typeof value === 'number' && key.toLowerCase().includes('amount')) {
          filters.push({
            field: key,
            operator: 'greater_than',
            value: 0,
            label: `Filter by ${key}`,
            isRequired: false,
            weight: 0.7,
          });
        }
      }
    }

    return {
      id: `smart-preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'AI Suggested Filter',
      description: 'Automatically generated filter based on data analysis',
      category: 'smart',
      filters,
      usageCount: 0,
      lastUsed: new Date(),
      createdBy: 'ai',
      isPublic: true,
      tags: ['ai', 'auto-generated'],
      confidence: 0.75,
      isSmart: true,
    };
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;

    // Simple Levenshtein-like similarity
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const editDistance = this.levenshteinDistance(s1, s2);
    return 1 - editDistance / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
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
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  private extractUniqueValues(data: Array<Record<string, unknown>>, field: string): unknown[] {
    const values = new Set<unknown>();
    for (const record of data) {
      if (record[field] !== undefined) {
        values.add(record[field]);
      }
    }
    return Array.from(values);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
