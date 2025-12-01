/**
 * Application Configuration (SSOT)
 *
 * Central source of truth for all application configuration.
 * Consolidates environment variables and static configuration.
 */

// Define the configuration interface
export interface AppConfig {
  // Environment
  NODE_ENV: string;
  IS_DEV: boolean;
  IS_PROD: boolean;
  IS_TEST: boolean;

  // API Configuration
  API_URL: string;
  WS_URL: string;
  API_TIMEOUT: number;
  API_RETRY_ATTEMPTS: number;

  // Auth Configuration
  AUTH_TOKEN_KEY: string;
  REFRESH_TOKEN_KEY: string;

  // Feature Flags
  ENABLE_ANALYTICS: boolean;
  ENABLE_MOCK_DATA: boolean;
  ENABLE_TIER4_ERROR_HANDLING: boolean;
  ENABLE_FRENLY_AI: boolean;

  // Pagination
  DEFAULT_PAGE_SIZE: number;

  // File Upload
  MAX_FILE_SIZE: number; // in bytes
  ALLOWED_FILE_TYPES: string[];
}

// Read environment variables (with fallbacks)
const env = import.meta.env;

export const APP_CONFIG: AppConfig = {
  // Environment
  NODE_ENV: env.MODE || 'development',
  IS_DEV: env.DEV,
  IS_PROD: env.PROD,
  IS_TEST: env.MODE === 'test',

  // API Configuration
  API_URL: env.VITE_API_URL || 'http://localhost:8000/api/v1',
  WS_URL: env.VITE_WS_URL || 'ws://localhost:8000/ws',
  API_TIMEOUT: Number(env.VITE_API_TIMEOUT) || 30000,
  API_RETRY_ATTEMPTS: Number(env.VITE_API_RETRY_ATTEMPTS) || 3,

  // Auth Configuration
  AUTH_TOKEN_KEY: 'auth_token',
  REFRESH_TOKEN_KEY: 'refresh_token',

  // Feature Flags
  ENABLE_ANALYTICS: env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_MOCK_DATA: env.VITE_ENABLE_MOCK_DATA === 'true',
  ENABLE_TIER4_ERROR_HANDLING: true, // Always enable per prompt requirements
  ENABLE_FRENLY_AI: env.VITE_ENABLE_FRENLY_AI === 'true',

  // Pagination
  DEFAULT_PAGE_SIZE: 20,

  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['.csv', '.xlsx', '.xls', '.json'],
};

// API Endpoints Map
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  PROJECTS: {
    LIST: '/projects',
    DETAIL: (id: string) => `/projects/${id}`,
    CREATE: '/projects',
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`,
  },
  INGESTION: {
    UPLOAD: (projectId: string) => `/projects/${projectId}/ingestion/upload`,
    STATUS: (fileId: string) => `/ingestion/${fileId}/status`,
  },
  RECONCILIATION: {
    RUN: (projectId: string) => `/projects/${projectId}/reconciliation/run`,
    RESULTS: (projectId: string) => `/projects/${projectId}/reconciliation/results`,
  },
  AI: {
    QUERY: '/ai/query',
    SUGGESTIONS: '/ai/suggestions',
  },
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  SERVER_ERROR: 'An unexpected server error occurred. Please try again later.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
};

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  MAX_FILE_SIZE_MB: 10,
};

// Default export for convenience
export default APP_CONFIG;
