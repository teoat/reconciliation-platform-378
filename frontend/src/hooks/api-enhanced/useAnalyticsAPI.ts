// ============================================================================
// ANALYTICS API HOOK (Enhanced with Redux)
// ============================================================================

import { useCallback, useState } from 'react';
import ApiService from '../../services/ApiService';
import { useNotificationHelpers } from '../../store/hooks';

export const useAnalyticsAPI = () => {
  const [dashboardData, setDashboardData] = useState<Record<string, unknown> | null>(null);
  const [projectStats, setProjectStats] = useState<Record<string, unknown> | null>(null);
  const [reconciliationStats, setReconciliationStats] = useState<Record<string, unknown> | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useNotificationHelpers();

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ApiService.getDashboardData();
      const isValidDashboardData = (data: unknown): data is Record<string, unknown> => {
        return typeof data === 'object' && data !== null;
      };
      
      setDashboardData(isValidDashboardData(data) ? data : {});
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      showError('Failed to Load Dashboard', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  const fetchProjectStats = useCallback(
    async (projectId: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const stats = await ApiService.getProjectStats(projectId);
        const isValidStats = (data: unknown): data is Record<string, unknown> => {
          return typeof data === 'object' && data !== null;
        };
        
        setProjectStats(isValidStats(stats) ? stats : {});
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch project stats';
        setError(errorMessage);
        showError('Failed to Load Project Stats', errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [showError]
  );

  const fetchReconciliationStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const stats = await ApiService.getReconciliationStats();
      const isValidStats = (data: unknown): data is Record<string, unknown> => {
        return typeof data === 'object' && data !== null;
      };
      
      setReconciliationStats(isValidStats(stats) ? stats : {});
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch reconciliation stats';
      setError(errorMessage);
      showError('Failed to Load Reconciliation Stats', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  return {
    dashboardData,
    projectStats,
    reconciliationStats,
    isLoading,
    error,
    fetchDashboardData,
    fetchProjectStats,
    fetchReconciliationStats,
  };
};

