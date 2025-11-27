// ============================================================================
// REDUX STORE TYPES - SINGLE SOURCE OF TRUTH
// ============================================================================

import type { User as BackendUser } from '../../types/backend-aligned';
import type { Project as BackendProject } from '../../types/backend-aligned';
import type { UploadedFile } from '../../types/backend-aligned';
import type { ReconciliationRecord as BackendReconciliationRecord } from '../../types/index';
import type { ReconciliationJob as BackendReconciliationJob } from '../../types/backend-aligned';
import type { DashboardData } from '../../types/backend-aligned';
import type { Notification as BackendNotification } from '../../types/backend-aligned';

// ============================================================================
// STATE INTERFACES
// ============================================================================

export interface AuthState {
  user: BackendUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastLogin: string | null;
  sessionExpiry: string | null;
}

export interface ProjectsState {
  projects: BackendProject[];
  selectedProject: BackendProject | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  searchQuery: string;
  filterStatus: string | null;
}

export interface DataIngestionState {
  uploadedFiles: UploadedFile[];
  processedData: BackendReconciliationRecord[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
}

export interface ReconciliationState {
  records: BackendReconciliationRecord[];
  jobs: BackendReconciliationJob[];
  matches?: ReconciliationMatch[];
  config: {
    matchingRules: string[];
    tolerance: number;
    autoMatch: boolean;
    priority: 'high' | 'medium' | 'low';
    batchSize: number;
    timeout: number;
  };
  stats: {
    total: number;
    matched: number;
    unmatched: number;
    discrepancy: number;
    pending: number;
    processingTime: number;
    lastUpdated: string;
  };
  isLoading: boolean;
  error: string | null;
  matchingProgress: number;
  matchingResults: Record<string, unknown> | null;
}

export interface AnalyticsState {
  dashboardData: DashboardData | null;
  reports: Array<Record<string, unknown>>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: BackendNotification[];
  modals: {
    createProject: boolean;
    exportData: boolean;
    settings: boolean;
    deleteConfirmation: boolean;
    batchOperation: boolean;
  };
  loadingStates: {
    global: boolean;
    projects: boolean;
    reconciliation: boolean;
    ingestion: boolean;
    analytics: boolean;
  };
  errors: Array<{ message: string; timestamp: string }>;
  breadcrumbs: Array<{ label: string; path: string }>;
}

export interface AppState {
  auth: AuthState;
  projects: ProjectsState;
  dataIngestion: DataIngestionState;
  reconciliation: ReconciliationState;
  analytics: AnalyticsState;
  ui: UIState;
}

// ============================================================================
// COMPATIBILITY TYPES
// ============================================================================

export interface ReconciliationMatch {
  id: string;
  projectId: string;
  recordAId: string;
  recordBId?: string;
  matchType: string;
  confidenceScore?: number;
  status: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataSource {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  sourceType: string;
  connectionConfig?: Record<string, unknown>;
  filePath?: string;
  fileSize?: number;
  fileHash?: string;
  recordCount?: number;
  schema?: Record<string, unknown>;
  status: string;
  uploadedAt?: string;
  processedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Type aliases for compatibility
export type User = BackendUser;
export type Project = BackendProject;
export type ReconciliationJob = BackendReconciliationJob;
export type Notification = BackendNotification;
export type ReconciliationRecord = BackendReconciliationRecord;

