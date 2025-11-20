// ============================================================================
// UNIFIED API SERVICE - BACKWARD COMPATIBILITY LAYER
// ============================================================================
// This module provides a unified ApiService class that delegates to
// the modular API service classes for backward compatibility.

import { apiClient, wsClient } from '../apiClient';
import { AuthApiService } from './auth';
import { UsersApiService } from './users';
import { ProjectsApiService } from './projects';
import { ReconciliationApiService } from './reconciliation';
import { FilesApiService } from './files';
import { getErrorMessageFromApiError } from '../../utils/errorExtraction';

/**
 * Unified API Service
 * Provides backward compatibility for existing code while delegating
 * to modular service classes
 */
export class ApiService {
  // ============================================================================
  // AUTHENTICATION SERVICE
  // ============================================================================

  static async authenticate(email: string, password: string) {
    return AuthApiService.authenticate(email, password);
  }

  static async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
  }) {
    return AuthApiService.register(userData);
  }

  static async logout() {
    return AuthApiService.logout();
  }

  static async getCurrentUser() {
    return AuthApiService.getCurrentUser();
  }

  static async changePassword(passwordData: { currentPassword: string; newPassword: string }) {
    return AuthApiService.changePassword(passwordData);
  }

  // ============================================================================
  // USER MANAGEMENT SERVICE
  // ============================================================================

  static async getUsers(params: {
    page?: number;
    per_page?: number;
    search?: string;
    role?: string;
    status?: string;
  } = {}) {
    return UsersApiService.getUsers(params);
  }

  static async getUserById(userId: string) {
    return UsersApiService.getUserById(userId);
  }

  static async createUser(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
  }) {
    return UsersApiService.createUser(userData);
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
    return UsersApiService.updateUser(userId, userData);
  }

  static async deleteUser(userId: string) {
    return UsersApiService.deleteUser(userId);
  }

  // ============================================================================
  // PROJECT MANAGEMENT SERVICE
  // ============================================================================

  static async getProjects(params: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
  } = {}) {
    return ProjectsApiService.getProjects(params);
  }

  static async getProjectById(projectId: string) {
    return ProjectsApiService.getProjectById(projectId);
  }

  static async createProject(projectData: {
    name: string;
    description?: string;
    settings?: unknown;
  }) {
    return ProjectsApiService.createProject(projectData as any);
  }

  static async updateProject(
    projectId: string,
    projectData: {
      name?: string;
      description?: string;
      settings?: unknown;
    }
  ) {
    return ProjectsApiService.updateProject(projectId, projectData as any);
  }

  static async deleteProject(projectId: string) {
    return ProjectsApiService.deleteProject(projectId);
  }

  // ============================================================================
  // DATA SOURCE SERVICE
  // ============================================================================

  static async getDataSources(projectId: string) {
    return ProjectsApiService.getDataSources(projectId);
  }

  static async uploadFile(
    projectId: string,
    file: File,
    dataSourceName?: string
  ) {
    return FilesApiService.uploadFile(projectId, file);
  }

  static async processFile(projectId: string, dataSourceId: string) {
    return FilesApiService.processFile(projectId, dataSourceId);
  }

  static async deleteDataSource(projectId: string, dataSourceId: string) {
    return ProjectsApiService.deleteDataSource(projectId, dataSourceId);
  }

  // ============================================================================
  // RECONCILIATION SERVICE
  // ============================================================================

  static async getReconciliationRecords(
    projectId: string,
    params: {
      page?: number;
      per_page?: number;
      search?: string;
      status?: string;
      match_type?: string;
    } = {}
  ) {
    return ReconciliationApiService.getReconciliationRecords(projectId, params);
  }

  static async getReconciliationMatches(
    projectId: string,
    params: {
      page?: number;
      per_page?: number;
      match_type?: string;
      status?: string;
    } = {}
  ) {
    return ReconciliationApiService.getReconciliationMatches(projectId, params);
  }

  static async createReconciliationMatch(
    projectId: string,
    matchData: {
      source_record_id: string;
      target_record_id: string;
      match_type: 'exact' | 'fuzzy' | 'manual';
      confidence_score?: number;
    }
  ) {
    return ReconciliationApiService.createReconciliationMatch(projectId, matchData);
  }

  static async updateReconciliationMatch(
    projectId: string,
    matchId: string,
    matchData: {
      match_type?: 'exact' | 'fuzzy' | 'manual';
      confidence_score?: number;
      status?: 'matched' | 'unmatched' | 'discrepancy' | 'resolved';
    }
  ) {
    return ReconciliationApiService.updateReconciliationMatch(projectId, matchId, matchData);
  }

  static async approveMatch(projectId: string, matchId: string) {
    return ReconciliationApiService.approveMatch(projectId, matchId);
  }

  static async rejectMatch(projectId: string, matchId: string) {
    return ReconciliationApiService.rejectMatch(projectId, matchId);
  }

  static async getReconciliationJobs(projectId: string) {
    return ReconciliationApiService.getReconciliationJobs(projectId);
  }

  static async createReconciliationJob(
    projectId: string,
    jobData: {
      name: string;
      description?: string;
      config?: unknown;
    }
  ) {
    throw new Error('This method is deprecated and does not support the new API requirements (source IDs). Please use ReconciliationApiService directly.');
  }

  static async startReconciliationJob(projectId: string, jobId: string) {
    return apiClient.startReconciliationJob(projectId, jobId);
  }

  static async stopReconciliationJob(projectId: string, jobId: string) {
    return ReconciliationApiService.stopReconciliationJob(jobId);
  }

  static async deleteReconciliationJob(projectId: string, jobId: string) {
    return apiClient.deleteReconciliationJob(projectId, jobId);
  }

  // ============================================================================
  // ANALYTICS SERVICE
  // ============================================================================

  static async getDashboardData() {
    try {
      const response = await apiClient.getDashboardData();
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
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
        throw new Error(getErrorMessageFromApiError(response.error));
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
        throw new Error(getErrorMessageFromApiError(response.error));
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
        throw new Error(getErrorMessageFromApiError(response.error));
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
