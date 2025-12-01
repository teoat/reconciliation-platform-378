/**
 * React Hooks for Feature Flags
 * 
 * Provides React hooks for easy feature flag integration in components.
 */

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import type { ReactNode, ComponentType, FC } from 'react';
import { FeatureFlagProvider, getDefaultProvider } from './provider';
import type { FeatureFlagConfig, FeatureFlagContext as FeatureFlagContextType, FeatureFlag } from './types';
import { getFeatureFlag, getExperimentalFlags } from './flags';

// React context for feature flags
const FeatureFlagReactContext = createContext<FeatureFlagProvider | null>(null);

interface FeatureFlagProviderProps {
  config?: FeatureFlagConfig;
  context?: FeatureFlagContextType;
  children: ReactNode;
}

/**
 * Provider component for feature flags
 */
export function FeatureFlagProviderComponent({ 
  config, 
  context, 
  children 
}: FeatureFlagProviderProps): React.JSX.Element {
  const [provider] = useState(() => {
    const p = new FeatureFlagProvider(config);
    if (context) {
      p.initialize(context);
    }
    return p;
  });

  useEffect(() => {
    if (context) {
      provider.initialize(context);
    }
  }, [context, provider]);

  return (
    <FeatureFlagReactContext.Provider value={provider}>
      {children}
    </FeatureFlagReactContext.Provider>
  );
}

/**
 * Hook to access the feature flag provider
 */
export function useFeatureFlagProvider(): FeatureFlagProvider {
  const provider = useContext(FeatureFlagReactContext);
  if (!provider) {
    // Fall back to default provider if not in context
    return getDefaultProvider();
  }
  return provider;
}

/**
 * Hook to check if a feature flag is enabled
 * 
 * @example
 * const isDarkModeEnabled = useFeatureFlag('experimental_dark_mode');
 */
export function useFeatureFlag(flagKey: string, defaultValue?: boolean): boolean {
  const provider = useFeatureFlagProvider();
  const [isEnabled, setIsEnabled] = useState(() => 
    provider.isEnabled(flagKey, defaultValue)
  );

  useEffect(() => {
    setIsEnabled(provider.isEnabled(flagKey, defaultValue));
  }, [provider, flagKey, defaultValue]);

  return isEnabled;
}

/**
 * Hook to get feature flag with full evaluation details
 */
export function useFeatureFlagEvaluation(flagKey: string, defaultValue?: boolean) {
  const provider = useFeatureFlagProvider();
  
  return useMemo(() => 
    provider.evaluate(flagKey, defaultValue),
    [provider, flagKey, defaultValue]
  );
}

/**
 * Hook to get all enabled features
 */
export function useEnabledFeatures(): string[] {
  const provider = useFeatureFlagProvider();
  const [enabled, setEnabled] = useState<string[]>([]);

  useEffect(() => {
    setEnabled(provider.getEnabledFeatures());
  }, [provider]);

  return enabled;
}

/**
 * Hook to manage feature flag overrides
 */
export function useFeatureFlagOverrides() {
  const provider = useFeatureFlagProvider();
  const [overrides, setOverrides] = useState(provider.getOverrides());

  const setOverride = useCallback((flagKey: string, value: boolean, reason?: string) => {
    provider.setOverride({ flagKey, value, reason });
    setOverrides(provider.getOverrides());
  }, [provider]);

  const removeOverride = useCallback((flagKey: string) => {
    provider.removeOverride(flagKey);
    setOverrides(provider.getOverrides());
  }, [provider]);

  const clearOverrides = useCallback(() => {
    provider.clearOverrides();
    setOverrides([]);
  }, [provider]);

  return {
    overrides,
    setOverride,
    removeOverride,
    clearOverrides
  };
}

/**
 * Hook to get all experimental features
 */
export function useExperimentalFeatures(): FeatureFlag[] {
  return useMemo(() => getExperimentalFlags(), []);
}

/**
 * Hook to get a specific feature flag definition
 */
export function useFeatureFlagDefinition(flagKey: string): FeatureFlag | undefined {
  return useMemo(() => getFeatureFlag(flagKey), [flagKey]);
}

/**
 * Higher-order component to conditionally render based on feature flag
 */
export function withFeatureFlag<P extends object>(
  WrappedComponent: ComponentType<P>,
  flagKey: string,
  FallbackComponent?: ComponentType<P>
): FC<P> {
  return function FeatureFlaggedComponent(props: P) {
    const isEnabled = useFeatureFlag(flagKey);

    if (isEnabled) {
      return <WrappedComponent {...props} />;
    }

    if (FallbackComponent) {
      return <FallbackComponent {...props} />;
    }

    return null;
  };
}

/**
 * Component that conditionally renders children based on feature flag
 * 
 * @example
 * <Feature flag="experimental_dark_mode">
 *   <DarkModeToggle />
 * </Feature>
 */
export function Feature({ 
  flag, 
  children, 
  fallback = null 
}: { 
  flag: string; 
  children: ReactNode; 
  fallback?: ReactNode;
}): React.JSX.Element | null {
  const isEnabled = useFeatureFlag(flag);
  
  if (isEnabled) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}
