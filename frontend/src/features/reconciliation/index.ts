/**
 * Reconciliation Features
 * 
 * Features related to matching, comparing, and reconciling data records
 */

import { registerFeature, type FeatureMetadata } from '../registry';

// Reconciliation Engine Feature
registerFeature({
  id: 'reconciliation:engine',
  name: 'Reconciliation Engine',
  description: 'Core engine for matching and comparing data records',
  category: 'reconciliation',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'start-reconciliation',
      name: 'Start Reconciliation',
      description: 'Start a reconciliation job',
      parameters: [
        { name: 'projectId', type: 'string', required: true },
        { name: 'config', type: 'ReconciliationConfig', required: true },
      ],
      estimatedDuration: 30000,
    },
    {
      id: 'stop-reconciliation',
      name: 'Stop Reconciliation',
      description: 'Stop a running reconciliation job',
      parameters: [
        { name: 'jobId', type: 'string', required: true },
      ],
    },
  ],
  frenlyIntegration: {
    providesGuidance: true,
    helpContentIds: ['reconciliation-guide', 'matching-strategies'],
    onboardingSteps: ['configure-reconciliation', 'review-matches'],
    tips: [
      'Start with higher tolerance and gradually reduce',
      'Review match confidence scores',
      'Use fuzzy matching for similar but not identical records',
    ],
    progressMilestones: ['reconciliation-started', 'matches-found', 'reconciliation-complete'],
  },
  metaAgentIntegration: {
    monitorable: true,
    executable: true,
    compatibleAgents: ['monitoring', 'processing', 'optimization'],
    metrics: [
      { name: 'match_rate', type: 'gauge', description: 'Percentage of records matched' },
      { name: 'reconciliation_duration', type: 'histogram', description: 'Time to complete reconciliation', unit: 'ms' },
    ],
    events: [
      { name: 'reconciliation.started', description: 'Reconciliation job started' },
      { name: 'reconciliation.completed', description: 'Reconciliation job completed' },
      { name: 'reconciliation.failed', description: 'Reconciliation job failed' },
    ],
  },
});

// Match Review Feature
registerFeature({
  id: 'reconciliation:match-review',
  name: 'Match Review',
  description: 'Review and validate reconciliation matches',
  category: 'reconciliation',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'approve-match',
      name: 'Approve Match',
      description: 'Approve a matched record pair',
      parameters: [
        { name: 'matchId', type: 'string', required: true },
      ],
      requiresApproval: false,
    },
    {
      id: 'reject-match',
      name: 'Reject Match',
      description: 'Reject a matched record pair',
      parameters: [
        { name: 'matchId', type: 'string', required: true },
        { name: 'reason', type: 'string', required: false },
      ],
    },
  ],
  frenlyIntegration: {
    providesGuidance: true,
    helpContentIds: ['match-review-guide'],
    tips: ['Review high-confidence matches first', 'Check for false positives'],
  },
  metaAgentIntegration: {
    monitorable: true,
    executable: false,
    compatibleAgents: ['monitoring'],
  },
});

// Re-export components
export { ReconciliationInterface } from '../../components/ReconciliationInterface';
export { ReconciliationTabs } from '../../components/reconciliation/ReconciliationTabs';

