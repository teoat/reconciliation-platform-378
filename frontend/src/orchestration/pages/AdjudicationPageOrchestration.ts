/**
 * Adjudication Page Orchestration
 */

import type {
  PageMetadata,
  PageContext,
  OnboardingStep,
  GuidanceHandler,
  WorkflowState,
  GuidanceContent,
} from '../types';

/**
 * Adjudication Page Metadata
 */
export const adjudicationPageMetadata: PageMetadata = {
  id: 'adjudication',
  name: 'Adjudication',
  description: 'Discrepancy resolution and match review',
  category: 'workflow',
  features: ['match-review', 'discrepancy-resolution', 'approval', 'batch-processing'],
  onboardingSteps: ['review-guide', 'resolution-help', 'approval-process'],
  guidanceTopics: [
    'match-review',
    'resolution-strategies',
    'approval-workflow',
    'batch-processing',
  ],
  icon: 'adjudication',
};

/**
 * Get onboarding steps for adjudication page
 */
export function getAdjudicationOnboardingSteps(
  hasMatches: boolean,
  hasResolvedMatches: boolean
): OnboardingStep[] {
  return [
    {
      id: 'review-guide',
      title: 'Review Matches',
      description: 'Review matched records and check for discrepancies',
      targetElement: 'matches-list',
      completed: hasMatches,
      skipped: false,
      order: 1,
    },
    {
      id: 'resolution-help',
      title: 'Resolve Discrepancies',
      description: 'Resolve any discrepancies found in matched records',
      targetElement: 'resolution-panel',
      completed: hasResolvedMatches,
      skipped: false,
      order: 2,
    },
    {
      id: 'approval-process',
      title: 'Approve Matches',
      description: 'Approve resolved matches to complete the adjudication process',
      targetElement: 'approval-button',
      completed: false,
      skipped: false,
      order: 3,
    },
  ];
}

/**
 * Get page context for adjudication page
 */
export function getAdjudicationPageContext(
  projectId: string | undefined,
  matchesCount: number,
  resolvedCount: number,
  pendingCount: number,
  projectName?: string
): PageContext {
  return {
    projectId,
    projectName,
    matchesCount,
    resolvedCount,
    pendingCount,
    currentView: 'review',
    timestamp: Date.now(),
  };
}

/**
 * Get workflow state for adjudication page
 */
export function getAdjudicationWorkflowState(
  matchesCount: number,
  resolvedCount: number,
  approvedCount: number
): WorkflowState {
  const steps = ['review', 'resolve', 'approve'];
  const completedSteps: string[] = [];

  if (matchesCount > 0) completedSteps.push('review');
  if (resolvedCount > 0) completedSteps.push('resolve');
  if (approvedCount > 0) completedSteps.push('approve');

  const progress = (completedSteps.length / steps.length) * 100;

  return {
    workflowId: 'adjudication-workflow',
    currentStep: completedSteps[completedSteps.length - 1] || 'review',
    completedSteps,
    totalSteps: steps.length,
    progress: Math.round(progress),
    metadata: {
      matchesCount,
      resolvedCount,
      approvedCount,
    },
  };
}

/**
 * Register guidance handlers for adjudication page
 */
export function registerAdjudicationGuidanceHandlers(): GuidanceHandler[] {
  return [
    {
      id: 'review-guidance',
      featureId: 'match-review',
      handler: async (context: PageContext) => {
        if (context.pendingCount && (context.pendingCount as number) > 0) {
          return {
            id: `review-tip-${Date.now()}`,
            type: 'tip',
            content: `You have ${context.pendingCount} matches to review. Start with high-confidence matches first!`,
            timestamp: new Date(),
            page: 'adjudication',
            priority: 'medium',
            dismissible: true,
          };
        }
        return null;
      },
      priority: 1,
    },
    {
      id: 'resolution-guidance',
      featureId: 'discrepancy-resolution',
      handler: async (context: PageContext) => {
        if (context.matchesCount && (context.matchesCount as number) > 0 && context.resolvedCount === 0) {
          return {
            id: `resolution-tip-${Date.now()}`,
            type: 'tip',
            content:
              'Review discrepancies carefully. You can accept, reject, or request more information.',
            timestamp: new Date(),
            page: 'adjudication',
            priority: 'medium',
            dismissible: true,
          };
        }
        return null;
      },
      priority: 2,
    },
    {
      id: 'approval-guidance',
      featureId: 'approval',
      handler: async (context: PageContext) => {
        if (context.resolvedCount && (context.resolvedCount as number) > 0) {
          return {
            id: `approval-tip-${Date.now()}`,
            type: 'tip',
            content:
              "Once you've reviewed all matches, approve them to complete the adjudication process.",
            timestamp: new Date(),
            page: 'adjudication',
            priority: 'low',
            dismissible: true,
          };
        }
        return null;
      },
      priority: 3,
    },
  ];
}

/**
 * Get guidance content for adjudication page
 */
export function getAdjudicationGuidanceContent(topic: string): GuidanceContent[] {
  const guidanceMap: Record<string, GuidanceContent[]> = {
    'match-review': [
      {
        id: 'review-process',
        title: 'Review Process',
        content:
          'Review matches by confidence score. High confidence matches can be auto-approved.',
        type: 'tip',
      },
      {
        id: 'review-tips',
        title: 'Review Tips',
        content:
          'Focus on matches with lower confidence scores first. Check for data quality issues.',
        type: 'tip',
      },
    ],
    'resolution-strategies': [
      {
        id: 'resolution-options',
        title: 'Resolution Options',
        content: 'You can accept, reject, or request more information for each discrepancy.',
        type: 'info',
      },
      {
        id: 'efficient-resolution',
        title: 'Efficient Resolution',
        content: 'Use batch actions to resolve multiple similar discrepancies at once.',
        type: 'tip',
      },
    ],
    'approval-workflow': [
      {
        id: 'approval-process',
        title: 'Approval Process',
        content:
          'Approve resolved matches to finalize the adjudication. You can approve individually or in batches.',
        type: 'info',
      },
      {
        id: 'approval-safety',
        title: 'Approval Safety',
        content: 'Once approved, matches are finalized. You can still review them later if needed.',
        type: 'tip',
      },
    ],
    'batch-processing': [
      {
        id: 'batch-actions',
        title: 'Batch Actions',
        content: 'Select multiple matches to perform batch operations like approve or reject.',
        type: 'info',
      },
      {
        id: 'batch-tips',
        title: 'Batch Tips',
        content: 'Use filters to select similar matches for efficient batch processing.',
        type: 'tip',
      },
    ],
  };

  return guidanceMap[topic] || [];
}
