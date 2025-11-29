// ============================================================================
// UNIFIED STORAGE TESTER - SINGLE SOURCE OF TRUTH
// ============================================================================
// Consolidates localStorageTester, sessionStorageTester, and testers/localStorageTester
// Provides comprehensive storage testing for localStorage, sessionStorage, and IndexedDB
// ============================================================================

export interface StorageOperation {
  type: 'save' | 'load' | 'delete' | 'update' | 'clear';
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'cache';
  key: string;
  success: boolean;
  timestamp: Date;
  size?: number;
  duration?: number;
  error?: string;
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
  storageUtilization?: number;
}

export interface StorageTestResult {
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

export type StorageType = 'localStorage' | 'sessionStorage' | 'indexedDB';

/**
 * Unified Storage Tester
 * Consolidates all storage testing functionality
 */
export class UnifiedStorageTester {
  private static instance: UnifiedStorageTester;
  private metrics: PersistenceMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageOperationTime: 0,
    totalDataSize: 0,
  };

  public static getInstance(): UnifiedStorageTester {
    if (!UnifiedStorageTester.instance) {
      UnifiedStorageTester.instance = new UnifiedStorageTester();
    }
    return UnifiedStorageTester.instance;
  }

  /**
   * Test localStorage operations
   */
  async testLocalStorage(): Promise<StorageTestResult> {
    return this.testStorage('localStorage');
  }

  /**
   * Test sessionStorage operations
   */
  async testSessionStorage(): Promise<StorageTestResult> {
    return this.testStorage('sessionStorage');
  }

  /**
   * Test IndexedDB operations (if available)
   */
  async testIndexedDB(): Promise<StorageTestResult> {
    return this.testStorage('indexedDB');
  }

  /**
   * Test all storage types
   */
  async testAllStorages(): Promise<Record<StorageType, StorageTestResult>> {
    const results: Record<string, StorageTestResult> = {};

    results.localStorage = await this.testLocalStorage();
    results.sessionStorage = await this.testSessionStorage();

    if (this.isIndexedDBAvailable()) {
      results.indexedDB = await this.testIndexedDB();
    }

    return results as Record<StorageType, StorageTestResult>;
  }

  /**
   * Core storage testing logic
   */
  private async testStorage(storageType: StorageType): Promise<StorageTestResult> {
    const startTime = Date.now();
    const operations: StorageOperation[] = [];
    const errors: string[] = [];
    const testKey = `test_${storageType}_${Date.now()}`;
    const testData = { test: true, timestamp: Date.now(), data: 'test data' };

    try {
      // Test save
      const saveOp = await this.saveToStorage(storageType, testKey, testData);
      operations.push(saveOp);
      if (!saveOp.success) errors.push(`Save failed: ${saveOp.error}`);

      // Test load
      const loadOp = await this.loadFromStorage(storageType, testKey);
      operations.push(loadOp);
      if (!loadOp.success) errors.push(`Load failed: ${loadOp.error}`);

      // Test update
      const updatedData = { ...testData, updated: true };
      const updateOp = await this.saveToStorage(storageType, testKey, updatedData);
      operations.push(updateOp);
      if (!updateOp.success) errors.push(`Update failed: ${updateOp.error}`);

      // Test delete
      const deleteOp = await this.deleteFromStorage(storageType, testKey);
      operations.push(deleteOp);
      if (!deleteOp.success) errors.push(`Delete failed: ${deleteOp.error}`);

      // Verify deletion
      const verifyOp = await this.loadFromStorage(storageType, testKey);
      operations.push(verifyOp);
      if (verifyOp.success) {
        errors.push('Data still exists after deletion');
      }

      // Calculate metrics
      const successfulOps = operations.filter((op) => op.success);
      const failedOps = operations.filter((op) => !op.success);
      const totalTime = operations.reduce((sum, op) => sum + (op.duration || 0), 0);
      const avgTime = operations.length > 0 ? totalTime / operations.length : 0;
      const totalSize = operations.reduce((sum, op) => sum + (op.size || 0), 0);

      this.updateMetrics(successfulOps.length, failedOps.length, avgTime, totalSize);

      const duration = Date.now() - startTime;
      const success = errors.length === 0;

      return {
        success,
        message: success
          ? `All ${storageType} operations completed successfully`
          : `${errors.length} error(s) occurred during ${storageType} testing`,
        timestamp: new Date(),
        duration,
        errors: errors.length > 0 ? errors : undefined,
        storageOperations: operations,
        persistenceMetrics: {
          totalOperations: operations.length,
          successfulOperations: successfulOps.length,
          failedOperations: failedOps.length,
          averageOperationTime: avgTime,
          totalDataSize: totalSize,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        message: `Storage test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        storageOperations: operations,
      };
    }
  }

  /**
   * Save data to storage
   */
  private async saveToStorage(
    storageType: StorageType,
    key: string,
    data: unknown
  ): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      const serialized = JSON.stringify(data);
      const size = serialized.length;

      if (storageType === 'localStorage') {
        localStorage.setItem(key, serialized);
      } else if (storageType === 'sessionStorage') {
        sessionStorage.setItem(key, serialized);
      } else if (storageType === 'indexedDB') {
        if (!this.isIndexedDBAvailable()) {
          throw new Error('IndexedDB is not available in this environment');
        }
        await this.saveToIndexedDB(key, serialized);
      } else {
        throw new Error(`Unsupported storage type: ${storageType}`);
      }

      const duration = Date.now() - startTime;
      this.metrics.totalOperations++;
      this.metrics.successfulOperations++;
      this.metrics.totalDataSize += size;

      return {
        type: 'save',
        storage: storageType,
        key,
        success: true,
        timestamp: new Date(),
        size,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.totalOperations++;
      this.metrics.failedOperations++;

      return {
        type: 'save',
        storage: storageType,
        key,
        success: false,
        timestamp: new Date(),
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Load data from storage
   */
  private async loadFromStorage(storageType: StorageType, key: string): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      let data: string | null = null;

      if (storageType === 'localStorage') {
        data = localStorage.getItem(key);
      } else if (storageType === 'sessionStorage') {
        data = sessionStorage.getItem(key);
      } else if (storageType === 'indexedDB') {
        if (!this.isIndexedDBAvailable()) {
          throw new Error('IndexedDB is not available in this environment');
        }
        data = await this.loadFromIndexedDB(key);
      } else {
        throw new Error(`Unsupported storage type: ${storageType}`);
      }

      const duration = Date.now() - startTime;
      this.metrics.totalOperations++;

      if (data === null) {
        this.metrics.failedOperations++;
        return {
          type: 'load',
          storage: storageType,
          key,
          success: false,
          timestamp: new Date(),
          duration,
          error: 'Key not found',
        };
      }

      this.metrics.successfulOperations++;
      const size = data.length;

      return {
        type: 'load',
        storage: storageType,
        key,
        success: true,
        timestamp: new Date(),
        size,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.totalOperations++;
      this.metrics.failedOperations++;

      return {
        type: 'load',
        storage: storageType,
        key,
        success: false,
        timestamp: new Date(),
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete data from storage
   */
  private async deleteFromStorage(
    storageType: StorageType,
    key: string
  ): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      if (storageType === 'localStorage') {
        localStorage.removeItem(key);
      } else if (storageType === 'sessionStorage') {
        sessionStorage.removeItem(key);
      } else if (storageType === 'indexedDB') {
        if (!this.isIndexedDBAvailable()) {
          throw new Error('IndexedDB is not available in this environment');
        }
        await this.deleteFromIndexedDB(key);
      } else {
        throw new Error(`Unsupported storage type: ${storageType}`);
      }

      const duration = Date.now() - startTime;
      this.metrics.totalOperations++;
      this.metrics.successfulOperations++;

      return {
        type: 'delete',
        storage: storageType,
        key,
        success: true,
        timestamp: new Date(),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.totalOperations++;
      this.metrics.failedOperations++;

      return {
        type: 'delete',
        storage: storageType,
        key,
        success: false,
        timestamp: new Date(),
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if IndexedDB is available
   */
  private isIndexedDBAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  /**
   * Save data to IndexedDB
   */
  private async saveToIndexedDB(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('UnifiedStorageTester', 1);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['storage'], 'readwrite');
        const store = transaction.objectStore('storage');
        const putRequest = store.put({ key, value });

        putRequest.onerror = () => reject(new Error('Failed to save to IndexedDB'));
        putRequest.onsuccess = () => resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('storage')) {
          db.createObjectStore('storage', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Load data from IndexedDB
   */
  private async loadFromIndexedDB(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('UnifiedStorageTester', 1);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['storage'], 'readonly');
        const store = transaction.objectStore('storage');
        const getRequest = store.get(key);

        getRequest.onerror = () => reject(new Error('Failed to load from IndexedDB'));
        getRequest.onsuccess = () => {
          const result = getRequest.result;
          resolve(result ? result.value : null);
        };
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('storage')) {
          db.createObjectStore('storage', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Delete data from IndexedDB
   */
  private async deleteFromIndexedDB(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('UnifiedStorageTester', 1);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['storage'], 'readwrite');
        const store = transaction.objectStore('storage');
        const deleteRequest = store.delete(key);

        deleteRequest.onerror = () => reject(new Error('Failed to delete from IndexedDB'));
        deleteRequest.onsuccess = () => resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('storage')) {
          db.createObjectStore('storage', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Update metrics
   */
  private updateMetrics(
    successful: number,
    failed: number,
    avgTime: number,
    _totalSize: number
  ): void {
    const total = this.metrics.totalOperations;
    if (total > 0) {
      this.metrics.averageOperationTime =
        (this.metrics.averageOperationTime * (total - successful - failed) +
          avgTime * (successful + failed)) /
        total;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PersistenceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageOperationTime: 0,
      totalDataSize: 0,
    };
  }
}

// Export singleton instance
export const unifiedStorageTester = UnifiedStorageTester.getInstance();

// Export for backward compatibility
export const localStorageTester = unifiedStorageTester;
export const sessionStorageTester = unifiedStorageTester;

export default unifiedStorageTester;
