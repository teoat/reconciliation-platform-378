// Real-time Data Synchronization Hook
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './api';
import { logger } from '@/services/logger';

interface SyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  syncCount: number;
  errors: string[];
}

interface DataSyncOptions {
  page: string;
  autoSync?: boolean;
  syncInterval?: number;
  onDataUpdate?: (data: Record<string, unknown>) => void;
  onSyncError?: (error: string) => void;
}

export const useRealtimeDataSync = (options: DataSyncOptions) => {
  const {
    page,
    autoSync = true,
    syncInterval = 30000, // 30 seconds
    onDataUpdate,
    onSyncError
  } = options;

  const { isConnected, sendMessage, onMessage, offMessage } = useWebSocket();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: false,
    isSyncing: false,
    lastSync: null,
    syncCount: 0,
    errors: []
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync data with backend
  const syncData = useCallback(async (data: Record<string, unknown>, targetPage?: string) => {
    if (!isConnected) {
      const error = 'WebSocket not connected';
      setSyncStatus(prev => ({
        ...prev,
        errors: [...prev.errors.slice(-4), error] // Keep last 5 errors
      }));
      onSyncError?.(error);
      return false;
    }

    setSyncStatus(prev => ({
      ...prev,
      isSyncing: true
    }));

    try {
      sendMessage('data:sync', {
        fromPage: page,
        toPage: targetPage || page,
        data,
        timestamp: new Date().toISOString()
      });

      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        syncCount: prev.syncCount + 1,
        isSyncing: false,
        errors: [] // Clear errors on successful sync
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        errors: [...prev.errors.slice(-4), errorMessage]
      }));
      onSyncError?.(errorMessage);
      return false;
    }
  }, [isConnected, sendMessage, page, onSyncError]);

  // Request data from backend
  const requestData = useCallback(async (dataType: string, filters?: Record<string, unknown>) => {
    if (!isConnected) {
      const error = 'WebSocket not connected';
      onSyncError?.(error);
      return false;
    }

    try {
      sendMessage('data:request', {
        page,
        dataType,
        filters,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      onSyncError?.(errorMessage);
      return false;
    }
  }, [isConnected, sendMessage, page, onSyncError]);

  // Handle incoming data updates
  const handleDataUpdate = useCallback((data: Record<string, unknown> & { page?: string; data?: Record<string, unknown> }) => {
    if (data.page === page) {
      onDataUpdate?.(data.data);
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        syncCount: prev.syncCount + 1
      }));
    }
  }, [page, onDataUpdate]);

  // Handle sync responses
  const handleSyncResponse = useCallback((data: Record<string, unknown>) => {
    setSyncStatus(prev => ({
      ...prev,
      isSyncing: false,
      lastSync: new Date(),
      syncCount: prev.syncCount + 1
    }));
  }, []);

  // Handle sync errors
  const handleSyncError = useCallback((data: Record<string, unknown> & { message?: string }) => {
    const error = data.message || 'Sync error';
    setSyncStatus(prev => ({
      ...prev,
      isSyncing: false,
      errors: [...prev.errors.slice(-4), error]
    }));
    onSyncError?.(error);
  }, [onSyncError]);

  // Handle connection status changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    setSyncStatus(prev => ({
      ...prev,
      isConnected: connected
    }));

    if (connected) {
      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    } else {
      // Schedule reconnect attempt
      reconnectTimeoutRef.current = setTimeout(() => {
        // This would trigger a reconnection in the WebSocket hook
        // Reconnection is handled by the WebSocket hook
      }, 5000);
    }
  }, []);

  // Set up message handlers
  useEffect(() => {
    if (isConnected) {
      onMessage('data:updated', handleDataUpdate);
      onMessage('data:synced', handleSyncResponse);
      onMessage('data:sync_error', handleSyncError);
      onMessage('connection:status', handleConnectionChange);
    }

    return () => {
      offMessage('data:updated', handleDataUpdate);
      offMessage('data:synced', handleSyncResponse);
      offMessage('data:sync_error', handleSyncError);
      offMessage('connection:status', handleConnectionChange);
    };
  }, [isConnected, onMessage, offMessage, handleDataUpdate, handleSyncResponse, handleSyncError, handleConnectionChange]);

  // Auto-sync setup
  useEffect(() => {
    if (autoSync && isConnected) {
      const startAutoSync = () => {
        syncTimeoutRef.current = setTimeout(() => {
          // Trigger auto-sync
          requestData('auto_sync');
          startAutoSync(); // Schedule next sync
        }, syncInterval);
      };

      startAutoSync();
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [autoSync, isConnected, syncInterval, requestData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Manual sync trigger
  const triggerSync = useCallback(async (data?: Record<string, unknown>) => {
    if (data) {
      return await syncData(data);
    } else {
      return await requestData('manual_sync');
    }
  }, [syncData, requestData]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setSyncStatus(prev => ({
      ...prev,
      errors: []
    }));
  }, []);

  // Get sync status summary
  const getSyncStatusSummary = useCallback(() => {
    const { isConnected, isSyncing, lastSync, syncCount, errors } = syncStatus;
    
    return {
      status: isConnected 
        ? (isSyncing ? 'syncing' : 'connected')
        : 'disconnected',
      lastSync: lastSync?.toLocaleTimeString() || 'Never',
      syncCount,
      errorCount: errors.length,
      hasErrors: errors.length > 0
    };
  }, [syncStatus]);

  return {
    syncStatus,
    syncData,
    requestData,
    triggerSync,
    clearErrors,
    getSyncStatusSummary
  };
};

// Real-time metrics hook
export const useRealtimeMetrics = (page: string) => {
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { syncData, requestData, syncStatus } = useRealtimeDataSync({
    page,
    autoSync: true,
    syncInterval: 10000, // 10 seconds for metrics
    onDataUpdate: (data) => {
      setMetrics(data);
      setIsLoading(false);
    },
    onSyncError: (error) => {
      logger.error('Metrics sync error', { 
        error, 
        category: 'realtime-sync',
        component: 'useRealtimeSync'
      });
      setIsLoading(false);
    }
  });

  const updateMetrics = useCallback(async (newMetrics: Record<string, unknown>) => {
    setIsLoading(true);
    await syncData(newMetrics);
  }, [syncData]);

  const refreshMetrics = useCallback(async () => {
    setIsLoading(true);
    await requestData('metrics');
  }, [requestData]);

  return {
    metrics,
    isLoading,
    updateMetrics,
    refreshMetrics,
    syncStatus
  };
};

// Notification data structure
interface NotificationData {
  id: string;
  type: string;
  isRead?: boolean;
  [key: string]: unknown;
}

// Real-time notifications hook
export const useRealtimeNotifications = (page: string) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { syncData, requestData } = useRealtimeDataSync({
    page,
    autoSync: true,
    syncInterval: 5000, // 5 seconds for notifications
    onDataUpdate: (data) => {
      if (data.type === 'notification') {
        setNotifications(prev => [data, ...prev.slice(0, 99)]); // Keep last 100
        if (!data.isRead) {
          setUnreadCount(prev => prev + 1);
        }
      }
    }
  });

  const markAsRead = useCallback(async (notificationId: string) => {
    await syncData({
      type: 'mark_read',
      notificationId
    });
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [syncData]);

  const markAllAsRead = useCallback(async () => {
    await syncData({
      type: 'mark_all_read'
    });
    
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
    setUnreadCount(0);
  }, [syncData]);

  const clearNotifications = useCallback(async () => {
    await syncData({
      type: 'clear_notifications'
    });
    
    setNotifications([]);
    setUnreadCount(0);
  }, [syncData]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
};

export default useRealtimeDataSync;
