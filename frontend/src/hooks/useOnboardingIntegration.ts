/**
 * Onboarding Integration Hook
 *
 * Hook for integrating onboarding components with user API and role detection.
 */

import { useState, useEffect, useCallback } from 'react';
import { onboardingService, UserRole } from '@/services/onboardingService';
import type { BackendUser } from '@/services/apiClient/types';

interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  experience?: 'new' | 'experienced';
  permissions?: string[];
}

interface OnboardingIntegrationState {
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  shouldShowOnboarding: boolean;
  onboardingCompleted: boolean;
}

/**
 * Hook for onboarding integration
 */
export const useOnboardingIntegration = (): {
  state: OnboardingIntegrationState;
  detectUserRole: () => Promise<UserRole | null>;
  getUserProfile: () => Promise<UserProfile | null>;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  skipOnboarding: (remindLater?: boolean) => void;
} => {
  const [state, setState] = useState<OnboardingIntegrationState>({
    userProfile: null,
    isLoading: true,
    error: null,
    shouldShowOnboarding: false,
    onboardingCompleted: false,
  });

  /**
   * Detect user role from API
   */
  const detectUserRole = useCallback(async (): Promise<UserRole | null> => {
    try {
      // Use actual API call to get current user
      const { apiClient } = await import('@/services/apiClient');
      const response = await apiClient.getCurrentUser();

      if (response.error || !response.data) {
        // Fallback to localStorage if API fails
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            return (user.role || 'analyst') as UserRole;
          } catch {
            return 'analyst';
          }
        }
        return 'analyst';
      }

      // Map backend role to UserRole
      const user = response.data;
      const roleMap: Record<string, UserRole> = {
        admin: 'admin',
        administrator: 'admin',
        analyst: 'analyst',
        viewer: 'viewer',
        user: 'analyst', // Default user to analyst
      };

      const userRole = (user as Record<string, unknown>).role;
      const roleString = typeof userRole === 'string' ? userRole.toLowerCase() : 'analyst';
      return roleMap[roleString] || 'analyst';
    } catch (error) {
      // Fallback to localStorage on error
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr) as Record<string, unknown>;
          const role = typeof user.role === 'string' ? user.role : 'analyst';
          return role as UserRole;
        } catch {
          return 'analyst';
        }
      }
      return 'analyst';
    }
  }, []);

  /**
   * Get user profile from API
   */
  const getUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Use actual API call to get current user
      const { apiClient } = await import('@/services/apiClient');
      const response = await apiClient.getCurrentUser();

      if (response.error || !response.data) {
        // Fallback to localStorage if API fails
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            const profile: UserProfile = {
              id: user.id || 'demo-user',
              email: user.email || 'user@example.com',
              role: (user.role || 'analyst') as UserRole,
              experience: user.experience || 'new',
              permissions: user.permissions || [],
            };

            setState((prev) => ({
              ...prev,
              userProfile: profile,
              isLoading: false,
              shouldShowOnboarding: onboardingService.shouldShowOnboarding('initial'),
              onboardingCompleted: onboardingService.hasCompletedOnboarding('initial'),
            }));

            return profile;
          } catch {
            throw new Error('Failed to parse user data');
          }
        }

        // Default profile if no API and no localStorage
        const defaultProfile: UserProfile = {
          id: 'demo-user',
          email: 'demo@example.com',
          role: 'analyst',
          experience: 'new',
          permissions: [],
        };

        setState((prev) => ({
          ...prev,
          userProfile: defaultProfile,
          isLoading: false,
          shouldShowOnboarding: true,
          onboardingCompleted: false,
        }));

        return defaultProfile;
      }

      // Map backend user to UserProfile
      const user = response.data;
      const roleMap: Record<string, UserRole> = {
        admin: 'admin',
        administrator: 'admin',
        analyst: 'analyst',
        viewer: 'viewer',
        user: 'analyst',
      };

      const userRecord = user as Record<string, unknown>;
      const userRole = userRecord.role;
      const roleString = typeof userRole === 'string' ? userRole.toLowerCase() : 'analyst';
      const hasLastLogin = userRecord.last_login !== undefined && userRecord.last_login !== null;
      const userPermissions = Array.isArray(userRecord.permissions) ? userRecord.permissions : [];
      
      const profile: UserProfile = {
        id: typeof userRecord.id === 'string' ? userRecord.id : '',
        email: typeof userRecord.email === 'string' ? userRecord.email : '',
        role: roleMap[roleString] || 'analyst',
        experience: hasLastLogin ? 'experienced' : 'new',
        permissions: userPermissions as string[], // Permissions from backend user object (if available)
        // Note: Full permissions API endpoint may be added in future if granular permission management is needed
      };

      setState((prev) => ({
        ...prev,
        userProfile: profile,
        isLoading: false,
        shouldShowOnboarding: onboardingService.shouldShowOnboarding('initial'),
        onboardingCompleted: onboardingService.hasCompletedOnboarding('initial'),
      }));

      return profile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user profile';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      return null;
    }
  }, []);

  /**
   * Start onboarding
   */
  const startOnboarding = useCallback(() => {
    const role = state.userProfile?.role || 'analyst';
    onboardingService.startOnboarding('initial', role);
    setState((prev) => ({
      ...prev,
      shouldShowOnboarding: true,
    }));
  }, [state.userProfile]);

  /**
   * Complete onboarding
   */
  const completeOnboarding = useCallback(() => {
    onboardingService.completeOnboarding('initial');
    setState((prev) => ({
      ...prev,
      onboardingCompleted: true,
      shouldShowOnboarding: false,
    }));
  }, []);

  /**
   * Skip onboarding
   */
  const skipOnboarding = useCallback((remindLater: boolean = false) => {
    onboardingService.skipOnboarding('initial', remindLater);
    setState((prev) => ({
      ...prev,
      shouldShowOnboarding: false,
    }));
  }, []);

  // Load user profile on mount
  useEffect(() => {
    getUserProfile();
  }, [getUserProfile]);

  return {
    state,
    detectUserRole,
    getUserProfile,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
  };
};
