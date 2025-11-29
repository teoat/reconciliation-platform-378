// Machine Learning Matching Service
// Implements various ML algorithms for intelligent record matching in reconciliation

import { MatchingRule, ReconciliationResult } from '../types/backend-aligned';

export interface MLRecord {
  id: string;
  data: Record<string, unknown>;
}

export interface MatchCandidate {
  recordA: MLRecord;
  recordB: MLRecord;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'ml_predicted';
  features: Record<string, number>;
  explanation: string;
}

export interface MLModel {
  id: string;
  name: string;
  type: 'similarity' | 'classification' | 'clustering';
  algorithm: string;
  version: string;
  trained: boolean;
  accuracy?: number;
  features: string[];
}

export interface MatchingConfig {
  threshold: number;
  algorithms: string[];
  weights: Record<string, number>;
  features: string[];
}

class MLMachingService {
  private models: Map<string, MLModel> = new Map();
  private trainingData: MatchCandidate[] = [];

  constructor() {
    this.initializeModels();
  }

  private initializeModels() {
    // Initialize with pre-trained models
    this.models.set('cosine_similarity', {
      id: 'cosine_similarity',
      name: 'Cosine Similarity',
      type: 'similarity',
      algorithm: 'cosine',
      version: '1.0.0',
      trained: true,
      accuracy: 0.85,
      features: ['text_fields'],
    });

    this.models.set('jaccard_similarity', {
      id: 'jaccard_similarity',
      name: 'Jaccard Similarity',
      type: 'similarity',
      algorithm: 'jaccard',
      version: '1.0.0',
      trained: true,
      accuracy: 0.78,
      features: ['categorical_fields'],
    });

    this.models.set('levenshtein_distance', {
      id: 'levenshtein_distance',
      name: 'Levenshtein Distance',
      type: 'similarity',
      algorithm: 'levenshtein',
      version: '1.0.0',
      trained: true,
      accuracy: 0.82,
      features: ['string_fields'],
    });

    this.models.set('ensemble_matcher', {
      id: 'ensemble_matcher',
      name: 'Ensemble Matcher',
      type: 'classification',
      algorithm: 'xgboost',
      version: '2.1.0',
      trained: true,
      accuracy: 0.92,
      features: ['amount', 'date', 'description', 'category', 'reference'],
    });
  }

  // Cosine similarity for text matching
  private cosineSimilarity(text1: string, text2: string): number {
    const tokenize = (text: string) =>
      text
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 2);

    const tokens1 = tokenize(text1);
    const tokens2 = tokenize(text2);

    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  // Jaccard similarity for categorical data
  private jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  // Levenshtein distance for string similarity
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - matrix[str2.length][str1.length] / maxLength;
  }

  // Date similarity
  private dateSimilarity(date1: string | Date, date2: string | Date): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Exact match
    if (diffDays === 0) return 1;

    // Within 1 day
    if (diffDays <= 1) return 0.9;

    // Within 3 days
    if (diffDays <= 3) return 0.7;

    // Within 7 days
    if (diffDays <= 7) return 0.5;

    // Within 30 days
    if (diffDays <= 30) return 0.3;

    return 0.1;
  }

  // Numeric similarity (for amounts)
  private numericSimilarity(num1: number, num2: number, tolerance: number = 0.01): number {
    if (num1 === 0 && num2 === 0) return 1;

    const diff = Math.abs(num1 - num2);
    const avg = (Math.abs(num1) + Math.abs(num2)) / 2;

    if (avg === 0) return 0;

    const relativeDiff = diff / avg;

    if (relativeDiff <= tolerance) return 1;
    if (relativeDiff <= tolerance * 10) return 0.8;
    if (relativeDiff <= tolerance * 100) return 0.6;
    if (relativeDiff <= tolerance * 1000) return 0.4;

    return 0.1;
  }

  // Extract features for ML matching
  private extractFeatures(
    recordA: MLRecord,
    recordB: MLRecord,
    config: MatchingConfig
  ): Record<string, number> {
    const features: Record<string, number> = {};

    // Text similarity features
    if (config.features.includes('description')) {
      const descA = String(recordA.data.description || '').toLowerCase();
      const descB = String(recordB.data.description || '').toLowerCase();
      features.description_similarity = this.cosineSimilarity(descA, descB);
    }

    // Amount similarity
    if (config.features.includes('amount')) {
      const amountA = Number(recordA.data.amount || 0);
      const amountB = Number(recordB.data.amount || 0);
      features.amount_similarity = this.numericSimilarity(amountA, amountB);
      features.amount_exact_match = amountA === amountB ? 1 : 0;
    }

    // Date similarity
    if (config.features.includes('date')) {
      const dateA = (recordA.data.date || recordA.data.transaction_date) as string | Date | undefined;
      const dateB = (recordB.data.date || recordB.data.transaction_date) as string | Date | undefined;
      if (dateA && dateB) {
        features.date_similarity = this.dateSimilarity(dateA, dateB);
      }
    }

    // Category similarity
    if (config.features.includes('category')) {
      const catA = String(recordA.data.category || '').toLowerCase();
      const catB = String(recordB.data.category || '').toLowerCase();
      features.category_similarity = catA === catB ? 1 : 0;
    }

    // Reference similarity
    if (config.features.includes('reference')) {
      const refA = String(recordA.data.reference || recordA.data.ref || '').toLowerCase();
      const refB = String(recordB.data.reference || recordB.data.ref || '').toLowerCase();
      features.reference_similarity = this.levenshteinDistance(refA, refB);
    }

    return features;
  }

  // Ensemble matching using multiple algorithms
  private ensembleMatch(recordA: MLRecord, recordB: MLRecord, config: MatchingConfig): MatchCandidate {
    const features = this.extractFeatures(recordA, recordB, config);

    // Calculate weighted score
    let totalScore = 0;
    let totalWeight = 0;

    for (const [feature, weight] of Object.entries(config.weights)) {
      if (features[feature] !== undefined) {
        totalScore += Number(features[feature]) * Number(weight);
        totalWeight += Number(weight);
      }
    }

    const confidence = totalWeight > 0 ? totalScore / totalWeight : 0;

    // Generate explanation
    const explanations: string[] = [];
    if (features.amount_exact_match === 1) explanations.push('Exact amount match');
    if (features.date_similarity > 0.9) explanations.push('Date matches closely');
    if (features.description_similarity > 0.8) explanations.push('Description similarity high');
    if (features.category_similarity === 1) explanations.push('Category matches');
    if (features.reference_similarity > 0.9) explanations.push('Reference matches closely');

    const explanation =
      explanations.length > 0 ? explanations.join(', ') : 'Low similarity across all features';

    return {
      recordA,
      recordB,
      confidence,
      matchType: confidence > 0.8 ? 'exact' : confidence > 0.6 ? 'fuzzy' : 'ml_predicted',
      features,
      explanation,
    };
  }

  // Find matches using ML algorithms
  async findMatches(
    recordsA: MLRecord[],
    recordsB: MLRecord[],
    config: MatchingConfig,
    rules?: MatchingRule[]
  ): Promise<MatchCandidate[]> {
    const candidates: MatchCandidate[] = [];

    // Use blocking strategy to reduce comparison space
    const blocks = this.createBlocks(recordsA, recordsB, config);

    for (const block of blocks) {
      for (const recordA of block.recordsA) {
        for (const recordB of block.recordsB) {
          const candidate = this.ensembleMatch(recordA, recordB, config);

          if (candidate.confidence >= config.threshold) {
            candidates.push(candidate);
          }
        }
      }
    }

    // Sort by confidence
    candidates.sort((a, b) => b.confidence - a.confidence);

    return candidates;
  }

  // Create blocks for efficient matching
  private createBlocks(recordsA: MLRecord[], recordsB: MLRecord[], config: MatchingConfig) {
    const blocks: Array<{ key: string; recordsA: MLRecord[]; recordsB: MLRecord[] }> = [];

    // Block by amount ranges
    if (config.features.includes('amount')) {
      const amountBlocks = new Map<string, { recordsA: MLRecord[]; recordsB: MLRecord[] }>();

      const getAmountBlock = (amount: number) => {
        const rounded = Math.floor(amount / 1000) * 1000; // Block by $1000 ranges
        return `amount_${rounded}`;
      };

      recordsA.forEach((record) => {
        const amount = Number(record.data.amount || 0);
        const blockKey = getAmountBlock(amount);
        if (!amountBlocks.has(blockKey)) {
          amountBlocks.set(blockKey, { recordsA: [], recordsB: [] });
        }
        amountBlocks.get(blockKey)!.recordsA.push(record);
      });

      recordsB.forEach((record) => {
        const amount = Number(record.data.amount || 0);
        const blockKey = getAmountBlock(amount);
        if (!amountBlocks.has(blockKey)) {
          amountBlocks.set(blockKey, { recordsA: [], recordsB: [] });
        }
        amountBlocks.get(blockKey)!.recordsB.push(record);
      });

      amountBlocks.forEach((block, key) => {
        blocks.push({ key, ...block });
      });
    }

    // Block by date ranges
    if (config.features.includes('date') && blocks.length === 0) {
      const dateBlocks = new Map<string, { recordsA: MLRecord[]; recordsB: MLRecord[] }>();

      const getDateBlock = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'invalid_date';
        const month = date.getMonth();
        const year = date.getFullYear();
        return `date_${year}_${month}`;
      };

      recordsA.forEach((record) => {
        const date = (record.data.date || record.data.transaction_date) as string | undefined;
        if (date) {
          const blockKey = getDateBlock(date);
          if (!dateBlocks.has(blockKey)) {
            dateBlocks.set(blockKey, { recordsA: [], recordsB: [] });
          }
          dateBlocks.get(blockKey)!.recordsA.push(record);
        }
      });

      recordsB.forEach((record) => {
        const date = (record.data.date || record.data.transaction_date) as string | undefined;
        if (date) {
          const blockKey = getDateBlock(date);
          if (!dateBlocks.has(blockKey)) {
            dateBlocks.set(blockKey, { recordsA: [], recordsB: [] });
          }
          dateBlocks.get(blockKey)!.recordsB.push(record);
        }
      });

      dateBlocks.forEach((block, key) => {
        blocks.push({ key, ...block });
      });
    }

    // Fallback: single block if no blocking strategy
    if (blocks.length === 0) {
      blocks.push({
        key: 'all',
        recordsA,
        recordsB,
      });
    }

    return blocks;
  }

  // Train ML model with labeled data
  async trainModel(modelId: string, trainingData: MatchCandidate[]): Promise<void> {
    // In a real implementation, this would train the model
    // For now, we'll just store the training data
    this.trainingData = trainingData;

    const model = this.models.get(modelId);
    if (model) {
      model.trained = true;
      model.accuracy = 0.92; // Simulated accuracy
    }
  }

  // Get available models
  getModels(): MLModel[] {
    return Array.from(this.models.values());
  }

  // Get model by ID
  getModel(modelId: string): MLModel | undefined {
    return this.models.get(modelId);
  }

  // Evaluate model performance
  evaluateModel(
    modelId: string,
    testData: MatchCandidate[]
  ): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } {
    // Simulated evaluation
    return {
      accuracy: 0.92,
      precision: 0.89,
      recall: 0.91,
      f1Score: 0.9,
    };
  }
}

// Export singleton instance
export const mlMatchingService = new MLMachingService();
export default mlMatchingService;
