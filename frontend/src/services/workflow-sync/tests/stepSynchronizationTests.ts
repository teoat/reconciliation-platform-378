// ============================================================================
// STEP SYNCHRONIZATION TESTS
// ============================================================================

import type { WorkflowSyncTestResult, StepValidation, StepPermissions } from '../types';
import { WorkflowSyncSimulation } from '../utils/simulation';
import { WorkflowSyncComparison } from '../utils/comparison';

export class StepSynchronizationTests {
  constructor(
    private simulation: WorkflowSyncSimulation,
    private comparison: WorkflowSyncComparison
  ) {}

  async testStepSynchronization(): Promise<WorkflowSyncTestResult> {
    const startTime = Date.now();

    try {
      const browsers = ['browser-1', 'browser-2', 'browser-3'];

      await Promise.all(browsers.map((browser) => this.simulation.simulateBrowserConnect(browser)));

      const stepChanges = [
        { browser: browsers[0], step: 'reconciliation' },
        { browser: browsers[1], step: 'reconciliation' },
        { browser: browsers[2], step: 'reconciliation' },
      ];

      await Promise.all(
        stepChanges.map((change) => this.simulation.simulateBrowserStepChange(change.browser, change.step))
      );

      const syncChecks = await Promise.all(
        browsers.map(async (browser) => {
          const browserStep = await this.simulation.getBrowserCurrentStep(browser);
          return { browser, step: browserStep };
        })
      );

      const allSynced = syncChecks.every((check) => check.step === 'reconciliation');
      const duration = Date.now() - startTime;

      return {
        success: allSynced,
        message: allSynced
          ? 'Step synchronization working correctly'
          : 'Step synchronization issues detected',
        details: { browsers, stepChanges, syncChecks },
        timestamp: new Date(),
        duration,
        browsers,
      };
    } catch (error) {
      return {
        success: false,
        message: `Step synchronization test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async testStepValidationSync(): Promise<WorkflowSyncTestResult> {
    const startTime = Date.now();

    try {
      const browsers = ['browser-1', 'browser-2', 'browser-3'];

      await Promise.all(browsers.map((browser) => this.simulation.simulateBrowserConnect(browser)));

      const validationResult: StepValidation = { valid: true, errors: [], warnings: [] };
      await this.simulation.simulateStepValidation(validationResult as unknown as Record<string, unknown>);

      const validationChecks = await Promise.all(
        browsers.map(async (browser) => {
          const browserValidation = await this.simulation.getBrowserStepValidation(browser);
          return {
            browser,
            synchronized: this.comparison.compareValidationResults(validationResult, browserValidation),
          };
        })
      );

      const allSynced = validationChecks.every((check) => check.synchronized);
      const duration = Date.now() - startTime;

      return {
        success: allSynced,
        message: allSynced
          ? 'Step validation synchronization working correctly'
          : 'Step validation synchronization issues detected',
        details: { browsers, validationResult, validationChecks },
        timestamp: new Date(),
        duration,
        browsers,
      };
    } catch (error) {
      return {
        success: false,
        message: `Step validation sync test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async testStepPermissionsSync(): Promise<WorkflowSyncTestResult> {
    const startTime = Date.now();

    try {
      const browsers = ['browser-1', 'browser-2', 'browser-3'];

      await Promise.all(browsers.map((browser) => this.simulation.simulateBrowserConnect(browser)));

      const permissions: StepPermissions = { canEdit: true, canDelete: false, canAdvance: true };
      await this.simulation.simulateStepPermissionsChange(permissions as unknown as Record<string, unknown>);

      const permissionChecks = await Promise.all(
        browsers.map(async (browser) => {
          const browserPermissions = await this.simulation.getBrowserStepPermissions(browser);
          return {
            browser,
            synchronized: this.comparison.comparePermissions(permissions, browserPermissions),
          };
        })
      );

      const allSynced = permissionChecks.every((check) => check.synchronized);
      const duration = Date.now() - startTime;

      return {
        success: allSynced,
        message: allSynced
          ? 'Step permissions synchronization working correctly'
          : 'Step permissions synchronization issues detected',
        details: { browsers, permissions, permissionChecks },
        timestamp: new Date(),
        duration,
        browsers,
      };
    } catch (error) {
      return {
        success: false,
        message: `Step permissions sync test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}

