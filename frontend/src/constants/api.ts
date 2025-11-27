/**
 * API Endpoints Constants
 * 
 * All API endpoint definitions
 */

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
    UPLOAD: (projectId: string) => `/api/projects/${projectId}/files/upload`,
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
} as const;

