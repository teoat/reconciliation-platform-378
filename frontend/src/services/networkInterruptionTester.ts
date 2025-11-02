// Network Interruption Testing - Modular Implementation
// Re-exports from the modular structure for backward compatibility

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
