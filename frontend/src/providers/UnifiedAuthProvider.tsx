/**
 * Unified Auth Provider
 * 
 * Provides a single AuthProvider that switches between Better Auth and legacy auth
 * based on feature flags. This allows for gradual rollout and A/B testing.
 */

import React, { ReactNode } from 'react';
import { AuthProvider as LegacyAuthProvider } from '@/hooks/useAuth';
import { BetterAuthProvider } from '@/hooks/useBetterAuth';
import { useFeatureFlag } from '@/config/featureFlags';
import { logger } from '@/services/logger';

interface UnifiedAuthProviderProps {
  children: ReactNode;
}

export const UnifiedAuthProvider: React.FC<UnifiedAuthProviderProps> = ({ children }) => {
  const enableBetterAuth = useFeatureFlag('enableBetterAuth');

  // Log which auth system is active (only in development)
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      logger.log('Auth system active:', enableBetterAuth ? 'Better Auth' : 'Legacy Auth');
    }
  }, [enableBetterAuth]);

  // Render appropriate provider based on feature flag
  if (enableBetterAuth) {
    return <BetterAuthProvider>{children}</BetterAuthProvider>;
  }

  return <LegacyAuthProvider>{children}</LegacyAuthProvider>;
};

/**
 * Export unified useAuth hook that works with both providers
 * 
 * This ensures components can use useAuth() regardless of which
 * provider is active.
 */
export { useAuth } from '@/hooks/useAuth';
export { useBetterAuth } from '@/hooks/useBetterAuth';

// Re-export ProtectedRoute for convenience
export { ProtectedRoute } from '@/hooks/useAuth';

