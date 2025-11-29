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
  ApiResponse as BackendApiResponse,
  PaginatedResponse as BackendPaginatedResponse,
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
  remember_me?: boolean; // Backend expects snake_case
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

// Error can be either a string (simple error message) or an object with message property
export type ApiErrorValue = string | { message: string; code?: string; details?: unknown };

/**
 * API Response type - extends backend type with additional fields for client-side use
 * 
 * NOTE: Base type is from '@/types/backend-aligned' for consistency.
 * This extends it with client-specific fields like correlationId.
 */
export interface ApiResponse<T = unknown> extends BackendApiResponse<T> {
  code?: string; // Error code from backend
  correlationId?: string; // Correlation ID from response headers (Agent 1 Task 1.19)
}

/**
 * Paginated Response type - re-exported from backend-aligned for consistency
 */
export type PaginatedResponse<T> = BackendPaginatedResponse<T>;

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
  url?: string;
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
