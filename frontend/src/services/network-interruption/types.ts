// Network Interruption Testing Types and Interfaces
// Extracted from networkInterruptionTester.ts for better organization

export interface NetworkInterruptionTest {
  id: string;
  name: string;
  description: string;
  testFunction: () => Promise<NetworkInterruptionTestResult>;
  category: 'connection-loss' | 'reconnection' | 'data-recovery' | 'state-preservation';
  priority: 'high' | 'medium' | 'low';
  requiresNetworkSimulation: boolean;
}

export interface NetworkInterruptionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  duration: number;
  errors?: string[];
  networkEvents?: NetworkEvent[];
  dataLoss?: DataLossInfo[];
  recoveryActions?: RecoveryAction[];
}

export interface NetworkEvent {
  type: 'disconnect' | 'reconnect' | 'timeout' | 'slow-connection';
  timestamp: Date;
  duration?: number;
  impact: 'low' | 'medium' | 'high';
}

export interface DataLossInfo {
  type: 'form-data' | 'upload-progress' | 'workflow-state' | 'user-input';
  severity: 'low' | 'medium' | 'high';
  recoverable: boolean;
  timestamp: Date;
}

export interface RecoveryAction {
  type: 'auto-save' | 'retry' | 'rollback' | 'notify-user';
  success: boolean;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export interface NetworkInterruptionConfig {
  testTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableConnectionLossTests: boolean;
  enableReconnectionTests: boolean;
  enableDataRecoveryTests: boolean;
  enableStatePreservationTests: boolean;
  networkSimulationDelay: number;
}

export interface TestSuiteResult {
  total: number;
  passed: number;
  failed: number;
  successRate: number;
  averageDuration: number;
  totalNetworkEvents: number;
  totalDataLoss: number;
  totalRecoveryActions: number;
}
