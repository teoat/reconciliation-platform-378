'use client';

import React, { useState, useEffect, memo, useRef } from 'react';
import { useComprehensiveCleanup, LRUMap } from '../utils/memoryOptimization';
import { DataContext, DataContextType } from './data/context';
import { useDataValidation } from './data/sync';
import { createInitialCrossPageData } from './data/initialData';
import { WorkflowStage } from './data/types';
import type { ReactNode } from 'react';
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
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);

  // Memory optimization
  const cleanup = useComprehensiveCleanup();
  const cacheRef = useRef(new LRUMap<string, unknown>(100));

  // Security hook
  const securityData = useDataProviderSecurity();

  // Storage hook
  const storageData = useDataProviderStorage(setCurrentProject, setIsLoading, setError);

  // Validation hook
  const { validateCrossPageData } = useDataValidation(crossPageData);

  // Notifications hook
  const notificationsData = useDataProviderNotifications();

  // Workflow hook
  const workflowData = useDataProviderWorkflow(
    crossPageData,
    validateCrossPageData,
    notificationsData.addAlert,
    notificationsData.addNotification
  );

  // Sync hook
  const syncData = useDataProviderSync(() => {});

  // Create wrapper for logAuditEvent to match expected signature
  const logAuditEventWrapper = React.useCallback((event: {
    userId: string;
    action: string;
    resource: string;
    result: 'success' | 'failure' | 'denied';
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
  }) => {
    securityData.logAuditEvent(event.userId, event.action, event.resource, event.result as 'success' | 'failure', event.details);
  }, [securityData]);

  // Updates hook
  const updatesData = useDataProviderUpdates(
    crossPageData,
    setCrossPageData,
    securityData.checkPermission,
    logAuditEventWrapper,
    securityData.encryptData,
    securityData.isSecurityEnabled,
    syncConnected,
    wsSyncData
  );

  // Enhanced sync data function with notifications
  const enhancedSyncData = React.useCallback(async () => {
    await syncData.performDataSync(notificationsData.addNotification);
  }, [syncData, notificationsData]);

  // Enhanced advance workflow with loading states
  const enhancedAdvanceWorkflow = React.useCallback(
    async (toStage: WorkflowStage<Record<string, unknown>>) => {
      setIsLoading(true);
      try {
        await workflowData.advanceWorkflow(toStage);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Workflow advance failed';
        setError(errorMessage);
        notificationsData.addAlert({
          severity: 'high',
          title: 'Workflow Error',
          message: err instanceof Error ? err.message : 'Failed to advance workflow',
          pages: [workflowData.workflowState?.currentStage.page || '', toStage.page],
          isDismissed: false,
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
  const checkComplianceWrapper = React.useCallback((framework: string) => {
    const requirements = securityData.checkCompliance(framework);
    return requirements.map(req => ({
      framework,
      status: req.requirement ? 'compliant' : 'non-compliant',
      issues: req.requirement ? [] : ['Non-compliant']
    }));
  }, [securityData]);

  // Create wrappers for security policy functions
  const createSecurityPolicyWrapper = React.useCallback((policy: Record<string, unknown>) => {
    return securityData.createSecurityPolicy(policy as any) as unknown as Record<string, unknown>;
  }, [securityData]);

  const updateSecurityPolicyWrapper = React.useCallback((policyId: string, policy: Record<string, unknown>) => {
    return securityData.updateSecurityPolicy(policyId, policy as any) as unknown as Record<string, unknown>;
  }, [securityData]);

  const deleteSecurityPolicyWrapper = React.useCallback((policyId: string) => {
    securityData.deleteSecurityPolicy(policyId);
  }, [securityData]);

  const exportAuditLogsWrapper = React.useCallback((startDate?: string, endDate?: string) => {
    return securityData.exportAuditLogs();
  }, [securityData]);

  const contextValue: DataContextType = {
    ...storageData,
    ...workflowData,
    crossPageData,
    updateCrossPageData: updatesData.updateCrossPageData,
    ...syncData,
    syncData: enhancedSyncData,
    ...notificationsData,
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
    auditLogs: securityData.auditLogs as any,
    // Enhanced methods
    advanceWorkflow: enhancedAdvanceWorkflow,
    resetWorkflow: enhancedResetWorkflow,
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
