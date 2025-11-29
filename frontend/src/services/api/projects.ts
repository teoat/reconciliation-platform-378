// ============================================================================
// PROJECT MANAGEMENT API SERVICE
// ============================================================================

import { apiClient } from '../apiClient';
import { BaseApiService, type PaginatedResult } from './BaseApiService';
import type { Project } from '../../types/backend-aligned';
import type { ProjectSettings } from '../../types/index';
import { getErrorMessageFromApiError } from '@/utils/common/errorHandling';
import type { ErrorHandlingResult } from '../errorHandling';

/**
 * Project Management API Service
 * 
 * Handles all project-related API operations including fetching, creating, updating,
 * and deleting projects. Supports project settings, data sources, and statistics.
 * 
 * @example
 * ```typescript
 * const result = await ProjectsApiService.getProjects({ page: 1, per_page: 20 });
 * const projects = result.projects;
 * ```
 */
export class ProjectsApiService extends BaseApiService {
  /**
   * Fetches a paginated list of projects with optional filtering and search.
   * 
   * @param params - Query parameters
   * @param params.page - Page number (default: 1)
   * @param params.per_page - Items per page (default: 20)
   * @param params.search - Search query to filter projects by name
   * @param params.status - Filter projects by status
   * @returns Promise resolving to projects list and pagination info
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * const result = await ProjectsApiService.getProjects({
   *   page: 1,
   *   per_page: 20,
   *   status: 'active'
   * });
   * ```
   */
  static async getProjects(
    params: {
      page?: number;
      per_page?: number;
      search?: string;
      status?: string;
    } = {}
  ): Promise<ErrorHandlingResult<PaginatedResult<Project> & { projects: Project[] }>> {
    return this.withErrorHandling(
      async () => {
        const { page = 1, per_page = 20, search, status } = params;
        const cacheKey = `projects:${JSON.stringify(params)}`;

        const result = await this.getCached(
          cacheKey,
          async () => {
            let response: ApiResponse<unknown>;
            if (search) {
              response = await apiClient.get(`/api/projects?search=${encodeURIComponent(search)}&page=${page}&per_page=${per_page}`);
            } else {
              response = await apiClient.get(`/api/projects?page=${page}&per_page=${per_page}`);
            }

            const paginated = this.transformPaginatedResponse<Project>(
              response as ApiResponse<{ data?: Project[]; items?: Project[]; pagination?: unknown }>
            );

            // Filter by status if provided
            let projects = paginated.items;
            if (status) {
              projects = projects.filter((p: Project) => p.status === status);
            }

            return {
              projects,
              items: projects,
              pagination: paginated.pagination,
            };
          },
          600000 // 10 minutes TTL
        );

        return result;
      },
      {
        component: 'ProjectsApiService',
        action: 'getProjects',
      }
    );
  }

  /**
   * Fetches a single project by ID.
   * 
   * @param projectId - Project ID to fetch
   * @returns Promise resolving to project data
   * @throws {Error} If project not found or request fails
   * 
   * @example
   * ```typescript
   * const project = await ProjectsApiService.getProjectById('project-123');
   * ```
   */
  static async getProjectById(projectId: string): Promise<ErrorHandlingResult<Project>> {
    return this.withErrorHandling(
      async () => {
        const cacheKey = `project:${projectId}`;
        return this.getCached(
          cacheKey,
          async () => {
            const response = await apiClient.getProjectById(projectId);
            return this.transformResponse<Project>(response);
          },
          600000 // 10 minutes TTL
        );
      },
      {
        component: 'ProjectsApiService',
        action: 'getProjectById',
        projectId
      }
    );
  }

  /**
   * Creates a new project.
   * 
   * @param projectData - Project creation data
   * @param projectData.name - Project name (required)
   * @param projectData.description - Project description (optional)
   * @param projectData.settings - Project settings (optional)
   * @returns Promise resolving to created project data
   * @throws {Error} If validation fails, name exists, or request fails
   * 
   * @example
   * ```typescript
   * const project = await ProjectsApiService.createProject({
   *   name: 'New Project',
   *   description: 'Project description',
   *   settings: { autoSave: true }
   * });
   * ```
   */
  static async createProject(projectData: {
    name: string;
    description?: string;
    settings?: ProjectSettings;
  }): Promise<ErrorHandlingResult<Project>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.createProject(projectData);
        const result = this.transformResponse<Project>(response);

        // Invalidate projects cache
        await this.invalidateCache('projects:*');

        return result;
      },
      {
        component: 'ProjectsApiService',
        action: 'createProject'
      }
    );
  }

  /**
   * Updates an existing project's information.
   * 
   * @param projectId - Project ID to update
   * @param projectData - Project data to update (all fields optional)
   * @param projectData.name - New project name
   * @param projectData.description - New description
   * @param projectData.settings - New settings
   * @param projectData.status - New status
   * @returns Promise resolving to updated project data
   * @throws {Error} If project not found, validation fails, or request fails
   * 
   * @example
   * ```typescript
   * const updated = await ProjectsApiService.updateProject('project-123', {
   *   name: 'Updated Name',
   *   status: 'archived'
   * });
   * ```
   */
  static async updateProject(
    projectId: string,
    projectData: {
      name?: string;
      description?: string;
      settings?: ProjectSettings;
      status?: string;
    }
  ): Promise<ErrorHandlingResult<Project>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.updateProject(projectId, projectData);
        const result = this.transformResponse<Project>(response);

        // Invalidate project and projects cache
        await this.invalidateCache(`project:${projectId}`);
        await this.invalidateCache('projects:*');

        return result;
      },
      {
        component: 'ProjectsApiService',
        action: 'updateProject',
        projectId
      }
    );
  }

  /**
   * Deletes a project.
   * 
   * @param projectId - Project ID to delete
   * @returns Promise resolving to true if deletion successful
   * @throws {Error} If project not found, permission denied, or request fails
   * 
   * @example
   * ```typescript
   * await ProjectsApiService.deleteProject('project-123');
   * ```
   */
  static async deleteProject(projectId: string): Promise<ErrorHandlingResult<boolean>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.deleteProject(projectId);
        if (response.error) {
          throw new Error(getErrorMessageFromApiError(response.error));
        }

        // Invalidate project and projects cache
        await this.invalidateCache(`project:${projectId}`);
        await this.invalidateCache('projects:*');

        return true;
      },
      {
        component: 'ProjectsApiService',
        action: 'deleteProject',
        projectId
      }
    );
  }

  /**
   * Fetches project settings.
   * 
   * @param projectId - Project ID
   * @returns Promise resolving to project settings
   * @throws {Error} If project not found or request fails
   * 
   * @example
   * ```typescript
   * const settings = await ProjectsApiService.getProjectSettings('project-123');
   * ```
   */
  static async getProjectSettings(projectId: string): Promise<ErrorHandlingResult<ProjectSettings>> {
    return this.withErrorHandling(
      async () => {
        const cacheKey = `project:${projectId}:settings`;
        return this.getCached(
          cacheKey,
          async () => {
            const response = await apiClient.get(`/api/projects/${projectId}/settings`);
            return this.transformResponse<ProjectSettings>(response);
          },
          300000 // 5 minutes TTL
        );
      },
      {
        component: 'ProjectsApiService',
        action: 'getProjectSettings',
        projectId
      }
    );
  }

  /**
   * Updates project settings.
   * 
   * @param projectId - Project ID
   * @param settings - New settings to apply
   * @returns Promise resolving to updated settings
   * @throws {Error} If project not found, validation fails, or request fails
   * 
   * @example
   * ```typescript
   * const updated = await ProjectsApiService.updateProjectSettings('project-123', {
   *   autoSave: true,
   *   notifications: false
   * });
   * ```
   */
  static async updateProjectSettings(projectId: string, settings: ProjectSettings): Promise<ErrorHandlingResult<ProjectSettings>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.post(`/api/projects/${projectId}/settings`, settings);
        const result = this.transformResponse<ProjectSettings>(response);

        // Invalidate project settings cache
        await this.invalidateCache(`project:${projectId}:settings`);
        await this.invalidateCache(`project:${projectId}`);

        return result;
      },
      {
        component: 'ProjectsApiService',
        action: 'updateProjectSettings',
        projectId
      }
    );
  }

  /**
   * Fetches data sources for a project.
   * 
   * @param projectId - Project ID
   * @returns Promise resolving to data sources list
   * @throws {Error} If project not found or request fails
   * 
   * @example
   * ```typescript
   * const dataSources = await ProjectsApiService.getDataSources('project-123');
   * ```
   */
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

  /**
   * Creates a new data source for a project.
   * 
   * **NOTE**: This method is not yet implemented. Use `uploadFile` or `FilesApiService.uploadFile` instead.
   * 
   * @param projectId - Project ID
   * @param dataSourceData - Data source creation data
   * @param dataSourceData.name - Data source name
   * @param dataSourceData.type - Data source type
   * @param dataSourceData.config - Data source configuration
   * @returns Promise resolving to created data source
   * @throws {Error} Always throws - method not implemented (use uploadFile instead)
   * 
   * @example
   * ```typescript
   * // This method is not implemented - use uploadFile instead:
   * await FilesApiService.uploadFile(projectId, file, { name: 'data-source-name' });
   * ```
   * 
   * @deprecated This method is not implemented. Use `FilesApiService.uploadFile` instead.
   */
  static async createDataSource(
    projectId: string,
    dataSourceData: {
      name: string;
      type: string;
      config: Record<string, unknown>;
    }
  ): Promise<never> {
    // This method is intentionally not implemented
    // Use FilesApiService.uploadFile instead for file-based data sources
    throw new Error(
      'createDataSource is not yet implemented. Use FilesApiService.uploadFile instead.'
    );
  }

  /**
   * Deletes a data source from a project.
   * 
   * @param projectId - Project ID
   * @param dataSourceId - Data source ID to delete
   * @returns Promise resolving to true if deletion successful
   * @throws {Error} If data source not found or request fails
   * 
   * @example
   * ```typescript
   * await ProjectsApiService.deleteDataSource('project-123', 'data-source-456');
   * ```
   */
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

  /**
   * Fetches project statistics including reconciliation metrics.
   * 
   * @param projectId - Project ID
   * @returns Promise resolving to project statistics
   * @throws {Error} If project not found or request fails
   * 
   * @example
   * ```typescript
   * const stats = await ProjectsApiService.getProjectStats('project-123');
   * // Returns: { totalRecords, matchedRecords, unmatchedRecords, confidenceScore }
   * ```
   */
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
