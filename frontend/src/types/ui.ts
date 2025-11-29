// ============================================================================
// UI & COMPONENT TYPES
// ============================================================================

import type { ID, Timestamp } from './backend';

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: Notification[];
  modals: ModalState;
  loadingStates: LoadingStates;
  errors: ErrorState[];
  breadcrumbs: Breadcrumb[];
}

export interface Notification {
  id: ID;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  persistent: boolean;
  actions?: NotificationAction[];
  read: boolean;
  timestamp: Timestamp;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  type: 'primary' | 'secondary';
}

export interface ModalState {
  [key: string]: boolean;
}

export interface LoadingStates {
  global: boolean;
  [key: string]: boolean;
}

export interface ErrorState {
  id: ID;
  type: 'network' | 'validation' | 'permission' | 'system';
  message: string;
  details?: string;
  retryable: boolean;
  dismissed: boolean;
  timestamp: Timestamp;
}

export interface Breadcrumb {
  label: string;
  path: string;
  active: boolean;
}

// ============================================================================
// PROGRESS TYPES
// ============================================================================

export interface CheckpointData {
  stage: string;
  data: unknown;
  metadata: Record<string, unknown>;
}

export interface ResumeData {
  canResume: boolean;
  resumePoint: string;
  dependencies: string[];
  state: Record<string, unknown>;
}

// ============================================================================
// FORM TYPES
// ============================================================================
// Note: Form types are exported from './forms' to avoid duplicates
// Re-export for backward compatibility
export type {
  FormField,
  SelectOption,
  FieldValidation,
  FormState,
} from './forms';

// ============================================================================
// FILE TYPES
// ============================================================================
// Note: File types are exported from './files' to avoid duplicates
// Re-export for backward compatibility
export type {
  FileUpload,
  FileInfo,
} from './files';
