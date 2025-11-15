// Stale Data Tester Class
// Main orchestrator class using modular components
// Extracted from staleDataTester.ts

import { StaleDataTest, StaleDataTestResult, StaleDataConfig, TestSuiteResult } from './types';
import { StaleDataTestDefinitions } from './testDefinitions';
import { logger } from '../logger';

const defaultConfig: StaleDataConfig = {
  testTimeout: 45000,
  staleThresholdMinutes: 5,
  enableTimestampChecks: true,
  enableVersionChecks: true,
  enableChecksumChecks: true,
  enableHybridDetection: true,
  autoRefreshEnabled: true,
  maxTestDataSize: 1024 * 1024,
};

export class StaleDataTester {
  private config: StaleDataConfig;
  private tests: Map<string, StaleDataTest> = new Map();
  private results: Map<string, StaleDataTestResult[]> = new Map();
  private isRunning: boolean = false;

  constructor(config: Partial<StaleDataConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.initializeTests();
  }

  private initializeTests(): void {
    const allTests = StaleDataTestDefinitions.getAllTests();

    // Filter tests based on configuration
    const enabledTests = allTests.filter((test) => {
      switch (test.category) {
        case 'timestamp-based':
          return this.config.enableTimestampChecks;
        case 'version-based':
          return this.config.enableVersionChecks;
        case 'checksum-based':
          return this.config.enableChecksumChecks;
        case 'hybrid-detection':
          return this.config.enableHybridDetection;
        default:
          return true;
      }
    });

    for (const test of enabledTests) {
      this.tests.set(test.id, test);
    }

    logger.info(`Initialized ${this.tests.size} stale data tests`);
  }

  // Public Methods
  public async runTest(testId: string): Promise<StaleDataTestResult> {
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

  public async runAllTests(): Promise<Map<string, StaleDataTestResult>> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    const results = new Map<string, StaleDataTestResult>();

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
    category: StaleDataTest['category']
  ): Promise<Map<string, StaleDataTestResult>> {
    const categoryTests = Array.from(this.tests.entries()).filter(
      ([, test]) => test.category === category
    );
    const results = new Map<string, StaleDataTestResult>();

    for (const [testId, test] of categoryTests) {
      const result = await this.executeTestWithRetry(test);
      results.set(testId, result);
    }

    return results;
  }

  private async executeTestWithRetry(test: StaleDataTest): Promise<StaleDataTestResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      // Default retry attempts
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

        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Retry delay
        }
      }
    }

    return {
      success: false,
      message: `Test failed after 3 attempts: ${lastError?.message}`,
      timestamp: new Date(),
      duration: 0,
      errors: [lastError?.message || 'Unknown error'],
    };
  }

  public getTestResults(
    testId?: string
  ): StaleDataTestResult[] | Map<string, StaleDataTestResult[]> {
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
        totalStaleDataDetected: 0,
        totalFreshnessChecks: 0,
        totalRefreshActions: 0,
      };
    }

    const passed = allResults.filter((r) => r.success).length;
    const failed = allResults.length - passed;
    const successRate = (passed / allResults.length) * 100;
    const averageDuration = allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length;

    const totalStaleDataDetected = allResults.reduce(
      (sum, r) => sum + (r.staleDataDetected?.length || 0),
      0
    );
    const totalFreshnessChecks = allResults.reduce(
      (sum, r) => sum + (r.freshnessChecks?.length || 0),
      0
    );
    const totalRefreshActions = allResults.reduce(
      (sum, r) => sum + (r.refreshActions?.length || 0),
      0
    );

    return {
      total: allResults.length,
      passed,
      failed,
      successRate,
      averageDuration,
      totalStaleDataDetected,
      totalFreshnessChecks,
      totalRefreshActions,
    };
  }

  public clearResults(): void {
    this.results.clear();
  }

  public getAvailableTests(): StaleDataTest[] {
    return Array.from(this.tests.values());
  }

  public getConfig(): StaleDataConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<StaleDataConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Re-initialize tests with new config
    this.tests.clear();
    this.initializeTests();
  }
}

// Export the tester class
export default StaleDataTester;
