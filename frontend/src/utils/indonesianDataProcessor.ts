// Indonesian Data Processor - Stub implementation
// TODO: Implement full Indonesian data processing functionality

export interface ProcessedBankRecord {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  type: 'debit' | 'credit';
  [key: string]: any;
}

export interface ProcessedExpenseRecord {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  category: string;
  [key: string]: any;
}

export interface IndonesianMatchingResult {
  matched: boolean;
  confidence: number;
  sourceRecord: ProcessedBankRecord;
  targetRecord: ProcessedBankRecord;
  differences: Array<{
    field: string;
    sourceValue: any;
    targetValue: any;
  }>;
}

export class IndonesianDataProcessor {
  static processExpenseData(data: any[]): ProcessedExpenseRecord[] {
    return data.map((record, index) => ({
      id: record.id || `expense-${index}`,
      amount: record.amount || 0,
      currency: record.currency || 'IDR',
      date: record.date || new Date().toISOString(),
      description: record.description || '',
      category: record.category || 'uncategorized',
      ...record
    }));
  }

  static processBankData(data: any[]): ProcessedBankRecord[] {
    return data.map((record, index) => ({
      id: record.id || `bank-${index}`,
      amount: record.amount || 0,
      currency: record.currency || 'IDR',
      date: record.date || new Date().toISOString(),
      description: record.description || '',
      type: record.type || 'debit',
      ...record
    }));
  }

  /**
   * Match records between source and target datasets
   * 
   * Uses a multi-stage matching strategy:
   * 1. Exact ID match (highest confidence)
   * 2. Amount + date match (high confidence)
   * 3. Description match (medium confidence)
   * 
   * @param sourceRecords Source records to match
   * @param targetRecords Target records to match against
   * @returns Array of matching results with confidence scores
   */
  static matchRecords(
    sourceRecords: ProcessedBankRecord[] | ProcessedExpenseRecord[],
    targetRecords: ProcessedBankRecord[] | ProcessedExpenseRecord[]
  ): IndonesianMatchingResult[] {
    // Validate required fields and handle malformed data.
    function isValidRecord(record: any): boolean {
      return (
        typeof record.amount === 'number' &&
        typeof record.date === 'string' &&
        typeof record.description === 'string'
      );
    }
    return sourceRecords.map((source) => {
      // Validate source record
      if (!isValidRecord(source)) {
        // Malformed source record
        return {
          matched: false,
          confidence: 0,
          sourceRecord: source as ProcessedBankRecord,
          targetRecord: {} as ProcessedBankRecord,
          differences: [
            { field: 'validation', sourceValue: source, targetValue: null }
          ]
        };
      }
      // Try to find a matching target record by ID
      let target = targetRecords.find((t) => t.id === source.id && isValidRecord(t));
      // If not found, try to match by amount and date (simple fuzzy match)
      if (!target) {
        target = targetRecords.find(
          (t) =>
            isValidRecord(t) &&
            t.amount === source.amount &&
            t.date === source.date
        );
      }
      // If still not found, try to match by description (very fuzzy)
      if (!target) {
        target = targetRecords.find(
          (t) =>
            isValidRecord(t) &&
            t.description &&
            source.description &&
            t.description.trim().toLowerCase() === source.description.trim().toLowerCase()
        );
      }
      // Collect differences if matched
      let differences: Array<{ field: string; sourceValue: any; targetValue: any }> = [];
      if (target) {
        ['amount', 'date', 'description'].forEach((field) => {
          if (source[field] !== target[field]) {
            differences.push({
              field,
              sourceValue: source[field],
              targetValue: target[field]
            });
          }
        });
      }
      return {
        matched: !!target,
        confidence: target ? 0.95 : 0,
        sourceRecord: source as ProcessedBankRecord,
        targetRecord: (target as ProcessedBankRecord) || ({} as ProcessedBankRecord),
        differences
      };
    });
  }

  static generateReconciliationSummary(
    expenses: ProcessedExpenseRecord[],
    bankRecords: ProcessedBankRecord[],
    matches: IndonesianMatchingResult[]
  ): any {
    const matched = matches.filter(m => m.matched).length;
    const unmatched = matches.length - matched;
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalBank = bankRecords.reduce((sum, bank) => sum + bank.amount, 0);
    
    return {
      totalExpenses: expenses.length,
      totalBankRecords: bankRecords.length,
      matched,
      unmatched,
      matchRate: matches.length > 0 ? (matched / matches.length) * 100 : 0,
      totalExpenseAmount: totalExpenses,
      totalBankAmount: totalBank,
      variance: totalExpenses - totalBank
    };
  }
}

export const processIndonesianBankData = (data: any[]): ProcessedBankRecord[] => {
  return IndonesianDataProcessor.processBankData(data);
};

export const matchIndonesianRecords = (
  sourceRecords: ProcessedBankRecord[],
  targetRecords: ProcessedBankRecord[]
): IndonesianMatchingResult[] => {
  return IndonesianDataProcessor.matchRecords(sourceRecords, targetRecords);
};

