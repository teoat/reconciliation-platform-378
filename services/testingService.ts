// Consolidated Testing Service
// Combines collaboration testing, data consistency testing, and general testing functionality

import { BaseService } from './BaseService';

export function createTestResult(data = {}) {
  return {
    id: '',
    name: '',
    success: false,
    message: '',
    details: null,
    timestamp: new Date(),
    duration: 0,
    errors: [],
    category: 'integration',
    priority: 'medium',
    ...data,
  };
}

export function createTestConfig(data = {}) {
  return {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    maxConcurrentTests: 5,
    enableRealTimeTests: true,
    enablePerformanceTests: true,
    enableIntegrationTests: true,
    ...data,
  };
}

export function createCollaborationTestData(data = {}) {
  return {
    participants: [],
    conflicts: [],
    ...data,
  };
}

export function createDataConsistencyTestData(data = {}) {
  return {
    dataFlow: null,
    stateSync: null,
    cacheInvalidation: null,
    ...data,
  };
}

export class TestingService extends BaseService {
  config;
  runningTests = new Map();
  testQueue = [];

  constructor() {
    super({
      enabled: true,
      persistence: true,
      events: true,
      caching: true,
    });

    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      maxConcurrentTests: 5,
      enableRealTimeTests: true,
      enablePerformanceTests: true,
      enableIntegrationTests: true,
    };

    this.initializeDefaultTests();
  }

  // Test Management
  async runTest(testId, testFunction) {
    const startTime = Date.now();

    try {
      const result = await Promise.race([testFunction(), this.createTimeoutPromise(testId)]);

      result.duration = Date.now() - startTime;
      result.timestamp = new Date();

      this.set(testId, result);
      this.emit('testCompleted', { testId, result });

      return result;
    } catch (error) {
      const result = createTestResult({
        id: testId,
        name: testId,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        category: 'integration',
        priority: 'medium',
      });

      this.set(testId, result);
      this.emit('testFailed', { testId, result });

      return result;
    }
  }

  async runTestSuite(suiteName, tests) {
    const results = [];

    this.emit('testSuiteStarted', { suiteName, testCount: tests.length });

    for (const { id, test } of tests) {
      try {
        const result = await this.runTest(`${suiteName}_${id}`, test);
        results.push(result);

        // Emit progress
        this.emit('testSuiteProgress', {
          suiteName,
          completed: results.length,
          total: tests.length,
          currentTest: id,
        });
      } catch (error) {
        console.error(`Test ${id} failed:`, error);
      }
    }

    this.emit('testSuiteCompleted', { suiteName, results });
    return results;
  }

  // Collaboration Testing
  async testCollaboration(testData) {
    return this.runTest('collaboration_test', async () => {
      const startTime = Date.now();

      // Test presence
      const presenceResult = await this.testPresence(testData.participants);

      // Test conflict resolution
      const conflictResult = await this.testConflictResolution(testData.conflicts || []);

      // Test synchronization
      const syncResult = await this.testSynchronization(testData.participants);

      const success = presenceResult && conflictResult && syncResult;

      return {
        id: 'collaboration_test',
        name: 'Collaboration Test',
        success,
        message: success ? 'All collaboration tests passed' : 'Some collaboration tests failed',
        details: {
          presence: presenceResult,
          conflictResolution: conflictResult,
          synchronization: syncResult,
          participants: testData.participants,
        },
        timestamp: new Date(),
        duration: Date.now() - startTime,
        category: 'collaboration',
        priority: 'high',
      };
    });
  }

  async testPresence(participants) {
    // Simplified presence testing
    return participants.length > 0;
  }

  async testConflictResolution(conflicts) {
    // Simplified conflict resolution testing
    return conflicts ? conflicts.every((c) => c.resolved) : true;
  }

  async testSynchronization(participants) {
    // Simplified synchronization testing
    return participants.length >= 2;
  }

  // Data Consistency Testing
  async testDataConsistency(testData) {
    return this.runTest('data_consistency_test', async () => {
      const startTime = Date.now();

      // Test data flow
      const dataFlowResult = await this.testDataFlow(testData.dataFlow);

      // Test state synchronization
      const stateSyncResult = await this.testStateSync(testData.stateSync);

      // Test cache invalidation
      const cacheResult = await this.testCacheInvalidation(testData.cacheInvalidation);

      const success = dataFlowResult && stateSyncResult && cacheResult;

      return {
        id: 'data_consistency_test',
        name: 'Data Consistency Test',
        success,
        message: success
          ? 'All data consistency tests passed'
          : 'Some data consistency tests failed',
        details: {
          dataFlow: dataFlowResult,
          stateSync: stateSyncResult,
          cacheInvalidation: cacheResult,
        },
        timestamp: new Date(),
        duration: Date.now() - startTime,
        category: 'data-consistency',
        priority: 'high',
      };
    });
  }

  async testDataFlow(dataFlow) {
    // Simplified data flow testing
    return dataFlow !== null;
  }

  async testStateSync(stateSync) {
    // Simplified state sync testing
    return stateSync !== null;
  }

  async testCacheInvalidation(cacheInvalidation) {
    // Simplified cache invalidation testing
    return cacheInvalidation !== null;
  }

  // Performance Testing
  async testPerformance(testName, testFunction) {
    return this.runTest(`performance_${testName}`, async () => {
      const startTime = Date.now();

      try {
        await testFunction();
        const duration = Date.now() - startTime;

        return {
          id: `performance_${testName}`,
          name: `Performance Test: ${testName}`,
          success: duration < this.config.timeout,
          message: `Performance test completed in ${duration}ms`,
          details: { duration, threshold: this.config.timeout },
          timestamp: new Date(),
          duration,
          category: 'performance',
          priority: 'medium',
        };
      } catch (error) {
        return {
          id: `performance_${testName}`,
          name: `Performance Test: ${testName}`,
          success: false,
          message: `Performance test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          category: 'performance',
          priority: 'medium',
        };
      }
    });
  }

  // Integration Testing
  async testIntegration(testName, testFunction) {
    return this.runTest(`integration_${testName}`, async () => {
      const startTime = Date.now();

      try {
        const result = await testFunction();

        return {
          id: `integration_${testName}`,
          name: `Integration Test: ${testName}`,
          success: true,
          message: 'Integration test passed',
          details: result,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          category: 'integration',
          priority: 'high',
        };
      } catch (error) {
        return {
          id: `integration_${testName}`,
          name: `Integration Test: ${testName}`,
          success: false,
          message: `Integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          category: 'integration',
          priority: 'high',
        };
      }
    });
  }

  // Test Results Management
  getTestResults(testId) {
    if (testId) {
      const result = this.get(testId);
      return result ? [result] : [];
    }
    return this.getAll();
  }

  getTestResultsByCategory(category) {
    return this.getAll().filter((result) => result.category === category);
  }

  getFailedTests() {
    return this.getAll().filter((result) => !result.success);
  }

  getTestStatistics() {
    const results = this.getAll();
    const total = results.length;
    const passed = results.filter((r) => r.success).length;
    const failed = total - passed;
    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / total;

    const byCategory = results.reduce((acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = { total: 0, passed: 0, failed: 0 };
      }
      acc[result.category].total++;
      if (result.success) {
        acc[result.category].passed++;
      } else {
        acc[result.category].failed++;
      }
      return acc;
    }, {});

    return {
      total,
      passed,
      failed,
      byCategory,
      averageDuration,
    };
  }

  // Configuration Management
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', { config: this.config });
  }

  getConfig() {
    return { ...this.config };
  }

  // Utility Methods
  createTimeoutPromise(testId) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Test ${testId} timed out after ${this.config.timeout}ms`));
      }, this.config.timeout);
    });
  }

  initializeDefaultTests() {
    // Initialize default test configurations
    this.emit('testingServiceInitialized', { config: this.config });
  }

  // Validation methods required by BaseService
  validate(data) {
    return (
      data &&
      typeof data.id === 'string' &&
      typeof data.success === 'boolean' &&
      typeof data.message === 'string'
    );
  }

  // Cleanup
  cleanup() {
    super.cleanup();

    // Cancel running tests
    for (const [testId, promise] of this.runningTests.entries()) {
      // Note: Promises can't be cancelled, but we can track them
      this.runningTests.delete(testId);
    }

    this.testQueue = [];
  }
}

// Export singleton instance
export const testingService = new TestingService();
