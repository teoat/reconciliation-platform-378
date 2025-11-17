/**
 * Dashboard Page Orchestration
 * 
 * Orchestration configuration for the Dashboard page
 */

import type {
  PageMetadata,
  PageContext,
  OnboardingStep,
  GuidanceHandler,
} from '../types';

/**
 * Dashboard Page Metadata
 */
export const dashboardPageMetadata: PageMetadata = {
  id: 'dashboard',
  name: 'Dashboard',
  description: 'Main dashboard with project overview',
  category: 'core',
  features: ['project-overview', 'quick-actions', 'recent-activity', 'statistics'],
  onboardingSteps: [
    'welcome',
    'project-creation',
    'navigation',
    'quick-actions',
  ],
  guidanceTopics: [
    'getting-started',
    'project-management',
    'quick-tips',
    'navigation',
  ],
  icon: 'dashboard',
};

/**
 * Get onboarding steps for dashboard page
 */
export function getDashboardOnboardingSteps(
  hasProjects: boolean,
  hasRecentActivity: boolean
): OnboardingStep[] {
  return [
    {
      id: 'welcome',
      title: 'Welcome to the Platform',
      description: 'Get started by exploring the dashboard',
      targetElement: 'dashboard-header',
      completed: true,
      skipped: false,
      order: 1,
    },
    {
      id: 'project-creation',
      title: 'Create Your First Project',
      description: 'Click the "New Project" button to get started',
      targetElement: 'new-project-button',
      completed: hasProjects,
      skipped: false,
      order: 2,
    },
    {
      id: 'navigation',
      title: 'Navigate the Platform',
      description: 'Use the sidebar to navigate between different sections',
      targetElement: 'sidebar',
      completed: hasRecentActivity,
      skipped: false,
      order: 3,
    },
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      description: 'Use quick actions to perform common tasks',
      targetElement: 'quick-actions',
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
  recentActivityCount: number,
  userRole?: string
): PageContext {
  return {
    projectsCount,
    recentActivityCount,
    userRole,
    currentView: 'dashboard',
    timestamp: Date.now(),
  };
}

/**
 * Register guidance handlers for dashboard page
 */
export function registerDashboardGuidanceHandlers(): GuidanceHandler[] {
  return [
    {
      id: 'welcome-guidance',
      featureId: 'welcome',
      handler: async (context: PageContext) => {
        if (context.projectsCount === 0) {
          return {
            id: `welcome-tip-${Date.now()}`,
            type: 'tip',
            content:
              'Welcome! Start by creating your first project to get started with reconciliation.',
            timestamp: new Date(),
            page: 'dashboard',
            priority: 'high',
            dismissible: true,
          };
        }
        return null;
      },
      priority: 1,
    },
    {
      id: 'project-creation-guidance',
      featureId: 'project-creation',
      handler: async (context: PageContext) => {
        if (context.projectsCount === 0) {
          return {
            id: `project-tip-${Date.now()}`,
            type: 'tip',
            content:
              'Create a project to organize your reconciliation work. Click "New Project" to get started!',
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
export function getDashboardGuidanceContent(
  topic: string
): Array<{
  id: string;
  title: string;
  content: string;
  type: 'tip' | 'info' | 'warning' | 'help';
}> {
  const guidanceMap: Record<
    string,
    Array<{
      id: string;
      title: string;
      content: string;
      type: 'tip' | 'info' | 'warning' | 'help';
    }>
  > = {
    'getting-started': [
      {
        id: 'welcome-info',
        title: 'Welcome',
        content: 'This is your dashboard. Here you can see all your projects and recent activity.',
        type: 'info',
      },
      {
        id: 'first-steps',
        title: 'First Steps',
        content: 'Start by creating a project, then upload data and run reconciliation jobs.',
        type: 'tip',
      },
    ],
    'project-management': [
      {
        id: 'project-creation',
        title: 'Creating Projects',
        content: 'Projects help you organize your reconciliation work. Each project can have multiple data sources and jobs.',
        type: 'tip',
      },
      {
        id: 'project-organization',
        title: 'Organization',
        content: 'Use descriptive names for your projects to make them easy to find later.',
        type: 'tip',
      },
    ],
    'quick-tips': [
      {
        id: 'quick-actions',
        title: 'Quick Actions',
        content: 'Use the quick action buttons to perform common tasks faster.',
        type: 'tip',
      },
      {
        id: 'recent-activity',
        title: 'Recent Activity',
        content: 'Check the recent activity section to see what you\'ve been working on.',
        type: 'info',
      },
    ],
  };

  return guidanceMap[topic] || [];
}
