// Sync & Validation Module
import { useCallback, useState } from 'react';
import {
  SyncStatus,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  Notification,
  CrossPageData,
} from './types';

export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSyncTime: new Date(),
    pendingChanges: [],
    syncErrors: [],
  });

  const performDataSync = useCallback(
    async (
      addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
    ): Promise<void> => {
      try {
        // Simulate sync process
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setSyncStatus((prev) => ({
          ...prev,
          lastSyncTime: new Date(),
          pendingChanges: [],
          syncErrors: [],
        }));

        addNotification({
          type: 'success',
          title: 'Data Synchronized',
          message: 'All data has been synchronized successfully',
          page: 'system',
          isRead: false,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Sync failed';
        setSyncStatus((prev) => ({
          ...prev,
          syncErrors: [
            ...prev.syncErrors,
            {
              id: `sync-error-${Date.now()}`,
              message: errorMessage,
              page: 'system',
              timestamp: new Date(),
              retryCount: 0,
            },
          ],
        }));

        addNotification({
          type: 'error',
          title: 'Sync Failed',
          message: 'Failed to synchronize data',
          page: 'system',
          isRead: false,
        });

        throw err;
      }
    },
    []
  );

  const updateOnlineStatus = useCallback((isOnline: boolean) => {
    setSyncStatus((prev) => ({ ...prev, isOnline }));
  }, []);

  return {
    syncStatus,
    performDataSync,
    updateOnlineStatus,
  };
};

export const useDataValidation = (crossPageData: CrossPageData) => {
  const validateCrossPageData = useCallback(
    (fromPage: string, toPage: string): ValidationResult => {
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      const suggestions: Array<{
        field: string;
        currentValue: unknown;
        suggestedValue: unknown;
        reason: string;
        confidence: number;
      }> = [];

      // Add validation logic based on page transitions
      if (fromPage === 'ingestion' && toPage === 'reconciliation') {
        const ingestionData = crossPageData.ingestion;
        if (ingestionData.files.length === 0) {
          errors.push({
            field: 'files',
            message: 'No files uploaded for processing',
            severity: 'error',
            page: 'ingestion',
          });
        }

        if (ingestionData.qualityMetrics.overall < 0.8) {
          warnings.push({
            field: 'quality',
            message: 'Data quality is below recommended threshold',
            page: 'ingestion',
          });
        }
      }

      if (fromPage === 'reconciliation' && toPage === 'review') {
        const reconciliationData = crossPageData.reconciliation;
        if (reconciliationData.discrepancies.length > 0) {
          warnings.push({
            field: 'discrepancies',
            message: `${reconciliationData.discrepancies.length} discrepancies remain unresolved`,
            page: 'reconciliation',
          });
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
      };
    },
    [crossPageData]
  );

  return {
    validateCrossPageData,
  };
};
