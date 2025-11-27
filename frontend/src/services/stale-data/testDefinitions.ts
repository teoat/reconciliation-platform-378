// Stale Data Test Definitions Module
// Contains all test definitions for stale data detection testing
// Extracted from staleDataTester.ts
// Refactored: Test definitions extracted into definitions/ subdirectory

import { StaleDataTest } from './types';
import {
  timestampBasedTests,
  versionBasedTests,
  checksumBasedTests,
  hybridDetectionTests,
} from './definitions';

export class StaleDataTestDefinitions {
  static getAllTests(): StaleDataTest[] {
    return [
      ...timestampBasedTests,
      ...versionBasedTests,
      ...checksumBasedTests,
      ...hybridDetectionTests,
    ];
  }
}
