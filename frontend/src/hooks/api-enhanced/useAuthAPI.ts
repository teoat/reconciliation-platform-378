// ============================================================================
// AUTHENTICATION API HOOK (Enhanced with Redux)
// ============================================================================

import { useCallback } from 'react';
import { logger } from '@/services/logger';
import { toRecord } from '../../utils/typeHelpers';
import { useAppDispatch, useAppSelector } from '../../store/unifiedStore';
import { authActions } from '../../store/unifiedStore';
import ApiService from '../../services/ApiService';
import { useNotificationHelpers } from '../../store/hooks';
import type { User } from '../../types/backend-aligned';

export const useAuthAPI = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);
  const { showSuccess, showError } = useNotificationHelpers();

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        dispatch(authActions.loginStart());
        const authData = await ApiService.authenticate(email, password);

        const isValidAuthData = (data: unknown): data is { user: User } => {
          return typeof data === 'object' && data !== null && 'user' in data;
        };
        
        const user = isValidAuthData(authData.data) ? authData.data.user : null;
        if (!user) {
          throw new Error('Invalid response: user not found');
        }
        dispatch(authActions.loginSuccess(user));
        showSuccess('Login Successful', 'Welcome back!');

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        dispatch(authActions.loginFailure(errorMessage));
        showError('Login Failed', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [dispatch, showSuccess, showError]
  );

  const register = useCallback(
    async (userData: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      role?: string;
    }) => {
      try {
        dispatch(authActions.loginStart());
        const authData = await ApiService.register(userData);

        const isValidAuthData = (data: unknown): data is { user: User } => {
          return typeof data === 'object' && data !== null && 'user' in data;
        };
        
        const user = isValidAuthData(authData.data) ? authData.data.user : null;
        if (!user) {
          throw new Error('Invalid response: user not found');
        }
        dispatch(authActions.loginSuccess(user));
        showSuccess('Registration Successful - Account created successfully!');

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        dispatch(authActions.loginFailure(errorMessage));
        showError(`Registration Failed - ${errorMessage}`);

        return { success: false, error: errorMessage };
      }
    },
    [dispatch, showSuccess, showError]
  );

  const logout = useCallback(async () => {
    try {
      await ApiService.logout();
      dispatch(authActions.logout());
      showSuccess('Logged Out', 'You have been logged out successfully');
    } catch (error) {
      logger.error('Logout error:', toRecord(error));
      dispatch(authActions.logout());
    }
  }, [dispatch, showSuccess]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await ApiService.getCurrentUser();
      const isValidUser = (data: unknown): data is Partial<User> => {
        return typeof data === 'object' && data !== null;
      };
      
      if (isValidUser(userData)) {
        dispatch(authActions.updateUser(userData));
      }
    } catch (error) {
      logger.error('Refresh user failed:', toRecord(error));
      dispatch(authActions.logout());
    }
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
    clearError: () => dispatch(authActions.clearError()),
  };
};

