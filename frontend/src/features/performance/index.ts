/**
 * Performance Features
 * 
 * Features related to performance monitoring, optimization, and caching
 */

import { registerFeature } from '../registry';

// Performance Monitoring Feature
registerFeature({
  id: 'performance:monitoring',
  name: 'Performance Monitoring',
  description: 'Monitor application performance metrics',
  category: 'performance',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'get-metrics',
      name: 'Get Metrics',
      description: 'Retrieve current performance metrics',
      outputType: 'PerformanceMetrics',
    },
  ],
  metaAgentIntegration: {
    monitorable: true,
    executable: true,
    compatibleAgents: ['monitoring', 'optimization'],
    metrics: [
      { name: 'render_time', type: 'histogram', description: 'Component render time', unit: 'ms' },
      { name: 'api_response_time', type: 'histogram', description: 'API response time', unit: 'ms' },
    ],
  },
});

// Caching Feature
registerFeature({
  id: 'performance:caching',
  name: 'Caching',
  description: 'Application data caching and cache management',
  category: 'performance',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'clear-cache',
      name: 'Clear Cache',
      description: 'Clear application cache',
      parameters: [
        { name: 'cacheKey', type: 'string', required: false, description: 'Specific cache key, or all if omitted' },
      ],
    },
  ],
  metaAgentIntegration: {
    monitorable: true,
    executable: true,
    compatibleAgents: ['monitoring', 'optimization'],
    metrics: [
      { name: 'cache_hit_rate', type: 'gauge', description: 'Cache hit rate percentage' },
    ],
  },
});

// Re-export utilities
export { usePerformanceMonitoring } from '../../utils/performanceMonitoring';
export { useRenderPerformance } from '../../utils/performanceMonitoring';

