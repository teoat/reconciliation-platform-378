// ============================================================================
// UNIFIED APPLICATION CONFIGURATION - SINGLE SOURCE OF TRUTH
// ============================================================================

/**
 * Consolidated configuration from constants/index.ts and config/index.ts
 * This file is the SSOT for all application configuration
 */

// Environment-agnostic configuration reading
const getEnvVar = (key: string, fallback: string): string => {
  // Priority 1: Vite environment variables (import.meta.env.VITE_*)
  // This is the correct way for Vite - accessed directly
  // import.meta is always available in ES modules, so we can access it directly
  try {
    if (import.meta?.env?.[key]) {
      return import.meta.env[key] as string;
    }
  } catch (e) {
    // import.meta not available (shouldn't happen in ES modules, but handle gracefully)
  }

  // Priority 2: Try process.env with original key (legacy support)
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }

  return fallback;
};

// ============================================================================
// APP CONFIGURATION
// ============================================================================

export const APP_CONFIG = {
  // Unified API Configuration (SSOT)
  API_URL: getEnvVar('VITE_API_URL', 'http://localhost:2000/api/v1'),
  WS_URL: getEnvVar('VITE_WS_URL', 'ws://localhost:2000'),
  /**
   * @deprecated Use API_URL instead. This alias will be removed in the next major version.
   */
  API_BASE_URL: getEnvVar('VITE_API_URL', 'http://localhost:2000/api/v1'), // Legacy alias - deprecated
  /**
   * @deprecated Use WS_URL instead. This alias will be removed in the next major version.
   */
  WS_BASE_URL: getEnvVar('VITE_WS_URL', 'ws://localhost:2000'), // Legacy alias - deprecated

  // Application Configuration
  APP_NAME: getEnvVar('VITE_APP_NAME', 'Reconciliation Platform'),
  APP_VERSION: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  VERSION: '1.0.0', // Legacy alias

  // Environment
  ENVIRONMENT: getEnvVar('NODE_ENV', 'development'),
  DEBUG: getEnvVar('VITE_DEBUG', 'false') === 'true',
  LOG_LEVEL: getEnvVar('VITE_LOG_LEVEL', 'info'),

  // File & Performance Configuration
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  AUTO_SAVE_INTERVAL: 5 * 1000, // 5 seconds
  DEBOUNCE_DELAY: 300, // 300ms
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    PROFILE: '/api/v1/auth/profile',
  },
  PROJECTS: {
    LIST: '/api/v1/projects',
    CREATE: '/api/v1/projects',
    GET: '/api/v1/projects/:id',
    UPDATE: '/api/v1/projects/:id',
    DELETE: '/api/v1/projects/:id',
    ARCHIVE: '/api/v1/projects/:id/archive',
  },
  RECONCILIATION: {
    RECORDS: '/api/v1/reconciliation/records',
    START: '/api/v1/reconciliation/start',
    MATCH: '/api/v1/reconciliation/match',
    RESOLVE: '/api/v1/reconciliation/resolve',
  },
  FILES: {
    UPLOAD: '/api/v1/projects/:projectId/files/upload',
    DOWNLOAD: '/api/v1/files/:id',
    DELETE: '/api/v1/files/:id',
  },
  ANALYTICS: {
    DASHBOARD: '/api/v1/analytics/dashboard',
    REPORTS: '/api/v1/analytics/reports',
    METRICS: '/api/v1/analytics/metrics',
  },
};

// ============================================================================
// WEBSOCKET EVENTS
// ============================================================================

export const WEBSOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  RECONCILIATION_UPDATE: 'reconciliation_update',
  PROJECT_UPDATE: 'project_update',
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave',
  NOTIFICATION: 'notification',
};

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  PROJECT_DATA: 'project_data',
  FORM_DATA: 'form_data',
  THEME: 'theme',
  LANGUAGE: 'language',
  SETTINGS: 'settings',
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PROJECT_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  FILE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['.csv', '.xlsx', '.xls', '.json', '.xml', '.txt'],
};

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`,
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
  INVALID_FILE_TYPE: 'File type is not supported',
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  SERVER_ERROR: 'An internal server error occurred',
  VALIDATION_ERROR: 'Please check your input and try again',
};

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in',
  LOGOUT_SUCCESS: 'Successfully logged out',
  PROJECT_CREATED: 'Project created successfully',
  PROJECT_UPDATED: 'Project updated successfully',
  PROJECT_DELETED: 'Project deleted successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  RECONCILIATION_STARTED: 'Reconciliation process started',
  RECONCILIATION_COMPLETED: 'Reconciliation completed successfully',
  DATA_SAVED: 'Data saved successfully',
  SETTINGS_UPDATED: 'Settings updated successfully',
};

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const UI_CONSTANTS = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  TOAST_DURATION: 5000,
  MODAL_ANIMATION_DURATION: 200,
  LOADING_SPINNER_SIZE: 24,
  PAGINATION_DEFAULT_PAGE_SIZE: 20,
  MAX_SEARCH_RESULTS: 100,
  AUTO_SAVE_DELAY: 2000,
};

// ============================================================================
// THEME COLORS
// ============================================================================

export const THEME_COLORS = {
  PRIMARY: '#3B82F6',
  SECONDARY: '#6B7280',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  BACKGROUND: '#FFFFFF',
  SURFACE: '#F9FAFB',
  TEXT_PRIMARY: '#111827',
  TEXT_SECONDARY: '#6B7280',
  BORDER: '#E5E7EB',
  DISABLED: '#9CA3AF',
};

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
};

// ============================================================================
// Z-INDEX
// ============================================================================

export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
};

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

// Re-export as ERROR_CODES for backward compatibility
export const ERROR_CODES = HTTP_STATUS;

// ============================================================================
// STATUS ENUMS
// ============================================================================

export const RECONCILIATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const MATCH_STATUS = {
  MATCHED: 'matched',
  UNMATCHED: 'unmatched',
  MANUAL_REVIEW: 'manual_review',
  RESOLVED: 'resolved',
  CONFLICT: 'conflict',
};

export const FILE_STATUS = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// ============================================================================
// USER ROLES & PERMISSIONS
// ============================================================================

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
};

export const PERMISSIONS = {
  PROJECT_CREATE: 'project:create',
  PROJECT_READ: 'project:read',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  RECONCILIATION_START: 'reconciliation:start',
  RECONCILIATION_VIEW: 'reconciliation:view',
  RECONCILIATION_RESOLVE: 'reconciliation:resolve',
  FILE_UPLOAD: 'file:upload',
  FILE_DOWNLOAD: 'file:download',
  ANALYTICS_VIEW: 'analytics:view',
  USER_MANAGE: 'user:manage',
  SETTINGS_UPDATE: 'settings:update',
};

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

// ============================================================================
// CHART TYPES
// ============================================================================

export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  DOUGHNUT: 'doughnut',
  SCATTER: 'scatter',
  RADAR: 'radar',
  POLAR_AREA: 'polarArea',
  AREA: 'area',
  HEATMAP: 'heatmap',
  SANKEY: 'sankey',
  TREEMAP: 'treemap',
};

// Export as CHART_CONFIG for backward compatibility
export const CHART_CONFIG = CHART_TYPES;

// ============================================================================
// DATE FORMATS
// ============================================================================

export const DATE_FORMATS = {
  SHORT: 'MM/dd/yyyy',
  LONG: 'MMMM dd, yyyy',
  TIME: 'HH:mm:ss',
  DATETIME: 'MM/dd/yyyy HH:mm:ss',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
};

// ============================================================================
// LOCALE CONFIG
// ============================================================================

export const LOCALE_CONFIG = {
  DEFAULT: 'en-US',
  SUPPORTED: ['en-US', 'es-ES', 'fr-FR', 'de-DE'],
  FALLBACK: 'en-US',
};

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURE_FLAGS = {
  AUTO_SAVE: 'auto_save',
  REAL_TIME_SYNC: 'real_time_sync',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  COLLABORATION: 'collaboration',
  API_INTEGRATION: 'api_integration',
  MOBILE_APP: 'mobile_app',
  DARK_MODE: 'dark_mode',
  MULTI_LANGUAGE: 'multi_language',
  // From config/index.ts
  REAL_TIME_COLLABORATION: true,
  FILE_UPLOAD: true,
  WEBHOOK_INTEGRATION: true,
  API_RATE_LIMITING: true,
};

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

export const PERFORMANCE_METRICS = {
  API_RESPONSE_TIME_THRESHOLD: 1000, // 1 second
  PAGE_LOAD_TIME_THRESHOLD: 3000, // 3 seconds
  MEMORY_USAGE_THRESHOLD: 100 * 1024 * 1024, // 100MB
  CPU_USAGE_THRESHOLD: 80, // 80%
  ERROR_RATE_THRESHOLD: 0.05, // 5%
};

// ============================================================================
// SECURITY CONFIG
// ============================================================================

export const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SYMBOLS: true,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
  // From config/index.ts
  CSP_ENABLED: true,
};

// ============================================================================
// UNIFIED CONFIG OBJECT
// ============================================================================

export const Config = {
  app: APP_CONFIG,
  api: API_ENDPOINTS,
  websocket: WEBSOCKET_EVENTS,
  storage: STORAGE_KEYS,
  validation: VALIDATION_RULES,
  errors: ERROR_MESSAGES,
  success: SUCCESS_MESSAGES,
  ui: UI_CONSTANTS,
  theme: THEME_COLORS,
  breakpoints: BREAKPOINTS,
  zIndex: Z_INDEX,
  http: HTTP_STATUS,
  reconciliation: RECONCILIATION_STATUS,
  match: MATCH_STATUS,
  file: FILE_STATUS,
  roles: USER_ROLES,
  permissions: PERMISSIONS,
  notifications: NOTIFICATION_TYPES,
  charts: CHART_TYPES,
  dates: DATE_FORMATS,
  locale: LOCALE_CONFIG,
  features: FEATURE_FLAGS,
  performance: PERFORMANCE_METRICS,
  security: SECURITY_CONFIG,
};

export default Config;
