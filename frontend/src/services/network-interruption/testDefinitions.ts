// Network Interruption Test Definitions Module
// Contains all test definitions for network interruption testing
// Extracted from networkInterruptionTester.ts
// Refactored: Test definitions extracted into definitions/ subdirectory

import { NetworkInterruptionTest } from './types';
import {
  connectionLossTests,
  reconnectionTests,
  dataRecoveryTests,
  statePreservationTests,
} from './definitions';

export class NetworkInterruptionTestDefinitions {
  static getAllTests(): NetworkInterruptionTest[] {
    return [
      ...connectionLossTests,
      ...reconnectionTests,
      ...dataRecoveryTests,
      ...statePreservationTests,
    ];
  }
}
