// React Hooks for Monitoring
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  monitoringService,
  SystemMetrics,
  Alert,
  LogEntry,
  PerformanceMetrics,
  ErrorMetrics,
  UserMetrics,
  ApiMetrics,
  DatabaseMetrics,
  CacheMetrics,
  WebSocketMetrics,
} from '../services/monitoringService';

// System Metrics Hook
export const useSystemMetrics = (refreshInterval = 5000) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await monitoringService.getSystemMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  return { metrics, isLoading, error, refetch: fetchMetrics };
};

// Alerts Hook
export const useAlerts = (refreshInterval = 10000) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await monitoringService.getAlerts();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      await monitoringService.resolveAlert(alertId);
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve alert');
    }
  }, []);

  const suppressAlert = useCallback(async (alertId: string) => {
    try {
      await monitoringService.suppressAlert(alertId);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, status: 'suppressed' as const } : alert
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suppress alert');
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAlerts, refreshInterval]);

  return {
    alerts,
    isLoading,
    error,
    refetch: fetchAlerts,
    resolveAlert,
    suppressAlert,
  };
};

// Logs Hook
export const useLogs = (level?: string, limit = 100, refreshInterval = 5000) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await monitoringService.getLogs(level, limit);
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setIsLoading(false);
    }
  }, [level, limit]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchLogs, refreshInterval]);

  return { logs, isLoading, error, refetch: fetchLogs };
};

// Performance Metrics Hook
export const usePerformanceMetrics = (timeRange = '1h', refreshInterval = 30000) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await monitoringService.getPerformanceMetrics(timeRange);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance metrics');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  return { metrics, isLoading, error, refetch: fetchMetrics };
};

// Error Metrics Hook
export const useErrorMetrics = (timeRange = '1h', refreshInterval = 30000) => {
  const [metrics, setMetrics] = useState<ErrorMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await monitoringService.getErrorMetrics(timeRange);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch error metrics');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  return { metrics, isLoading, error, refetch: fetchMetrics };
};

// User Metrics Hook
export const useUserMetrics = (timeRange = '1h', refreshInterval = 30000) => {
  const [metrics, setMetrics] = useState<UserMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await monitoringService.getUserMetrics(timeRange);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user metrics');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  return { metrics, isLoading, error, refetch: fetchMetrics };
};

// API Metrics Hook
export const useApiMetrics = (timeRange = '1h', refreshInterval = 30000) => {
  const [metrics, setMetrics] = useState<ApiMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await monitoringService.getApiMetrics(timeRange);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API metrics');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  return { metrics, isLoading, error, refetch: fetchMetrics };
};

// Database Metrics Hook
export const useDatabaseMetrics = (timeRange = '1h', refreshInterval = 30000) => {
  const [metrics, setMetrics] = useState<DatabaseMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await monitoringService.getDatabaseMetrics(timeRange);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch database metrics');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  return { metrics, isLoading, error, refetch: fetchMetrics };
};

// Cache Metrics Hook
export const useCacheMetrics = (timeRange = '1h', refreshInterval = 30000) => {
  const [metrics, setMetrics] = useState<CacheMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await monitoringService.getCacheMetrics(timeRange);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cache metrics');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  return { metrics, isLoading, error, refetch: fetchMetrics };
};

// WebSocket Metrics Hook
export const useWebSocketMetrics = (timeRange = '1h', refreshInterval = 30000) => {
  const [metrics, setMetrics] = useState<WebSocketMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await monitoringService.getWebSocketMetrics(timeRange);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch WebSocket metrics');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  return { metrics, isLoading, error, refetch: fetchMetrics };
};

// Real-time Monitoring Hook
export const useRealTimeMonitoring = (refreshInterval = 1000) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startMonitoring = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      try {
        setError(null);
        setIsConnected(true);
        setLastUpdate(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Connection failed');
        setIsConnected(false);
      }
    }, refreshInterval);
  }, [refreshInterval]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  return {
    isConnected,
    lastUpdate,
    error,
    startMonitoring,
    stopMonitoring,
  };
};

// Alert Management Hook
export const useAlertManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAlert = useCallback(async (alert: Partial<Alert>) => {
    try {
      setIsLoading(true);
      setError(null);
      const newAlert = await monitoringService.createAlert(alert);
      return newAlert;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAlert = useCallback(async (alertId: string, alert: Partial<Alert>) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedAlert = await monitoringService.updateAlert(alertId, alert);
      return updatedAlert;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alert');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAlert = useCallback(async (alertId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await monitoringService.deleteAlert(alertId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete alert');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createAlert,
    updateAlert,
    deleteAlert,
    isLoading,
    error,
  };
};

// Monitoring Service Initialization Hook
export const useMonitoringService = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await monitoringService.initialize();
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize monitoring service');
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();

    return () => {
      monitoringService.destroy();
    };
  }, []);

  return {
    isInitialized,
    isLoading,
    error,
  };
};

// Custom Hook for Monitoring Dashboard
export const useMonitoringDashboard = (refreshInterval = 5000) => {
  const systemMetrics = useSystemMetrics(refreshInterval);
  const alerts = useAlerts(refreshInterval * 2);
  const logs = useLogs(undefined, 50, refreshInterval);
  const realTimeMonitoring = useRealTimeMonitoring(refreshInterval);

  return {
    systemMetrics,
    alerts,
    logs,
    realTimeMonitoring,
    isLoading: systemMetrics.isLoading || alerts.isLoading || logs.isLoading,
    error: systemMetrics.error || alerts.error || logs.error || realTimeMonitoring.error,
  };
};
