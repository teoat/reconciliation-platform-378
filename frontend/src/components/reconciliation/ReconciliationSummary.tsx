import React from 'react';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, Clock, Users } from 'lucide-react';
import Card from '../ui/Card';
import MetricCard from '../ui/MetricCard';
import { ReconciliationMetrics } from '../../types/reconciliation';

interface ReconciliationSummaryProps {
  metrics: ReconciliationMetrics;
  isLoading?: boolean;
  timeRange?: string;
}

export const ReconciliationSummary: React.FC<ReconciliationSummaryProps> = ({
  metrics,
  isLoading = false,
  timeRange = 'Last 30 days',
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const matchRate =
    metrics.totalRecords > 0 ? (metrics.matchedRecords / metrics.totalRecords) * 100 : 0;
  const discrepancyRate =
    metrics.totalRecords > 0 ? (metrics.discrepancyRecords / metrics.totalRecords) * 100 : 0;
  const unresolvedRate =
    metrics.totalRecords > 0 ? ((metrics.pendingRecords || 0) / metrics.totalRecords) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reconciliation Summary</h3>
                <p className="text-sm text-gray-600">{timeRange}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Last updated:</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date().toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Records"
          value={metrics.totalRecords}
          icon={<Users className="w-6 h-6" />}
          change={{
            value: 12,
            type: 'increase',
          }}
        />

        <MetricCard
          title="Matched Records"
          value={metrics.matchedRecords}
          icon={<CheckCircle className="w-6 h-6" />}
          change={{
            value: 8,
            type: 'increase',
          }}
        />

        <MetricCard
          title="Discrepancies"
          value={metrics.discrepancyRecords}
          icon={<AlertCircle className="w-6 h-6" />}
          change={{
            value: -5,
            type: 'decrease',
          }}
        />

        <MetricCard
          title="Pending Review"
          value={metrics.pendingRecords || 0}
          icon={<Clock className="w-6 h-6" />}
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Match Rate</h4>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {matchRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  {metrics.matchedRecords} of {metrics.totalRecords} records
                </div>
              </div>
              <div className="ml-4">
                <div className="w-16 h-16 relative">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeDasharray={`${matchRate}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {matchRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Discrepancy Rate</h4>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {discrepancyRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  {metrics.discrepancyRecords} discrepancies found
                </div>
              </div>
              <div className="ml-4">
                <div className="w-16 h-16 relative">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="2"
                      strokeDasharray={`${discrepancyRate}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {discrepancyRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Average Confidence</h4>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {metrics.averageConfidence.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Overall match confidence</div>
              </div>
              <div className="ml-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Stats */}
      <Card>
        <div className="p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Additional Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{metrics.unmatchedRecords}</div>
              <div className="text-sm text-gray-600">Unmatched</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{metrics.resolvedRecords}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{metrics.escalatedRecords}</div>
              <div className="text-sm text-gray-600">Escalated</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {metrics.processingTime.toFixed(1)}s
              </div>
              <div className="text-sm text-gray-600">Avg Processing Time</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
