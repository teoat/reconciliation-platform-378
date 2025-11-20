import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from 'react';
import { logger } from '@/services/logger';
import { Navigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { UserResponse, LoginRequest, RegisterRequest } from '../types/backend-aligned';
import { rateLimiter } from '../services/authSecurity';
import { SessionTimeoutManager, TokenRefreshManager } from '../services/authSecurity';
import { validatePasswordStrength } from '../utils/security';
import { secureStorage } from '../services/secureStorage';
import { getErrorMessageFromApiError } from '../utils/errorExtraction';

interface AuthContextType {
  user: UserResponse | null;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionTimeoutRef = useRef<SessionTimeoutManager | null>(null);
  const tokenRefreshRef = useRef<TokenRefreshManager | null>(null);

  const isAuthenticated = !!user;

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const token = apiClient.getAuthToken();
        if (token) {
          const response = await apiClient.getCurrentUser();
          if (response.data) {
            setUser(response.data);
          } else {
            // Token is invalid, clear it
            apiClient.clearAuthToken();
          }
        }
      } catch (error) {
        logger.error('Auth check failed:', error);
        apiClient.clearAuthToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      logger.error('Logout error:', error);
    } finally {
      setUser(null);
      apiClient.clearAuthToken();
      secureStorage.removeItem('refreshToken', false);
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
          const refreshToken = secureStorage.getItem<string>('refreshToken', false);
          if (!refreshToken) return null;

          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (response.ok) {
            const data = await response.json();
            const accessToken = data.accessToken || data.token;
            const newRefreshToken = data.refreshToken;

            if (accessToken) {
              apiClient.setAuthToken(accessToken);
              if (newRefreshToken) {
                secureStorage.setItem('refreshToken', newRefreshToken, false);
              }
              return accessToken;
            }
          }
        } catch (error) {
          logger.error('Token refresh failed in manager', { error });
        }
        return null;
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

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    // Rate limiting - 5 attempts per 15 minutes
    const rateLimitKey = `login:${email}`;
    const maxAttempts = 5;
    const windowMs = 15 * 60 * 1000; // 15 minutes

    if (!rateLimiter.canMakeRequest(rateLimitKey, maxAttempts, windowMs)) {
      const remainingAttempts = rateLimiter.getRemainingAttempts(
        rateLimitKey,
        maxAttempts,
        windowMs
      );
      const timeUntilReset = rateLimiter.getTimeUntilReset(rateLimitKey, maxAttempts, windowMs);

      logger.logSecurity('Login rate limit exceeded', { email, remainingAttempts, timeUntilReset });

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
      const response = await apiClient.login({ email, password, rememberMe });

      if (response.error) {
        // Record failed attempt for warning
        const failedCount = rateLimiter.recordFailedAttempt(rateLimitKey);

        // Show warning after 3 failed attempts
        if (failedCount >= 3 && failedCount < maxAttempts) {
          const remaining = maxAttempts - failedCount;
          const errorMsg = getErrorMessageFromApiError(response.error);
          return {
            success: false,
            error: `${errorMsg} (${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before account lockout)`,
          };
        }

        return { success: false, error: getErrorMessageFromApiError(response.error) };
      }

      if (response.data) {
        setUser(response.data.user);

        // Store refresh token if provided (use secureStorage)
        if (response.data.refreshToken) {
          secureStorage.setItem('refreshToken', response.data.refreshToken, false);
        }

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
      let errorMessage = 'Login failed';
      if (error instanceof Error) {
        if (
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('Failed to fetch')
        ) {
          errorMessage = 'Unable to connect to server. Please check your connection and try again.';
        } else {
          errorMessage = error.message || 'Login failed';
        }
      }

      return { success: false, error: errorMessage };
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
    // Password strength validation
    const passwordValidation = validatePasswordStrength(userData.password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: `Password does not meet requirements: ${passwordValidation.feedback.join(', ')}`,
      };
    }

    // Input validation
    if (!userData.email || !userData.password || !userData.first_name || !userData.last_name) {
      return { success: false, error: 'All required fields must be filled' };
    }

    try {
      setIsLoading(true);
      const response = await apiClient.register(userData);

      if (response.error) {
        return { success: false, error: getErrorMessageFromApiError(response.error) };
      }

      if (response.data) {
        setUser(response.data.user);
        return { success: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const googleOAuth = async (idToken: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.googleOAuth(idToken);

      if (response.error) {
        return { success: false, error: getErrorMessageFromApiError(response.error) };
      }

      if (response.data) {
        setUser(response.data.user);
        return { success: true };
      }

      return { success: false, error: 'Google authentication failed' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google authentication failed',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.data) {
        setUser(response.data);
      }
    } catch (error) {
      logger.error('Refresh user failed:', error);
      // If refresh fails, logout user
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    googleOAuth,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Protected Route Component
interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
