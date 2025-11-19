// Error Simulation Module
// Handles error simulation, retry mechanisms, circuit breaker logic, and recovery utilities
// Extracted from errorRecoveryTester.ts

import { RetryAttempt, CircuitBreakerTest, FallbackTest, EscalationTest } from './types';

export class ErrorSimulation {
  private static circuitBreakerState: 'closed' | 'open' | 'half-open' = 'closed';
  private static failureCount: number = 0;
  private static successCount: number = 0;

  static getCircuitBreakerState(): 'closed' | 'open' | 'half-open' {
    return this.circuitBreakerState;
  }

  static getFailureCount(): number {
    return this.failureCount;
  }

  static getSuccessCount(): number {
    return this.successCount;
  }

  static resetCircuitBreaker(): void {
    this.circuitBreakerState = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
  }

  // Retry Mechanism Simulations
  static async simulateFailingOperation(attempt: number): Promise<{ success: boolean }> {
    // Mock implementation - fails for first 3 attempts, then succeeds
    if (attempt <= 3) {
      throw new Error(`Operation failed on attempt ${attempt}`);
    }
    return { success: true };
  }

  static async simulateOperationWithCircuitBreaker(): Promise<{ success: boolean }> {
    // Mock implementation
    if (this.circuitBreakerState === 'open') {
      throw new Error('Circuit breaker is open');
    }
    return { success: true };
  }

  static async simulateFailingOperationWithCircuitBreaker(): Promise<{ success: boolean }> {
    // Mock implementation - always fails
    throw new Error('Operation failed');
  }

  // Fallback Strategy Simulations
  static async simulateDefaultValueFallback(): Promise<FallbackTest> {
    // Mock implementation
    return {
      fallbackType: 'default-value',
      success: true,
      fallbackData: { value: 'default', timestamp: Date.now() },
      timestamp: new Date(),
    };
  }

  static async simulateCachedDataFallback(): Promise<FallbackTest> {
    // Mock implementation
    return {
      fallbackType: 'cached-data',
      success: true,
      fallbackData: { value: 'cached', timestamp: Date.now() - 300000 },
      timestamp: new Date(),
    };
  }

  static async simulateAlternativeServiceFallback(): Promise<FallbackTest> {
    // Mock implementation
    return {
      fallbackType: 'alternative-service',
      success: true,
      fallbackData: { value: 'alternative', service: 'backup-service' },
      timestamp: new Date(),
    };
  }

  static async simulateUserPromptFallback(): Promise<FallbackTest> {
    // Mock implementation
    return {
      fallbackType: 'user-prompt',
      success: true,
      fallbackData: { prompt: 'Please try again or contact support' },
      timestamp: new Date(),
    };
  }

  // Escalation Simulations
  static async simulateUserLevelEscalation(): Promise<EscalationTest> {
    // Mock implementation
    return {
      escalationLevel: 'user',
      triggered: true,
      escalationReason: 'User action required',
      timestamp: new Date(),
    };
  }

  static async simulateAdminLevelEscalation(): Promise<EscalationTest> {
    // Mock implementation
    return {
      escalationLevel: 'admin',
      triggered: true,
      escalationReason: 'Admin intervention required',
      timestamp: new Date(),
    };
  }

  static async simulateSupportLevelEscalation(): Promise<EscalationTest> {
    // Mock implementation
    return {
      escalationLevel: 'support',
      triggered: true,
      escalationReason: 'Support ticket created',
      timestamp: new Date(),
    };
  }

  static async simulateSystemLevelEscalation(): Promise<EscalationTest> {
    // Mock implementation
    return {
      escalationLevel: 'system',
      triggered: true,
      escalationReason: 'System alert triggered',
      timestamp: new Date(),
    };
  }

  // Circuit Breaker Logic
  static recordFailure(): void {
    this.failureCount++;
    if (this.failureCount >= 3) {
      // Default threshold
      this.circuitBreakerState = 'open';
    }
  }

  static recordSuccess(): void {
    this.successCount++;
    if (this.circuitBreakerState === 'half-open' && this.successCount >= 2) {
      this.circuitBreakerState = 'closed';
      this.failureCount = 0;
    }
  }

  static attemptHalfOpen(): void {
    if (this.circuitBreakerState === 'open') {
      this.circuitBreakerState = 'half-open';
      this.successCount = 0;
    }
  }

  // Retry Logic
  static calculateExponentialBackoff(attempt: number, baseDelay: number = 1000): number {
    return baseDelay * Math.pow(2, attempt - 1);
  }

  static calculateLinearBackoff(attempt: number, baseDelay: number = 1000): number {
    return baseDelay * attempt;
  }

  static calculateFixedDelay(_attempt: number, baseDelay: number = 1000): number {
    return baseDelay;
  }

  static calculateJitterDelay(baseDelay: number, jitterRange: number = 0.1): number {
    const jitter = (Math.random() - 0.5) * 2 * jitterRange * baseDelay;
    return Math.max(0, baseDelay + jitter);
  }

  // Utility methods for creating test data
  static createRetryAttempt(
    attempt: number,
    success: boolean,
    duration: number,
    error?: string,
    backoffDelay?: number
  ): RetryAttempt {
    return {
      attempt,
      success,
      error,
      duration,
      timestamp: new Date(),
      backoffDelay,
    };
  }

  static createCircuitBreakerTest(
    threshold: number = 3,
    testResult: boolean = true
  ): CircuitBreakerTest {
    return {
      state: this.circuitBreakerState,
      failureCount: this.failureCount,
      successCount: this.successCount,
      threshold,
      testResult,
      timestamp: new Date(),
    };
  }

  static simulateNetworkDelay(delayMs: number = 1000): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  static generateTestData(size: number = 100): {
    id: string;
    name: string;
    data: string;
    timestamp: number;
    version: number;
  } {
    return {
      id: Math.random().toString(36).substring(2, 11),
      name: `Test Data ${Date.now()}`,
      data: 'x'.repeat(Math.max(0, size - 50)),
      timestamp: Date.now(),
      version: 1,
    };
  }

  static simulateRandomError(): Error {
    const errors = [
      'Network timeout',
      'Server error',
      'Authentication failed',
      'Rate limit exceeded',
      'Service unavailable',
      'Database connection failed',
    ];
    const randomError = errors[Math.floor(Math.random() * errors.length)];
    return new Error(randomError);
  }
}
