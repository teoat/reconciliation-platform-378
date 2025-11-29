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
import { getErrorMessageFromApiError } from '@/utils/common/errorHandling';

/**
 * Unified API Service
 * Provides backward compatibility for existing code while delegating
 * to modular service classes
 */
export class ApiService {
  // ============================================================================
  // AUTHENTICATION SERVICE
  // ============================================================================

  /**
   * Authenticates a user with email and password.
   *
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to authentication response with token and user data
   * @throws {ApiError} If authentication fails (invalid credentials, user not found, etc.)
   *
   * @example
   * ```typescript
   * try {
   *   const response = await ApiService.authenticate('user@example.com', 'password123');
   *   if (response.success) {
   *     // Store token and redirect to dashboard
   *     localStorage.setItem('token', response.data.token);
   *   }
   * } catch (error) {
   *   logger.error('Authentication failed', { error });
   * }
   * ```
   */
  static async authenticate(email: string, password: string) {
    return AuthApiService.authenticate(email, password);
  }

  /**
   * Registers a new user account.
   *
   * @param userData - User registration data
   * @param userData.email - User's email address (must be unique)
   * @param userData.password - User's password (min 8 characters)
   * @param userData.first_name - User's first name
   * @param userData.last_name - User's last name
   * @param userData.role - Optional user role (default: 'user')
   * @returns Promise resolving to registration response with user data
   * @throws {ApiError} If registration fails (email exists, validation error, etc.)
   *
   * @example
   * ```typescript
   * const response = await ApiService.register({
   *   email: 'newuser@example.com',
   *   password: 'securePassword123',
   *   first_name: 'John',
   *   last_name: 'Doe',
   *   role: 'analyst'
   * });
   * ```
   */
  static async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
  }) {
    return AuthApiService.register(userData);
  }

  /**
   * Logs out the current user and invalidates the session token.
   *
   * @returns Promise resolving when logout is complete
   *
   * @example
   * ```typescript
   * await ApiService.logout();
   * localStorage.removeItem('token');
   * navigate('/login');
   * ```
   */
  static async logout() {
    return AuthApiService.logout();
  }

  /**
   * Gets the currently authenticated user's information.
   *
   * @returns Promise resolving to current user data
   * @throws {ApiError} If user is not authenticated or token is invalid
   *
   * @example
   * ```typescript
   * const user = await ApiService.getCurrentUser();
   * logger.info(`Welcome, ${user.data.first_name}!`);
   * ```
   */
  static async getCurrentUser() {
    return AuthApiService.getCurrentUser();
  }

  /**
   * Changes the password for the currently authenticated user.
   *
   * @param passwordData - Password change data
   * @param passwordData.currentPassword - User's current password
   * @param passwordData.newPassword - New password (min 8 characters)
   * @returns Promise resolving when password is changed
   * @throws {ApiError} If current password is incorrect or new password doesn't meet requirements
   *
   * @example
   * ```typescript
   * await ApiService.changePassword({
   *   currentPassword: 'oldPassword123',
   *   newPassword: 'newSecurePassword456'
   * });
   * ```
   */
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

  /**
   * Gets a single user by their ID.
   *
   * @param userId - UUID of the user
   * @returns Promise resolving to user data
   * @throws {ApiError} If user is not found or access is denied
   *
   * @example
   * ```typescript
   * const user = await ApiService.getUserById('123e4567-e89b-12d3-a456-426614174000');
   * ```
   */
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
    return ProjectsApiService.createProject({
      name: projectData.name,
      description: projectData.description,
      settings: projectData.settings as unknown as import('../../types/backend-aligned').ProjectSettings,
    });
  }

  static async updateProject(
    projectId: string,
    projectData: {
      name?: string;
      description?: string;
      settings?: unknown;
    }
  ) {
    return ProjectsApiService.updateProject(projectId, projectData as Record<string, unknown>);
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

  /**
   * Updates a reconciliation record.
   *
   * @param recordId - Record ID to update
   * @param recordData - Record data to update
   * @returns Promise resolving to updated record data
   * @throws {ApiError} If record not found or request fails
   *
   * @example
   * ```typescript
   * const record = await ApiService.updateReconciliationRecord('record-123', {
   *   status: 'resolved',
   *   notes: 'Updated notes'
   * });
   * ```
   */
  static async updateReconciliationRecord(
    recordId: string,
    recordData: Record<string, unknown>
  ) {
    return ReconciliationApiService.updateReconciliationRecord(recordId, recordData);
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
