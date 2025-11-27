/**
 * Cashflow Evaluation Types
 * 
 * Type definitions for cashflow evaluation page
 */

import React from 'react';

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  totalReported: number;
  totalCashflow: number;
  discrepancy: number;
  discrepancyPercentage: number;
  transactionCount: number;
  lastUpdated: string;
  status: 'balanced' | 'discrepancy' | 'missing' | 'excess';
  subcategories: ExpenseSubcategory[];
}

export interface ExpenseSubcategory {
  id: string;
  name: string;
  reportedAmount: number;
  cashflowAmount: number;
  discrepancy: number;
  transactions: ExpenseTransaction[];
}

export interface ExpenseTransaction {
  id: string;
  date: string;
  description: string;
  reportedAmount: number;
  cashflowAmount: number;
  discrepancy: number;
  source: 'journal' | 'bank_statement' | 'both';
  status: 'matched' | 'discrepancy' | 'missing' | 'excess';
  reference: string;
  category: string;
  subcategory: string;
}

export interface CashflowMetrics {
  totalReportedExpenses: number;
  totalCashflowExpenses: number;
  totalDiscrepancy: number;
  discrepancyPercentage: number;
  balancedCategories: number;
  discrepancyCategories: number;
  missingTransactions: number;
  excessTransactions: number;
  averageDiscrepancy: number;
  largestDiscrepancy: number;
  lastReconciliationDate: string;
  dataQualityScore: number;
}

export interface FilterConfig {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn';
  value: any;
  value2?: any;
  active: boolean;
}

export interface CashflowEvaluationPageProps {
  project: any;
  onProgressUpdate?: (step: string) => void;
}

export type ViewMode = 'cards' | 'table' | 'chart';

export interface DateRange {
  start: string;
  end: string;
}

