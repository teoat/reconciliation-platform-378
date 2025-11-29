// ============================================================================
// KUMU VISUALIZER - Core Module
// ============================================================================

import { loadVisualizationTemplates } from './kumu-templates.js';
import {
  loadDataConnectors,
  parseCSVData,
  parseJSONData,
  parseDatabaseData,
  parseAPIData,
  parseGraphData,
} from './kumu-data-sources.js';
import { loadLayoutAlgorithms } from './kumu-layouts.js';

class KumuVisualizer {
  constructor() {
    this.diagrams = new Map();
    this.templates = new Map();
    this.dataSources = new Map();
    this.visualizations = new Map();
    this.layoutAlgorithms = {};
    this.isActive = false;
  }

  // Initialize the visualizer
  async initialize() {
    console.log('📊 Initializing Kumu-Compatible Data Visualizer...');

    loadVisualizationTemplates(this.templates);
    loadDataConnectors(this.dataSources);
    loadLayoutAlgorithms(this.layoutAlgorithms);

    this.isActive = true;
    console.log('✅ Kumu Visualizer activated');
  }

  // Generate Kumu-compatible diagram
  async generateKumuDiagram(templateName, dataSource, config = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    console.log(`📊 Generating Kumu diagram using ${template.name} template`);

    const { layout = 'force-directed', filters = {}, styling = {}, exportFormat = 'json' } = config;

    // Load and parse data
    const rawData = await this.loadData(dataSource);
    const parsedData = await this.parseData(rawData, dataSource);

    // Apply filters
    const filteredData = this.applyFilters(parsedData, filters);

    // Generate network structure
    const network = this.buildNetwork(filteredData, template);

    // Apply layout algorithm
    const layoutAlgorithm = this.layoutAlgorithms[layout];
    const positionedNetwork = await layoutAlgorithm.algorithm(network, layoutAlgorithm.parameters);

    // Apply styling
    const styledNetwork = this.applyStyling(positionedNetwork, styling, template);

    // Calculate metrics
    const metrics = this.calculateMetrics(styledNetwork, template);

    // Generate Kumu-compatible output
    const kumuDiagram = this.generateKumuFormat(styledNetwork, metrics, template, exportFormat);

    const result = {
      template: templateName,
      network: styledNetwork,
      metrics,
      kumuDiagram,
      metadata: {
        nodeCount: styledNetwork.nodes.length,
        edgeCount: styledNetwork.edges.length,
        layout,
        generatedAt: new Date().toISOString(),
        template: template.name,
      },
    };

    this.diagrams.set(`${templateName}_${Date.now()}`, result);
    console.log(
      `✅ Generated Kumu diagram with ${result.metadata.nodeCount} nodes and ${result.metadata.edgeCount} edges`
    );

    return result;
  }

  // Load data from source
  async loadData(dataSource) {
    const connector = this.dataSources.get(dataSource.type);
    if (!connector) {
      throw new Error(`Unknown data source type: ${dataSource.type}`);
    }

    console.log(`📥 Loading data from ${connector.name}`);

    // Simulate data loading based on source type
    switch (dataSource.type) {
      case 'csv':
        return this.simulateCSVData();
      case 'json':
        return this.simulateJSONData();
      case 'database':
        return this.simulateDatabaseData();
      case 'api':
        return this.simulateAPIData();
      case 'graph-db':
        return this.simulateGraphData();
      default:
        throw new Error(`Unsupported data source type: ${dataSource.type}`);
    }
  }

  // Parse data using connector
  async parseData(rawData, dataSource) {
    const connector = this.dataSources.get(dataSource.type);
    return await connector.parser(rawData, connector.schema);
  }

  // Apply filters to data
  applyFilters(data, filters) {
    let filteredNodes = data.nodes;
    let filteredEdges = data.edges;

    // Node type filter
    if (filters.nodeTypes && filters.nodeTypes.length > 0) {
      filteredNodes = filteredNodes.filter((node) => filters.nodeTypes.includes(node.type));
      const nodeIds = new Set(filteredNodes.map((n) => n.id));
      filteredEdges = filteredEdges.filter(
        (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
    }

    // Edge type filter
    if (filters.edgeTypes && filters.edgeTypes.length > 0) {
      filteredEdges = filteredEdges.filter((edge) => filters.edgeTypes.includes(edge.type));
    }

    // Property filters
    if (filters.nodeProperties) {
      filteredNodes = filteredNodes.filter((node) =>
        this.matchesProperties(node.properties, filters.nodeProperties)
      );
    }

    if (filters.edgeProperties) {
      filteredEdges = filteredEdges.filter((edge) =>
        this.matchesProperties(edge.properties, filters.edgeProperties)
      );
    }

    return { nodes: filteredNodes, edges: filteredEdges };
  }

  // Check if properties match filter
  matchesProperties(properties, filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (properties[key] !== value) {
        return false;
      }
    }
    return true;
  }

  // Build network structure
  buildNetwork(data, template) {
    const network = {
      nodes: data.nodes.map((node) => ({
        ...node,
        elementType: this.mapToTemplateType(node.type, template.elementTypes),
        size: this.calculateNodeSize(node),
        color: this.assignNodeColor(node, template),
      })),
      edges: data.edges.map((edge) => ({
        ...edge,
        connectionType: this.mapToTemplateConnection(edge.type, template.connectionTypes),
        width: this.calculateEdgeWidth(edge),
        color: this.assignEdgeColor(edge, template),
      })),
    };

    return network;
  }

  // Map node type to template element type
  mapToTemplateType(nodeType, elementTypes) {
    // Simple mapping - in real implementation would be more sophisticated
    const mapping = {
      person: 'person',
      organization: 'organization',
      company: 'organization',
      employee: 'person',
      department: 'organization',
      task: 'resource',
      project: 'resource',
    };

    return mapping[nodeType.toLowerCase()] || elementTypes[0] || 'entity';
  }

  // Map edge type to template connection type
  mapToTemplateConnection(edgeType, connectionTypes) {
    // Simple mapping
    const mapping = {
      'works-with': 'collaborates',
      'reports-to': 'reports-to',
      manages: 'manages',
      'member-of': 'member-of',
      supplies: 'supplies',
      'related-to': 'related-to',
    };

    return mapping[edgeType.toLowerCase()] || connectionTypes[0] || 'connected-to';
  }

  // Calculate node size based on properties
  calculateNodeSize(node) {
    const baseSize = 20;
    const sizeMultiplier = node.properties.importance || node.properties.size || 1;
    return Math.max(10, Math.min(50, baseSize * sizeMultiplier));
  }

  // Assign node color based on type
  assignNodeColor(node, template) {
    const colorPalette = {
      person: '#4A90E2',
      organization: '#F5A623',
      location: '#7ED321',
      event: '#D0021B',
      resource: '#9013FE',
    };

    return colorPalette[node.elementType] || '#9B9B9B';
  }

  // Calculate edge width based on weight
  calculateEdgeWidth(edge) {
    const baseWidth = 2;
    const weight = edge.weight || 1;
    return Math.max(1, Math.min(10, baseWidth * weight));
  }

  // Assign edge color based on type
  assignEdgeColor(edge, template) {
    const colorPalette = {
      collaborates: '#4A90E2',
      'reports-to': '#F5A623',
      manages: '#D0021B',
      'member-of': '#7ED321',
      supplies: '#9013FE',
    };

    return colorPalette[edge.connectionType] || '#9B9B9B';
  }

  // Apply styling to network
  applyStyling(network, styling, template) {
    const styledNetwork = { ...network };

    // Apply custom styling
    if (styling.nodeStyles) {
      styledNetwork.nodes = styledNetwork.nodes.map((node) => ({
        ...node,
        ...styling.nodeStyles[node.elementType],
      }));
    }

    if (styling.edgeStyles) {
      styledNetwork.edges = styledNetwork.edges.map((edge) => ({
        ...edge,
        ...styling.edgeStyles[edge.connectionType],
      }));
    }

    return styledNetwork;
  }

  // Calculate network metrics
  calculateMetrics(network, template) {
    const metrics = {
      nodes: network.nodes.length,
      edges: network.edges.length,
      density: this.calculateDensity(network),
      centrality: this.calculateCentrality(network),
      communities: this.detectCommunities(network).size,
    };

    // Calculate template-specific metrics
    if (template.metrics.includes('centrality')) {
      metrics.degreeCentrality = this.calculateDegreeCentrality(network);
    }

    if (template.metrics.includes('betweenness')) {
      metrics.betweennessCentrality = this.calculateBetweennessCentrality(network);
    }

    return metrics;
  }

  // Calculate network density
  calculateDensity(network) {
    const n = network.nodes.length;
    const maxEdges = (n * (n - 1)) / 2;
    return network.edges.length / maxEdges;
  }

  // Calculate degree centrality
  calculateDegreeCentrality(network) {
    const centrality = {};

    network.nodes.forEach((node) => {
      const degree = network.edges.filter(
        (e) => e.source === node.id || e.target === node.id
      ).length;
      centrality[node.id] = degree;
    });

    return centrality;
  }

  // Calculate betweenness centrality (simplified)
  calculateBetweennessCentrality(network) {
    const centrality = {};

    network.nodes.forEach((node) => {
      centrality[node.id] = 0;
    });

    // Simplified betweenness calculation
    network.nodes.forEach((node) => {
      const paths = this.findAllPaths(network, node.id);
      centrality[node.id] = paths.length;
    });

    return centrality;
  }

  // Find all paths from a node (simplified)
  findAllPaths(network, startId) {
    const paths = [];
    const visited = new Set();

    const dfs = (currentId, path) => {
      visited.add(currentId);
      path.push(currentId);

      const neighbors = network.edges
        .filter((e) => e.source === currentId || e.target === currentId)
        .map((e) => (e.source === currentId ? e.target : e.source))
        .filter((id) => !visited.has(id));

      if (neighbors.length === 0 && path.length > 1) {
        paths.push([...path]);
      } else {
        neighbors.forEach((neighbor) => {
          dfs(neighbor, path);
        });
      }

      path.pop();
      visited.delete(currentId);
    };

    dfs(startId, []);
    return paths;
  }

  // Simple community detection
  detectCommunities(network) {
    const communities = new Map();
    let communityId = 0;

    const assigned = new Set();

    for (const node of network.nodes) {
      if (!assigned.has(node.id)) {
        const community = this.findCommunity(node, network, assigned);
        communities.set(communityId++, community);
      }
    }

    return communities;
  }

  // Find connected component as community
  findCommunity(startNode, network, assigned) {
    const community = [];
    const queue = [startNode];
    assigned.add(startNode.id);

    while (queue.length > 0) {
      const node = queue.shift();
      community.push(node);

      // Find neighbors
      const neighbors = network.edges
        .filter((e) => e.source === node.id || e.target === node.id)
        .map((e) => (e.source === node.id ? e.target : e.source))
        .map((id) => network.nodes.find((n) => n.id === id))
        .filter((n) => n && !assigned.has(n.id));

      neighbors.forEach((neighbor) => {
        assigned.add(neighbor.id);
        queue.push(neighbor);
      });
    }

    return community;
  }

  // Generate Kumu-compatible format
  generateKumuFormat(network, metrics, template, format) {
    const kumuData = {
      elements: network.nodes.map((node) => ({
        _id: node.id,
        label: node.label,
        type: node.elementType,
        size: node.size,
        color: node.color,
        x: node.x,
        y: node.y,
        properties: node.properties,
      })),
      connections: network.edges.map((edge) => ({
        _id: `${edge.source}-${edge.target}`,
        from: edge.source,
        to: edge.target,
        type: edge.connectionType,
        width: edge.width,
        color: edge.color,
        weight: edge.weight,
        properties: edge.properties,
      })),
      perspectives: [
        {
          name: 'Default View',
          elementRules: template.elementTypes.map((type) => ({
            selector: `type="${type}"`,
            style: {
              size: 'size',
              color: 'color',
            },
          })),
          connectionRules: template.connectionTypes.map((type) => ({
            selector: `type="${type}"`,
            style: {
              width: 'width',
              color: 'color',
            },
          })),
        },
      ],
      metrics: metrics,
    };

    if (format === 'json') {
      return JSON.stringify(kumuData, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(kumuData);
    }

    return kumuData;
  }

  // Convert to CSV format
  convertToCSV(data) {
    const csv = {
      elements:
        'id,label,type,size,color,x,y\n' +
        data.elements
          .map((e) => `${e._id},${e.label},${e.type},${e.size},${e.color},${e.x},${e.y}`)
          .join('\n'),
      connections:
        'from,to,type,width,color,weight\n' +
        data.connections
          .map((c) => `${c.from},${c.to},${c.type},${c.width},${c.color},${c.weight}`)
          .join('\n'),
    };

    return csv;
  }

  // Generate visualization from data
  async generateVisualization(templateName, dataSource, config = {}) {
    const diagram = await this.generateKumuDiagram(templateName, dataSource, config);

    const visualization = {
      id: `viz_${Date.now()}`,
      diagram,
      config,
      createdAt: new Date().toISOString(),
      renderers: {
        web: this.generateWebRenderer.bind(this),
        static: this.generateStaticRenderer.bind(this),
        interactive: this.generateInteractiveRenderer.bind(this),
      },
    };

    this.visualizations.set(visualization.id, visualization);
    return visualization;
  }

  // Generate web-based renderer
  generateWebRenderer(visualization) {
    const { diagram } = visualization;
    const { network } = diagram;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Kumu Network Visualization</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    .node {
      stroke: #fff;
      stroke-width: 1.5px;
    }
    .link {
      stroke: #999;
      stroke-opacity: 0.6;
    }
    .node-label {
      font-family: Arial, sans-serif;
      font-size: 12px;
      text-anchor: middle;
      dominant-baseline: middle;
    }
  </style>
</head>
<body>
  <svg width="800" height="600"></svg>
  <script>
    const data = ${JSON.stringify(network)};

    const svg = d3.select('svg');
    const width = +svg.attr('width');
    const height = +svg.attr('height');

    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.edges).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Create links
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.edges)
      .enter().append('line')
      .attr('class', 'link')
      .attr('stroke-width', d => d.width || 2);

    // Create nodes
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(data.nodes)
      .enter().append('circle')
      .attr('class', 'node')
      .attr('r', d => d.size || 20)
      .attr('fill', d => d.color || '#69b3a2')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add labels
    const labels = svg.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(data.nodes)
      .enter().append('text')
      .attr('class', 'node-label')
      .text(d => d.label);

    // Update positions
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  </script>
</body>
</html>`;

    return html;
  }

  // Generate static image renderer
  generateStaticRenderer(visualization) {
    // In a real implementation, this would generate SVG/PNG
    return {
      format: 'svg',
      content: '<svg><!-- Network visualization would be rendered here --></svg>',
    };
  }

  // Generate interactive renderer
  generateInteractiveRenderer(visualization) {
    // Return configuration for interactive visualization
    return {
      library: 'd3',
      data: visualization.diagram.network,
      config: {
        width: 800,
        height: 600,
        interactive: true,
        showLabels: true,
        showMetrics: true,
      },
    };
  }

  // Simulate data loading (for demonstration)
  simulateCSVData() {
    return {
      nodes: [
        { id: '1', label: 'Alice', type: 'person', properties: { department: 'Engineering' } },
        { id: '2', label: 'Bob', type: 'person', properties: { department: 'Engineering' } },
        { id: '3', label: 'Charlie', type: 'person', properties: { department: 'Marketing' } },
        { id: '4', label: 'Diana', type: 'person', properties: { department: 'Sales' } },
        { id: '5', label: 'Eve', type: 'person', properties: { department: 'HR' } },
      ],
      edges: [
        { source: '1', target: '2', type: 'colleague', weight: 1 },
        { source: '2', target: '3', type: 'collaborates', weight: 0.8 },
        { source: '3', target: '4', type: 'collaborates', weight: 0.6 },
        { source: '4', target: '5', type: 'reports-to', weight: 1 },
        { source: '1', target: '5', type: 'reports-to', weight: 1 },
      ],
    };
  }

  simulateJSONData() {
    return this.simulateCSVData(); // Same structure
  }

  simulateDatabaseData() {
    return this.simulateCSVData(); // Same structure
  }

  simulateAPIData() {
    return this.simulateCSVData(); // Same structure
  }

  simulateGraphData() {
    return this.simulateCSVData(); // Same structure
  }

  // Get visualizer status
  getVisualizerStatus() {
    return {
      isActive: this.isActive,
      availableTemplates: Array.from(this.templates.keys()),
      availableDataSources: Array.from(this.dataSources.keys()),
      availableLayouts: Object.keys(this.layoutAlgorithms),
      diagramsGenerated: this.diagrams.size,
      visualizationsCreated: this.visualizations.size,
    };
  }

  // Stop the visualizer
  stop() {
    this.isActive = false;
    console.log('⏹️ Kumu Visualizer stopped');
  }
}

// Export singleton instance
export const kumuVisualizer = new KumuVisualizer();

// Auto-initialize if running in Node.js environment
if (typeof window === 'undefined') {
  kumuVisualizer.initialize().catch(console.error);
}
