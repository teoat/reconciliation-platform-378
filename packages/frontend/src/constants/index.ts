// Application constants and configuration

export const APP_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:2000/api',
  WS_BASE_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:2000',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  AUTO_SAVE_INTERVAL: 5 * 1000, // 5 seconds
  DEBOUNCE_DELAY: 300, // 300ms
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  VERSION: '1.0.0',
  ENVIRONMENT: import.meta.env.MODE || 'development'
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile'
  },
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    GET: '/projects/:id',
    UPDATE: '/projects/:id',
    DELETE: '/projects/:id',
    ARCHIVE: '/projects/:id/archive'
  },
  RECONCILIATION: {
    RECORDS: '/reconciliation/records',
    START: '/reconciliation/start',
    MATCH: '/reconciliation/match',
    RESOLVE: '/reconciliation/resolve'
  },
  FILES: {
    UPLOAD: '/files/upload',
    DOWNLOAD: '/files/:id',
    DELETE: '/files/:id'
  },
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    REPORTS: '/analytics/reports',
    METRICS: '/analytics/metrics'
  }
}

export const WEBSOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  RECONCILIATION_UPDATE: 'reconciliation_update',
  PROJECT_UPDATE: 'project_update',
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave',
  NOTIFICATION: 'notification'
}

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  PROJECT_DATA: 'project_data',
  FORM_DATA: 'form_data',
  THEME: 'theme',
  LANGUAGE: 'language',
  SETTINGS: 'settings'
}

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PROJECT_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  FILE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['.csv', '.xlsx', '.xls', '.json', '.xml']
}

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
  VALIDATION_ERROR: 'Please check your input and try again'
}

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
  SETTINGS_UPDATED: 'Settings updated successfully'
}

export const UI_CONSTANTS = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  TOAST_DURATION: 5000,
  MODAL_ANIMATION_DURATION: 200,
  LOADING_SPINNER_SIZE: 24,
  PAGINATION_DEFAULT_PAGE_SIZE: 20,
  MAX_SEARCH_RESULTS: 100,
  AUTO_SAVE_DELAY: 2000
}

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
  DISABLED: '#9CA3AF'
}

export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px'
}

export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080
}

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
  SERVICE_UNAVAILABLE: 503
}

export const RECONCILIATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
}

export const MATCH_STATUS = {
  MATCHED: 'matched',
  UNMATCHED: 'unmatched',
  MANUAL_REVIEW: 'manual_review',
  RESOLVED: 'resolved',
  CONFLICT: 'conflict'
}

export const FILE_STATUS = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
}

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  ANALYST: 'analyst',
  VIEWER: 'viewer'
}

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
  SETTINGS_UPDATE: 'settings:update'
}

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
}

export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  DOUGHNUT: 'doughnut',
  SCATTER: 'scatter',
  RADAR: 'radar',
  POLAR_AREA: 'polarArea'
}

export const DATE_FORMATS = {
  SHORT: 'MM/dd/yyyy',
  LONG: 'MMMM dd, yyyy',
  TIME: 'HH:mm:ss',
  DATETIME: 'MM/dd/yyyy HH:mm:ss',
  ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\''
}

export const LOCALE_CONFIG = {
  DEFAULT: 'en-US',
  SUPPORTED: ['en-US', 'es-ES', 'fr-FR', 'de-DE'],
  FALLBACK: 'en-US'
}

export const FEATURE_FLAGS = {
  AUTO_SAVE: 'auto_save',
  REAL_TIME_SYNC: 'real_time_sync',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  COLLABORATION: 'collaboration',
  API_INTEGRATION: 'api_integration',
  MOBILE_APP: 'mobile_app',
  DARK_MODE: 'dark_mode',
  MULTI_LANGUAGE: 'multi_language'
}

export const PERFORMANCE_METRICS = {
  API_RESPONSE_TIME_THRESHOLD: 1000, // 1 second
  PAGE_LOAD_TIME_THRESHOLD: 3000, // 3 seconds
  MEMORY_USAGE_THRESHOLD: 100 * 1024 * 1024, // 100MB
  CPU_USAGE_THRESHOLD: 80, // 80%
  ERROR_RATE_THRESHOLD: 0.05 // 5%
}

export const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SYMBOLS: true,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000 // 5 minutes
}
