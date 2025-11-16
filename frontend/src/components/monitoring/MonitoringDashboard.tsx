// Comprehensive Monitoring Dashboard
import { logger } from '@/services/logger';
import React, { useState, useEffect, useCallback } from 'react';
import { Activity } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import { Cpu } from 'lucide-react';
import { Database } from 'lucide-react';
import { HardDrive } from 'lucide-react';
import { MemoryStick } from 'lucide-react';
import { Network } from 'lucide-react';
import { Server } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { Zap } from 'lucide-react';

export interface SystemMetrics {
  timestamp: string;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  activeConnections: number;
  databaseConnections: number;
  redisConnections: number;
  websocketConnections: number;
  errorRate: number;
  responseTimeP50: number;
  responseTimeP95: number;
  responseTimeP99: number;
  throughput: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  description: string;
  triggeredAt: string;
  resolvedAt?: string;
  status: 'firing' | 'resolved' | 'suppressed';
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  source: string;
  context: Record<string, string>;
  traceId?: string;
  spanId?: string;
}

// Main Monitoring Dashboard
export const MonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data ?? null);
      } else {
        throw new Error(`Failed to fetch metrics: ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch metrics';
      logger.error(errorMessage);
      setError(errorMessage);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(Array.isArray(data) ? data : []);
      } else {
        throw new Error(`Failed to fetch alerts: ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch alerts';
      logger.error(errorMessage);
      setError(errorMessage);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
      } else {
        throw new Error(`Failed to fetch logs: ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch logs';
      logger.error(errorMessage);
      setError(errorMessage);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await Promise.all([fetchMetrics(), fetchAlerts(), fetchLogs()]);
    setIsLoading(false);
  }, [fetchMetrics, fetchAlerts, fetchLogs]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAllData, refreshInterval]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'text-green-500 bg-green-100';
      case 'medium':
        return 'text-yellow-500 bg-yellow-100';
      case 'high':
        return 'text-orange-500 bg-orange-100';
      case 'critical':
        return 'text-red-500 bg-red-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'trace':
        return 'text-gray-500';
      case 'debug':
        return 'text-blue-500';
      case 'info':
        return 'text-green-500';
      case 'warn':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      case 'fatal':
        return 'text-red-700';
      default:
        return 'text-gray-500';
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 font-medium">Error Loading Monitoring Data</span>
          </div>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={fetchAllData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
        <div className="flex items-center space-x-4">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            aria-label="Refresh interval"
          >
            <option value={1000}>1 second</option>
            <option value={5000}>5 seconds</option>
            <option value={10000}>10 seconds</option>
            <option value={30000}>30 seconds</option>
            <option value={60000}>1 minute</option>
          </select>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* System Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="CPU Usage"
            value={`${metrics.cpuUsage.toFixed(1)}%`}
            icon={<Cpu className="w-5 h-5" />}
            color={
              metrics.cpuUsage > 80
                ? 'text-red-500'
                : metrics.cpuUsage > 60
                  ? 'text-yellow-500'
                  : 'text-green-500'
            }
          />
          <MetricCard
            title="Memory Usage"
            value={`${metrics.memoryUsage.toFixed(1)}%`}
            icon={<MemoryStick className="w-5 h-5" />}
            color={
              metrics.memoryUsage > 80
                ? 'text-red-500'
                : metrics.memoryUsage > 60
                  ? 'text-yellow-500'
                  : 'text-green-500'
            }
          />
          <MetricCard
            title="Disk Usage"
            value={`${metrics.diskUsage.toFixed(1)}%`}
            icon={<HardDrive className="w-5 h-5" />}
            color={
              metrics.diskUsage > 80
                ? 'text-red-500'
                : metrics.diskUsage > 60
                  ? 'text-yellow-500'
                  : 'text-green-500'
            }
          />
          <MetricCard
            title="Error Rate"
            value={`${metrics.errorRate.toFixed(2)}%`}
            icon={<AlertTriangle className="w-5 h-5" />}
            color={
              metrics.errorRate > 5
                ? 'text-red-500'
                : metrics.errorRate > 1
                  ? 'text-yellow-500'
                  : 'text-green-500'
            }
          />
        </div>
      )}

      {/* Connection Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Active Connections"
            value={metrics.activeConnections.toString()}
            icon={<Network className="w-5 h-5" />}
            color="text-blue-500"
          />
          <MetricCard
            title="Database Connections"
            value={metrics.databaseConnections.toString()}
            icon={<Database className="w-5 h-5" />}
            color="text-green-500"
          />
          <MetricCard
            title="Redis Connections"
            value={metrics.redisConnections.toString()}
            icon={<Server className="w-5 h-5" />}
            color="text-red-500"
          />
          <MetricCard
            title="WebSocket Connections"
            value={metrics.websocketConnections.toString()}
            icon={<Zap className="w-5 h-5" />}
            color="text-purple-500"
          />
        </div>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Response Time P50"
            value={`${metrics.responseTimeP50.toFixed(0)}ms`}
            icon={<TrendingUp className="w-5 h-5" />}
            color={
              metrics.responseTimeP50 > 500
                ? 'text-red-500'
                : metrics.responseTimeP50 > 200
                  ? 'text-yellow-500'
                  : 'text-green-500'
            }
          />
          <MetricCard
            title="Response Time P95"
            value={`${metrics.responseTimeP95.toFixed(0)}ms`}
            icon={<TrendingUp className="w-5 h-5" />}
            color={
              metrics.responseTimeP95 > 1000
                ? 'text-red-500'
                : metrics.responseTimeP95 > 500
                  ? 'text-yellow-500'
                  : 'text-green-500'
            }
          />
          <MetricCard
            title="Response Time P99"
            value={`${metrics.responseTimeP99.toFixed(0)}ms`}
            icon={<TrendingUp className="w-5 h-5" />}
            color={
              metrics.responseTimeP99 > 2000
                ? 'text-red-500'
                : metrics.responseTimeP99 > 1000
                  ? 'text-yellow-500'
                  : 'text-green-500'
            }
          />
          <MetricCard
            title="Throughput"
            value={`${metrics.throughput.toFixed(0)} req/s`}
            icon={<BarChart3 className="w-5 h-5" />}
            color="text-blue-500"
          />
        </div>
      )}

      {/* Alerts and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Active Alerts
          </h3>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No active alerts</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{alert.ruleName}</div>
                      <div className="text-sm text-gray-600">{alert.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(alert.triggeredAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(alert.severity)}`}
                  >
                    {alert.severity.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Logs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Logs
          </h3>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent logs</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded"
                >
                  <div className={`text-xs font-medium ${getLogLevelColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900">{log.message}</div>
                    <div className="text-xs text-gray-500">
                      {log.source} • {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Uptime */}
      {metrics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-600">Uptime</div>
              <div className="text-lg font-semibold text-gray-900">
                {Math.floor(metrics.uptime / 3600)}h {Math.floor((metrics.uptime % 3600) / 60)}m
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Last Updated</div>
              <div className="text-lg font-semibold text-gray-900">
                {new Date(metrics.timestamp).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div className="text-lg font-semibold text-green-600">Healthy</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{title}</div>
          <div className="text-2xl font-semibold text-gray-900">{value}</div>
        </div>
        <div className={color}>{icon}</div>
      </div>
    </div>
  );
};

// Alert Management Component
export const AlertManagement: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/monitoring/alerts');
        if (response.ok) {
          const data = await response.json();
          setAlerts(data);
        }
      } catch (error) {
        logger.error('Failed to fetch alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/monitoring/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
      if (response.ok) {
        setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      }
    } catch (error) {
      logger.error('Failed to resolve alert:', error);
    }
  };

  const suppressAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/monitoring/alerts/${alertId}/suppress`, {
        method: 'POST',
      });
      if (response.ok) {
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId ? { ...alert, status: 'suppressed' as const } : alert
          )
        );
      }
    } catch (error) {
      logger.error('Failed to suppress alert:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Alert Management</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No active alerts</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{alert.ruleName}</h4>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            alert.severity === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : alert.severity === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : alert.severity === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{alert.message}</p>
                      <p className="text-sm text-gray-500">
                        Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => suppressAlert(alert.id)}
                        className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                      >
                        Suppress
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Log Viewer Component
export const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/monitoring/logs');
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        }
      } catch (error) {
        logger.error('Failed to fetch logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === 'all' || log.level === filter;
    const matchesSearch =
      searchTerm === '' ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'trace':
        return 'text-gray-500';
      case 'debug':
        return 'text-blue-500';
      case 'info':
        return 'text-green-500';
      case 'warn':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      case 'fatal':
        return 'text-red-700';
      default:
        return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Log Viewer</h1>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
          aria-label="Log level filter"
        >
          <option value="all">All Levels</option>
          <option value="trace">Trace</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
          <option value="fatal">Fatal</option>
        </select>
        <input
          type="text"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md flex-1"
        />
      </div>

      {/* Logs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Entries</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                <div className={`text-xs font-medium ${getLogLevelColor(log.level)}`}>
                  {log.level.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900">{log.message}</div>
                  <div className="text-xs text-gray-500">
                    {log.source} • {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
