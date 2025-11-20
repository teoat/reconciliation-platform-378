// ============================================================================
// UI & COMPONENT TYPES
// ============================================================================

import type { ID, Timestamp } from './backend-aligned';

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
