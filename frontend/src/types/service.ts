/**
 * Service Layer Types - Replace any with proper types
 * This file provides type-safe interfaces for all service layer operations
 */

import { Metadata, ProjectMetadata, FileMetadata, ReconciliationMetadata } from './metadata';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Service error interface
 */
export interface ServiceError {
  message: string;
  code: string;
  statusCode: number;
  details?: unknown;
}

/**
 * Request parameters for listing resources
 */
export interface ListParams {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

/**
 * Project-related types
 *
 * NOTE: This is a simplified Project type for service layer usage.
 * For backend API integration, use the Project type from '@/types/backend-aligned' instead.
 * For enhanced project features, use EnhancedProject from '@/types/project' instead.
 *
 * Use this type when:
 * - Working with simplified project data in service layer
 * - You only need basic project information (id, name, description, metadata)
 * - Working with frontend-only project state
 *
 * Use backend-aligned Project type when:
 * - Making API calls to backend endpoints
 * - Working with full project data from database
 * - Need access to owner_id, status, settings, timestamps, etc.
 *
 * Use EnhancedProject type when:
 * - Working with UI components that need rich project data
 * - Need project analytics, progress, alerts, templates
 * - Working with project management features
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  metadata: ProjectMetadata;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  metadata?: ProjectMetadata;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  metadata?: ProjectMetadata;
}

export interface ListProjectsParams extends ListParams {
  userId?: string;
  status?: string;
}

/**
 * File-related types
 */
export interface File {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  metadata: FileMetadata;
  uploadedAt: string;
  uploadedBy?: string;
  projectId?: string;
}

export interface UploadFileRequest {
  file: File | Blob;
  projectId?: string;
  metadata?: FileMetadata;
}

export interface ListFilesParams extends ListParams {
  projectId?: string;
  mimeType?: string;
}

/**
 * Reconciliation-related types
 */
export interface Reconciliation {
  id: string;
  projectId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  metadata: ReconciliationMetadata;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReconciliationRequest {
  projectId: string;
  sourceFileId: string;
  targetFileId: string;
  metadata?: ReconciliationMetadata;
}

export interface ListReconciliationsParams extends ListParams {
  projectId?: string;
  status?: string;
}

/**
 * User-related types
 *
 * NOTE: This is a simplified User type for service layer usage.
 * For backend API integration, use the User type from '@/types/backend-aligned' instead.
 *
 * Use this type when:
 * - Working with simplified user data in service layer
 * - You only need basic user information (id, email, name)
 * - Working with frontend-only user state
 *
 * Use backend-aligned User type when:
 * - Making API calls to backend
 * - Working with full user data from database
 * - Need access to status, email_verified, timestamps, etc.
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  metadata?: Metadata;
  createdAt: string;
  updatedAt: string;
}

/**
 * Authentication-related types
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}
