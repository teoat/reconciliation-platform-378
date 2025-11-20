/**
 * Reconciliation Page Orchestration Example
 *
 * This file demonstrates how to integrate a page with the Frenly AI
 * orchestration system. This can be used as a reference for other pages.
 */

import type {
  PageMetadata,
  PageContext,
  OnboardingStep,
  GuidanceHandler,
  WorkflowState,
} from '../types';

/**
 * Reconciliation Page Metadata
 */
export const reconciliationPageMetadata: PageMetadata = {
  id: 'reconciliation',
  name: 'Reconciliation',
  description: 'Data reconciliation workflow',
  category: 'workflow',
  features: ['upload', 'configure', 'run-jobs', 'results'],
  onboardingSteps: ['upload-guide', 'configuration-help', 'job-execution', 'results-review'],
  guidanceTopics: ['data-upload', 'matching-strategies', 'job-management', 'results-analysis'],
  icon: 'reconciliation',
};

/**
 * Get onboarding steps for reconciliation page
 */
export function getReconciliationOnboardingSteps(
  activeTab: string,
  hasDataSources: boolean,
  hasJobs: boolean
): OnboardingStep[] {
  return [
    {
      id: 'upload-guide',
      title: 'Upload Your Data',
      description: 'Upload CSV or Excel files containing your reconciliation data',
      targetElement: 'upload-tab',
      completed: hasDataSources,
      skipped: false,
      order: 1,
    },
    {
      id: 'configuration-help',
      title: 'Configure Settings',
      description: 'Set matching threshold and other reconciliation parameters',
      targetElement: 'configure-tab',
      completed: activeTab === 'configure' || activeTab === 'run',
      skipped: false,
      order: 2,
    },
    {
      id: 'job-execution',
      title: 'Run Reconciliation Job',
      description: 'Start a reconciliation job to match your data',
      targetElement: 'run-tab',
      completed: hasJobs,
      skipped: false,
      order: 3,
    },
    {
      id: 'results-review',
      title: 'Review Results',
      description: 'Review and approve reconciliation matches',
      targetElement: 'results-tab',
      completed: false,
      skipped: false,
      order: 4,
    },
  ];
}

/**
 * Get page context for reconciliation page
 */
export function getReconciliationPageContext(
  projectId: string | undefined,
  activeTab: string,
  dataSourcesCount: number,
  jobsCount: number,
  matchesCount: number,
  projectName?: string
): PageContext {
  return {
    projectId,
    projectName,
    activeTab,
    dataSourcesCount,
    jobsCount,
    matchesCount,
    currentView: activeTab,
    timestamp: Date.now(),
  };
}

/**
 * Get workflow state for reconciliation page
 */
export function getReconciliationWorkflowState(
  activeTab: string,
  completedTabs: string[]
): WorkflowState {
  const allTabs = ['upload', 'configure', 'run', 'results'];
  const totalSteps = allTabs.length;
  const completedSteps = completedTabs;
  const progress = (completedSteps.length / totalSteps) * 100;

  return {
    workflowId: 'reconciliation-workflow',
    currentStep: activeTab,
    completedSteps,
    totalSteps,
    progress: Math.round(progress),
    metadata: {
      tabs: allTabs,
    },
  };
}

/**
 * Register guidance handlers for reconciliation page
 */
export function registerReconciliationGuidanceHandlers(
  _onUploadHelp: () => void,
  _onConfigureHelp: () => void,
  onJobHelp: () => void,
  onResultsHelp: () => void
): GuidanceHandler[] {
  return [
    {
      id: 'upload-guidance',
      featureId: 'upload',
      handler: async (context: PageContext) => {
        if (context.activeTab === 'upload') {
          return {
            id: `upload-tip-${Date.now()}`,
            type: 'tip',
            content:
              'Upload CSV or Excel files up to 50MB. Make sure your data is properly formatted!',
            timestamp: new Date(),
            page: 'reconciliation',
            priority: 'medium',
            dismissible: true,
          };
        }
        return null;
      },
      priority: 1,
    },
    {
      id: 'configure-guidance',
      featureId: 'configure',
      handler: async (context: PageContext) => {
        if (context.activeTab === 'configure') {
          return {
            id: `configure-tip-${Date.now()}`,
            type: 'tip',
            content:
              'Set your matching threshold based on data quality. Higher threshold = stricter matching.',
            timestamp: new Date(),
            page: 'reconciliation',
            priority: 'medium',
            dismissible: true,
          };
        }
        return null;
      },
      priority: 1,
    },
    {
      id: 'job-guidance',
      featureId: 'run-jobs',
      handler: async (context: PageContext) => {
        if (context.activeTab === 'run') {
          return {
            id: `job-tip-${Date.now()}`,
            type: 'tip',
            content: 'Jobs run in the background. You can continue working while they process!',
            timestamp: new Date(),
            page: 'reconciliation',
            priority: 'medium',
            dismissible: true,
          };
        }
        return null;
      },
      priority: 1,
    },
    {
      id: 'results-guidance',
      featureId: 'results',
      handler: async (context: PageContext) => {
        if (context.activeTab === 'results') {
          return {
            id: `results-tip-${Date.now()}`,
            type: 'tip',
            content:
              'Review matches carefully. You can approve, reject, or request more information.',
            timestamp: new Date(),
            page: 'reconciliation',
            priority: 'medium',
            dismissible: true,
          };
        }
        return null;
      },
      priority: 1,
    },
  ];
}

/**
 * Get guidance content for reconciliation page
 */
export function getReconciliationGuidanceContent(topic: string): Array<{
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
    'data-upload': [
      {
        id: 'upload-formats',
        title: 'Supported Formats',
        content: 'We support CSV, Excel (.xlsx, .xls), and JSON files up to 50MB',
        type: 'info',
      },
      {
        id: 'upload-validation',
        title: 'Data Validation',
        content: 'Files are automatically validated after upload for format and structure',
        type: 'tip',
      },
      {
        id: 'upload-best-practices',
        title: 'Best Practices',
        content:
          'Ensure column headers are clear and consistent. Remove empty rows before uploading.',
        type: 'tip',
      },
    ],
    'matching-strategies': [
      {
        id: 'matching-threshold',
        title: 'Matching Threshold',
        content:
          'Higher threshold (0.8-1.0) = stricter matching. Lower threshold (0.5-0.7) = more lenient.',
        type: 'tip',
      },
      {
        id: 'matching-algorithms',
        title: 'Matching Algorithms',
        content: 'We use fuzzy matching, exact matching, and machine learning for best results',
        type: 'info',
      },
    ],
    'job-management': [
      {
        id: 'job-execution',
        title: 'Job Execution',
        content:
          'Jobs run asynchronously. You can monitor progress in real-time and cancel if needed.',
        type: 'info',
      },
      {
        id: 'job-optimization',
        title: 'Performance Tips',
        content:
          'For large datasets, consider running jobs during off-peak hours for better performance',
        type: 'tip',
      },
    ],
    'results-analysis': [
      {
        id: 'results-review',
        title: 'Review Process',
        content:
          'Review matches by confidence score. High confidence matches can be auto-approved.',
        type: 'tip',
      },
      {
        id: 'results-export',
        title: 'Export Options',
        content:
          'Export results to CSV, Excel, or PDF. Filter and sort before exporting for best results.',
        type: 'info',
      },
    ],
  };

  return guidanceMap[topic] || [];
}

/**
 * Example usage in ReconciliationPage component:
 *
 * ```typescript
 * import { usePageOrchestration } from '@/hooks/usePageOrchestration';
 * import {
 *   reconciliationPageMetadata,
 *   getReconciliationOnboardingSteps,
 *   getReconciliationPageContext,
 *   getReconciliationWorkflowState,
 *   registerReconciliationGuidanceHandlers,
 *   getReconciliationGuidanceContent,
 * } from '@/orchestration/examples/ReconciliationPageOrchestration';
 *
 * const ReconciliationPage: React.FC = () => {
 *   const { projectId } = useParams();
 *   const [activeTab, setActiveTab] = useState('upload');
 *   // ... other state
 *
 *   // Use orchestration hook
 *   const {
 *     updatePageContext,
 *     trackFeatureUsage,
 *     trackFeatureError,
 *   } = usePageOrchestration({
 *     pageMetadata: reconciliationPageMetadata,
 *     getPageContext: () => getReconciliationPageContext(
 *       projectId,
 *       activeTab,
 *       dataSources?.length || 0,
 *       jobs?.length || 0,
 *       matches?.length || 0,
 *       project?.name
 *     ),
 *     getOnboardingSteps: () => getReconciliationOnboardingSteps(
 *       activeTab,
 *       (dataSources?.length || 0) > 0,
 *       (jobs?.length || 0) > 0
 *     ),
 *     getWorkflowState: () => getReconciliationWorkflowState(
 *       activeTab,
 *       completedTabs
 *     ),
 *     registerGuidanceHandlers: () => registerReconciliationGuidanceHandlers(
 *       () => {}, // upload help
 *       () => {}, // configure help
 *       () => {}, // job help
 *       () => {}  // results help
 *     ),
 *     getGuidanceContent: (topic) => getReconciliationGuidanceContent(topic),
 *     onContextChange: (changes) => {
 *       // Handle context changes if needed
 *     },
 *   });
 *
 *   // Track feature usage
 *   const handleFileUpload = async (files: File[]) => {
 *     trackFeatureUsage('upload', 'file-upload-started', { fileCount: files.length });
 *     try {
 *       // ... upload logic
 *       trackFeatureUsage('upload', 'file-upload-success', { fileCount: files.length });
 *     } catch (error) {
 *       trackFeatureError('upload', error);
 *     }
 *   };
 *
 *   // Update context when tab changes
 *   useEffect(() => {
 *     updatePageContext({ activeTab });
 *   }, [activeTab, updatePageContext]);
 *
 *   // ... rest of component
 * };
 * ```
 */
