// Error Recovery Testing Types and Interfaces
// Extracted from errorRecoveryTester.ts for better organization

export interface ErrorRecoveryTest {
  id: string;
  name: string;
  description: string;
  testFunction: () => Promise<ErrorRecoveryTestResult>;
  category: 'retry-mechanisms' | 'circuit-breakers' | 'fallback-strategies' | 'error-escalation';
  priority: 'high' | 'medium' | 'low';
  requiresErrorSimulation: boolean;
}

export interface ErrorRecoveryTestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: Date;
  duration: number;
  errors?: string[];
  retryAttempts?: RetryAttempt[];
  circuitBreakerTests?: CircuitBreakerTest[];
  fallbackTests?: FallbackTest[];
  escalationTests?: EscalationTest[];
}

export interface RetryAttempt {
  attempt: number;
  success: boolean;
  error?: string;
  duration: number;
  timestamp: Date;
  backoffDelay?: number;
}

export interface CircuitBreakerTest {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  threshold: number;
  testResult: boolean;
  timestamp: Date;
}

export interface FallbackTest {
  fallbackType: 'default-value' | 'cached-data' | 'alternative-service' | 'user-prompt';
  success: boolean;
  fallbackData?: any;
  timestamp: Date;
}

export interface EscalationTest {
  escalationLevel: 'user' | 'admin' | 'support' | 'system';
  triggered: boolean;
  escalationReason: string;
  timestamp: Date;
}

export interface ErrorRecoveryConfig {
  testTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableRetryMechanismTests: boolean;
  enableCircuitBreakerTests: boolean;
  enableFallbackStrategyTests: boolean;
  enableErrorEscalationTests: boolean;
  maxRetryAttempts: number;
  circuitBreakerThreshold: number;
}

export interface TestSuiteResult {
  total: number;
  passed: number;
  failed: number;
  successRate: number;
  averageDuration: number;
  totalRetryAttempts: number;
  totalCircuitBreakerTests: number;
  totalFallbackTests: number;
  totalEscalationTests: number;
}
