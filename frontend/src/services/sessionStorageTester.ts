export interface StorageOperation {
  type: 'save' | 'load' | 'delete' | 'update';
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'cache';
  key: string;
  success: boolean;
  timestamp: Date;
  size?: number;
  duration?: number;
}

export interface DataIntegrityCheck {
  type: 'checksum' | 'validation' | 'consistency';
  passed: boolean;
  details: string | Record<string, unknown>;
  timestamp: Date;
}

export interface PersistenceMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageOperationTime: number;
  totalDataSize: number;
}

export interface DataPersistenceTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  duration: number;
  errors?: string[];
  storageOperations?: StorageOperation[];
  dataIntegrity?: DataIntegrityCheck[];
  persistenceMetrics?: PersistenceMetrics;
}

export class SessionStorageTester {
  constructor() {}

  private async saveToSessionStorage(key: string, data: any): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      const serializedData = JSON.stringify(data);
      sessionStorage.setItem(key, serializedData);
      const duration = Date.now() - startTime;
      return {
        type: 'save',
        storage: 'sessionStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: serializedData.length,
        duration,
      };
    } catch (error) {
      return {
        type: 'save',
        storage: 'sessionStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  private async loadFromSessionStorage(key: string): Promise<StorageOperation & { data: unknown }> {
    const startTime = Date.now();
    try {
      const serializedData = sessionStorage.getItem(key);
      if (!serializedData) {
        throw new Error('Data not found');
      }
      const data = JSON.parse(serializedData);
      const duration = Date.now() - startTime;
      return {
        type: 'load',
        storage: 'sessionStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: serializedData.length,
        duration,
        data,
      };
    } catch (error) {
      return {
        type: 'load',
        storage: 'sessionStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data: null,
      };
    }
  }

  private async updateInSessionStorage(key: string, data: unknown): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      const serializedData = JSON.stringify(data);
      sessionStorage.setItem(key, serializedData);
      const duration = Date.now() - startTime;
      return {
        type: 'update',
        storage: 'sessionStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: serializedData.length,
        duration,
      };
    } catch (error) {
      return {
        type: 'update',
        storage: 'sessionStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  private async deleteFromSessionStorage(key: string): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      sessionStorage.removeItem(key);
      return {
        type: 'delete',
        storage: 'sessionStorage',
        key,
        success: true,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        type: 'delete',
        storage: 'sessionStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  private async checkDataIntegrity(
    originalData: unknown,
    retrievedData: unknown
  ): Promise<DataIntegrityCheck> {
    try {
      const originalStr = JSON.stringify(originalData);
      const retrievedStr = JSON.stringify(retrievedData);
      const passed = originalStr === retrievedStr;

      return {
        type: 'validation',
        passed,
        details: passed
          ? 'Data integrity verified'
          : {
              original: originalData,
              retrieved: retrievedData,
              differences: this.findDifferences(originalData, retrievedData),
            },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        type: 'validation',
        passed: false,
        details: `Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
    }
  }

  private findDifferences(obj1: unknown, obj2: unknown): Record<string, unknown> {
    const differences: Record<string, unknown> = {};
    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
      return differences;
    }
    const obj1Record = obj1 as Record<string, unknown>;
    const obj2Record = obj2 as Record<string, unknown>;
    const keys1 = Object.keys(obj1Record);
    const keys2 = Object.keys(obj2Record);

    for (const key of keys1) {
      if (!(key in obj2Record)) {
        differences[key] = { expected: obj1Record[key], actual: undefined };
      } else if (JSON.stringify(obj1Record[key]) !== JSON.stringify(obj2Record[key])) {
        differences[key] = { expected: obj1Record[key], actual: obj2Record[key] };
      }
    }

    for (const key of keys2) {
      if (!(key in obj1Record)) {
        differences[key] = { expected: undefined, actual: obj2Record[key] };
      }
    }

    return differences;
  }

  private calculatePersistenceMetrics(operations: StorageOperation[]): PersistenceMetrics {
    const totalOperations = operations.length;
    const successfulOperations = operations.filter((op) => op.success).length;
    const failedOperations = totalOperations - successfulOperations;
    const totalTime = operations.reduce((sum, op) => sum + (op.duration || 0), 0);
    const averageOperationTime = totalOperations > 0 ? totalTime / totalOperations : 0;
    const totalDataSize = operations.reduce((sum, op) => sum + (op.size || 0), 0);

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      averageOperationTime,
      totalDataSize,
    };
  }

  public async testSessionStorageBasic(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const storageOperations: StorageOperation[] = [];
      const dataIntegrity: DataIntegrityCheck[] = [];

      // Test basic save operation
      const testData = { name: 'Test User', email: 'test@example.com', id: 123 };
      const saveResult = await this.saveToSessionStorage('test-user', testData);
      storageOperations.push(saveResult);

      // Test basic load operation
      const loadResult = await this.loadFromSessionStorage('test-user');
      storageOperations.push(loadResult);

      // Test data integrity
      const integrityCheck = await this.checkDataIntegrity(testData, loadResult.data);
      dataIntegrity.push(integrityCheck);

      // Test update operation
      const updatedData = { ...testData, email: 'updated@example.com' };
      const updateResult = await this.updateInSessionStorage('test-user', updatedData);
      storageOperations.push(updateResult);

      // Test delete operation
      const deleteResult = await this.deleteFromSessionStorage('test-user');
      storageOperations.push(deleteResult);

      const allSuccessful = storageOperations.every((op) => op.success);
      const integrityPassed = dataIntegrity.every((check) => check.passed);
      const duration = Date.now() - startTime;

      return {
        success: allSuccessful && integrityPassed,
        message:
          allSuccessful && integrityPassed
            ? 'Session storage basic operations working correctly'
            : 'Session storage basic operations issues detected',
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
      return {
        success: false,
        message: `Session storage basic test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  public async testSessionStoragePersistence(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const storageOperations: StorageOperation[] = [];
      const dataIntegrity: DataIntegrityCheck[] = [];

      // Test data persistence across simulated page operations
      const testData = {
        user: { id: 123, name: 'Test User' },
        preferences: { theme: 'dark', language: 'en' },
        session: { startTime: Date.now(), actions: ['login', 'navigate'] },
      };

      // Save initial data
      const saveResult = await this.saveToSessionStorage('session-data', testData);
      storageOperations.push(saveResult);

      // Simulate some operations that might affect session storage
      const updatedData = {
        ...testData,
        session: {
          ...testData.session,
          actions: [...testData.session.actions, 'update-profile'],
        },
      };

      const updateResult = await this.updateInSessionStorage('session-data', updatedData);
      storageOperations.push(updateResult);

      // Load and verify persistence
      const loadResult = await this.loadFromSessionStorage('session-data');
      storageOperations.push(loadResult);

      // Test data integrity
      const integrityCheck = await this.checkDataIntegrity(updatedData, loadResult.data);
      dataIntegrity.push(integrityCheck);

      // Clean up
      await this.deleteFromSessionStorage('session-data');

      const allSuccessful = storageOperations.every((op) => op.success);
      const integrityPassed = dataIntegrity.every((check) => check.passed);
      const duration = Date.now() - startTime;

      return {
        success: allSuccessful && integrityPassed,
        message:
          allSuccessful && integrityPassed
            ? 'Session storage persistence working correctly'
            : 'Session storage persistence issues detected',
        details: {
          storageOperations,
          dataIntegrity,
          testData: updatedData,
        },
        timestamp: new Date(),
        duration,
        storageOperations,
        dataIntegrity,
        persistenceMetrics: this.calculatePersistenceMetrics(storageOperations),
      };
    } catch (error) {
      return {
        success: false,
        message: `Session storage persistence test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  public async testSessionStorageIsolation(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const storageOperations: StorageOperation[] = [];
      const dataIntegrity: DataIntegrityCheck[] = [];

      // Test that session storage is properly isolated
      const testData1 = { id: 1, name: 'Test 1' };
      const testData2 = { id: 2, name: 'Test 2' };

      // Save two different items
      const saveResult1 = await this.saveToSessionStorage('test-1', testData1);
      const saveResult2 = await this.saveToSessionStorage('test-2', testData2);
      storageOperations.push(saveResult1, saveResult2);

      // Load both items
      const loadResult1 = await this.loadFromSessionStorage('test-1');
      const loadResult2 = await this.loadFromSessionStorage('test-2');
      storageOperations.push(loadResult1, loadResult2);

      // Test data integrity for both
      const integrityCheck1 = await this.checkDataIntegrity(testData1, loadResult1.data);
      const integrityCheck2 = await this.checkDataIntegrity(testData2, loadResult2.data);
      dataIntegrity.push(integrityCheck1, integrityCheck2);

      // Test that deleting one doesn't affect the other
      await this.deleteFromSessionStorage('test-1');

      // Try to load deleted item (should fail)
      const loadDeleted = await this.loadFromSessionStorage('test-1');
      storageOperations.push(loadDeleted);

      // Load the remaining item (should still work)
      const loadRemaining = await this.loadFromSessionStorage('test-2');
      storageOperations.push(loadRemaining);

      // Clean up
      await this.deleteFromSessionStorage('test-2');

      const allSuccessful = storageOperations
        .filter((op) => op.key !== 'test-1' || op.type !== 'load')
        .every((op) => op.success);
      const integrityPassed = dataIntegrity.every((check) => check.passed);
      const isolationMaintained = !loadDeleted.success && loadRemaining.success;
      const duration = Date.now() - startTime;

      return {
        success: allSuccessful && integrityPassed && isolationMaintained,
        message:
          allSuccessful && integrityPassed && isolationMaintained
            ? 'Session storage isolation working correctly'
            : 'Session storage isolation issues detected',
        details: {
          storageOperations,
          dataIntegrity,
          isolationMaintained,
        },
        timestamp: new Date(),
        duration,
        storageOperations,
        dataIntegrity,
        persistenceMetrics: this.calculatePersistenceMetrics(storageOperations),
      };
    } catch (error) {
      return {
        success: false,
        message: `Session storage isolation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}
