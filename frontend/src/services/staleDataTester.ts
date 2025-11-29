// ============================================================================
// DEPRECATED: Use modular imports instead
// ============================================================================
// This file is kept for backward compatibility only.
// 
// ✅ DO: Import from modular structure
//   import { StaleDataTester } from '@/services/stale-data/StaleDataTester';
//   import type { StaleDataConfig } from '@/services/stale-data/types';
//
// ❌ DON'T: Import from this file (deprecated)
//   import { StaleDataTester } from '@/services/staleDataTester';
//
// This file will be removed in v2.0.0

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
