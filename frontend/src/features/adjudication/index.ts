/**
 * Adjudication Features
 * 
 * Features related to discrepancy resolution and approval workflows
 */

import { registerFeature, type FeatureMetadata } from '../registry';

// Adjudication Workflow Feature
registerFeature({
  id: 'adjudication:workflow',
  name: 'Adjudication Workflow',
  description: 'Workflow for reviewing and resolving reconciliation discrepancies',
  category: 'adjudication',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'approve-discrepancy',
      name: 'Approve Discrepancy',
      description: 'Approve a discrepancy resolution',
      parameters: [
        { name: 'discrepancyId', type: 'string', required: true },
        { name: 'resolution', type: 'DiscrepancyResolution', required: true },
      ],
      requiresApproval: true,
    },
    {
      id: 'reject-discrepancy',
      name: 'Reject Discrepancy',
      description: 'Reject a discrepancy resolution',
      parameters: [
        { name: 'discrepancyId', type: 'string', required: true },
        { name: 'reason', type: 'string', required: false },
      ],
    },
  ],
  frenlyIntegration: {
    providesGuidance: true,
    helpContentIds: ['adjudication-guide'],
    onboardingSteps: ['adjudicate-discrepancies'],
    tips: [
      'Review high-priority discrepancies first',
      'Check supporting documentation before approving',
      'Use bulk actions for similar discrepancies',
    ],
    progressMilestones: ['adjudication-started', 'discrepancies-reviewed', 'adjudication-complete'],
  },
  metaAgentIntegration: {
    monitorable: true,
    executable: true,
    compatibleAgents: ['monitoring', 'decision'],
    metrics: [
      { name: 'adjudication_rate', type: 'gauge', description: 'Discrepancies adjudicated per hour' },
      { name: 'approval_rate', type: 'gauge', description: 'Approval rate percentage' },
    ],
    events: [
      { name: 'adjudication.discrepancy.approved', description: 'Discrepancy approved' },
      { name: 'adjudication.discrepancy.rejected', description: 'Discrepancy rejected' },
    ],
  },
});

