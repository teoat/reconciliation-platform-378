/**
 * Auth Hook (Consolidated)
 * 
 * Uses Better Auth client to provide authentication state and methods.
 * Replaces legacy useAuth and useBetterAuth.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { authClient, getCurrentSession, type AuthUser } from '@/lib/auth-client';
import { logger } from '@/services/logger';
import { SessionTimeoutManager } from '@/services/authSecurity';
import { validatePasswordStrength } from '@/utils/security';
import { getUserFriendlyError } from '@/utils/errorMessages';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  googleOAuth: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resetRateLimit: (email?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};

// Alias for backward compatibility if needed, but prefer useAuth
export const useBetterAuth = useAuth;

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionTimeoutRef = useRef<SessionTimeoutManager | null>(null);

  const isAuthenticated = !!user;

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getCurrentSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        logger.error('Auth check failed', { component: 'AuthProvider', error });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = useCallback(async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      logger.error('Logout error', { component: 'AuthProvider', error });
    } finally {
      setUser(null);
      sessionTimeoutRef.current?.destroy();
    }
  }, []);

  // Setup session timeout and token refresh when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check for password expiry and show warning
      if ((user as any).password_expires_at) {
        const expiryDate = new Date((user as any).password_expires_at);
        const now = new Date();
        const daysRemaining = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // If password expired, redirect to force change
        if ((user as any).password_expired || daysRemaining < 0) {
          logger.logSecurity('Password expired, forcing change', { userId: user.id });
          window.location.href = '/force-password-change';
          return;
        }
        
        // Show warning if expiring within 7 days
        const warningThreshold = parseInt(import.meta.env.VITE_PASSWORD_WARNING_DAYS || '7', 10);
        if (daysRemaining <= warningThreshold && daysRemaining >= 0) {
          const event = new CustomEvent('password-expiry-warning', {
            detail: { daysRemaining },
          });
          window.dispatchEvent(event);
        }
      }
      
      // Start session timeout tracking with warning
      sessionTimeoutRef.current = new SessionTimeoutManager(
        () => {
          logger.logSecurity('Session timeout triggered');
          logout();
          window.location.href = '/login';
        },
        (remainingMinutes: number) => {
          // Show warning modal 5 minutes before timeout
          const event = new CustomEvent('session-timeout-warning', {
            detail: { remainingMinutes },
          });
          window.dispatchEvent(event);
        },
        5 * 60 * 1000 // Warning at 5 minutes before timeout
      );

      // Listen for extend-session events
      const handleExtendSession = () => {
        sessionTimeoutRef.current?.extendSession();
      };
      window.addEventListener('extend-session', handleExtendSession);

      // Note: Better Auth handles token refresh internally - no custom refresh manager needed
      
      // Listen for logout events from interceptor
      const handleLogoutRequired = () => {
        logout();
        window.location.href = '/login';
      };
      window.addEventListener('auth:logout-required', handleLogoutRequired);

      return () => {
        sessionTimeoutRef.current?.destroy();
        window.removeEventListener('auth:logout-required', handleLogoutRequired);
        window.removeEventListener('extend-session', handleExtendSession);
      };
    } else {
      // Clean up when not authenticated
      sessionTimeoutRef.current?.destroy();
    }
  }, [isAuthenticated, user, logout]);

  const login = async (email: string, password: string) => {
    // Note: Rate limiting now handled server-side by Better Auth
    // Client-side rate limiting removed to avoid redundancy

    // Input validation
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    try {
      setIsLoading(true);

      // Use Better Auth sign-in
      const response = await authClient.signIn.email({
        email,
        password,
      });

      if (response.error) {
        return { success: false, error: response.error.message || 'Login failed' };
      }

      if (response.data?.user) {
        setUser(response.data.user);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      logger.error('Login failed', { error, email });

      // Handle network errors specifically
      const friendlyError = getUserFriendlyError(error instanceof Error ? error.message : 'Login failed');
      return { success: false, error: friendlyError.message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
  }) => {
    // Input validation - check for empty strings and whitespace
    const trimmedEmail = userData.email?.trim();
    const trimmedFirstName = userData.first_name?.trim();
    const trimmedLastName = userData.last_name?.trim();

    if (!trimmedEmail || !userData.password || !trimmedFirstName || !trimmedLastName) {
      return { success: false, error: 'All required fields must be filled' };
    }

    // Password strength validation
    const passwordValidation = validatePasswordStrength(userData.password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: `Password does not meet requirements: ${passwordValidation.feedback.join(', ')}`,
      };
    }

    try {
      setIsLoading(true);

      // Use Better Auth sign-up
      const response = await authClient.signUp.email({
        email: trimmedEmail,
        password: userData.password,
        name: `${trimmedFirstName} ${trimmedLastName}`,
      });

      if (response.error) {
        return { success: false, error: response.error.message || 'Registration failed' };
      }

      if (response.data?.user) {
        setUser(response.data.user);
        return { success: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      logger.error('Registration failed', { error, email: userData.email });

      // Handle network errors specifically
      const friendlyError = getUserFriendlyError(error instanceof Error ? error.message : 'Registration failed');
      return { success: false, error: friendlyError.message };
    } finally {
      setIsLoading(false);
    }
  };

  const googleOAuth = async (idToken: string) => {
    try {
      setIsLoading(true);

      // Use Better Auth Google OAuth
      const response = await authClient.signIn.social({
        provider: 'google',
        idToken,
      });

      if (response.error) {
        return { success: false, error: response.error.message || 'Google authentication failed' };
      }

      const data = response.data as any;
      if (data?.user) {
        setUser(data.user);
        return { success: true };
      }

      return { success: false, error: 'Google authentication failed' };
    } catch (error) {
      logger.error('Google OAuth failed', { error, idToken: idToken ? 'present' : 'missing' });

      // Handle network errors specifically
      const friendlyError = getUserFriendlyError(error instanceof Error ? error.message : 'Google authentication failed');
      return { success: false, error: friendlyError.message };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const session = await getCurrentSession();
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      logger.error('Refresh user failed:', error);
      // If refresh fails, logout user
      await logout();
    }
  };

  const resetRateLimit = useCallback((email?: string) => {
    // Rate limiting now handled server-side - this is a no-op for compatibility
    logger.logSecurity('Rate limit reset requested (server-side only)', { email });
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    googleOAuth,
    logout,
    refreshUser,
    resetRateLimit,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export BetterAuthProvider alias for backward compatibility
export const BetterAuthProvider = AuthProvider;
