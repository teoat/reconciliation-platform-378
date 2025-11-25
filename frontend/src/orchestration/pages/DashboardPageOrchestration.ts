/**
 * Dashboard Page Orchestration
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
 * Dashboard Page Metadata
 */
export const dashboardPageMetadata: PageMetadata = {
  id: 'dashboard',
  name: 'Dashboard',
  description: 'Main dashboard with project overview and insights',
  category: 'core',
  features: ['project-overview', 'quick-actions', 'recent-activity', 'smart-insights'],
  onboardingSteps: ['welcome', 'project-creation', 'navigation', 'insights'],
  guidanceTopics: ['getting-started', 'project-management', 'quick-tips', 'productivity'],
  icon: 'dashboard',
};

/**
 * Get onboarding steps for dashboard page
 */
export function getDashboardOnboardingSteps(
  hasProjects: boolean,
  hasCompletedProjects: boolean
): OnboardingStep[] {
  return [
    {
      id: 'welcome',
      title: 'Welcome to Dashboard',
      description: 'Your central hub for all projects and insights',
      targetElement: 'dashboard-header',
      completed: true,
      skipped: false,
      order: 1,
    },
    {
      id: 'project-creation',
      title: 'Create Your First Project',
      description: 'Click "New Project" to get started with reconciliation',
      targetElement: 'new-project-button',
      completed: hasProjects,
      skipped: false,
      order: 2,
    },
    {
      id: 'navigation',
      title: 'Navigate Between Pages',
      description: 'Use the sidebar to move between different sections',
      targetElement: 'sidebar',
      completed: hasCompletedProjects,
      skipped: false,
      order: 3,
    },
    {
      id: 'insights',
      title: 'View Smart Insights',
      description: 'Check the insights panel for AI-powered recommendations',
      targetElement: 'insights-panel',
      completed: false,
      skipped: false,
      order: 4,
    },
  ];
}

/**
 * Get page context for dashboard page
 */
export function getDashboardPageContext(
  projectsCount: number,
  activeProjectsCount: number,
  completedProjectsCount: number,
  productivityScore?: number
): PageContext {
  return {
    projectsCount,
    activeProjectsCount,
    completedProjectsCount,
    productivityScore,
    currentView: 'overview',
    timestamp: Date.now(),
  };
}

/**
 * Get workflow state for dashboard page
 */
export function getDashboardWorkflowState(): WorkflowState | null {
  // Dashboard doesn't have a workflow state
  return null;
}

/**
 * Register guidance handlers for dashboard page
 */
export function registerDashboardGuidanceHandlers(): GuidanceHandler[] {
  return [
    {
      id: 'project-guidance',
      featureId: 'project-overview',
      handler: async (context: PageContext) => {
        if (context.projectsCount === 0) {
          return {
            id: `project-tip-${Date.now()}`,
            type: 'tip',
            content: 'Create your first project to start the reconciliation process!',
            timestamp: new Date(),
            page: 'dashboard',
            priority: 'medium',
            dismissible: true,
          };
        }
        return null;
      },
      priority: 1,
    },
    {
      id: 'insights-guidance',
      featureId: 'smart-insights',
      handler: async (context: PageContext) => {
        if (context.productivityScore && (context.productivityScore as number) < 0.5) {
          return {
            id: `insights-tip-${Date.now()}`,
            type: 'tip',
            content: 'Check the insights panel for tips to improve your productivity!',
            timestamp: new Date(),
            page: 'dashboard',
            priority: 'medium',
            dismissible: true,
          };
        }
        return null;
      },
      priority: 2,
    },
  ];
}

/**
 * Get guidance content for dashboard page
 */
export function getDashboardGuidanceContent(topic: string): GuidanceContent[] {
  const guidanceMap: Record<string, GuidanceContent[]> = {
    'getting-started': [
      {
        id: 'welcome-tip',
        title: 'Welcome!',
        content: 'This is your dashboard. Start by creating a project or exploring existing ones.',
        type: 'info',
      },
      {
        id: 'navigation-tip',
        title: 'Navigation',
        content: 'Use the sidebar to navigate between different sections of the application.',
        type: 'tip',
      },
    ],
    'project-management': [
      {
        id: 'project-creation',
        title: 'Create Projects',
        content:
          'Click "New Project" to create a new reconciliation project. Give it a descriptive name.',
        type: 'tip',
      },
      {
        id: 'project-priority',
        title: 'Project Priority',
        content: 'Projects are automatically prioritized based on importance and deadlines.',
        type: 'info',
      },
    ],
    'quick-tips': [
      {
        id: 'dashboard-refresh',
        title: 'Refresh Data',
        content: 'Dashboard data refreshes automatically. You can also manually refresh if needed.',
        type: 'tip',
      },
      {
        id: 'quick-actions',
        title: 'Quick Actions',
        content: 'Use quick action buttons to perform common tasks without navigating away.',
        type: 'info',
      },
    ],
    productivity: [
      {
        id: 'productivity-score',
        title: 'Productivity Score',
        content:
          'Your productivity score is calculated based on project completion and efficiency.',
        type: 'info',
      },
      {
        id: 'improve-productivity',
        title: 'Improve Productivity',
        content: 'Complete projects on time and follow recommendations to improve your score.',
        type: 'tip',
      },
    ],
  };

  return guidanceMap[topic] || [];
}
