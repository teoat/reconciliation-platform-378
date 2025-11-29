/**
 * Better Auth Client Configuration
 * 
 * Provides authentication client for the reconciliation platform.
 * Configured to work with Better Auth server on port 4000.
 */

import { createAuthClient } from 'better-auth/react';

/**
 * Auth server base URL
 * - Development: http://localhost:3001 (Better Auth server)
 * - Production: Set via VITE_AUTH_SERVER_URL
 */
const AUTH_SERVER_URL =
  import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:3001';

/**
 * Better Auth client instance
 * 
 * Provides methods for:
 * - signIn (email/password, OAuth)
 * - signUp (email/password)
 * - signOut
 * - useSession (React hook)
 * - getSession
 * - refreshToken
 */
export const authClient = createAuthClient({
  baseURL: AUTH_SERVER_URL,
  
  // Enable credentials for cookies
  credentials: 'include',
  
  // Session configuration
  sessionToken: {
    // Store token in localStorage for cross-tab sync
    storage: 'localStorage',
    key: 'better-auth-token',
  },
  
  // Error handling
  onError: (error) => {
    console.error('Auth client error:', error);
  },
  
  // Request interceptor for logging
  fetch: async (url, options) => {
    if (import.meta.env.DEV) {
      console.log('[Better Auth]', options?.method || 'GET', url);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok && import.meta.env.DEV) {
      console.error('[Better Auth] Request failed:', response.status, response.statusText);
    }
    
    return response;
  },
});

/**
 * Auth client types for TypeScript
 */
export type AuthClient = typeof authClient;
export type AuthSession = Awaited<ReturnType<typeof authClient.getSession>>;
export type AuthUser = NonNullable<AuthSession>['user'];

/**
 * Helper function to get current session
 */
export async function getCurrentSession(): Promise<AuthSession | null> {
  try {
    const session = await authClient.getSession();
    return session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

/**
 * Helper function to check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return session !== null && session.user !== null;
}

/**
 * Helper function to get auth token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('better-auth-token');
}

/**
 * Helper function to clear auth token
 */
export function clearAuthToken(): void {
  localStorage.removeItem('better-auth-token');
}

