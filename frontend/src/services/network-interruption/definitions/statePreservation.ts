// State Preservation Test Definitions
// Extracted from testDefinitions.ts

import { NetworkInterruptionTest, NetworkEvent, DataLossInfo, RecoveryAction } from '../types';
import { NetworkSimulation } from '../networkSimulation';

export const statePreservationTests: NetworkInterruptionTest[] = [
  {
    id: 'user-session-preservation',
    name: 'User Session Preservation',
    description: 'Verify user session is preserved during network interruption',
    category: 'state-preservation',
    priority: 'high',
    requiresNetworkSimulation: true,
    testFunction: async () => {
      const startTime = Date.now();

      try {
        const networkEvents: NetworkEvent[] = [];
        const dataLoss: DataLossInfo[] = [];
        const recoveryActions: RecoveryAction[] = [];

        // Simulate user session
        const userSession = NetworkSimulation.generateTestData(150);
        await NetworkSimulation.simulateUserSession(userSession);

        // Simulate disconnection
        const disconnectEvent = NetworkSimulation.createNetworkEvent('disconnect', 'high');
        networkEvents.push(disconnectEvent);
        await NetworkSimulation.simulateNetworkDisconnection();

        // Check session preservation
        const sessionPreserved = await NetworkSimulation.checkSessionPreservation(userSession);
        if (!sessionPreserved) {
          dataLoss.push(NetworkSimulation.createDataLossInfo('user-input', 'high', false));
        }

        // Simulate reconnection
        const reconnectEvent = NetworkSimulation.createNetworkEvent('reconnect', 'medium');
        networkEvents.push(reconnectEvent);
        await NetworkSimulation.simulateNetworkReconnection();

        // Check session restoration
        const sessionRestored = await NetworkSimulation.checkSessionRestoration(userSession);
        const recoveryAction = NetworkSimulation.createRecoveryAction(
          'notify-user',
          sessionRestored
        );
        recoveryActions.push(recoveryAction);

        const preservationSuccessful = sessionPreserved && sessionRestored;

        const duration = Date.now() - startTime;

        return {
          success: preservationSuccessful,
          message: preservationSuccessful
            ? 'User session preservation successful'
            : 'User session preservation issues detected',
          details: {
            userSession,
            sessionPreserved,
            sessionRestored,
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
          message: `User session preservation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },

  {
    id: 'application-state-preservation',
    name: 'Application State Preservation',
    description: 'Verify application state is preserved during interruption',
    category: 'state-preservation',
    priority: 'medium',
    requiresNetworkSimulation: true,
    testFunction: async () => {
      const startTime = Date.now();

      try {
        const networkEvents: NetworkEvent[] = [];
        const dataLoss: DataLossInfo[] = [];
        const recoveryActions: RecoveryAction[] = [];

        // Simulate application state
        const appState = NetworkSimulation.generateTestData(400);
        await NetworkSimulation.simulateApplicationState(appState);

        // Simulate disconnection
        const disconnectEvent = NetworkSimulation.createNetworkEvent('disconnect', 'high');
        networkEvents.push(disconnectEvent);
        await NetworkSimulation.simulateNetworkDisconnection();

        // Check application state preservation
        const statePreserved =
          await NetworkSimulation.checkApplicationStatePreservation(appState);
        if (!statePreserved) {
          dataLoss.push(NetworkSimulation.createDataLossInfo('workflow-state', 'medium', true));
        }

        // Simulate reconnection
        const reconnectEvent = NetworkSimulation.createNetworkEvent('reconnect', 'medium');
        networkEvents.push(reconnectEvent);
        await NetworkSimulation.simulateNetworkReconnection();

        // Check application state restoration
        const stateRestored =
          await NetworkSimulation.checkApplicationStateRestoration(appState);
        const recoveryAction = NetworkSimulation.createRecoveryAction(
          'auto-save',
          stateRestored
        );
        recoveryActions.push(recoveryAction);

        const preservationSuccessful = statePreserved && stateRestored;

        const duration = Date.now() - startTime;

        return {
          success: preservationSuccessful,
          message: preservationSuccessful
            ? 'Application state preservation successful'
            : 'Application state preservation issues detected',
          details: {
            appState,
            statePreserved,
            stateRestored,
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
          message: `Application state preservation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },

  {
    id: 'ui-state-preservation',
    name: 'UI State Preservation',
    description: 'Verify UI state is preserved during network interruption',
    category: 'state-preservation',
    priority: 'medium',
    requiresNetworkSimulation: true,
    testFunction: async () => {
      const startTime = Date.now();

      try {
        const networkEvents: NetworkEvent[] = [];
        const dataLoss: DataLossInfo[] = [];
        const recoveryActions: RecoveryAction[] = [];

        // Simulate UI state
        const uiState = NetworkSimulation.generateTestData(250);
        await NetworkSimulation.simulateUIState(uiState);

        // Simulate disconnection
        const disconnectEvent = NetworkSimulation.createNetworkEvent('disconnect', 'high');
        networkEvents.push(disconnectEvent);
        await NetworkSimulation.simulateNetworkDisconnection();

        // Check UI state preservation
        const statePreserved = await NetworkSimulation.checkUIStatePreservation(uiState);
        if (!statePreserved) {
          dataLoss.push(NetworkSimulation.createDataLossInfo('user-input', 'low', true));
        }

        // Simulate reconnection
        const reconnectEvent = NetworkSimulation.createNetworkEvent('reconnect', 'medium');
        networkEvents.push(reconnectEvent);
        await NetworkSimulation.simulateNetworkReconnection();

        // Check UI state restoration
        const stateRestored = await NetworkSimulation.checkUIStateRestoration(uiState);
        const recoveryAction = NetworkSimulation.createRecoveryAction(
          'notify-user',
          stateRestored
        );
        recoveryActions.push(recoveryAction);

        const preservationSuccessful = statePreserved && stateRestored;

        const duration = Date.now() - startTime;

        return {
          success: preservationSuccessful,
          message: preservationSuccessful
            ? 'UI state preservation successful'
            : 'UI state preservation issues detected',
          details: {
            uiState,
            statePreserved,
            stateRestored,
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
          message: `UI state preservation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },
];

