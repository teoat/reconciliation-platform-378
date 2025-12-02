/**
 * Feature Flag Definitions
 * 
 * This file contains all feature flag definitions for the Reconciliation Platform.
 * Add new feature flags here with appropriate metadata.
 */

import { FeatureFlag } from './types';

/**
 * All available feature flags in the system
 */
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // UI Experimental Features
  EXPERIMENTAL_DASHBOARD_V2: {
    key: 'experimental_dashboard_v2',
    name: 'New Dashboard Layout',
    description: 'Enable the experimental V2 dashboard with improved data visualization',
    defaultValue: false,
    category: 'experimental',
    experimental: true,
    targetRemovalDate: '2025-Q2'
  },

  EXPERIMENTAL_DARK_MODE: {
    key: 'experimental_dark_mode',
    name: 'Dark Mode',
    description: 'Enable dark mode theme for the application',
    defaultValue: false,
    category: 'ui',
    experimental: true,
    rolloutPercentage: 50
  },

  EXPERIMENTAL_ADVANCED_FILTERS: {
    key: 'experimental_advanced_filters',
    name: 'Advanced Filters',
    description: 'Enable advanced filtering options in data tables',
    defaultValue: false,
    category: 'ui',
    experimental: true
  },

  // Performance Features
  ENABLE_QUERY_CACHING: {
    key: 'enable_query_caching',
    name: 'Query Result Caching',
    description: 'Cache frequently accessed query results in Redis',
    defaultValue: true,
    category: 'performance'
  },

  ENABLE_LAZY_LOADING: {
    key: 'enable_lazy_loading',
    name: 'Lazy Loading',
    description: 'Enable lazy loading for large data sets',
    defaultValue: true,
    category: 'performance'
  },

  ENABLE_VIRTUAL_SCROLLING: {
    key: 'enable_virtual_scrolling',
    name: 'Virtual Scrolling',
    description: 'Use virtual scrolling for long lists to improve performance',
    defaultValue: true,
    category: 'performance'
  },

  // Backend Features
  ENABLE_ASYNC_RECONCILIATION: {
    key: 'enable_async_reconciliation',
    name: 'Async Reconciliation',
    description: 'Process reconciliation jobs asynchronously in background workers',
    defaultValue: true,
    category: 'backend'
  },

  ENABLE_BATCH_PROCESSING: {
    key: 'enable_batch_processing',
    name: 'Batch Processing',
    description: 'Enable batch processing for large file uploads',
    defaultValue: true,
    category: 'backend'
  },

  ENABLE_WEBHOOK_NOTIFICATIONS: {
    key: 'enable_webhook_notifications',
    name: 'Webhook Notifications',
    description: 'Send webhook notifications for reconciliation events',
    defaultValue: false,
    category: 'backend',
    rolloutPercentage: 25
  },

  // Security Features
  ENABLE_MFA: {
    key: 'enable_mfa',
    name: 'Multi-Factor Authentication',
    description: 'Require MFA for user authentication',
    defaultValue: true,
    category: 'security'
  },

  ENABLE_AUDIT_LOGGING: {
    key: 'enable_audit_logging',
    name: 'Audit Logging',
    description: 'Enable detailed audit logging for all user actions',
    defaultValue: true,
    category: 'security'
  },

  ENABLE_IP_WHITELISTING: {
    key: 'enable_ip_whitelisting',
    name: 'IP Whitelisting',
    description: 'Restrict access to whitelisted IP addresses',
    defaultValue: false,
    category: 'security'
  },

  // Beta Features
  BETA_API_V3: {
    key: 'beta_api_v3',
    name: 'API v3 Beta',
    description: 'Enable access to the new API v3 endpoints',
    defaultValue: false,
    category: 'beta',
    allowedSegments: ['beta-testers', 'internal']
  },

  BETA_REAL_TIME_SYNC: {
    key: 'beta_real_time_sync',
    name: 'Real-time Sync',
    description: 'Enable real-time data synchronization via WebSocket',
    defaultValue: false,
    category: 'beta'
  }
};

/**
 * Get a feature flag by its key
 */
export function getFeatureFlag(key: string): FeatureFlag | undefined {
  return Object.values(FEATURE_FLAGS).find(flag => flag.key === key);
}

/**
 * Get all feature flags in a specific category
 */
export function getFeatureFlagsByCategory(category: string): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS).filter(flag => flag.category === category);
}

/**
 * Get all experimental feature flags
 */
export function getExperimentalFlags(): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS).filter(flag => flag.experimental === true);
}

/**
 * Get all feature flags as a flat array
 */
export function getAllFeatureFlags(): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS);
}
