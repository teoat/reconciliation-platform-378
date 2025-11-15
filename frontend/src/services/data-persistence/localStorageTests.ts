// Local Storage Tests
// Test suite for localStorage persistence functionality

import {
  DataPersistenceTestResult,
  StorageOperation,
  DataIntegrityCheck,
  PersistenceMetrics,
} from './types';
import { StorageUtils } from './storageUtils';

export class LocalStorageTests {
  private calculatePersistenceMetrics(operations: StorageOperation[]): PersistenceMetrics {
    return StorageUtils.calculatePersistenceMetrics(operations);
  }

  private async saveToLocalStorage(key: string, data: unknown): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      return {
        type: 'save',
        storage: 'localStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: serializedData.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        type: 'save',
        storage: 'localStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  private async loadFromLocalStorage(key: string): Promise<StorageOperation & { data: unknown }> {
    const startTime = Date.now();
    try {
      const serializedData = localStorage.getItem(key);
      if (serializedData) {
        const data = JSON.parse(serializedData);
        return {
          type: 'load',
          storage: 'localStorage',
          key,
          success: true,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          data,
        };
      } else {
        return {
          type: 'load',
          storage: 'localStorage',
          key,
          success: false,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          data: null,
        };
      }
    } catch (error) {
      return {
        type: 'load',
        storage: 'localStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data: null,
      };
    }
  }

  private async updateInLocalStorage(key: string, data: unknown): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      return {
        type: 'update',
        storage: 'localStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: serializedData.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        type: 'update',
        storage: 'localStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  private async deleteFromLocalStorage(key: string): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      localStorage.removeItem(key);
      return {
        type: 'delete',
        storage: 'localStorage',
        key,
        success: true,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        type: 'delete',
        storage: 'localStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  async testLocalStorageBasic(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const storageOperations: StorageOperation[] = [];
      const dataIntegrity: DataIntegrityCheck[] = [];

      // Test basic save operation
      const testData = { name: 'Test User', email: 'test@example.com', id: 123 };
      const saveResult = await this.saveToLocalStorage('test-user', testData);
      storageOperations.push(saveResult);

      // Test basic load operation
      const loadResult = await this.loadFromLocalStorage('test-user');
      storageOperations.push(loadResult);

      // Test data integrity
      const integrityCheck = await StorageUtils.checkDataIntegrity(testData, loadResult.data);
      dataIntegrity.push(integrityCheck);

      // Test update operation
      const updatedData = { ...testData, email: 'updated@example.com' };
      const updateResult = await this.updateInLocalStorage('test-user', updatedData);
      storageOperations.push(updateResult);

      // Test delete operation
      const deleteResult = await this.deleteFromLocalStorage('test-user');
      storageOperations.push(deleteResult);

      const allSuccessful = storageOperations.every((op) => op.success);
      const integrityPassed = dataIntegrity.every((check) => check.passed);
      const duration = Date.now() - startTime;

      return {
        success: allSuccessful && integrityPassed,
        message:
          allSuccessful && integrityPassed
            ? 'Local storage basic operations working correctly'
            : 'Local storage basic operations issues detected',
        details: {
          storageOperations,
          dataIntegrity,
          testData,
        },
        timestamp: new Date(),
        duration,
        storageOperations,
        dataIntegrity,
        persistenceMetrics: this.calculatePersistenceMetrics(storageOperations),
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: `Local storage basic test failed: ${err.message}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [err.message],
      };
    }
  }

  async testLocalStorageLargeData(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const storageOperations: StorageOperation[] = [];
      const dataIntegrity: DataIntegrityCheck[] = [];

      // Generate large test data (1MB)
      const largeData = StorageUtils.generateLargeTestData(1024 * 1024);
      const testKey = 'large-data-test';

      // Test saving large data
      const saveResult = await this.saveToLocalStorage(testKey, largeData);
      storageOperations.push(saveResult);

      if (saveResult.success) {
        // Test loading large data
        const loadResult = await this.loadFromLocalStorage(testKey);
        storageOperations.push(loadResult);

        // Test data integrity
        const integrityCheck = await StorageUtils.checkDataIntegrity(largeData, loadResult.data);
        dataIntegrity.push(integrityCheck);

        // Test performance
        const performanceCheck = await StorageUtils.checkStoragePerformance(storageOperations);
        dataIntegrity.push(performanceCheck);
      }

      // Clean up
      await this.deleteFromLocalStorage(testKey);

      const allSuccessful = storageOperations.every((op) => op.success);
      const integrityPassed = dataIntegrity.every((check) => check.passed);
      const duration = Date.now() - startTime;

      return {
        success: allSuccessful && integrityPassed,
        message:
          allSuccessful && integrityPassed
            ? 'Local storage large data handling working correctly'
            : 'Local storage large data handling issues detected',
        details: {
          dataSize: JSON.stringify(largeData).length,
          storageOperations,
          dataIntegrity,
        },
        timestamp: new Date(),
        duration,
        storageOperations,
        dataIntegrity,
        persistenceMetrics: this.calculatePersistenceMetrics(storageOperations),
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: `Local storage large data test failed: ${err.message}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [err.message],
      };
    }
  }

  async testLocalStorageQuota(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const dataIntegrity: DataIntegrityCheck[] = [];

      // Check current quota
      const quotaCheck = await StorageUtils.checkLocalStorageQuota();
      dataIntegrity.push(quotaCheck);

      // Test quota exceeded handling
      const quotaExceededCheck = await StorageUtils.testQuotaExceededHandling();
      dataIntegrity.push(quotaExceededCheck);

      // Test quota cleanup
      const quotaCleanupCheck = await StorageUtils.testQuotaCleanup();
      dataIntegrity.push(quotaCleanupCheck);

      const allPassed = dataIntegrity.every((check) => check.passed);
      const duration = Date.now() - startTime;

      return {
        success: allPassed,
        message: allPassed
          ? 'Local storage quota management working correctly'
          : 'Local storage quota management issues detected',
        details: {
          dataIntegrity,
        },
        timestamp: new Date(),
        duration,
        dataIntegrity,
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: `Local storage quota test failed: ${err.message}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [err.message],
      };
    }
  }
}
