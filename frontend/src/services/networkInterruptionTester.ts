// ============================================================================
// DEPRECATED: Use modular imports instead
// ============================================================================
// This file is kept for backward compatibility only.
// 
// ✅ DO: Import from modular structure
//   import { NetworkInterruptionTester } from '@/services/network-interruption/NetworkInterruptionTester';
//   import type { NetworkInterruptionConfig } from '@/services/network-interruption/types';
//
// ❌ DON'T: Import from this file (deprecated)
//   import { NetworkInterruptionTester } from '@/services/networkInterruptionTester';
//
// This file will be removed in v2.0.0

export type {
  NetworkInterruptionTest,
  NetworkInterruptionTestResult,
  NetworkEvent,
  DataLossInfo,
  RecoveryAction,
  NetworkInterruptionConfig,
  TestSuiteResult,
} from './network-interruption/types';

export {
  NetworkInterruptionTester,
  default,
} from './network-interruption/NetworkInterruptionTester';
