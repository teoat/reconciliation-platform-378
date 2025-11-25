/**
 * Frenly AI Features
 * 
 * Features specifically for Frenly AI integration and guidance
 */

import { registerFeature, type FeatureMetadata } from '../registry';

// Frenly Guidance Agent Feature
registerFeature({
  id: 'frenly:guidance-agent',
  name: 'Frenly Guidance Agent',
  description: 'AI-powered guidance agent for user assistance and onboarding',
  category: 'orchestration',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'generate-contextual-message',
      name: 'Generate Contextual Message',
      description: 'Generate AI message based on user context',
      parameters: [
        { name: 'userId', type: 'string', required: true },
        { name: 'page', type: 'string', required: true },
        { name: 'context', type: 'MessageContext', required: false },
      ],
      outputType: 'GeneratedMessage',
    },
    {
      id: 'handle-user-query',
      name: 'Handle User Query',
      description: 'Process user query with NLU and generate response',
      parameters: [
        { name: 'userId', type: 'string', required: true },
        { name: 'query', type: 'string', required: true },
      ],
      outputType: 'GeneratedMessage',
    },
  ],
  frenlyIntegration: {
    providesGuidance: true,
    helpContentIds: ['frenly-ai-guide', 'frenly-usage-tips'],
    onboardingSteps: ['welcome', 'frenly-introduction'],
    tips: [
      'Ask Frenly questions about any feature',
      'Frenly learns from your usage patterns',
      'Provide feedback to improve Frenly responses',
    ],
  },
  metaAgentIntegration: {
    monitorable: true,
    executable: true,
    compatibleAgents: ['guidance'],
    metrics: [
      { name: 'frenly_messages_sent', type: 'counter', description: 'Total Frenly messages sent' },
      { name: 'frenly_user_satisfaction', type: 'gauge', description: 'User satisfaction with Frenly' },
    ],
    events: [
      { name: 'frenly.message.sent', description: 'Frenly message sent to user' },
      { name: 'frenly.feedback.received', description: 'User feedback received' },
    ],
  },
});

// Re-export Frenly components and services
export { FrenlyProvider } from '../../components/frenly/FrenlyProvider';
export { FrenlyAIProvider } from '../../components/frenly/FrenlyAIProvider';
export { frenlyAgentService } from '../../services/frenlyAgentService';

