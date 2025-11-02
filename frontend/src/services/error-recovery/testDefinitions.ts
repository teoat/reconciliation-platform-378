// Error Recovery Test Definitions Module
// Contains all test definitions for error recovery testing
// Extracted from errorRecoveryTester.ts

import { ErrorRecoveryTest } from './types';
import { ErrorSimulation } from './errorSimulation';

export class ErrorRecoveryTestDefinitions {
  static getAllTests(): ErrorRecoveryTest[] {
    return [
      // Retry Mechanism Tests
      {
        id: 'exponential-backoff-retry',
        name: 'Exponential Backoff Retry',
        description: 'Verify exponential backoff retry mechanism works correctly',
        category: 'retry-mechanisms',
        priority: 'high',
        requiresErrorSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const retryAttempts: any[] = [];
            let success = false;
            const maxAttempts = 5;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
              const attemptStart = Date.now();

              try {
                const result = await ErrorSimulation.simulateFailingOperation(attempt);
                success = result.success;

                retryAttempts.push(
                  ErrorSimulation.createRetryAttempt(attempt, true, Date.now() - attemptStart)
                );

                if (success) break;
              } catch (error) {
                const backoffDelay = ErrorSimulation.calculateExponentialBackoff(attempt);

                retryAttempts.push(
                  ErrorSimulation.createRetryAttempt(
                    attempt,
                    false,
                    Date.now() - attemptStart,
                    error instanceof Error ? error.message : 'Unknown error',
                    backoffDelay
                  )
                );

                if (attempt < maxAttempts) {
                  await ErrorSimulation.simulateNetworkDelay(backoffDelay);
                }
              }
            }

            const duration = Date.now() - startTime;

            return {
              success,
              message: success
                ? 'Exponential backoff retry successful'
                : 'Exponential backoff retry failed',
              details: {
                retryAttempts,
                totalAttempts: retryAttempts.length,
                finalSuccess: success,
              },
              timestamp: new Date(),
              duration,
              retryAttempts,
            };
          } catch (error) {
            return {
              success: false,
              message: `Exponential backoff retry test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'linear-backoff-retry',
        name: 'Linear Backoff Retry',
        description: 'Verify linear backoff retry mechanism works correctly',
        category: 'retry-mechanisms',
        priority: 'high',
        requiresErrorSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const retryAttempts: any[] = [];
            let success = false;
            const maxAttempts = 5;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
              const attemptStart = Date.now();

              try {
                const result = await ErrorSimulation.simulateFailingOperation(attempt);
                success = result.success;

                retryAttempts.push(
                  ErrorSimulation.createRetryAttempt(attempt, true, Date.now() - attemptStart)
                );

                if (success) break;
              } catch (error) {
                const backoffDelay = ErrorSimulation.calculateLinearBackoff(attempt);

                retryAttempts.push(
                  ErrorSimulation.createRetryAttempt(
                    attempt,
                    false,
                    Date.now() - attemptStart,
                    error instanceof Error ? error.message : 'Unknown error',
                    backoffDelay
                  )
                );

                if (attempt < maxAttempts) {
                  await ErrorSimulation.simulateNetworkDelay(backoffDelay);
                }
              }
            }

            const duration = Date.now() - startTime;

            return {
              success,
              message: success ? 'Linear backoff retry successful' : 'Linear backoff retry failed',
              details: {
                retryAttempts,
                totalAttempts: retryAttempts.length,
                finalSuccess: success,
              },
              timestamp: new Date(),
              duration,
              retryAttempts,
            };
          } catch (error) {
            return {
              success: false,
              message: `Linear backoff retry test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'fixed-delay-retry',
        name: 'Fixed Delay Retry',
        description: 'Verify fixed delay retry mechanism works correctly',
        category: 'retry-mechanisms',
        priority: 'medium',
        requiresErrorSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const retryAttempts: any[] = [];
            let success = false;
            const maxAttempts = 5;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
              const attemptStart = Date.now();

              try {
                const result = await ErrorSimulation.simulateFailingOperation(attempt);
                success = result.success;

                retryAttempts.push(
                  ErrorSimulation.createRetryAttempt(attempt, true, Date.now() - attemptStart)
                );

                if (success) break;
              } catch (error) {
                const backoffDelay = ErrorSimulation.calculateFixedDelay(attempt);

                retryAttempts.push(
                  ErrorSimulation.createRetryAttempt(
                    attempt,
                    false,
                    Date.now() - attemptStart,
                    error instanceof Error ? error.message : 'Unknown error',
                    backoffDelay
                  )
                );

                if (attempt < maxAttempts) {
                  await ErrorSimulation.simulateNetworkDelay(backoffDelay);
                }
              }
            }

            const duration = Date.now() - startTime;

            return {
              success,
              message: success ? 'Fixed delay retry successful' : 'Fixed delay retry failed',
              details: {
                retryAttempts,
                totalAttempts: retryAttempts.length,
                finalSuccess: success,
              },
              timestamp: new Date(),
              duration,
              retryAttempts,
            };
          } catch (error) {
            return {
              success: false,
              message: `Fixed delay retry test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'jitter-retry',
        name: 'Jitter Retry',
        description: 'Verify jitter retry mechanism works correctly',
        category: 'retry-mechanisms',
        priority: 'medium',
        requiresErrorSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const retryAttempts: any[] = [];
            let success = false;
            const maxAttempts = 5;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
              const attemptStart = Date.now();

              try {
                const result = await ErrorSimulation.simulateFailingOperation(attempt);
                success = result.success;

                retryAttempts.push(
                  ErrorSimulation.createRetryAttempt(attempt, true, Date.now() - attemptStart)
                );

                if (success) break;
              } catch (error) {
                const baseDelay = 1000;
                const backoffDelay = ErrorSimulation.calculateJitterDelay(baseDelay);

                retryAttempts.push(
                  ErrorSimulation.createRetryAttempt(
                    attempt,
                    false,
                    Date.now() - attemptStart,
                    error instanceof Error ? error.message : 'Unknown error',
                    backoffDelay
                  )
                );

                if (attempt < maxAttempts) {
                  await ErrorSimulation.simulateNetworkDelay(backoffDelay);
                }
              }
            }

            const duration = Date.now() - startTime;

            return {
              success,
              message: success ? 'Jitter retry successful' : 'Jitter retry failed',
              details: {
                retryAttempts,
                totalAttempts: retryAttempts.length,
                finalSuccess: success,
              },
              timestamp: new Date(),
              duration,
              retryAttempts,
            };
          } catch (error) {
            return {
              success: false,
              message: `Jitter retry test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      // Circuit Breaker Tests
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
            const circuitBreakerTests: any[] = [];

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
            const circuitBreakerTests: any[] = [];

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
            const circuitBreakerTests: any[] = [];

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
            const circuitBreakerTests: any[] = [];

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

      // Fallback Strategy Tests
      {
        id: 'default-value-fallback',
        name: 'Default Value Fallback',
        description: 'Verify default value fallback strategy works correctly',
        category: 'fallback-strategies',
        priority: 'high',
        requiresErrorSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const fallbackTests: any[] = [];

            // Test default value fallback
            const fallbackResult = await ErrorSimulation.simulateDefaultValueFallback();
            fallbackTests.push(fallbackResult);

            const testResult =
              fallbackResult.success && fallbackResult.fallbackType === 'default-value';

            const duration = Date.now() - startTime;

            return {
              success: testResult,
              message: testResult
                ? 'Default value fallback working correctly'
                : 'Default value fallback test failed',
              details: {
                fallbackResult,
                fallbackTests,
              },
              timestamp: new Date(),
              duration,
              fallbackTests,
            };
          } catch (error) {
            return {
              success: false,
              message: `Default value fallback test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'cached-data-fallback',
        name: 'Cached Data Fallback',
        description: 'Verify cached data fallback strategy works correctly',
        category: 'fallback-strategies',
        priority: 'high',
        requiresErrorSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const fallbackTests: any[] = [];

            // Test cached data fallback
            const fallbackResult = await ErrorSimulation.simulateCachedDataFallback();
            fallbackTests.push(fallbackResult);

            const testResult =
              fallbackResult.success && fallbackResult.fallbackType === 'cached-data';

            const duration = Date.now() - startTime;

            return {
              success: testResult,
              message: testResult
                ? 'Cached data fallback working correctly'
                : 'Cached data fallback test failed',
              details: {
                fallbackResult,
                fallbackTests,
              },
              timestamp: new Date(),
              duration,
              fallbackTests,
            };
          } catch (error) {
            return {
              success: false,
              message: `Cached data fallback test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'alternative-service-fallback',
        name: 'Alternative Service Fallback',
        description: 'Verify alternative service fallback strategy works correctly',
        category: 'fallback-strategies',
        priority: 'high',
        requiresErrorSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const fallbackTests: any[] = [];

            // Test alternative service fallback
            const fallbackResult = await ErrorSimulation.simulateAlternativeServiceFallback();
            fallbackTests.push(fallbackResult);

            const testResult =
              fallbackResult.success && fallbackResult.fallbackType === 'alternative-service';

            const duration = Date.now() - startTime;

            return {
              success: testResult,
              message: testResult
                ? 'Alternative service fallback working correctly'
                : 'Alternative service fallback test failed',
              details: {
                fallbackResult,
                fallbackTests,
              },
              timestamp: new Date(),
              duration,
              fallbackTests,
            };
          } catch (error) {
            return {
              success: false,
              message: `Alternative service fallback test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'user-prompt-fallback',
        name: 'User Prompt Fallback',
        description: 'Verify user prompt fallback strategy works correctly',
        category: 'fallback-strategies',
        priority: 'medium',
        requiresErrorSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const fallbackTests: any[] = [];

            // Test user prompt fallback
            const fallbackResult = await ErrorSimulation.simulateUserPromptFallback();
            fallbackTests.push(fallbackResult);

            const testResult =
              fallbackResult.success && fallbackResult.fallbackType === 'user-prompt';

            const duration = Date.now() - startTime;

            return {
              success: testResult,
              message: testResult
                ? 'User prompt fallback working correctly'
                : 'User prompt fallback test failed',
              details: {
                fallbackResult,
                fallbackTests,
              },
              timestamp: new Date(),
              duration,
              fallbackTests,
            };
          } catch (error) {
            return {
              success: false,
              message: `User prompt fallback test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      // Error Escalation Tests
      {
        id: 'user-level-escalation',
        name: 'User Level Escalation',
        description: 'Verify user level error escalation works correctly',
        category: 'error-escalation',
        priority: 'high',
        requiresErrorSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const escalationTests: any[] = [];

            // Test user level escalation
            const escalationResult = await ErrorSimulation.simulateUserLevelEscalation();
            escalationTests.push(escalationResult);

            const testResult =
              escalationResult.triggered && escalationResult.escalationLevel === 'user';

            const duration = Date.now() - startTime;

            return {
              success: testResult,
              message: testResult
                ? 'User level escalation working correctly'
                : 'User level escalation test failed',
              details: {
                escalationResult,
                escalationTests,
              },
              timestamp: new Date(),
              duration,
              escalationTests,
            };
          } catch (error) {
            return {
              success: false,
              message: `User level escalation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'admin-level-escalation',
        name: 'Admin Level Escalation',
        description: 'Verify admin level error escalation works correctly',
        category: 'error-escalation',
        priority: 'high',
        requiresErrorSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const escalationTests: any[] = [];

            // Test admin level escalation
            const escalationResult = await ErrorSimulation.simulateAdminLevelEscalation();
            escalationTests.push(escalationResult);

            const testResult =
              escalationResult.triggered && escalationResult.escalationLevel === 'admin';

            const duration = Date.now() - startTime;

            return {
              success: testResult,
              message: testResult
                ? 'Admin level escalation working correctly'
                : 'Admin level escalation test failed',
              details: {
                escalationResult,
                escalationTests,
              },
              timestamp: new Date(),
              duration,
              escalationTests,
            };
          } catch (error) {
            return {
              success: false,
              message: `Admin level escalation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'support-level-escalation',
        name: 'Support Level Escalation',
        description: 'Verify support level error escalation works correctly',
        category: 'error-escalation',
        priority: 'medium',
        requiresErrorSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const escalationTests: any[] = [];

            // Test support level escalation
            const escalationResult = await ErrorSimulation.simulateSupportLevelEscalation();
            escalationTests.push(escalationResult);

            const testResult =
              escalationResult.triggered && escalationResult.escalationLevel === 'support';

            const duration = Date.now() - startTime;

            return {
              success: testResult,
              message: testResult
                ? 'Support level escalation working correctly'
                : 'Support level escalation test failed',
              details: {
                escalationResult,
                escalationTests,
              },
              timestamp: new Date(),
              duration,
              escalationTests,
            };
          } catch (error) {
            return {
              success: false,
              message: `Support level escalation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'system-level-escalation',
        name: 'System Level Escalation',
        description: 'Verify system level error escalation works correctly',
        category: 'error-escalation',
        priority: 'medium',
        requiresErrorSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const escalationTests: any[] = [];

            // Test system level escalation
            const escalationResult = await ErrorSimulation.simulateSystemLevelEscalation();
            escalationTests.push(escalationResult);

            const testResult =
              escalationResult.triggered && escalationResult.escalationLevel === 'system';

            const duration = Date.now() - startTime;

            return {
              success: testResult,
              message: testResult
                ? 'System level escalation working correctly'
                : 'System level escalation test failed',
              details: {
                escalationResult,
                escalationTests,
              },
              timestamp: new Date(),
              duration,
              escalationTests,
            };
          } catch (error) {
            return {
              success: false,
              message: `System level escalation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },
    ];
  }
}
