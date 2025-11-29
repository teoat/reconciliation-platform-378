/**
 * Error Recovery Agent - Autonomous Error Recovery System
 *
 * Extracts and enhances ErrorRecoveryService.execute_with_retry() functionality
 * into a meta-agent with learning and adaptation capabilities.
 *
 * Source: backend/src/services/error_recovery.rs:113-156
 * Priority: MEDIUM-HIGH
 */

import {
  MetaAgent,
  AgentType,
  AutonomyLevel,
  ExecutionContext,
  AgentResult,
  AgentMetrics,
  AgentStatus,
  AgentStatusInfo,
  HILContext,
  HILResponse,
} from '../core/types';

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
  private errorHistory: Array<{ operationId: string; error: Error; timestamp: Date; retryable: boolean; success: boolean }> = [];
  private errorTypeLearning: Map<string, { retryable: boolean; successRate: number; optimalDelay: number; attempts: number }> = new Map();
  private retrySuccessRates: Map<number, number> = new Map(); // attempt number -> success rate

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
    const operationId = (context?.operationId as string) || 'unknown';
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
            // Update error history to mark as successful
            if (this.errorHistory.length > 0) {
              const lastErrorEntry = this.errorHistory[this.errorHistory.length - 1];
              lastErrorEntry.success = true;
            }
          }

          const agentResult = {
            success: true,
            executionTime: totalDuration,
            data: {
              result,
              attempts: attempt,
              operationDuration,
            },
            metrics: this.agentMetrics,
          };

          // Learn from successful result
          this.learnFromResult(agentResult);

          return agentResult;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Record error with learning data
          const isRetryable = this.isRetryableError(lastError);
          this.errorHistory.push({
            operationId,
            error: lastError,
            timestamp: new Date(),
            retryable: isRetryable,
            success: false, // Will be updated if retry succeeds
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
          // Use learned optimal delay if available
          const optimalDelay = this.getOptimalDelay(lastError);
          if (this.retryConfig.exponentialBackoff) {
            delay = Math.min(optimalDelay * Math.pow(2, attempt - 1), this.retryConfig.maxBackoff);
          } else {
            delay = optimalDelay;
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
    // Check learned retryability first
    const errorType = this.getErrorType(error);
    const learning = this.errorTypeLearning.get(errorType);
    if (learning && learning.attempts >= 3) {
      return learning.retryable;
    }
    
    // Fallback to static rules
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

  getStatus(): AgentStatusInfo {
    return {
      name: this.name,
      status: this.status,
      lastExecution: this.agentMetrics.lastExecutionTime,
      metrics: this.agentMetrics,
      health:
        this.status === 'error' ? 'unhealthy' : this.status === 'running' ? 'healthy' : 'degraded',
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
    // Learn from execution results
    if (result.error && this.errorHistory.length > 0) {
      const lastError = this.errorHistory[this.errorHistory.length - 1];
      const errorType = this.getErrorType(lastError.error);
      
      // Update learning data for this error type
      const learning = this.errorTypeLearning.get(errorType) || {
        retryable: this.isRetryableError(lastError.error),
        successRate: 0,
        optimalDelay: this.retryConfig.retryDelay,
        attempts: 0,
      };
      
      learning.attempts++;
      if (result.success) {
        learning.successRate = (learning.successRate * (learning.attempts - 1) + 1) / learning.attempts;
        learning.retryable = true; // If it succeeded, it was retryable
      } else {
        learning.successRate = (learning.successRate * (learning.attempts - 1) + 0) / learning.attempts;
      }
      
      this.errorTypeLearning.set(errorType, learning);
    }
    
    // Learn retry attempt success rates
    if (result.executionTime && this.executionHistory.length > 0) {
      const recentExecutions = this.executionHistory.slice(-50);
      const attemptsBySuccess = new Map<number, { successes: number; total: number }>();
      
      // This would need to track attempt numbers, simplified for now
      // In a full implementation, we'd track which attempt succeeded
    }
  }

  async adaptStrategy(): Promise<void> {
    // Adjust retry config based on success rates
    const recentExecutions = this.executionHistory.slice(-100);
    if (recentExecutions.length < 10) return; // Need enough data
    
    const successRate = recentExecutions.filter(e => e.success).length / recentExecutions.length;
    
    // If success rate is low, increase retries
    if (successRate < 0.5 && this.retryConfig.maxRetries < 5) {
      this.retryConfig.maxRetries++;
    }
    
    // If success rate is high, we might reduce retries (but be conservative)
    if (successRate > 0.9 && this.retryConfig.maxRetries > 2) {
      // Keep at least 2 retries
    }
    
    // Learn optimal retry delays for different error types
    for (const [errorType, learning] of this.errorTypeLearning.entries()) {
      if (learning.attempts >= 5) {
        // If this error type has high success rate with current delay, keep it
        // If low success rate, try increasing delay
        if (learning.successRate < 0.3 && learning.optimalDelay < this.retryConfig.maxBackoff) {
          learning.optimalDelay = Math.min(learning.optimalDelay * 1.5, this.retryConfig.maxBackoff);
        }
      }
    }
  }

  /**
   * Get error type classification
   */
  private getErrorType(error: Error): string {
    const message = error.message.toLowerCase();
    if (message.includes('timeout') || message.includes('timed out')) return 'timeout';
    if (message.includes('network') || message.includes('connection')) return 'network';
    if (message.includes('permission') || message.includes('unauthorized')) return 'authorization';
    if (message.includes('not found') || message.includes('404')) return 'not_found';
    if (message.includes('server error') || message.includes('500')) return 'server_error';
    return 'unknown';
  }

  /**
   * Get optimal delay for error type
   */
  private getOptimalDelay(error: Error): number {
    const errorType = this.getErrorType(error);
    const learning = this.errorTypeLearning.get(errorType);
    return learning?.optimalDelay || this.retryConfig.retryDelay;
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }
}
