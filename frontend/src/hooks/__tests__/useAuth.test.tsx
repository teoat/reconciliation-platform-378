// ============================================================================
// USE AUTH HOOK TESTS (useAuth.tsx)
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import { useAuth, AuthProvider, ProtectedRoute } from '../useAuth';
import * as apiClient from '@/services/apiClient';
import * as authSecurity from '@/services/authSecurity';
import * as secureStorage from '@/services/secureStorage';
import { Navigate } from 'react-router-dom';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    getAuthToken: vi.fn(),
    clearAuthToken: vi.fn(),
    setAuthToken: vi.fn(),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    googleOAuth: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('@/services/authSecurity', () => ({
  rateLimiter: {
    canMakeRequest: vi.fn(() => true),
    getRemainingAttempts: vi.fn(() => 5),
    getTimeUntilReset: vi.fn(() => 0),
    recordFailedAttempt: vi.fn(() => 1),
    reset: vi.fn(),
    resetForEmail: vi.fn(),
    clearAll: vi.fn(),
  },
  SessionTimeoutManager: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    extendSession: vi.fn(),
  })),
  TokenRefreshManager: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
}));

vi.mock('@/services/secureStorage', () => ({
  secureStorage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@/services/logger', () => ({
  logger: {
    error: vi.fn(),
    logSecurity: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
}));

vi.mock('@/utils/security', () => ({
  validatePasswordStrength: vi.fn(() => ({ isValid: true, feedback: [] })),
}));

describe('useAuth (useAuth.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should throw error when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );
  });

  it('should provide auth context within AuthProvider', async () => {
    vi.mocked(apiClient.apiClient.getAuthToken).mockReturnValue(null);
    vi.mocked(apiClient.apiClient.getCurrentUser).mockResolvedValue({
      success: true,
      data: { id: 'user-1', email: 'test@example.com' },
    } as any);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should login successfully', async () => {
    vi.mocked(apiClient.apiClient.getAuthToken).mockReturnValue(null);
    vi.mocked(apiClient.apiClient.getCurrentUser).mockResolvedValue({
      success: false,
      error: { message: 'Not authenticated' },
    } as any);
    vi.mocked(apiClient.apiClient.login).mockResolvedValue({
      success: true,
      data: {
        user: { id: 'user-1', email: 'test@example.com' },
      },
    } as any);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      const response = await result.current.login('test@example.com', 'password');
      expect(response.success).toBe(true);
    });

    expect(result.current.user).toEqual({ id: 'user-1', email: 'test@example.com' });
  });

  it('should handle login rate limiting', async () => {
    vi.mocked(apiClient.apiClient.getAuthToken).mockReturnValue(null);
    vi.mocked(apiClient.apiClient.getCurrentUser).mockResolvedValue({
      success: false,
      error: { message: 'Not authenticated' },
    } as any);
    vi.mocked(authSecurity.rateLimiter.canMakeRequest).mockReturnValue(false);
    vi.mocked(authSecurity.rateLimiter.getTimeUntilReset).mockReturnValue(900000); // 15 minutes

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      const response = await result.current.login('test@example.com', 'password');
      expect(response.success).toBe(false);
      expect(response.error).toContain('Too many login attempts');
    });
  });

  it('should register successfully', async () => {
    vi.mocked(apiClient.apiClient.getAuthToken).mockReturnValue(null);
    vi.mocked(apiClient.apiClient.getCurrentUser).mockResolvedValue({
      success: false,
      error: { message: 'Not authenticated' },
    } as any);
    vi.mocked(apiClient.apiClient.register).mockResolvedValue({
      success: true,
      data: {
        user: { id: 'user-1', email: 'test@example.com' },
      },
    } as any);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      const response = await result.current.register({
        email: 'test@example.com',
        password: 'Password123!',
        first_name: 'Test',
        last_name: 'User',
      });
      expect(response.success).toBe(true);
    });

    expect(result.current.user).toEqual({ id: 'user-1', email: 'test@example.com' });
  });

  it('should logout successfully', async () => {
    vi.mocked(apiClient.apiClient.getAuthToken).mockReturnValue('token');
    vi.mocked(apiClient.apiClient.getCurrentUser).mockResolvedValue({
      success: true,
      data: { id: 'user-1', email: 'test@example.com' },
    } as any);
    vi.mocked(apiClient.apiClient.logout).mockResolvedValue({ success: true } as any);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(apiClient.apiClient.clearAuthToken).toHaveBeenCalled();
  });

  it('should show loading state in ProtectedRoute when checking auth', () => {
    vi.mocked(apiClient.apiClient.getAuthToken).mockReturnValue(null);
    vi.mocked(apiClient.apiClient.getCurrentUser).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { container } = render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    expect(container.textContent).toContain('Authenticating...');
  });

  it('should redirect to login when not authenticated in ProtectedRoute', async () => {
    vi.mocked(apiClient.apiClient.getAuthToken).mockReturnValue(null);
    vi.mocked(apiClient.apiClient.getCurrentUser).mockResolvedValue({
      success: false,
      error: { message: 'Not authenticated' },
    } as any);

    const { getByTestId } = render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('navigate')).toBeDefined();
    });
  });
});
