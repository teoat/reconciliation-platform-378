// ============================================================================
// AUTHENTICATION API SERVICE
// ============================================================================

import { apiClient } from '../apiClient';
import { BaseApiService, type ServiceContext } from './BaseApiService';
import type { ErrorHandlingResult } from '../errorHandling';

/**
 * Authentication API Service
 * 
 * Handles all authentication-related API operations including login, registration,
 * password management, and user session management.
 * 
 * @example
 * ```typescript
 * const result = await AuthApiService.authenticate('user@example.com', 'password123');
 * if (result.success) {
 *   // Handle successful authentication
 * }
 * ```
 */
export class AuthApiService extends BaseApiService {
  /**
   * Authenticates a user with email and password.
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to authentication response with token and user data
   * @throws {Error} If authentication fails (invalid credentials, user not found, etc.)
   * 
   * @example
   * ```typescript
   * const result = await AuthApiService.authenticate('user@example.com', 'password123');
   * if (result.success) {
   *   const { token, user } = result.data;
   *   // Store token and redirect to dashboard
   * }
   * ```
   */
  static async authenticate(
    email: string,
    password: string
  ): Promise<ErrorHandlingResult<unknown>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.login({ email, password });
        return this.transformResponse(response);
      },
      { component: 'AuthApiService', action: 'authenticate' }
    );
  }

  /**
   * Registers a new user account.
   * 
   * @param userData - User registration data
   * @param userData.email - User's email address (must be unique)
   * @param userData.password - User's password (min 8 characters, must meet complexity requirements)
   * @param userData.first_name - User's first name
   * @param userData.last_name - User's last name
   * @param userData.role - Optional user role (default: 'user')
   * @returns Promise resolving to registration response with user data
   * @throws {Error} If registration fails (email exists, validation error, etc.)
   * 
   * @example
   * ```typescript
   * const result = await AuthApiService.register({
   *   email: 'newuser@example.com',
   *   password: 'SecurePass123!',
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
  }): Promise<ErrorHandlingResult<unknown>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.register(userData);
        return this.transformResponse(response);
      },
      { component: 'AuthApiService', action: 'register' }
    );
  }

  /**
   * Logs out the current user and invalidates the session.
   * 
   * @returns Promise resolving when logout is complete
   * @throws {Error} If logout fails
   * 
   * @example
   * ```typescript
   * await AuthApiService.logout();
   * // Clear local storage and redirect to login
   * ```
   */
  static async logout(): Promise<ErrorHandlingResult<void>> {
    return this.withErrorHandling(
      async () => {
        await apiClient.logout();
      },
      { component: 'AuthApiService', action: 'logout' }
    );
  }

  /**
   * Gets the currently authenticated user's information.
   * 
   * @returns Promise resolving to current user data
   * @throws {Error} If user is not authenticated or session expired
   * 
   * @example
   * ```typescript
   * const result = await AuthApiService.getCurrentUser();
   * if (result.success) {
   *   const user = result.data;
   *   // Use user information
   * }
   * ```
   */
  static async getCurrentUser(): Promise<ErrorHandlingResult<unknown>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.getCurrentUser();
        return this.transformResponse(response);
      },
      { component: 'AuthApiService', action: 'getCurrentUser' }
    );
  }

  /**
   * Changes the current user's password.
   * 
   * @param passwordData - Password change data
   * @param passwordData.currentPassword - User's current password
   * @param passwordData.newPassword - New password (must meet complexity requirements)
   * @returns Promise resolving when password is changed
   * @throws {Error} If current password is incorrect or new password doesn't meet requirements
   * 
   * @example
   * ```typescript
   * const result = await AuthApiService.changePassword({
   *   currentPassword: 'OldPass123!',
   *   newPassword: 'NewPass123!'
   * });
   * ```
   */
  static async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ErrorHandlingResult<unknown>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.post('/api/v1/auth/change-password', passwordData);
        return this.transformResponse(response);
      },
      { component: 'AuthApiService', action: 'changePassword' }
    );
  }

  /**
   * Requests a password reset email for the given email address.
   * 
   * @param email - Email address to send reset link to
   * @returns Promise resolving when reset email is sent
   * @throws {Error} If email is not found or reset request fails
   * 
   * @example
   * ```typescript
   * const result = await AuthApiService.requestPasswordReset('user@example.com');
   * // User will receive password reset email
   * ```
   */
  static async requestPasswordReset(email: string): Promise<ErrorHandlingResult<unknown>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.post('/api/v1/auth/password-reset', { email });
        return this.transformResponse(response);
      },
      { component: 'AuthApiService', action: 'requestPasswordReset' }
    );
  }

  /**
   * Confirms password reset with token and sets new password.
   * 
   * @param token - Password reset token from email
   * @param newPassword - New password to set (must meet complexity requirements)
   * @returns Promise resolving when password is reset
   * @throws {Error} If token is invalid/expired or password doesn't meet requirements
   * 
   * @example
   * ```typescript
   * const result = await AuthApiService.confirmPasswordReset(
   *   'reset-token-from-email',
   *   'NewSecurePass123!'
   * );
   * ```
   */
  static async confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<ErrorHandlingResult<unknown>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.post('/api/v1/auth/password-reset/confirm', {
          token,
          new_password: newPassword,
        });
        return this.transformResponse(response);
      },
      { component: 'AuthApiService', action: 'confirmPasswordReset' }
    );
  }
}
