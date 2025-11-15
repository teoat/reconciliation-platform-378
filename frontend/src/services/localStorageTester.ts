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

export class LocalStorageTester {
  constructor() {}

  private async saveToLocalStorage(key: string, data: unknown): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      const duration = Date.now() - startTime;
      return {
        type: 'save',
        storage: 'localStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: serializedData.length,
        duration,
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
      if (!serializedData) {
        throw new Error('Data not found');
      }
      const data = JSON.parse(serializedData);
      const duration = Date.now() - startTime;
      return {
        type: 'load',
        storage: 'localStorage',
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
      const duration = Date.now() - startTime;
      return {
        type: 'update',
        storage: 'localStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: serializedData.length,
        duration,
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

  public async testLocalStorageBasic(): Promise<DataPersistenceTestResult> {
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
      const integrityCheck = await this.checkDataIntegrity(testData, loadResult.data);
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
      return {
        success: false,
        message: `Local storage basic test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  public async testLocalStorageLargeData(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const storageOperations: StorageOperation[] = [];
      const dataIntegrity: DataIntegrityCheck[] = [];

      // Generate large test data (1MB)
      const largeData = this.generateLargeTestData(1024 * 1024);

      // Test saving large data
      const saveResult = await this.saveToLocalStorage('large-test-data', largeData);
      storageOperations.push(saveResult);

      if (!saveResult.success) {
        return {
          success: false,
          message: 'Failed to save large data to localStorage',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          storageOperations,
          errors: ['Large data save failed'],
        };
      }

      // Test loading large data
      const loadResult = await this.loadFromLocalStorage('large-test-data');
      storageOperations.push(loadResult);

      // Test data integrity
      const integrityCheck = await this.checkDataIntegrity(largeData, loadResult.data);
      dataIntegrity.push(integrityCheck);

      // Clean up
      await this.deleteFromLocalStorage('large-test-data');

      const allSuccessful = storageOperations.every((op) => op.success);
      const integrityPassed = dataIntegrity.every((check) => check.passed);
      const duration = Date.now() - startTime;

      return {
        success: allSuccessful && integrityPassed,
        message:
          allSuccessful && integrityPassed
            ? 'Local storage large data operations working correctly'
            : 'Local storage large data operations issues detected',
        details: {
          dataSize: saveResult.size,
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
      return {
        success: false,
        message: `Local storage large data test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  public async testLocalStorageQuota(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const storageOperations: StorageOperation[] = [];
      const dataIntegrity: DataIntegrityCheck[] = [];

      // Test quota handling by trying to exceed storage limits
      const testSizes = [1024 * 1024, 5 * 1024 * 1024, 10 * 1024 * 1024]; // 1MB, 5MB, 10MB

      for (let i = 0; i < testSizes.length; i++) {
        const testData = this.generateLargeTestData(testSizes[i]);
        const saveResult = await this.saveToLocalStorage(`quota-test-${i}`, testData);
        storageOperations.push(saveResult);

        if (saveResult.success) {
          // If save succeeded, test loading and integrity
          const loadResult = await this.loadFromLocalStorage(`quota-test-${i}`);
          storageOperations.push(loadResult);

          if (loadResult.success) {
            const integrityCheck = await this.checkDataIntegrity(testData, loadResult.data);
            dataIntegrity.push(integrityCheck);
          }

          // Clean up
          await this.deleteFromLocalStorage(`quota-test-${i}`);
        }
      }

      const duration = Date.now() - startTime;
      const successfulSaves = storageOperations.filter(
        (op) => op.type === 'save' && op.success
      ).length;
      const totalSaves = storageOperations.filter((op) => op.type === 'save').length;

      return {
        success: successfulSaves > 0, // At least some saves should work
        message: `Local storage quota test completed. ${successfulSaves}/${totalSaves} size tests passed.`,
        details: {
          testSizes,
          successfulSaves,
          totalSaves,
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
        message: `Local storage quota test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private generateLargeTestData(sizeInBytes: number): any {
    const numRecords = Math.max(1, Math.floor(sizeInBytes / 100)); // Rough estimate
    const records = [];

    for (let i = 0; i < numRecords; i++) {
      records.push({
        id: i,
        name: `Test Record ${i}`,
        description: `This is a test record with ID ${i} and some additional data to make it larger.`,
        timestamp: new Date().toISOString(),
        data: {
          nested: {
            value: Math.random(),
            array: [1, 2, 3, 4, 5],
            object: { a: 1, b: 2, c: 3 },
          },
        },
      });
    }

    return { records, metadata: { totalRecords: numRecords, generatedAt: new Date() } };
  }
}
