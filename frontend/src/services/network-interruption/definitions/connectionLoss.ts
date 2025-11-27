// Connection Loss Test Definitions
// Extracted from testDefinitions.ts

import { NetworkInterruptionTest, NetworkEvent, DataLossInfo, RecoveryAction } from '../types';
import { NetworkSimulation } from '../networkSimulation';

export const connectionLossTests: NetworkInterruptionTest[] = [
  {
    id: 'sudden-disconnection',
    name: 'Sudden Disconnection Handling',
    description: 'Verify graceful handling of sudden network disconnection',
    category: 'connection-loss',
    priority: 'high',
    requiresNetworkSimulation: true,
    testFunction: async () => {
      const startTime = Date.now();

      try {
        const networkEvents: NetworkEvent[] = [];
        const dataLoss: DataLossInfo[] = [];
        const recoveryActions: RecoveryAction[] = [];

        // Simulate normal operation
        await NetworkSimulation.simulateNormalOperation();

        // Simulate sudden disconnection
        const disconnectEvent = NetworkSimulation.createNetworkEvent('disconnect', 'high');
        networkEvents.push(disconnectEvent);

        await NetworkSimulation.simulateNetworkDisconnection();

        // Check if disconnection was handled gracefully
        const disconnectionHandled = await NetworkSimulation.checkDisconnectionHandling();

        // Simulate reconnection
        const reconnectEvent = NetworkSimulation.createNetworkEvent('reconnect', 'medium');
        networkEvents.push(reconnectEvent);

        await NetworkSimulation.simulateNetworkReconnection();

        // Check if reconnection was successful
        const reconnectionSuccessful = await NetworkSimulation.checkReconnectionSuccess();

        const duration = Date.now() - startTime;

        return {
          success: disconnectionHandled && reconnectionSuccessful,
          message:
            disconnectionHandled && reconnectionSuccessful
              ? 'Sudden disconnection handled gracefully'
              : 'Sudden disconnection handling issues detected',
          details: {
            disconnectionHandled,
            reconnectionSuccessful,
            networkEvents,
            dataLoss,
            recoveryActions,
          },
          timestamp: new Date(),
          duration,
          networkEvents,
          dataLoss,
          recoveryActions,
        };
      } catch (error) {
        return {
          success: false,
          message: `Sudden disconnection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },

  {
    id: 'gradual-disconnection',
    name: 'Gradual Disconnection Handling',
    description: 'Verify handling of gradually degrading network connection',
    category: 'connection-loss',
    priority: 'medium',
    requiresNetworkSimulation: true,
    testFunction: async () => {
      const startTime = Date.now();

      try {
        const networkEvents: NetworkEvent[] = [];
        const dataLoss: DataLossInfo[] = [];
        const recoveryActions: RecoveryAction[] = [];

        // Simulate normal operation
        await NetworkSimulation.simulateNormalOperation();

        // Simulate gradual disconnection (slow connection first)
        const slowEvent = NetworkSimulation.createNetworkEvent('slow-connection', 'medium');
        networkEvents.push(slowEvent);

        await NetworkSimulation.simulateSlowConnection();
        await NetworkSimulation.simulateNetworkDelay(2000);

        // Then full disconnection
        const disconnectEvent = NetworkSimulation.createNetworkEvent('disconnect', 'high');
        networkEvents.push(disconnectEvent);

        await NetworkSimulation.simulateNetworkDisconnection();

        // Check gradual disconnection handling
        const gradualHandling = await NetworkSimulation.checkGradualDisconnectionHandling();

        const duration = Date.now() - startTime;

        return {
          success: gradualHandling,
          message: gradualHandling
            ? 'Gradual disconnection handled correctly'
            : 'Gradual disconnection handling issues detected',
          details: {
            gradualHandling,
            networkEvents,
            dataLoss,
            recoveryActions,
          },
          timestamp: new Date(),
          duration,
          networkEvents,
          dataLoss,
          recoveryActions,
        };
      } catch (error) {
        return {
          success: false,
          message: `Gradual disconnection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },

  {
    id: 'intermittent-connection',
    name: 'Intermittent Connection Handling',
    description: 'Verify handling of intermittent network connectivity',
    category: 'connection-loss',
    priority: 'high',
    requiresNetworkSimulation: true,
    testFunction: async () => {
      const startTime = Date.now();

      try {
        const networkEvents: NetworkEvent[] = [];
        const dataLoss: DataLossInfo[] = [];
        const recoveryActions: RecoveryAction[] = [];

        // Simulate intermittent connection (multiple connect/disconnect cycles)
        for (let i = 0; i < 3; i++) {
          // Disconnect
          const disconnectEvent = NetworkSimulation.createNetworkEvent('disconnect', 'medium');
          networkEvents.push(disconnectEvent);
          await NetworkSimulation.simulateNetworkDisconnection();
          await NetworkSimulation.simulateNetworkDelay(1000);

          // Reconnect
          const reconnectEvent = NetworkSimulation.createNetworkEvent('reconnect', 'medium');
          networkEvents.push(reconnectEvent);
          await NetworkSimulation.simulateNetworkReconnection();
          await NetworkSimulation.simulateNetworkDelay(1000);
        }

        // Check intermittent connection handling
        const intermittentHandling =
          await NetworkSimulation.checkIntermittentConnectionHandling();

        const duration = Date.now() - startTime;

        return {
          success: intermittentHandling,
          message: intermittentHandling
            ? 'Intermittent connection handled correctly'
            : 'Intermittent connection handling issues detected',
          details: {
            intermittentHandling,
            networkEvents,
            dataLoss,
            recoveryActions,
          },
          timestamp: new Date(),
          duration,
          networkEvents,
          dataLoss,
          recoveryActions,
        };
      } catch (error) {
        return {
          success: false,
          message: `Intermittent connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },
];

