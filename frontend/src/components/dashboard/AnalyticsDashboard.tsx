/**
 * Analytics Dashboard Component
 *
 * Comprehensive analytics dashboard displaying metrics, charts, and project statistics.
 * Features real-time updates via WebSocket and lazy-loaded chart components.
 *
 * @component
 * @example
 * ```tsx
 * <AnalyticsDashboard />
 * ```
 *
 * @returns {JSX.Element} The analytics dashboard component
 */
'use client';

import React, { useState, useMemo, memo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useWebSocketIntegration } from '@/hooks/useWebSocketIntegration';
import { EnhancedContextualHelp } from '@/components/ui/EnhancedContextualHelp';
import { useDashboardData } from './hooks/useDashboardData';
import { calculateDerivedMetrics } from './utils/metrics';
import { MetricTabs } from './components/MetricTabs';
import { OverviewMetrics } from './components/OverviewMetrics';
import { ReconciliationMetrics } from './components/ReconciliationMetrics';
import type { AnalyticsDashboardProps } from './types';

// Main Analytics Dashboard Component
export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  projectId,
  refreshInterval = 30000,
  showRealTimeUpdates = true,
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<
    'overview' | 'projects' | 'users' | 'reconciliation'
  >('overview');

  // WebSocket integration for real-time updates
  const { isConnected } = useWebSocketIntegration();

  // Load dashboard data using custom hook
  const {
    dashboardMetrics,
    reconciliationStats,
    trendData,
    loading,
    error,
    loadDashboardData,
  } = useDashboardData({
    projectId,
    refreshInterval,
    selectedTimeRange,
  });

  // Calculate derived metrics
  const derivedMetrics = useMemo(
    () => calculateDerivedMetrics(dashboardMetrics, reconciliationStats),
    [dashboardMetrics, reconciliationStats]
  );

  if (loading && !dashboardMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
          <div className="text-sm text-red-700">{error}</div>
          <button
            onClick={loadDashboardData}
            className="ml-auto text-red-400 hover:text-red-600"
            title="Retry loading dashboard"
            aria-label="Retry loading dashboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            <p className="text-gray-600">Real-time insights and performance metrics</p>
          </div>
          <EnhancedContextualHelp feature="analytics" trigger="click" position="bottom" />
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            title="Select time range"
            aria-label="Select time range for metrics"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {showRealTimeUpdates && (
        <div
          className={`flex items-center space-x-2 text-sm ${
            isConnected ? 'text-green-600' : 'text-red-600'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>
            {isConnected ? 'Real-time updates enabled' : 'Real-time updates disconnected'}
          </span>
        </div>
      )}

      {/* Metric Tabs */}
      <MetricTabs selectedMetric={selectedMetric} onMetricChange={setSelectedMetric} />

      {/* Overview Metrics */}
      {selectedMetric === 'overview' && dashboardMetrics && (
        <OverviewMetrics metrics={dashboardMetrics} />
      )}

      {/* Reconciliation Metrics */}
      {selectedMetric === 'reconciliation' &&
        reconciliationStats &&
        derivedMetrics && (
          <ReconciliationMetrics stats={reconciliationStats} derivedMetrics={derivedMetrics} />
        )}

      {/* Job Status Overview */}
      {selectedMetric === 'reconciliation' && reconciliationStats && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Job Status Overview</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {reconciliationStats.active_jobs}
                </div>
                <div className="text-sm text-gray-600">Active Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {reconciliationStats.completed_jobs}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {reconciliationStats.failed_jobs}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {reconciliationStats.queued_jobs}
                </div>
                <div className="text-sm text-gray-600">Queued</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Performance Trends</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {trendData.map((data) => (
                <div
                  key={data.date}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium text-gray-900">{data.date}</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Jobs:</span>
                      <span className="text-sm font-medium text-gray-900">{data.total_jobs}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-sm font-medium text-green-600">
                        {data.completed_jobs}
                      </div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-red-600">{data.failed_jobs}</div>
                      <div className="text-xs text-gray-500">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-blue-600">
                        {data.records_processed}
                      </div>
                      <div className="text-xs text-gray-500">Records</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-purple-600">
                        {data.average_confidence}%
                      </div>
                      <div className="text-xs text-gray-500">Confidence</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Health */}
      {dashboardMetrics && derivedMetrics && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">System Health</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${
                    derivedMetrics.system_health === 'excellent'
                      ? 'text-green-600'
                      : derivedMetrics.system_health === 'good'
                        ? 'text-blue-600'
                        : derivedMetrics.system_health === 'fair'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                  }`}
                >
                  {dashboardMetrics.system_uptime.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600">System Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {dashboardMetrics.total_records_processed.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Records Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {dashboardMetrics.average_processing_time.toFixed(0)}ms
                </div>
                <div className="text-sm text-gray-600">Avg Processing Time</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      {dashboardMetrics && (
        <div className="text-center text-sm text-gray-500">
          Last updated: {new Date(dashboardMetrics.last_updated).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default memo(AnalyticsDashboard);
