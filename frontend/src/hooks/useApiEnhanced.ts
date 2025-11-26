import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/services/logger';
import { toRecord } from '../utils/typeHelpers';
import { useAppDispatch, useAppSelector } from '../store/unifiedStore';
import {
  authActions,
  projectsActions,
  dataSourcesActions,
  reconciliationRecordsActions,
  reconciliationMatchesActions,
  reconciliationJobsActions,
  notificationsActions,
  uiActions,
  createProject as createProjectThunk,
  updateProject as updateProjectThunk,
  deleteProject as deleteProjectThunk,
} from '../store/unifiedStore';
import ApiService from '../services/ApiService';
import { useNotificationHelpers } from '../store/hooks';
import type { ReconciliationResultDetail, ReconciliationJob } from '../types/backend-aligned';
import type { ReconciliationRecord } from '../types/reconciliation';
import type { ReconciliationMatch } from '../store/unifiedStore';
import type { UploadedFile as IngestionUploadedFile } from '../types/ingestion';
import type { UploadedFile } from '../types/backend-aligned';

// ============================================================================
// ENHANCED API HOOKS WITH REDUX INTEGRATION
// ============================================================================

// ============================================================================
// AUTHENTICATION HOOKS
// ============================================================================

export const useAuthAPI = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);
  const { showSuccess, showError } = useNotificationHelpers();

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        dispatch(authActions.loginStart());
        const authData = await ApiService.authenticate(email, password);

        dispatch(authActions.loginSuccess((authData as any).user));
        showSuccess('Login Successful', 'Welcome back!');

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        dispatch(authActions.loginFailure(errorMessage));
        showError('Login Failed', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [dispatch, showSuccess, showError]
  );

  const register = useCallback(
    async (userData: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      role?: string;
    }) => {
      try {
        dispatch(authActions.loginStart());
        const authData = await ApiService.register(userData);

        dispatch(authActions.loginSuccess((authData.data as any)!.user));
        showSuccess('Registration Successful - Account created successfully!');

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        dispatch(authActions.loginFailure(errorMessage));
        showError(`Registration Failed - ${errorMessage}`);

        return { success: false, error: errorMessage };
      }
    },
    [dispatch, showSuccess, showError]
  );

  const logout = useCallback(async () => {
    try {
      await ApiService.logout();
      dispatch(authActions.logout());
      showSuccess('Logged Out', 'You have been logged out successfully');
    } catch (error) {
      logger.error('Logout error:', toRecord(error));
      dispatch(authActions.logout()); // Still logout locally even if API call fails
    }
  }, [dispatch, showSuccess]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await ApiService.getCurrentUser();
      dispatch(authActions.updateUser(userData));
    } catch (error) {
      logger.error('Refresh user failed:', toRecord(error));
      dispatch(authActions.logout());
    }
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
    clearError: () => dispatch(authActions.clearError()),
  };
};

// ============================================================================
// PROJECTS API HOOKS
// ============================================================================

export const useProjectsAPI = () => {
  const dispatch = useAppDispatch();
  const {
    projects,
    isLoading,
    error,
  } = useAppSelector((state) => state.projects);
  const { showSuccess, showError } = useNotificationHelpers();

  const fetchProjects = useCallback(
    async (
      params: {
        page?: number;
        per_page?: number;
        search?: string;
        status?: string;
      } = {}
    ) => {
      try {
        dispatch(projectsActions.fetchProjectsStart());
        const result = await ApiService.getProjects(params);

        dispatch(
          projectsActions.fetchProjectsSuccess({
            projects: result.projects,
            pagination: result.pagination,
          })
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
        dispatch(projectsActions.fetchProjectsFailure(errorMessage));
        showError('Failed to Load Projects', errorMessage);
      }
    },
    [dispatch, showError]
  );

  const createProject = useCallback(
    async (projectData: {
      name: string;
      description?: string;
      settings?: Record<string, unknown>;
      status?: string;
    }) => {
      try {
        const newProject = await ApiService.createProject(projectData);
        // Project is already added via createProject thunk in unifiedStore
        // No need to dispatch additional action
        showSuccess('Project Created', `Project "${newProject.name}" created successfully`);

        return { success: true, project: newProject };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
        showError('Failed to Create Project', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [dispatch, showSuccess, showError]
  );

  const updateProject = useCallback(
    async (
      projectId: string,
      projectData: {
        name?: string;
        description?: string;
        settings?: Record<string, unknown>;
        status?: string;
        is_active?: boolean;
      }
    ) => {
      try {
        const updatedProject = await ApiService.updateProject(projectId, projectData);
        // Project is already updated via updateProject thunk in unifiedStore
        // No need to dispatch additional action
        showSuccess('Project Updated', `Project "${updatedProject.name}" updated successfully`);

        return { success: true, project: updatedProject };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
        showError('Failed to Update Project', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [dispatch, showSuccess, showError]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      try {
        const result = await dispatch(deleteProjectThunk(projectId));
        if (deleteProjectThunk.fulfilled.match(result)) {
          showSuccess('Project Deleted', 'Project deleted successfully');
          return { success: true };
        } else {
          throw new Error(result.payload as string || 'Failed to delete project');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
        showError('Failed to Delete Project', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [dispatch, showSuccess, showError]
  );

  return {
    projects,
    isLoading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};

// ============================================================================
// DATA SOURCES API HOOKS
// ============================================================================

export const useDataSourcesAPI = (projectId?: string) => {
  const dispatch = useAppDispatch();
  const {
    uploadedFiles: dataSources,
    isLoading,
    error,
    uploadProgress,
  } = useAppSelector((state) => state.dataIngestion);
  const { showSuccess, showError } = useNotificationHelpers();

  const fetchDataSources = useCallback(async () => {
    if (!projectId) return;

    try {
      dispatch(dataSourcesActions.fetchDataSourcesStart());
      const sources = await ApiService.getDataSources(projectId);
      // Convert FileInfo[] to UploadedFile[] format (backend-aligned)
      const uploadedFiles: UploadedFile[] = sources.map((file) => ({
        id: file.id,
        project_id: file.project_id,
        filename: file.filename,
        original_filename: file.filename,
        file_size: file.file_size,
        content_type: file.content_type,
        file_path: file.file_path || '',
        status: (file.status as UploadedFile['status']) || 'uploaded',
        uploaded_by: file.uploaded_by,
        created_at: file.created_at,
        updated_at: file.updated_at,
      }));

      dispatch(dataSourcesActions.fetchDataSourcesSuccess(uploadedFiles));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data sources';
      dispatch(dataSourcesActions.fetchDataSourcesFailure(errorMessage));
      showError('Failed to Load Data Sources', errorMessage);
    }
  }, [projectId, dispatch, showError]);

  const uploadFile = useCallback(
    async (
      file: File,
      metadata: {
        name: string;
        source_type: string;
      }
    ) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        const fileId = `${file.name}-${Date.now()}`;
        dispatch(dataSourcesActions.uploadFileStart());

        const response = await ApiService.uploadFile(projectId, file, metadata.name);
        // Convert FileUploadResponse to UploadedFile format (backend-aligned)
        const uploadedFile: UploadedFile = {
          id: response.id,
          project_id: projectId,
          filename: response.name,
          original_filename: file.name,
          file_size: response.file_size,
          content_type: response.source_type,
          file_path: '', // Will be set by backend
          status: (response.status as UploadedFile['status']) || 'uploaded',
          uploaded_by: '', // Will be set by backend
          created_at: response.uploaded_at || new Date().toISOString(),
          updated_at: response.uploaded_at || new Date().toISOString(),
        };

        dispatch(dataSourcesActions.uploadFileSuccess(uploadedFile));
        showSuccess('File Uploaded', `File "${file.name}" uploaded successfully`);

        return { success: true, dataSource: uploadedFile };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
        dispatch(
          dataSourcesActions.uploadFileFailure({
            fileId: `${file.name}-${Date.now()}`,
            error: errorMessage,
          })
        );
        showError('Upload Failed', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, dispatch, showSuccess, showError]
  );

  const processFile = useCallback(
    async (dataSourceId: string) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        dispatch(dataSourcesActions.processFileStart());
        const result = await ApiService.processFile(projectId, dataSourceId);
        // processFile returns { message: string }, but we need UploadedFile
        // For now, we'll skip the success dispatch or find the file from state
        // dispatch(dataSourcesActions.processFileSuccess(result));
        showSuccess('File Processed', 'File processed successfully');

        return { success: true, result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
        dispatch(
          dataSourcesActions.processFileFailure({
            dataSourceId,
            error: errorMessage,
          })
        );
        showError('Processing Failed', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, dispatch, showSuccess, showError]
  );

  const deleteDataSource = useCallback(
    async (dataSourceId: string) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        await ApiService.deleteDataSource(projectId, dataSourceId);
        showSuccess('Data Source Deleted', 'Data source deleted successfully');

        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete data source';
        showError('Delete Failed', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, showSuccess, showError]
  );

  useEffect(() => {
    fetchDataSources();
  }, [fetchDataSources]);

  return {
    dataSources,
    isLoading,
    error,
    uploadProgress,
    fetchDataSources,
    uploadFile,
    processFile,
    deleteDataSource,
  };
};

// ============================================================================
// RECONCILIATION RECORDS API HOOKS
// ============================================================================

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

        dispatch(
          reconciliationRecordsActions.fetchRecordsSuccess({
            records: result.records as unknown as ReconciliationRecord[],
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
        // This would need to be implemented in the API service
        // const updatedRecord = await ApiService.updateReconciliationRecord(projectId, recordId, recordData)
        // dispatch(reconciliationRecordsActions.updateRecord(updatedRecord))

        return { success: true };
        // eslint-disable-next-line no-unreachable
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update record';
        showError('Update Failed', errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [projectId, showError]
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

// ============================================================================
// RECONCILIATION MATCHES API HOOKS
// ============================================================================

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

        dispatch(
          reconciliationMatchesActions.fetchMatchesSuccess({
            matches: result.matches as unknown as ReconciliationMatch[],
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
        dispatch(reconciliationMatchesActions.createMatch(newMatch as unknown as ReconciliationMatch));
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
        dispatch(reconciliationMatchesActions.updateMatch(updatedMatch as unknown as ReconciliationMatch));
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

// ============================================================================
// RECONCILIATION JOBS API HOOKS
// ============================================================================

export const useReconciliationJobsAPI = (projectId?: string) => {
  const dispatch = useAppDispatch();
  const { items: jobs, isLoading, error } = useAppSelector((state) => ({
    items: state.reconciliation.jobs,
    isLoading: state.reconciliation.isLoading,
    error: state.reconciliation.error,
  }));
  const { showSuccess, showError } = useNotificationHelpers();

  const fetchJobs = useCallback(async () => {
    if (!projectId) return;

    try {
      dispatch(reconciliationJobsActions.fetchJobsStart());
      const response = await ApiService.getReconciliationJobs(projectId);
      const jobsList = Array.isArray(response) ? response : (response as any).data || response;

      dispatch(reconciliationJobsActions.fetchJobsSuccess(jobsList as ReconciliationJob[]));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch reconciliation jobs';
      dispatch(reconciliationJobsActions.fetchJobsFailure(errorMessage));
      showError('Failed to Load Jobs', errorMessage);
    }
  }, [projectId, dispatch, showError]);

  const createJob = useCallback(
    async (jobData: {
      settings?: Record<string, unknown>;
      priority?: string;
      description?: string;
    }) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        const newJob = await ApiService.createReconciliationJob(projectId, {
          name: 'Reconciliation Job',
          description: jobData.description,
          config: jobData.settings,
        });
        // Note: createReconciliationJob is deprecated and throws an error
        // This code path should not be reached, but we handle it gracefully
        logger.warn('createReconciliationJob is deprecated - use ReconciliationApiService directly');
        showSuccess('Job Created', 'Reconciliation job created successfully');

        return { success: true, job: newJob };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create job';
        showError('Failed to Create Job', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, dispatch, showSuccess, showError]
  );

  const startJob = useCallback(
    async (jobId: string) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        const updatedJob = await ApiService.startReconciliationJob(projectId, jobId);
        dispatch(reconciliationJobsActions.startJob(jobId));
        showSuccess('Job Started', 'Reconciliation job started successfully');

        return { success: true, job: updatedJob };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to start job';
        showError('Failed to Start Job', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, dispatch, showSuccess, showError]
  );

  const stopJob = useCallback(
    async (jobId: string) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        const updatedJob = await ApiService.stopReconciliationJob(projectId, jobId);
        showSuccess('Job Stopped', 'Reconciliation job stopped successfully');

        return { success: true, job: updatedJob };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to stop job';
        showError('Failed to Stop Job', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, showSuccess, showError]
  );

  const deleteJob = useCallback(
    async (jobId: string) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        await ApiService.deleteReconciliationJob(projectId, jobId);
        showSuccess('Job Deleted', 'Reconciliation job deleted successfully');

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete job';
        showError('Failed to Delete Job', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, showSuccess, showError]
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    isLoading,
    error,
    fetchJobs,
    createJob,
    startJob,
    stopJob,
    deleteJob,
  };
};

// ============================================================================
// ANALYTICS API HOOKS
// ============================================================================

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
      setDashboardData(data as unknown as Record<string, unknown>);
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
        setProjectStats(stats as unknown as Record<string, unknown>);
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
      setReconciliationStats(stats as unknown as Record<string, unknown>);
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

// ============================================================================
// HEALTH CHECK API HOOKS
// ============================================================================

export const useHealthCheckAPI = () => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      setIsChecking(true);
      setError(null);
      const result = await ApiService.healthCheck();
      setIsHealthy(result.status === 'ok');
      setLastChecked(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Health check failed';
      setIsHealthy(false);
      setError(errorMessage);
      setLastChecked(new Date());
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();

    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    isHealthy,
    isChecking,
    lastChecked,
    error,
    checkHealth,
  };
};

// ============================================================================
// WEBSOCKET API HOOKS
// ============================================================================

export const useWebSocketAPI = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected');
  const { showSuccess, showError } = useNotificationHelpers();

  const connect = useCallback(
    async (token?: string) => {
      try {
        setConnectionStatus('connecting');
        await ApiService.connectWebSocket(token);
        setIsConnected(true);
        setConnectionStatus('connected');
        showSuccess('WebSocket Connected', 'Real-time updates enabled');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'WebSocket connection failed';
        setIsConnected(false);
        setConnectionStatus('error');
        showError('WebSocket Connection Failed', errorMessage);
      }
    },
    [showSuccess, showError]
  );

  const disconnect = useCallback(() => {
    ApiService.disconnectWebSocket();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((type: string, data: Record<string, unknown>) => {
    ApiService.sendWebSocketMessage(type, data);
  }, []);

  const onMessage = useCallback((eventType: string, handler: (data: unknown) => void) => {
    ApiService.onWebSocketMessage(eventType, handler);
  }, []);

  const offMessage = useCallback((eventType: string, handler: (data: unknown) => void) => {
    ApiService.offWebSocketMessage(eventType, handler);
  }, []);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    onMessage,
    offMessage,
  };
};
