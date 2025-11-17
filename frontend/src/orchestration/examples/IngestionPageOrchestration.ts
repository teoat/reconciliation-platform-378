/**
 * Ingestion Page Orchestration
 * 
 * Orchestration configuration for the Ingestion page
 */

import type {
  PageMetadata,
  PageContext,
  OnboardingStep,
  GuidanceHandler,
} from '../types';

/**
 * Ingestion Page Metadata
 */
export const ingestionPageMetadata: PageMetadata = {
  id: 'ingestion',
  name: 'Data Ingestion',
  description: 'Data import and processing',
  category: 'workflow',
  features: ['file-upload', 'data-validation', 'processing', 'file-management'],
  onboardingSteps: [
    'upload-guide',
    'validation-help',
    'processing-info',
  ],
  guidanceTopics: [
    'file-formats',
    'data-quality',
    'processing-options',
    'validation',
  ],
  icon: 'ingestion',
};

/**
 * Get onboarding steps for ingestion page
 */
export function getIngestionOnboardingSteps(
  hasUploadedFiles: boolean,
  hasProcessedFiles: boolean
): OnboardingStep[] {
  return [
    {
      id: 'upload-guide',
      title: 'Upload Your Files',
      description: 'Upload CSV, Excel, or JSON files containing your data',
      targetElement: 'upload-area',
      completed: hasUploadedFiles,
      skipped: false,
      order: 1,
    },
    {
      id: 'validation-help',
      title: 'Data Validation',
      description: 'Files are automatically validated after upload',
      targetElement: 'validation-status',
      completed: hasProcessedFiles,
      skipped: false,
      order: 2,
    },
    {
      id: 'processing-info',
      title: 'Processing',
      description: 'Files are processed to prepare them for reconciliation',
      targetElement: 'processing-status',
      completed: hasProcessedFiles,
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
  processedFilesCount: number,
  projectName?: string
): PageContext {
  return {
    projectId,
    projectName,
    uploadedFilesCount,
    processedFilesCount,
    currentView: 'ingestion',
    timestamp: Date.now(),
  };
}

/**
 * Register guidance handlers for ingestion page
 */
export function registerIngestionGuidanceHandlers(
  onUploadHelp: () => void,
  onValidationHelp: () => void
): GuidanceHandler[] {
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
              'Upload your data files here. Supported formats: CSV, Excel (.xlsx, .xls), and JSON. Maximum file size: 50MB.',
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
        if (context.uploadedFilesCount > 0 && context.processedFilesCount === 0) {
          return {
            id: `validation-tip-${Date.now()}`,
            type: 'tip',
            content:
              'Files are being validated. Check the status column to see validation results.',
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
  ];
}

/**
 * Get guidance content for ingestion page
 */
export function getIngestionGuidanceContent(
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
    'file-formats': [
      {
        id: 'supported-formats',
        title: 'Supported Formats',
        content: 'We support CSV, Excel (.xlsx, .xls), and JSON files up to 50MB per file.',
        type: 'info',
      },
      {
        id: 'format-requirements',
        title: 'Format Requirements',
        content: 'CSV files should have headers in the first row. Excel files should have data starting from row 1.',
        type: 'tip',
      },
    ],
    'data-quality': [
      {
        id: 'quality-tips',
        title: 'Data Quality Tips',
        content: 'Ensure your data is clean: remove empty rows, fix formatting issues, and ensure consistent column names.',
        type: 'tip',
      },
      {
        id: 'validation',
        title: 'Automatic Validation',
        content: 'Files are automatically validated for format, structure, and data quality issues.',
        type: 'info',
      },
    ],
    'processing-options': [
      {
        id: 'processing-info',
        title: 'Processing',
        content: 'Files are processed to extract data and prepare it for reconciliation. This may take a few minutes for large files.',
        type: 'info',
      },
      {
        id: 'processing-status',
        title: 'Status Tracking',
        content: 'You can track processing status in real-time. You\'ll be notified when processing is complete.',
        type: 'tip',
      },
    ],
  };

  return guidanceMap[topic] || [];
}

