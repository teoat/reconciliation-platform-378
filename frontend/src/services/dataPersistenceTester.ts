// ============================================================================
// DEPRECATED: Use modular imports instead
// ============================================================================
// This file is kept for backward compatibility only.
// Original file was 1,938 lines - now uses extracted modules from ./data-persistence/
// 
// ✅ DO: Import from modular structure
//   import { DataPersistenceTester } from '@/services/data-persistence/DataPersistenceTester';
//   import type { DataPersistenceConfig } from '@/services/data-persistence/types';
//
// ❌ DON'T: Import from this file (deprecated)
//   import { DataPersistenceTester } from '@/services/dataPersistenceTester';
//
// This file will be removed in v2.0.0

// Re-export all types and interfaces from the modular structure
export type {
  DataPersistenceTest,
  DataPersistenceTestResult,
  StorageOperation,
  DataIntegrityCheck,
  PersistenceMetrics,
  DataPersistenceConfig,
  TestSuiteResult,
} from './data-persistence/types';

// Re-export the main class from the refactored module
export { DataPersistenceTester, default } from './data-persistence/DataPersistenceTester';

// Re-export utilities for convenience
export * from './data-persistence/storageOperations';
export * from './data-persistence/testDefinitions';
