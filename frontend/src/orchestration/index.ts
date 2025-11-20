/**
 * Orchestration Module - Main exports
 */

export * from './types';
export * from './PageFrenlyIntegration';
export * from './PageLifecycleManager';
export { getPageLifecycleManager } from './PageLifecycleManager';

// Synchronization modules
export * from './sync';

// Feature modules
export * from './modules';

// Page orchestrations
export * from './pages';

// Re-export for convenience
export { frenlyAgentService } from '@/services/frenlyAgentService';
