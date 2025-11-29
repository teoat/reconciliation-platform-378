// Data Context Definition
import { createContext, useContext } from 'react';
import { ProjectData } from '../../services/dataManagement/types';
import {
  WorkflowState,
  WorkflowStage,
  CrossPageData,
  SyncStatus,
  WorkflowProgress,
  Notification,
  Alert,
  ValidationResult,
  IngestionData,
  ReconciliationData,
  CashflowData,
} from './types';

export interface DataContextType {
  // Current project data
  currentProject: ProjectData | null;
  setCurrentProject: (project: ProjectData | null) => void;

  // Workflow state
  workflowState: WorkflowState | null;
  setWorkflowState: (state: WorkflowState | null) => void;

  // Cross-page data synchronization
  crossPageData: CrossPageData;
  updateCrossPageData: (
    page: keyof CrossPageData,
    data:
      | IngestionData
      | ReconciliationData
      | AdjudicationData
      | AnalyticsData
      | SecurityData
      | ApiData
  ) => void;

  // Real-time synchronization
  syncStatus: SyncStatus;
  syncData: () => Promise<void>;

  // Workflow orchestration
  workflowProgress: WorkflowProgress;
  advanceWorkflow: (toStage: WorkflowStage<Record<string, unknown>>) => Promise<void>;

  // Cross-page notifications
  notifications: Notification[];
  alerts: Alert[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void;
  dismissAlert: (alertId: string) => void;

  // Data validation
  validateCrossPageData: (fromPage: string, toPage: string) => ValidationResult;
  validateWorkflowConsistency: () => ValidationResult;

  // WebSocket integration
  isConnected: boolean;
  activeUsers: Array<{ id: string; name: string; page: string; lastSeen: string }>;
  liveComments: Array<{
    id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: string;
    page: string;
  }>;
  sendComment: (userId: string, userName: string, message: string) => void;
  updatePresence: (userId: string, userName: string) => void;

  // Security integration
  securityPolicies: Array<Record<string, unknown>>;
  auditLogs: Array<{
    id: string;
    userId: string;
    action: string;
    resource: string;
    result: 'success' | 'failure';
    timestamp: string;
    details?: Record<string, unknown>;
  }>;
  isSecurityEnabled: boolean;
  checkPermission: (userId: string, resource: string, action: string) => boolean;
  logAuditEvent: (
    userId: string,
    action: string,
    resource: string,
    result: 'success' | 'failure',
    details?: Record<string, unknown>
  ) => void;
  encryptData: <T>(
    data: T,
    dataType: string
  ) => T & { _encrypted: boolean; _encryptionType: string; _encryptedAt: string };
  decryptData: (encryptedData: string, dataType: string) => unknown;
  checkCompliance: (
    framework: string
  ) => Array<{ framework: string; status: string; issues: string[] }>;
  createSecurityPolicy: (policy: Record<string, unknown>) => Record<string, unknown>;
  updateSecurityPolicy: (policyId: string, updates: Partial<Record<string, unknown>>) => void;
  deleteSecurityPolicy: (policyId: string) => void;
  exportAuditLogs: (format?: 'csv' | 'json') => string;

  // Legacy compatibility methods
  createProject: (project: Partial<ProjectData>) => ProjectData;
  updateProject: (projectId: string, updates: Partial<ProjectData>) => ProjectData | null;
  addIngestionData: (projectId: string, ingestionData: IngestionData) => ProjectData;
  getIngestionData: () => IngestionData | null;
  addReconciliationData: (
    projectId: string,
    reconciliationData: ReconciliationData
  ) => ProjectData | null;
  getReconciliationData: () => ReconciliationData | null;
  addCashflowData: (projectId: string, cashflowData: CashflowData) => ProjectData;
  getCashflowData: () => CashflowData;
  transformIngestionToReconciliation: (projectId: string) => ProjectData | null;
  transformReconciliationToCashflow: (projectId: string) => ProjectData | null;
  subscribeToProject: (projectId: string, callback: (data: ProjectData) => void) => () => void;

  // Real-time updates
  subscribeToUpdates: (callback: (data: CrossPageData) => void) => () => void;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Utility methods
  exportProject: (projectId: string) => string;
  importProject: (data: string) => ProjectData | null;
  resetWorkflow: () => void;
}

// Import types that need to be referenced
import type { AdjudicationData, AnalyticsData, SecurityData, ApiData } from './types';

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Legacy compatibility exports
export const useUnifiedData = useData;
