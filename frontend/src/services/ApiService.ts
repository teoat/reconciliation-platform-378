import { apiClient, wsClient } from './apiClient';
import { logger } from '@/services/logger';
import { FileUploadResponse } from './apiClient/types';
import { ReconciliationRecord, DashboardData, ReconciliationStats } from '../types/index';
import type { ReconciliationMatch } from '../store/unifiedStore';
import type { Project } from '../types/backend-aligned';
import type { ProjectSettings } from '../types/index';

// ============================================================================
// API SERVICE LAYER - HIGH-LEVEL API OPERATIONS
// ============================================================================

export class ApiService {
  // ============================================================================
  // AUTHENTICATION SERVICE
  // ============================================================================

  static async authenticate(email: string, password: string) {
    try {
      const response = await apiClient.login({ email, password });
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Authentication failed');
    }
  }

  static async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
  }) {
    try {
      const response = await apiClient.register(userData);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  static async logout() {
    try {
      await apiClient.logout();
    } catch (error) {
      logger.error('Logout error:', error);
    }
  }

  static async getCurrentUser() {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get current user');
    }
  }

  static async changePassword(passwordData: { currentPassword: string; newPassword: string }) {
    try {
      const response = await apiClient.post('/api/auth/change-password', passwordData);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to change password');
    }
  }

  // ============================================================================
  // USER MANAGEMENT SERVICE
  // ============================================================================

  static async getUsers(
    params: {
      page?: number;
      per_page?: number;
      search?: string;
      role?: string;
      status?: string;
    } = {}
  ) {
    try {
      const { page = 1, per_page = 20, search, role, status } = params;

      let response;
      if (search) {
        response = await apiClient.searchUsers(search, page, per_page);
      } else {
        response = await apiClient.getUsers(page, per_page);
      }

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Filter by role and status if provided
      let users = response.data?.data || [];
      if (role) {
        users = users.filter((user: { role: string }) => user.role === role);
      }
      if (status) {
        users = users.filter(
          (user: { is_active: boolean }) => user.is_active === (status === 'active')
        );
      }

      return {
        users,
        pagination: response.data?.pagination || {
          page,
          per_page,
          total: users.length,
          total_pages: Math.ceil(users.length / per_page),
        },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch users');
    }
  }

  static async getUserById(userId: string) {
    try {
      const response = await apiClient.getUserById(userId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch user');
    }
  }

  static async createUser(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
  }) {
    try {
      const response = await apiClient.createUser(userData);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create user');
    }
  }

  static async updateUser(
    userId: string,
    userData: {
      email?: string;
      first_name?: string;
      last_name?: string;
      role?: string;
      is_active?: boolean;
    }
  ) {
    try {
      const response = await apiClient.updateUser(userId, userData);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update user');
    }
  }

  static async deleteUser(userId: string) {
    try {
      const response = await apiClient.deleteUser(userId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return true;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  }

  // ============================================================================
  // PROJECT MANAGEMENT SERVICE
  // ============================================================================

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

      const response = await apiClient.getProjects(page, per_page);
      if (response.error) {
        throw new Error(response.error.message);
      }

      let projects = response.data?.data || [];

      // Filter by search term
      if (search) {
        projects = projects.filter(
          (project: Project) =>
            project.name.toLowerCase().includes(search.toLowerCase()) ||
            project.description?.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Filter by status
      if (status) {
        projects = projects.filter((project: Project) => project.status === status);
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
        throw new Error(response.error.message);
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
    status?: string;
  }) {
    try {
      const response = await apiClient.createProject(projectData);
      if (response.error) {
        throw new Error(response.error.message);
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
      is_active?: boolean;
    }
  ) {
    try {
      const response = await apiClient.updateProject(projectId, projectData);
      if (response.error) {
        throw new Error(response.error.message);
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
        throw new Error(response.error.message);
      }
      return true;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete project');
    }
  }

  // ============================================================================
  // DATA SOURCE SERVICE
  // ============================================================================

  static async getDataSources(projectId: string) {
    try {
      const response = await apiClient.getDataSources(projectId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data || [];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch data sources');
    }
  }

  static async uploadFile(
    projectId: string,
    file: File,
    metadata: {
      name: string;
      source_type: string;
    }
  ) {
    try {
      const response = await apiClient.uploadFile(projectId, file, {
        project_id: projectId,
        name: metadata.name,
        source_type: metadata.source_type,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to upload file');
    }
  }

  static async processFile(projectId: string, dataSourceId: string) {
    try {
      const response = await apiClient.processFile(projectId, dataSourceId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to process file');
    }
  }

  static async deleteDataSource(projectId: string, dataSourceId: string) {
    try {
      const response = await apiClient.deleteDataSource(projectId, dataSourceId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return true;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete data source');
    }
  }

  // ============================================================================
  // RECONCILIATION SERVICE
  // ============================================================================

  static async getReconciliationRecords(
    projectId: string,
    params: {
      page?: number;
      per_page?: number;
      status?: string;
      search?: string;
    } = {}
  ) {
    try {
      const { page = 1, per_page = 20, status, search } = params;

      const response = await apiClient.getReconciliationRecords(projectId, page, per_page);
      if (response.error) {
        throw new Error(response.error.message);
      }

      let records = response.data?.data || [];

      // Filter by status
      if (status) {
        records = records.filter((record: ReconciliationRecord) => record.status === status);
      }

      // Filter by search term
      if (search) {
        records = records.filter((record: ReconciliationRecord) =>
          JSON.stringify(record).toLowerCase().includes(search.toLowerCase())
        );
      }

      return {
        records,
        pagination: response.data?.pagination || {
          page,
          per_page,
          total: records.length,
          total_pages: Math.ceil(records.length / per_page),
        },
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch reconciliation records'
      );
    }
  }

  static async getReconciliationMatches(
    projectId: string,
    params: {
      page?: number;
      per_page?: number;
      status?: string;
      min_confidence?: number;
      max_confidence?: number;
    } = {}
  ) {
    try {
      const { page = 1, per_page = 20, status, min_confidence, max_confidence } = params;

      const response = await apiClient.getReconciliationMatches(projectId, page, per_page);
      if (response.error) {
        throw new Error(response.error.message);
      }

      let matches = response.data?.data || [];

      // Filter by status
      if (status) {
        matches = matches.filter((match: ReconciliationMatch) => match.status === status);
      }

      // Filter by confidence score
      if (min_confidence !== undefined) {
        matches = matches.filter(
          (match: ReconciliationMatch) => match.confidence_score >= min_confidence
        );
      }
      if (max_confidence !== undefined) {
        matches = matches.filter(
          (match: ReconciliationMatch) => match.confidence_score <= max_confidence
        );
      }

      return {
        matches,
        pagination: response.data?.pagination || {
          page,
          per_page,
          total: matches.length,
          total_pages: Math.ceil(matches.length / per_page),
        },
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch reconciliation matches'
      );
    }
  }

  static async createReconciliationMatch(
    projectId: string,
    matchData: {
      record_a_id: string;
      record_b_id: string;
      confidence_score: number;
      status?: string;
    }
  ) {
    try {
      const response = await apiClient.createReconciliationMatch(projectId, matchData);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create reconciliation match'
      );
    }
  }

  static async updateReconciliationMatch(
    projectId: string,
    matchId: string,
    matchData: {
      status?: string;
      confidence_score?: number;
      reviewed_by?: string;
    }
  ) {
    try {
      const response = await apiClient.updateReconciliationMatch(projectId, matchId, matchData);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update reconciliation match'
      );
    }
  }

  static async approveMatch(projectId: string, matchId: string) {
    return this.updateReconciliationMatch(projectId, matchId, {
      status: 'approved',
      reviewed_by: 'current_user', // This should be replaced with actual user ID
    });
  }

  static async rejectMatch(projectId: string, matchId: string) {
    return this.updateReconciliationMatch(projectId, matchId, {
      status: 'rejected',
      reviewed_by: 'current_user', // This should be replaced with actual user ID
    });
  }

  // ============================================================================
  // RECONCILIATION JOB SERVICE
  // ============================================================================

  static async getReconciliationJobs(projectId: string) {
    try {
      const response = await apiClient.getReconciliationJobs(projectId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data || [];
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch reconciliation jobs'
      );
    }
  }

  static async createReconciliationJob(
    projectId: string,
    jobData: {
      settings?: ProjectSettings;
      priority?: string;
      description?: string;
    }
  ) {
    try {
      const response = await apiClient.createReconciliationJob(projectId, {
        project_id: projectId,
        status: 'pending',
        progress: 0,
        settings: jobData.settings || {},
        ...jobData,
      });
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create reconciliation job'
      );
    }
  }

  static async startReconciliationJob(projectId: string, jobId: string) {
    try {
      const response = await apiClient.startReconciliationJob(projectId, jobId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to start reconciliation job'
      );
    }
  }

  static async stopReconciliationJob(projectId: string, jobId: string) {
    try {
      const response = await apiClient.stopReconciliationJob(projectId, jobId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to stop reconciliation job');
    }
  }

  static async deleteReconciliationJob(projectId: string, jobId: string) {
    try {
      const response = await apiClient.deleteReconciliationJob(projectId, jobId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return true;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete reconciliation job'
      );
    }
  }

  // ============================================================================
  // ANALYTICS SERVICE
  // ============================================================================

  static async getDashboardData() {
    try {
      const response = await apiClient.getDashboardData();
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
    }
  }

  static async getProjectStats(projectId: string) {
    try {
      const response = await apiClient.getProjectStats(projectId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch project stats');
    }
  }

  static async getReconciliationStats() {
    try {
      const response = await apiClient.getReconciliationStats();
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch reconciliation stats'
      );
    }
  }

  // ============================================================================
  // HEALTH CHECK SERVICE
  // ============================================================================

  static async healthCheck() {
    try {
      const response = await apiClient.healthCheck();
      if (!response.success || response.error) {
        throw new Error(response.error?.message || 'Health check failed');
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Health check failed');
    }
  }

  // ============================================================================
  // WEBSOCKET SERVICE
  // ============================================================================

  static async connectWebSocket(token?: string) {
    try {
      await wsClient.connect(token);
      return true;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'WebSocket connection failed');
    }
  }

  static disconnectWebSocket() {
    wsClient.disconnect();
  }

  static sendWebSocketMessage(type: string, data: Record<string, unknown>) {
    wsClient.send(type, data);
  }

  static onWebSocketMessage(eventType: string, handler: (data: unknown) => void) {
    wsClient.on(eventType, handler);
  }

  static offWebSocketMessage(eventType: string, handler?: (data: unknown) => void) {
    wsClient.off(eventType, handler);
  }
}

export default ApiService;
