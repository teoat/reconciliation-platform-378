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
