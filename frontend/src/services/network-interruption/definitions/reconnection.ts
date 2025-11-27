// Reconnection Test Definitions
// Extracted from testDefinitions.ts

import { NetworkInterruptionTest, NetworkEvent, DataLossInfo, RecoveryAction } from '../types';
import { NetworkSimulation } from '../networkSimulation';

export const reconnectionTests: NetworkInterruptionTest[] = [
  {
    id: 'automatic-reconnection',
    name: 'Automatic Reconnection',
    description: 'Verify automatic reconnection when network is restored',
    category: 'reconnection',
    priority: 'high',
    requiresNetworkSimulation: true,
    testFunction: async () => {
      const startTime = Date.now();

      try {
        const networkEvents: NetworkEvent[] = [];
        const dataLoss: DataLossInfo[] = [];
        const recoveryActions: RecoveryAction[] = [];

        // Simulate disconnection
        const disconnectEvent = NetworkSimulation.createNetworkEvent('disconnect', 'high');
        networkEvents.push(disconnectEvent);
        await NetworkSimulation.simulateNetworkDisconnection();

        // Simulate reconnection
        const reconnectEvent = NetworkSimulation.createNetworkEvent('reconnect', 'medium');
        networkEvents.push(reconnectEvent);
        await NetworkSimulation.simulateNetworkReconnection();

        // Check automatic reconnection
        const autoReconnection = await NetworkSimulation.checkAutomaticReconnection();

        const duration = Date.now() - startTime;

        return {
          success: autoReconnection,
          message: autoReconnection
            ? 'Automatic reconnection working correctly'
            : 'Automatic reconnection issues detected',
          details: {
            autoReconnection,
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
          message: `Automatic reconnection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },

  {
    id: 'reconnection-validation',
    name: 'Reconnection Validation',
    description: 'Verify data validation after reconnection',
    category: 'reconnection',
    priority: 'high',
    requiresNetworkSimulation: true,
    testFunction: async () => {
      const startTime = Date.now();

      try {
        const networkEvents: NetworkEvent[] = [];
        const dataLoss: DataLossInfo[] = [];
        const recoveryActions: RecoveryAction[] = [];

        // Simulate disconnection and reconnection
        const disconnectEvent = NetworkSimulation.createNetworkEvent('disconnect', 'high');
        networkEvents.push(disconnectEvent);
        await NetworkSimulation.simulateNetworkDisconnection();

        const reconnectEvent = NetworkSimulation.createNetworkEvent('reconnect', 'medium');
        networkEvents.push(reconnectEvent);
        await NetworkSimulation.simulateNetworkReconnection();

        // Check data validation after reconnection
        const validationSuccess =
          await NetworkSimulation.checkDataValidationAfterReconnection();
        const integritySuccess = await NetworkSimulation.checkDataIntegrityAfterReconnection();

        const reconnectionValidated = validationSuccess && integritySuccess;

        const duration = Date.now() - startTime;

        return {
          success: reconnectionValidated,
          message: reconnectionValidated
            ? 'Reconnection validation successful'
            : 'Reconnection validation issues detected',
          details: {
            validationSuccess,
            integritySuccess,
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
          message: `Reconnection validation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },

  {
    id: 'reconnection-sync',
    name: 'Reconnection Synchronization',
    description: 'Verify data synchronization after reconnection',
    category: 'reconnection',
    priority: 'high',
    requiresNetworkSimulation: true,
    testFunction: async () => {
      const startTime = Date.now();

      try {
        const networkEvents: NetworkEvent[] = [];
        const dataLoss: DataLossInfo[] = [];
        const recoveryActions: RecoveryAction[] = [];

        // Simulate disconnection and reconnection
        const disconnectEvent = NetworkSimulation.createNetworkEvent('disconnect', 'high');
        networkEvents.push(disconnectEvent);
        await NetworkSimulation.simulateNetworkDisconnection();

        const reconnectEvent = NetworkSimulation.createNetworkEvent('reconnect', 'medium');
        networkEvents.push(reconnectEvent);
        await NetworkSimulation.simulateNetworkReconnection();

        // Check synchronization resumption
        const syncResumption = await NetworkSimulation.checkSynchronizationResumption();
        const dataConsistency = await NetworkSimulation.checkDataConsistencyAfterReconnection();

        const syncSuccessful = syncResumption && dataConsistency;

        const duration = Date.now() - startTime;

        return {
          success: syncSuccessful,
          message: syncSuccessful
            ? 'Reconnection synchronization successful'
            : 'Reconnection synchronization issues detected',
          details: {
            syncResumption,
            dataConsistency,
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
          message: `Reconnection sync test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },
];

