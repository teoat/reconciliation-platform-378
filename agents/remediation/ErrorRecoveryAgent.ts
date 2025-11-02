/**
 * Error Recovery Agent - Autonomous Error Recovery System
 * 
 * Extracts and enhances ErrorRecoveryService.execute_with_retry() functionality
 * into a meta-agent with learning and adaptation capabilities.
 * 
 * Source: backend/src/services/error_recovery.rs:113-156
 * Priority: MEDIUM-HIGH
 */

import { MetaAgent, AgentType, AutonomyLevel, ExecutionContext, AgentResult, AgentMetrics, AgentStatus, HILContext, HILResponse } from '../core/types';

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  maxBackoff: number;
}

interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempt: number;
  duration: number;
}

export class ErrorRecoveryAgent implements MetaAgent {
  readonly name = 'ErrorRecoveryAgent';
  readonly type: AgentType = 'remediation';
  readonly autonomyLevel: AutonomyLevel = 'full';

  private retryConfig: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
    maxBackoff: 30000,
  };
  
  private status: AgentStatus = 'idle';
  private agentMetrics: AgentMetrics = {
    totalExecutions: 0,
    successRate: 0,
    averageExecutionTime: 0,
    lastExecutionTime: new Date(),
    errors: 0,
    warnings: 0,
    hilRequests: 0,
    autoDecisions: 0,
  };

  private executionHistory: Array<{ timestamp: Date; duration: number; success: boolean }> = [];
  private readonly maxHistorySize = 1000;
  private errorHistory: Array<{ operationId: string; error: Error; timestamp: Date }> = [];

  constructor(retryConfig?: Partial<RetryConfig>) {
    if (retryConfig) {
      this.retryConfig = { ...this.retryConfig, ...retryConfig };
    }
  }

  async initialize(): Promise<void> {
    this.status = 'idle';
  }

  async start(): Promise<void> {
    this.status = 'running';
  }

  async stop(): Promise<void> {
    this.status = 'stopped';
  }

  async pause(): Promise<void> {
    this.status = 'paused';
  }

  async resume(): Promise<void> {
    if (this.status === 'paused') {
      this.status = 'running';
    }
  }

  async cleanup(): Promise<void> {
    await this.stop();
    this.errorHistory = [];
  }

  async execute(context?: ExecutionContext): Promise<AgentResult> {
    const operationId = context?.operationId as string || 'unknown';
    const operation = context?.operation as () => Promise<unknown>;
    
    if (!operation) {
      return {
        success: false,
        executionTime: 0,
        error: new Error('Operation not provided in context'),
        metrics: this.agentMetrics,
      };
    }

    return this.executeWithRetry(operationId, operation);
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operationId: string,
    operation: () => Promise<T>
  ): Promise<AgentResult> {
    const startTime = Date.now();
    this.status = 'running';

    try {
      let attempt = 0;
      let lastError: Error | null = null;
      let delay = this.retryConfig.retryDelay;

      while (attempt < this.retryConfig.maxRetries) {
        attempt++;

        try {
          const operationStart = Date.now();
          const result = await operation();
          const operationDuration = Date.now() - operationStart;

          // Success
          const totalDuration = Date.now() - startTime;
          this.recordExecution(totalDuration, true);

          if (attempt > 1) {
            this.agentMetrics.warnings++; // Retry was needed
          }

          return {
            success: true,
            executionTime: totalDuration,
            data: {
              result,
              attempts: attempt,
              operationDuration,
            },
            metrics: this.agentMetrics,
          };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          // Record error
          this.errorHistory.push({
            operationId,
            error: lastError,
            timestamp: new Date(),
          });

          // Check if we should retry
          if (attempt >= this.retryConfig.maxRetries) {
            break;
          }

          // Check if error is retryable
          if (!this.isRetryableError(lastError)) {
            break;
          }

          // Wait before retry
          if (this.retryConfig.exponentialBackoff) {
            delay = Math.min(delay * 2, this.retryConfig.maxBackoff);
          }
          
          await this.sleep(delay);
        }
      }

      // All retries failed
      const totalDuration = Date.now() - startTime;
      this.recordExecution(totalDuration, false);
      this.agentMetrics.errors++;

      return {
        success: false,
        executionTime: totalDuration,
        error: lastError || new Error('Operation failed after retries'),
        metrics: this.agentMetrics,
        requiresHIL: attempt >= this.retryConfig.maxRetries,
      };
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      this.recordExecution(totalDuration, false);
      this.status = 'error';

      return {
        success: false,
        executionTime: totalDuration,
        error: error instanceof Error ? error : new Error(String(error)),
        metrics: this.agentMetrics,
      };
    } finally {
      this.status = 'idle';
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNRESET',
      'timeout',
      'network',
      'temporary',
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some((retryable) => errorMessage.includes(retryable));
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private recordExecution(duration: number, success: boolean): void {
    this.agentMetrics.totalExecutions++;
    this.executionHistory.push({
      timestamp: new Date(),
      duration,
      success,
    });

    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }

    const recentExecutions = this.executionHistory.slice(-100);
    const successCount = recentExecutions.filter((e) => e.success).length;
    this.agentMetrics.successRate = successCount / recentExecutions.length;

    const totalTime = recentExecutions.reduce((sum, e) => sum + e.duration, 0);
    this.agentMetrics.averageExecutionTime = totalTime / recentExecutions.length;

    this.agentMetrics.lastExecutionTime = new Date();
  }

  getStatus(): AgentStatus {
    return {
      name: this.name,
      status: this.status,
      lastExecution: this.agentMetrics.lastExecutionTime,
      metrics: this.agentMetrics,
      health: this.status === 'error' ? 'unhealthy' : this.status === 'running' ? 'healthy' : 'degraded',
    };
  }

  canHandle(context: ExecutionContext): boolean {
    return context.operation !== undefined;
  }

  getMetrics(): AgentMetrics {
    return { ...this.agentMetrics };
  }

  requiresHIL(context: ExecutionContext): boolean {
    // Error recovery agent typically doesn't require HIL
    // Only for critical failures after all retries
    return false;
  }

  async requestHIL(context: ExecutionContext, hilContext: HILContext): Promise<HILResponse> {
    throw new Error('ErrorRecoveryAgent does not use HIL');
  }

  learnFromResult(result: AgentResult): void {
    // TODO: Learn which errors are retryable
    // TODO: Adjust retry strategies based on error types
  }

  async adaptStrategy(): Promise<void> {
    // TODO: Adjust retry config based on success rates
    // TODO: Learn optimal retry delays for different error types
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }
}

