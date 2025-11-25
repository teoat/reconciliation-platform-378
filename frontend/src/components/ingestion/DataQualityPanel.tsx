import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { DataQualityMetrics } from '../../types/ingestion/index';

interface DataQualityPanelProps {
  metrics?: DataQualityMetrics;
  isLoading?: boolean;
}

export const DataQualityPanel: React.FC<DataQualityPanelProps> = ({
  metrics,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Quality</h3>
        <p className="text-gray-500">No quality metrics available</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 70) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Quality</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            {getScoreIcon(metrics.completeness)}
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(metrics.completeness)}`}>
            {metrics.completeness.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Completeness</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            {getScoreIcon(metrics.accuracy)}
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(metrics.accuracy)}`}>
            {metrics.accuracy.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Accuracy</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            {getScoreIcon(metrics.consistency)}
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(metrics.consistency)}`}>
            {metrics.consistency.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Consistency</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            {getScoreIcon(metrics.validity)}
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(metrics.validity)}`}>
            {metrics.validity.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Validity</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{metrics.duplicates}</div>
          <div className="text-sm text-gray-600">Duplicates</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{metrics.errors}</div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
      </div>
    </div>
  );
};
