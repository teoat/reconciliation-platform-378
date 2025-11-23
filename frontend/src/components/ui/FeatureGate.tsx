/**
 * Feature Gate Component
 * 
 * Provides feature gating functionality for:
 * - Permission-based access control
 * - Role-based feature access
 * - Feature unlock mechanism
 * - Feature availability tracking
 */

import React from 'react';
import { FEATURE_FLAGS } from '../../config/AppConfig';

export type UserRole = 'admin' | 'analyst' | 'viewer' | 'user';
export type FeaturePermission = 'read' | 'write' | 'admin' | 'none';

export interface FeatureGateConfig {
  featureId: string;
  requiredRole?: UserRole[];
  requiredPermissions?: string[];
  requiredFlag?: string;
  fallback?: React.ReactNode;
  showUnavailable?: boolean;
  onUnauthorized?: () => void;
}

export interface FeatureGateProps {
  featureId: string;
  requiredRole?: UserRole[];
  requiredPermissions?: string[];
  requiredFlag?: string;
  fallback?: React.ReactNode;
  showUnavailable?: boolean;
  userRole?: UserRole;
  userPermissions?: string[];
  children: React.ReactNode;
  className?: string;
}

/**
 * Feature Gate Component
 * 
 * Gates feature access based on:
 * - User role
 * - User permissions
 * - Feature flags
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  featureId,
  requiredRole = [],
  requiredPermissions = [],
  requiredFlag,
  fallback = null,
  showUnavailable = false,
  userRole,
  userPermissions = [],
  children,
  className = '',
}) => {
  // Check feature flag
  if (requiredFlag) {
    const flagValue = (FEATURE_FLAGS as Record<string, string | boolean | undefined>)[requiredFlag];
    if (!flagValue) {
      return (
        <>
          {fallback}
          {showUnavailable && (
            <div className={`feature-unavailable ${className}`} data-feature-id={featureId}>
              <p className="text-sm text-gray-500">This feature is currently unavailable.</p>
            </div>
          )}
        </>
      );
    }
  }

  // Check role requirement
  if (requiredRole.length > 0 && userRole) {
    if (!requiredRole.includes(userRole)) {
      return (
        <>
          {fallback}
          {showUnavailable && (
            <div className={`feature-unavailable ${className}`} data-feature-id={featureId}>
              <p className="text-sm text-gray-500">
                This feature requires {requiredRole.join(' or ')} role.
              </p>
            </div>
          )}
        </>
      );
    }
  }

  // Check permission requirement
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );
    if (!hasAllPermissions) {
      return (
        <>
          {fallback}
          {showUnavailable && (
            <div className={`feature-unavailable ${className}`} data-feature-id={featureId}>
              <p className="text-sm text-gray-500">
                You don't have the required permissions for this feature.
              </p>
            </div>
          )}
        </>
      );
    }
  }

  // All checks passed - render children
  return <div className={className} data-feature-id={featureId}>{children}</div>;
};

/**
 * Hook for checking feature availability
 */
export const useFeatureGate = (
  featureId: string,
  config: Omit<FeatureGateConfig, 'featureId'>
): {
  isAvailable: boolean;
  reason?: string;
} => {
  const { requiredRole = [], requiredPermissions = [], requiredFlag, userRole, userPermissions = [] } = config as any;

  // Check feature flag
  if (requiredFlag) {
    const flagValue = (FEATURE_FLAGS as Record<string, string | boolean | undefined>)[requiredFlag];
    if (!flagValue) {
      return {
        isAvailable: false,
        reason: 'Feature flag is disabled',
      };
    }
  }

  // Check role requirement
  if (requiredRole.length > 0 && userRole) {
    if (!requiredRole.includes(userRole)) {
      return {
        isAvailable: false,
        reason: `Requires ${requiredRole.join(' or ')} role`,
      };
    }
  }

  // Check permission requirement
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );
    if (!hasAllPermissions) {
      return {
        isAvailable: false,
        reason: 'Insufficient permissions',
      };
    }
  }

  return { isAvailable: true };
};

/**
 * Feature Badge Component
 * 
 * Displays badges for new features, unlocked features, etc.
 */
export interface FeatureBadgeProps {
  type: 'new' | 'beta' | 'premium' | 'unlocked';
  label?: string;
  className?: string;
}

export const FeatureBadge: React.FC<FeatureBadgeProps> = ({
  type,
  label,
  className = '',
}) => {
  const badges = {
    new: { text: label || 'New', color: 'bg-green-100 text-green-800' },
    beta: { text: label || 'Beta', color: 'bg-blue-100 text-blue-800' },
    premium: { text: label || 'Premium', color: 'bg-purple-100 text-purple-800' },
    unlocked: { text: label || 'Unlocked', color: 'bg-yellow-100 text-yellow-800' },
  };

  const badge = badges[type];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color} ${className}`}
    >
      {badge.text}
    </span>
  );
};

export default FeatureGate;

