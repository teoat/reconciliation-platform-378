// ============================================================================
// API CLIENT TYPES - REQUEST/RESPONSE INTERFACES
// ============================================================================

import {
  UserResponse,
  ProjectResponse,
  FileInfo,
  ReconciliationResultDetail,
  ReconciliationJob,
  ApiError,
} from '../../types/backend-aligned';

// ============================================================================
// BACKEND RESPONSE TYPES
// ============================================================================

export type BackendUser = UserResponse;
export type BackendProject = ProjectResponse;
export type BackendDataSource = FileInfo;
export type BackendReconciliationRecord = ReconciliationResultDetail;
export type BackendReconciliationMatch = ReconciliationResultDetail;
export type BackendReconciliationJob = ReconciliationJob;

// ============================================================================
// REQUEST INTERFACES
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: BackendUser;
  expires_at: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  settings?: Record<string, unknown>;
  status?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  settings?: Record<string, unknown>;
  status?: string;
  is_active?: boolean;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: string;
}

export interface UpdateUserRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  is_active?: boolean;
}

export interface UpdateSettingsRequest {
  notifications?: {
    email?: boolean;
    push?: boolean;
    reconciliation_complete?: boolean;
  };
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    timezone?: string;
  };
  security?: {
    two_factor_enabled?: boolean;
    session_timeout?: number;
  };
}

export interface SettingsResponse {
  notifications: {
    email: boolean;
    push: boolean;
    reconciliation_complete: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
  };
  security: {
    two_factor_enabled: boolean;
    session_timeout: number;
  };
  updated_at: string;
}

export interface FileUploadRequest {
  project_id: string;
  name: string;
  source_type: string;
}

export interface FileUploadResponse {
  id: string;
  name: string;
  source_type: string;
  file_size: number;
  record_count?: number;
  status: string;
  uploaded_at?: string;
  processed_at?: string;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string; // Error title from backend
  code?: string; // Error code from backend
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ReconciliationResultsQuery {
  page?: number;
  per_page?: number;
  match_type?: string;
  confidence_threshold?: number;
  date_from?: string;
  date_to?: string;
}

export interface ProjectQueryParams {
  owner_id?: string;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface UserQueryParams {
  role?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}

// ============================================================================
// INTERNAL TYPES
// ============================================================================

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
  skipTokenRefresh?: boolean;
  cache?: boolean;
}

export interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retryConfig: RetryConfig;
  cacheEnabled: boolean;
  cacheTTL: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export type ApiErrorLike =
  | ApiError
  | Error
  | { statusCode?: number; message?: string; name?: string };
