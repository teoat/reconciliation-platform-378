// IndexedDB testing module for data persistence verification

// Define types locally since localStorageTester doesn't exist
type StorageOperation = {
  operation: 'read' | 'write' | 'delete' | 'clear';
  key?: string;
  value?: unknown;
  timestamp: number;
  success?: boolean;
  error?: string;
  data?: unknown;
  duration?: number;
  size?: number;
};

type DataIntegrityCheck = {
  key: string;
  expectedValue: unknown;
  actualValue: unknown;
  passed: boolean;
  timestamp: number;
};

export class IndexedDBTester {
  private dbName = 'DataPersistenceTestDB';
  private dbVersion = 1;

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('testStore')) {
          db.createObjectStore('testStore', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('largeStore')) {
          db.createObjectStore('largeStore', { keyPath: 'id' });
        }
      };
    });
  }

  private async saveToIndexedDB(storeName: string, data: unknown): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      const db = await this.openDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const request = store.add(data);
      await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();

      return {
        operation: 'write',
        key: storeName,
        success: true,
        timestamp: Date.now(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        operation: 'write',
        key: storeName,
        success: false,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    }
  }

  private async loadFromIndexedDB(
    storeName: string,
    id: number
  ): Promise<StorageOperation & { data: unknown }> {
    const startTime = Date.now();
    try {
      const db = await this.openDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      const request = store.get(id);
      const data = await new Promise<unknown>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      db.close();

      return {
        operation: 'read',
        key: `${storeName}:${id}`,
        success: data !== undefined,
        timestamp: Date.now(),
        size: data ? JSON.stringify(data).length : 0,
        duration: Date.now() - startTime,
        data: data || null,
      };
    } catch (error) {
      return {
        operation: 'read',
        key: `${storeName}:${id}`,
        success: false,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        data: null,
      };
    }
  }

  private async updateInIndexedDB(storeName: string, data: unknown): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      const db = await this.openDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const request = store.put(data);
      await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();

      return {
        operation: 'write',
        key: storeName,
        success: true,
        timestamp: Date.now(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        operation: 'write',
        key: storeName,
        success: false,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    }
  }

  private async deleteFromIndexedDB(storeName: string, id: number): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      const db = await this.openDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const request = store.delete(id);
      await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();

      return {
        operation: 'delete',
        key: `${storeName}:${id}`,
        success: true,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        operation: 'delete',
        key: `${storeName}:${id}`,
        success: false,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    }
  }

  private generateLargeDataset(numRecords: number): unknown[] {
    const dataset: unknown[] = [];
    for (let i = 0; i < numRecords; i++) {
      dataset.push({
        id: i,
        name: `record_${i}`,
        data: `x`.repeat(1000), // 1KB per record
        timestamp: Date.now(),
        metadata: {
          created: new Date(),
          version: 1,
          tags: ['test', 'large', 'dataset'],
        },
      });
    }
    return dataset;
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
        key: 'checksum',
        expectedValue: originalStr,
        actualValue: retrievedStr,
        passed,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        key: 'checksum',
        expectedValue: null,
        actualValue: null,
        passed: false,
        timestamp: Date.now(),
      };
    }
  }

  private async checkTransactionIntegrity(
    originalData: unknown[],
    retrievedData: unknown[]
  ): Promise<DataIntegrityCheck> {
    try {
      if (originalData.length !== retrievedData.length) {
        return {
          key: 'consistency',
          expectedValue: originalData.length,
          actualValue: retrievedData.length,
          passed: false,
          timestamp: Date.now(),
        };
      }

      let passed = true;
      for (let i = 0; i < originalData.length; i++) {
        const originalStr = JSON.stringify(originalData[i]);
        const retrievedStr = JSON.stringify(retrievedData[i]);
        if (originalStr !== retrievedStr) {
          passed = false;
          break;
        }
      }

      return {
        key: 'consistency',
        expectedValue: originalData,
        actualValue: retrievedData,
        passed,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        key: 'consistency',
        expectedValue: null,
        actualValue: null,
        passed: false,
        timestamp: Date.now(),
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
    const testData = { id: 1, name: 'idb_test', data: 'test content', timestamp: Date.now() };
    const saveOp = await this.saveToIndexedDB('testStore', testData);
    operations.push(saveOp);

    if ((saveOp as { success?: boolean }).success) {
      const loadOp = await this.loadFromIndexedDB('testStore', 1);
      operations.push(loadOp);

      if ((loadOp as { success?: boolean; data?: unknown }).success && (loadOp as { data?: unknown }).data) {
        const integrityCheck = await this.checkDataIntegrity(testData, loadOp.data);
        integrityChecks.push(integrityCheck);
      }
    }

    // Test update
    const updatedData = { ...testData, updated: true };
    const updateOp = await this.updateInIndexedDB('testStore', updatedData);
    operations.push(updateOp);

    // Test delete
    const deleteOp = await this.deleteFromIndexedDB('testStore', 1);
    operations.push(deleteOp);

    const success =
      operations.every((op) => op.success) && integrityChecks.every((check) => check.passed);

    return { success, operations, integrityChecks };
  }

  async testTransactions(): Promise<{
    success: boolean;
    operations: StorageOperation[];
    integrityChecks: DataIntegrityCheck[];
  }> {
    const operations: StorageOperation[] = [];
    const integrityChecks: DataIntegrityCheck[] = [];

    // Test transaction with multiple records
    const transactionData = [
      { name: 'transaction_test_1', data: 'content_1' },
      { name: 'transaction_test_2', data: 'content_2' },
      { name: 'transaction_test_3', data: 'content_3' },
    ];

    // Save transaction data
    for (const data of transactionData) {
      const saveOp = await this.saveToIndexedDB('testStore', data);
      operations.push(saveOp);
      if (!(saveOp as { success?: boolean }).success) break;
    }

    if (operations.every((op) => op.success)) {
      // Load and verify transaction data
      const retrievedData: unknown[] = [];
      for (let i = 1; i <= transactionData.length; i++) {
        const loadOp = await this.loadFromIndexedDB('testStore', i);
        operations.push(loadOp);
        if ((loadOp as { success?: boolean; data?: unknown }).success && (loadOp as { data?: unknown }).data) {
          retrievedData.push(loadOp.data);
        }
      }

      const integrityCheck = await this.checkTransactionIntegrity(transactionData, retrievedData);
      integrityChecks.push(integrityCheck);
    }

    // Cleanup
    for (let i = 1; i <= transactionData.length; i++) {
      await this.deleteFromIndexedDB('testStore', i);
    }

    const success =
      operations.every((op) => op.success) && integrityChecks.every((check) => check.passed);

    return { success, operations, integrityChecks };
  }

  async testLargeDatasets(): Promise<{
    success: boolean;
    operations: StorageOperation[];
    integrityChecks: DataIntegrityCheck[];
  }> {
    const operations: StorageOperation[] = [];
    const integrityChecks: DataIntegrityCheck[] = [];

    const largeDataset = this.generateLargeDataset(100); // 100 records

    // Save large dataset
    for (const data of largeDataset) {
      const saveOp = await this.saveToIndexedDB('largeStore', data);
      operations.push(saveOp);
      if (!(saveOp as { success?: boolean }).success) break;
    }

    if (operations.every((op) => op.success)) {
      // Load and verify large dataset
      const retrievedData: unknown[] = [];
      for (let i = 1; i <= largeDataset.length; i++) {
        const loadOp = await this.loadFromIndexedDB('largeStore', i);
        operations.push(loadOp);
        if ((loadOp as { success?: boolean; data?: unknown }).success && (loadOp as { data?: unknown }).data) {
          retrievedData.push(loadOp.data);
        }
      }

      const integrityCheck = await this.checkTransactionIntegrity(largeDataset, retrievedData);
      integrityChecks.push(integrityCheck);
    }

    // Cleanup
    for (let i = 1; i <= largeDataset.length; i++) {
      await this.deleteFromIndexedDB('largeStore', i);
    }

    const success =
      operations.every((op) => op.success) && integrityChecks.every((check) => check.passed);

    return { success, operations, integrityChecks };
  }
}
