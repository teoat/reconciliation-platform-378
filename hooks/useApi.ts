// React Hooks for API Integration
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, wsClient, ApiResponse, User, Project, IngestionJob, ReconciliationRecord } from '../services/apiClient';

// Authentication Hook
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.getCurrentUser();
        if (response.data) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.login({ email, password });
      if (response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: response.error?.message };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName?: string;
    role?: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await apiClient.register(userData);
      if (response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: response.error?.message };
      }
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  };
};

// Projects Hook
export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchProjects = useCallback(async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getProjects(params);
      if (response.data) {
        setProjects(response.data.projects);
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
        setProjects(prev => [response.data!.project, ...prev]);
        return { success: true, project: response.data.project };
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

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.updateProject(id, updates);
      if (response.data) {
        setProjects(prev => 
          prev.map(project => 
            project.id === id ? response.data!.project : project
          )
        );
        return { success: true, project: response.data.project };
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

// Project Hook
export const useProject = (id: string | null) => {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getProject(id);
      if (response.data) {
        setProject(response.data.project);
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

// Ingestion Jobs Hook
export const useIngestionJobs = () => {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchJobs = useCallback(async (params?: {
    page?: number;
    limit?: number;
    projectId?: string;
    status?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getIngestionJobs(params);
      if (response.data) {
        setJobs(response.data.jobs);
        setPagination(response.data.pagination);
      } else {
        setError(response.error?.message || 'Failed to fetch ingestion jobs');
      }
    } catch (err) {
      setError('Failed to fetch ingestion jobs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadFile = useCallback(async (
    file: File,
    projectId: string,
    dataSourceId?: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.uploadFile(file, projectId, dataSourceId);
      if (response.data) {
        setJobs(prev => [response.data!.ingestionJob, ...prev]);
        return { success: true, job: response.data.ingestionJob };
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

  const processData = useCallback(async (jobId: string, options?: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.processData(jobId, options);
      if (response.data) {
        setJobs(prev => 
          prev.map(job => 
            job.id === jobId ? response.data!.job : job
          )
        );
        return { success: true, job: response.data.job, records: response.data.records };
      } else {
        setError(response.error?.message || 'Failed to process data');
        return { success: false, error: response.error?.message };
      }
    } catch (err) {
      setError('Failed to process data');
      return { success: false, error: 'Failed to process data' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    jobs,
    isLoading,
    error,
    pagination,
    fetchJobs,
    uploadFile,
    processData,
  };
};

// WebSocket Hook
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

// Real-time Collaboration Hook
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

// Health Check Hook
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
