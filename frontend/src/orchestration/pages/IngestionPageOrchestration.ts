/**
 * Ingestion Page Orchestration
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
 * Ingestion Page Metadata
 */
export const ingestionPageMetadata: PageMetadata = {
  id: 'ingestion',
  name: 'Data Ingestion',
  description: 'Data import and processing',
  category: 'workflow',
  features: ['file-upload', 'data-validation', 'processing', 'data-preview'],
  onboardingSteps: ['upload-guide', 'validation-help', 'processing-info'],
  guidanceTopics: ['file-formats', 'data-quality', 'processing-options', 'validation'],
  icon: 'ingestion',
};

/**
 * Get onboarding steps for ingestion page
 */
export function getIngestionOnboardingSteps(
  hasUploadedFiles: boolean,
  hasValidatedData: boolean
): OnboardingStep[] {
  return [
    {
      id: 'upload-guide',
      title: 'Upload Your Data',
      description: 'Upload CSV, Excel, or JSON files containing your data',
      targetElement: 'upload-area',
      completed: hasUploadedFiles,
      skipped: false,
      order: 1,
    },
    {
      id: 'validation-help',
      title: 'Validate Your Data',
      description: 'Review validation results and fix any issues',
      targetElement: 'validation-panel',
      completed: hasValidatedData,
      skipped: false,
      order: 2,
    },
    {
      id: 'processing-info',
      title: 'Process Your Data',
      description: 'Start processing to prepare data for reconciliation',
      targetElement: 'process-button',
      completed: false,
      skipped: false,
      order: 3,
    },
  ];
}

/**
 * Get page context for ingestion page
 */
export function getIngestionPageContext(
  projectId: string | undefined,
  uploadedFilesCount: number,
  validatedFilesCount: number,
  processingStatus: 'idle' | 'processing' | 'completed' | 'error',
  projectName?: string
): PageContext {
  return {
    projectId,
    projectName,
    uploadedFilesCount,
    validatedFilesCount,
    processingStatus,
    currentView: 'upload',
    timestamp: Date.now(),
  };
}

/**
 * Get workflow state for ingestion page
 */
export function getIngestionWorkflowState(
  uploadedFilesCount: number,
  validatedFilesCount: number,
  processingStatus: string
): WorkflowState {
  const steps = ['upload', 'validate', 'process'];
  const completedSteps: string[] = [];

  if (uploadedFilesCount > 0) completedSteps.push('upload');
  if (validatedFilesCount > 0) completedSteps.push('validate');
  if (processingStatus === 'completed') completedSteps.push('process');

  const progress = (completedSteps.length / steps.length) * 100;

  return {
    workflowId: 'ingestion-workflow',
    currentStep:
      processingStatus === 'processing'
        ? 'process'
        : completedSteps[completedSteps.length - 1] || 'upload',
    completedSteps,
    totalSteps: steps.length,
    progress: Math.round(progress),
    metadata: {
      steps,
      processingStatus,
    },
  };
}

/**
 * Register guidance handlers for ingestion page
 */
export function registerIngestionGuidanceHandlers(): GuidanceHandler[] {
  return [
    {
      id: 'upload-guidance',
      featureId: 'file-upload',
      handler: async (context: PageContext) => {
        if (context.uploadedFilesCount === 0) {
          return {
            id: `upload-tip-${Date.now()}`,
            type: 'tip',
            content:
              'Upload your data files to get started. We support CSV, Excel, and JSON formats!',
            timestamp: new Date(),
            page: 'ingestion',
            priority: 'high',
            dismissible: true,
          };
        }
        return null;
      },
      priority: 1,
    },
    {
      id: 'validation-guidance',
      featureId: 'data-validation',
      handler: async (context: PageContext) => {
        if (context.uploadedFilesCount > 0 && context.validatedFilesCount === 0) {
          return {
            id: `validation-tip-${Date.now()}`,
            type: 'tip',
            content: 'Review validation results to ensure your data is properly formatted.',
            timestamp: new Date(),
            page: 'ingestion',
            priority: 'medium',
            dismissible: true,
          };
        }
        return null;
      },
      priority: 2,
    },
    {
      id: 'processing-guidance',
      featureId: 'processing',
      handler: async (context: PageContext) => {
        if (context.processingStatus === 'processing') {
          return {
            id: `processing-tip-${Date.now()}`,
            type: 'tip',
            content: 'Processing is in progress. This may take a few minutes for large files.',
            timestamp: new Date(),
            page: 'ingestion',
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
 * Get guidance content for ingestion page
 */
export function getIngestionGuidanceContent(topic: string): GuidanceContent[] {
  const guidanceMap: Record<string, GuidanceContent[]> = {
    'file-formats': [
      {
        id: 'supported-formats',
        title: 'Supported Formats',
        content: 'We support CSV, Excel (.xlsx, .xls), and JSON files up to 50MB',
        type: 'info',
      },
      {
        id: 'format-requirements',
        title: 'Format Requirements',
        content: 'Ensure your files have clear headers and consistent data structure',
        type: 'tip',
      },
    ],
    'data-quality': [
      {
        id: 'data-validation',
        title: 'Data Validation',
        content: 'Files are automatically validated for format, structure, and data quality',
        type: 'info',
      },
      {
        id: 'quality-tips',
        title: 'Quality Tips',
        content: 'Remove empty rows, ensure consistent date formats, and check for duplicates',
        type: 'tip',
      },
    ],
    'processing-options': [
      {
        id: 'processing-modes',
        title: 'Processing Modes',
        content: 'Choose between standard and advanced processing based on your data complexity',
        type: 'info',
      },
      {
        id: 'processing-time',
        title: 'Processing Time',
        content: 'Processing time depends on file size. Large files may take several minutes',
        type: 'tip',
      },
    ],
    validation: [
      {
        id: 'validation-checks',
        title: 'Validation Checks',
        content: 'We validate data types, required fields, and data consistency',
        type: 'info',
      },
      {
        id: 'fix-validation-errors',
        title: 'Fix Errors',
        content: 'Review validation errors and fix them in your source files before re-uploading',
        type: 'tip',
      },
    ],
  };

  return guidanceMap[topic] || [];
}
