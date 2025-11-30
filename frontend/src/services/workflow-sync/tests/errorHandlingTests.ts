// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

import type { WorkflowSyncTestResult, ErrorState, RecoveryState, RollbackState } from '../types';
import { WorkflowSyncSimulation } from '../utils/simulation';
import { WorkflowSyncComparison } from '../utils/comparison';

export class ErrorHandlingTests {
  constructor(
    private simulation: WorkflowSyncSimulation,
    private comparison: WorkflowSyncComparison
  ) {}

  async testErrorStateSync(): Promise<WorkflowSyncTestResult> {
    const startTime = Date.now();
    const browsers = ['browser-1', 'browser-2'];

    try {
      await Promise.all(browsers.map((browser) => this.simulation.simulateBrowserConnect(browser)));

      const errorState: ErrorState = {
        hasError: true,
        errorType: 'validation',
        message: 'Data validation failed',
        details: { field: 'amount', value: 'invalid' },
      };

      await this.simulation.simulateErrorState(errorState);

      const errorChecks = await Promise.all(
        browsers.map(async (browser) => {
          const browserErrorState = await this.simulation.getBrowserErrorState(browser);
          return { browser, synchronized: this.comparison.compareErrorStates(errorState, browserErrorState) };
        })
      );

      const allSynced = errorChecks.every((check) => check.synchronized);
      const duration = Date.now() - startTime;

      return {
        success: allSynced,
        message: allSynced
          ? 'Error state synchronization working correctly'
          : 'Error state synchronization issues detected',
        details: { browsers, errorState, errorChecks },
        timestamp: new Date(),
        duration,
        browsers,
      };
    } catch (error) {
      return {
        success: false,
        message: `Error state sync test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async testRecoveryStateSync(): Promise<WorkflowSyncTestResult> {
    const startTime = Date.now();

    try {
      const browsers = ['browser-1', 'browser-2', 'browser-3'];

      await Promise.all(browsers.map((browser) => this.simulation.simulateBrowserConnect(browser)));

      const recoveryState: RecoveryState = {
        isRecovering: true,
        recoveryStep: 'rollback',
        progress: 50,
        details: { estimatedTime: 30000 },
      };

      await this.simulation.simulateRecoveryState(recoveryState);

      const recoveryChecks = await Promise.all(
        browsers.map(async (browser) => {
          const browserRecoveryState = await this.simulation.getBrowserRecoveryState(browser);
          return {
            browser,
            synchronized: this.comparison.compareRecoveryStates(recoveryState, browserRecoveryState),
          };
        })
      );

      const allSynced = recoveryChecks.every((check) => check.synchronized);
      const duration = Date.now() - startTime;

      return {
        success: allSynced,
        message: allSynced
          ? 'Recovery state synchronization working correctly'
          : 'Recovery state synchronization issues detected',
        details: { browsers, recoveryState, recoveryChecks },
        timestamp: new Date(),
        duration,
        browsers,
      };
    } catch (error) {
      return {
        success: false,
        message: `Recovery state sync test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async testRollbackStateSync(): Promise<WorkflowSyncTestResult> {
    const startTime = Date.now();

    try {
      const browsers = ['browser-1', 'browser-2', 'browser-3'];

      await Promise.all(browsers.map((browser) => this.simulation.simulateBrowserConnect(browser)));

      const rollbackState: RollbackState = {
        isRollingBack: true,
        rollbackStep: 'ingestion',
        progress: 75,
        details: { reason: 'Data corruption detected' },
      };

      await this.simulation.simulateRollbackState(rollbackState);

      const rollbackChecks = await Promise.all(
        browsers.map(async (browser) => {
          const browserRollbackState = await this.simulation.getBrowserRollbackState(browser);
          return {
            browser,
            synchronized: this.comparison.compareRollbackStates(rollbackState, browserRollbackState),
          };
        })
      );

      const allSynced = rollbackChecks.every((check) => check.synchronized);
      const duration = Date.now() - startTime;

      return {
        success: allSynced,
        message: allSynced
          ? 'Rollback state synchronization working correctly'
          : 'Rollback state synchronization issues detected',
        details: { browsers, rollbackState, rollbackChecks },
        timestamp: new Date(),
        duration,
        browsers,
      };
    } catch (error) {
      return {
        success: false,
        message: `Rollback state sync test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}

