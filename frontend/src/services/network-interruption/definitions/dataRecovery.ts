// Data Recovery Test Definitions
// Extracted from testDefinitions.ts

import { NetworkInterruptionTest, NetworkEvent, DataLossInfo, RecoveryAction } from '../types';
import { NetworkSimulation } from '../networkSimulation';

export const dataRecoveryTests: NetworkInterruptionTest[] = [
  {
    id: 'form-data-recovery',
    name: 'Form Data Recovery',
    description: 'Verify form data is recovered after network interruption',
    category: 'data-recovery',
    priority: 'high',
    requiresNetworkSimulation: true,
    testFunction: async () => {
      const startTime = Date.now();

      try {
        const networkEvents: NetworkEvent[] = [];
        const dataLoss: DataLossInfo[] = [];
        const recoveryActions: RecoveryAction[] = [];

        // Simulate form data entry
        const formData = NetworkSimulation.generateTestData(200);
        await NetworkSimulation.simulateFormDataEntry(formData);

        // Simulate disconnection
        const disconnectEvent = NetworkSimulation.createNetworkEvent('disconnect', 'high');
        networkEvents.push(disconnectEvent);
        await NetworkSimulation.simulateNetworkDisconnection();

        // Check if form data was saved
        const dataSaved = await NetworkSimulation.checkFormDataSaved(formData);
        if (!dataSaved) {
          dataLoss.push(NetworkSimulation.createDataLossInfo('form-data', 'high', true));
        }

        // Simulate reconnection
        const reconnectEvent = NetworkSimulation.createNetworkEvent('reconnect', 'medium');
        networkEvents.push(reconnectEvent);
        await NetworkSimulation.simulateNetworkReconnection();

        // Check form data recovery
        const dataRecovered = await NetworkSimulation.checkFormDataRecovery(formData);
        const recoveryAction = NetworkSimulation.createRecoveryAction(
          'auto-save',
          dataRecovered
        );
        recoveryActions.push(recoveryAction);

        const recoverySuccessful = dataSaved && dataRecovered;

        const duration = Date.now() - startTime;

        return {
          success: recoverySuccessful,
          message: recoverySuccessful
            ? 'Form data recovery successful'
            : 'Form data recovery issues detected',
          details: {
            formData,
            dataSaved,
            dataRecovered,
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
          message: `Form data recovery test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },

  {
    id: 'upload-progress-recovery',
    name: 'Upload Progress Recovery',
    description: 'Verify upload progress is recovered after interruption',
    category: 'data-recovery',
    priority: 'high',
    requiresNetworkSimulation: true,
    testFunction: async () => {
      const startTime = Date.now();

      try {
        const networkEvents: NetworkEvent[] = [];
        const dataLoss: DataLossInfo[] = [];
        const recoveryActions: RecoveryAction[] = [];

        // Simulate file upload
        const uploadData = NetworkSimulation.generateTestData(1000);
        await NetworkSimulation.simulateFileUpload(uploadData);

        // Simulate disconnection during upload
        const disconnectEvent = NetworkSimulation.createNetworkEvent('disconnect', 'high');
        networkEvents.push(disconnectEvent);
        await NetworkSimulation.simulateNetworkDisconnection();

        // Check if upload progress was saved
        const progressSaved = await NetworkSimulation.checkUploadProgressSaved(uploadData);
        if (!progressSaved) {
          dataLoss.push(NetworkSimulation.createDataLossInfo('upload-progress', 'high', true));
        }

        // Simulate reconnection
        const reconnectEvent = NetworkSimulation.createNetworkEvent('reconnect', 'medium');
        networkEvents.push(reconnectEvent);
        await NetworkSimulation.simulateNetworkReconnection();

        // Check upload resumption
        const uploadResumed = await NetworkSimulation.checkUploadResumption(uploadData);
        const recoveryAction = NetworkSimulation.createRecoveryAction('retry', uploadResumed);
        recoveryActions.push(recoveryAction);

        const recoverySuccessful = progressSaved && uploadResumed;

        const duration = Date.now() - startTime;

        return {
          success: recoverySuccessful,
          message: recoverySuccessful
            ? 'Upload progress recovery successful'
            : 'Upload progress recovery issues detected',
          details: {
            uploadData,
            progressSaved,
            uploadResumed,
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
          message: `Upload progress recovery test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },

  {
    id: 'workflow-state-recovery',
    name: 'Workflow State Recovery',
    description: 'Verify workflow state is recovered after interruption',
    category: 'data-recovery',
    priority: 'high',
    requiresNetworkSimulation: true,
    testFunction: async () => {
      const startTime = Date.now();

      try {
        const networkEvents: NetworkEvent[] = [];
        const dataLoss: DataLossInfo[] = [];
        const recoveryActions: RecoveryAction[] = [];

        // Simulate workflow progress
        const workflowState = NetworkSimulation.generateTestData(300);
        await NetworkSimulation.simulateWorkflowProgress(workflowState);

        // Simulate disconnection
        const disconnectEvent = NetworkSimulation.createNetworkEvent('disconnect', 'high');
        networkEvents.push(disconnectEvent);
        await NetworkSimulation.simulateNetworkDisconnection();

        // Check if workflow state was saved
        const stateSaved = await NetworkSimulation.checkWorkflowStateSaved(workflowState);
        if (!stateSaved) {
          dataLoss.push(NetworkSimulation.createDataLossInfo('workflow-state', 'medium', true));
        }

        // Simulate reconnection
        const reconnectEvent = NetworkSimulation.createNetworkEvent('reconnect', 'medium');
        networkEvents.push(reconnectEvent);
        await NetworkSimulation.simulateNetworkReconnection();

        // Check workflow state recovery
        const stateRecovered =
          await NetworkSimulation.checkWorkflowStateRecovery(workflowState);
        const recoveryAction = NetworkSimulation.createRecoveryAction(
          'rollback',
          stateRecovered
        );
        recoveryActions.push(recoveryAction);

        const recoverySuccessful = stateSaved && stateRecovered;

        const duration = Date.now() - startTime;

        return {
          success: recoverySuccessful,
          message: recoverySuccessful
            ? 'Workflow state recovery successful'
            : 'Workflow state recovery issues detected',
          details: {
            workflowState,
            stateSaved,
            stateRecovered,
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
          message: `Workflow state recovery test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },
];

