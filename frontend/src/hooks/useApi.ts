// React Hooks for API Integration
'use client';

/**
 * @deprecated This file is deprecated. Use hooks from '@/hooks/api' instead.
 * This file is kept for backward compatibility and will be removed in v2.0.0
 * 
 * Migration guide:
 * - `useAuth` → `@/hooks/api/useAuth` or `@/hooks/api`
 * - `useProjects` → `@/hooks/api/useProjects` or `@/hooks/api`
 * - `useProject` → `@/hooks/api/useProject` or `@/hooks/api`
 * - `useIngestionJobs` → `@/hooks/api/useIngestionJobs` or `@/hooks/api`
 * - `useWebSocket` → `@/hooks/api/useWebSocket` or `@/hooks/api`
 * - `useRealtimeCollaboration` → `@/hooks/api/useRealtimeCollaboration` or `@/hooks/api`
 * - `useHealthCheck` → `@/hooks/api/useHealthCheck` or `@/hooks/api`
 */

// Re-export from organized modules for backward compatibility
export {
  useAuth,
  useProjects,
  useProject,
  useIngestionJobs,
  useWebSocket,
  useRealtimeCollaboration,
  useHealthCheck,
} from './api';

// Reconciliation hooks - re-export from components for backward compatibility
export { useReconciliationJobs } from '@/components/reconciliation/hooks/useReconciliationJobs';

// Wrapper hooks for API-enhanced hooks to match expected interface
import { useDataSourcesAPI } from './api-enhanced/useDataSourcesAPI';
import { useReconciliationMatchesAPI } from './api-enhanced/useReconciliationMatchesAPI';

// Wrapper to match expected interface
export const useDataSources = (projectId: string | null) => {
  const result = useDataSourcesAPI(projectId || undefined);
  return {
    dataSources: result.dataSources || [],
    uploadFile: result.uploadFile,
    processFile: result.processFile,
    isLoading: result.isLoading,
    error: result.error,
  };
};

// Wrapper to match expected interface  
export const useReconciliationMatches = (projectId: string | null) => {
  const result = useReconciliationMatchesAPI(projectId || undefined);
  return {
    matches: result.matches || [],
    updateMatch: result.updateMatch,
    isLoading: result.isLoading,
    error: result.error,
  };
};
