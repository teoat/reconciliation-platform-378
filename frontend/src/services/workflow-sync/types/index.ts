// ============================================================================
// WORKFLOW SYNC TEST TYPES
// ============================================================================

export interface WorkflowSyncTest {
  id: string;
  name: string;
  description: string;
  testFunction: () => Promise<WorkflowSyncTestResult>;
  category: 'state-propagation' | 'step-synchronization' | 'progress-sync' | 'error-handling';
  priority: 'high' | 'medium' | 'low';
  requiresMultipleBrowsers: boolean;
}

export interface WorkflowSyncTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  duration: number;
  errors?: string[];
  browsers?: string[];
  stateChanges?: StateChange[];
  conflicts?: StateConflict[];
}

export interface StateChange {
  browser: string;
  step: string;
  progress: number;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export interface StateConflict {
  type: 'step' | 'progress' | 'data';
  browsers: string[];
  conflictingValues: unknown[];
  resolution: 'resolved' | 'pending' | 'failed';
  timestamp: Date;
}

export interface WorkflowSyncConfig {
  testTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  maxBrowsers: number;
  enableStatePropagationTests: boolean;
  enableStepSyncTests: boolean;
  enableProgressSyncTests: boolean;
  enableErrorHandlingTests: boolean;
}

export const defaultConfig: WorkflowSyncConfig = {
  testTimeout: 45000,
  retryAttempts: 3,
  retryDelay: 1500,
  maxBrowsers: 3,
  enableStatePropagationTests: true,
  enableStepSyncTests: true,
  enableProgressSyncTests: true,
  enableErrorHandlingTests: true,
};

// Internal type definitions
export interface ProgressIndicator {
  progress: number;
  label: string;
  color: string;
}

export interface ErrorState {
  hasError: boolean;
  errorType?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export interface RecoveryState {
  isRecovering: boolean;
  recoveryStep?: string;
  progress?: number;
  details?: Record<string, unknown>;
}

export interface RollbackState {
  isRollingBack: boolean;
  rollbackStep?: string;
  progress?: number;
  details?: Record<string, unknown>;
}

export interface WorkflowState {
  step: string;
  progress: number;
  data?: Record<string, unknown>;
}

export interface DataState {
  records: number;
  matches: number;
  discrepancies: number;
  [key: string]: unknown;
}

export interface StepValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StepPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canAdvance: boolean;
}

