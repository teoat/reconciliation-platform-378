// Data Persistence Testing - Refactored
// Re-exports from modular structure for backward compatibility
// Original file was 1,938 lines - now uses extracted modules from ./data-persistence/

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
