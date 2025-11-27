// Retry Mechanism Test Definitions
// Extracted from testDefinitions.ts

import { ErrorRecoveryTest, RetryAttempt } from '../types';
import { ErrorSimulation } from '../errorSimulation';

export const retryMechanismTests: ErrorRecoveryTest[] = [
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
        const retryAttempts: RetryAttempt[] = [];
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
        const retryAttempts: RetryAttempt[] = [];
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
        const retryAttempts: RetryAttempt[] = [];
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
        const retryAttempts: RetryAttempt[] = [];
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
];
