'use client';

import React, { useState, useEffect, memo } from 'react';
import { DataContext, DataContextType } from './data/context';
import { useDataValidation } from './data/sync';
import { createInitialCrossPageData } from './data/initialData';
import { WorkflowStage, Alert, Notification, CashflowData, IngestionData, ReconciliationData } from './data/types';
import type { ReactNode } from 'react';
import type { ProjectData } from '@/services/dataManagement/types';
import {
  useDataProviderSecurity,
  useDataProviderWorkflow,
  useDataProviderSync,
  useDataProviderNotifications,
  useDataProviderUpdates,
  useDataProviderStorage,
} from './data/hooks';

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // WebSocket integration - placeholder until DataProvider is refactored
  const collaborationConnected = true;
  const activeUsers: Array<{ id: string; name: string; page: string; lastSeen: string }> = [];
  const liveComments: Array<{
    id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: string;
    page: string;
  }> = [];
  const sendComment = () => {};
  const updatePresence = () => {};
  const syncConnected = true;
  const wsSyncData = () => {};

  // Core state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crossPageData, setCrossPageData] = useState(createInitialCrossPageData());
  const [_currentProject, setCurrentProject] = useState<ProjectData | null>(null);

  // Security hook
  const securityData = useDataProviderSecurity();

  // Storage hook
  const storageData = useDataProviderStorage(setCurrentProject, setIsLoading, setError);

  // Validation hook
  const { validateCrossPageData } = useDataValidation(crossPageData);

  // Notifications hook
  const notificationsData = useDataProviderNotifications();

  // Create wrapper for addAlert to match workflow signature
  const addAlertWrapper = React.useCallback(
    (alert: Omit<Alert, 'id' | 'timestamp' | 'isDismissed'>) => {
      notificationsData.addAlert({
        ...alert,
        id: `alert-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        isDismissed: false,
      } as Alert);
    },
    [notificationsData]
  );

  // Create wrapper for addNotification to match workflow signature
  const addNotificationWrapper = React.useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp'>) => {
      notificationsData.addNotification({
        ...notification,
        id: `notification-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        read: false,
      } as Notification);
    },
    [notificationsData]
  );

  // Workflow hook
  const workflowData = useDataProviderWorkflow(
    crossPageData,
    validateCrossPageData,
    addAlertWrapper,
    addNotificationWrapper
  );

  // Sync hook
  const syncData = useDataProviderSync(() => {});

  // Create wrapper for logAuditEvent to match expected signature
  const logAuditEventWrapper = React.useCallback(
    (event: {
      userId: string;
      action: string;
      resource: string;
      result: 'success' | 'failure' | 'denied';
      ipAddress?: string;
      userAgent?: string;
      details?: Record<string, unknown>;
    }) => {
      securityData.logAuditEvent(
        event.userId,
        event.action,
        event.resource,
        event.result as 'success' | 'failure',
        event.details
      );
    },
    [securityData]
  );

  // Updates hook
  const updatesData = useDataProviderUpdates(
    crossPageData,
    setCrossPageData,
    securityData.checkPermission,
    logAuditEventWrapper,
    securityData.encryptData as <T>(
      data: T,
      dataType: string
    ) => T & { _encrypted: boolean; _encryptionType: string; _encryptedAt: string },
    securityData.isSecurityEnabled,
    syncConnected,
    wsSyncData
  );

  // Enhanced sync data function with notifications
  const enhancedSyncData = React.useCallback(async () => {
    await syncData.performDataSync(addNotificationWrapper);
  }, [syncData, addNotificationWrapper]);

  // Enhanced advance workflow with loading states
  const enhancedAdvanceWorkflow = React.useCallback(
    async (toStage: WorkflowStage<Record<string, unknown>>) => {
      setIsLoading(true);
      try {
        await workflowData.advanceWorkflow(toStage);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Workflow advance failed';
        setError(errorMessage);
        addAlertWrapper({
          severity: 'high',
          title: 'Workflow Error',
          message: err instanceof Error ? err.message : 'Failed to advance workflow',
          pages: [workflowData.workflowState?.currentStage.page || '', toStage.page],
          autoResolve: true,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [workflowData, notificationsData, setIsLoading, setError]
  );

  // Enhanced reset workflow
  const enhancedResetWorkflow = React.useCallback(() => {
    workflowData.resetWorkflow();
    setCrossPageData(createInitialCrossPageData());
  }, [workflowData]);

  // Create wrapper for checkCompliance to match expected signature
  const checkComplianceWrapper = React.useCallback(
    (framework: string) => {
      const requirements = securityData.checkCompliance(framework);
      return requirements.map((req) => ({
        framework,
        status: req.requirement ? 'compliant' : 'non-compliant',
        issues: req.requirement ? [] : ['Non-compliant'],
      }));
    },
    [securityData]
  );

  // Create wrappers for security policy functions
  const createSecurityPolicyWrapper = React.useCallback(
    (policy: Record<string, unknown>) => {
      // Type assertion needed due to interface mismatch between context and hook
      const result = securityData.createSecurityPolicy(policy as Parameters<typeof securityData.createSecurityPolicy>[0]);
      return result as Record<string, unknown>;
    },
    [securityData]
  );

  const updateSecurityPolicyWrapper = React.useCallback(
    (policyId: string, policy: Record<string, unknown>) => {
      securityData.updateSecurityPolicy(
        policyId,
        policy as unknown as Partial<Record<string, unknown>>
      );
    },
    [securityData]
  );

  const deleteSecurityPolicyWrapper = React.useCallback(
    (policyId: string) => {
      securityData.deleteSecurityPolicy(policyId);
    },
    [securityData]
  );

  const exportAuditLogsWrapper = React.useCallback(() => {
    return securityData.exportAuditLogs();
  }, [securityData]);

  const contextValue: DataContextType = {
    ...storageData,
    ...workflowData,
    crossPageData,
    updateCrossPageData: updatesData.updateCrossPageData as DataContextType['updateCrossPageData'],
    ...syncData,
    syncData: enhancedSyncData,
    notifications: notificationsData.notifications,
    alerts: notificationsData.alerts,
    addNotification: notificationsData.addNotification,
    addAlert: notificationsData.addAlert,
    dismissAlert: notificationsData.dismissAlert,
    validateCrossPageData,
    subscribeToUpdates: updatesData.subscribeToUpdates,
    isLoading,
    error,
    // WebSocket integration
    isConnected: collaborationConnected && syncConnected,
    activeUsers,
    liveComments,
    sendComment,
    updatePresence,
    // Security integration (excluding arrays that need casting)
    isSecurityEnabled: securityData.isSecurityEnabled,
    checkPermission: securityData.checkPermission,
    logAuditEvent: securityData.logAuditEvent,
    encryptData: securityData.encryptData,
    decryptData: securityData.decryptData,
    checkCompliance: checkComplianceWrapper,
    createSecurityPolicy: createSecurityPolicyWrapper,
    updateSecurityPolicy: updateSecurityPolicyWrapper,
    deleteSecurityPolicy: deleteSecurityPolicyWrapper,
    exportAuditLogs: exportAuditLogsWrapper,
    securityPolicies: securityData.securityPolicies as unknown as Record<string, unknown>[],
    auditLogs: securityData.auditLogs.map((log) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      resource: log.resource,
      result: log.result,
      timestamp: log.timestamp,
      details: log.details,
    })),
    // Enhanced methods
    advanceWorkflow: enhancedAdvanceWorkflow,
    resetWorkflow: enhancedResetWorkflow,
    // Storage methods
    exportProject: storageData.exportProject,
    importProject: storageData.importProject,
    getCashflowData: (): CashflowData => {
      // Type conversion needed: service CashflowData -> component CashflowData
      // Component type has: id, projectId, records, lastUpdated
      // Service type has: categories, metrics, discrepancies, lastAnalyzed
      const serviceCashflowData = storageData.getCashflowData();
      if (!serviceCashflowData) {
        // Return default empty structure matching component type
        return {
          id: '',
          projectId: '',
          records: [],
          lastUpdated: new Date(),
        };
      }
      // Convert service type to component type
      return {
        id: '',
        projectId: '',
        records: [],
        lastUpdated: new Date(serviceCashflowData.lastAnalyzed || new Date().toISOString()),
      };
    },
    // Legacy compatibility methods
    createProject: storageData.createProject,
    updateProject: storageData.updateProject,
    addIngestionData: (projectId: string, ingestionData: IngestionData) => {
      // Convert component IngestionData to service IngestionData
      const serviceIngestionData: import('../services/dataManagement/types').IngestionData = {
        uploadedFiles: ingestionData.files || [],
        processedData: (ingestionData.processedData || []) as unknown as import('../services/dataManagement/types').ProcessedRecord[],
        dataQuality: {
          completeness: ingestionData.qualityMetrics?.completeness || 0,
          accuracy: ingestionData.qualityMetrics?.accuracy || 0,
          consistency: ingestionData.qualityMetrics?.consistency || 0,
          validity: ingestionData.qualityMetrics?.validity || 0,
          // Service type may not have duplicates/errors, use 0 as default
          duplicates: (ingestionData.qualityMetrics as { duplicates?: number })?.duplicates || 0,
          errors: (ingestionData.qualityMetrics as { errors?: number })?.errors || 0,
        },
        mappings: [],
        validations: (ingestionData.validationResults?.errors || []) as unknown as import('../services/dataManagement/types').DataValidation[],
        lastProcessed: ingestionData.lastUpdated instanceof Date 
          ? ingestionData.lastUpdated.toISOString() 
          : typeof ingestionData.lastUpdated === 'string'
          ? ingestionData.lastUpdated
          : new Date().toISOString(),
      };
      const result = storageData.addIngestionData(projectId, serviceIngestionData);
      return result || {} as ProjectData;
    },
    getIngestionData: (): IngestionData => {
      const result = storageData.getIngestionData();
      if (!result) {
        return {
          files: [],
          processedData: [],
          qualityMetrics: {
            completeness: 0,
            accuracy: 0,
            consistency: 0,
            validity: 0,
            duplicates: 0,
            errors: 0,
            overall: 0,
          },
          validationResults: {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: [],
          },
          lastUpdated: new Date(),
        } as IngestionData;
      }
      // Convert service IngestionData to component IngestionData
      return {
        files: result.uploadedFiles || [],
        processedData: (result.processedData || []) as unknown as IngestionData['processedData'],
        qualityMetrics: {
          completeness: result.dataQuality?.completeness || 0,
          accuracy: result.dataQuality?.accuracy || 0,
          consistency: result.dataQuality?.consistency || 0,
          validity: result.dataQuality?.validity || 0,
          overall: ((result.dataQuality?.completeness || 0) + 
                   (result.dataQuality?.accuracy || 0) + 
                   (result.dataQuality?.consistency || 0) + 
                   (result.dataQuality?.validity || 0)) / 4,
        },
        validationResults: {
          isValid: true,
          errors: (result.validations || []).map((v: Record<string, unknown>) => ({
            field: (v.field as string) || '',
            message: ((v.message || v.error) as string) || '',
            page: (v.page as number) || 0,
            severity: (v.severity as string) || 'error',
          })),
          warnings: [],
          suggestions: [],
        },
        lastUpdated: new Date(result.lastProcessed || new Date().toISOString()),
      } as IngestionData;
    },
    addReconciliationData: (projectId: string, reconciliationData: ReconciliationData) => {
      // Convert component ReconciliationData to service ReconciliationData
      const serviceReconciliationData: import('../services/dataManagement/types').ReconciliationData = {
        records: reconciliationData.records || [],
        matchingRules: [],
        metrics: {
          totalRecords: reconciliationData.records?.length || 0,
          matchedRecords: 0,
          unmatchedRecords: 0,
          discrepancyRecords: 0,
          pendingRecords: 0,
          resolvedRecords: 0,
          escalatedRecords: 0,
          averageConfidence: 0,
          averageProcessingTime: 0,
          matchRate: 0,
          accuracy: 0,
          throughput: 0,
          errorRate: 0,
          slaCompliance: 0,
        },
        auditTrail: [],
        lastReconciled: reconciliationData.lastUpdated instanceof Date 
          ? reconciliationData.lastUpdated.toISOString() 
          : typeof reconciliationData.lastUpdated === 'string'
          ? reconciliationData.lastUpdated
          : new Date().toISOString(),
      };
      const result = storageData.addReconciliationData(projectId, serviceReconciliationData);
      return result || {} as ProjectData;
    },
    getReconciliationData: (): ReconciliationData => {
      const result = storageData.getReconciliationData();
      if (!result) {
        return {} as ReconciliationData;
      }
      // Convert service ReconciliationData to component ReconciliationData
      return result as unknown as ReconciliationData;
    },
    addCashflowData: (projectId: string, cashflowData: CashflowData) => {
      // Convert component CashflowData to service CashflowData
      const serviceCashflowData: import('../services/dataManagement/types').CashflowData = {
        categories: [],
        metrics: {} as import('../services/dataManagement/types').CashflowMetrics,
        discrepancies: [],
        lastAnalyzed: cashflowData.lastUpdated instanceof Date 
          ? cashflowData.lastUpdated.toISOString() 
          : typeof cashflowData.lastUpdated === 'string' 
            ? cashflowData.lastUpdated 
            : new Date().toISOString(),
      };
      const result = storageData.addCashflowData(projectId, serviceCashflowData);
      return result || {} as ProjectData;
    },
    transformIngestionToReconciliation: storageData.transformIngestionToReconciliation,
    transformReconciliationToCashflow: storageData.transformReconciliationToCashflow,
    subscribeToProject: storageData.subscribeToProject,
  };

  // Accessibility: Announce loading and error states to screen readers
  useEffect(() => {
    if (isLoading) {
      const statusRegion = document.getElementById('data-provider-status');
      if (statusRegion) {
        statusRegion.setAttribute('aria-live', 'polite');
        statusRegion.setAttribute('aria-busy', 'true');
        statusRegion.textContent = 'Loading data...';
      }
    } else {
      const statusRegion = document.getElementById('data-provider-status');
      if (statusRegion) {
        statusRegion.setAttribute('aria-busy', 'false');
      }
    }
  }, [isLoading]);

  useEffect(() => {
    if (error) {
      const errorRegion = document.getElementById('data-provider-error');
      if (errorRegion) {
        errorRegion.setAttribute('aria-live', 'assertive');
        errorRegion.setAttribute('role', 'alert');
        errorRegion.textContent = `Error: ${error}`;
      }
    } else {
      const errorRegion = document.getElementById('data-provider-error');
      if (errorRegion) {
        errorRegion.textContent = '';
      }
    }
  }, [error]);

  return (
    <DataContext.Provider value={contextValue}>
      {/* Screen reader status regions */}
      <div
        id="data-provider-status"
        className="sr-only"
        role="status"
        aria-live="polite"
        {...(isLoading ? { 'aria-busy': 'true' } : {})}
      >
        {isLoading && 'Loading data...'}
      </div>
      <div id="data-provider-error" className="sr-only" role="alert" aria-live="assertive">
        {error && `Error: ${error}`}
      </div>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = React.useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Legacy compatibility exports
export const useUnifiedData = useData;
export const UnifiedDataProvider = DataProvider;

export default memo(DataProvider);
