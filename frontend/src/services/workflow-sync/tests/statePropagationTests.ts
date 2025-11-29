// ============================================================================
// STATE PROPAGATION TESTS
// ============================================================================

import type { WorkflowSyncTestResult, WorkflowState, DataState } from '../types';
import { WorkflowSyncSimulation } from '../utils/simulation';
import { WorkflowSyncComparison } from '../utils/comparison';

export class StatePropagationTests {
  constructor(
    private simulation: WorkflowSyncSimulation,
    private comparison: WorkflowSyncComparison
  ) {}

  async testWorkflowStatePropagation(): Promise<WorkflowSyncTestResult> {
    const startTime = Date.now();

    try {
      const browsers = ['browser-1', 'browser-2', 'browser-3'];

      await Promise.all(browsers.map((browser) => this.simulation.simulateBrowserConnect(browser)));

      const newState: WorkflowState = { step: 'reconciliation', progress: 50, data: { records: 1000 } };
      await this.simulation.simulateWorkflowStateChange(newState as unknown as Record<string, unknown>);

      const propagationChecks = await Promise.all(
        browsers.map(async (browser) => {
          const browserState = await this.simulation.getBrowserWorkflowState(browser);
          return { browser, propagated: this.comparison.compareWorkflowStates(newState, browserState) };
        })
      );

      const allPropagated = propagationChecks.every((check) => check.propagated);
      const duration = Date.now() - startTime;

      return {
        success: allPropagated,
        message: allPropagated
          ? 'Workflow state propagated to all browsers'
          : 'Workflow state propagation issues detected',
        details: { browsers, newState, propagationChecks },
        timestamp: new Date(),
        duration,
        browsers,
      };
    } catch (error) {
      return {
        success: false,
        message: `Workflow state propagation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async testStepTransitionPropagation(): Promise<WorkflowSyncTestResult> {
    const startTime = Date.now();

    try {
      const browsers = ['browser-1', 'browser-2', 'browser-3'];

      await Promise.all(browsers.map((browser) => this.simulation.simulateBrowserConnect(browser)));

      const stepTransition = { from: 'ingestion', to: 'reconciliation', timestamp: Date.now() };
      await this.simulation.simulateStepTransition(stepTransition);

      const transitionChecks = await Promise.all(
        browsers.map(async (browser) => {
          const browserStep = await this.simulation.getBrowserCurrentStep(browser);
          return { browser, transitioned: browserStep === stepTransition.to };
        })
      );

      const allTransitioned = transitionChecks.every((check) => check.transitioned);
      const duration = Date.now() - startTime;

      return {
        success: allTransitioned,
        message: allTransitioned
          ? 'Step transition propagated to all browsers'
          : 'Step transition propagation issues detected',
        details: { browsers, stepTransition, transitionChecks },
        timestamp: new Date(),
        duration,
        browsers,
      };
    } catch (error) {
      return {
        success: false,
        message: `Step transition propagation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async testDataStatePropagation(): Promise<WorkflowSyncTestResult> {
    const startTime = Date.now();

    try {
      const browsers = ['browser-1', 'browser-2', 'browser-3'];

      await Promise.all(browsers.map((browser) => this.simulation.simulateBrowserConnect(browser)));

      const dataChange: DataState = { records: 1500, matches: 1400, discrepancies: 100 };
      await this.simulation.simulateDataStateChange(dataChange);

      const dataChecks = await Promise.all(
        browsers.map(async (browser) => {
          const browserData = await this.simulation.getBrowserDataState(browser);
          return { browser, propagated: this.comparison.compareDataStates(dataChange, browserData) };
        })
      );

      const allPropagated = dataChecks.every((check) => check.propagated);
      const duration = Date.now() - startTime;

      return {
        success: allPropagated,
        message: allPropagated
          ? 'Data state propagated to all browsers'
          : 'Data state propagation issues detected',
        details: { browsers, dataChange, dataChecks },
        timestamp: new Date(),
        duration,
        browsers,
      };
    } catch (error) {
      return {
        success: false,
        message: `Data state propagation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}

