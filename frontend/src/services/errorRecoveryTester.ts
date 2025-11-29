// ============================================================================
// DEPRECATED: Use modular imports instead
// ============================================================================
// This file is kept for backward compatibility only.
// 
// ✅ DO: Import from modular structure
//   import { ErrorRecoveryTester } from '@/services/error-recovery/ErrorRecoveryTester';
//   import type { ErrorRecoveryConfig } from '@/services/error-recovery/types';
//
// ❌ DON'T: Import from this file (deprecated)
//   import { ErrorRecoveryTester } from '@/services/errorRecoveryTester';
//
// This file will be removed in v2.0.0

export type {
  ErrorRecoveryTest,
  ErrorRecoveryTestResult,
  RetryAttempt,
  CircuitBreakerTest,
  FallbackTest,
  EscalationTest,
  ErrorRecoveryConfig,
  TestSuiteResult,
} from './error-recovery/types';

export { ErrorRecoveryTester, default } from './error-recovery/ErrorRecoveryTester';
