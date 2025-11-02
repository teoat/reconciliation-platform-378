// Error Recovery Tester Class
// Main orchestrator class using modular components
// Extracted from errorRecoveryTester.ts

import {
  ErrorRecoveryTest,
  ErrorRecoveryTestResult,
  ErrorRecoveryConfig,
  TestSuiteResult,
} from './types';
import { ErrorRecoveryTestDefinitions } from './testDefinitions';
import { logger } from '../logger';

const defaultConfig: ErrorRecoveryConfig = {
  testTimeout: 45000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableRetryMechanismTests: true,
  enableCircuitBreakerTests: true,
  enableFallbackStrategyTests: true,
  enableErrorEscalationTests: true,
  maxRetryAttempts: 5,
  circuitBreakerThreshold: 3,
};

export class ErrorRecoveryTester {
  private config: ErrorRecoveryConfig;
  private tests: Map<string, ErrorRecoveryTest> = new Map();
  private results: Map<string, ErrorRecoveryTestResult[]> = new Map();
  private isRunning: boolean = false;

  constructor(config: Partial<ErrorRecoveryConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.initializeTests();
  }

  private initializeTests(): void {
    const allTests = ErrorRecoveryTestDefinitions.getAllTests();

    // Filter tests based on configuration
    const enabledTests = allTests.filter((test) => {
      switch (test.category) {
        case 'retry-mechanisms':
          return this.config.enableRetryMechanismTests;
        case 'circuit-breakers':
          return this.config.enableCircuitBreakerTests;
        case 'fallback-strategies':
          return this.config.enableFallbackStrategyTests;
        case 'error-escalation':
          return this.config.enableErrorEscalationTests;
        default:
          return true;
      }
    });

    for (const test of enabledTests) {
      this.tests.set(test.id, test);
    }

    logger.info(`Initialized ${this.tests.size} error recovery tests`);
  }

  // Public Methods
  public async runTest(testId: string): Promise<ErrorRecoveryTestResult> {
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

  public async runAllTests(): Promise<Map<string, ErrorRecoveryTestResult>> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    const results = new Map<string, ErrorRecoveryTestResult>();

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
    category: ErrorRecoveryTest['category']
  ): Promise<Map<string, ErrorRecoveryTestResult>> {
    const categoryTests = Array.from(this.tests.entries()).filter(
      ([, test]) => test.category === category
    );
    const results = new Map<string, ErrorRecoveryTestResult>();

    for (const [testId, test] of categoryTests) {
      const result = await this.executeTestWithRetry(test);
      results.set(testId, result);
    }

    return results;
  }

  private async executeTestWithRetry(test: ErrorRecoveryTest): Promise<ErrorRecoveryTestResult> {
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
  ): ErrorRecoveryTestResult[] | Map<string, ErrorRecoveryTestResult[]> {
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
        totalRetryAttempts: 0,
        totalCircuitBreakerTests: 0,
        totalFallbackTests: 0,
        totalEscalationTests: 0,
      };
    }

    const passed = allResults.filter((r) => r.success).length;
    const failed = allResults.length - passed;
    const successRate = (passed / allResults.length) * 100;
    const averageDuration = allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length;

    const totalRetryAttempts = allResults.reduce(
      (sum, r) => sum + (r.retryAttempts?.length || 0),
      0
    );
    const totalCircuitBreakerTests = allResults.reduce(
      (sum, r) => sum + (r.circuitBreakerTests?.length || 0),
      0
    );
    const totalFallbackTests = allResults.reduce(
      (sum, r) => sum + (r.fallbackTests?.length || 0),
      0
    );
    const totalEscalationTests = allResults.reduce(
      (sum, r) => sum + (r.escalationTests?.length || 0),
      0
    );

    return {
      total: allResults.length,
      passed,
      failed,
      successRate,
      averageDuration,
      totalRetryAttempts,
      totalCircuitBreakerTests,
      totalFallbackTests,
      totalEscalationTests,
    };
  }

  public clearResults(): void {
    this.results.clear();
  }

  public getAvailableTests(): ErrorRecoveryTest[] {
    return Array.from(this.tests.values());
  }

  public getConfig(): ErrorRecoveryConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<ErrorRecoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Re-initialize tests with new config
    this.tests.clear();
    this.initializeTests();
  }
}

// Export the tester class
export default ErrorRecoveryTester;
