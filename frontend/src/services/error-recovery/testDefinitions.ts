// Error Recovery Test Definitions Module
// Contains all test definitions for error recovery testing
// Extracted from errorRecoveryTester.ts
// Refactored: Test definitions extracted into definitions/ subdirectory

import { ErrorRecoveryTest } from './types';
import {
  retryMechanismTests,
  circuitBreakerTests,
  fallbackStrategyTests,
  errorEscalationTests,
} from './definitions';

export class ErrorRecoveryTestDefinitions {
  static getAllTests(): ErrorRecoveryTest[] {
    return [
      ...retryMechanismTests,
      ...circuitBreakerTests,
      ...fallbackStrategyTests,
      ...errorEscalationTests,
    ];
  }
}
