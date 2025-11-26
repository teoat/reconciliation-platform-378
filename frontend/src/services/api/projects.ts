// ============================================================================
// PROJECT MANAGEMENT API SERVICE
// ============================================================================

import { apiClient } from '../apiClient';
import type { Project } from '../../types/backend-aligned';
import type { ProjectSettings } from '../../types/index';
import { getErrorMessageFromApiError } from '../../utils/errorExtraction';

export class ProjectsApiService {
  static async getProjects(
    params: {
      page?: number;
      per_page?: number;
      search?: string;
      status?: string;
    } = {}
  ) {
    try {
      const { page = 1, per_page = 20, search, status } = params;
      let response;

      if (search) {
        // searchProjects doesn't exist, use getProjects with search params
        response = await apiClient.get(`/api/projects?search=${encodeURIComponent(search)}&page=${page}&per_page=${per_page}`);
      } else {
        response = await apiClient.get(`/api/projects?page=${page}&per_page=${per_page}`);
      }

      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }

      let projects = response.data?.data || [];
      if (status) {
        projects = projects.filter((p: Project) => p.status === status);
      }

      return {
        projects,
        pagination: response.data?.pagination || {
          page,
          per_page,
          total: projects.length,
          total_pages: Math.ceil(projects.length / per_page),
        },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch projects');
    }
  }

  static async getProjectById(projectId: string) {
    try {
      const response = await apiClient.getProjectById(projectId);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch project');
    }
  }

  static async createProject(projectData: {
    name: string;
    description?: string;
    settings?: ProjectSettings;
  }) {
    try {
      const response = await apiClient.createProject(projectData);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create project');
    }
  }

  static async updateProject(
    projectId: string,
    projectData: {
      name?: string;
      description?: string;
      settings?: ProjectSettings;
      status?: string;
    }
  ) {
    try {
      const response = await apiClient.updateProject(projectId, projectData);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update project');
    }
  }

  static async deleteProject(projectId: string) {
    try {
      const response = await apiClient.deleteProject(projectId);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return true;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete project');
    }
  }

  static async getProjectSettings(projectId: string) {
    try {
      const response = await apiClient.get(`/api/projects/${projectId}/settings`);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch project settings');
    }
  }

  static async updateProjectSettings(projectId: string, settings: ProjectSettings) {
    try {
      const response = await apiClient.post(`/api/projects/${projectId}/settings`, settings);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update project settings');
    }
  }

  static async getDataSources(projectId: string) {
    try {
      const response = await apiClient.getDataSources(projectId);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch data sources');
    }
  }

  static async createDataSource(
    projectId: string,
    dataSourceData: {
      name: string;
      type: string;
      config: Record<string, unknown>;
    }
  ) {
    try {
      // createDataSource doesn't exist - use uploadFile or another method
      // For now, throw an error indicating this needs to be implemented
      throw new Error('createDataSource is not yet implemented. Use uploadFile instead.');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create data source');
    }
  }

  static async deleteDataSource(projectId: string, dataSourceId: string) {
    try {
      const response = await apiClient.deleteDataSource(projectId, dataSourceId);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return true;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete data source');
    }
  }

  static async getProjectStats(projectId: string) {
    try {
      const response = await apiClient.getProjectStats(projectId);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch project stats');
    }
  }
}
