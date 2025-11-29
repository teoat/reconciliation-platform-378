import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  BarChart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Activity,
} from 'lucide-react';
import { LazyLineChart, LazyPieChart } from '../../utils/dynamicImports';
import { logger } from '../../services/logger';
import type { CircuitBreakerMetrics } from '../../types/circuitBreaker';

interface PerformanceMetrics {
  timestamp: string;
  bundleSize: {
    totalSizeMB: number;
    chunks: Array<{ name: string; sizeKB: number }>;
  };
  lighthouse?: {
    performance: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
  };
  synthetic: {
    initialLoadTime: number;
    domContentLoaded: number;
    firstPaint: number;
    reactHydrationTime: number;
  };
}

interface PerformanceDashboardProps {
  metrics?: PerformanceMetrics[];
  realtime?: boolean;
}

const PerformanceDashboardComponent: React.FC<PerformanceDashboardProps> = ({
  metrics: initialMetrics,
  realtime = false,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>(initialMetrics || []);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('7d');
  const [loading, setLoading] = useState(false);
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakerMetrics[]>([]);
  const [_circuitBreakerLoading, setCircuitBreakerLoading] = useState(false);

  // Load circuit breaker metrics
  const loadCircuitBreakers = async () => {
    setCircuitBreakerLoading(true);
    try {
      const response = await fetch('/api/health/resilience');
      if (!response.ok) {
        throw new Error('Failed to fetch circuit breaker metrics');
      }
      const data = await response.json();
      if (data.success && data.data) {
        const metrics: CircuitBreakerMetrics[] = [
          { ...data.data.database, service: 'database' },
          { ...data.data.cache, service: 'cache' },
          { ...data.data.api, service: 'api' },
        ];
        setCircuitBreakers(metrics);
      }
    } catch (error) {
      logger.error('Failed to load circuit breaker metrics', { error });
    } finally {
      setCircuitBreakerLoading(false);
    }
  };

  // Load metrics data
  useEffect(() => {
    if (!initialMetrics) {
      loadMetrics();
    }

    if (realtime) {
      const interval = setInterval(() => {
        loadMetrics();
        loadCircuitBreakers();
      }, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }

    // Load circuit breakers on mount
    loadCircuitBreakers();
  }, [selectedTimeframe, realtime]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll simulate loading recent metrics
      const response = await fetch('/api/performance/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      logger.error('Failed to load performance metrics', { error });
      // Fallback to mock data
      setMetrics(generateMockMetrics());
    } finally {
      setLoading(false);
    }
  };

  const generateMockMetrics = (): PerformanceMetrics[] => {
    const now = new Date();
    return Array.from({ length: 30 }, (_, i) => ({
      timestamp: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
      bundleSize: {
        totalSizeMB: 4.5 - i * 0.05 + (Math.random() - 0.5) * 0.2,
        chunks: [
          { name: 'app.js', sizeKB: 1200 - i * 10 },
          { name: 'vendor.js', sizeKB: 800 - i * 5 },
          { name: 'common.js', sizeKB: 300 - i * 2 },
        ],
      },
      lighthouse: {
        performance: 85 + Math.random() * 10,
        firstContentfulPaint: 1800 + Math.random() * 400,
        largestContentfulPaint: 2500 + Math.random() * 500,
        firstInputDelay: 50 + Math.random() * 50,
        cumulativeLayoutShift: 0.05 + Math.random() * 0.1,
      },
      synthetic: {
        initialLoadTime: 2200 + Math.random() * 400,
        domContentLoaded: 1500 + Math.random() * 300,
        firstPaint: 1200 + Math.random() * 200,
        reactHydrationTime: 400 + Math.random() * 100,
      },
    }));
  };

  // Calculate trends and summaries
  const summary = useMemo(() => {
    if (metrics.length === 0) return null;

    const latest = metrics[0];
    const previous = metrics[1];

    const calculateTrend = (current: number, prev: number) => ({
      value: current,
      change: current - prev,
      changePercent: ((current - prev) / prev) * 100,
      isPositive: current >= prev,
    });

    return {
      bundleSize: calculateTrend(
        latest.bundleSize.totalSizeMB,
        previous?.bundleSize.totalSizeMB || latest.bundleSize.totalSizeMB
      ),
      performance: latest.lighthouse
        ? calculateTrend(
            latest.lighthouse.performance,
            previous?.lighthouse?.performance || latest.lighthouse.performance
          )
        : null,
      loadTime: calculateTrend(
        latest.synthetic.initialLoadTime,
        previous?.synthetic.initialLoadTime || latest.synthetic.initialLoadTime
      ),
    };
  }, [metrics]);

  // Filter metrics by timeframe
  const filteredMetrics = useMemo(() => {
    const now = new Date();
    const hours =
      selectedTimeframe === '1h'
        ? 1
        : selectedTimeframe === '24h'
          ? 24
          : selectedTimeframe === '7d'
            ? 168
            : 720;

    return metrics.filter((metric) => {
      const metricTime = new Date(metric.timestamp);
      const diffHours = (now.getTime() - metricTime.getTime()) / (1000 * 60 * 60);
      return diffHours <= hours;
    });
  }, [metrics, selectedTimeframe]);

  // Prepare chart data
  const chartData = useMemo(
    () => ({
      bundleSize: filteredMetrics
        .map((m) => ({
          label: new Date(m.timestamp).toLocaleDateString(),
          value: m.bundleSize.totalSizeMB,
        }))
        .reverse(),

      performance: filteredMetrics
        .filter((m) => m.lighthouse)
        .map((m) => ({
          label: new Date(m.timestamp).toLocaleDateString(),
          value: m.lighthouse!.performance,
        }))
        .reverse(),

      loadTime: filteredMetrics
        .map((m) => ({
          label: new Date(m.timestamp).toLocaleDateString(),
          value: m.synthetic.initialLoadTime,
        }))
        .reverse(),
    }),
    [filteredMetrics]
  );

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    unit?: string;
    trend?: { change: number; changePercent: number; isPositive: boolean };
    icon: React.ReactNode;
    status?: 'good' | 'warning' | 'error';
  }> = ({ title, value, unit, trend, icon, status = 'good' }) => (
    <div
      className={`p-4 rounded-lg border ${
        status === 'error'
          ? 'border-red-200 bg-red-50'
          : status === 'warning'
            ? 'border-yellow-200 bg-yellow-50'
            : 'border-green-200 bg-green-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toFixed(1) : value}
            </span>
            {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
          </div>
          {trend && (
            <div
              className={`flex items-center mt-2 text-sm ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {trend.changePercent > 0 ? '+' : ''}
              {trend.changePercent.toFixed(1)}%
            </div>
          )}
        </div>
        <div
          className={`p-2 rounded-full ${
            status === 'error'
              ? 'bg-red-100'
              : status === 'warning'
                ? 'bg-yellow-100'
                : 'bg-green-100'
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading && metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading performance metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600">Monitor application performance and bundle metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as '1h' | '24h' | '7d' | '30d')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          {realtime && (
            <div className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse mr-2"></div>
              Live
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Bundle Size"
            value={summary.bundleSize.value}
            unit="MB"
            trend={summary.bundleSize}
            icon={<BarChart className="w-6 h-6 text-blue-600" />}
            status={summary.bundleSize.value > 5 ? 'warning' : 'good'}
          />
          {summary.performance && (
            <MetricCard
              title="Performance Score"
              value={summary.performance.value}
              unit="/100"
              trend={summary.performance}
              icon={<Zap className="w-6 h-6 text-yellow-600" />}
              status={summary.performance.value < 80 ? 'warning' : 'good'}
            />
          )}
          <MetricCard
            title="Load Time"
            value={summary.loadTime.value}
            unit="ms"
            trend={summary.loadTime}
            icon={<Clock className="w-6 h-6 text-green-600" />}
            status={summary.loadTime.value > 3000 ? 'warning' : 'good'}
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bundle Size Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Bundle Size Trend</h2>
          <div className="h-64">
            <LazyLineChart data={chartData.bundleSize} />
          </div>
        </div>

        {/* Performance Score Trend */}
        {chartData.performance.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Performance Score Trend</h2>
            <div className="h-64">
              <LazyLineChart data={chartData.performance} />
            </div>
          </div>
        )}

        {/* Load Time Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Load Time Trend</h2>
          <div className="h-64">
            <LazyLineChart data={chartData.loadTime} />
          </div>
        </div>

        {/* Bundle Composition */}
        {metrics.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Bundle Composition</h2>
            <div className="h-64">
              <LazyPieChart
                data={metrics[0].bundleSize.chunks.map((chunk) => ({
                  label: chunk.name,
                  value: chunk.sizeKB,
                }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Circuit Breaker Metrics */}
      {circuitBreakers.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Circuit Breaker Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {circuitBreakers.map((cb) => {
              const stateColor =
                cb.state === 'Closed'
                  ? 'border-green-200 bg-green-50'
                  : cb.state === 'Open'
                    ? 'border-red-200 bg-red-50'
                    : 'border-yellow-200 bg-yellow-50';
              const stateTextColor =
                cb.state === 'Closed'
                  ? 'text-green-800'
                  : cb.state === 'Open'
                    ? 'text-red-800'
                    : 'text-yellow-800';

              return (
                <div key={cb.service} className={`p-4 rounded-lg border ${stateColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium capitalize">{cb.service}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${stateTextColor}`}>
                      {cb.state}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="font-medium">{cb.success_rate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Requests:</span>
                      <span className="font-medium">{cb.total_requests.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Successes:</span>
                      <span className="font-medium text-green-600">
                        {cb.successes.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Failures:</span>
                      <span className="font-medium text-red-600">
                        {cb.failures.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerts */}
      {summary && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Performance Alerts
          </h2>
          <div className="space-y-2">
            {summary.bundleSize.value > 5 && (
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <p className="font-medium text-yellow-800">Large Bundle Size</p>
                  <p className="text-sm text-yellow-700">
                    Consider code splitting or tree shaking optimizations
                  </p>
                </div>
              </div>
            )}
            {summary.performance && summary.performance.value < 80 && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <p className="font-medium text-red-800">Poor Performance Score</p>
                  <p className="text-sm text-red-700">
                    Address Lighthouse performance recommendations
                  </p>
                </div>
              </div>
            )}
            {summary.loadTime.value > 3000 && (
              <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600 mr-3" />
                <div>
                  <p className="font-medium text-orange-800">Slow Load Time</p>
                  <p className="text-sm text-orange-700">
                    Optimize critical rendering path and resource loading
                  </p>
                </div>
              </div>
            )}
            {!summary.bundleSize.isPositive &&
              !summary.loadTime.isPositive &&
              summary.performance?.isPositive && (
                <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-800">Performance Improved</p>
                    <p className="text-sm text-green-700">
                      Recent optimizations are showing positive results
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

const PerformanceDashboard = memo(PerformanceDashboardComponent);

export default PerformanceDashboard;
