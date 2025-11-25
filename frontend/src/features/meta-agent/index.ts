/**
 * Meta Agent Features
 * 
 * Features for meta agent framework integration
 */

import { registerFeature, type FeatureMetadata } from '../registry';

// Meta Agent Framework Feature
registerFeature({
  id: 'meta-agent:framework',
  name: 'Meta Agent Framework',
  description: 'Core framework for autonomous agent orchestration and management',
  category: 'orchestration',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'register-agent',
      name: 'Register Agent',
      description: 'Register a new agent with the framework',
      parameters: [
        { name: 'agent', type: 'MetaAgent', required: true },
      ],
    },
    {
      id: 'execute-agent',
      name: 'Execute Agent',
      description: 'Execute an agent with given context',
      parameters: [
        { name: 'agentId', type: 'string', required: true },
        { name: 'context', type: 'ExecutionContext', required: false },
      ],
      outputType: 'AgentResult',
    },
  ],
  metaAgentIntegration: {
    monitorable: true,
    executable: true,
    compatibleAgents: ['monitoring', 'decision', 'remediation', 'processing', 'optimization', 'guidance'],
    metrics: [
      { name: 'agents_registered', type: 'gauge', description: 'Number of registered agents' },
      { name: 'agent_executions', type: 'counter', description: 'Total agent executions' },
      { name: 'agent_success_rate', type: 'gauge', description: 'Agent execution success rate' },
    ],
    events: [
      { name: 'agent.registered', description: 'New agent registered' },
      { name: 'agent.executed', description: 'Agent execution completed' },
      { name: 'agent.failed', description: 'Agent execution failed' },
    ],
  },
});

// Monitoring Agent Feature
registerFeature({
  id: 'meta-agent:monitoring',
  name: 'Monitoring Agent',
  description: 'Autonomous monitoring agent for system health and performance',
  category: 'orchestration',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'start-monitoring',
      name: 'Start Monitoring',
      description: 'Start autonomous monitoring',
    },
    {
      id: 'check-health',
      name: 'Check Health',
      description: 'Perform health check',
      outputType: 'HealthCheckResult',
    },
  ],
  metaAgentIntegration: {
    monitorable: true,
    executable: true,
    compatibleAgents: ['monitoring'],
    metrics: [
      { name: 'health_checks_performed', type: 'counter', description: 'Total health checks performed' },
      { name: 'issues_detected', type: 'counter', description: 'Total issues detected' },
    ],
    events: [
      { name: 'monitoring.health-check.completed', description: 'Health check completed' },
      { name: 'monitoring.issue.detected', description: 'Issue detected by monitoring agent' },
    ],
  },
});

// Re-export agent framework (if available)
// Note: Agents are typically in the root agents/ directory, not frontend/src
// This is a placeholder for frontend-side agent integration

