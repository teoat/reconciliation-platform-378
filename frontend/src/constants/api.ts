/**
 * API Endpoints Constants
 * 
 * All API endpoint definitions
 */

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    REGISTER: '/api/v1/auth/register',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    VERIFY_EMAIL: '/api/v1/auth/verify-email',
    CHANGE_PASSWORD: '/api/v1/auth/change-password',
    PROFILE: '/api/v1/auth/profile',
  },

  // Projects
  PROJECTS: {
    BASE: '/api/v1/projects',
    LIST: '/api/v1/projects',
    CREATE: '/api/v1/projects',
    GET: (id: string) => `/api/v1/projects/${id}`,
    UPDATE: (id: string) => `/api/v1/projects/${id}`,
    DELETE: (id: string) => `/api/v1/projects/${id}`,
    ARCHIVE: (id: string) => `/api/v1/projects/${id}/archive`,
    RESTORE: (id: string) => `/api/v1/projects/${id}/restore`,
    MEMBERS: (id: string) => `/api/v1/projects/${id}/members`,
    SETTINGS: (id: string) => `/api/v1/projects/${id}/settings`,
    ANALYTICS: (id: string) => `/api/v1/projects/${id}/analytics`,
  },

  // Data Ingestion
  INGESTION: {
    BASE: '/api/v1/ingestion',
    UPLOAD: '/api/v1/ingestion/upload',
    PROCESS: '/api/v1/ingestion/process',
    VALIDATE: '/api/v1/ingestion/validate',
    TRANSFORM: '/api/v1/ingestion/transform',
    STATUS: (id: string) => `/api/v1/ingestion/${id}/status`,
    RESULTS: (id: string) => `/api/v1/ingestion/${id}/results`,
    ERRORS: (id: string) => `/api/v1/ingestion/${id}/errors`,
    DOWNLOAD: (id: string) => `/api/v1/ingestion/${id}/download`,
  },

  // Reconciliation
  RECONCILIATION: {
    BASE: '/api/v1/reconciliation',
    RECORDS: '/api/v1/reconciliation/records',
    CREATE_RECORD: '/api/v1/reconciliation/records',
    GET_RECORD: (id: string) => `/api/v1/reconciliation/records/${id}`,
    UPDATE_RECORD: (id: string) => `/api/v1/reconciliation/records/${id}`,
    DELETE_RECORD: (id: string) => `/api/v1/reconciliation/records/${id}`,
    BULK_UPDATE: '/api/v1/reconciliation/records/bulk',
    BULK_DELETE: '/api/v1/reconciliation/records/bulk',
    MATCH: '/api/v1/reconciliation/match',
    UNMATCH: '/api/v1/reconciliation/unmatch',
    RULES: '/api/v1/reconciliation/rules',
    CREATE_RULE: '/api/v1/reconciliation/rules',
    GET_RULE: (id: string) => `/api/v1/reconciliation/rules/${id}`,
    UPDATE_RULE: (id: string) => `/api/v1/reconciliation/rules/${id}`,
    DELETE_RULE: (id: string) => `/api/v1/reconciliation/rules/${id}`,
    TEST_RULE: '/api/v1/reconciliation/rules/test',
    BATCHES: '/api/v1/reconciliation/batches',
    CREATE_BATCH: '/api/v1/reconciliation/batches',
    GET_BATCH: (id: string) => `/api/v1/reconciliation/batches/${id}`,
    PROCESS_BATCH: (id: string) => `/api/v1/reconciliation/batches/${id}/process`,
    METRICS: '/api/v1/reconciliation/metrics',
    EXPORT: '/api/v1/reconciliation/export',
  },

  // Cashflow Evaluation
  CASHFLOW: {
    BASE: '/api/v1/cashflow',
    ANALYSIS: '/api/v1/cashflow/analysis',
    CATEGORIES: '/api/v1/cashflow/categories',
    CREATE_CATEGORY: '/api/v1/cashflow/categories',
    GET_CATEGORY: (id: string) => `/api/v1/cashflow/categories/${id}`,
    UPDATE_CATEGORY: (id: string) => `/api/v1/cashflow/categories/${id}`,
    DELETE_CATEGORY: (id: string) => `/api/v1/cashflow/categories/${id}`,
    TRANSACTIONS: '/api/v1/cashflow/transactions',
    CREATE_TRANSACTION: '/api/v1/cashflow/transactions',
    GET_TRANSACTION: (id: string) => `/api/v1/cashflow/transactions/${id}`,
    UPDATE_TRANSACTION: (id: string) => `/api/v1/cashflow/transactions/${id}`,
    DELETE_TRANSACTION: (id: string) => `/api/v1/cashflow/transactions/${id}`,
    DISCREPANCIES: '/api/v1/cashflow/discrepancies',
    CREATE_DISCREPANCY: '/api/v1/cashflow/discrepancies',
    GET_DISCREPANCY: (id: string) => `/api/v1/cashflow/discrepancies/${id}`,
    UPDATE_DISCREPANCY: (id: string) => `/api/v1/cashflow/discrepancies/${id}`,
    RESOLVE_DISCREPANCY: (id: string) => `/api/v1/cashflow/discrepancies/${id}/resolve`,
    METRICS: '/api/v1/cashflow/metrics',
    EXPORT: '/api/v1/cashflow/export',
  },

  // Adjudication
  ADJUDICATION: {
    BASE: '/api/v1/adjudication',
    CASES: '/api/v1/adjudication/cases',
    CREATE_CASE: '/api/v1/adjudication/cases',
    GET_CASE: (id: string) => `/api/v1/adjudication/cases/${id}`,
    UPDATE_CASE: (id: string) => `/api/v1/adjudication/cases/${id}`,
    DELETE_CASE: (id: string) => `/api/v1/adjudication/cases/${id}`,
    ASSIGN_CASE: (id: string) => `/api/v1/adjudication/cases/${id}/assign`,
    RESOLVE_CASE: (id: string) => `/api/v1/adjudication/cases/${id}/resolve`,
    WORKFLOWS: '/api/v1/adjudication/workflows',
    CREATE_WORKFLOW: '/api/v1/adjudication/workflows',
    GET_WORKFLOW: (id: string) => `/api/v1/adjudication/workflows/${id}`,
    UPDATE_WORKFLOW: (id: string) => `/api/v1/adjudication/workflows/${id}`,
    DELETE_WORKFLOW: (id: string) => `/api/v1/adjudication/workflows/${id}`,
    DECISIONS: '/api/v1/adjudication/decisions',
    CREATE_DECISION: '/api/v1/adjudication/decisions',
    GET_DECISION: (id: string) => `/api/v1/adjudication/decisions/${id}`,
    UPDATE_DECISION: (id: string) => `/api/v1/adjudication/decisions/${id}`,
    APPEAL_DECISION: (id: string) => `/api/v1/adjudication/decisions/${id}/appeal`,
    METRICS: '/api/v1/adjudication/metrics',
    EXPORT: '/api/v1/adjudication/export',
  },

  // Visualization
  VISUALIZATION: {
    BASE: '/api/v1/visualization',
    CHARTS: '/api/v1/visualization/charts',
    CREATE_CHART: '/api/v1/visualization/charts',
    GET_CHART: (id: string) => `/api/v1/visualization/charts/${id}`,
    UPDATE_CHART: (id: string) => `/api/v1/visualization/charts/${id}`,
    DELETE_CHART: (id: string) => `/api/v1/visualization/charts/${id}`,
    DASHBOARDS: '/api/v1/visualization/dashboards',
    CREATE_DASHBOARD: '/api/v1/visualization/dashboards',
    GET_DASHBOARD: (id: string) => `/api/v1/visualization/dashboards/${id}`,
    UPDATE_DASHBOARD: (id: string) => `/api/v1/visualization/dashboards/${id}`,
    DELETE_DASHBOARD: (id: string) => `/api/v1/visualization/dashboards/${id}`,
    REPORTS: '/api/v1/visualization/reports',
    CREATE_REPORT: '/api/v1/visualization/reports',
    GET_REPORT: (id: string) => `/api/v1/visualization/reports/${id}`,
    UPDATE_REPORT: (id: string) => `/api/v1/visualization/reports/${id}`,
    DELETE_REPORT: (id: string) => `/api/v1/visualization/reports/${id}`,
    GENERATE_REPORT: (id: string) => `/api/v1/visualization/reports/${id}/generate`,
    SCHEDULE_REPORT: (id: string) => `/api/v1/visualization/reports/${id}/schedule`,
    EXPORT: '/api/v1/visualization/export',
  },

  // File Management
  FILES: {
    BASE: '/api/v1/files',
    UPLOAD: (projectId: string) => `/api/v1/projects/${projectId}/files/upload`,
    GET: (id: string) => `/api/v1/files/${id}`,
    DOWNLOAD: (id: string) => `/api/v1/files/${id}/download`,
    DELETE: (id: string) => `/api/v1/files/${id}`,
    METADATA: (id: string) => `/api/v1/files/${id}/metadata`,
    PREVIEW: (id: string) => `/api/v1/files/${id}/preview`,
  },

  // User Management
  USERS: {
    BASE: '/api/v1/users',
    LIST: '/api/v1/users',
    CREATE: '/api/v1/users',
    GET: (id: string) => `/api/v1/users/${id}`,
    UPDATE: (id: string) => `/api/v1/users/${id}`,
    DELETE: (id: string) => `/api/v1/users/${id}`,
    ROLES: '/api/v1/users/roles',
    PERMISSIONS: '/api/v1/users/permissions',
    PREFERENCES: (id: string) => `/api/v1/users/${id}/preferences`,
    ACTIVITY: (id: string) => `/api/v1/users/${id}/activity`,
  },

  // Teams & Workspaces
  TEAMS: {
    BASE: '/api/v1/teams',
    LIST: '/api/v1/teams',
    CREATE: '/api/v1/teams',
    GET: (id: string) => `/api/v1/teams/${id}`,
    UPDATE: (id: string) => `/api/v1/teams/${id}`,
    DELETE: (id: string) => `/api/v1/teams/${id}`,
    MEMBERS: (id: string) => `/api/v1/teams/${id}/members`,
    INVITE: (id: string) => `/api/v1/teams/${id}/invite`,
    REMOVE_MEMBER: (id: string, userId: string) => `/api/v1/teams/${id}/members/${userId}`,
    PERMISSIONS: (id: string) => `/api/v1/teams/${id}/permissions`,
  },

  // Workflows
  WORKFLOWS: {
    BASE: '/api/v1/workflows',
    LIST: '/api/v1/workflows',
    CREATE: '/api/v1/workflows',
    GET: (id: string) => `/api/v1/workflows/${id}`,
    UPDATE: (id: string) => `/api/v1/workflows/${id}`,
    DELETE: (id: string) => `/api/v1/workflows/${id}`,
    INSTANCES: '/api/v1/workflows/instances',
    CREATE_INSTANCE: '/api/v1/workflows/instances',
    GET_INSTANCE: (id: string) => `/api/v1/workflows/instances/${id}`,
    UPDATE_INSTANCE: (id: string) => `/api/v1/workflows/instances/${id}`,
    CANCEL_INSTANCE: (id: string) => `/api/v1/workflows/instances/${id}/cancel`,
    RULES: '/api/v1/workflows/rules',
    CREATE_RULE: '/api/v1/workflows/rules',
    GET_RULE: (id: string) => `/api/v1/workflows/rules/${id}`,
    UPDATE_RULE: (id: string) => `/api/v1/workflows/rules/${id}`,
    DELETE_RULE: (id: string) => `/api/v1/workflows/rules/${id}`,
    TEST_RULE: '/api/v1/workflows/rules/test',
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: '/api/v1/notifications',
    LIST: '/api/v1/notifications',
    GET: (id: string) => `/api/v1/notifications/${id}`,
    MARK_READ: (id: string) => `/api/v1/notifications/${id}/read`,
    MARK_UNREAD: (id: string) => `/api/v1/notifications/${id}/unread`,
    DELETE: (id: string) => `/api/v1/notifications/${id}`,
    BULK_READ: '/api/v1/notifications/bulk/read',
    BULK_DELETE: '/api/v1/notifications/bulk/delete',
    PREFERENCES: '/api/v1/notifications/preferences',
    SUBSCRIBE: '/api/v1/notifications/subscribe',
    UNSUBSCRIBE: '/api/v1/notifications/unsubscribe',
  },

  // Analytics
  ANALYTICS: {
    BASE: '/api/v1/analytics',
    METRICS: '/api/v1/analytics/metrics',
    TRENDS: '/api/v1/analytics/trends',
    PREDICTIONS: '/api/v1/analytics/predictions',
    INSIGHTS: '/api/v1/analytics/insights',
    RECOMMENDATIONS: '/api/v1/analytics/recommendations',
    EXPORT: '/api/v1/analytics/export',
  },

  // Security
  SECURITY: {
    BASE: '/api/v1/security',
    POLICIES: '/api/v1/security/policies',
    AUDIT_LOGS: '/api/v1/security/audit-logs',
    COMPLIANCE: '/api/v1/security/compliance',
    RISK_ASSESSMENT: '/api/v1/security/risk-assessment',
    ACCESS_CONTROL: '/api/v1/security/access-control',
    ENCRYPTION: '/api/v1/security/encryption',
  },

  // System
  SYSTEM: {
    BASE: '/api/v1/system',
    HEALTH: '/api/v1/system/health',
    STATUS: '/api/v1/system/status',
    CONFIG: '/api/v1/system/config',
    LOGS: '/api/v1/system/logs',
    METRICS: '/api/v1/system/metrics',
    BACKUP: '/api/v1/system/backup',
    RESTORE: '/api/v1/system/restore',
  },
} as const;

