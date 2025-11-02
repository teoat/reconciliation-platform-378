/**
 * Meta-Agent Framework - Main Entry Point
 * 
 * Exports all agent framework components and utilities.
 */

// Core framework
export * from './core/types';
export { AgentRegistry, agentRegistry } from './core/registry';
export { AgentBus, agentBus } from './core/bus';

// Monitoring agents
export { MonitoringAgent } from './monitoring/MonitoringAgent';
export { HealthCheckAgent } from './monitoring/HealthCheckAgent';

// Decision agents
export { ApprovalAgent } from './decision/ApprovalAgent';

// Security agents
export { SecurityMonitoringAgent } from './security/SecurityMonitoringAgent';

// Remediation agents
export { ErrorRecoveryAgent } from './remediation/ErrorRecoveryAgent';

// Agent framework initialization
export async function initializeAgentFramework(): Promise<void> {
  console.log('🚀 Initializing Meta-Agent Framework...');
  
  // Initialize event bus
  // Already initialized as singleton
  
  // Initialize registry
  // Already initialized as singleton
  
  console.log('✅ Meta-Agent Framework initialized');
}

// Agent framework shutdown
export async function shutdownAgentFramework(): Promise<void> {
  console.log('🛑 Shutting down Meta-Agent Framework...');
  
  const { agentRegistry } = await import('./core/registry');
  await agentRegistry.stopAll();
  
  console.log('✅ Meta-Agent Framework shut down');
}
