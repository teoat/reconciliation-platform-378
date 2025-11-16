// Data Quality Panel Component
import React from 'react';
import { Shield, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import type { DataQualityMetrics } from '../../types/ingestion';

interface DataQualityPanelProps {
  metrics: DataQualityMetrics;
  className?: string;
}

export const DataQualityPanel: React.FC<DataQualityPanelProps> = ({ metrics, className = '' }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Data Quality Metrics
        </h3>
        <Shield className="w-5 h-5 text-blue-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          label="Completeness"
          value={metrics.completeness}
          icon={CheckCircle}
          color={getScoreColor(metrics.completeness)}
          bgColor={getScoreBgColor(metrics.completeness)}
        />
        <MetricCard
          label="Accuracy"
          value={metrics.accuracy}
          icon={CheckCircle}
          color={getScoreColor(metrics.accuracy)}
          bgColor={getScoreBgColor(metrics.accuracy)}
        />
        <MetricCard
          label="Consistency"
          value={metrics.consistency}
          icon={CheckCircle}
          color={getScoreColor(metrics.consistency)}
          bgColor={getScoreBgColor(metrics.consistency)}
        />
        <MetricCard
          label="Validity"
          value={metrics.validity}
          icon={CheckCircle}
          color={getScoreColor(metrics.validity)}
          bgColor={getScoreBgColor(metrics.validity)}
        />
        <MetricCard
          label="Duplicates"
          value={metrics.duplicates}
          icon={AlertTriangle}
          color="text-orange-600"
          bgColor="bg-orange-100"
          isCount
        />
        <MetricCard
          label="Errors"
          value={metrics.errors}
          icon={AlertTriangle}
          color="text-red-600"
          bgColor="bg-red-100"
          isCount
        />
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  isCount?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  isCount = false,
}) => {
  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className={`text-2xl font-bold ${color}`}>
        {isCount ? value : `${value}%`}
      </div>
    </div>
  );
};

