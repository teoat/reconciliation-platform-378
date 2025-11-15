// Refactored comprehensive testing suite for verifying data preservation during network issues
// This replaces the monolithic dataPersistenceTester.ts with modular architecture

import { LocalStorageTester } from './testers/localStorageTester';
import { SessionStorageTester } from './testers/sessionStorageTester';
import { IndexedDBTester } from './testers/indexedDBTester';
import { CacheTester } from './testers/cacheTester';
import type {
  StorageOperation,
  DataIntegrityCheck,
  PersistenceMetrics,
} from './testers/localStorageTester';

export interface DataPersistenceTest {
  id: string;
  name: string;
  description: string;
  testFunction: () => Promise<DataPersistenceTestResult>;
  category: 'local-storage' | 'session-storage' | 'indexeddb' | 'cache-persistence';
  priority: 'high' | 'medium' | 'low';
  requiresStorageSimulation: boolean;
}

export interface DataPersistenceTestResult {
  success: boolean;
  message: string;
  details?: unknown;
  timestamp: Date;
  duration: number;
  errors?: string[];
  storageOperations?: StorageOperation[];
  dataIntegrity?: DataIntegrityCheck[];
  persistenceMetrics?: PersistenceMetrics;
}

// Main orchestrator class - much smaller and focused
export class DataPersistenceTester {
  private tests: Map<string, DataPersistenceTest> = new Map();
  private results: Map<string, DataPersistenceTestResult[]> = new Map();

  // Specialized testers for each storage type
  private localStorageTester = new LocalStorageTester();
  private sessionStorageTester = new SessionStorageTester();
  private indexedDBTester = new IndexedDBTester();
  private cacheTester = new CacheTester();

  constructor() {
    this.initializeTests();
  }

  private initializeTests(): void {
    // Local Storage Tests
    this.addTest({
      id: 'local-storage-basic',
      name: 'Local Storage Basic Operations',
      description: 'Test basic save, load, update, and delete operations in LocalStorage',
      testFunction: () => this.testLocalStorageBasic(),
      category: 'local-storage',
      priority: 'high',
      requiresStorageSimulation: false,
    });

    this.addTest({
      id: 'local-storage-large-data',
      name: 'Local Storage Large Data Handling',
      description: 'Test LocalStorage with large datasets and quota limits',
      testFunction: () => this.testLocalStorageLargeData(),
      category: 'local-storage',
      priority: 'medium',
      requiresStorageSimulation: false,
    });

    this.addTest({
      id: 'local-storage-quota',
      name: 'Local Storage Quota Management',
      description: 'Test LocalStorage quota limits and error handling',
      testFunction: () => this.testLocalStorageQuota(),
      category: 'local-storage',
      priority: 'medium',
      requiresStorageSimulation: false,
    });

    // Session Storage Tests
    this.addTest({
      id: 'session-storage-basic',
      name: 'Session Storage Basic Operations',
      description: 'Test basic operations in SessionStorage',
      testFunction: () => this.testSessionStorageBasic(),
      category: 'session-storage',
      priority: 'high',
      requiresStorageSimulation: false,
    });

    this.addTest({
      id: 'session-storage-persistence',
      name: 'Session Storage Persistence',
      description: 'Test data persistence across page operations',
      testFunction: () => this.testSessionStoragePersistence(),
      category: 'session-storage',
      priority: 'medium',
      requiresStorageSimulation: true,
    });

    this.addTest({
      id: 'session-storage-isolation',
      name: 'Session Storage Isolation',
      description: 'Test tab/window isolation in SessionStorage',
      testFunction: () => this.testSessionStorageIsolation(),
      category: 'session-storage',
      priority: 'low',
      requiresStorageSimulation: false,
    });

    // IndexedDB Tests
    this.addTest({
      id: 'indexeddb-basic',
      name: 'IndexedDB Basic Operations',
      description: 'Test basic CRUD operations in IndexedDB',
      testFunction: () => this.testIndexedDBBasic(),
      category: 'indexeddb',
      priority: 'high',
      requiresStorageSimulation: false,
    });

    this.addTest({
      id: 'indexeddb-transactions',
      name: 'IndexedDB Transaction Handling',
      description: 'Test transaction integrity and rollback',
      testFunction: () => this.testIndexedDBTransactions(),
      category: 'indexeddb',
      priority: 'medium',
      requiresStorageSimulation: false,
    });

    this.addTest({
      id: 'indexeddb-large-datasets',
      name: 'IndexedDB Large Dataset Handling',
      description: 'Test IndexedDB with large datasets',
      testFunction: () => this.testIndexedDBLargeDatasets(),
      category: 'indexeddb',
      priority: 'medium',
      requiresStorageSimulation: false,
    });

    // Cache Tests
    this.addTest({
      id: 'cache-persistence-basic',
      name: 'Cache Basic Operations',
      description: 'Test basic cache operations',
      testFunction: () => this.testCachePersistenceBasic(),
      category: 'cache-persistence',
      priority: 'high',
      requiresStorageSimulation: false,
    });

    this.addTest({
      id: 'cache-persistence-strategies',
      name: 'Cache Eviction Strategies',
      description: 'Test different cache eviction strategies',
      testFunction: () => this.testCachePersistenceStrategies(),
      category: 'cache-persistence',
      priority: 'medium',
      requiresStorageSimulation: false,
    });

    this.addTest({
      id: 'cache-persistence-expiration',
      name: 'Cache Expiration Handling',
      description: 'Test cache entry expiration',
      testFunction: () => this.testCachePersistenceExpiration(),
      category: 'cache-persistence',
      priority: 'low',
      requiresStorageSimulation: false,
    });
  }

  private addTest(test: DataPersistenceTest): void {
    this.tests.set(test.id, test);
  }

  private calculatePersistenceMetrics(operations: StorageOperation[]): PersistenceMetrics {
    const totalOperations = operations.length;
    const successfulOperations = operations.filter((op) => op.success).length;
    const failedOperations = totalOperations - successfulOperations;
    const totalDuration = operations.reduce((sum, op) => sum + (op.duration || 0), 0);
    const averageOperationTime = totalOperations > 0 ? totalDuration / totalOperations : 0;
    const totalDataSize = operations.reduce((sum, op) => sum + (op.size || 0), 0);
    const storageUtilization = totalDataSize; // Could be enhanced with actual storage capacity

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      averageOperationTime,
      totalDataSize,
      storageUtilization,
    };
  }

  // Local Storage Test Methods
  private async testLocalStorageBasic(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const result = await this.localStorageTester.testBasicOperations();

      const duration = Date.now() - startTime;
      const metrics = this.calculatePersistenceMetrics(result.operations);

      return {
        success: result.success,
        message: result.success
          ? 'LocalStorage basic operations passed'
          : 'LocalStorage basic operations failed',
        timestamp: new Date(),
        duration,
        storageOperations: result.operations,
        dataIntegrity: result.integrityChecks,
        persistenceMetrics: metrics,
      };
    } catch (error) {
      return {
        success: false,
        message: `LocalStorage basic test failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [String(error)],
      };
    }
  }

  private async testLocalStorageLargeData(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const result = await this.localStorageTester.testLargeData();

      const duration = Date.now() - startTime;
      const metrics = this.calculatePersistenceMetrics(result.operations);

      return {
        success: result.success,
        message: result.success
          ? 'LocalStorage large data test passed'
          : 'LocalStorage large data test failed',
        timestamp: new Date(),
        duration,
        storageOperations: result.operations,
        dataIntegrity: result.integrityChecks,
        persistenceMetrics: metrics,
      };
    } catch (error) {
      return {
        success: false,
        message: `LocalStorage large data test failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [String(error)],
      };
    }
  }

  private async testLocalStorageQuota(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const result = await this.localStorageTester.testQuotaLimits();

      const duration = Date.now() - startTime;
      const metrics = this.calculatePersistenceMetrics(result.operations);

      return {
        success: result.success,
        message: result.success
          ? 'LocalStorage quota test passed'
          : 'LocalStorage quota test failed',
        timestamp: new Date(),
        duration,
        storageOperations: result.operations,
        dataIntegrity: result.integrityChecks,
        persistenceMetrics: metrics,
      };
    } catch (error) {
      return {
        success: false,
        message: `LocalStorage quota test failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [String(error)],
      };
    }
  }

  // Session Storage Test Methods
  private async testSessionStorageBasic(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const result = await this.sessionStorageTester.testBasicOperations();

      const duration = Date.now() - startTime;
      const metrics = this.calculatePersistenceMetrics(result.operations);

      return {
        success: result.success,
        message: result.success
          ? 'SessionStorage basic operations passed'
          : 'SessionStorage basic operations failed',
        timestamp: new Date(),
        duration,
        storageOperations: result.operations,
        dataIntegrity: result.integrityChecks,
        persistenceMetrics: metrics,
      };
    } catch (error) {
      return {
        success: false,
        message: `SessionStorage basic test failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [String(error)],
      };
    }
  }

  private async testSessionStoragePersistence(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const result = await this.sessionStorageTester.testPersistence();

      const duration = Date.now() - startTime;
      const metrics = this.calculatePersistenceMetrics(result.operations);

      return {
        success: result.success,
        message: result.success
          ? 'SessionStorage persistence test passed'
          : 'SessionStorage persistence test failed',
        timestamp: new Date(),
        duration,
        storageOperations: result.operations,
        dataIntegrity: result.integrityChecks,
        persistenceMetrics: metrics,
      };
    } catch (error) {
      return {
        success: false,
        message: `SessionStorage persistence test failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [String(error)],
      };
    }
  }

  private async testSessionStorageIsolation(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const result = await this.sessionStorageTester.testIsolation();

      const duration = Date.now() - startTime;
      const metrics = this.calculatePersistenceMetrics(result.operations);

      return {
        success: result.success,
        message: result.success
          ? 'SessionStorage isolation test passed'
          : 'SessionStorage isolation test failed',
        timestamp: new Date(),
        duration,
        storageOperations: result.operations,
        dataIntegrity: result.integrityChecks,
        persistenceMetrics: metrics,
      };
    } catch (error) {
      return {
        success: false,
        message: `SessionStorage isolation test failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [String(error)],
      };
    }
  }

  // IndexedDB Test Methods
  private async testIndexedDBBasic(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const result = await this.indexedDBTester.testBasicOperations();

      const duration = Date.now() - startTime;
      const metrics = this.calculatePersistenceMetrics(result.operations);

      return {
        success: result.success,
        message: result.success
          ? 'IndexedDB basic operations passed'
          : 'IndexedDB basic operations failed',
        timestamp: new Date(),
        duration,
        storageOperations: result.operations,
        dataIntegrity: result.integrityChecks,
        persistenceMetrics: metrics,
      };
    } catch (error) {
      return {
        success: false,
        message: `IndexedDB basic test failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [String(error)],
      };
    }
  }

  private async testIndexedDBTransactions(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const result = await this.indexedDBTester.testTransactions();

      const duration = Date.now() - startTime;
      const metrics = this.calculatePersistenceMetrics(result.operations);

      return {
        success: result.success,
        message: result.success
          ? 'IndexedDB transactions test passed'
          : 'IndexedDB transactions test failed',
        timestamp: new Date(),
        duration,
        storageOperations: result.operations,
        dataIntegrity: result.integrityChecks,
        persistenceMetrics: metrics,
      };
    } catch (error) {
      return {
        success: false,
        message: `IndexedDB transactions test failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [String(error)],
      };
    }
  }

  private async testIndexedDBLargeDatasets(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const result = await this.indexedDBTester.testLargeDatasets();

      const duration = Date.now() - startTime;
      const metrics = this.calculatePersistenceMetrics(result.operations);

      return {
        success: result.success,
        message: result.success
          ? 'IndexedDB large datasets test passed'
          : 'IndexedDB large datasets test failed',
        timestamp: new Date(),
        duration,
        storageOperations: result.operations,
        dataIntegrity: result.integrityChecks,
        persistenceMetrics: metrics,
      };
    } catch (error) {
      return {
        success: false,
        message: `IndexedDB large datasets test failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [String(error)],
      };
    }
  }

  // Cache Test Methods
  private async testCachePersistenceBasic(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const result = await this.cacheTester.testBasicOperations();

      const duration = Date.now() - startTime;
      const metrics = this.calculatePersistenceMetrics(result.operations);

      return {
        success: result.success,
        message: result.success ? 'Cache basic operations passed' : 'Cache basic operations failed',
        timestamp: new Date(),
        duration,
        storageOperations: result.operations,
        dataIntegrity: result.integrityChecks,
        persistenceMetrics: metrics,
      };
    } catch (error) {
      return {
        success: false,
        message: `Cache basic test failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [String(error)],
      };
    }
  }

  private async testCachePersistenceStrategies(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const result = await this.cacheTester.testStrategies();

      const duration = Date.now() - startTime;
      const metrics = this.calculatePersistenceMetrics(result.operations);

      return {
        success: result.success,
        message: result.success ? 'Cache strategies test passed' : 'Cache strategies test failed',
        timestamp: new Date(),
        duration,
        storageOperations: result.operations,
        dataIntegrity: result.integrityChecks,
        persistenceMetrics: metrics,
      };
    } catch (error) {
      return {
        success: false,
        message: `Cache strategies test failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [String(error)],
      };
    }
  }

  private async testCachePersistenceExpiration(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now();

    try {
      const result = await this.cacheTester.testExpiration();

      const duration = Date.now() - startTime;
      const metrics = this.calculatePersistenceMetrics(result.operations);

      return {
        success: result.success,
        message: result.success ? 'Cache expiration test passed' : 'Cache expiration test failed',
        timestamp: new Date(),
        duration,
        storageOperations: result.operations,
        dataIntegrity: result.integrityChecks,
        persistenceMetrics: metrics,
      };
    } catch (error) {
      return {
        success: false,
        message: `Cache expiration test failed: ${error}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [String(error)],
      };
    }
  }

  // Public API methods
  public async runTest(testId: string): Promise<DataPersistenceTestResult> {
    const _test = this.tests.get(testId);
    if (!_test) {
      return {
        success: false,
        message: `Test ${testId} not found`,
        timestamp: new Date(),
        duration: 0,
        errors: [`Test ${testId} not found`],
      };
    }

    const result = await _test.testFunction();
    this.results.set(testId, [...(this.results.get(testId) || []), result]);

    return result;
  }

  public async runAllTests(): Promise<Map<string, DataPersistenceTestResult>> {
    const results = new Map<string, DataPersistenceTestResult>();

    for (const [testId, _test] of this.tests) {
      const result = await this.runTest(testId);
      results.set(testId, result);
    }

    return results;
  }

  public async runTestsByCategory(
    category: DataPersistenceTest['category']
  ): Promise<Map<string, DataPersistenceTestResult>> {
    const results = new Map<string, DataPersistenceTestResult>();

    for (const [testId, _test] of this.tests) {
      if (_test.category === category) {
        const result = await this.runTest(testId);
        results.set(testId, result);
      }
    }

    return results;
  }

  public getTestResults(
    testId?: string
  ): DataPersistenceTestResult[] | Map<string, DataPersistenceTestResult[]> {
    if (testId) {
      return this.results.get(testId) || [];
    }
    return this.results;
  }

  public getTestSummary(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageDuration: number;
    totalDuration: number;
    categoryBreakdown: Record<string, { total: number; passed: number; failed: number }>;
  } {
    const allResults = Array.from(this.results.values()).flat();
    const totalTests = allResults.length;
    const passedTests = allResults.filter((r) => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = allResults.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalTests > 0 ? totalDuration / totalTests : 0;

    const categoryBreakdown: Record<string, { total: number; passed: number; failed: number }> = {};

    for (const [testId, results] of this.results) {
      const _test = this.tests.get(testId);
      if (!_test) continue;

      const category = _test.category;
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { total: 0, passed: 0, failed: 0 };
      }

      const latestResult = results[results.length - 1];
      categoryBreakdown[category].total++;
      if (latestResult.success) {
        categoryBreakdown[category].passed++;
      } else {
        categoryBreakdown[category].failed++;
      }
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      averageDuration,
      totalDuration,
      categoryBreakdown,
    };
  }

  public clearResults(): void {
    this.results.clear();
  }

  public getAvailableTests(): DataPersistenceTest[] {
    return Array.from(this.tests.values());
  }
}
