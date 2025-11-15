import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Smartphone,
  Download,
  RefreshCw,
  Trash2,
  Bell,
  BellOff,
} from 'lucide-react';
import { pwaService } from '../services/pwaService';

interface PWAStatusProps {
  className?: string;
}

export const PWAStatus: React.FC<PWAStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState(pwaService.getStatus());
  const [cacheSize, setCacheSize] = useState<number>(0);
  interface PerformanceStats {
    hitRate: number;
    totalRequests: number;
  }

  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(pwaService.getStatus());
    };

    const updateCacheSize = async () => {
      try {
        const size = await pwaService.getCacheSize();
        setCacheSize(size);
      } catch (error) {
        console.error('Failed to get cache size:', error);
      }
    };

    const updatePerformanceStats = async () => {
      try {
        const stats = await pwaService.getPerformanceStats();
        setPerformanceStats(stats);
      } catch (error) {
        console.error('Failed to get performance stats:', error);
      }
    };

    // Initial updates
    updateCacheSize();
    updatePerformanceStats();

    // Listen for status changes
    pwaService.on('online', updateStatus);
    pwaService.on('offline', updateStatus);
    pwaService.on('canInstall', updateStatus);
    pwaService.on('installed', updateStatus);
    pwaService.on('updateAvailable', updateStatus);
    pwaService.on('serviceWorkerReady', updateStatus);
    pwaService.on('offlineDataSynced', updateStatus);

    // Periodic updates
    const interval = setInterval(() => {
      updateCacheSize();
      updatePerformanceStats();
    }, 30000); // Update every 30 seconds

    return () => {
      pwaService.off('online', updateStatus);
      pwaService.off('offline', updateStatus);
      pwaService.off('canInstall', updateStatus);
      pwaService.off('installed', updateStatus);
      pwaService.off('updateAvailable', updateStatus);
      pwaService.off('serviceWorkerReady', updateStatus);
      pwaService.off('offlineDataSynced', updateStatus);
      clearInterval(interval);
    };
  }, []);

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await pwaService.clearAllCaches();
      setCacheSize(0);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await pwaService.update();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handleInstall = async () => {
    try {
      await pwaService.install();
    } catch (error) {
      console.error('Failed to install:', error);
    }
  };

  const handleNotificationToggle = async () => {
    try {
      if (notificationsEnabled) {
        // Note: There's no direct way to disable notifications once granted
        // This would require user to disable in browser settings
        setNotificationsEnabled(false);
      } else {
        const granted = await pwaService.requestNotificationPermission();
        setNotificationsEnabled(granted);
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Smartphone className="w-5 h-5 mr-2 text-blue-600" />
          PWA Status
        </h3>
        <div className="flex items-center space-x-2">
          {status.isOnline ? (
            <div className="flex items-center text-green-600">
              <Wifi className="w-4 h-4 mr-1" />
              <span className="text-sm">Online</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <WifiOff className="w-4 h-4 mr-1" />
              <span className="text-sm">Offline</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{status.offlineDataCount}</div>
          <div className="text-sm text-gray-600">Offline Actions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{formatBytes(cacheSize)}</div>
          <div className="text-sm text-gray-600">Cache Size</div>
        </div>
      </div>

      {performanceStats && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Cache Performance</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              Hit Rate: <span className="font-medium">{performanceStats.hitRate}</span>
            </div>
            <div>
              Requests: <span className="font-medium">{performanceStats.totalRequests}</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {status.canInstall && !status.isInstalled && (
          <button
            onClick={handleInstall}
            className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Install App
          </button>
        )}

        {status.hasUpdate && (
          <button
            onClick={handleUpdate}
            className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Available
          </button>
        )}

        <button
          onClick={handleNotificationToggle}
          className="w-full flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {notificationsEnabled ? (
            <>
              <BellOff className="w-4 h-4 mr-2" />
              Disable Notifications
            </>
          ) : (
            <>
              <Bell className="w-4 h-4 mr-2" />
              Enable Notifications
            </>
          )}
        </button>

        <button
          onClick={handleClearCache}
          disabled={isClearingCache}
          className="w-full flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isClearingCache ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Clearing...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cache
            </>
          )}
        </button>
      </div>

      {status.isInstalled && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center text-green-800">
            <Smartphone className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">App Installed</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PWAStatus;
