// ============================================================================
// API CLIENT TYPES - SINGLE SOURCE OF TRUTH
// ============================================================================

export interface ApiResponse<T = unknown> {
  data: T;
  error?: ApiError;
  status: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  emailVerified: boolean;
  is2faEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// File Upload Types
export interface FileUploadRequest {
  project_id: string;
  name: string;
  source_type: string;
  [key: string]: unknown;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  size: number;
  status: string;
  uploadedAt: string;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

// Request Config
export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timeout?: number;
}
