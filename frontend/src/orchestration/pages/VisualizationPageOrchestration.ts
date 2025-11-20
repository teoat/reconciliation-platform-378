/**
 * Visualization Page Orchestration
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
 * Visualization Page Metadata
 */
export const visualizationPageMetadata: PageMetadata = {
  id: 'visualization',
  name: 'Visualization',
  description: 'Create visualizations to understand your data better',
  category: 'analytics',
  features: ['chart-creation', 'dashboard', 'interactive-visualizations', 'export'],
  onboardingSteps: ['chart-guide', 'dashboard-help', 'interaction-info'],
  guidanceTopics: ['chart-types', 'dashboard-creation', 'interactive-features', 'data-exploration'],
  icon: 'visualization',
};

/**
 * Get onboarding steps for visualization page
 */
export function getVisualizationOnboardingSteps(
  hasCreatedCharts: boolean,
  hasCreatedDashboard: boolean
): OnboardingStep[] {
  return [
    {
      id: 'chart-guide',
      title: 'Create Charts',
      description: 'Create visualizations to explore your reconciliation data',
      targetElement: 'create-chart-button',
      completed: hasCreatedCharts,
      skipped: false,
      order: 1,
    },
    {
      id: 'dashboard-help',
      title: 'Build Dashboard',
      description: 'Combine multiple visualizations into a custom dashboard',
      targetElement: 'dashboard-builder',
      completed: hasCreatedDashboard,
      skipped: false,
      order: 2,
    },
    {
      id: 'interaction-info',
      title: 'Interactive Features',
      description: 'Use filters, drill-down, and other interactive features to explore data',
      targetElement: 'interactive-controls',
      completed: false,
      skipped: false,
      order: 3,
    },
  ];
}

/**
 * Get page context for visualization page
 */
export function getVisualizationPageContext(
  projectId: string | undefined,
  chartsCount: number,
  dashboardsCount: number,
  projectName?: string
): PageContext {
  return {
    projectId,
    projectName,
    chartsCount,
    dashboardsCount,
    currentView: 'charts',
    timestamp: Date.now(),
  };
}

/**
 * Get workflow state for visualization page
 */
export function getVisualizationWorkflowState(): WorkflowState | null {
  // Visualization page doesn't have a workflow state
  return null;
}

/**
 * Register guidance handlers for visualization page
 */
export function registerVisualizationGuidanceHandlers(
  onChartHelp: () => void,
  onDashboardHelp: () => void
): GuidanceHandler[] {
  return [
    {
      id: 'chart-guidance',
      featureId: 'chart-creation',
      handler: async (context: PageContext) => {
        if (context.chartsCount === 0) {
          return {
            id: `chart-tip-${Date.now()}`,
            type: 'tip',
            content:
              'Create your first chart to visualize reconciliation data. Choose from various chart types!',
            timestamp: new Date(),
            page: 'visualization',
            priority: 'medium',
            dismissible: true,
          };
        }
        return null;
      },
      priority: 1,
    },
    {
      id: 'dashboard-guidance',
      featureId: 'dashboard',
      handler: async (context: PageContext) => {
        if (context.chartsCount > 0 && context.dashboardsCount === 0) {
          return {
            id: `dashboard-tip-${Date.now()}`,
            type: 'tip',
            content: 'Combine multiple charts into a dashboard for comprehensive data views.',
            timestamp: new Date(),
            page: 'visualization',
            priority: 'low',
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
 * Get guidance content for visualization page
 */
export function getVisualizationGuidanceContent(topic: string): GuidanceContent[] {
  const guidanceMap: Record<string, GuidanceContent[]> = {
    'chart-types': [
      {
        id: 'chart-selection',
        title: 'Chart Selection',
        content:
          'Choose appropriate chart types: bar charts for comparisons, line charts for trends, pie charts for proportions.',
        type: 'tip',
      },
      {
        id: 'chart-customization',
        title: 'Chart Customization',
        content: 'Customize colors, labels, axes, and other chart properties to match your needs.',
        type: 'info',
      },
    ],
    'dashboard-creation': [
      {
        id: 'dashboard-layout',
        title: 'Dashboard Layout',
        content: 'Arrange charts in a grid layout. Drag and drop to reposition charts.',
        type: 'info',
      },
      {
        id: 'dashboard-sharing',
        title: 'Share Dashboards',
        content: 'Save and share dashboards with team members. Export as images or PDFs.',
        type: 'tip',
      },
    ],
    'interactive-features': [
      {
        id: 'filters',
        title: 'Filters',
        content:
          'Use filters to focus on specific data subsets. Filters apply across all charts in a dashboard.',
        type: 'info',
      },
      {
        id: 'drill-down',
        title: 'Drill Down',
        content: 'Click on chart elements to drill down into detailed data views.',
        type: 'tip',
      },
    ],
    'data-exploration': [
      {
        id: 'exploration-tips',
        title: 'Exploration Tips',
        content: 'Start with overview charts, then drill down into specific areas of interest.',
        type: 'tip',
      },
      {
        id: 'data-insights',
        title: 'Data Insights',
        content: 'Look for patterns, trends, and anomalies in your visualizations.',
        type: 'info',
      },
    ],
  };

  return guidanceMap[topic] || [];
}
