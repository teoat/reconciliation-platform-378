/**
 * Utility Features
 * 
 * General utility features and helpers
 */

import { registerFeature, type FeatureMetadata } from '../registry';

// Virtual Scrolling Feature
registerFeature({
  id: 'utility:virtual-scrolling',
  name: 'Virtual Scrolling',
  description: 'Efficient rendering of large lists using virtual scrolling',
  category: 'utility',
  status: 'active',
  version: '1.0.0',
  actions: [],
  metaAgentIntegration: {
    monitorable: true,
    executable: false,
    compatibleAgents: ['monitoring', 'optimization'],
    metrics: [
      { name: 'virtual_scroll_performance', type: 'histogram', description: 'Virtual scroll rendering performance', unit: 'ms' },
    ],
  },
});

// Error Handling Feature
registerFeature({
  id: 'utility:error-handling',
  name: 'Error Handling',
  description: 'Centralized error handling and recovery',
  category: 'utility',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'report-error',
      name: 'Report Error',
      description: 'Report an error for tracking',
      parameters: [
        { name: 'error', type: 'Error', required: true },
        { name: 'context', type: 'Record<string, unknown>', required: false },
      ],
    },
  ],
  metaAgentIntegration: {
    monitorable: true,
    executable: true,
    compatibleAgents: ['monitoring', 'remediation'],
    events: [
      { name: 'error.occurred', description: 'An error occurred' },
      { name: 'error.recovered', description: 'Error recovery attempted' },
    ],
  },
});

// Re-export utilities
export { useVirtualScroll, VirtualScrollResult } from '../../utils/virtualScrolling';
export * from '../../utils/errorHandler';

