// Data Persistence Tester - Refactored
// Main tester class using extracted modules for better organization
// Reduced from 1823 lines to focused core functionality

import {
  DataPersistenceTest,
  DataPersistenceTestResult,
  DataPersistenceConfig,
  TestSuiteResult,
} from './types';
import { TestDefinitions } from './testDefinitions';

export class DataPersistenceTester {
  private tests: Map<string, DataPersistenceTest> = new Map();
  private results: Map<string, DataPersistenceTestResult[]> = new Map();
  private config: DataPersistenceConfig;

  constructor(config: Partial<DataPersistenceConfig> = {}) {
    this.config = {
      testTimeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableLocalStorageTests: true,
      enableSessionStorageTests: true,
      enableIndexedDBTests: false, // Not implemented yet
      enableCachePersistenceTests: false, // Not implemented yet
      maxDataSize: 5 * 1024 * 1024, // 5MB
      ...config,
    };

    this.initializeTests();
  }

  private initializeTests(): void {
    // Load all test definitions
    const allTests = TestDefinitions.getAllTests();

    // Filter tests based on configuration
    const enabledTests = allTests.filter((test) => {
      switch (test.category) {
        case 'local-storage':
          return this.config.enableLocalStorageTests;
        case 'session-storage':
          return this.config.enableSessionStorageTests;
        case 'indexeddb':
          return this.config.enableIndexedDBTests;
        case 'cache-persistence':
          return this.config.enableCachePersistenceTests;
        default:
          return true;
      }
    });

    // Add enabled tests to the map
    enabledTests.forEach((test) => {
      this.tests.set(test.id, test);
    });
  }

  public async runTest(testId: string): Promise<DataPersistenceTestResult> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    try {
      const result = await Promise.race([
        test.testFunction(),
        new Promise<DataPersistenceTestResult>((_, reject) =>
          setTimeout(() => reject(new Error('Test timeout')), this.config.testTimeout)
        ),
      ]);

      // Store result
      if (!this.results.has(testId)) {
        this.results.set(testId, []);
      }
      this.results.get(testId)!.push(result);

      return result;
    } catch (error) {
      const errorResult: DataPersistenceTestResult = {
        success: false,
        message: `Test ${testId} failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
        duration: 0,
        errors: [error instanceof Error ? error.message : String(error)],
      };

      // Store error result
      if (!this.results.has(testId)) {
        this.results.set(testId, []);
      }
      this.results.get(testId)!.push(errorResult);

      return errorResult;
    }
  }

  public async runAllTests(): Promise<Map<string, DataPersistenceTestResult[]>> {
    const allResults = new Map<string, DataPersistenceTestResult[]>();

    for (const [testId, test] of this.tests) {
      if (test.priority === 'high') {
        // Run high priority tests first
        const result = await this.runTest(testId);
        allResults.set(testId, [result]);
      }
    }

    for (const [testId, test] of this.tests) {
      if (test.priority !== 'high') {
        const result = await this.runTest(testId);
        allResults.set(testId, [result]);
      }
    }

    return allResults;
  }

  public getTestResults(
    testId?: string
  ): DataPersistenceTestResult[] | Map<string, DataPersistenceTestResult[]> {
    if (testId) {
      return this.results.get(testId) || [];
    }
    return this.results;
  }

  public getTestSummary(): TestSuiteResult {
    const allResults: DataPersistenceTestResult[] = [];
    this.results.forEach((results) => allResults.push(...results));

    const passed = allResults.filter((r) => r.success).length;
    const failed = allResults.length - passed;
    const successRate = allResults.length > 0 ? (passed / allResults.length) * 100 : 0;
    const averageDuration =
      allResults.length > 0
        ? allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length
        : 0;

    const totalStorageOperations = allResults.reduce(
      (sum, r) => sum + (r.storageOperations?.length || 0),
      0
    );

    const totalDataIntegrityChecks = allResults.reduce(
      (sum, r) => sum + (r.dataIntegrity?.length || 0),
      0
    );

    const averageStorageUtilization = 0; // Placeholder - would need to calculate from metrics

    return {
      total: allResults.length,
      passed,
      failed,
      successRate,
      averageDuration,
      totalStorageOperations,
      totalDataIntegrityChecks,
      averageStorageUtilization,
    };
  }

  public clearResults(): void {
    this.results.clear();
  }

  public getAvailableTests(): DataPersistenceTest[] {
    return Array.from(this.tests.values());
  }

  public getConfig(): DataPersistenceConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<DataPersistenceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Re-initialize tests with new config
    this.tests.clear();
    this.initializeTests();
  }
}

// Export the tester class
export default DataPersistenceTester;
