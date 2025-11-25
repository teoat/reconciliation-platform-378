/**
 * Data Ingestion Features
 * 
 * Features related to data upload, processing, and transformation
 */

import { registerFeature, type FeatureMetadata } from '../registry';

// File Upload Feature
registerFeature({
  id: 'data-ingestion:file-upload',
  name: 'File Upload',
  description: 'Upload and process data files (CSV, Excel, JSON) for reconciliation',
  category: 'data-ingestion',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'upload-file',
      name: 'Upload File',
      description: 'Upload a data file for processing',
      parameters: [
        { name: 'file', type: 'File', required: true, description: 'File to upload' },
        { name: 'projectId', type: 'string', required: true, description: 'Target project ID' },
      ],
      estimatedDuration: 5000,
    },
    {
      id: 'validate-file',
      name: 'Validate File',
      description: 'Validate file format and structure',
      parameters: [
        { name: 'file', type: 'File', required: true },
      ],
      estimatedDuration: 2000,
    },
  ],
  frenlyIntegration: {
    providesGuidance: true,
    helpContentIds: ['file-upload-guide', 'file-format-requirements'],
    onboardingSteps: ['upload-files'],
    tips: [
      'Ensure CSV files have headers in the first row',
      'Check file encoding (UTF-8 recommended)',
      'Verify data types match expected format',
    ],
    progressMilestones: ['file-uploaded', 'file-validated', 'file-processed'],
  },
  metaAgentIntegration: {
    monitorable: true,
    executable: true,
    compatibleAgents: ['monitoring', 'processing'],
    metrics: [
      { name: 'upload_success_rate', type: 'gauge', description: 'File upload success rate' },
      { name: 'upload_duration', type: 'histogram', description: 'Time to upload file', unit: 'ms' },
    ],
    events: [
      { name: 'file.uploaded', description: 'File successfully uploaded' },
      { name: 'file.validation.failed', description: 'File validation failed' },
    ],
  },
});

// Field Mapping Feature
registerFeature({
  id: 'data-ingestion:field-mapping',
  name: 'Field Mapping',
  description: 'Map source data fields to target schema',
  category: 'data-ingestion',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'map-fields',
      name: 'Map Fields',
      description: 'Create mapping between source and target fields',
      parameters: [
        { name: 'sourceFields', type: 'string[]', required: true },
        { name: 'targetFields', type: 'string[]', required: true },
      ],
    },
  ],
  frenlyIntegration: {
    providesGuidance: true,
    helpContentIds: ['field-mapping-guide'],
    tips: ['Use auto-mapping suggestions when available'],
  },
  metaAgentIntegration: {
    monitorable: true,
    executable: false,
    compatibleAgents: ['monitoring'],
  },
});

// Re-export components and utilities
export { FileUploadInterface } from '../../components/FileUploadInterface';
export { default as EnhancedIngestionPage } from '../../components/EnhancedIngestionPage';

