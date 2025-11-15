// Test Definitions Module
// Contains all test definitions for data persistence testing
// Extracted from dataPersistenceTester.ts

import { DataPersistenceTest } from './types';
import { StorageOperations } from './storageOperations';

export class TestDefinitions {
  static getAllTests(): DataPersistenceTest[] {
    return [
      // Local Storage Tests
      {
        id: 'local-storage-basic-save',
        name: 'Local Storage Basic Save',
        description: 'Test basic save operation to localStorage',
        category: 'local-storage',
        priority: 'high',
        requiresStorageSimulation: false,
        testFunction: async () => {
          const startTime = Date.now();
          const testData = { id: 1, name: 'test', data: 'sample data' };

          try {
            const operation = await StorageOperations.saveToLocalStorage('test-key', testData);
            const duration = Date.now() - startTime;

            return {
              success: operation.success,
              message: operation.success
                ? 'Local storage save successful'
                : 'Local storage save failed',
              timestamp: new Date(),
              duration,
              storageOperations: [operation],
            };
          } catch (error) {
            return {
              success: false,
              message: `Local storage save error: ${error instanceof Error ? error.message : String(error)}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : String(error)],
            };
          }
        },
      },

      {
        id: 'local-storage-basic-load',
        name: 'Local Storage Basic Load',
        description: 'Test basic load operation from localStorage',
        category: 'local-storage',
        priority: 'high',
        requiresStorageSimulation: false,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            // First save some data
            const saveOp = await StorageOperations.saveToLocalStorage('load-test-key', {
              test: 'data',
            });
            if (!saveOp.success) throw new Error('Failed to save test data');

            // Then load it
            const loadOp = await StorageOperations.loadFromLocalStorage('load-test-key');
            const duration = Date.now() - startTime;

            return {
              success: loadOp.success,
              message: loadOp.success
                ? 'Local storage load successful'
                : 'Local storage load failed',
              timestamp: new Date(),
              duration,
              storageOperations: [saveOp, loadOp],
            };
          } catch (error) {
            return {
              success: false,
              message: `Local storage load error: ${error instanceof Error ? error.message : String(error)}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : String(error)],
            };
          }
        },
      },

      // Session Storage Tests
      {
        id: 'session-storage-basic-save',
        name: 'Session Storage Basic Save',
        description: 'Test basic save operation to sessionStorage',
        category: 'session-storage',
        priority: 'high',
        requiresStorageSimulation: false,
        testFunction: async () => {
          const startTime = Date.now();
          const testData = { id: 2, name: 'session-test', data: 'session data' };

          try {
            const operation = await StorageOperations.saveToSessionStorage(
              'session-test-key',
              testData
            );
            const duration = Date.now() - startTime;

            return {
              success: operation.success,
              message: operation.success
                ? 'Session storage save successful'
                : 'Session storage save failed',
              timestamp: new Date(),
              duration,
              storageOperations: [operation],
            };
          } catch (error) {
            return {
              success: false,
              message: `Session storage save error: ${error instanceof Error ? error.message : String(error)}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : String(error)],
            };
          }
        },
      },

      {
        id: 'session-storage-basic-load',
        name: 'Session Storage Basic Load',
        description: 'Test basic load operation from sessionStorage',
        category: 'session-storage',
        priority: 'high',
        requiresStorageSimulation: false,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            // First save some data
            const saveOp = await StorageOperations.saveToSessionStorage('session-load-test', {
              test: 'session-data',
            });
            if (!saveOp.success) throw new Error('Failed to save session test data');

            // Then load it
            const loadOp = await StorageOperations.loadFromSessionStorage('session-load-test');
            const duration = Date.now() - startTime;

            return {
              success: loadOp.success,
              message: loadOp.success
                ? 'Session storage load successful'
                : 'Session storage load failed',
              timestamp: new Date(),
              duration,
              storageOperations: [saveOp, loadOp],
            };
          } catch (error) {
            return {
              success: false,
              message: `Session storage load error: ${error instanceof Error ? error.message : String(error)}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : String(error)],
            };
          }
        },
      },

      // Storage Capacity Tests
      {
        id: 'storage-capacity-test',
        name: 'Storage Capacity Test',
        description: 'Test storage capacity limits and quota management',
        category: 'local-storage',
        priority: 'medium',
        requiresStorageSimulation: false,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const quota = StorageOperations.getStorageQuota('localStorage');
            const largeData = 'x'.repeat(Math.min(quota.available, 1024 * 1024)); // 1MB or available space

            const operation = await StorageOperations.saveToLocalStorage('capacity-test', {
              data: largeData,
            });
            const duration = Date.now() - startTime;

            return {
              success: operation.success,
              message: operation.success
                ? 'Storage capacity test passed'
                : 'Storage capacity test failed',
              timestamp: new Date(),
              duration,
              storageOperations: [operation],
              details: { quota, dataSize: largeData.length },
            };
          } catch (error) {
            return {
              success: false,
              message: `Storage capacity test error: ${error instanceof Error ? error.message : String(error)}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : String(error)],
            };
          }
        },
      },
    ];
  }
}
