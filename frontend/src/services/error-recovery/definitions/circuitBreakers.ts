// Circuit Breaker Test Definitions
// Extracted from testDefinitions.ts

import { ErrorRecoveryTest, CircuitBreakerTest } from '../types';
import { ErrorSimulation } from '../errorSimulation';

export const circuitBreakerTests: ErrorRecoveryTest[] = [
  {
    id: 'circuit-breaker-closed',
    name: 'Circuit Breaker Closed State',
    description: 'Verify circuit breaker closed state works correctly',
    category: 'circuit-breakers',
    priority: 'high',
    requiresErrorSimulation: true,
    testFunction: async () => {
      const startTime = Date.now();

      try {
        const circuitBreakerTests: CircuitBreakerTest[] = [];

        // Reset circuit breaker to closed state
        ErrorSimulation.resetCircuitBreaker();

        // Test successful operations in closed state
        for (let i = 0; i < 3; i++) {
          try {
            await ErrorSimulation.simulateOperationWithCircuitBreaker();
            ErrorSimulation.recordSuccess();
          } catch (error) {
            ErrorSimulation.recordFailure();
          }
        }

        const testResult = ErrorSimulation.getCircuitBreakerState() === 'closed';
        circuitBreakerTests.push(ErrorSimulation.createCircuitBreakerTest(3, testResult));

        const duration = Date.now() - startTime;

        return {
          success: testResult,
          message: testResult
            ? 'Circuit breaker closed state working correctly'
            : 'Circuit breaker closed state test failed',
          details: {
            finalState: ErrorSimulation.getCircuitBreakerState(),
            failureCount: ErrorSimulation.getFailureCount(),
            successCount: ErrorSimulation.getSuccessCount(),
            circuitBreakerTests,
          },
          timestamp: new Date(),
          duration,
          circuitBreakerTests,
        };
      } catch (error) {
        return {
          success: false,
          message: `Circuit breaker closed state test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },

  {
    id: 'circuit-breaker-open',
    name: 'Circuit Breaker Open State',
    description: 'Verify circuit breaker open state works correctly',
    category: 'circuit-breakers',
    priority: 'high',
    requiresErrorSimulation: true,
    testFunction: async () => {
      const startTime = Date.now();

      try {
        const circuitBreakerTests: CircuitBreakerTest[] = [];

        // Reset and force open state by recording failures
        ErrorSimulation.resetCircuitBreaker();

        for (let i = 0; i < 5; i++) {
          try {
            await ErrorSimulation.simulateFailingOperationWithCircuitBreaker();
          } catch (error) {
            ErrorSimulation.recordFailure();
          }
        }

        const testResult = ErrorSimulation.getCircuitBreakerState() === 'open';
        circuitBreakerTests.push(ErrorSimulation.createCircuitBreakerTest(3, testResult));

        const duration = Date.now() - startTime;

        return {
          success: testResult,
          message: testResult
            ? 'Circuit breaker open state working correctly'
            : 'Circuit breaker open state test failed',
          details: {
            finalState: ErrorSimulation.getCircuitBreakerState(),
            failureCount: ErrorSimulation.getFailureCount(),
            successCount: ErrorSimulation.getSuccessCount(),
            circuitBreakerTests,
          },
          timestamp: new Date(),
          duration,
          circuitBreakerTests,
        };
      } catch (error) {
        return {
          success: false,
          message: `Circuit breaker open state test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },

  {
    id: 'circuit-breaker-half-open',
    name: 'Circuit Breaker Half-Open State',
    description: 'Verify circuit breaker half-open state works correctly',
    category: 'circuit-breakers',
    priority: 'high',
    requiresErrorSimulation: true,
    testFunction: async () => {
      const startTime = Date.now();

      try {
        const circuitBreakerTests: CircuitBreakerTest[] = [];

        // Reset and force open state, then attempt half-open
        ErrorSimulation.resetCircuitBreaker();

        for (let i = 0; i < 5; i++) {
          try {
            await ErrorSimulation.simulateFailingOperationWithCircuitBreaker();
          } catch (error) {
            ErrorSimulation.recordFailure();
          }
        }

        // Attempt to go to half-open
        ErrorSimulation.attemptHalfOpen();

        const testResult = ErrorSimulation.getCircuitBreakerState() === 'half-open';
        circuitBreakerTests.push(ErrorSimulation.createCircuitBreakerTest(3, testResult));

        const duration = Date.now() - startTime;

        return {
          success: testResult,
          message: testResult
            ? 'Circuit breaker half-open state working correctly'
            : 'Circuit breaker half-open state test failed',
          details: {
            finalState: ErrorSimulation.getCircuitBreakerState(),
            failureCount: ErrorSimulation.getFailureCount(),
            successCount: ErrorSimulation.getSuccessCount(),
            circuitBreakerTests,
          },
          timestamp: new Date(),
          duration,
          circuitBreakerTests,
        };
      } catch (error) {
        return {
          success: false,
          message: `Circuit breaker half-open state test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },

  {
    id: 'circuit-breaker-recovery',
    name: 'Circuit Breaker Recovery',
    description: 'Verify circuit breaker recovery works correctly',
    category: 'circuit-breakers',
    priority: 'medium',
    requiresErrorSimulation: true,
    testFunction: async () => {
      const startTime = Date.now();

      try {
        const circuitBreakerTests: CircuitBreakerTest[] = [];

        // Reset and force open state, then attempt recovery
        ErrorSimulation.resetCircuitBreaker();

        for (let i = 0; i < 5; i++) {
          try {
            await ErrorSimulation.simulateFailingOperationWithCircuitBreaker();
          } catch (error) {
            ErrorSimulation.recordFailure();
          }
        }

        // Attempt recovery through half-open state
        ErrorSimulation.attemptHalfOpen();

        // Simulate successful operations in half-open state
        for (let i = 0; i < 3; i++) {
          try {
            await ErrorSimulation.simulateOperationWithCircuitBreaker();
            ErrorSimulation.recordSuccess();
          } catch (error) {
            ErrorSimulation.recordFailure();
          }
        }

        const testResult = ErrorSimulation.getCircuitBreakerState() === 'closed';
        circuitBreakerTests.push(ErrorSimulation.createCircuitBreakerTest(3, testResult));

        const duration = Date.now() - startTime;

        return {
          success: testResult,
          message: testResult
            ? 'Circuit breaker recovery working correctly'
            : 'Circuit breaker recovery test failed',
          details: {
            finalState: ErrorSimulation.getCircuitBreakerState(),
            failureCount: ErrorSimulation.getFailureCount(),
            successCount: ErrorSimulation.getSuccessCount(),
            circuitBreakerTests,
          },
          timestamp: new Date(),
          duration,
          circuitBreakerTests,
        };
      } catch (error) {
        return {
          success: false,
          message: `Circuit breaker recovery test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },
];

