// Stale Data Detection Testing - Modular Implementation
// Re-exports from the modular structure for backward compatibility

export type {
  StaleDataTest,
  StaleDataTestResult,
  StaleDataInfo,
  FreshnessCheck,
  RefreshAction,
  StaleDataConfig,
  TestSuiteResult,
} from './stale-data/types';

export { StaleDataTester, default } from './stale-data/StaleDataTester';
