// Network Interruption Tester Class
// Main orchestrator class using modular components
// Extracted from networkInterruptionTester.ts

import {
  NetworkInterruptionTest,
  NetworkInterruptionTestResult,
  NetworkInterruptionConfig,
  TestSuiteResult,
} from './types';
import { NetworkInterruptionTestDefinitions } from './testDefinitions';
import { logger } from '../logger';

const defaultConfig: NetworkInterruptionConfig = {
  testTimeout: 60000,
  retryAttempts: 3,
  retryDelay: 2000,
  enableConnectionLossTests: true,
  enableReconnectionTests: true,
  enableDataRecoveryTests: true,
  enableStatePreservationTests: true,
  networkSimulationDelay: 5000,
};

export class NetworkInterruptionTester {
  private config: NetworkInterruptionConfig;
  private tests: Map<string, NetworkInterruptionTest> = new Map();
  private results: Map<string, NetworkInterruptionTestResult[]> = new Map();
  private isRunning: boolean = false;

  constructor(config: Partial<NetworkInterruptionConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.initializeTests();
  }

  private initializeTests(): void {
    const allTests = NetworkInterruptionTestDefinitions.getAllTests();

    // Filter tests based on configuration
    const enabledTests = allTests.filter((test) => {
      switch (test.category) {
        case 'connection-loss':
          return this.config.enableConnectionLossTests;
        case 'reconnection':
          return this.config.enableReconnectionTests;
        case 'data-recovery':
          return this.config.enableDataRecoveryTests;
        case 'state-preservation':
          return this.config.enableStatePreservationTests;
        default:
          return true;
      }
    });

    for (const test of enabledTests) {
      this.tests.set(test.id, test);
    }

    logger.info(`Initialized ${this.tests.size} network interruption tests`);
  }

  // Public Methods
  public async runTest(testId: string): Promise<NetworkInterruptionTestResult> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test with id ${testId} not found`);
    }

    const result = await this.executeTestWithRetry(test);

    // Store result
    if (!this.results.has(testId)) {
      this.results.set(testId, []);
    }
    this.results.get(testId)!.push(result);

    return result;
  }

  public async runAllTests(): Promise<Map<string, NetworkInterruptionTestResult>> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    const results = new Map<string, NetworkInterruptionTestResult>();

    try {
      const testPromises = Array.from(this.tests.entries()).map(async ([testId, test]) => {
        const result = await this.executeTestWithRetry(test);
        results.set(testId, result);
        return result;
      });

      await Promise.all(testPromises);
    } finally {
      this.isRunning = false;
    }

    return results;
  }

  public async runTestsByCategory(
    category: NetworkInterruptionTest['category']
  ): Promise<Map<string, NetworkInterruptionTestResult>> {
    const categoryTests = Array.from(this.tests.entries()).filter(
      ([, test]) => test.category === category
    );
    const results = new Map<string, NetworkInterruptionTestResult>();

    for (const [testId, test] of categoryTests) {
      const result = await this.executeTestWithRetry(test);
      results.set(testId, result);
    }

    return results;
  }

  private async executeTestWithRetry(
    test: NetworkInterruptionTest
  ): Promise<NetworkInterruptionTestResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const result = await Promise.race([
          test.testFunction(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Test timeout')), this.config.testTimeout)
          ),
        ]);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < this.config.retryAttempts) {
          await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay * attempt));
        }
      }
    }

    return {
      success: false,
      message: `Test failed after ${this.config.retryAttempts} attempts: ${lastError?.message}`,
      timestamp: new Date(),
      duration: 0,
      errors: [lastError?.message || 'Unknown error'],
    };
  }

  public getTestResults(
    testId?: string
  ): NetworkInterruptionTestResult[] | Map<string, NetworkInterruptionTestResult[]> {
    if (testId) {
      return this.results.get(testId) || [];
    }
    return this.results;
  }

  public getTestSummary(): TestSuiteResult {
    const allResults = Array.from(this.results.values()).flat();

    if (allResults.length === 0) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        successRate: 0,
        averageDuration: 0,
        totalNetworkEvents: 0,
        totalDataLoss: 0,
        totalRecoveryActions: 0,
      };
    }

    const passed = allResults.filter((r) => r.success).length;
    const failed = allResults.length - passed;
    const successRate = (passed / allResults.length) * 100;
    const averageDuration = allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length;

    const totalNetworkEvents = allResults.reduce(
      (sum, r) => sum + (r.networkEvents?.length || 0),
      0
    );
    const totalDataLoss = allResults.reduce((sum, r) => sum + (r.dataLoss?.length || 0), 0);
    const totalRecoveryActions = allResults.reduce(
      (sum, r) => sum + (r.recoveryActions?.length || 0),
      0
    );

    return {
      total: allResults.length,
      passed,
      failed,
      successRate,
      averageDuration,
      totalNetworkEvents,
      totalDataLoss,
      totalRecoveryActions,
    };
  }

  public clearResults(): void {
    this.results.clear();
  }

  public getAvailableTests(): NetworkInterruptionTest[] {
    return Array.from(this.tests.values());
  }

  public getConfig(): NetworkInterruptionConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<NetworkInterruptionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Re-initialize tests with new config
    this.tests.clear();
    this.initializeTests();
  }
}

// Export the tester class
export default NetworkInterruptionTester;
