// ============================================================================
// PROGRESS SYNCHRONIZATION TESTS
// ============================================================================

import type { WorkflowSyncTestResult, ProgressIndicator, DataState } from '../types';
import { WorkflowSyncSimulation } from '../utils/simulation';
import { WorkflowSyncComparison } from '../utils/comparison';

export class ProgressSyncTests {
  constructor(
    private simulation: WorkflowSyncSimulation,
    private comparison: WorkflowSyncComparison
  ) {}

  async testProgressSynchronization(): Promise<WorkflowSyncTestResult> {
    const startTime = Date.now();

    try {
      const browsers = ['browser-1', 'browser-2', 'browser-3'];

      await Promise.all(browsers.map((browser) => this.simulation.simulateBrowserConnect(browser)));

      const progressUpdates = [25, 50, 75, 100];

      for (const progress of progressUpdates) {
        await this.simulation.simulateProgressUpdate(progress);

        const progressChecks = await Promise.all(
          browsers.map(async (browser) => {
            const browserProgress = await this.simulation.getBrowserProgress(browser);
            return {
              browser,
              progress: browserProgress,
              synchronized: browserProgress === progress,
            };
          })
        );

        const allSynced = progressChecks.every((check) => check.synchronized);
        if (!allSynced) {
          return {
            success: false,
            message: `Progress synchronization failed at ${progress}%`,
            details: { browsers, progress, progressChecks },
            timestamp: new Date(),
            duration: Date.now() - startTime,
            browsers,
          };
        }
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        message: 'Progress synchronization working correctly',
        details: { browsers, progressUpdates, totalUpdates: progressUpdates.length },
        timestamp: new Date(),
        duration,
        browsers,
      };
    } catch (error) {
      return {
        success: false,
        message: `Progress synchronization test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async testProgressCalculationSync(): Promise<WorkflowSyncTestResult> {
    const startTime = Date.now();

    try {
      const browsers = ['browser-1', 'browser-2', 'browser-3'];

      await Promise.all(browsers.map((browser) => this.simulation.simulateBrowserConnect(browser)));

      const dataChanges: Array<{ records: number; matches: number }> = [
        { records: 1000, matches: 800 },
        { records: 1000, matches: 900 },
        { records: 1000, matches: 950 },
      ];

      const calculationChecks = [];

      for (const dataChange of dataChanges) {
        await this.simulation.simulateDataChange(dataChange);

        const progressChecks = await Promise.all(
          browsers.map(async (browser) => {
            const browserProgress = await this.simulation.getBrowserProgress(browser);
            const browserData = await this.simulation.getBrowserDataState(browser);
            const calculatedProgress = this.comparison.calculateProgress(browserData);

            return {
              browser,
              progress: browserProgress,
              calculatedProgress,
              consistent: browserProgress === calculatedProgress,
            };
          })
        );

        calculationChecks.push({ dataChange, progressChecks });
      }

      const allConsistent = calculationChecks.every((check) =>
        check.progressChecks.every((pc) => pc.consistent)
      );

      const duration = Date.now() - startTime;

      return {
        success: allConsistent,
        message: allConsistent
          ? 'Progress calculation synchronization working correctly'
          : 'Progress calculation synchronization issues detected',
        details: { browsers, dataChanges, calculationChecks },
        timestamp: new Date(),
        duration,
        browsers,
      };
    } catch (error) {
      return {
        success: false,
        message: `Progress calculation sync test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async testProgressIndicatorSync(): Promise<WorkflowSyncTestResult> {
    const startTime = Date.now();

    try {
      const browsers = ['browser-1', 'browser-2', 'browser-3'];

      await Promise.all(browsers.map((browser) => this.simulation.simulateBrowserConnect(browser)));

      const indicatorUpdates: ProgressIndicator[] = [
        { progress: 25, label: 'Processing...', color: 'blue' },
        { progress: 50, label: 'Halfway done', color: 'yellow' },
        { progress: 75, label: 'Almost complete', color: 'orange' },
        { progress: 100, label: 'Complete', color: 'green' },
      ];

      for (const indicator of indicatorUpdates) {
        await this.simulation.simulateProgressIndicatorUpdate(indicator);

        const indicatorChecks = await Promise.all(
          browsers.map(async (browser) => {
            const browserIndicator = await this.simulation.getBrowserProgressIndicator(browser);
            return {
              browser,
              indicator: browserIndicator,
              synchronized: this.comparison.compareProgressIndicators(indicator, browserIndicator),
            };
          })
        );

        const allSynced = indicatorChecks.every((check) => check.synchronized);
        if (!allSynced) {
          return {
            success: false,
            message: `Progress indicator synchronization failed at ${indicator.progress}%`,
            details: { browsers, indicator, indicatorChecks },
            timestamp: new Date(),
            duration: Date.now() - startTime,
            browsers,
          };
        }
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        message: 'Progress indicator synchronization working correctly',
        details: { browsers, indicatorUpdates, totalUpdates: indicatorUpdates.length },
        timestamp: new Date(),
        duration,
        browsers,
      };
    } catch (error) {
      return {
        success: false,
        message: `Progress indicator sync test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}

