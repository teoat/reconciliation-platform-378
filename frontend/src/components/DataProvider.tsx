'use client';

import React, { useState, useEffect, memo, useRef } from 'react';
import { useSecurity } from '../hooks/useSecurity';
import { useComprehensiveCleanup, LRUMap } from '../utils/memoryOptimization';
import { DataContext, DataContextType } from './data/context';
import { useDataStorage } from './data/storage';
import { useWorkflowProgress, useWorkflowValidation, createInitialWorkflowState } from './data/workflow';
import { useSyncStatus, useDataValidation } from './data/sync';
import { useNotifications, useAlerts } from './data/notifications';
import { useCrossPageDataUpdates } from './data/updates';
import { createInitialCrossPageData } from './data/initialData';
import { WorkflowState, WorkflowStage } from './data/types';
import type { ReactNode } from 'react';

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // WebSocket integration - placeholder until DataProvider is refactored
  const collaborationConnected = true;
  const activeUsers: Array<{ id: string; name: string; page: string; lastSeen: string }> = [];
  const liveComments: Array<{ id: string; userId: string; userName: string; message: string; timestamp: string; page: string }> = [];
  const sendComment = () => {};
  const updatePresence = () => {};
  const syncConnected = true;
  const wsSyncData = () => {};
  
  // Security integration
  const {
    securityPolicies,
    auditLogs,
    isSecurityEnabled,
    checkPermission,
    logAuditEvent,
    encryptData,
    decryptData,
    checkCompliance,
    createSecurityPolicy,
    updateSecurityPolicy,
    deleteSecurityPolicy,
    exportAuditLogs,
  } = useSecurity();
  
  // Core state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  
  // Cross-page data
  const [crossPageData, setCrossPageData] = useState(createInitialCrossPageData());
  
  // Memory optimization
  const cleanup = useComprehensiveCleanup();
  const cacheRef = useRef(new LRUMap<string, unknown>(100));
  
  // Data storage hooks
  const {
    currentProject,
    setCurrentProject,
    createProject,
    updateProject,
    addIngestionData,
    getIngestionData,
    addReconciliationData,
    getReconciliationData,
    addCashflowData,
    getCashflowData,
    transformIngestionToReconciliation,
    transformReconciliationToCashflow,
    subscribeToProject,
    exportProject,
    importProject,
  } = useDataStorage(setCurrentProject, setIsLoading, setError);
  
  // Workflow hooks
  const workflowProgress = useWorkflowProgress(workflowState);
  const { validateCrossPageData } = useDataValidation(crossPageData);
  const { validateWorkflowConsistency, validateAdvancement } = useWorkflowValidation(
    workflowState,
    crossPageData,
    validateCrossPageData
  );
  
  // Sync hooks
  const { syncStatus, performDataSync, updateOnlineStatus } = useSyncStatus();
  
  // Notifications hooks
  const { notifications, addNotification } = useNotifications();
  const { alerts, addAlert, dismissAlert } = useAlerts();
  
  // Cross-page updates
  const { updateCrossPageData: updateCrossPageDataInternal, subscribeToUpdates } = useCrossPageDataUpdates(
    crossPageData,
    setCrossPageData,
    checkPermission,
    logAuditEvent,
    encryptData,
    isSecurityEnabled,
    syncConnected,
    wsSyncData
  );
  
  // Initialize workflow state
  useEffect(() => {
    if (!workflowState) {
      setWorkflowState(createInitialWorkflowState());
    }
  }, [workflowState]);
  
  // Advance workflow
  const advanceWorkflow = React.useCallback(async (toStage: WorkflowStage<Record<string, unknown>>) => {
    if (!workflowState) return;
    
    setIsLoading(true);
    try {
      // Validate transition
      const validation = validateAdvancement(toStage);
      if (!validation.isValid) {
        throw new Error(`Cannot advance to ${toStage.name}: ${validation.errors.map((e) => e.message).join(', ')}`);
      }
      
      // Update workflow state
      setWorkflowState((prev) => prev ? {
        ...prev,
        currentStage: toStage,
        progress: (toStage.order / 6) * 100,
        lastUpdated: new Date(),
        previousStage: prev.currentStage,
        nextStage: undefined,
      } : null);
      
      // Notify users
      addNotification({
        type: 'info',
        title: 'Workflow Advanced',
        message: `Advanced to ${toStage.name}`,
        page: toStage.page,
        isRead: false,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Workflow advance failed';
      setError(errorMessage);
      addAlert({
        severity: 'high',
        title: 'Workflow Error',
        message: err instanceof Error ? err.message : 'Failed to advance workflow',
        pages: [workflowState.currentStage.page, toStage.page],
        isDismissed: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [workflowState, addAlert, addNotification, validateAdvancement]);
  
  // Reset workflow
  const resetWorkflow = React.useCallback(() => {
    setWorkflowState(null);
    setCrossPageData(createInitialCrossPageData());
  }, []);
  
  // Sync with notifications
  const syncData = React.useCallback(async () => {
    await performDataSync(addNotification);
  }, [performDataSync, addNotification]);
  
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      updateOnlineStatus(true);
      syncData();
    };
    
    const handleOffline = () => {
      updateOnlineStatus(false);
    };
    
    cleanup.addEventListener(window, 'online', handleOnline);
    cleanup.addEventListener(window, 'offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncData, cleanup, updateOnlineStatus]);
  
  const contextValue: DataContextType = {
    currentProject,
    setCurrentProject,
    workflowState,
    setWorkflowState,
    crossPageData,
    updateCrossPageData: updateCrossPageDataInternal,
    syncStatus,
    syncData,
    workflowProgress,
    advanceWorkflow,
    notifications,
    alerts,
    addNotification,
    addAlert,
    dismissAlert,
    validateCrossPageData,
    validateWorkflowConsistency,
    subscribeToUpdates,
    isLoading,
    error,
    // WebSocket integration
    isConnected: collaborationConnected && syncConnected,
    activeUsers,
    liveComments,
    sendComment,
    updatePresence,
    // Security integration
    securityPolicies,
    auditLogs,
    isSecurityEnabled,
    checkPermission,
    logAuditEvent,
    encryptData,
    decryptData,
    checkCompliance,
    createSecurityPolicy,
    updateSecurityPolicy,
    deleteSecurityPolicy,
    exportAuditLogs,
    // Legacy compatibility
    createProject,
    updateProject,
    addIngestionData,
    getIngestionData,
    addReconciliationData,
    getReconciliationData,
    addCashflowData,
    getCashflowData,
    transformIngestionToReconciliation,
    transformReconciliationToCashflow,
    subscribeToProject,
    exportProject,
    importProject,
    resetWorkflow,
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
      <div
        id="data-provider-error"
        className="sr-only"
        role="alert"
        aria-live="assertive"
      >
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
