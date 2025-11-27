// ============================================================================
// WORKFLOW SYNC COMPARISON UTILITIES
// ============================================================================

import type {
  WorkflowState,
  DataState,
  StepValidation,
  StepPermissions,
  ProgressIndicator,
  ErrorState,
  RecoveryState,
  RollbackState,
} from '../types';

export class WorkflowSyncComparison {
  compareWorkflowStates(state1: WorkflowState, state2: WorkflowState): boolean {
    return state1.step === state2.step && state1.progress === state2.progress;
  }

  compareDataStates(data1: DataState, data2: DataState): boolean {
    return (
      data1.records === data2.records &&
      data1.matches === data2.matches &&
      data1.discrepancies === data2.discrepancies
    );
  }

  compareValidationResults(validation1: StepValidation, validation2: StepValidation): boolean {
    return (
      validation1.valid === validation2.valid &&
      validation1.errors.length === validation2.errors.length &&
      validation1.warnings.length === validation2.warnings.length
    );
  }

  comparePermissions(permissions1: StepPermissions, permissions2: StepPermissions): boolean {
    return (
      permissions1.canEdit === permissions2.canEdit &&
      permissions1.canDelete === permissions2.canDelete &&
      permissions1.canAdvance === permissions2.canAdvance
    );
  }

  compareProgressIndicators(indicator1: ProgressIndicator, indicator2: ProgressIndicator): boolean {
    return (
      indicator1.progress === indicator2.progress &&
      indicator1.label === indicator2.label &&
      indicator1.color === indicator2.color
    );
  }

  compareErrorStates(error1: ErrorState, error2: ErrorState): boolean {
    return (
      error1.hasError === error2.hasError &&
      error1.errorType === error2.errorType &&
      error1.message === error2.message
    );
  }

  compareRecoveryStates(recovery1: RecoveryState, recovery2: RecoveryState): boolean {
    return (
      recovery1.isRecovering === recovery2.isRecovering &&
      recovery1.recoveryStep === recovery2.recoveryStep &&
      recovery1.progress === recovery2.progress
    );
  }

  compareRollbackStates(rollback1: RollbackState, rollback2: RollbackState): boolean {
    return (
      rollback1.isRollingBack === rollback2.isRollingBack &&
      rollback1.rollbackStep === rollback2.rollbackStep &&
      rollback1.progress === rollback2.progress
    );
  }

  calculateProgress(data: DataState): number {
    if (data.records === 0) return 0;
    return Math.round((data.matches / data.records) * 100);
  }
}

