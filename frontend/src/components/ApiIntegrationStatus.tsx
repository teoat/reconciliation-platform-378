import React, { useEffect, useState, useCallback, memo, useMemo } from 'react';
import { Wifi } from 'lucide-react';
import { WifiOff } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { Activity } from 'lucide-react';
import { Database } from 'lucide-react';
import { Users } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import { useWebSocketIntegration } from '../hooks/useWebSocketIntegration';
import { useHealthCheckAPI } from '../hooks/useApiEnhanced';
import { useAppSelector } from '../store/unifiedStore';
import Button from './ui/Button';
import Card from './ui/Card';
import StatusBadge from './ui/StatusBadge';
import { PageMeta } from './seo/PageMeta';

interface ApiIntegrationStatusProps {
  className?: string;
}

const ApiIntegrationStatus: React.FC<ApiIntegrationStatusProps> = memo(({ className = '' }) => {
  const { connectionStatus, activeUsers, isConnected, updateUserPresence, sendHeartbeat } =
    useWebSocketIntegration();
  const {
    isHealthy,
    isChecking,
    lastChecked,
    error: healthError,
    checkHealth,
  } = useHealthCheckAPI();

  // Get real-time data from Redux store
  const auth = useAppSelector((state) => state.auth);
  const projects = useAppSelector((state) => state.projects);
  const reconciliation = useAppSelector((state) => state.reconciliation);
  const ui = useAppSelector((state) => state.ui);

  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  // Update user presence when component mounts
  useEffect(() => {
    if (isConnected) {
      updateUserPresence('online', '/api-status');
      setLastSyncTime(new Date());
      setSyncStatus('synced');
    }
  }, [isConnected, updateUserPresence]);

  // Send heartbeat periodically
  useEffect(() => {
    if (!isConnected) return;

    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [isConnected, sendHeartbeat]);

  const handleReconnect = useCallback(() => {
    setSyncStatus('syncing');
    // WebSocket reconnection is handled automatically by the WebSocketProvider
    setTimeout(() => {
      setSyncStatus('synced');
    }, 2000);
  }, []);

  // Memoize color calculations
  const connectionStatusColor = useMemo(() => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }, [connectionStatus]);

  const healthStatusColor = useMemo(() => {
    if (isChecking) return 'text-yellow-600';
    if (isHealthy === true) return 'text-green-600';
    if (isHealthy === false) return 'text-red-600';
    return 'text-gray-600';
  }, [isChecking, isHealthy]);

  return (
    <>
      <PageMeta
        title="API Integration Status"
        description="Monitor API integration status, connection health, and endpoint availability."
        keywords="API, integration, status, health check, monitoring"
      />
      <main id="main-content" className={`space-y-4 ${className}`}>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">API Integration Status</h1>
        {/* Connection Status */}
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Connection Status</h3>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" onClick={checkHealth} disabled={isChecking}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WebSocket Status */}
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-gray-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">WebSocket</p>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={isConnected ? 'active' : 'inactive'}>
                    {connectionStatus}
                  </StatusBadge>
                  {isConnected && <span className="text-xs text-gray-500">Real-time enabled</span>}
                </div>
              </div>
            </div>

            {/* Health Check Status */}
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${isHealthy ? 'bg-green-100' : 'bg-red-100'}`}>
                {isHealthy === true ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : isHealthy === false ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <Activity className="h-5 w-5 text-gray-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Backend Health</p>
                <div className="flex items-center space-x-2">
                  <StatusBadge
                    status={
                      isHealthy === true ? 'active' : isHealthy === false ? 'inactive' : 'warning'
                    }
                  >
                    {isChecking
                      ? 'checking'
                      : isHealthy === true
                        ? 'healthy'
                        : isHealthy === false
                          ? 'unhealthy'
                          : 'unknown'}
                  </StatusBadge>
                  {lastChecked && (
                    <span className="text-xs text-gray-500">
                      {lastChecked.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {(healthError || connectionStatus === 'error') && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Connection Issues</p>
                  <p className="text-sm text-red-700 mt-1">
                    {healthError || 'WebSocket connection failed'}
                  </p>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReconnect}
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reconnect
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Connection Controls */}
          <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}
                />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {lastSyncTime && (
                <span className="text-xs text-gray-500">
                  Last sync: {lastSyncTime.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" onClick={handleReconnect} disabled={isConnected}>
                <RefreshCw className="h-4 w-4 mr-1" />
                {isConnected ? 'Connected' : 'Reconnect'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Data Statistics */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Statistics</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="p-2 bg-blue-100 rounded-lg mx-auto w-fit mb-2">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">{projects.projects.length}</p>
              <p className="text-xs text-gray-500">Projects</p>
            </div>

            <div className="text-center">
              <div className="p-2 bg-green-100 rounded-lg mx-auto w-fit mb-2">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">{projects.projects.length}</p>
              <p className="text-xs text-gray-500">Projects</p>
            </div>

            <div className="text-center">
              <div className="p-2 bg-purple-100 rounded-lg mx-auto w-fit mb-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">{reconciliation.records.length}</p>
              <p className="text-xs text-gray-500">Records</p>
            </div>

            <div className="text-center">
              <div className="p-2 bg-orange-100 rounded-lg mx-auto w-fit mb-2">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">{ui.notifications.length}</p>
              <p className="text-xs text-gray-500">Notifications</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Real-time Activity Feed */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Activity</h3>

          <div className="space-y-3">
            {isConnected ? (
              <>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">WebSocket Connected</p>
                    <p className="text-xs text-green-600">Real-time updates active</p>
                  </div>
                </div>

                {lastSyncTime && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Data Synchronized</p>
                      <p className="text-xs text-blue-600">
                        Last sync: {lastSyncTime.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )}

                {reconciliation.isLoading && (
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Reconciliation Running</p>
                      <p className="text-xs text-yellow-600">
                        Processing {reconciliation.records.length} records
                      </p>
                    </div>
                  </div>
                )}

                {activeUsers.length > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Active Users</p>
                      <p className="text-xs text-blue-600">{activeUsers.length} users online</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <WifiOff className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-800">WebSocket Disconnected</p>
                  <p className="text-xs text-gray-600">Real-time updates unavailable</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </main>
    </>
  );
});

ApiIntegrationStatus.displayName = 'ApiIntegrationStatus';

export default ApiIntegrationStatus;
