// Error Escalation Test Definitions
// Extracted from testDefinitions.ts

import { ErrorRecoveryTest, EscalationTest } from '../types';
import { ErrorSimulation } from '../errorSimulation';

export const errorEscalationTests: ErrorRecoveryTest[] = [
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
        const escalationTests: EscalationTest[] = [];

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
        const escalationTests: EscalationTest[] = [];

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
        const escalationTests: EscalationTest[] = [];

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
        const escalationTests: EscalationTest[] = [];

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

