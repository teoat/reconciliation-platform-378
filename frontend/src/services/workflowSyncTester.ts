// ============================================================================
// WORKFLOW STATE SYNCHRONIZATION TESTING
// ============================================================================
// This file provides the main WorkflowSyncTester class
// All test implementations are organized in workflow-sync/tests/
// All utilities are organized in workflow-sync/utils/
// All types are organized in workflow-sync/types/

import type { WorkflowSyncTest, WorkflowSyncTestResult, WorkflowSyncConfig } from './workflow-sync/types';
import { defaultConfig } from './workflow-sync/types';
import { WorkflowSyncSimulation } from './workflow-sync/utils';
import { WorkflowSyncComparison } from './workflow-sync/utils';
import {
  StatePropagationTests,
  StepSynchronizationTests,
  ProgressSyncTests,
  ErrorHandlingTests,
} from './workflow-sync/tests';

export type {
  WorkflowSyncTest,
  WorkflowSyncTestResult,
  WorkflowSyncConfig,
  StateChange,
  StateConflict,
} from './workflow-sync/types';

export { defaultConfig } from './workflow-sync/types';

export class WorkflowSyncTester {
  private config: WorkflowSyncConfig;
  private tests: Map<string, WorkflowSyncTest> = new Map();
  private results: Map<string, WorkflowSyncTestResult[]> = new Map();
  private isRunning: boolean = false;
  private simulation: WorkflowSyncSimulation;
  private comparison: WorkflowSyncComparison;
  private statePropagationTests: StatePropagationTests;
  private stepSynchronizationTests: StepSynchronizationTests;
  private progressSyncTests: ProgressSyncTests;
  private errorHandlingTests: ErrorHandlingTests;

  constructor(config: Partial<WorkflowSyncConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.simulation = new WorkflowSyncSimulation();
    this.comparison = new WorkflowSyncComparison();
    this.statePropagationTests = new StatePropagationTests(this.simulation, this.comparison);
    this.stepSynchronizationTests = new StepSynchronizationTests(this.simulation, this.comparison);
    this.progressSyncTests = new ProgressSyncTests(this.simulation, this.comparison);
    this.errorHandlingTests = new ErrorHandlingTests(this.simulation, this.comparison);
    this.initializeTests();
  }

  private initializeTests(): void {
    // State Propagation Tests
    if (this.config.enableStatePropagationTests) {
      this.addTest({
        id: 'workflow-state-propagation',
        name: 'Workflow State Propagation',
        description: 'Verify workflow state changes propagate across all browsers',
        category: 'state-propagation',
        priority: 'high',
        requiresMultipleBrowsers: true,
        testFunction: this.statePropagationTests.testWorkflowStatePropagation.bind(this.statePropagationTests),
      });

      this.addTest({
        id: 'step-transition-propagation',
        name: 'Step Transition Propagation',
        description: 'Verify step transitions propagate to all connected browsers',
        category: 'state-propagation',
        priority: 'high',
        requiresMultipleBrowsers: true,
        testFunction: this.statePropagationTests.testStepTransitionPropagation.bind(this.statePropagationTests),
      });

      this.addTest({
        id: 'data-state-propagation',
        name: 'Data State Propagation',
        description: 'Verify data state changes propagate across browsers',
        category: 'state-propagation',
        priority: 'medium',
        requiresMultipleBrowsers: true,
        testFunction: this.statePropagationTests.testDataStatePropagation.bind(this.statePropagationTests),
      });
    }

    // Step Synchronization Tests
    if (this.config.enableStepSyncTests) {
      this.addTest({
        id: 'step-synchronization',
        name: 'Step Synchronization',
        description: 'Verify all browsers stay synchronized on the same workflow step',
        category: 'step-synchronization',
        priority: 'high',
        requiresMultipleBrowsers: true,
        testFunction: this.stepSynchronizationTests.testStepSynchronization.bind(this.stepSynchronizationTests),
      });

      this.addTest({
        id: 'step-validation-sync',
        name: 'Step Validation Synchronization',
        description: 'Verify step validation results are synchronized across browsers',
        category: 'step-synchronization',
        priority: 'medium',
        requiresMultipleBrowsers: true,
        testFunction: this.stepSynchronizationTests.testStepValidationSync.bind(this.stepSynchronizationTests),
      });

      this.addTest({
        id: 'step-permissions-sync',
        name: 'Step Permissions Synchronization',
        description: 'Verify step permissions are synchronized across browsers',
        category: 'step-synchronization',
        priority: 'medium',
        requiresMultipleBrowsers: true,
        testFunction: this.stepSynchronizationTests.testStepPermissionsSync.bind(this.stepSynchronizationTests),
      });
    }

    // Progress Synchronization Tests
    if (this.config.enableProgressSyncTests) {
      this.addTest({
        id: 'progress-synchronization',
        name: 'Progress Synchronization',
        description: 'Verify progress updates are synchronized across all browsers',
        category: 'progress-sync',
        priority: 'high',
        requiresMultipleBrowsers: true,
        testFunction: this.progressSyncTests.testProgressSynchronization.bind(this.progressSyncTests),
      });

      this.addTest({
        id: 'progress-calculation-sync',
        name: 'Progress Calculation Synchronization',
        description: 'Verify progress calculations are consistent across browsers',
        category: 'progress-sync',
        priority: 'medium',
        requiresMultipleBrowsers: true,
        testFunction: this.progressSyncTests.testProgressCalculationSync.bind(this.progressSyncTests),
      });

      this.addTest({
        id: 'progress-indicator-sync',
        name: 'Progress Indicator Synchronization',
        description: 'Verify progress indicators show consistent values across browsers',
        category: 'progress-sync',
        priority: 'medium',
        requiresMultipleBrowsers: true,
        testFunction: this.progressSyncTests.testProgressIndicatorSync.bind(this.progressSyncTests),
      });
    }

    // Error Handling Tests
    if (this.config.enableErrorHandlingTests) {
      this.addTest({
        id: 'error-state-sync',
        name: 'Error State Synchronization',
        description: 'Verify error states are synchronized across browsers',
        category: 'error-handling',
        priority: 'high',
        requiresMultipleBrowsers: true,
        testFunction: this.errorHandlingTests.testErrorStateSync.bind(this.errorHandlingTests),
      });

      this.addTest({
        id: 'recovery-state-sync',
        name: 'Recovery State Synchronization',
        description: 'Verify recovery states are synchronized across browsers',
        category: 'error-handling',
        priority: 'medium',
        requiresMultipleBrowsers: true,
        testFunction: this.errorHandlingTests.testRecoveryStateSync.bind(this.errorHandlingTests),
      });

      this.addTest({
        id: 'rollback-state-sync',
        name: 'Rollback State Synchronization',
        description: 'Verify rollback states are synchronized across browsers',
        category: 'error-handling',
        priority: 'medium',
        requiresMultipleBrowsers: true,
        testFunction: this.errorHandlingTests.testRollbackStateSync.bind(this.errorHandlingTests),
      });
    }
  }

  private addTest(test: WorkflowSyncTest): void {
    this.tests.set(test.id, test);
  }

  // Public Methods
  public async runTest(testId: string): Promise<WorkflowSyncTestResult> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test with id ${testId} not found`);
    }

    const result = await this.executeTestWithRetry(test);

    if (!this.results.has(testId)) {
      this.results.set(testId, []);
    }
    this.results.get(testId)!.push(result);

    return result;
  }

  public async runAllTests(): Promise<Map<string, WorkflowSyncTestResult>> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    const results = new Map<string, WorkflowSyncTestResult>();

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
    category: WorkflowSyncTest['category']
  ): Promise<Map<string, WorkflowSyncTestResult>> {
    const categoryTests = Array.from(this.tests.entries()).filter(
      ([, test]) => test.category === category
    );
    const results = new Map<string, WorkflowSyncTestResult>();

    for (const [testId, test] of categoryTests) {
      const result = await this.executeTestWithRetry(test);
      results.set(testId, result);
    }

    return results;
  }

  private async executeTestWithRetry(test: WorkflowSyncTest): Promise<WorkflowSyncTestResult> {
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
  ): WorkflowSyncTestResult[] | Map<string, WorkflowSyncTestResult[]> {
    if (testId) {
      return this.results.get(testId) || [];
    }
    return this.results;
  }

  public getTestSummary(): {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
    averageDuration: number;
    totalConflicts: number;
    resolvedConflicts: number;
  } {
    const allResults = Array.from(this.results.values()).flat();

    if (allResults.length === 0) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        successRate: 0,
        averageDuration: 0,
        totalConflicts: 0,
        resolvedConflicts: 0,
      };
    }

    const passed = allResults.filter((r) => r.success).length;
    const failed = allResults.length - passed;
    const successRate = (passed / allResults.length) * 100;
    const averageDuration = allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length;

    const totalConflicts = allResults.reduce((sum, r) => sum + (r.conflicts?.length || 0), 0);
    const resolvedConflicts = allResults.reduce(
      (sum, r) => sum + (r.conflicts?.filter((c) => c.resolution === 'resolved').length || 0),
      0
    );

    return {
      total: allResults.length,
      passed,
      failed,
      successRate,
      averageDuration,
      totalConflicts,
      resolvedConflicts,
    };
  }

  public clearResults(): void {
    this.results.clear();
  }

  public getAvailableTests(): WorkflowSyncTest[] {
    return Array.from(this.tests.values());
  }
}

// Export the tester class
export default WorkflowSyncTester;
