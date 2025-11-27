/**
 * API Hooks
 * 
 * Centralized exports for all API-related hooks
 * Organized by feature domain for better maintainability
 */

// Authentication
export { useAuth } from './useAuth';

// Projects
export { useProjects, useProject } from './useProjects';

// Ingestion
export { useIngestionJobs } from './useIngestion';

// WebSocket & Real-time Collaboration
export { useWebSocket, useRealtimeCollaboration } from './useWebSocket';

// Health Check
export { useHealthCheck } from './useHealthCheck';

