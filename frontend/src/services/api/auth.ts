// ============================================================================
// AUTHENTICATION API SERVICE
// ============================================================================

import { apiClient } from '../apiClient';
import { logger } from '../logger';
import { withErrorHandling, handleServiceError, type ErrorHandlingResult } from '../errorHandling';

export class AuthApiService {
  static async authenticate(
    email: string,
    password: string
  ): Promise<ErrorHandlingResult<unknown>> {
    return withErrorHandling(
      async () => {
        const response = await apiClient.login({ email, password });
        if (response.error) {
          throw new Error(typeof response.error === 'string' ? response.error : response.error.message || 'Authentication failed');
        }
        return response.data;
      },
      { component: 'AuthApiService', action: 'authenticate' }
    );
  }

  static async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
  }): Promise<ErrorHandlingResult<unknown>> {
    return withErrorHandling(
      async () => {
        const response = await apiClient.register(userData);
        if (response.error) {
          throw new Error(typeof response.error === 'string' ? response.error : response.error.message || 'Authentication failed');
        }
        return response.data;
      },
      { component: 'AuthApiService', action: 'register' }
    );
  }

  static async logout(): Promise<ErrorHandlingResult<void>> {
    return withErrorHandling(
      async () => {
        await apiClient.logout();
      },
      { component: 'AuthApiService', action: 'logout', logError: false }
    );
  }

  static async getCurrentUser(): Promise<ErrorHandlingResult<unknown>> {
    return withErrorHandling(
      async () => {
        const response = await apiClient.getCurrentUser();
        if (response.error) {
          throw new Error(typeof response.error === 'string' ? response.error : response.error.message || 'Authentication failed');
        }
        return response.data;
      },
      { component: 'AuthApiService', action: 'getCurrentUser' }
    );
  }

  static async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ErrorHandlingResult<unknown>> {
    return withErrorHandling(
      async () => {
        const response = await apiClient.post('/api/auth/change-password', passwordData);
        if (response.error) {
          throw new Error(typeof response.error === 'string' ? response.error : response.error.message || 'Authentication failed');
        }
        return response.data;
      },
      { component: 'AuthApiService', action: 'changePassword' }
    );
  }

  static async requestPasswordReset(email: string): Promise<ErrorHandlingResult<unknown>> {
    return withErrorHandling(
      async () => {
        const response = await apiClient.post('/api/auth/password-reset', { email });
        if (response.error) {
          throw new Error(typeof response.error === 'string' ? response.error : response.error.message || 'Authentication failed');
        }
        return response.data;
      },
      { component: 'AuthApiService', action: 'requestPasswordReset' }
    );
  }

  static async confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<ErrorHandlingResult<unknown>> {
    return withErrorHandling(
      async () => {
        const response = await apiClient.post('/api/auth/password-reset/confirm', {
          token,
          new_password: newPassword,
        });
        if (response.error) {
          throw new Error(typeof response.error === 'string' ? response.error : response.error.message || 'Authentication failed');
        }
        return response.data;
      },
      { component: 'AuthApiService', action: 'confirmPasswordReset' }
    );
  }
}
