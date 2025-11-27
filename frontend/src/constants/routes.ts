/**
 * Route Constants
 * 
 * Application route definitions
 */

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
} as const;

