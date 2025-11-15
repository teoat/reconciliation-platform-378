// ============================================================================
// USER MANAGEMENT API SERVICE
// ============================================================================

import { apiClient } from '../apiClient';
import { getErrorMessageFromApiError } from '../../utils/errorExtraction';

export class UsersApiService {
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

      const pagination = response.data ? {
        page: response.data.page,
        per_page: response.data.per_page,
        total: response.data.total,
        total_pages: response.data.total_pages,
      } : {
        page,
        per_page,
        total: users.length,
        total_pages: Math.ceil(users.length / per_page),
      };

      return {
        users,
        pagination: response.data ? {
          page: response.data.page,
          per_page: response.data.per_page,
          total: response.data.total,
          total_pages: response.data.total_pages,
        } : {
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
        throw new Error(getErrorMessageFromApiError(response.error));
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
        throw new Error(getErrorMessageFromApiError(response.error));
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
        throw new Error(getErrorMessageFromApiError(response.error));
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
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return true;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  }
}

