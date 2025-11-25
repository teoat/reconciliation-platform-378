/**
 * Analytics Features
 * 
 * Features related to data analysis, visualization, and reporting
 */

import { registerFeature, type FeatureMetadata } from '../registry';

// Analytics Dashboard Feature
registerFeature({
  id: 'analytics:dashboard',
  name: 'Analytics Dashboard',
  description: 'Comprehensive analytics and visualization dashboard',
  category: 'analytics',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'generate-report',
      name: 'Generate Report',
      description: 'Generate analytics report',
      parameters: [
        { name: 'reportType', type: 'string', required: true },
        { name: 'dateRange', type: 'DateRange', required: false },
      ],
      estimatedDuration: 10000,
    },
  ],
  frenlyIntegration: {
    providesGuidance: true,
    helpContentIds: ['analytics-guide'],
    tips: ['Use filters to focus on specific data', 'Export reports for sharing'],
  },
  metaAgentIntegration: {
    monitorable: true,
    executable: false,
    compatibleAgents: ['monitoring'],
  },
});

// Re-export components
export { AnalyticsDashboard } from '../../components/AnalyticsDashboard';
export { default as ReconciliationAnalytics } from '../../components/ReconciliationAnalytics';

