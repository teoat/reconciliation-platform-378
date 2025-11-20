'use client';
import { logger } from '@/services/logger';

import React, { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import { TrendingUp } from 'lucide-react';
import { TrendingDown } from 'lucide-react';
import { Activity } from 'lucide-react';
import { Target } from 'lucide-react';
import { Shield } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import { Users } from 'lucide-react';
import { Zap } from 'lucide-react';
import { Folder } from 'lucide-react';
import { GitCompare } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { useWebSocketIntegration } from '../hooks/useWebSocketIntegration';
import { MetricCard, MetricTabs } from './analytics';
import { PageMeta } from './seo/PageMeta';

// Lazy load chart components for better performance
const LineChart = lazy(() => import('./charts').then((module) => ({ default: module.LineChart })));
const BarChart = lazy(() => import('./charts').then((module) => ({ default: module.BarChart })));
const PieChart = lazy(() => import('./charts').then((module) => ({ default: module.PieChart })));

// Types
interface DashboardMetrics {
  total_projects: number;
  total_users: number;
  total_files: number;
  total_reconciliation_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  total_records_processed: number;
  total_matches_found: number;
  average_confidence_score: number;
  average_processing_time: number;
  system_uptime: number;
  last_updated: string;
}

interface ProjectStats {
  project_id: string;
  project_name: string;
  total_files: number;
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  total_records: number;
  matched_records: number;
  unmatched_records: number;
  average_confidence: number;
  last_activity: string;
  created_at: string;
}

interface UserActivityStats {
  user_id: string;
  user_name: string;
  total_logins: number;
  last_login: string;
  total_files_uploaded: number;
  total_jobs_created: number;
  total_jobs_completed: number;
  average_session_duration: number;
  activity_score: number;
}

interface ReconciliationStats {
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  queued_jobs: number;
  total_records_processed: number;
  total_matches_found: number;
  total_unmatched_records: number;
  average_confidence_score: number;
  average_processing_time: number;
  success_rate: number;
  throughput_per_hour: number;
}

interface TrendData {
  date: string;
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  records_processed: number;
  matches_found: number;
  average_confidence: number;
}

interface AnalyticsDashboardProps {
  projectId?: string;
  refreshInterval?: number;
  showRealTimeUpdates?: boolean;
}

// Main Analytics Dashboard Component
export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  projectId,
  refreshInterval = 30000, // 30 seconds
  showRealTimeUpdates = true,
}) => {
  // State management
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [userActivityStats, setUserActivityStats] = useState<UserActivityStats[]>([]);
  const [reconciliationStats, setReconciliationStats] = useState<ReconciliationStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<
    'overview' | 'projects' | 'users' | 'reconciliation'
  >('overview');

  // WebSocket integration for real-time updates
  const { isConnected } = useWebSocketIntegration();

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard metrics
      const dashboardResponse = await apiClient.get<Record<string, unknown>>('/analytics/dashboard');
      if (dashboardResponse.error) {
        throw new Error(String(dashboardResponse.error));
      }
      if (dashboardResponse.data) {
        // Adapt API response to component types with null safety
        const data = dashboardResponse.data as Record<string, unknown>;
        const adaptedData: DashboardMetrics = {
          total_projects: typeof data.total_projects === 'number' ? data.total_projects : 0,
          total_users: typeof data.total_users === 'number' ? data.total_users : 0,
          total_files: 0, // Not in API response
          total_reconciliation_jobs: typeof data.total_reconciliation_jobs === 'number' ? data.total_reconciliation_jobs : 0,
          active_jobs: typeof data.active_jobs === 'number' ? data.active_jobs : 0,
          completed_jobs: typeof data.completed_jobs === 'number' ? data.completed_jobs : 0,
          failed_jobs: typeof data.failed_jobs === 'number' ? data.failed_jobs : 0,
          total_records_processed: 0, // Not in API response
          total_matches_found: typeof data.total_matches === 'number' ? data.total_matches : 0,
          average_confidence_score: 0, // Not in API response
          average_processing_time: 0, // Not in API response
          system_uptime: 99.9, // Not in API response
          last_updated: new Date().toISOString(),
        };
        setDashboardMetrics(adaptedData);
      }

      // Load reconciliation stats
      const reconciliationResponse = await apiClient.get<Record<string, unknown>>('/analytics/reconciliation-stats');
      if (reconciliationResponse.error) {
        throw new Error(String(reconciliationResponse.error));
      }
      if (reconciliationResponse.data) {
        const data = reconciliationResponse.data as Record<string, unknown>;
        // Adapt API response to component types with null safety
        const adaptedStats: ReconciliationStats = {
          total_jobs: typeof data.total_jobs === 'number' ? data.total_jobs : 0,
          active_jobs: 0, // Not in API response
          completed_jobs: typeof data.completed_jobs === 'number' ? data.completed_jobs : 0,
          failed_jobs: typeof data.failed_jobs === 'number' ? data.failed_jobs : 0,
          queued_jobs: 0, // Not in API response
          total_records_processed: 0, // Not in API response
          total_matches_found: typeof data.total_matches === 'number' ? data.total_matches : 0,
          total_unmatched_records: typeof data.total_unmatched === 'number' ? data.total_unmatched : 0,
          average_confidence_score: typeof data.average_confidence_score === 'number' ? data.average_confidence_score : 0,
          average_processing_time: typeof data.average_processing_time_ms === 'number' ? data.average_processing_time_ms : 0,
          success_rate: 0, // Calculated
          throughput_per_hour: 0, // Calculated
        };
        setReconciliationStats(adaptedStats);
      }

      // Load project stats if projectId is provided
      if (projectId) {
        const projectResponse = await apiClient.get<ProjectStats[]>(`/projects/${projectId}/stats`);
        if (projectResponse.error) {
          throw new Error(String(projectResponse.error));
        }
        if (projectResponse.data && Array.isArray(projectResponse.data)) {
          setProjectStats(projectResponse.data);
        } else {
          setProjectStats([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load trend data
  const loadTrendData = useCallback(async () => {
    try {
      // This would be implemented in the API client
      // const response = await apiClient.getTrendData(selectedTimeRange)
      // setTrendData(response.data)

      // Mock data for now
      const mockTrendData: TrendData[] = [
        {
          date: '2024-01-01',
          total_jobs: 10,
          completed_jobs: 8,
          failed_jobs: 2,
          records_processed: 1000,
          matches_found: 800,
          average_confidence: 85,
        },
        {
          date: '2024-01-02',
          total_jobs: 15,
          completed_jobs: 12,
          failed_jobs: 3,
          records_processed: 1500,
          matches_found: 1200,
          average_confidence: 87,
        },
        {
          date: '2024-01-03',
          total_jobs: 12,
          completed_jobs: 10,
          failed_jobs: 2,
          records_processed: 1200,
          matches_found: 1000,
          average_confidence: 86,
        },
        {
          date: '2024-01-04',
          total_jobs: 18,
          completed_jobs: 15,
          failed_jobs: 3,
          records_processed: 1800,
          matches_found: 1500,
          average_confidence: 88,
        },
        {
          date: '2024-01-05',
          total_jobs: 20,
          completed_jobs: 18,
          failed_jobs: 2,
          records_processed: 2000,
          matches_found: 1800,
          average_confidence: 89,
        },
      ];
      setTrendData(mockTrendData);
    } catch (err) {
      logger.error('Failed to load trend data:', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, [selectedTimeRange]);

  // WebSocket event handlers
  useEffect(() => {
    if (!isConnected || !showRealTimeUpdates) return;
    // WebSocket integration removed - hook doesn't support subscribe
  }, [isConnected, showRealTimeUpdates]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    loadTrendData();
  }, [loadTrendData]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        loadDashboardData();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [loadDashboardData, refreshInterval]);

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    if (!dashboardMetrics || !reconciliationStats) return null;

    return {
      success_rate:
        reconciliationStats.total_jobs > 0
          ? (reconciliationStats.completed_jobs / reconciliationStats.total_jobs) * 100
          : 0,
      match_rate:
        reconciliationStats.total_records_processed > 0
          ? (reconciliationStats.total_matches_found /
              reconciliationStats.total_records_processed) *
            100
          : 0,
      throughput_per_hour:
        reconciliationStats.average_processing_time > 0
          ? 3600000 / reconciliationStats.average_processing_time
          : 0,
      system_health:
        dashboardMetrics.system_uptime > 99
          ? 'excellent'
          : dashboardMetrics.system_uptime > 95
            ? 'good'
            : dashboardMetrics.system_uptime > 90
              ? 'fair'
              : 'poor',
    };
  }, [dashboardMetrics, reconciliationStats]);

  // Get metric color based on value
  const getMetricColor = (value: number, thresholds: { good: number; fair: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.fair) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get trend icon (for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

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
      <div className="bg-red-50 border border-red-200 rounded-md p-4" data-testid="analytics-dashboard-error">
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
    <>
      <PageMeta
        title="Analytics"
        description="Comprehensive analytics and insights for reconciliation projects and data trends."
        keywords="analytics, insights, metrics, reconciliation, data trends"
      />
      <main id="main-content" className="space-y-6" data-testid="analytics-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time insights and performance metrics</p>
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
      <MetricTabs
        tabs={[
          { id: 'overview', name: 'Overview', icon: BarChart3 },
          { id: 'projects', name: 'Projects', icon: Folder },
          { id: 'users', name: 'Users', icon: Users },
          { id: 'reconciliation', name: 'Reconciliation', icon: GitCompare },
        ]}
        selectedTab={selectedMetric}
        onTabChange={(tabId) => setSelectedMetric(tabId as typeof selectedMetric)}
      />

      {/* Overview Metrics */}
      {selectedMetric === 'overview' && dashboardMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon={Folder}
            label="Total Projects"
            value={dashboardMetrics.total_projects}
          />
          <MetricCard
            icon={Users}
            label="Total Users"
            value={dashboardMetrics.total_users}
          />
          <MetricCard
            icon={Folder}
            label="Total Files"
            value={dashboardMetrics.total_files}
          />
          <MetricCard
            icon={GitCompare}
            label="Total Jobs"
            value={dashboardMetrics.total_reconciliation_jobs}
          />
        </div>
      )}

      {/* Reconciliation Metrics */}
      {selectedMetric === 'reconciliation' && reconciliationStats && derivedMetrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Success Rate */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle
                      className={`h-6 w-6 ${getMetricColor(derivedMetrics.success_rate, { good: 90, fair: 70 })}`}
                    />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                      <dd
                        className={`text-lg font-medium ${getMetricColor(derivedMetrics.success_rate, { good: 90, fair: 70 })}`}
                      >
                        {derivedMetrics.success_rate.toFixed(1)}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Match Rate */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target
                      className={`h-6 w-6 ${getMetricColor(derivedMetrics.match_rate, { good: 80, fair: 60 })}`}
                    />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Match Rate</dt>
                      <dd
                        className={`text-lg font-medium ${getMetricColor(derivedMetrics.match_rate, { good: 80, fair: 60 })}`}
                      >
                        {derivedMetrics.match_rate.toFixed(1)}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Average Confidence */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Shield
                      className={`h-6 w-6 ${getMetricColor(reconciliationStats.average_confidence_score, { good: 85, fair: 70 })}`}
                    />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg Confidence</dt>
                      <dd
                        className={`text-lg font-medium ${getMetricColor(reconciliationStats.average_confidence_score, { good: 85, fair: 70 })}`}
                      >
                        {reconciliationStats.average_confidence_score.toFixed(1)}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Throughput */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Zap
                      className={`h-6 w-6 ${getMetricColor(derivedMetrics.throughput_per_hour, { good: 100, fair: 50 })}`}
                    />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Throughput/Hour
                      </dt>
                      <dd
                        className={`text-lg font-medium ${getMetricColor(derivedMetrics.throughput_per_hour, { good: 100, fair: 50 })}`}
                      >
                        {derivedMetrics.throughput_per_hour.toFixed(0)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Job Status Distribution Chart */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Job Status Distribution</h3>
              </div>
              <div className="p-6">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-48">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  }
                >
                  <PieChart
                    data={[
                      { label: 'Active', value: reconciliationStats.active_jobs, color: '#3B82F6' },
                      {
                        label: 'Completed',
                        value: reconciliationStats.completed_jobs,
                        color: '#10B981',
                      },
                      { label: 'Failed', value: reconciliationStats.failed_jobs, color: '#EF4444' },
                      { label: 'Queued', value: reconciliationStats.queued_jobs, color: '#F59E0B' },
                    ]}
                    width={300}
                    height={200}
                    title="Job Status Distribution"
                  />
                </Suspense>
              </div>
            </div>

            {/* Performance Trends Chart */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Performance Trends</h3>
              </div>
              <div className="p-6">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-48">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  }
                >
                  <LineChart
                    data={[
                      { label: 'Success Rate', value: derivedMetrics.success_rate },
                      { label: 'Match Rate', value: derivedMetrics.match_rate },
                      {
                        label: 'Avg Confidence',
                        value: reconciliationStats.average_confidence_score,
                      },
                      { label: 'Throughput/hr', value: derivedMetrics.throughput_per_hour },
                    ]}
                    width={300}
                    height={200}
                    title="Key Performance Indicators"
                  />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Data Processing Volume Chart */}
          <div className="bg-white shadow rounded-lg mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Data Processing Volume</h3>
            </div>
            <div className="p-6">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                }
              >
                <BarChart
                  data={[
                    { label: 'Total Records', value: reconciliationStats.total_records_processed },
                    { label: 'Matched Records', value: reconciliationStats.total_matches_found },
                    {
                      label: 'Unmatched Records',
                      value: reconciliationStats.total_unmatched_records,
                    },
                  ]}
                  width={600}
                  height={250}
                  title="Records Processed"
                />
              </Suspense>
            </div>
          </div>
        </>
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
      {dashboardMetrics && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">System Health</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${
                    derivedMetrics?.system_health === 'excellent'
                      ? 'text-green-600'
                      : derivedMetrics?.system_health === 'good'
                        ? 'text-blue-600'
                        : derivedMetrics?.system_health === 'fair'
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
    </main>
    </>
  );
};

export default memo(AnalyticsDashboard);
