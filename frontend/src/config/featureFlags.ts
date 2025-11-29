/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag management for gradual rollout of new features.
 * Supports environment-based configuration and localStorage overrides.
 */

export interface FeatureFlags {
  /**
   * Enable Better Auth integration
   * - When true: Uses Better Auth server for authentication
   * - When false: Uses legacy authentication
   */
  enableBetterAuth: boolean;

  /**
   * Enable email verification for new users
   */
  enableEmailVerification: boolean;

  /**
   * Enable password reset functionality
   */
  enablePasswordReset: boolean;

  /**
   * Enable OAuth providers (Google, etc.)
   */
  enableOAuth: boolean;

  /**
   * Enable dual auth mode (supports both Better Auth and legacy)
   * Only effective when enableBetterAuth is true
   */
  enableDualAuthMode: boolean;

  /**
   * Show Better Auth migration banner to users
   */
  showMigrationBanner: boolean;
}

/**
 * Default feature flags from environment variables
 */
const defaultFlags: FeatureFlags = {
  enableBetterAuth:
    import.meta.env.VITE_ENABLE_BETTER_AUTH === 'true' ||
    import.meta.env.VITE_ENABLE_BETTER_AUTH === '1',
  enableEmailVerification:
    import.meta.env.VITE_ENABLE_EMAIL_VERIFICATION === 'true' ||
    import.meta.env.VITE_ENABLE_EMAIL_VERIFICATION === '1',
  enablePasswordReset:
    import.meta.env.VITE_ENABLE_PASSWORD_RESET === 'true' ||
    import.meta.env.VITE_ENABLE_PASSWORD_RESET === '1',
  enableOAuth:
    import.meta.env.VITE_ENABLE_OAUTH === 'true' ||
    import.meta.env.VITE_ENABLE_OAUTH === '1',
  enableDualAuthMode:
    import.meta.env.VITE_ENABLE_DUAL_AUTH === 'true' ||
    import.meta.env.VITE_ENABLE_DUAL_AUTH === '1',
  showMigrationBanner:
    import.meta.env.VITE_SHOW_MIGRATION_BANNER === 'true' ||
    import.meta.env.VITE_SHOW_MIGRATION_BANNER === '1',
};

/**
 * LocalStorage keys for feature flag overrides
 */
const STORAGE_KEYS = {
  enableBetterAuth: 'feature_flag_better_auth',
  enableEmailVerification: 'feature_flag_email_verification',
  enablePasswordReset: 'feature_flag_password_reset',
  enableOAuth: 'feature_flag_oauth',
  enableDualAuthMode: 'feature_flag_dual_auth',
  showMigrationBanner: 'feature_flag_migration_banner',
} as const;

/**
 * Get feature flag value with localStorage override support
 */
function getFlagValue(key: keyof typeof STORAGE_KEYS, defaultValue: boolean): boolean {
  try {
    // Check localStorage override first (for testing/debugging)
    const storageValue = localStorage.getItem(STORAGE_KEYS[key]);
    if (storageValue !== null) {
      return storageValue === 'true' || storageValue === '1';
    }
  } catch (error) {
    console.warn(`Failed to read feature flag from localStorage: ${key}`, error);
  }

  return defaultValue;
}

/**
 * Get current feature flags
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    enableBetterAuth: getFlagValue('enableBetterAuth', defaultFlags.enableBetterAuth),
    enableEmailVerification: getFlagValue('enableEmailVerification', defaultFlags.enableEmailVerification),
    enablePasswordReset: getFlagValue('enablePasswordReset', defaultFlags.enablePasswordReset),
    enableOAuth: getFlagValue('enableOAuth', defaultFlags.enableOAuth),
    enableDualAuthMode: getFlagValue('enableDualAuthMode', defaultFlags.enableDualAuthMode),
    showMigrationBanner: getFlagValue('showMigrationBanner', defaultFlags.showMigrationBanner),
  };
}

/**
 * Set feature flag override in localStorage (for testing/debugging)
 */
export function setFeatureFlag(key: keyof FeatureFlags, value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS[key], value ? 'true' : 'false');
    console.log(`Feature flag ${key} set to ${value}`);
  } catch (error) {
    console.error(`Failed to set feature flag: ${key}`, error);
  }
}

/**
 * Clear feature flag override from localStorage
 */
export function clearFeatureFlag(key: keyof FeatureFlags): void {
  try {
    localStorage.removeItem(STORAGE_KEYS[key]);
    console.log(`Feature flag ${key} cleared`);
  } catch (error) {
    console.error(`Failed to clear feature flag: ${key}`, error);
  }
}

/**
 * Clear all feature flag overrides
 */
export function clearAllFeatureFlags(): void {
  Object.keys(STORAGE_KEYS).forEach((key) => {
    try {
      localStorage.removeItem(STORAGE_KEYS[key as keyof typeof STORAGE_KEYS]);
    } catch (error) {
      console.error(`Failed to clear feature flag: ${key}`, error);
    }
  });
  console.log('All feature flags cleared');
}

/**
 * Check if Better Auth is enabled
 */
export function isBetterAuthEnabled(): boolean {
  return getFeatureFlags().enableBetterAuth;
}

/**
 * Check if dual auth mode is enabled
 */
export function isDualAuthEnabled(): boolean {
  const flags = getFeatureFlags();
  return flags.enableBetterAuth && flags.enableDualAuthMode;
}

/**
 * Check if OAuth is enabled
 */
export function isOAuthEnabled(): boolean {
  return getFeatureFlags().enableOAuth;
}

/**
 * Hook for using feature flags in React components
 */
import { useState, useEffect } from 'react';

export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(getFeatureFlags());

  useEffect(() => {
    // Listen for storage events to sync flags across tabs
    const handleStorageChange = () => {
      setFlags(getFeatureFlags());
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return flags;
}

/**
 * Hook for using a single feature flag
 */
export function useFeatureFlag(key: keyof FeatureFlags): boolean {
  const flags = useFeatureFlags();
  return flags[key];
}

// Export singleton instance for non-React code
export const featureFlags = getFeatureFlags();

// Development helpers (only available in dev mode)
if (import.meta.env.DEV) {
  (window as any).__featureFlags = {
    get: getFeatureFlags,
    set: setFeatureFlag,
    clear: clearFeatureFlag,
    clearAll: clearAllFeatureFlags,
    current: () => console.table(getFeatureFlags()),
  };
  console.log('Feature flags available at: window.__featureFlags');
}

