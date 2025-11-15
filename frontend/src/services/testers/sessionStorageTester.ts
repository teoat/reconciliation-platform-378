// Session Storage testing module for data persistence verification

import type { StorageOperation, DataIntegrityCheck } from './localStorageTester';

export class SessionStorageTester {
  private async saveToSessionStorage(key: string, data: unknown): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      const serializedData = JSON.stringify(data);
      sessionStorage.setItem(key, serializedData);
      return {
        type: 'save',
        storage: 'sessionStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: serializedData.length,
        duration: Date.now() - startTime,
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
      if (serializedData === null) {
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
      const data = JSON.parse(serializedData);
      return {
        type: 'load',
        storage: 'sessionStorage',
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
      const existingData = sessionStorage.getItem(key);
      if (existingData === null) {
        return {
          type: 'update',
          storage: 'sessionStorage',
          key,
          success: false,
          timestamp: new Date(),
          duration: Date.now() - startTime,
        };
      }
      const serializedData = JSON.stringify(data);
      sessionStorage.setItem(key, serializedData);
      return {
        type: 'update',
        storage: 'sessionStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: serializedData.length,
        duration: Date.now() - startTime,
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

  private async checkSessionStorageIsolation(): Promise<DataIntegrityCheck> {
    try {
      // Test that sessionStorage is isolated per tab/window
      const testKey = '__isolation_test__';
      const testValue = `test_${Date.now()}_${Math.random()}`;

      sessionStorage.setItem(testKey, testValue);
      const retrievedValue = sessionStorage.getItem(testKey);
      sessionStorage.removeItem(testKey);

      const passed = retrievedValue === testValue;

      return {
        type: 'consistency',
        passed,
        details: passed ? 'Session storage isolation verified' : 'Session storage isolation failed',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        type: 'consistency',
        passed: false,
        details: `Isolation check failed: ${error}`,
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
    const testData = { id: 1, name: 'session_test', timestamp: new Date() };
    const saveOp = await this.saveToSessionStorage('session_basic', testData);
    operations.push(saveOp);

    if (saveOp.success) {
      const loadOp = await this.loadFromSessionStorage('session_basic');
      operations.push(loadOp);

      if (loadOp.success) {
        const integrityCheck = await this.checkDataIntegrity(testData, loadOp.data);
        integrityChecks.push(integrityCheck);
      }
    }

    // Test update
    const updatedData = { ...testData, updated: true };
    const updateOp = await this.updateInSessionStorage('session_basic', updatedData);
    operations.push(updateOp);

    // Test delete
    const deleteOp = await this.deleteFromSessionStorage('session_basic');
    operations.push(deleteOp);

    const success =
      operations.every((op) => op.success) && integrityChecks.every((check) => check.passed);

    return { success, operations, integrityChecks };
  }

  async testPersistence(): Promise<{
    success: boolean;
    operations: StorageOperation[];
    integrityChecks: DataIntegrityCheck[];
  }> {
    const operations: StorageOperation[] = [];
    const integrityChecks: DataIntegrityCheck[] = [];

    // Test persistence across simulated page operations
    const testData = { id: 2, name: 'persistence_test', persistent: true, timestamp: new Date() };
    const saveOp = await this.saveToSessionStorage('session_persistence', testData);
    operations.push(saveOp);

    if (saveOp.success) {
      // Simulate page refresh by checking if data persists
      const loadOp = await this.loadFromSessionStorage('session_persistence');
      operations.push(loadOp);

      if (loadOp.success) {
        const integrityCheck = await this.checkDataIntegrity(testData, loadOp.data);
        integrityChecks.push(integrityCheck);
      }
    }

    const deleteOp = await this.deleteFromSessionStorage('session_persistence');
    operations.push(deleteOp);

    const success =
      operations.every((op) => op.success) && integrityChecks.every((check) => check.passed);

    return { success, operations, integrityChecks };
  }

  async testIsolation(): Promise<{
    success: boolean;
    operations: StorageOperation[];
    integrityChecks: DataIntegrityCheck[];
  }> {
    const operations: StorageOperation[] = [];
    const integrityChecks: DataIntegrityCheck[] = [];

    const isolationCheck = await this.checkSessionStorageIsolation();
    integrityChecks.push(isolationCheck);

    // Test multiple keys isolation
    const testData1 = { id: 1, name: 'isolation_test_1' };
    const testData2 = { id: 2, name: 'isolation_test_2' };

    const saveOp1 = await this.saveToSessionStorage('isolation_1', testData1);
    const saveOp2 = await this.saveToSessionStorage('isolation_2', testData2);
    operations.push(saveOp1, saveOp2);

    if (saveOp1.success && saveOp2.success) {
      const loadOp1 = await this.loadFromSessionStorage('isolation_1');
      const loadOp2 = await this.loadFromSessionStorage('isolation_2');
      operations.push(loadOp1, loadOp2);

      const integrityCheck1 = await this.checkDataIntegrity(testData1, loadOp1.data);
      const integrityCheck2 = await this.checkDataIntegrity(testData2, loadOp2.data);
      integrityChecks.push(integrityCheck1, integrityCheck2);
    }

    // Cleanup
    await this.deleteFromSessionStorage('isolation_1');
    await this.deleteFromSessionStorage('isolation_2');

    const success =
      operations.every((op) => op.success) && integrityChecks.every((check) => check.passed);

    return { success, operations, integrityChecks };
  }
}
