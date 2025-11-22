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
  const [isOnline, setIsOnline] = useState(true);

  // Memory optimization
  const cleanup = useComprehensiveCleanup();
  const cacheRef = useRef(new LRUMap<string, unknown>(100));

  // Security hook
  const securityData = useDataProviderSecurity();

  // Storage hook
  const storageData = useDataProviderStorage(setIsLoading, setError);

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
  const syncData = useDataProviderSync(setIsOnline);

  // Updates hook
  const updatesData = useDataProviderUpdates(
    crossPageData,
    setCrossPageData,
    securityData.checkPermission,
    (event) => securityData.logAuditEvent(
      event.userId,
      event.action,
      event.resource,
      event.result === 'denied' ? 'failure' : event.result,
      event.details
    ),
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
    // Security integration
    ...securityData,
    securityPolicies: securityData.securityPolicies as Array<Record<string, unknown>>,
    checkCompliance: (framework: string) => {
      const requirements = securityData.checkCompliance(framework);
      return requirements.map(req => ({
        framework: req.framework,
        status: req.status,
        issues: req.status === 'non_compliant' ? [req.requirement] : []
      }));
    },
    createSecurityPolicy: (policy: Record<string, unknown>) => 
      securityData.createSecurityPolicy(policy) as Record<string, unknown>,
    updateSecurityPolicy: (id: string, updates: Record<string, unknown>) => 
      securityData.updateSecurityPolicy(id, updates) as Record<string, unknown>,
    deleteSecurityPolicy: (id: string) => 
      securityData.deleteSecurityPolicy(id) as Record<string, unknown>,
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
