import React from 'react';

// Shared test utilities for Cashflow components

export interface MockExpenseCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: React.ReactElement;
  status: string;
  totalReported: number;
  totalCashflow: number;
  discrepancy: number;
  discrepancyPercentage: number;
  transactionCount: number;
  lastUpdated: string;
  subcategories: any[];
}

export const createMockExpenseCategory = (
  overrides: Partial<MockExpenseCategory> = {}
): MockExpenseCategory => ({
  id: '1',
  name: 'Office Supplies',
  description: 'Office supplies and stationery',
  color: '#3B82F6',
  icon: React.createElement('div', null, '📄'),
  status: 'balanced',
  totalReported: 15000,
  totalCashflow: 14500,
  discrepancy: -500,
  discrepancyPercentage: -3.33,
  transactionCount: 25,
  lastUpdated: '2024-01-15T10:30:00Z',
  subcategories: [],
  ...overrides,
});

export const createMockCashflowData = () => ({
  categories: [createMockExpenseCategory()],
  summary: {
    totalReported: 15000,
    totalCashflow: 14500,
    totalDiscrepancy: -500,
  },
});
