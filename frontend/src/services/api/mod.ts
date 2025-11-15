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
import { logger } from '../logger';
import { getErrorMessageFromApiError } from '../../utils/errorExtraction';

/**
 * Unified API Service
 * Provides backward compatibility for existing code while delegating
 * to modular service classes
 */
export class ApiService {
  // Static instances of modular services
  private static authService = new AuthApiService();
  private static usersService = new UsersApiService();
  private static projectsService = new ProjectsApiService();
  private static reconciliationService = new ReconciliationApiService();
  private static filesService = new FilesApiService();

  // ============================================================================
  // AUTHENTICATION SERVICE
  // ============================================================================

  static async authenticate(email: string, password: string) {
    return ApiService.authService.authenticate(email, password);
  }

  static async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
  }) {
    return ApiService.authService.register(userData);
  }

  static async logout() {
    return ApiService.authService.logout();
  }

  static async getCurrentUser() {
    return ApiService.authService.getCurrentUser();
  }

  static async changePassword(passwordData: { currentPassword: string; newPassword: string }) {
    return ApiService.authService.changePassword(passwordData);
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
    return ApiService.usersService.getUsers(params);
  }

  static async getUserById(userId: string) {
    return ApiService.usersService.getUserById(userId);
  }

  static async createUser(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
  }) {
    return ApiService.usersService.createUser(userData);
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
    return ApiService.usersService.updateUser(userId, userData);
  }

  static async deleteUser(userId: string) {
    return ApiService.usersService.deleteUser(userId);
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
    return ApiService.projectsService.getProjects(params);
  }

  static async getProjectById(projectId: string) {
    return ApiService.projectsService.getProjectById(projectId);
  }

  static async createProject(projectData: {
    name: string;
    description?: string;
    settings?: unknown;
  }) {
    return ApiService.projectsService.createProject(projectData);
  }

  static async updateProject(
    projectId: string,
    projectData: {
      name?: string;
      description?: string;
      settings?: unknown;
    }
  ) {
    return ApiService.projectsService.updateProject(projectId, projectData);
  }

  static async deleteProject(projectId: string) {
    return ApiService.projectsService.deleteProject(projectId);
  }

  // ============================================================================
  // DATA SOURCE SERVICE
  // ============================================================================

  static async getDataSources(projectId: string) {
    return ApiService.filesService.getDataSources(projectId);
  }

  static async uploadFile(
    projectId: string,
    file: File,
    dataSourceName?: string
  ) {
    return ApiService.filesService.uploadFile(projectId, file, dataSourceName);
  }

  static async processFile(projectId: string, dataSourceId: string) {
    return ApiService.filesService.processFile(projectId, dataSourceId);
  }

  static async deleteDataSource(projectId: string, dataSourceId: string) {
    return ApiService.filesService.deleteDataSource(projectId, dataSourceId);
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
    return ApiService.reconciliationService.getReconciliationRecords(projectId, params);
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
    return ApiService.reconciliationService.getReconciliationMatches(projectId, params);
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
    return ApiService.reconciliationService.createReconciliationMatch(projectId, matchData);
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
    return ApiService.reconciliationService.updateReconciliationMatch(projectId, matchId, matchData);
  }

  static async approveMatch(projectId: string, matchId: string) {
    return ApiService.reconciliationService.approveMatch(projectId, matchId);
  }

  static async rejectMatch(projectId: string, matchId: string) {
    return ApiService.reconciliationService.rejectMatch(projectId, matchId);
  }

  static async getReconciliationJobs(projectId: string) {
    return ApiService.reconciliationService.getReconciliationJobs(projectId);
  }

  static async createReconciliationJob(
    projectId: string,
    jobData: {
      name: string;
      description?: string;
      config?: unknown;
    }
  ) {
    return ApiService.reconciliationService.createReconciliationJob(projectId, jobData);
  }

  static async startReconciliationJob(projectId: string, jobId: string) {
    return ApiService.reconciliationService.startReconciliationJob(projectId, jobId);
  }

  static async stopReconciliationJob(projectId: string, jobId: string) {
    return ApiService.reconciliationService.stopReconciliationJob(projectId, jobId);
  }

  static async deleteReconciliationJob(projectId: string, jobId: string) {
    return ApiService.reconciliationService.deleteReconciliationJob(projectId, jobId);
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
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || 'Health check failed';
        throw new Error(errorMessage);
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

