// ============================================================================
// KUMU VISUALIZER - Layouts Module
// ============================================================================

/**
 * Load layout algorithms
 * @param {Object} layoutAlgorithms - Layout algorithms object to populate
 */
export function loadLayoutAlgorithms(layoutAlgorithms) {
  layoutAlgorithms['force-directed'] = {
    name: 'Force-Directed Layout',
    algorithm: forceDirectedLayout,
    parameters: {
      attraction: 0.1,
      repulsion: 1000,
      damping: 0.9,
      maxIterations: 1000,
    },
  };
  layoutAlgorithms.hierarchical = {
    name: 'Hierarchical Layout',
    algorithm: hierarchicalLayout,
    parameters: {
      levelDistance: 100,
      nodeDistance: 50,
      direction: 'top-bottom',
    },
  };
  layoutAlgorithms.circular = {
    name: 'Circular Layout',
    algorithm: circularLayout,
    parameters: {
      radius: 200,
      centerX: 400,
      centerY: 300,
    },
  };
  layoutAlgorithms.tree = {
    name: 'Tree Layout',
    algorithm: treeLayout,
    parameters: {
      orientation: 'top-bottom',
      nodeSize: 50,
      levelDistance: 100,
    },
  };
  layoutAlgorithms.community = {
    name: 'Community-Based Layout',
    algorithm: communityLayout,
    parameters: {
      communitySpacing: 200,
      intraCommunityForce: 0.5,
    },
  };
}

/**
 * Force-directed layout algorithm
 * @param {Object} network - Network data
 * @param {Object} params - Layout parameters
 * @returns {Promise<Object>} Laid out network
 */
export async function forceDirectedLayout(network, params) {
  const { attraction, repulsion, damping, maxIterations } = params;

  console.log('🔄 Applying force-directed layout...');

  // Simplified force-directed algorithm
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Calculate repulsive forces between all pairs of nodes
    for (let i = 0; i < network.nodes.length; i++) {
      for (let j = i + 1; j < network.nodes.length; j++) {
        const node1 = network.nodes[i];
        const node2 = network.nodes[j];

        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = repulsion / (distance * distance);
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        node1.vx = (node1.vx || 0) - fx;
        node1.vy = (node1.vy || 0) - fy;
        node2.vx = (node2.vx || 0) + fx;
        node2.vy = (node2.vy || 0) + fy;
      }
    }

    // Calculate attractive forces for connected nodes
    for (const edge of network.edges) {
      const sourceNode = network.nodes.find((n) => n.id === edge.source);
      const targetNode = network.nodes.find((n) => n.id === edge.target);

      if (sourceNode && targetNode) {
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = attraction * distance;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        sourceNode.vx = (sourceNode.vx || 0) + fx;
        sourceNode.vy = (sourceNode.vy || 0) + fy;
        targetNode.vx = (targetNode.vx || 0) - fx;
        targetNode.vy = (targetNode.vy || 0) - fy;
      }
    }

    // Update positions
    for (const node of network.nodes) {
      node.vx = (node.vx || 0) * damping;
      node.vy = (node.vy || 0) * damping;

      node.x += node.vx;
      node.y += node.vy;

      // Keep nodes within bounds
      node.x = Math.max(50, Math.min(750, node.x));
      node.y = Math.max(50, Math.min(550, node.y));
    }
  }

  return network;
}

/**
 * Hierarchical layout algorithm
 * @param {Object} network - Network data
 * @param {Object} params - Layout parameters
 * @returns {Promise<Object>} Laid out network
 */
export async function hierarchicalLayout(network, params) {
  console.log('🔄 Applying hierarchical layout...');

  // Simplified hierarchical layout
  const levels = calculateLevels(network);
  const { levelDistance, nodeDistance } = params;

  for (const [level, nodes] of levels.entries()) {
    const levelY = level * levelDistance + 100;
    const levelWidth = (nodes.length - 1) * nodeDistance;
    const startX = (800 - levelWidth) / 2;

    nodes.forEach((node, index) => {
      node.x = startX + index * nodeDistance;
      node.y = levelY;
    });
  }

  return network;
}

/**
 * Calculate node levels for hierarchical layout
 * @param {Object} network - Network data
 * @returns {Map} Node levels
 */
function calculateLevels(network) {
  const levels = new Map();
  const visited = new Set();
  const queue = [];

  // Find root nodes (nodes with no incoming edges)
  const hasIncoming = new Set(network.edges.map((e) => e.target));
  const rootNodes = network.nodes.filter((n) => !hasIncoming.has(n.id));

  rootNodes.forEach((node) => {
    queue.push({ node, level: 0 });
    visited.add(node.id);
  });

  while (queue.length > 0) {
    const { node, level } = queue.shift();

    if (!levels.has(level)) {
      levels.set(level, []);
    }
    levels.get(level).push(node);

    // Find children
    const children = network.edges
      .filter((e) => e.source === node.id)
      .map((e) => network.nodes.find((n) => n.id === e.target))
      .filter((n) => n && !visited.has(n.id));

    children.forEach((child) => {
      visited.add(child.id);
      queue.push({ node: child, level: level + 1 });
    });
  }

  return levels;
}

/**
 * Circular layout algorithm
 * @param {Object} network - Network data
 * @param {Object} params - Layout parameters
 * @returns {Promise<Object>} Laid out network
 */
export async function circularLayout(network, params) {
  const { radius, centerX, centerY } = params;
  const angleStep = (2 * Math.PI) / network.nodes.length;

  network.nodes.forEach((node, index) => {
    const angle = index * angleStep;
    node.x = centerX + radius * Math.cos(angle);
    node.y = centerY + radius * Math.sin(angle);
  });

  return network;
}

/**
 * Tree layout algorithm
 * @param {Object} network - Network data
 * @param {Object} params - Layout parameters
 * @returns {Promise<Object>} Laid out network
 */
export async function treeLayout(network, params) {
  console.log('🔄 Applying tree layout...');
  // Simplified tree layout - similar to hierarchical but more compact
  return hierarchicalLayout(network, params);
}

/**
 * Community-based layout algorithm
 * @param {Object} network - Network data
 * @param {Object} params - Layout parameters
 * @returns {Promise<Object>} Laid out network
 */
export async function communityLayout(network, params) {
  console.log('🔄 Applying community-based layout...');

  // Simplified community detection and layout
  const communities = detectCommunities(network);
  const { communitySpacing } = params;

  let currentX = 100;
  for (const [communityId, nodes] of communities.entries()) {
    const centerX = currentX + 200;
    const centerY = 300;

    // Arrange nodes in a circle within their community
    const angleStep = (2 * Math.PI) / nodes.length;
    const radius = Math.min(150, nodes.length * 20);

    nodes.forEach((node, index) => {
      const angle = index * angleStep;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    });

    currentX += 400;
  }

  return network;
}

/**
 * Simple community detection
 * @param {Object} network - Network data
 * @returns {Map} Communities
 */
function detectCommunities(network) {
  const communities = new Map();
  let communityId = 0;

  const assigned = new Set();

  for (const node of network.nodes) {
    if (!assigned.has(node.id)) {
      const community = findCommunity(node, network, assigned);
      communities.set(communityId++, community);
    }
  }

  return communities;
}

/**
 * Find connected component as community
 * @param {Object} startNode - Starting node
 * @param {Object} network - Network data
 * @param {Set} assigned - Assigned nodes
 * @returns {Array} Community nodes
 */
function findCommunity(startNode, network, assigned) {
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
