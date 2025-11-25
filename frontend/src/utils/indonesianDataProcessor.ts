// Indonesian Data Processor - Stub implementation
// TODO: Implement full Indonesian data processing functionality

export interface ProcessedBankRecord {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  type: 'debit' | 'credit';
  [key: string]: unknown;
}

export interface ProcessedExpenseRecord {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  category: string;
  [key: string]: unknown;
}

export interface RecordDifference {
  field: string;
  sourceValue: unknown;
  targetValue: unknown;
}

export interface IndonesianMatchingResult {
  matched: boolean;
  confidence: number;
  sourceRecord: ProcessedBankRecord;
  targetRecord: ProcessedBankRecord;
  differences: Array<RecordDifference>;
}

export class IndonesianDataProcessor {
  static processExpenseData(data: unknown[]): ProcessedExpenseRecord[] {
    return data.map((record, index) => {
      const rec = record as Record<string, unknown>;
      return {
        id: (typeof rec.id === 'string' ? rec.id : `expense-${index}`),
        amount: (typeof rec.amount === 'number' ? rec.amount : 0),
        currency: (typeof rec.currency === 'string' ? rec.currency : 'IDR'),
        date: (typeof rec.date === 'string' ? rec.date : new Date().toISOString()),
        description: (typeof rec.description === 'string' ? rec.description : ''),
        category: (typeof rec.category === 'string' ? rec.category : 'uncategorized'),
        ...Object.fromEntries(
          Object.entries(rec).filter(([key]) => 
            !['id', 'amount', 'currency', 'date', 'description', 'category'].includes(key)
          )
        )
      };
    });
  }

  static processBankData(data: unknown[]): ProcessedBankRecord[] {
    return data.map((record, index) => {
      const rec = record as Record<string, unknown>;
      return {
        id: (typeof rec.id === 'string' ? rec.id : `bank-${index}`),
        amount: (typeof rec.amount === 'number' ? rec.amount : 0),
        currency: (typeof rec.currency === 'string' ? rec.currency : 'IDR'),
        date: (typeof rec.date === 'string' ? rec.date : new Date().toISOString()),
        description: (typeof rec.description === 'string' ? rec.description : ''),
        type: (rec.type === 'credit' || rec.type === 'debit' ? rec.type : 'debit'),
        ...Object.fromEntries(
          Object.entries(rec).filter(([key]) => 
            !['id', 'amount', 'currency', 'date', 'description', 'type'].includes(key)
          )
        )
      };
    });
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
    function isValidRecord(record: unknown): record is ProcessedBankRecord | ProcessedExpenseRecord {
      if (typeof record !== 'object' || record === null) return false;
      const rec = record as Record<string, unknown>;
      return (
        typeof rec.amount === 'number' &&
        typeof rec.date === 'string' &&
        typeof rec.description === 'string'
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
      const differences: Array<RecordDifference> = [];
      if (target) {
        const sourceRec = source as Record<string, unknown>;
        const targetRec = target as Record<string, unknown>;
        ['amount', 'date', 'description'].forEach((field) => {
          if (sourceRec[field] !== targetRec[field]) {
            differences.push({
              field,
              sourceValue: sourceRec[field],
              targetValue: targetRec[field]
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

  interface ReconciliationSummary {
    totalExpenses: number;
    totalBankRecords: number;
    matched: number;
    unmatched: number;
    matchRate: number;
    totalExpenseAmount: number;
    totalBankAmount: number;
    variance: number;
  }

  static generateReconciliationSummary(
    expenses: ProcessedExpenseRecord[],
    bankRecords: ProcessedBankRecord[],
    matches: IndonesianMatchingResult[]
  ): ReconciliationSummary {
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

export const processIndonesianBankData = (data: unknown[]): ProcessedBankRecord[] => {
  return IndonesianDataProcessor.processBankData(data);
};

export const matchIndonesianRecords = (
  sourceRecords: ProcessedBankRecord[],
  targetRecords: ProcessedBankRecord[]
): IndonesianMatchingResult[] => {
  return IndonesianDataProcessor.matchRecords(sourceRecords, targetRecords);
};

