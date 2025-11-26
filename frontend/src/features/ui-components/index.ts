/**
 * UI Component Features
 * 
 * Reusable UI components with AI integration metadata
 */

import { registerFeature } from '../registry';

// Data Table Feature
registerFeature({
  id: 'ui:data-table',
  name: 'Data Table',
  description: 'Advanced data table with sorting, filtering, and virtualization',
  category: 'ui-component',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'sort-column',
      name: 'Sort Column',
      description: 'Sort table by column',
      parameters: [
        { name: 'columnKey', type: 'string', required: true },
        { name: 'direction', type: "'asc' | 'desc'", required: true },
      ],
    },
    {
      id: 'filter-data',
      name: 'Filter Data',
      description: 'Apply filter to table data',
      parameters: [
        { name: 'filters', type: 'Record<string, string>', required: true },
      ],
    },
  ],
  frenlyIntegration: {
    providesGuidance: true,
    tips: ['Use keyboard navigation (arrow keys) to navigate rows', 'Click column headers to sort'],
  },
  metaAgentIntegration: {
    monitorable: false,
    executable: false,
  },
});

// Help Search Feature
registerFeature({
  id: 'ui:help-search',
  name: 'Help Search',
  description: 'Searchable help system with contextual guidance',
  category: 'ui-component',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'search-help',
      name: 'Search Help',
      description: 'Search help content',
      parameters: [
        { name: 'query', type: 'string', required: true },
      ],
    },
  ],
  frenlyIntegration: {
    providesGuidance: true,
    helpContentIds: ['help-search-guide'],
  },
  metaAgentIntegration: {
    monitorable: true,
    executable: false,
    compatibleAgents: ['guidance'],
  },
});

// Re-export components
export { DataTable } from '../../components/ui/DataTable';
export { VirtualizedTable } from '../../components/ui/VirtualizedTable';
export { HelpSearch } from '../../components/ui/HelpSearch';
export { HelpSearchInline } from '../../components/help/HelpSearch';

