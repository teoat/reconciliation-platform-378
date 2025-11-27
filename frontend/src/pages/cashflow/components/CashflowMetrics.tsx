/**
 * Cashflow Metrics Component
 * 
 * Displays key metrics for cashflow evaluation
 */

import React from 'react';
import {
  FileText,
  Database,
  Calculator,
  Shield,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { CashflowMetrics } from '../types';
import { formatCurrency, formatPercentage } from '../utils/formatting';

interface CashflowMetricsProps {
  metrics: CashflowMetrics;
}

export const CashflowMetrics: React.FC<CashflowMetricsProps> = ({ metrics }) => {
  return (
    <>
      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Reported</p>
              <p className="text-2xl font-bold text-secondary-900">
                {formatCurrency(metrics.totalReportedExpenses)}
              </p>
              <p className="text-xs text-secondary-500">Journal entries</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Cashflow</p>
              <p className="text-2xl font-bold text-secondary-900">
                {formatCurrency(metrics.totalCashflowExpenses)}
              </p>
              <p className="text-xs text-secondary-500">Bank statements</p>
            </div>
            <Database className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Discrepancy</p>
              <p
                className={`text-2xl font-bold ${
                  metrics.totalDiscrepancy < 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {formatCurrency(metrics.totalDiscrepancy)}
              </p>
              <p className="text-xs text-secondary-500">
                {formatPercentage(metrics.discrepancyPercentage)}
              </p>
            </div>
            <Calculator className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Data Quality</p>
              <p className="text-2xl font-bold text-purple-600">{metrics.dataQualityScore}%</p>
              <p className="text-xs text-secondary-500">Accuracy score</p>
            </div>
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-green-600">{metrics.balancedCategories}</p>
          <p className="text-xs text-secondary-600">Balanced Categories</p>
        </div>
        <div className="card text-center">
          <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-yellow-600">{metrics.discrepancyCategories}</p>
          <p className="text-xs text-secondary-600">Discrepancy Categories</p>
        </div>
        <div className="card text-center">
          <TrendingDown className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-red-600">{metrics.missingTransactions}</p>
          <p className="text-xs text-secondary-600">Missing Transactions</p>
        </div>
        <div className="card text-center">
          <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-blue-600">{metrics.excessTransactions}</p>
          <p className="text-xs text-secondary-600">Excess Transactions</p>
        </div>
      </div>
    </>
  );
};

