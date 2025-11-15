// Local Storage testing module for data persistence verification

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
  details: unknown;
  timestamp: Date;
}

export interface PersistenceMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageOperationTime: number;
  totalDataSize: number;
  storageUtilization: number;
}

export class LocalStorageTester {
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
      if (serializedData === null) {
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
      const data = JSON.parse(serializedData);
      return {
        type: 'load',
        storage: 'localStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: serializedData.length,
        duration: Date.now() - startTime,
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
      const existingData = localStorage.getItem(key);
      if (existingData === null) {
        return {
          type: 'update',
          storage: 'localStorage',
          key,
          success: false,
          timestamp: new Date(),
          duration: Date.now() - startTime,
        };
      }
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

  private generateLargeTestData(sizeInBytes: number): unknown {
    const targetSize = Math.max(sizeInBytes, 1000); // Minimum 1KB
    const data: Record<string, unknown> = {};
    let currentSize = 2; // For braces

    while (currentSize < targetSize) {
      const key = `field_${Object.keys(data).length}`;
      const value = 'x'.repeat(Math.min(1000, targetSize - currentSize - key.length - 5));
      data[key] = value;
      currentSize += key.length + value.length + 5; // key + quotes + colon + comma + quotes
    }

    return data;
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
        type: 'checksum',
        passed,
        details: passed
          ? 'Data integrity verified'
          : `Data mismatch: original ${originalStr.length} chars, retrieved ${retrievedStr.length} chars`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        type: 'checksum',
        passed: false,
        details: `Integrity check failed: ${error}`,
        timestamp: new Date(),
      };
    }
  }

  private async checkLocalStorageQuota(): Promise<DataIntegrityCheck> {
    try {
      let testSize = 1024 * 1024; // Start with 1MB
      let success = true;

      while (success && testSize < 100 * 1024 * 1024) {
        // Up to 100MB
        try {
          const testData = 'x'.repeat(testSize);
          localStorage.setItem('__quota_test__', testData);
          localStorage.removeItem('__quota_test__');
          testSize *= 2;
        } catch {
          success = false;
        }
      }

      const maxSize = testSize / 2;
      return {
        type: 'validation',
        passed: maxSize > 1024 * 1024, // At least 1MB available
        details: `LocalStorage quota: ~${Math.round(maxSize / (1024 * 1024))}MB`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        type: 'validation',
        passed: false,
        details: `Quota check failed: ${error}`,
        timestamp: new Date(),
      };
    }
  }

  async testBasicOperations(): Promise<{
    success: boolean;
    operations: StorageOperation[];
    integrityChecks: DataIntegrityCheck[];
  }> {
    const operations: StorageOperation[] = [];
    const integrityChecks: DataIntegrityCheck[] = [];

    // Test basic save/load
    const testData = { id: 1, name: 'test', timestamp: new Date() };
    const saveOp = await this.saveToLocalStorage('test_basic', testData);
    operations.push(saveOp);

    if (saveOp.success) {
      const loadOp = await this.loadFromLocalStorage('test_basic');
      operations.push(loadOp);

      if (loadOp.success) {
        const integrityCheck = await this.checkDataIntegrity(testData, loadOp.data);
        integrityChecks.push(integrityCheck);
      }
    }

    // Test update
    const updatedData = { ...testData, updated: true };
    const updateOp = await this.updateInLocalStorage('test_basic', updatedData);
    operations.push(updateOp);

    // Test delete
    const deleteOp = await this.deleteFromLocalStorage('test_basic');
    operations.push(deleteOp);

    const success =
      operations.every((op) => op.success) && integrityChecks.every((check) => check.passed);

    return { success, operations, integrityChecks };
  }

  async testLargeData(): Promise<{
    success: boolean;
    operations: StorageOperation[];
    integrityChecks: DataIntegrityCheck[];
  }> {
    const operations: StorageOperation[] = [];
    const integrityChecks: DataIntegrityCheck[] = [];

    const largeData = this.generateLargeTestData(1024 * 1024); // 1MB
    const saveOp = await this.saveToLocalStorage('test_large', largeData);
    operations.push(saveOp);

    if (saveOp.success) {
      const loadOp = await this.loadFromLocalStorage('test_large');
      operations.push(loadOp);

      if (loadOp.success) {
        const integrityCheck = await this.checkDataIntegrity(largeData, loadOp.data);
        integrityChecks.push(integrityCheck);
      }
    }

    const deleteOp = await this.deleteFromLocalStorage('test_large');
    operations.push(deleteOp);

    const success =
      operations.every((op) => op.success) && integrityChecks.every((check) => check.passed);

    return { success, operations, integrityChecks };
  }

  async testQuotaLimits(): Promise<{
    success: boolean;
    operations: StorageOperation[];
    integrityChecks: DataIntegrityCheck[];
  }> {
    const operations: StorageOperation[] = [];
    const integrityChecks: DataIntegrityCheck[] = [];

    const quotaCheck = await this.checkLocalStorageQuota();
    integrityChecks.push(quotaCheck);

    // Test quota exceeded handling
    let testSize = 50 * 1024 * 1024; // 50MB
    let quotaExceeded = false;

    try {
      const largeData = 'x'.repeat(testSize);
      localStorage.setItem('__quota_test__', largeData);
      localStorage.removeItem('__quota_test__');
    } catch {
      quotaExceeded = true;
    }

    const success = quotaCheck.passed && !quotaExceeded;
    return { success, operations, integrityChecks };
  }
}
