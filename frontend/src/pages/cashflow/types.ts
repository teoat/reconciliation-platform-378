// Cashflow Types

export interface CashflowData {
  id: string;
  date: Date;
  amount: number;
  type: 'inflow' | 'outflow';
  category?: string;
  description?: string;
}

export interface CashflowAnalysis {
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  period: {
    start: Date;
    end: Date;
  };
}
