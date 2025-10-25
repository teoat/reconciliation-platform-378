// React Hooks for API Integration
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  apiClient, 
  wsClient, 
  ApiResponse, 
  BackendUser,
  BackendProject, 
  BackendDataSource,
  BackendReconciliationRecord,
  BackendReconciliationMatch,
  BackendReconciliationJob,
  PaginatedResponse
} from '../services/apiClient';

// ============================================================================
// PROJECTS HOOK
// ============================================================================

export const useProjects = () => {
  const [projects, setProjects] = useState<BackendProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
  });

  const fetchProjects = useCallback(async (params?: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getProjects(params?.page || 1, params?.per_page || 10);
      if (response.data) {
        setProjects(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.error?.message || 'Failed to fetch projects');
      }
    } catch (err) {
      setError('Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(async (projectData: {
    name: string;
    description?: string;
    settings?: any;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.createProject(projectData);
      if (response.data) {
        setProjects(prev => [response.data!, ...prev]);
        return { success: true, project: response.data };
      } else {
        setError(response.error?.message || 'Failed to create project');
        return { success: false, error: response.error?.message };
      }
    } catch (err) {
      setError('Failed to create project');
      return { success: false, error: 'Failed to create project' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<BackendProject>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.updateProject(id, updates);
      if (response.data) {
        setProjects(prev => 
          prev.map(project => 
            project.id === id ? response.data! : project
          )
        );
        return { success: true, project: response.data };
      } else {
        setError(response.error?.message || 'Failed to update project');
        return { success: false, error: response.error?.message };
      }
    } catch (err) {
      setError('Failed to update project');
      return { success: false, error: 'Failed to update project' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.deleteProject(id);
      if (!response.error) {
        setProjects(prev => prev.filter(project => project.id !== id));
        return { success: true };
      } else {
        setError(response.error.message || 'Failed to delete project');
        return { success: false, error: response.error.message };
      }
    } catch (err) {
      setError('Failed to delete project');
      return { success: false, error: 'Failed to delete project' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    projects,
    isLoading,
    error,
    pagination,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};

// ============================================================================
// PROJECT HOOK
// ============================================================================

export const useProject = (id: string | null) => {
  const [project, setProject] = useState<BackendProject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getProjectById(id);
      if (response.data) {
        setProject(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch project');
      }
    } catch (err) {
      setError('Failed to fetch project');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    project,
    isLoading,
    error,
    refetch: fetchProject,
  };
};

// ============================================================================
// DATA SOURCES HOOK
// ============================================================================

export const useDataSources = (projectId: string | null) => {
  const [dataSources, setDataSources] = useState<BackendDataSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDataSources = useCallback(async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getDataSources(projectId);
      if (response.data) {
        setDataSources(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch data sources');
      }
    } catch (err) {
      setError('Failed to fetch data sources');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const uploadFile = useCallback(async (
    file: File,
    projectId: string,
    name: string,
    sourceType: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.uploadFile(projectId, file, {
        project_id: projectId,
        name,
        source_type: sourceType
      });
      if (response.data) {
        setDataSources(prev => [response.data!, ...prev]);
        return { success: true, dataSource: response.data };
      } else {
        setError(response.error?.message || 'Failed to upload file');
        return { success: false, error: response.error?.message };
      }
    } catch (err) {
      setError('Failed to upload file');
      return { success: false, error: 'Failed to upload file' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processFile = useCallback(async (dataSourceId: string) => {
    if (!projectId) return { success: false, error: 'No project ID' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.processFile(projectId, dataSourceId);
      if (response.data) {
        return { success: true, result: response.data };
      } else {
        setError(response.error?.message || 'Failed to process file');
        return { success: false, error: response.error?.message };
      }
    } catch (err) {
      setError('Failed to process file');
      return { success: false, error: 'Failed to process file' };
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDataSources();
  }, [fetchDataSources]);

  return {
    dataSources,
    isLoading,
    error,
    fetchDataSources,
    uploadFile,
    processFile,
  };
};

// ============================================================================
// RECONCILIATION RECORDS HOOK
// ============================================================================

export const useReconciliationRecords = (projectId: string | null) => {
  const [records, setRecords] = useState<BackendReconciliationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
  });

  const fetchRecords = useCallback(async (params?: {
    page?: number;
    per_page?: number;
  }) => {
    if (!projectId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getReconciliationRecords(
        projectId, 
        params?.page || 1, 
        params?.per_page || 10
      );
      if (response.data) {
        setRecords(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.error?.message || 'Failed to fetch reconciliation records');
      }
    } catch (err) {
      setError('Failed to fetch reconciliation records');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return {
    records,
    isLoading,
    error,
    pagination,
    fetchRecords,
  };
};

// ============================================================================
// RECONCILIATION MATCHES HOOK
// ============================================================================

export const useReconciliationMatches = (projectId: string | null) => {
  const [matches, setMatches] = useState<BackendReconciliationMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
  });

  const fetchMatches = useCallback(async (params?: {
    page?: number;
    per_page?: number;
  }) => {
    if (!projectId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getReconciliationMatches(
        projectId, 
        params?.page || 1, 
        params?.per_page || 10
      );
      if (response.data) {
        setMatches(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.error?.message || 'Failed to fetch reconciliation matches');
      }
    } catch (err) {
      setError('Failed to fetch reconciliation matches');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const createMatch = useCallback(async (matchData: Partial<BackendReconciliationMatch>) => {
    if (!projectId) return { success: false, error: 'No project ID' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.createReconciliationMatch(projectId, matchData);
      if (response.data) {
        setMatches(prev => [response.data!, ...prev]);
        return { success: true, match: response.data };
      } else {
        setError(response.error?.message || 'Failed to create match');
        return { success: false, error: response.error?.message };
      }
    } catch (err) {
      setError('Failed to create match');
      return { success: false, error: 'Failed to create match' };
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const updateMatch = useCallback(async (matchId: string, updates: Partial<BackendReconciliationMatch>) => {
    if (!projectId) return { success: false, error: 'No project ID' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.updateReconciliationMatch(projectId, matchId, updates);
      if (response.data) {
        setMatches(prev => 
          prev.map(match => 
            match.id === matchId ? response.data! : match
          )
        );
        return { success: true, match: response.data };
      } else {
        setError(response.error?.message || 'Failed to update match');
        return { success: false, error: response.error?.message };
      }
    } catch (err) {
      setError('Failed to update match');
      return { success: false, error: 'Failed to update match' };
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

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
  };
};

// ============================================================================
// RECONCILIATION JOBS HOOK
// ============================================================================

export const useReconciliationJobs = (projectId: string | null) => {
  const [jobs, setJobs] = useState<BackendReconciliationJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getReconciliationJobs(projectId);
      if (response.data) {
        setJobs(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch reconciliation jobs');
      }
    } catch (err) {
      setError('Failed to fetch reconciliation jobs');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const createJob = useCallback(async (jobData: Partial<BackendReconciliationJob>) => {
    if (!projectId) return { success: false, error: 'No project ID' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.createReconciliationJob(projectId, jobData);
      if (response.data) {
        setJobs(prev => [response.data!, ...prev]);
        return { success: true, job: response.data };
      } else {
        setError(response.error?.message || 'Failed to create reconciliation job');
        return { success: false, error: response.error?.message };
      }
    } catch (err) {
      setError('Failed to create reconciliation job');
      return { success: false, error: 'Failed to create reconciliation job' };
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const startJob = useCallback(async (jobId: string) => {
    if (!projectId) return { success: false, error: 'No project ID' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.startReconciliationJob(projectId, jobId);
      if (response.data) {
        setJobs(prev => 
          prev.map(job => 
            job.id === jobId ? response.data! : job
          )
        );
        return { success: true, job: response.data };
      } else {
        setError(response.error?.message || 'Failed to start reconciliation job');
        return { success: false, error: response.error?.message };
      }
    } catch (err) {
      setError('Failed to start reconciliation job');
      return { success: false, error: 'Failed to start reconciliation job' };
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

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
  };
};

// ============================================================================
// WEBSOCKET HOOK
// ============================================================================

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<typeof wsClient | null>(null);

  const connect = useCallback(async (token?: string) => {
    try {
      setConnectionStatus('connecting');
      await wsClient.connect(token);
      setIsConnected(true);
      setConnectionStatus('connected');
      wsRef.current = wsClient;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setIsConnected(false);
      setConnectionStatus('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    wsClient.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    wsRef.current = null;
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current) {
      wsRef.current.send(type, data);
    }
  }, []);

  const onMessage = useCallback((eventType: string, handler: Function) => {
    if (wsRef.current) {
      wsRef.current.on(eventType, handler);
    }
  }, []);

  const offMessage = useCallback((eventType: string, handler: Function) => {
    if (wsRef.current) {
      wsRef.current.off(eventType, handler);
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

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

// ============================================================================
// REAL-TIME COLLABORATION HOOK
// ============================================================================

export const useRealtimeCollaboration = (page: string) => {
  const { isConnected, sendMessage, onMessage, offMessage } = useWebSocket();
  const [activeUsers, setActiveUsers] = useState<Array<{
    id: string;
    name: string;
    page: string;
    lastSeen: string;
  }>>([]);
  const [liveComments, setLiveComments] = useState<Array<{
    id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: string;
    page: string;
  }>>([]);

  // Send user presence updates
  const updatePresence = useCallback((userId: string, userName: string) => {
    sendMessage('user:join', {
      page,
      userId,
      userName,
    });
  }, [sendMessage, page]);

  // Send live comments
  const sendComment = useCallback((userId: string, userName: string, message: string) => {
    sendMessage('comment:add', {
      page,
      userId,
      userName,
      message,
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage, page]);

  // Handle incoming messages
  useEffect(() => {
    const handlePresenceUpdate = (data: any) => {
      setActiveUsers(prev => {
        const existing = prev.find(u => u.id === data.userId);
        if (existing) {
          return prev.map(u => 
            u.id === data.userId 
              ? { ...u, lastSeen: data.timestamp }
              : u
          );
        } else {
          return [...prev, {
            id: data.userId,
            name: data.userName,
            page: data.page,
            lastSeen: data.timestamp,
          }];
        }
      });
    };

    const handleCommentAdded = (data: any) => {
      if (data.page === page) {
        setLiveComments(prev => {
          const exists = prev.find(c => c.id === data.id);
          if (!exists) {
            return [...prev, data];
          }
          return prev;
        });
      }
    };

    const handleUserLeft = (data: any) => {
      setActiveUsers(prev => prev.filter(u => u.id !== data.userId));
    };

    if (isConnected) {
      onMessage('user:presence', handlePresenceUpdate);
      onMessage('comment:added', handleCommentAdded);
      onMessage('user:left', handleUserLeft);
    }

    return () => {
      offMessage('user:presence', handlePresenceUpdate);
      offMessage('comment:added', handleCommentAdded);
      offMessage('user:left', handleUserLeft);
    };
  }, [isConnected, page, onMessage, offMessage]);

  // Send periodic presence updates
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        updatePresence('current-user', 'Current User');
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, updatePresence]);

  return {
    isConnected,
    activeUsers: activeUsers.filter(u => u.page === page),
    liveComments: liveComments.filter(c => c.page === page),
    sendComment,
    updatePresence,
  };
};

// ============================================================================
// HEALTH CHECK HOOK
// ============================================================================

export const useHealthCheck = () => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const response = await apiClient.healthCheck();
      setIsHealthy(!response.error);
      setLastChecked(new Date());
    } catch (error) {
      setIsHealthy(false);
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
    checkHealth,
  };
};