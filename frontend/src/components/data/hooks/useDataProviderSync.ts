// Data Provider Sync Hook
import React, { useEffect } from 'react';
import { useSyncStatus } from '../sync';

export const useDataProviderSync = (updateOnlineStatus: (isOnline: boolean) => void) => {
  const { syncStatus, performDataSync, updateOnlineStatus: updateStatus } = useSyncStatus();

  // Sync with notifications
  const syncData = React.useCallback(async () => {
    await performDataSync(() => {}); // We'll pass addNotification from parent
  }, [performDataSync]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      updateStatus(true);
      syncData();
    };

    const handleOffline = () => {
      updateStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncData, updateStatus]);

  return {
    syncStatus,
    syncData,
    performDataSync,
  };
};
