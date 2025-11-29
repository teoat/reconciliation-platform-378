// Projects Hooks
'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, Project } from '@/services/apiClient';
import { getErrorMessageFromApiError } from '@/utils/common/errorHandling';

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
      // getProjects expects (page, perPage) but we have params object
      const page = params?.page || 1;
      const perPage = params?.limit || 10;
      const response = await apiClient.getProjects(page, perPage);
      if (response.data) {
        // PaginatedResponse has items, not projects
        const paginatedData = response.data as { items: Project[]; total: number; page: number; per_page: number; total_pages: number };
        setProjects(paginatedData.items);
        setPagination({
          page: paginatedData.page,
          limit: paginatedData.per_page,
          total: paginatedData.total,
          pages: paginatedData.total_pages,
        });
      } else {
        setError(getErrorMessageFromApiError(response.error) || 'Failed to fetch projects');
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
    settings?: Record<string, unknown>;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.createProject(projectData);
      if (response.data) {
        // Response is BackendProject directly, not wrapped in project property
        const project = response.data as Project;
        setProjects(prev => [project, ...prev]);
        return { success: true, project };
      } else {
        const errorMsg = getErrorMessageFromApiError(response.error) || 'Failed to create project';
        setError(errorMsg);
        return { success: false, error: errorMsg };
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
        // Response is BackendProject directly
        const updatedProject = response.data as Project;
        setProjects(prev => 
          prev.map(project => 
            project.id === id ? updatedProject : project
          )
        );
        return { success: true, project: updatedProject };
      } else {
        const errorMsg = getErrorMessageFromApiError(response.error) || 'Failed to update project';
        setError(errorMsg);
        return { success: false, error: errorMsg };
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
        const errorMsg = getErrorMessageFromApiError(response.error) || 'Failed to delete project';
        setError(errorMsg);
        return { success: false, error: errorMsg };
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
      // Use getProjectById instead of getProject
      const response = await apiClient.getProjectById(id);
      if (response.data) {
        // Response is BackendProject directly
        setProject(response.data as Project);
      } else {
        setError(getErrorMessageFromApiError(response.error) || 'Failed to fetch project');
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

