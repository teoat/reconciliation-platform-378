// ============================================================================
// API CLIENT TYPES - SINGLE SOURCE OF TRUTH
// ============================================================================

import { ID, Timestamp } from '../../types/backend';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  data: T;
  error?: string;
  message?: string;
  status?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: ID;
    email: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    status?: string;
    email_verified?: boolean;
    created_at?: Timestamp;
    updated_at?: Timestamp;
  };
  expires_at?: number;
}

// ============================================================================
// FILE UPLOAD TYPES
// ============================================================================

export interface FileUploadRequest {
  project_id: string;
  name: string;
  source_type: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface FileUploadResponse {
  id: ID;
  project_id: string;
  name: string;
  source_type: string;
  status: string;
  size?: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

export interface Project {
  id: ID;
  name: string;
  description?: string;
  status: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: string;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
