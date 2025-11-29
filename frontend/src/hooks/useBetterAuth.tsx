/**
 * Better Auth Compatibility Hook
 * 
 * Wraps Better Auth client to maintain exact same API as existing useAuth hook.
 * Preserves all existing features: rate limiting, session timeout, error handling.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient, getCurrentSession, type AuthUser } from '@/lib/auth-client';
import { logger } from '@/services/logger';
import { rateLimiter, SessionTimeoutManager, TokenRefreshManager } from '@/services/authSecurity';
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

export const useBetterAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useBetterAuth must be used within a BetterAuthProvider');
  }
  return context;
};

interface BetterAuthProviderProps {
  children: ReactNode;
}

export const BetterAuthProvider: React.FC<BetterAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionTimeoutRef = useRef<SessionTimeoutManager | null>(null);
  const tokenRefreshRef = useRef<TokenRefreshManager | null>(null);

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
        logger.error('Auth check failed', { component: 'useBetterAuth', error });
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
      logger.error('Logout error', { component: 'useBetterAuth', error });
    } finally {
      setUser(null);
      sessionTimeoutRef.current?.destroy();
      tokenRefreshRef.current?.stop();
    }
  }, []);

  // Setup session timeout and token refresh when authenticated
  useEffect(() => {
    if (isAuthenticated) {
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
        }
      );

      // Listen for extend-session events
      const handleExtendSession = () => {
        sessionTimeoutRef.current?.extendSession();
      };
      window.addEventListener('extend-session', handleExtendSession);

      // Start token refresh manager
      const refreshFn = async (): Promise<string | null> => {
        try {
          // Better Auth handles token refresh internally
          const session = await authClient.getSession();
          return session?.token || null;
        } catch (error) {
          logger.error('Token refresh failed in manager', { error });
          return null;
        }
      };

      tokenRefreshRef.current = new TokenRefreshManager(refreshFn, () => {
        logger.error('Token refresh manager failed, logging out');
        logout();
        window.location.href = '/login';
      });
      tokenRefreshRef.current.start();

      // Listen for logout events from interceptor
      const handleLogoutRequired = () => {
        logout();
        window.location.href = '/login';
      };
      window.addEventListener('auth:logout-required', handleLogoutRequired);

      return () => {
        sessionTimeoutRef.current?.destroy();
        tokenRefreshRef.current?.stop();
        window.removeEventListener('auth:logout-required', handleLogoutRequired);
        window.removeEventListener('extend-session', handleExtendSession);
      };
    } else {
      // Clean up when not authenticated
      sessionTimeoutRef.current?.destroy();
      tokenRefreshRef.current?.stop();
    }
  }, [isAuthenticated, logout]);

  const login = async (email: string, password: string) => {
    // Rate limiting - 5 attempts per 15 minutes
    const rateLimitKey = `login:${email}`;
    const maxAttempts = 5;
    const windowMs = 15 * 60 * 1000; // 15 minutes

    if (!rateLimiter.canMakeRequest(rateLimitKey, maxAttempts, windowMs)) {
      const timeUntilReset = rateLimiter.getTimeUntilReset(rateLimitKey, maxAttempts, windowMs);

      logger.logSecurity('Login rate limit exceeded', { email, timeUntilReset });

      // Calculate user-friendly time message
      const remainingMinutes = Math.ceil(timeUntilReset / (60 * 1000));
      const remainingSeconds = Math.ceil((timeUntilReset % (60 * 1000)) / 1000);

      let timeMessage: string;
      if (remainingMinutes > 0) {
        timeMessage = `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
      } else if (remainingSeconds > 0) {
        timeMessage = `${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`;
      } else {
        timeMessage = 'a moment';
      }

      return {
        success: false,
        error: `Too many login attempts. Please try again in ${timeMessage}.`,
      };
    }

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
        // Record failed attempt for warning
        const failedCount = rateLimiter.recordFailedAttempt(rateLimitKey);

        // Show warning after 3 failed attempts
        if (failedCount >= 3 && failedCount < maxAttempts) {
          const remaining = maxAttempts - failedCount;
          const errorMsg = response.error.message || 'Invalid credentials';
          return {
            success: false,
            error: `${errorMsg} (${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before account lockout)`,
          };
        }

        return { success: false, error: response.error.message || 'Login failed' };
      }

      if (response.data?.user) {
        setUser(response.data.user);
        
        // Reset rate limit on successful login
        rateLimiter.reset(rateLimitKey);

        return { success: true };
      }

      // Record failed attempt
      rateLimiter.recordFailedAttempt(rateLimitKey);
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

      if (response.data?.user) {
        setUser(response.data.user);
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
    if (email) {
      rateLimiter.resetForEmail(email);
      logger.logSecurity('Rate limit reset for email', { email });
    } else {
      rateLimiter.clearAll();
      logger.logSecurity('All rate limits cleared');
    }
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

// Export for backward compatibility
export { useBetterAuth as useAuth, BetterAuthProvider as AuthProvider };

