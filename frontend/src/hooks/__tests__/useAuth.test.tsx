import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';

// Mock the API client
vi.mock('../../services/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    setAuthToken: vi.fn(),
    clearAuthToken: vi.fn(),
  },
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle successful login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
    };

    const { apiClient } = await import('../../services/apiClient');
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { user: mockUser, token: 'mock-token' },
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.login('test@example.com', 'password');
      expect(response.success).toBe(true);
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('should handle login error', async () => {
    const { apiClient } = await import('../../services/apiClient');
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.login('test@example.com', 'wrong-password');
      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid credentials');
    });
  });

  it('should handle successful registration', async () => {
    const mockUser = {
      id: '1',
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      role: 'user',
    };

    const { apiClient } = await import('../../services/apiClient');
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { user: mockUser, token: 'mock-token' },
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.register({
        email: 'new@example.com',
        password: 'password',
        firstName: 'New',
        lastName: 'User',
      });
      expect(response.success).toBe(true);
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
      email: 'new@example.com',
      password: 'password',
      firstName: 'New',
      lastName: 'User',
    });
  });

  it('should handle registration error', async () => {
    const { apiClient } = await import('../../services/apiClient');
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Email already exists'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.register({
        email: 'existing@example.com',
        password: 'password',
        firstName: 'Existing',
        lastName: 'User',
      });
      expect(response.success).toBe(false);
      expect(response.error).toBe('Email already exists');
    });
  });

  it('should handle logout', async () => {
    const { apiClient } = await import('../../services/apiClient');
    vi.mocked(apiClient.post).mockResolvedValueOnce({});

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
    expect(apiClient.clearAuthToken).toHaveBeenCalled();
  });

  it('should refresh user data', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
    };

    const { apiClient } = await import('../../services/apiClient');
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { user: mockUser },
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
  });
});
