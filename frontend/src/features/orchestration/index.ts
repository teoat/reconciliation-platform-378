/**
 * Orchestration Features
 * 
 * Features related to page orchestration, workflow management, and Frenly AI integration
 */

import { registerFeature } from '../registry';

// Page Orchestration Feature
registerFeature({
  id: 'orchestration:page',
  name: 'Page Orchestration',
  description: 'Orchestrate page lifecycle, onboarding, and workflow state',
  category: 'orchestration',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'initialize-page',
      name: 'Initialize Page',
      description: 'Initialize page orchestration',
      parameters: [
        { name: 'pageId', type: 'string', required: true },
      ],
    },
    {
      id: 'update-workflow-state',
      name: 'Update Workflow State',
      description: 'Update workflow state',
      parameters: [
        { name: 'state', type: 'WorkflowState', required: true },
      ],
    },
  ],
  frenlyIntegration: {
    providesGuidance: true,
    onboardingSteps: ['welcome', 'upload-files', 'configure-reconciliation'],
    progressMilestones: ['page-initialized', 'workflow-started', 'workflow-completed'],
  },
  metaAgentIntegration: {
    monitorable: true,
    executable: true,
    compatibleAgents: ['monitoring', 'guidance'],
    events: [
      { name: 'orchestration.page.initialized', description: 'Page orchestration initialized' },
      { name: 'orchestration.workflow.state-changed', description: 'Workflow state changed' },
    ],
  },
});

// Frenly AI Integration Feature
registerFeature({
  id: 'orchestration:frenly-integration',
  name: 'Frenly AI Integration',
  description: 'Integration with Frenly AI for contextual guidance and assistance',
  category: 'orchestration',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'generate-message',
      name: 'Generate Message',
      description: 'Generate contextual Frenly message',
      parameters: [
        { name: 'context', type: 'MessageContext', required: true },
      ],
    },
    {
      id: 'track-interaction',
      name: 'Track Interaction',
      description: 'Track user interaction for learning',
      parameters: [
        { name: 'action', type: 'string', required: true },
        { name: 'context', type: 'Record<string, unknown>', required: false },
      ],
    },
  ],
  frenlyIntegration: {
    providesGuidance: true,
    helpContentIds: ['frenly-ai-guide'],
  },
  metaAgentIntegration: {
    monitorable: true,
    executable: true,
    compatibleAgents: ['guidance'],
    metrics: [
      { name: 'frenly_message_generation_time', type: 'histogram', description: 'Time to generate Frenly message', unit: 'ms' },
    ],
    events: [
      { name: 'frenly.message.generated', description: 'Frenly message generated' },
      { name: 'frenly.interaction.tracked', description: 'User interaction tracked' },
    ],
  },
});

// Re-export orchestration modules
export * from '../../orchestration';

