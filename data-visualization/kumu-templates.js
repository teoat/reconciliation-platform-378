// ============================================================================
// KUMU VISUALIZER - Templates Module
// ============================================================================

/**
 * Load visualization templates for different network types
 * @param {Map} templates - Templates map to populate
 */
export function loadVisualizationTemplates(templates) {
  // Network Analysis Template
  templates.set('network-analysis', {
    name: 'Network Analysis',
    description: 'Analyze relationships and connections between entities',
    elementTypes: ['person', 'organization', 'location', 'event', 'resource'],
    connectionTypes: ['colleague', 'member', 'located', 'participant', 'owns', 'collaborates'],
    layouts: ['force-directed', 'hierarchical', 'circular'],
    metrics: ['centrality', 'betweenness', 'degree', 'clustering'],
  });

  // Organizational Chart Template
  templates.set('org-chart', {
    name: 'Organizational Chart',
    description: 'Visualize organizational structure and reporting relationships',
    elementTypes: ['employee', 'department', 'team', 'role', 'manager'],
    connectionTypes: ['reports-to', 'manages', 'member-of', 'leads'],
    layouts: ['hierarchical', 'tree'],
    metrics: ['span-of-control', 'depth', 'reporting-lines'],
  });

  // Supply Chain Template
  templates.set('supply-chain', {
    name: 'Supply Chain Analysis',
    description: 'Map suppliers, manufacturers, distributors, and customers',
    elementTypes: ['supplier', 'manufacturer', 'distributor', 'retailer', 'customer'],
    connectionTypes: ['supplies', 'manufactures', 'distributes', 'sells-to', 'buys-from'],
    layouts: ['flow', 'hierarchical'],
    metrics: ['lead-time', 'reliability', 'cost', 'capacity'],
  });

  // Knowledge Graph Template
  templates.set('knowledge-graph', {
    name: 'Knowledge Graph',
    description: 'Represent knowledge domains and their relationships',
    elementTypes: ['concept', 'person', 'organization', 'technology', 'document'],
    connectionTypes: ['related-to', 'part-of', 'instance-of', 'author-of', 'uses'],
    layouts: ['force-directed', 'semantic'],
    metrics: ['importance', 'connectivity', 'semantic-similarity'],
  });

  // Social Network Template
  templates.set('social-network', {
    name: 'Social Network Analysis',
    description: 'Analyze social connections and influence patterns',
    elementTypes: ['person', 'group', 'community', 'influencer'],
    connectionTypes: ['friend', 'follows', 'member', 'influences', 'collaborates'],
    layouts: ['force-directed', 'community'],
    metrics: ['influence', 'centrality', 'community-detection', 'homophily'],
  });

  // Project Dependencies Template
  templates.set('project-dependencies', {
    name: 'Project Dependencies',
    description: 'Map project tasks, dependencies, and resources',
    elementTypes: ['task', 'milestone', 'resource', 'deliverable', 'risk'],
    connectionTypes: ['depends-on', 'precedes', 'requires', 'produces', 'mitigates'],
    layouts: ['timeline', 'dependency-graph'],
    metrics: ['critical-path', 'slack', 'resource-utilization'],
  });
}
