/**
 * Cashflow Data Hook
 *
 * Handles data fetching, initialization, and sample data generation
 */

import { useState, useEffect } from 'react';
import { Activity, Building, User } from 'lucide-react';
import type { ExpenseCategory, CashflowMetrics } from '@/pages/cashflow/types';
import type { Project } from '@/types/backend-aligned';
import type { CashflowData } from '@/components/data/types';

interface UseCashflowDataProps {
  currentProject: Project | null | undefined;
  getCashflowData: () => CashflowData | null;
  onProgressUpdate?: (step: string) => void;
}

export interface CashflowDataWithCategories {
  categories: ExpenseCategory[];
  metrics: CashflowMetrics;
}

export const useCashflowData = ({
  currentProject,
  getCashflowData,
  onProgressUpdate,
}: UseCashflowDataProps) => {
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [metrics, setMetrics] = useState<CashflowMetrics | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const initializeSampleData = () => {
    const sampleCategories: ExpenseCategory[] = [
      {
        id: 'operational',
        name: 'Operational Expenses',
        description: 'Day-to-day operational costs and field expenses',
        color: 'blue',
        icon: <Activity className="w-6 h-6" />,
        totalReported: 15750000,
        totalCashflow: 15200000,
        discrepancy: -550000,
        discrepancyPercentage: -3.49,
        transactionCount: 45,
        lastUpdated: '2020-12-31T23:59:59Z',
        status: 'discrepancy',
        subcategories: [
          {
            id: 'kas-lapangan',
            name: 'Kas & Lapangan',
            reportedAmount: 8500000,
            cashflowAmount: 8200000,
            discrepancy: -300000,
            transactions: [
              {
                id: 'op-001',
                date: '2020-01-15',
                description: 'BIAYA FALDY OPERASIONAL URUSAN DI AMBON',
                reportedAmount: 2000000,
                cashflowAmount: 2000000,
                discrepancy: 0,
                source: 'both',
                status: 'matched',
                reference: '134',
                category: 'Operational',
                subcategory: 'Kas & Lapangan',
              },
            ],
          },
        ],
      },
      {
        id: 'perusahaan',
        name: 'Company Expenses',
        description: 'Business-related expenses including tenders and projects',
        color: 'green',
        icon: <Building className="w-6 h-6" />,
        totalReported: 28500000,
        totalCashflow: 28000000,
        discrepancy: -500000,
        discrepancyPercentage: -1.75,
        transactionCount: 23,
        lastUpdated: '2020-12-31T23:59:59Z',
        status: 'discrepancy',
        subcategories: [],
      },
      {
        id: 'personal',
        name: 'Personal Expenses',
        description: 'Personal and family-related expenses',
        color: 'purple',
        icon: <User className="w-6 h-6" />,
        totalReported: 30000000,
        totalCashflow: 30000000,
        discrepancy: 0,
        discrepancyPercentage: 0,
        transactionCount: 2,
        lastUpdated: '2020-12-31T23:59:59Z',
        status: 'balanced',
        subcategories: [],
      },
    ];

    setExpenseCategories(sampleCategories);

    // Calculate metrics
    const calculatedMetrics: CashflowMetrics = {
      totalReportedExpenses: sampleCategories.reduce((sum, cat) => sum + cat.totalReported, 0),
      totalCashflowExpenses: sampleCategories.reduce((sum, cat) => sum + cat.totalCashflow, 0),
      totalDiscrepancy: sampleCategories.reduce((sum, cat) => sum + cat.discrepancy, 0),
      discrepancyPercentage: 0,
      balancedCategories: sampleCategories.filter((cat) => cat.status === 'balanced').length,
      discrepancyCategories: sampleCategories.filter((cat) => cat.status === 'discrepancy').length,
      missingTransactions: 0,
      excessTransactions: 0,
      averageDiscrepancy: 0,
      largestDiscrepancy: Math.max(...sampleCategories.map((cat) => Math.abs(cat.discrepancy))),
      lastReconciliationDate: '2020-12-31T23:59:59Z',
      dataQualityScore: 95.5,
    };

    calculatedMetrics.discrepancyPercentage =
      (calculatedMetrics.totalDiscrepancy / calculatedMetrics.totalReportedExpenses) * 100;
    calculatedMetrics.averageDiscrepancy =
      calculatedMetrics.totalDiscrepancy / sampleCategories.length;

    setMetrics(calculatedMetrics);
  };

  useEffect(() => {
    const cashflowData = getCashflowData();

    // Check if cashflowData has the expected structure
    if (
      cashflowData &&
      'categories' in cashflowData &&
      Array.isArray((cashflowData as Record<string, unknown>).categories)
    ) {
      const data = cashflowData as unknown as CashflowDataWithCategories;
      if (data.categories.length > 0) {
        setExpenseCategories(data.categories);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } else {
      initializeSampleData();
    }

    onProgressUpdate?.('cashflow_evaluation_started');
  }, [currentProject, getCashflowData, onProgressUpdate]);

  const runDiscrepancyAnalysis = async (
    transformReconciliationToCashflow: (id: string) => CashflowDataWithCategories | null
  ) => {
    setIsProcessing(true);
    setProcessingProgress(0);

    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        const newProgress = Math.min(prev + Math.random() * 15, 100);
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsProcessing(false);

          if (currentProject) {
            const cashflowData = transformReconciliationToCashflow(currentProject.id);
            if (cashflowData) {
              setExpenseCategories(cashflowData.categories);
              setMetrics(cashflowData.metrics);
            }
          }

          onProgressUpdate?.('discrepancy_analysis_completed');
        }
        return newProgress;
      });
    }, 300);
  };

  return {
    expenseCategories,
    setExpenseCategories,
    metrics,
    setMetrics,
    isProcessing,
    processingProgress,
    runDiscrepancyAnalysis,
  };
};
