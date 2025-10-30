// Single Source of Truth (SSOT) for all application constants
// This file contains all constant values used across the application

// ============================================================================
// APPLICATION CONSTANTS
// ============================================================================

export const APP_CONFIG = {
  NAME: '378 Data and Evidence Reconciliation App',
  VERSION: '1.0.0',
  DESCRIPTION: 'Enterprise Data and Evidence Reconciliation Platform',
  AUTHOR: '378 Data and Evidence Team',
  SUPPORT_EMAIL: 'support@378app.com',
  DOCUMENTATION_URL: 'https://docs.378app.com',
  API_VERSION: 'v1',
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_TIMEZONE: 'Asia/Jakarta',
  DEFAULT_CURRENCY: 'IDR',
  DEFAULT_DATE_FORMAT: 'DD/MM/YYYY',
  DEFAULT_TIME_FORMAT: 'HH:mm:ss',
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_RECORDS_PER_PAGE: 1000,
  DEFAULT_PAGE_SIZE: 50,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 254,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
  NOTES_MAX_LENGTH: 5000,
  TAG_MAX_LENGTH: 50,
  MAX_TAGS_PER_ITEM: 10,
  MAX_ATTACHMENTS_PER_ITEM: 20,
  MAX_COMMENTS_PER_ITEM: 1000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  DEBOUNCE_DELAY: 300, // 300ms
  THROTTLE_DELAY: 1000, // 1 second
  ANIMATION_DURATION: 300, // 300ms
  TOAST_DURATION: 5000, // 5 seconds
  MODAL_ANIMATION_DURATION: 200, // 200ms
  LOADING_TIMEOUT: 30000, // 30 seconds
  UPLOAD_TIMEOUT: 300000, // 5 minutes
  EXPORT_TIMEOUT: 600000, // 10 minutes
  ANALYSIS_TIMEOUT: 1800000, // 30 minutes
} as const

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    REGISTER: '/api/auth/register',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email',
    CHANGE_PASSWORD: '/api/auth/change-password',
    PROFILE: '/api/auth/profile',
  },
  
  // Projects
  PROJECTS: {
    BASE: '/api/projects',
    LIST: '/api/projects',
    CREATE: '/api/projects',
    GET: (id: string) => `/api/projects/${id}`,
    UPDATE: (id: string) => `/api/projects/${id}`,
    DELETE: (id: string) => `/api/projects/${id}`,
    ARCHIVE: (id: string) => `/api/projects/${id}/archive`,
    RESTORE: (id: string) => `/api/projects/${id}/restore`,
    MEMBERS: (id: string) => `/api/projects/${id}/members`,
    SETTINGS: (id: string) => `/api/projects/${id}/settings`,
    ANALYTICS: (id: string) => `/api/projects/${id}/analytics`,
  },
  
  // Data Ingestion
  INGESTION: {
    BASE: '/api/ingestion',
    UPLOAD: '/api/ingestion/upload',
    PROCESS: '/api/ingestion/process',
    VALIDATE: '/api/ingestion/validate',
    TRANSFORM: '/api/ingestion/transform',
    STATUS: (id: string) => `/api/ingestion/${id}/status`,
    RESULTS: (id: string) => `/api/ingestion/${id}/results`,
    ERRORS: (id: string) => `/api/ingestion/${id}/errors`,
    DOWNLOAD: (id: string) => `/api/ingestion/${id}/download`,
  },
  
  // Reconciliation
  RECONCILIATION: {
    BASE: '/api/reconciliation',
    RECORDS: '/api/reconciliation/records',
    CREATE_RECORD: '/api/reconciliation/records',
    GET_RECORD: (id: string) => `/api/reconciliation/records/${id}`,
    UPDATE_RECORD: (id: string) => `/api/reconciliation/records/${id}`,
    DELETE_RECORD: (id: string) => `/api/reconciliation/records/${id}`,
    BULK_UPDATE: '/api/reconciliation/records/bulk',
    BULK_DELETE: '/api/reconciliation/records/bulk',
    MATCH: '/api/reconciliation/match',
    UNMATCH: '/api/reconciliation/unmatch',
    RULES: '/api/reconciliation/rules',
    CREATE_RULE: '/api/reconciliation/rules',
    GET_RULE: (id: string) => `/api/reconciliation/rules/${id}`,
    UPDATE_RULE: (id: string) => `/api/reconciliation/rules/${id}`,
    DELETE_RULE: (id: string) => `/api/reconciliation/rules/${id}`,
    TEST_RULE: '/api/reconciliation/rules/test',
    BATCHES: '/api/reconciliation/batches',
    CREATE_BATCH: '/api/reconciliation/batches',
    GET_BATCH: (id: string) => `/api/reconciliation/batches/${id}`,
    PROCESS_BATCH: (id: string) => `/api/reconciliation/batches/${id}/process`,
    METRICS: '/api/reconciliation/metrics',
    EXPORT: '/api/reconciliation/export',
  },
  
  // Cashflow Evaluation
  CASHFLOW: {
    BASE: '/api/cashflow',
    ANALYSIS: '/api/cashflow/analysis',
    CATEGORIES: '/api/cashflow/categories',
    CREATE_CATEGORY: '/api/cashflow/categories',
    GET_CATEGORY: (id: string) => `/api/cashflow/categories/${id}`,
    UPDATE_CATEGORY: (id: string) => `/api/cashflow/categories/${id}`,
    DELETE_CATEGORY: (id: string) => `/api/cashflow/categories/${id}`,
    TRANSACTIONS: '/api/cashflow/transactions',
    CREATE_TRANSACTION: '/api/cashflow/transactions',
    GET_TRANSACTION: (id: string) => `/api/cashflow/transactions/${id}`,
    UPDATE_TRANSACTION: (id: string) => `/api/cashflow/transactions/${id}`,
    DELETE_TRANSACTION: (id: string) => `/api/cashflow/transactions/${id}`,
    DISCREPANCIES: '/api/cashflow/discrepancies',
    CREATE_DISCREPANCY: '/api/cashflow/discrepancies',
    GET_DISCREPANCY: (id: string) => `/api/cashflow/discrepancies/${id}`,
    UPDATE_DISCREPANCY: (id: string) => `/api/cashflow/discrepancies/${id}`,
    RESOLVE_DISCREPANCY: (id: string) => `/api/cashflow/discrepancies/${id}/resolve`,
    METRICS: '/api/cashflow/metrics',
    EXPORT: '/api/cashflow/export',
  },
  
  // Adjudication
  ADJUDICATION: {
    BASE: '/api/adjudication',
    CASES: '/api/adjudication/cases',
    CREATE_CASE: '/api/adjudication/cases',
    GET_CASE: (id: string) => `/api/adjudication/cases/${id}`,
    UPDATE_CASE: (id: string) => `/api/adjudication/cases/${id}`,
    DELETE_CASE: (id: string) => `/api/adjudication/cases/${id}`,
    ASSIGN_CASE: (id: string) => `/api/adjudication/cases/${id}/assign`,
    RESOLVE_CASE: (id: string) => `/api/adjudication/cases/${id}/resolve`,
    WORKFLOWS: '/api/adjudication/workflows',
    CREATE_WORKFLOW: '/api/adjudication/workflows',
    GET_WORKFLOW: (id: string) => `/api/adjudication/workflows/${id}`,
    UPDATE_WORKFLOW: (id: string) => `/api/adjudication/workflows/${id}`,
    DELETE_WORKFLOW: (id: string) => `/api/adjudication/workflows/${id}`,
    DECISIONS: '/api/adjudication/decisions',
    CREATE_DECISION: '/api/adjudication/decisions',
    GET_DECISION: (id: string) => `/api/adjudication/decisions/${id}`,
    UPDATE_DECISION: (id: string) => `/api/adjudication/decisions/${id}`,
    APPEAL_DECISION: (id: string) => `/api/adjudication/decisions/${id}/appeal`,
    METRICS: '/api/adjudication/metrics',
    EXPORT: '/api/adjudication/export',
  },
  
  // Visualization
  VISUALIZATION: {
    BASE: '/api/visualization',
    CHARTS: '/api/visualization/charts',
    CREATE_CHART: '/api/visualization/charts',
    GET_CHART: (id: string) => `/api/visualization/charts/${id}`,
    UPDATE_CHART: (id: string) => `/api/visualization/charts/${id}`,
    DELETE_CHART: (id: string) => `/api/visualization/charts/${id}`,
    DASHBOARDS: '/api/visualization/dashboards',
    CREATE_DASHBOARD: '/api/visualization/dashboards',
    GET_DASHBOARD: (id: string) => `/api/visualization/dashboards/${id}`,
    UPDATE_DASHBOARD: (id: string) => `/api/visualization/dashboards/${id}`,
    DELETE_DASHBOARD: (id: string) => `/api/visualization/dashboards/${id}`,
    REPORTS: '/api/visualization/reports',
    CREATE_REPORT: '/api/visualization/reports',
    GET_REPORT: (id: string) => `/api/visualization/reports/${id}`,
    UPDATE_REPORT: (id: string) => `/api/visualization/reports/${id}`,
    DELETE_REPORT: (id: string) => `/api/visualization/reports/${id}`,
    GENERATE_REPORT: (id: string) => `/api/visualization/reports/${id}/generate`,
    SCHEDULE_REPORT: (id: string) => `/api/visualization/reports/${id}/schedule`,
    EXPORT: '/api/visualization/export',
  },
  
  // File Management
  FILES: {
    BASE: '/api/files',
    UPLOAD: '/api/files/upload',
    GET: (id: string) => `/api/files/${id}`,
    DOWNLOAD: (id: string) => `/api/files/${id}/download`,
    DELETE: (id: string) => `/api/files/${id}`,
    METADATA: (id: string) => `/api/files/${id}/metadata`,
    PREVIEW: (id: string) => `/api/files/${id}/preview`,
  },
  
  // User Management
  USERS: {
    BASE: '/api/users',
    LIST: '/api/users',
    CREATE: '/api/users',
    GET: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
    ROLES: '/api/users/roles',
    PERMISSIONS: '/api/users/permissions',
    PREFERENCES: (id: string) => `/api/users/${id}/preferences`,
    ACTIVITY: (id: string) => `/api/users/${id}/activity`,
  },
  
  // Teams & Workspaces
  TEAMS: {
    BASE: '/api/teams',
    LIST: '/api/teams',
    CREATE: '/api/teams',
    GET: (id: string) => `/api/teams/${id}`,
    UPDATE: (id: string) => `/api/teams/${id}`,
    DELETE: (id: string) => `/api/teams/${id}`,
    MEMBERS: (id: string) => `/api/teams/${id}/members`,
    INVITE: (id: string) => `/api/teams/${id}/invite`,
    REMOVE_MEMBER: (id: string, userId: string) => `/api/teams/${id}/members/${userId}`,
    PERMISSIONS: (id: string) => `/api/teams/${id}/permissions`,
  },
  
  // Workflows
  WORKFLOWS: {
    BASE: '/api/workflows',
    LIST: '/api/workflows',
    CREATE: '/api/workflows',
    GET: (id: string) => `/api/workflows/${id}`,
    UPDATE: (id: string) => `/api/workflows/${id}`,
    DELETE: (id: string) => `/api/workflows/${id}`,
    INSTANCES: '/api/workflows/instances',
    CREATE_INSTANCE: '/api/workflows/instances',
    GET_INSTANCE: (id: string) => `/api/workflows/instances/${id}`,
    UPDATE_INSTANCE: (id: string) => `/api/workflows/instances/${id}`,
    CANCEL_INSTANCE: (id: string) => `/api/workflows/instances/${id}/cancel`,
    RULES: '/api/workflows/rules',
    CREATE_RULE: '/api/workflows/rules',
    GET_RULE: (id: string) => `/api/workflows/rules/${id}`,
    UPDATE_RULE: (id: string) => `/api/workflows/rules/${id}`,
    DELETE_RULE: (id: string) => `/api/workflows/rules/${id}`,
    TEST_RULE: '/api/workflows/rules/test',
  },
  
  // Notifications
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    LIST: '/api/notifications',
    GET: (id: string) => `/api/notifications/${id}`,
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_UNREAD: (id: string) => `/api/notifications/${id}/unread`,
    DELETE: (id: string) => `/api/notifications/${id}`,
    BULK_READ: '/api/notifications/bulk/read',
    BULK_DELETE: '/api/notifications/bulk/delete',
    PREFERENCES: '/api/notifications/preferences',
    SUBSCRIBE: '/api/notifications/subscribe',
    UNSUBSCRIBE: '/api/notifications/unsubscribe',
  },
  
  // Analytics
  ANALYTICS: {
    BASE: '/api/analytics',
    METRICS: '/api/analytics/metrics',
    TRENDS: '/api/analytics/trends',
    PREDICTIONS: '/api/analytics/predictions',
    INSIGHTS: '/api/analytics/insights',
    RECOMMENDATIONS: '/api/analytics/recommendations',
    EXPORT: '/api/analytics/export',
  },
  
  // Security
  SECURITY: {
    BASE: '/api/security',
    POLICIES: '/api/security/policies',
    AUDIT_LOGS: '/api/security/audit-logs',
    COMPLIANCE: '/api/security/compliance',
    RISK_ASSESSMENT: '/api/security/risk-assessment',
    ACCESS_CONTROL: '/api/security/access-control',
    ENCRYPTION: '/api/security/encryption',
  },
  
  // System
  SYSTEM: {
    BASE: '/api/system',
    HEALTH: '/api/system/health',
    STATUS: '/api/system/status',
    CONFIG: '/api/system/config',
    LOGS: '/api/system/logs',
    METRICS: '/api/system/metrics',
    BACKUP: '/api/system/backup',
    RESTORE: '/api/system/restore',
  },
} as const

// ============================================================================
// ROUTES
// ============================================================================

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: (id: string) => `/projects/${id}`,
  INGESTION: '/ingestion',
  RECONCILIATION: '/reconciliation',
  CASHFLOW_EVALUATION: '/cashflow-evaluation',
  ADJUDICATION: '/adjudication',
  VISUALIZATION: '/visualization',
  PRESUMMARY: '/presummary',
  SUMMARY_EXPORT: '/summary',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  TEAMS: '/teams',
  TEAM_DETAIL: (id: string) => `/teams/${id}`,
  WORKFLOWS: '/workflows',
  WORKFLOW_DETAIL: (id: string) => `/workflows/${id}`,
  NOTIFICATIONS: '/notifications',
  ANALYTICS: '/analytics',
  SECURITY: '/security',
  ADMIN: '/admin',
  HELP: '/help',
  DOCUMENTATION: '/docs',
  API_DOCS: '/api-docs',
  STATUS: '/status',
  HEALTH: '/health',
  ERROR_404: '/404',
  ERROR_500: '/500',
  MAINTENANCE: '/maintenance',
} as const

// ============================================================================
// STATUS CODES
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  // Authentication Errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_ACCESS_DENIED: 'AUTH_ACCESS_DENIED',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_ACCOUNT_DISABLED: 'AUTH_ACCOUNT_DISABLED',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_PASSWORD_TOO_WEAK: 'AUTH_PASSWORD_TOO_WEAK',
  AUTH_PASSWORD_MISMATCH: 'AUTH_PASSWORD_MISMATCH',
  
  // Validation Errors
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',
  VALIDATION_DUPLICATE_VALUE: 'VALIDATION_DUPLICATE_VALUE',
  VALIDATION_INVALID_EMAIL: 'VALIDATION_INVALID_EMAIL',
  VALIDATION_INVALID_PHONE: 'VALIDATION_INVALID_PHONE',
  VALIDATION_INVALID_URL: 'VALIDATION_INVALID_URL',
  VALIDATION_INVALID_DATE: 'VALIDATION_INVALID_DATE',
  VALIDATION_INVALID_NUMBER: 'VALIDATION_INVALID_NUMBER',
  VALIDATION_INVALID_BOOLEAN: 'VALIDATION_INVALID_BOOLEAN',
  
  // File Errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_INVALID_TYPE: 'FILE_INVALID_TYPE',
  FILE_CORRUPTED: 'FILE_CORRUPTED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  FILE_PROCESSING_FAILED: 'FILE_PROCESSING_FAILED',
  FILE_DOWNLOAD_FAILED: 'FILE_DOWNLOAD_FAILED',
  
  // Data Errors
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  DATA_ALREADY_EXISTS: 'DATA_ALREADY_EXISTS',
  DATA_INVALID_FORMAT: 'DATA_INVALID_FORMAT',
  DATA_PROCESSING_FAILED: 'DATA_PROCESSING_FAILED',
  DATA_TRANSFORMATION_FAILED: 'DATA_TRANSFORMATION_FAILED',
  DATA_VALIDATION_FAILED: 'DATA_VALIDATION_FAILED',
  DATA_IMPORT_FAILED: 'DATA_IMPORT_FAILED',
  DATA_EXPORT_FAILED: 'DATA_EXPORT_FAILED',
  
  // Business Logic Errors
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  WORKFLOW_INVALID_STATE: 'WORKFLOW_INVALID_STATE',
  WORKFLOW_STEP_FAILED: 'WORKFLOW_STEP_FAILED',
  WORKFLOW_TIMEOUT: 'WORKFLOW_TIMEOUT',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  APPROVAL_DENIED: 'APPROVAL_DENIED',
  CONCURRENT_MODIFICATION: 'CONCURRENT_MODIFICATION',
  
  // System Errors
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
  UPGRADE_REQUIRED: 'UPGRADE_REQUIRED',
  
  // External Service Errors
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_TIMEOUT: 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  EXTERNAL_AUTH_ERROR: 'EXTERNAL_AUTH_ERROR',
} as const

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const UI_CONFIG = {
  // Layout
  HEADER_HEIGHT: 64,
  SIDEBAR_WIDTH: 256,
  SIDEBAR_COLLAPSED_WIDTH: 64,
  FOOTER_HEIGHT: 48,
  CONTENT_PADDING: 24,
  CARD_PADDING: 16,
  BORDER_RADIUS: 8,
  SHADOW: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  SHADOW_HOVER: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
  
  // Breakpoints
  BREAKPOINTS: {
    XS: 0,
    SM: 576,
    MD: 768,
    LG: 992,
    XL: 1200,
    XXL: 1400,
  },
  
  // Z-Index
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    TOAST: 1080,
  },
  
  // Animation
  TRANSITION_DURATION: 300,
  TRANSITION_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Colors
  COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#6B7280',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#06B6D4',
    LIGHT: '#F8FAFC',
    DARK: '#1E293B',
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    GRAY: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
  },
  
  // Typography
  FONT_SIZES: {
    XS: '0.75rem',
    SM: '0.875rem',
    BASE: '1rem',
    LG: '1.125rem',
    XL: '1.25rem',
    '2XL': '1.5rem',
    '3XL': '1.875rem',
    '4XL': '2.25rem',
    '5XL': '3rem',
    '6XL': '3.75rem',
  },
  
  FONT_WEIGHTS: {
    THIN: 100,
    EXTRALIGHT: 200,
    LIGHT: 300,
    NORMAL: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
    EXTRABOLD: 800,
    BLACK: 900,
  },
  
  LINE_HEIGHTS: {
    NONE: 1,
    TIGHT: 1.25,
    SNUG: 1.375,
    NORMAL: 1.5,
    RELAXED: 1.625,
    LOOSE: 2,
  },
  
  // Spacing
  SPACING: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
    40: '10rem',
    48: '12rem',
    56: '14rem',
    64: '16rem',
  },
} as const

// ============================================================================
// CHART CONFIGURATION
// ============================================================================

export const CHART_CONFIG = {
  // Chart Types
  TYPES: {
    BAR: 'bar',
    LINE: 'line',
    PIE: 'pie',
    AREA: 'area',
    SCATTER: 'scatter',
    HEATMAP: 'heatmap',
    SANKEY: 'sankey',
    TREEMAP: 'treemap',
    GAUGE: 'gauge',
    FUNNEL: 'funnel',
  },
  
  // Default Colors
  COLORS: [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#EC4899', // Pink
    '#6B7280', // Gray
  ],
  
  // Animation
  ANIMATION: {
    DURATION: 1000,
    EASING: 'easeInOutQuart',
    DELAY: 0,
  },
  
  // Responsive
  RESPONSIVE: true,
  MAINTAIN_ASPECT_RATIO: false,
  
  // Plugins
  PLUGINS: {
    LEGEND: {
      DISPLAY: true,
      POSITION: 'top',
    },
    TOOLTIP: {
      ENABLED: true,
      MODE: 'index',
      INTERSECT: false,
    },
    TITLE: {
      DISPLAY: true,
      FONT_SIZE: 16,
      FONT_WEIGHT: 'bold',
    },
  },
  
  // Scales
  SCALES: {
    X: {
      DISPLAY: true,
      GRID: {
        DISPLAY: true,
        COLOR: 'rgba(0, 0, 0, 0.1)',
      },
      TICKS: {
        COLOR: '#6B7280',
        FONT_SIZE: 12,
      },
    },
    Y: {
      DISPLAY: true,
      GRID: {
        DISPLAY: true,
        COLOR: 'rgba(0, 0, 0, 0.1)',
      },
      TICKS: {
        COLOR: '#6B7280',
        FONT_SIZE: 12,
      },
    },
  },
} as const

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  USERNAME: /^[a-zA-Z0-9_-]{3,50}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHABETIC: /^[a-zA-Z]+$/,
  NUMERIC: /^[0-9]+$/,
  DECIMAL: /^\d+(\.\d+)?$/,
  CURRENCY: /^\d+(\.\d{2})?$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  TIME: /^\d{2}:\d{2}(:\d{2})?$/,
  DATETIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  BASE64: /^[A-Za-z0-9+/]*={0,2}$/,
} as const

// ============================================================================
// FILE TYPES
// ============================================================================

export const FILE_TYPES = {
  // Document Types
  DOCUMENTS: {
    PDF: 'application/pdf',
    DOC: 'application/msword',
    DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    XLS: 'application/vnd.ms-excel',
    XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    PPT: 'application/vnd.ms-powerpoint',
    PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    TXT: 'text/plain',
    RTF: 'application/rtf',
  },
  
  // Image Types
  IMAGES: {
    JPEG: 'image/jpeg',
    JPG: 'image/jpeg',
    PNG: 'image/png',
    GIF: 'image/gif',
    BMP: 'image/bmp',
    SVG: 'image/svg+xml',
    WEBP: 'image/webp',
    TIFF: 'image/tiff',
  },
  
  // Data Types
  DATA: {
    CSV: 'text/csv',
    JSON: 'application/json',
    XML: 'application/xml',
    YAML: 'application/x-yaml',
    ZIP: 'application/zip',
    RAR: 'application/x-rar-compressed',
    '7Z': 'application/x-7z-compressed',
  },
  
  // Video Types
  VIDEOS: {
    MP4: 'video/mp4',
    AVI: 'video/x-msvideo',
    MOV: 'video/quicktime',
    WMV: 'video/x-ms-wmv',
    FLV: 'video/x-flv',
    WEBM: 'video/webm',
  },
  
  // Audio Types
  AUDIO: {
    MP3: 'audio/mpeg',
    WAV: 'audio/wav',
    OGG: 'audio/ogg',
    AAC: 'audio/aac',
    FLAC: 'audio/flac',
  },
} as const

// ============================================================================
// REGEX PATTERNS
// ============================================================================

export const REGEX_PATTERNS = {
  // Common Patterns
  EMAIL: VALIDATION_RULES.EMAIL,
  PHONE: VALIDATION_RULES.PHONE,
  URL: VALIDATION_RULES.URL,
  PASSWORD: VALIDATION_RULES.PASSWORD,
  USERNAME: VALIDATION_RULES.USERNAME,
  
  // Indonesian Specific
  NIK: /^[0-9]{16}$/,
  NPWP: /^[0-9]{15}$/,
  BANK_ACCOUNT: /^[0-9]{10,16}$/,
  CURRENCY_IDR: /^Rp\s?[0-9]{1,3}(\.[0-9]{3})*(,[0-9]{2})?$/,
  
  // International
  CREDIT_CARD: /^[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}$/,
  IBAN: /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/,
  SWIFT: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
  
  // Technical
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  IPV6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
  MAC_ADDRESS: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  PORT: /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
} as const

// ============================================================================
// DATE FORMATS
// ============================================================================

export const DATE_FORMATS = {
  // Display Formats
  DISPLAY: {
    SHORT: 'DD/MM/YYYY',
    LONG: 'DD MMMM YYYY',
    TIME: 'HH:mm',
    DATETIME: 'DD/MM/YYYY HH:mm',
    DATETIME_LONG: 'DD MMMM YYYY HH:mm',
    ISO: 'YYYY-MM-DD',
    ISO_DATETIME: 'YYYY-MM-DDTHH:mm:ss',
    ISO_DATETIME_Z: 'YYYY-MM-DDTHH:mm:ssZ',
  },
  
  // Input Formats
  INPUT: {
    DATE: 'YYYY-MM-DD',
    TIME: 'HH:mm',
    DATETIME: 'YYYY-MM-DDTHH:mm',
    DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm',
  },
  
  // File Formats
  FILE: {
    TIMESTAMP: 'YYYYMMDD_HHmmss',
    DATE: 'YYYY-MM-DD',
    DATETIME: 'YYYY-MM-DD_HH-mm-ss',
  },
  
  // Locale Specific
  LOCALE: {
    ID: 'DD/MM/YYYY',
    US: 'MM/DD/YYYY',
    EU: 'DD/MM/YYYY',
    ISO: 'YYYY-MM-DD',
  },
} as const

// ============================================================================
// CURRENCY FORMATS
// ============================================================================

export const CURRENCY_FORMATS = {
  IDR: {
    SYMBOL: 'Rp',
    CODE: 'IDR',
    DECIMAL_PLACES: 0,
    THOUSAND_SEPARATOR: '.',
    DECIMAL_SEPARATOR: ',',
    FORMAT: 'Rp #,##0',
    NEGATIVE_FORMAT: '-Rp #,##0',
  },
  USD: {
    SYMBOL: '$',
    CODE: 'USD',
    DECIMAL_PLACES: 2,
    THOUSAND_SEPARATOR: ',',
    DECIMAL_SEPARATOR: '.',
    FORMAT: '$#,##0.00',
    NEGATIVE_FORMAT: '-$#,##0.00',
  },
  EUR: {
    SYMBOL: '€',
    CODE: 'EUR',
    DECIMAL_PLACES: 2,
    THOUSAND_SEPARATOR: '.',
    DECIMAL_SEPARATOR: ',',
    FORMAT: '€#.##0,00',
    NEGATIVE_FORMAT: '-€#.##0,00',
  },
  GBP: {
    SYMBOL: '£',
    CODE: 'GBP',
    DECIMAL_PLACES: 2,
    THOUSAND_SEPARATOR: ',',
    DECIMAL_SEPARATOR: '.',
    FORMAT: '£#,##0.00',
    NEGATIVE_FORMAT: '-£#,##0.00',
  },
} as const

// ============================================================================
// EXPORT ALL CONSTANTS
// ============================================================================