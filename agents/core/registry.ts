/**
 * Agent Registry - Registration and Discovery System
 *
 * Manages agent registration, discovery, and lifecycle tracking.
 */

import { MetaAgent, AgentConfig, AgentRegistryEntry, AgentStatus, AgentStatusInfo } from './types';

export class AgentRegistry {
  private agents: Map<string, AgentRegistryEntry> = new Map();
  private eventListeners: Map<string, Set<(event: unknown) => void>> = new Map();

  /**
   * Register an agent
   */
  async register(agent: MetaAgent, config: AgentConfig): Promise<void> {
    if (this.agents.has(agent.name)) {
      throw new Error(`Agent ${agent.name} is already registered`);
    }

    // Initialize agent
    await agent.initialize();

    // Create registry entry
    const entry: AgentRegistryEntry = {
      agent,
      config,
      registeredAt: new Date(),
      lastHealthCheck: new Date(),
    };

    this.agents.set(agent.name, entry);

    // Emit registration event
    this.emit('agent.registered', {
      name: agent.name,
      type: agent.type,
      autonomyLevel: agent.autonomyLevel,
      timestamp: new Date(),
    });
  }

  /**
   * Unregister an agent
   */
  async unregister(agentName: string): Promise<void> {
    const entry = this.agents.get(agentName);
    if (!entry) {
      throw new Error(`Agent ${agentName} is not registered`);
    }

    // Cleanup agent
    await entry.agent.cleanup();

    // Remove from registry
    this.agents.delete(agentName);

    // Emit unregistration event
    this.emit('agent.unregistered', {
      name: agentName,
      timestamp: new Date(),
    });
  }

  /**
   * Get agent by name
   */
  getAgent(agentName: string): MetaAgent | undefined {
    return this.agents.get(agentName)?.agent;
  }

  /**
   * Get all agents
   */
  getAllAgents(): MetaAgent[] {
    return Array.from(this.agents.values()).map((entry) => entry.agent);
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type: string): MetaAgent[] {
    return Array.from(this.agents.values())
      .filter((entry) => entry.agent.type === type)
      .map((entry) => entry.agent);
  }

  /**
   * Get registry entries
   */
  getEntries(): AgentRegistryEntry[] {
    return Array.from(this.agents.values());
  }

  /**
   * Start all agents
   */
  async startAll(): Promise<void> {
    for (const entry of this.agents.values()) {
      if (entry.config.enabled) {
        try {
          await entry.agent.start();
        } catch (error) {
          console.error(`Failed to start agent ${entry.agent.name}:`, error);
        }
      }
    }
  }

  /**
   * Stop all agents
   */
  async stopAll(): Promise<void> {
    for (const entry of this.agents.values()) {
      try {
        await entry.agent.stop();
      } catch (error) {
        console.error(`Failed to stop agent ${entry.agent.name}:`, error);
      }
    }
  }

  /**
   * Perform health check on all agents
   */
  async healthCheck(): Promise<Map<string, AgentStatusInfo>> {
    const healthStatuses = new Map<string, AgentStatusInfo>();

    for (const [name, entry] of this.agents) {
      try {
        const status = entry.agent.getStatus();
        healthStatuses.set(name, status);
        entry.lastHealthCheck = new Date();
      } catch (error) {
        healthStatuses.set(name, {
          name,
          status: 'error',
          metrics: {
            totalExecutions: 0,
            successRate: 0,
            averageExecutionTime: 0,
            lastExecutionTime: new Date(),
            errors: 1,
            warnings: 0,
            hilRequests: 0,
            autoDecisions: 0,
          },
          health: 'unhealthy',
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }

    return healthStatuses;
  }

  /**
   * Emit event
   */
  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      }
    }
  }

  /**
   * Add event listener
   */
  on(event: string, listener: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }
}

// Singleton instance
export const agentRegistry = new AgentRegistry();
