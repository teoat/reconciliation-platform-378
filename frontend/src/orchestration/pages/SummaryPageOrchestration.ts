/**
 * Summary Page Orchestration
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
 * Summary Page Metadata
 */
export const summaryPageMetadata: PageMetadata = {
  id: 'summary',
  name: 'Summary',
  description: 'Generate comprehensive reports from reconciliation results',
  category: 'analytics',
  features: ['report-generation', 'export', 'analytics', 'visualization'],
  onboardingSteps: ['report-guide', 'export-help', 'analytics-info'],
  guidanceTopics: ['report-generation', 'export-options', 'analytics', 'data-visualization'],
  icon: 'summary',
};

/**
 * Get onboarding steps for summary page
 */
export function getSummaryOnboardingSteps(
  hasGeneratedReports: boolean,
  hasExportedData: boolean
): OnboardingStep[] {
  return [
    {
      id: 'report-guide',
      title: 'Generate Reports',
      description: 'Generate comprehensive reports from your reconciliation results',
      targetElement: 'generate-report-button',
      completed: hasGeneratedReports,
      skipped: false,
      order: 1,
    },
    {
      id: 'export-help',
      title: 'Export Data',
      description: 'Export reports to CSV, Excel, or PDF format',
      targetElement: 'export-button',
      completed: hasExportedData,
      skipped: false,
      order: 2,
    },
    {
      id: 'analytics-info',
      title: 'View Analytics',
      description: 'Explore analytics and insights from your reconciliation data',
      targetElement: 'analytics-panel',
      completed: false,
      skipped: false,
      order: 3,
    },
  ];
}

/**
 * Get page context for summary page
 */
export function getSummaryPageContext(
  projectId: string | undefined,
  reportsCount: number,
  exportedReportsCount: number,
  projectName?: string
): PageContext {
  return {
    projectId,
    projectName,
    reportsCount,
    exportedReportsCount,
    currentView: 'reports',
    timestamp: Date.now(),
  };
}

/**
 * Get workflow state for summary page
 */
export function getSummaryWorkflowState(): WorkflowState | null {
  // Summary page doesn't have a workflow state
  return null;
}

/**
 * Register guidance handlers for summary page
 */
export function registerSummaryGuidanceHandlers(
  onReportHelp: () => void,
  onExportHelp: () => void
): GuidanceHandler[] {
  return [
    {
      id: 'report-guidance',
      featureId: 'report-generation',
      handler: async (context: PageContext) => {
        if (context.reportsCount === 0) {
          return {
            id: `report-tip-${Date.now()}`,
            type: 'tip',
            content: 'Generate a report to see comprehensive reconciliation results and insights!',
            timestamp: new Date(),
            page: 'summary',
            priority: 'medium',
            dismissible: true,
          };
        }
        return null;
      },
      priority: 1,
    },
    {
      id: 'export-guidance',
      featureId: 'export',
      handler: async (context: PageContext) => {
        if ((context.reportsCount as number) > 0 && context.exportedReportsCount === 0) {
          return {
            id: `export-tip-${Date.now()}`,
            type: 'tip',
            content: 'Export your reports to CSV, Excel, or PDF for sharing and archiving.',
            timestamp: new Date(),
            page: 'summary',
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
 * Get guidance content for summary page
 */
export function getSummaryGuidanceContent(topic: string): GuidanceContent[] {
  const guidanceMap: Record<string, GuidanceContent[]> = {
    'report-generation': [
      {
        id: 'report-types',
        title: 'Report Types',
        content:
          'Generate summary reports, detailed reports, or custom reports based on your needs.',
        type: 'info',
      },
      {
        id: 'report-customization',
        title: 'Customize Reports',
        content: 'Select specific data fields, date ranges, and filters to customize your reports.',
        type: 'tip',
      },
    ],
    'export-options': [
      {
        id: 'export-formats',
        title: 'Export Formats',
        content:
          'Export to CSV for data analysis, Excel for spreadsheets, or PDF for presentations.',
        type: 'info',
      },
      {
        id: 'export-tips',
        title: 'Export Tips',
        content:
          'Filter and sort data before exporting for best results. Large exports may take time.',
        type: 'tip',
      },
    ],
    analytics: [
      {
        id: 'analytics-overview',
        title: 'Analytics Overview',
        content: 'View key metrics, trends, and insights from your reconciliation data.',
        type: 'info',
      },
      {
        id: 'analytics-features',
        title: 'Analytics Features',
        content:
          'Explore interactive charts, filters, and drill-down capabilities for deeper insights.',
        type: 'tip',
      },
    ],
    'data-visualization': [
      {
        id: 'visualization-types',
        title: 'Visualization Types',
        content: 'Create charts, graphs, and dashboards to visualize your reconciliation data.',
        type: 'info',
      },
      {
        id: 'visualization-tips',
        title: 'Visualization Tips',
        content:
          'Choose appropriate chart types based on your data. Use filters to focus on specific insights.',
        type: 'tip',
      },
    ],
  };

  return guidanceMap[topic] || [];
}
