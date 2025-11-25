// Cross-Page Data Updates Module
import { useCallback } from 'react';
import {
  CrossPageData,
  IngestionData,
  ReconciliationData,
  AdjudicationData,
  AnalyticsData,
  SecurityData,
  ApiData,
} from './types';

export const useCrossPageDataUpdates = <T = unknown>(
  crossPageData: CrossPageData,
  setCrossPageData: React.Dispatch<React.SetStateAction<CrossPageData>>,
  checkPermission: (userId: string, resource: string, action: string) => boolean,
  logAuditEvent: (
    userId: string,
    action: string,
    resource: string,
    result: 'success' | 'failure',
    details?: Record<string, unknown>
  ) => void,
  encryptData: <TData>(data: TData, dataType: string) => TData & { _encrypted: boolean; _encryptionType: string; _encryptedAt: string },
  isSecurityEnabled: boolean,
  syncConnected: boolean,
  wsSyncData: () => void
) => {
  const updateCrossPageData = useCallback(
    (
      page: keyof CrossPageData,
      data:
        | IngestionData
        | ReconciliationData
        | AdjudicationData
        | AnalyticsData
        | SecurityData
        | ApiData
    ) => {
      // Check permission before updating data
      const hasPermission = checkPermission('current-user', page, 'update');
      if (!hasPermission) {
        logAuditEvent('current-user', 'unauthorized_update_attempt', page, 'failure', {
          page,
          data: typeof data === 'object' ? Object.keys(data as Record<string, unknown>) : 'unknown',
        });
        return;
      }

      // Encrypt sensitive data if security is enabled
      const processedData = isSecurityEnabled ? encryptData(data, page) : data;

      setCrossPageData((prev) => ({
        ...prev,
        [page]: {
          ...prev[page],
          ...(processedData as typeof data),
          lastUpdated: new Date(),
        },
      }));

      // Sync data via WebSocket if connected
      if (syncConnected) {
        wsSyncData();
      }

      // Log successful update
      logAuditEvent('current-user', 'update_cross_page_data', page, 'success', {
        page,
data: typeof data === 'object' ? Object.keys(data as unknown as Record<string, unknown>) : 'unknown',
      });
    },
    [
      checkPermission,
      logAuditEvent,
      encryptData,
      isSecurityEnabled,
      syncConnected,
      wsSyncData,
      setCrossPageData,
    ]
  );

  const subscribeToUpdates = useCallback((callback: (data: CrossPageData) => void) => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      callback(crossPageData);
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [crossPageData]);

  return {
    updateCrossPageData,
    subscribeToUpdates,
  };
};
