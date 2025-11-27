// ============================================================================
// RECONCILIATION MATCHES API HOOK (Enhanced with Redux)
// ============================================================================

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/unifiedStore';
import { reconciliationMatchesActions } from '../../store/unifiedStore';
import ApiService from '../../services/ApiService';
import { useNotificationHelpers } from '../../store/hooks';
import type { ReconciliationMatch } from '../../store/unifiedStore';

export const useReconciliationMatchesAPI = (projectId?: string) => {
  const dispatch = useAppDispatch();
  const {
    items: matches,
    isLoading,
    error,
    pagination,
  } = useAppSelector((state) => ({
    items: state.reconciliation.matches || [],
    isLoading: state.reconciliation.isLoading,
    error: state.reconciliation.error,
    pagination: { page: 1, limit: 20, total: (state.reconciliation.matches || []).length, totalPages: 1 },
  }));
  const { showSuccess, showError } = useNotificationHelpers();

  const fetchMatches = useCallback(
    async (
      params: {
        page?: number;
        per_page?: number;
        status?: string;
        min_confidence?: number;
        max_confidence?: number;
      } = {}
    ) => {
      if (!projectId) return;

      try {
        dispatch(reconciliationMatchesActions.fetchMatchesStart());
        const result = await ApiService.getReconciliationMatches(projectId, params);

        const isValidMatchArray = (data: unknown): data is ReconciliationMatch[] => {
          return Array.isArray(data) && data.every(item =>
            typeof item === 'object' && item !== null && 'id' in item
          );
        };

        const validMatches = isValidMatchArray(result.matches) ? result.matches : [];
        
        dispatch(
          reconciliationMatchesActions.fetchMatchesSuccess({
            matches: validMatches,
            pagination: result.pagination,
          })
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch reconciliation matches';
        dispatch(reconciliationMatchesActions.fetchMatchesFailure(errorMessage));
        showError('Failed to Load Matches', errorMessage);
      }
    },
    [projectId, dispatch, showError]
  );

  const createMatch = useCallback(
    async (matchData: {
      record_a_id: string;
      record_b_id: string;
      confidence_score: number;
      status?: string;
    }) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        const newMatch = await ApiService.createReconciliationMatch(projectId, {
          source_record_id: matchData.record_a_id,
          target_record_id: matchData.record_b_id,
          match_type: 'manual',
          confidence_score: matchData.confidence_score,
        });
        const isValidMatch = (data: unknown): data is ReconciliationMatch => {
          return typeof data === 'object' && data !== null && 'id' in data;
        };

        if (isValidMatch(newMatch)) {
          dispatch(reconciliationMatchesActions.createMatch(newMatch));
        }
        showSuccess('Match Created', 'Reconciliation match created successfully');

        return { success: true, match: newMatch };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create match';
        showError('Failed to Create Match', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, dispatch, showSuccess, showError]
  );

  const updateMatch = useCallback(
    async (
      matchId: string,
      matchData: {
        status?: string;
        confidence_score?: number;
        reviewed_by?: string;
      }
    ) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        const updatedMatch = await ApiService.updateReconciliationMatch(
          projectId,
          matchId,
          {
            match_type: undefined,
            confidence_score: matchData.confidence_score,
            status: matchData.status as 'matched' | 'unmatched' | 'discrepancy' | 'resolved' | undefined,
          }
        );
        const isValidMatch = (data: unknown): data is ReconciliationMatch => {
          return typeof data === 'object' && data !== null && 'id' in data;
        };

        if (isValidMatch(updatedMatch)) {
          dispatch(reconciliationMatchesActions.updateMatch(updatedMatch));
        }
        showSuccess('Match Updated', 'Reconciliation match updated successfully');

        return { success: true, match: updatedMatch };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update match';
        showError('Failed to Update Match', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, dispatch, showSuccess, showError]
  );

  const approveMatch = useCallback(
    async (matchId: string) => {
      try {
        const result = await ApiService.approveMatch(projectId!, matchId);
        dispatch(reconciliationMatchesActions.approveMatch(matchId));
        showSuccess('Match Approved', 'Reconciliation match approved successfully');

        return { success: true, match: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to approve match';
        showError('Failed to Approve Match', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, dispatch, showSuccess, showError]
  );

  const rejectMatch = useCallback(
    async (matchId: string) => {
      try {
        const result = await ApiService.rejectMatch(projectId!, matchId);
        dispatch(reconciliationMatchesActions.rejectMatch(matchId));
        showSuccess('Match Rejected', 'Reconciliation match rejected successfully');

        return { success: true, match: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to reject match';
        showError('Failed to Reject Match', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, dispatch, showSuccess, showError]
  );

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return {
    matches,
    isLoading,
    error,
    pagination,
    fetchMatches,
    createMatch,
    updateMatch,
    approveMatch,
    rejectMatch,
  };
};

