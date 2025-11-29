/**
 * Better Auth Proxy Service
 * 
 * Provides methods to interact with the Better Auth proxy endpoints
 * on the backend (backend/src/handlers/auth/proxy.rs)
 */

import { logger } from './logger';

const PROXY_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:2000';

export interface TokenIntrospectionRequest {
  token: string;
}

export interface TokenIntrospectionResponse {
  active: boolean;
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
}

export interface TokenRefreshRequest {
  refresh_token: string;
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Better Auth Proxy Service Class
 */
class BetterAuthProxyService {
  /**
   * Introspect a token to validate and get claims
   */
  async introspectToken(token: string): Promise<TokenIntrospectionResponse> {
    try {
      const response = await fetch(`${PROXY_BASE_URL}/api/auth-proxy/introspect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Token introspection failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Token introspection failed', { error });
      throw error;
    }
  }

  /**
   * Refresh an access token
   */
  async refreshToken(refreshToken: string): Promise<TokenRefreshResponse> {
    try {
      const response = await fetch(`${PROXY_BASE_URL}/api/auth-proxy/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Token refresh failed', { error });
      throw error;
    }
  }

  /**
   * Verify current session
   */
  async verifySession(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${PROXY_BASE_URL}/api/auth-proxy/verify`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      return response.ok;
    } catch (error) {
      logger.error('Session verification failed', { error });
      return false;
    }
  }

  /**
   * Proxy login to Better Auth server
   */
  async login(email: string, password: string): Promise<any> {
    try {
      const response = await fetch(`${PROXY_BASE_URL}/api/auth-proxy/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Proxy login failed', { error });
      throw error;
    }
  }

  /**
   * Proxy register to Better Auth server
   */
  async register(email: string, password: string, name?: string): Promise<any> {
    try {
      const response = await fetch(`${PROXY_BASE_URL}/api/auth-proxy/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Proxy registration failed', { error });
      throw error;
    }
  }

  /**
   * Proxy logout to Better Auth server
   */
  async logout(token: string): Promise<void> {
    try {
      const response = await fetch(`${PROXY_BASE_URL}/api/auth-proxy/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }
    } catch (error) {
      logger.error('Proxy logout failed', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const betterAuthProxy = new BetterAuthProxyService();

// Export convenience functions
export const introspectToken = betterAuthProxy.introspectToken.bind(betterAuthProxy);
export const refreshToken = betterAuthProxy.refreshToken.bind(betterAuthProxy);
export const verifySession = betterAuthProxy.verifySession.bind(betterAuthProxy);
export const proxyLogin = betterAuthProxy.login.bind(betterAuthProxy);
export const proxyRegister = betterAuthProxy.register.bind(betterAuthProxy);
export const proxyLogout = betterAuthProxy.logout.bind(betterAuthProxy);

