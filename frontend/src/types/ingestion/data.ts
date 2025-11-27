// Project Data Types (Cashflow, Adjudication, Visualization)

import { Metadata } from '../../frontend/src/types/metadata';
import { Priority, ImpactLevel, EffortLevel } from '../common';

// Re-export for convenience - these will be defined in the main index for now
// This is a placeholder to avoid circular dependencies
export interface CashflowData {
  categories: any[];
  transactions: any[];
  metrics: any;
  analysis: any;
  discrepancies: any[];
}

export interface AdjudicationData {
  cases: any[];
  workflows: any[];
  decisions: any[];
  metrics: any;
}

export interface VisualizationData {
  charts: any[];
  dashboards: any[];
  reports: any[];
  metrics: any;
}

