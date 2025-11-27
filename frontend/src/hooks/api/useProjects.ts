// Projects Hooks
'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, Project } from '../../services/apiClient';

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

