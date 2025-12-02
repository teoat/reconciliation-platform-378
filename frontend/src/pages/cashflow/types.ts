/**
 * Cashflow Types
 */

export interface CashflowData {
  id: string;
  date: string;
  amount: number;
  description?: string;
  category?: string;
  type?: 'income' | 'expense';
}

export interface CashflowSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  period: string;
}

export type CashflowRecord = CashflowData;
