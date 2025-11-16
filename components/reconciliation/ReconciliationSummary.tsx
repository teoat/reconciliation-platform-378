// Reconciliation Summary Component
import React from 'react';
import { BarChart3, TrendingUp, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { ReconciliationMetrics } from '../../types/reconciliation';

interface ReconciliationSummaryProps {
  metrics: ReconciliationMetrics;
  className?: string;
}

export const ReconciliationSummary: React.FC<ReconciliationSummaryProps> = ({
  metrics,
  className = '',
}) => {
  const matchRate = metrics.totalRecords > 0
    ? (metrics.matchedRecords / metrics.totalRecords) * 100
    : 0;

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Reconciliation Summary
        </h3>
        <TrendingUp className="w-5 h-5 text-blue-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="Total Records"
          value={metrics.totalRecords}
          icon={BarChart3}
          color="text-blue-600"
        />
        <SummaryCard
          label="Matched"
          value={metrics.matchedRecords}
          icon={CheckCircle}
          color="text-green-600"
        />
        <SummaryCard
          label="Unmatched"
          value={metrics.unmatchedRecords}
          icon={XCircle}
          color="text-red-600"
        />
        <SummaryCard
          label="Discrepancies"
          value={metrics.discrepancyRecords}
          icon={AlertTriangle}
          color="text-yellow-600"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard label="Match Rate" value={`${matchRate.toFixed(1)}%`} />
        <MetricCard label="Average Confidence" value={`${metrics.averageConfidence.toFixed(1)}%`} />
        <MetricCard label="Accuracy" value={`${metrics.accuracy.toFixed(1)}%`} />
        <MetricCard label="Processing Time" value={`${metrics.averageProcessingTime.toFixed(2)}s`} />
        <MetricCard label="Throughput" value={`${metrics.throughput.toFixed(0)}/min`} />
        <MetricCard label="SLA Compliance" value={`${metrics.slaCompliance.toFixed(1)}%`} />
      </div>
    </div>
  );
};

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon: Icon, color }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
      <div className="text-xl font-semibold text-gray-900">{value}</div>
    </div>
  );
};

