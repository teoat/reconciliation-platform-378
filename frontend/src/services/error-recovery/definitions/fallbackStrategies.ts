// Fallback Strategy Test Definitions
// Extracted from testDefinitions.ts

import { ErrorRecoveryTest, FallbackTest } from '../types';
import { ErrorSimulation } from '../errorSimulation';

export const fallbackStrategyTests: ErrorRecoveryTest[] = [
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
        const fallbackTests: FallbackTest[] = [];

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
        const fallbackTests: FallbackTest[] = [];

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
        const fallbackTests: FallbackTest[] = [];

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
        const fallbackTests: FallbackTest[] = [];

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
];

