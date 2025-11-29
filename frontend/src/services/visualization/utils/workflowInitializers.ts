/**
 * Workflow initialization utilities
 */

import { logger } from '@/services/logger';
import type { WorkflowStage, ContextualHelp } from '../types';

/**
 * Initialize default reconciliation workflow
 */
export function initializeDefaultReconciliationWorkflow(): WorkflowStage[] {
  return [
    {
      id: 'data_setup',
      name: 'Data Setup',
      description: 'Upload, validate, and map your data fields',
      order: 1,
      status: 'pending',
      progress: 0,
      estimatedTime: 25,
      dependencies: [],
      requirements: [
        {
          id: 'upload_files',
          type: 'file',
          description: 'Upload CSV or Excel files',
          isRequired: true,
          isCompleted: false,
        },
        {
          id: 'validate_format',
          type: 'validation',
          description: 'Validate file format and structure',
          isRequired: true,
          isCompleted: false,
        },
        {
          id: 'map_required_fields',
          type: 'validation',
          description: 'Map all required fields',
          isRequired: true,
          isCompleted: false,
        },
      ],
      help: {
        title: 'Data Setup Help',
        description: 'Upload your files, validate format, and map fields in one streamlined step',
        tips: [
          'Ensure your files are in CSV or Excel format',
          'Use AI suggestions for automatic field mapping',
          'Verify mapped fields before proceeding',
          'Save your progress - you can continue later',
        ],
        examples: ['Sample CSV file with proper headers', 'Excel template with validation rules'],
        links: [
          {
            title: 'Data Format Guide',
            url: '/docs/data-format',
            type: 'documentation',
          },
          {
            title: 'Field Mapping Guide',
            url: '/docs/field-mapping',
            type: 'documentation',
          },
        ],
        faq: [
          {
            question: 'What file formats are supported?',
            answer: 'We support CSV and Excel files (.xlsx, .xls)',
          },
          {
            question: 'Can I save my progress and continue later?',
            answer: 'Yes! Your data setup is automatically saved as you work',
          },
        ],
      },
      validation: {
        rules: [
          {
            id: 'file_required',
            field: 'files',
            condition: 'required',
            message: 'At least one file must be uploaded',
            severity: 'error',
          },
          {
            id: 'required_fields_mapped',
            field: 'mappedFields',
            condition: 'required',
            message: 'All required fields must be mapped',
            severity: 'error',
          },
        ],
        autoValidate: true,
        showProgress: true,
        allowSkip: false,
      },
    },
    {
      id: 'reconciliation',
      name: 'AI Reconciliation',
      description: 'Run AI-powered reconciliation algorithms',
      order: 2,
      status: 'pending',
      progress: 0,
      estimatedTime: 30,
      dependencies: ['data_setup'],
      requirements: [
        {
          id: 'run_algorithms',
          type: 'data',
          description: 'Execute reconciliation algorithms',
          isRequired: true,
          isCompleted: false,
        },
      ],
      help: {
        title: 'Reconciliation Help',
        description: 'Understand the AI reconciliation process',
        tips: [
          'Review matching rules before running',
          'Monitor progress and adjust settings if needed',
          'Check results for accuracy',
        ],
        examples: [],
        links: [
          {
            title: 'Reconciliation Guide',
            url: '/docs/reconciliation',
            type: 'documentation',
          },
        ],
        faq: [
          {
            question: 'How long does reconciliation take?',
            answer: 'Typically 5-30 minutes depending on data size',
          },
        ],
      },
      validation: {
        rules: [],
        autoValidate: false,
        showProgress: true,
        allowSkip: false,
      },
    },
    {
      id: 'review_and_export',
      name: 'Review & Export',
      description: 'Review results and export final reconciliation report',
      order: 3,
      status: 'pending',
      progress: 0,
      estimatedTime: 25,
      dependencies: ['reconciliation'],
      requirements: [
        {
          id: 'review_matches',
          type: 'approval',
          description: 'Review matched items',
          isRequired: true,
          isCompleted: false,
        },
        {
          id: 'handle_discrepancies',
          type: 'data',
          description: 'Handle unmatched items',
          isRequired: false,
          isCompleted: false,
        },
        {
          id: 'generate_report',
          type: 'data',
          description: 'Generate and export final report',
          isRequired: true,
          isCompleted: false,
        },
      ],
      help: {
        title: 'Review & Export Help',
        description: 'Review reconciliation results and export your final report',
        tips: [
          'Check match confidence scores',
          'Review unmatched items carefully',
          'Use bulk actions for efficiency',
          'Choose appropriate export format (CSV, Excel, PDF, JSON)',
          'Save reports for future reference',
        ],
        examples: [],
        links: [
          {
            title: 'Results Review Guide',
            url: '/docs/results-review',
            type: 'documentation',
          },
          {
            title: 'Export Guide',
            url: '/docs/export',
            type: 'documentation',
          },
        ],
        faq: [
          {
            question: 'What if I disagree with a match?',
            answer: 'You can manually adjust or reject any match',
          },
          {
            question: 'What export formats are available?',
            answer: 'CSV, Excel, PDF, and JSON formats are supported',
          },
        ],
      },
      validation: {
        rules: [],
        autoValidate: false,
        showProgress: true,
        allowSkip: false,
      },
    },
  ];
}

/**
 * Initialize default contextual help
 */
export function initializeDefaultContextualHelp(): Map<string, ContextualHelp> {
  const help = new Map<string, ContextualHelp>();

  // File upload help
  help.set('file_upload', {
    id: 'file_upload',
    trigger: 'hover',
    position: 'right',
    content: {
      title: 'File Upload Tips',
      description:
        'Drag and drop your files here or click to browse. Supported formats: CSV, Excel',
      actions: [
        {
          label: 'View Format Guide',
          action: () => window.open('/docs/data-format', '_blank'),
          type: 'link',
        },
      ],
    },
  });

  // Field mapping help
  help.set('field_mapping', {
    id: 'field_mapping',
    trigger: 'focus',
    position: 'bottom',
    content: {
      title: 'Field Mapping',
      description:
        'Map your data fields to the system fields. Use AI suggestions for automatic mapping.',
      actions: [
        {
          label: 'Use AI Suggestions',
          action: async () => {
            // AI suggestions feature implementation
            // This would integrate with the AI service to provide automatic field mapping suggestions
            try {
              // In production, this would:
              // 1. Analyze source data structure
              // 2. Call AI service with data samples
              // 3. Get mapping suggestions based on field names, types, and patterns
              // 4. Apply suggestions to mapping configuration
              // 5. Show user confirmation dialog
              
              // NOTE: AI suggestions feature is planned but not yet implemented
              // This feature will analyze data structure and suggest automatic field mappings
              // Integration points:
              // 1. Call aiService.suggestFieldMappings(sourceData, targetSchema)
              // 2. Apply suggestions via applyMappingSuggestions(suggestions)
              // 3. Show user confirmation dialog before applying
              // 
              // Current status: Placeholder - feature coming soon
              // When implemented, replace this block with actual AI service integration
            } catch (error) {
              logger.error('AI suggestions failed', { 
                error, 
                category: 'workflow',
                component: 'workflowInitializers'
              });
              // Handle error gracefully
            }
          },
          type: 'primary',
        },
      ],
    },
  });

  // Progress help
  help.set('progress_indicator', {
    id: 'progress_indicator',
    trigger: 'hover',
    position: 'top',
    content: {
      title: 'Progress Tracking',
      description:
        'Track your workflow progress. Click on any stage to see details and requirements.',
      actions: [],
    },
  });

  return help;
}

