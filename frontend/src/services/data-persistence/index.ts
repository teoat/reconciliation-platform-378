// Data Persistence Testing Suite - Refactored
// Modular architecture with extracted concerns for better maintainability

import { DataPersistenceTester } from './DataPersistenceTester';

// Re-export types and utilities for external use
export * from './types';
export * from './storageOperations';
export * from './testDefinitions';

// Default export for backward compatibility
export default DataPersistenceTester;
