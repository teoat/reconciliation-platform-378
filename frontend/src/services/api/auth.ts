// ============================================================================
// AUTHENTICATION API SERVICE
// ============================================================================

import { apiClient } from '../apiClient';
import { logger } from '../logger';
import { getErrorMessageFromApiError } from '../../utils/errorExtraction';

export class AuthApiService {
  static async authenticate(email: string, password: string) {
    try {
      const response = await apiClient.login({ email, password });
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
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
        throw new Error(getErrorMessageFromApiError(response.error));
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
        throw new Error(getErrorMessageFromApiError(response.error));
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
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to change password');
    }
  }
}

