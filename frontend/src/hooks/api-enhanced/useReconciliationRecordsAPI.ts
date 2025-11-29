// ============================================================================
// RECONCILIATION RECORDS API HOOK (Enhanced with Redux)
// ============================================================================

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/unifiedStore';
import { reconciliationRecordsActions } from '@/store/unifiedStore';
import ApiService from '@/services/ApiService';
import { useNotificationHelpers } from '@/store/hooks';
import type { ReconciliationRecord } from '@/types/reconciliation/index';

export const useReconciliationRecordsAPI = (projectId?: string) => {
  const dispatch = useAppDispatch();
  const {
    items: records,
    isLoading,
    error,
    pagination,
  } = useAppSelector((state) => ({
    items: state.reconciliation.records,
    isLoading: state.reconciliation.isLoading,
    error: state.reconciliation.error,
    pagination: { page: 1, limit: 20, total: state.reconciliation.records.length, totalPages: 1 },
  }));
  const { showError } = useNotificationHelpers();

  const fetchRecords = useCallback(
    async (
      params: {
        page?: number;
        per_page?: number;
        status?: string;
        search?: string;
      } = {}
    ) => {
      if (!projectId) return;

      try {
        dispatch(reconciliationRecordsActions.fetchRecordsStart());
        const result = await ApiService.getReconciliationRecords(projectId, params);

        const isValidRecordArray = (data: unknown): data is ReconciliationRecord[] => {
          return Array.isArray(data) && data.every(item =>
            typeof item === 'object' && item !== null && 'id' in item
          );
        };

        const validRecords = isValidRecordArray(result.records) ? result.records : [];
        
        dispatch(
          reconciliationRecordsActions.fetchRecordsSuccess({
            records: validRecords,
            pagination: result.pagination,
          })
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch reconciliation records';
        dispatch(reconciliationRecordsActions.fetchRecordsFailure(errorMessage));
        showError('Failed to Load Records', errorMessage);
      }
    },
    [projectId, dispatch, showError]
  );

  const updateRecord = useCallback(
    async (recordId: string, recordData: Record<string, unknown>) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        // Update reconciliation record via API
        // Endpoint: /api/v1/reconciliation/records/{id} (PUT)
        const updatedRecord = await ApiService.updateReconciliationRecord(recordId, recordData);
        
        // Update Redux store with the updated record
        dispatch(reconciliationRecordsActions.updateRecord(updatedRecord));
        return { success: true, record: updatedRecord };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update reconciliation record';
        showError('Failed to Update Record', errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [projectId, dispatch, showError]
  );

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return {
    records,
    isLoading,
    error,
    pagination,
    fetchRecords,
    updateRecord,
  };
};

