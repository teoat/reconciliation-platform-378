// React Hooks for File Upload and Reconciliation
import { useState, useCallback } from 'react';
import {
  fileReconciliationService,
  DataSource,
  ReconciliationResult,
  ProjectAnalytics,
} from '../services/fileReconciliationService';
import { ApiResponse } from '../services/apiClient';
import { getErrorMessageFromApiError } from '@/utils/common/errorHandling';

// File Upload Hook
export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File, projectId: string, onProgress?: (progress: number) => void) => {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      try {
        const response = await fileReconciliationService.uploadFile(file, projectId, (progress) => {
          setUploadProgress(progress);
          onProgress?.(progress);
        });

        if (response.error) {
          const errorMsg = getErrorMessageFromApiError(response.error);
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }

        return { success: true, dataSource: response.data };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    []
  );

  return {
    uploadFile,
    isUploading,
    uploadProgress,
    error,
    clearError: () => setError(null),
  };
};

// Project Files Hook
export const useProjectFiles = (projectId: string | null) => {
  const [files, setFiles] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fileReconciliationService.getFilesForProject(projectId);

      if (response.error) {
        setError(getErrorMessageFromApiError(response.error));
      } else {
        setFiles(response.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const deleteFile = useCallback(
    async (fileId: string) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      setIsLoading(true);
      setError(null);

      try {
        const response = await fileReconciliationService.deleteFile(projectId, fileId);

        if (response.error) {
          const errorMsg = getErrorMessageFromApiError(response.error);
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }

        setFiles((prev) => prev.filter((file) => file.id !== fileId));
        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  return {
    files,
    isLoading,
    error,
    fetchFiles,
    deleteFile,
    refetch: fetchFiles,
  };
};

// Reconciliation Hook
export const useReconciliation = (projectId: string | null) => {
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startReconciliation = useCallback(
    async (fileIdA: string, fileIdB: string) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      setIsRunning(true);
      setError(null);

      try {
        const response = await fileReconciliationService.startReconciliation(
          projectId,
          fileIdA,
          fileIdB
        );

        if (response.error) {
          const errorMsg = getErrorMessageFromApiError(response.error);
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }

        setResults(response.data || []);
        return { success: true, results: response.data };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Reconciliation failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsRunning(false);
      }
    },
    [projectId]
  );

  const fetchResults = useCallback(async () => {
    if (!projectId) return;

    setIsRunning(true);
    setError(null);

    try {
      const response = await fileReconciliationService.getReconciliationResults(projectId);

      if (response.error) {
        setError(getErrorMessageFromApiError(response.error));
      } else {
        setResults(response.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
    } finally {
      setIsRunning(false);
    }
  }, [projectId]);

  return {
    results,
    isRunning,
    error,
    startReconciliation,
    fetchResults,
    refetch: fetchResults,
  };
};

// Project Analytics Hook
export const useProjectAnalytics = (projectId: string | null) => {
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fileReconciliationService.getProjectAnalytics(projectId);

      if (response.error) {
        setError(getErrorMessageFromApiError(response.error));
      } else {
        setAnalytics(response.data || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  return {
    analytics,
    isLoading,
    error,
    fetchAnalytics,
    refetch: fetchAnalytics,
  };
};

import type { DashboardData } from '@/types/backend-aligned';

// Dashboard Hook
export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fileReconciliationService.getDashboardData();

      if (response.error) {
        setError(getErrorMessageFromApiError(response.error));
      } else {
        setDashboardData(response.data as unknown as DashboardData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    dashboardData,
    isLoading,
    error,
    fetchDashboardData,
    refetch: fetchDashboardData,
  };
};

// System Status Hook
export const useSystemStatus = () => {
  const [status, setStatus] = useState<{
    status: string;
    uptime: string;
    version: string;
    timestamp: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fileReconciliationService.getSystemStatus();

      if (response.error) {
        setError(getErrorMessageFromApiError(response.error));
      } else {
        setStatus(response.data || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    status,
    isLoading,
    error,
    fetchStatus,
    refetch: fetchStatus,
  };
};

// Health Check Hook
export const useHealthCheck = () => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const response = await fileReconciliationService.healthCheck();
      setIsHealthy(response.success && !response.error);
      setLastChecked(new Date());
    } catch (error) {
      setIsHealthy(false);
      setLastChecked(new Date());
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    isHealthy,
    isChecking,
    lastChecked,
    checkHealth,
  };
};
