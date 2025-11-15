/**
 * Meta-Agent Framework - Core Types and Interfaces
 *
 * This module defines the core interfaces and types for the meta-agent framework.
 * All agents must implement the MetaAgent interface to participate in the framework.
 */

export type AgentType =
  | 'monitoring'
  | 'decision'
  | 'remediation'
  | 'processing'
  | 'optimization'
  | 'security'
  | 'guidance';

export type AutonomyLevel = 'full' | 'partial' | 'hil-required';

export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'stopped';

export type ExecutionContext = {
  timestamp: Date;
  trigger?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

export interface AgentResult {
  success: boolean;
  executionTime: number;
  data?: unknown;
  error?: Error;
  metrics?: AgentMetrics;
  requiresHIL?: boolean;
  hilContext?: HILContext;
}

export interface AgentMetrics {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecutionTime: Date;
  errors: number;
  warnings: number;
  hilRequests: number;
  autoDecisions: number;
}

export interface AgentStatusInfo {
  name: string;
  status: AgentStatus;
  lastExecution?: Date;
  nextExecution?: Date;
  metrics: AgentMetrics;
  health: 'healthy' | 'degraded' | 'unhealthy';
  error?: Error;
}

export interface HILContext {
  agent: string;
  decision: string;
  confidence: number;
  context: ExecutionContext;
  options: HILOption[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
}

export interface HILOption {
  id: string;
  label: string;
  description: string;
  action: () => Promise<unknown>;
  risk: 'low' | 'medium' | 'high';
}

export interface HILResponse {
  decision: string;
  optionId?: string;
  reason?: string;
  approver?: string;
  timestamp: Date;
  confidence?: number;
}

/**
 * Core MetaAgent interface that all agents must implement
 */
export interface MetaAgent {
  /**
   * Unique identifier for the agent
   */
  readonly name: string;

  /**
   * Type of agent (monitoring, decision, remediation, etc.)
   */
  readonly type: AgentType;

  /**
   * Level of autonomy the agent operates at
   */
  readonly autonomyLevel: AutonomyLevel;

  /**
   * Current status of the agent
   */
  getStatus(): AgentStatusInfo;

  /**
   * Execute the agent's primary function
   * @param context Execution context with metadata
   * @returns Promise resolving to agent result
   */
  execute(context?: ExecutionContext): Promise<AgentResult>;

  /**
   * Check if the agent can handle the given context
   * @param context Execution context
   * @returns true if agent can handle, false otherwise
   */
  canHandle(context: ExecutionContext): boolean;

  /**
   * Get agent metrics and performance data
   * @returns Current agent metrics
   */
  getMetrics(): AgentMetrics;

  /**
   * Check if agent requires human-in-the-loop for given context
   * @param context Execution context
   * @returns true if HIL required, false otherwise
   */
  requiresHIL(context: ExecutionContext): boolean;

  /**
   * Request human-in-the-loop decision
   * @param context Execution context
   * @param hilContext HIL context with options
   * @returns Promise resolving to HIL response
   */
  requestHIL(context: ExecutionContext, hilContext: HILContext): Promise<HILResponse>;

  /**
   * Learn from execution result to improve future decisions
   * @param result Previous execution result
   */
  learnFromResult(result: AgentResult): void;

  /**
   * Adapt agent strategy based on historical performance
   */
  adaptStrategy(): Promise<void>;

  /**
   * Initialize the agent
   */
  initialize(): Promise<void>;

  /**
   * Start the agent (begin autonomous operation)
   */
  start(): Promise<void>;

  /**
   * Stop the agent (pause autonomous operation)
   */
  stop(): Promise<void>;

  /**
   * Pause the agent (temporarily halt execution)
   */
  pause(): Promise<void>;

  /**
   * Resume the agent (resume from pause)
   */
  resume(): Promise<void>;

  /**
   * Cleanup resources and shutdown gracefully
   */
  cleanup(): Promise<void>;
}

/**
 * Agent configuration interface
 */
export interface AgentConfig {
  name: string;
  type: AgentType;
  autonomyLevel: AutonomyLevel;
  enabled: boolean;
  executionInterval?: number; // milliseconds
  maxConcurrentExecutions?: number;
  timeout?: number; // milliseconds
  retryConfig?: RetryConfig;
  hilConfig?: HILConfig;
  [key: string]: unknown;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  maxBackoff: number;
}

export interface HILConfig {
  enabled: boolean;
  confidenceThreshold: number;
  timeout: number;
  fallbackAction?: 'wait' | 'reject' | 'approve';
}

/**
 * Agent registry entry
 */
export interface AgentRegistryEntry {
  agent: MetaAgent;
  config: AgentConfig;
  registeredAt: Date;
  lastHealthCheck: Date;
}

/**
 * Agent event types
 */
export type AgentEventType =
  | 'agent.started'
  | 'agent.stopped'
  | 'agent.error'
  | 'agent.execution.start'
  | 'agent.execution.complete'
  | 'agent.execution.failed'
  | 'agent.hil.requested'
  | 'agent.hil.completed'
  | 'agent.strategy.adapted';

export interface AgentEvent {
  type: AgentEventType;
  agent: string;
  timestamp: Date;
  data?: unknown;
  error?: Error;
}
