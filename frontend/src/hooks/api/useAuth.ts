// Authentication Hook
'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, User } from '@/services/apiClient';
import { getErrorMessageFromApiError } from '@/utils/common/errorHandling';
import { logger } from '@/services/logger';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.getCurrentUser();
        if (response.data) {
          // LoginResponse has user property, but getCurrentUser might return User directly
          setUser((response.data as { user?: User }).user || (response.data as User));
          setIsAuthenticated(true);
        }
      } catch (error) {
        logger.error('Auth check failed', { category: 'auth', component: 'useAuth', error });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.login({ email, password });
      if (response.data) {
        const loginData = response.data as { user: User };
        setUser(loginData.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: getErrorMessageFromApiError(response.error) };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName?: string;
    role?: string;
  }) => {
    setIsLoading(true);
    try {
      // Convert camelCase to snake_case for RegisterRequest
      const registerData = {
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
      };
      const response = await apiClient.register(registerData);
      if (response.data) {
        const registerResponse = response.data as { user: User };
        setUser(registerResponse.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: getErrorMessageFromApiError(response.error) };
      }
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.logout();
    } catch (error) {
      logger.error('Logout error', { category: 'auth', component: 'useAuth', error });
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  };
};

