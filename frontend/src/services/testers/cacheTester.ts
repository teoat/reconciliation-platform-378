// Cache testing module for data persistence verification

// Define types locally since localStorageTester doesn't exist
type StorageOperation = {
  operation: 'read' | 'write' | 'delete' | 'clear';
  key?: string;
  value?: unknown;
  timestamp: number;
  duration: number;
  success: boolean;
  error?: string;
};

type DataIntegrityCheck = {
  type: string;
  dataKey: string;
  passed: boolean;
  timestamp: number;
  details?: Record<string, unknown>;
};

interface CacheEntry {
  data: unknown;
  timestamp: number;
  expiration?: number;
  strategy?: string;
}

export class CacheTester {
  private cache = new Map<string, CacheEntry>();

  private async saveToCache(key: string, data: unknown): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
      });

      return {
        type: 'save',
        storage: 'cache',
        key,
        success: true,
        timestamp: Date.now(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        type: 'save',
        storage: 'cache',
        key,
        success: false,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    }
  }

  private async loadFromCache(key: string): Promise<StorageOperation & { data: unknown }> {
    const startTime = Date.now();
    try {
      const entry = this.cache.get(key);

      if (!entry) {
        return {
          type: 'load',
          storage: 'cache',
          key,
          success: false,
          timestamp: Date.now(),
          duration: Date.now() - startTime,
          data: null,
        };
      }

      // Check expiration
      if (entry.expiration && Date.now() > entry.expiration) {
        this.cache.delete(key);
        return {
          type: 'load',
          storage: 'cache',
          key,
          success: false,
          timestamp: Date.now(),
          duration: Date.now() - startTime,
          data: null,
        };
      }

      return {
        type: 'load',
        storage: 'cache',
        key,
        success: true,
        timestamp: Date.now(),
        size: JSON.stringify(entry.data).length,
        duration: Date.now() - startTime,
        data: entry.data,
      };
    } catch (error) {
      return {
        type: 'load',
        storage: 'cache',
        key,
        success: false,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        data: null,
      };
    }
  }

  private async updateInCache(key: string, data: unknown): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      const existingEntry = this.cache.get(key);
      if (!existingEntry) {
        return {
          type: 'update',
          storage: 'cache',
          key,
          success: false,
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        };
      }

      this.cache.set(key, {
        ...existingEntry,
        data,
        timestamp: Date.now(),
      });

      return {
        type: 'update',
        storage: 'cache',
        key,
        success: true,
        timestamp: Date.now(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        type: 'update',
        storage: 'cache',
        key,
        success: false,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    }
  }

  private async deleteFromCache(key: string): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      const deleted = this.cache.delete(key);

      return {
        type: 'delete',
        storage: 'cache',
        key,
        success: deleted,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        type: 'delete',
        storage: 'cache',
        key,
        success: false,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    }
  }

  private async saveToCacheWithStrategy(
    key: string,
    data: unknown,
    strategy: string
  ): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        strategy,
      };

      // Apply strategy-specific logic
      if (strategy === 'lru') {
        // Simple LRU: just timestamp for now
        entry.timestamp = Date.now();
      } else if (strategy === 'lfu') {
        // Simple LFU: could track access count
        interface CacheEntryWithAccessCount extends CacheEntry {
          accessCount?: number;
        }
        (entry as CacheEntryWithAccessCount).accessCount = 1;
      }

      this.cache.set(key, entry);

      return {
        type: 'save',
        storage: 'cache',
        key,
        success: true,
        timestamp: Date.now(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        type: 'save',
        storage: 'cache',
        key,
        success: false,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    }
  }

  private async loadFromCacheWithStrategy(
    key: string,
    strategy: string
  ): Promise<StorageOperation & { data: unknown }> {
    const startTime = Date.now();
    try {
      const entry = this.cache.get(key);

      if (!entry) {
        return {
          type: 'load',
          storage: 'cache',
          key,
          success: false,
          timestamp: Date.now(),
          duration: Date.now() - startTime,
          data: null,
        };
      }

      // Apply strategy-specific logic
      interface CacheEntryWithAccessCount extends CacheEntry {
        accessCount?: number;
      }
      if (strategy === 'lfu' && (entry as CacheEntryWithAccessCount).accessCount !== undefined) {
        (entry as CacheEntryWithAccessCount).accessCount++;
      }

      return {
        type: 'load',
        storage: 'cache',
        key,
        success: true,
        timestamp: Date.now(),
        size: JSON.stringify(entry.data).length,
        duration: Date.now() - startTime,
        data: entry.data,
      };
    } catch (error) {
      return {
        type: 'load',
        storage: 'cache',
        key,
        success: false,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        data: null,
      };
    }
  }

  private async saveToCacheWithExpiration(
    key: string,
    data: unknown,
    expirationTime: number
  ): Promise<StorageOperation> {
    const startTime = Date.now();
    try {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiration: Date.now() + expirationTime,
      });

      return {
        type: 'save',
        storage: 'cache',
        key,
        success: true,
        timestamp: Date.now(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        type: 'save',
        storage: 'cache',
        key,
        success: false,
        timestamp: Date.now(),
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
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        type: 'checksum',
        passed: false,
        details: `Integrity check failed: ${error}`,
        timestamp: Date.now(),
      };
    }
  }

  private async checkCacheExpiration(
    _beforeData: unknown,
    afterData: unknown
  ): Promise<DataIntegrityCheck> {
    try {
      // If afterData is null/undefined, expiration worked
      const expired = afterData === null || afterData === undefined;

      return {
        type: 'validation',
        passed: expired,
        details: expired ? 'Cache expiration working correctly' : 'Cache expiration failed',
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        type: 'validation',
        passed: false,
        details: `Expiration check failed: ${error}`,
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
    const testData = { id: 1, name: 'cache_test', cached: true, timestamp: new Date() };
    const saveOp = await this.saveToCache('cache_basic', testData);
    operations.push(saveOp);

    if (saveOp.success) {
      const loadOp = await this.loadFromCache('cache_basic');
      operations.push(loadOp);

      if (loadOp.success && loadOp.data) {
        const integrityCheck = await this.checkDataIntegrity(testData, loadOp.data);
        integrityChecks.push(integrityCheck);
      }
    }

    // Test update
    const updatedData = { ...testData, updated: true };
    const updateOp = await this.updateInCache('cache_basic', updatedData);
    operations.push(updateOp);

    // Test delete
    const deleteOp = await this.deleteFromCache('cache_basic');
    operations.push(deleteOp);

    const success =
      operations.every((op) => op.success) && integrityChecks.every((check) => check.passed);

    return { success, operations, integrityChecks };
  }

  async testStrategies(): Promise<{
    success: boolean;
    operations: StorageOperation[];
    integrityChecks: DataIntegrityCheck[];
  }> {
    const operations: StorageOperation[] = [];
    const integrityChecks: DataIntegrityCheck[] = [];

    const testData = { id: 2, name: 'strategy_test', strategy: 'lru' };

    // Test LRU strategy
    const saveOp = await this.saveToCacheWithStrategy('cache_lru', testData, 'lru');
    operations.push(saveOp);

    if (saveOp.success) {
      const loadOp = await this.loadFromCacheWithStrategy('cache_lru', 'lru');
      operations.push(loadOp);

      if (loadOp.success && loadOp.data) {
        const integrityCheck = await this.checkDataIntegrity(testData, loadOp.data);
        integrityChecks.push(integrityCheck);
      }
    }

    // Test LFU strategy
    const lfuData = { id: 3, name: 'lfu_test', strategy: 'lfu' };
    const saveLfuOp = await this.saveToCacheWithStrategy('cache_lfu', lfuData, 'lfu');
    operations.push(saveLfuOp);

    if (saveLfuOp.success) {
      const loadLfuOp = await this.loadFromCacheWithStrategy('cache_lfu', 'lfu');
      operations.push(loadLfuOp);

      if (loadLfuOp.success && loadLfuOp.data) {
        const integrityCheck = await this.checkDataIntegrity(lfuData, loadLfuOp.data);
        integrityChecks.push(integrityCheck);
      }
    }

    // Cleanup
    await this.deleteFromCache('cache_lru');
    await this.deleteFromCache('cache_lfu');

    const success =
      operations.every((op) => op.success) && integrityChecks.every((check) => check.passed);

    return { success, operations, integrityChecks };
  }

  async testExpiration(): Promise<{
    success: boolean;
    operations: StorageOperation[];
    integrityChecks: DataIntegrityCheck[];
  }> {
    const operations: StorageOperation[] = [];
    const integrityChecks: DataIntegrityCheck[] = [];

    const testData = { id: 4, name: 'expiration_test', expires: true };

    // Test with short expiration (1 second)
    const saveOp = await this.saveToCacheWithExpiration('cache_expires', testData, 1000);
    operations.push(saveOp);

    if (saveOp.success) {
      // Load immediately (should work)
      const loadBeforeOp = await this.loadFromCache('cache_expires');
      operations.push(loadBeforeOp);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Load after expiration (should fail)
      const loadAfterOp = await this.loadFromCache('cache_expires');
      operations.push(loadAfterOp);

      const expirationCheck = await this.checkCacheExpiration(loadBeforeOp.data, loadAfterOp.data);
      integrityChecks.push(expirationCheck);
    }

    const success =
      operations
        .filter((op) => op.type !== 'load' || op.key !== 'cache_expires')
        .every((op) => op.success) && integrityChecks.every((check) => check.passed);

    return { success, operations, integrityChecks };
  }
}
