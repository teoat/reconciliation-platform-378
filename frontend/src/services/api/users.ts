// ============================================================================
// USER MANAGEMENT API SERVICE
// ============================================================================

import { apiClient } from '../apiClient';
import { getErrorMessageFromApiError } from '@/utils/common/errorHandling';

/**
 * User Management API Service
 * 
 * Handles all user-related API operations including fetching, creating, updating,
 * and deleting users. Supports pagination, filtering, and search functionality.
 * 
 * @example
 * ```typescript
 * const result = await UsersApiService.getUsers({ page: 1, per_page: 20 });
 * const users = result.users;
 * ```
 */
export class UsersApiService {
  /**
   * Fetches a paginated list of users with optional filtering and search.
   * 
   * @param params - Query parameters
   * @param params.page - Page number (default: 1)
   * @param params.per_page - Items per page (default: 20)
   * @param params.search - Search query to filter users by name/email
   * @param params.role - Filter users by role
   * @param params.status - Filter users by status ('active' or 'inactive')
   * @returns Promise resolving to users list and pagination info
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * const result = await UsersApiService.getUsers({
   *   page: 1,
   *   per_page: 20,
   *   role: 'admin',
   *   status: 'active'
   * });
   * ```
   */
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
        throw new Error(getErrorMessageFromApiError(response.error));
      }

      // Filter by role and status if provided
      let users = response.data?.items || [];
      if (role) {
        users = users.filter((user: { role?: string }) => user.role === role);
      }
      if (status) {
        users = users.filter(
          (user: { is_active?: boolean }) => user.is_active === (status === 'active')
        );
      }

      const pagination = response.data
        ? {
            page: response.data.page,
            per_page: response.data.per_page,
            total: response.data.total,
            total_pages: response.data.total_pages,
          }
        : {
            page,
            per_page,
            total: users.length,
            total_pages: Math.ceil(users.length / per_page),
          };

      return {
        users,
        pagination,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch users');
    }
  }

  /**
   * Fetches a single user by ID.
   * 
   * @param userId - User ID to fetch
   * @returns Promise resolving to user data
   * @throws {Error} If user not found or request fails
   * 
   * @example
   * ```typescript
   * const user = await UsersApiService.getUserById('user-123');
   * ```
   */
  static async getUserById(userId: string) {
    try {
      const response = await apiClient.getUserById(userId);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch user');
    }
  }

  /**
   * Creates a new user account.
   * 
   * @param userData - User creation data
   * @param userData.email - User's email address (must be unique)
   * @param userData.password - User's password (must meet complexity requirements)
   * @param userData.first_name - User's first name
   * @param userData.last_name - User's last name
   * @param userData.role - Optional user role (default: 'user')
   * @returns Promise resolving to created user data
   * @throws {Error} If email exists, validation fails, or request fails
   * 
   * @example
   * ```typescript
   * const user = await UsersApiService.createUser({
   *   email: 'newuser@example.com',
   *   password: 'SecurePass123!',
   *   first_name: 'John',
   *   last_name: 'Doe',
   *   role: 'analyst'
   * });
   * ```
   */
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
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create user');
    }
  }

  /**
   * Updates an existing user's information.
   * 
   * @param userId - User ID to update
   * @param userData - User data to update (all fields optional)
   * @param userData.email - New email address
   * @param userData.first_name - New first name
   * @param userData.last_name - New last name
   * @param userData.role - New role
   * @param userData.is_active - Active status
   * @returns Promise resolving to updated user data
   * @throws {Error} If user not found, validation fails, or request fails
   * 
   * @example
   * ```typescript
   * const updated = await UsersApiService.updateUser('user-123', {
   *   first_name: 'Updated',
   *   role: 'admin'
   * });
   * ```
   */
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
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update user');
    }
  }

  /**
   * Deletes a user account.
   * 
   * @param userId - User ID to delete
   * @returns Promise resolving to true if deletion successful
   * @throws {Error} If user not found, permission denied, or request fails
   * 
   * @example
   * ```typescript
   * await UsersApiService.deleteUser('user-123');
   * ```
   */
  static async deleteUser(userId: string) {
    try {
      const response = await apiClient.deleteUser(userId);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return true;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  }
}
