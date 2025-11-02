/**
 * Onboarding Integration Hook
 * 
 * Hook for integrating onboarding components with user API and role detection.
 */

import { useState, useEffect, useCallback } from 'react';
import { onboardingService, UserRole } from '../services/onboardingService';

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
      // TODO: Replace with actual API call
      // const response = await fetch('/api/user/profile');
      // const data = await response.json();
      // return data.role as UserRole;

      // For now, check localStorage for demo
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return (user.role || 'analyst') as UserRole;
        } catch (error) {
          console.error('Failed to parse user data:', error);
        }
      }

      // Default role
      return 'analyst';
    } catch (error) {
      console.error('Failed to detect user role:', error);
      return null;
    }
  }, []);

  /**
   * Get user profile from API
   */
  const getUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // TODO: Replace with actual API call
      // const response = await fetch('/api/user/profile');
      // if (!response.ok) throw new Error('Failed to fetch user profile');
      // const data = await response.json();

      // For now, use localStorage for demo
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
        } catch (error) {
          throw new Error('Failed to parse user data');
        }
      }

      // Default profile for demo
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

