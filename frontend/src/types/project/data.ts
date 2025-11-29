// Project Data Types (Cashflow, Adjudication, Visualization)

import { Priority, ImpactLevel } from '../common/index';
import type { ExpenseCategory, ExpenseTransaction, CashflowMetrics } from '@/pages/cashflow/types';
import type { DiscrepancyRecord } from '@/components/data/types';
import type { Chart, DashboardData } from '@/types/analytics';
import type { WorkflowState } from '@/services/atomic-workflow/types';

// Cashflow Analysis interface
export interface CashflowAnalysis {
  summary: {
    totalReported: number;
    totalCashflow: number;
    totalDiscrepancy: number;
    discrepancyPercentage: number;
  };
  trends: {
    period: string;
    reported: number;
    cashflow: number;
    discrepancy: number;
  }[];
  recommendations: string[];
}

// Adjudication Case interface
export interface AdjudicationCase {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: Priority;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

// Adjudication Decision interface
export interface AdjudicationDecision {
  id: string;
  caseId: string;
  decision: string;
  rationale: string;
  decidedBy: string;
  decidedAt: string;
  impact: ImpactLevel;
}

// Adjudication Metrics interface
export interface AdjudicationMetrics {
  totalCases: number;
  openCases: number;
  resolvedCases: number;
  averageResolutionTime: number;
  casesByPriority: Record<Priority, number>;
  casesByStatus: Record<string, number>;
}

// Report interface
export interface Report {
  id: string;
  title: string;
  type: 'summary' | 'detailed' | 'analytical';
  generatedAt: string;
  data: Record<string, unknown>;
  format: 'json' | 'csv' | 'pdf';
}

// Visualization Metrics interface
export interface VisualizationMetrics {
  totalCharts: number;
  totalDashboards: number;
  totalReports: number;
  lastUpdated: string;
}

export interface CashflowData {
  categories: ExpenseCategory[];
  transactions: ExpenseTransaction[];
  metrics: CashflowMetrics;
  analysis: CashflowAnalysis;
  discrepancies: DiscrepancyRecord[];
}

export interface AdjudicationData {
  cases: AdjudicationCase[];
  workflows: WorkflowState[];
  decisions: AdjudicationDecision[];
  metrics: AdjudicationMetrics;
}

export interface VisualizationData {
  charts: Chart[];
  dashboards: DashboardData[];
  reports: Report[];
  metrics: VisualizationMetrics;
}

