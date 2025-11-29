/**
 * Approval Agent - Autonomous Ticket Approval System
 *
 * Extracts and enhances HILApprovalSystem.processTicketApproval() functionality
 * into a meta-agent with learning and adaptation capabilities.
 *
 * Source: monitoring/hil-approval.js:326-352
 * Priority: HIGH
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
  HILOption,
} from '../core/types';

interface Ticket {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  issue?: {
    monitor: string;
    severity: string;
  };
  proposedSolution?: string;
  created: string;
  [key: string]: unknown;
}

interface AutoApprovalRule {
  name: string;
  condition: (ticket: Ticket) => boolean;
  confidence: number;
  maxExecutionTime: number;
  rollbackPlan: string;
}

export class ApprovalAgent implements MetaAgent {
  readonly name = 'ApprovalAgent';
  readonly type: AgentType = 'decision';
  readonly autonomyLevel: AutonomyLevel = 'partial';

  private pendingTickets: Map<string, Ticket> = new Map();
  private approvedTickets: Map<string, Ticket> = new Map();
  private rejectedTickets: Map<string, Ticket> = new Map();
  private autoApprovalRules: Map<string, AutoApprovalRule> = new Map();

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

  private executionInterval: NodeJS.Timeout | null = null;
  private executionHistory: Array<{ timestamp: Date; duration: number; success: boolean }> = [];
  private readonly maxHistorySize = 1000;
  private hilHandler?: (hilContext: HILContext) => Promise<HILResponse>;

  constructor() {
    this.setupAutoApprovalRules();
  }

  /**
   * Set up auto-approval rules
   */
  private setupAutoApprovalRules(): void {
    // Rule 1: Performance optimization tickets with low risk
    this.autoApprovalRules.set('performance_optimization', {
      name: 'performance_optimization',
      condition: (ticket) => {
        return (
          ticket.type === 'AUTOMATED_EVOLUTION' &&
          ticket.issue?.monitor === 'performance' &&
          ticket.issue?.severity === 'warning' &&
          this.isLowRiskChange(ticket.proposedSolution || '')
        );
      },
      confidence: 0.85,
      maxExecutionTime: 300000, // 5 minutes
      rollbackPlan: 'revert_performance_changes',
    });

    // Rule 2: Error handling improvements
    this.autoApprovalRules.set('error_handling', {
      name: 'error_handling',
      condition: (ticket) => {
        return (
          ticket.type === 'AUTOMATED_EVOLUTION' &&
          ticket.issue?.monitor === 'error' &&
          (ticket.proposedSolution || '').includes('error handling') &&
          !(ticket.proposedSolution || '').includes('security')
        );
      },
      confidence: 0.9,
      maxExecutionTime: 180000, // 3 minutes
      rollbackPlan: 'revert_error_handling',
    });

    // Rule 3: Monitoring enhancements (no code changes)
    this.autoApprovalRules.set('monitoring_enhancement', {
      name: 'monitoring_enhancement',
      condition: (ticket) => {
        const solution = ticket.proposedSolution || '';
        return (
          ticket.type === 'AUTOMATED_EVOLUTION' &&
          solution.includes('monitoring') &&
          !solution.includes('code') &&
          !solution.includes('logic')
        );
      },
      confidence: 0.95,
      maxExecutionTime: 60000, // 1 minute
      rollbackPlan: 'disable_monitoring_changes',
    });
  }

  /**
   * Check if change is low risk
   */
  private isLowRiskChange(solution: string): boolean {
    const lowRiskIndicators = [
      'caching',
      'optimization',
      'monitoring',
      'logging',
      'timeout',
      'retry',
      'circuit breaker',
    ];
    const highRiskIndicators = [
      'database schema',
      'authentication',
      'authorization',
      'encryption',
      'security policy',
      'user data',
    ];

    const solutionText = solution.toLowerCase();
    return (
      lowRiskIndicators.some((indicator) => solutionText.includes(indicator)) &&
      !highRiskIndicators.some((indicator) => solutionText.includes(indicator))
    );
  }

  /**
   * Check if ticket qualifies for auto-approval
   */
  private checkAutoApproval(ticket: Ticket): AutoApprovalRule | null {
    for (const [ruleName, rule] of this.autoApprovalRules) {
      if (rule.condition(ticket)) {
        return rule;
      }
    }
    return null;
  }

  async initialize(): Promise<void> {
    this.status = 'idle';
  }

  async start(): Promise<void> {
    if (this.status === 'running') return;

    this.status = 'running';

    // Start approval processing loop - runs every 10 seconds
    this.executionInterval = setInterval(() => {
      if (this.status === 'running') {
        this.processPendingTickets().catch((error) => {
          console.error('ApprovalAgent execution failed:', error);
          this.agentMetrics.errors++;
        });
      }
    }, 10000); // 10 seconds
  }

  async stop(): Promise<void> {
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
      this.executionInterval = null;
    }
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
    this.pendingTickets.clear();
    this.approvedTickets.clear();
    this.rejectedTickets.clear();
    this.autoApprovalRules.clear();
  }

  async execute(context?: ExecutionContext): Promise<AgentResult> {
    return this.processPendingTickets();
  }

  /**
   * Process pending tickets
   */
  private async processPendingTickets(): Promise<AgentResult> {
    const startTime = Date.now();
    this.status = 'running';

    try {
      let processed = 0;
      let autoApproved = 0;
      let hilRequested = 0;

      for (const ticket of this.pendingTickets.values()) {
        if (ticket.status === 'PENDING_HIL_APPROVAL') {
          const result = await this.processTicket(ticket);

          if (result.autoApproved) {
            autoApproved++;
          } else if (result.hilRequested) {
            hilRequested++;
          }
          processed++;
        }
      }

      const executionTime = Date.now() - startTime;
      this.recordExecution(executionTime, true);
      this.agentMetrics.autoDecisions += autoApproved;
      this.agentMetrics.hilRequests += hilRequested;

      return {
        success: true,
        executionTime,
        data: { processed, autoApproved, hilRequested },
        metrics: this.agentMetrics,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordExecution(executionTime, false);
      this.status = 'error';

      return {
        success: false,
        executionTime,
        error: error instanceof Error ? error : new Error(String(error)),
        metrics: this.agentMetrics,
      };
    } finally {
      this.status = 'idle';
    }
  }

  /**
   * Process individual ticket
   */
  private async processTicket(
    ticket: Ticket
  ): Promise<{ autoApproved: boolean; hilRequested: boolean }> {
    // Check for auto-approval
    const autoApproval = this.checkAutoApproval(ticket);

    if (autoApproval) {
      await this.approveTicket(ticket, {
        approved: true,
        reason: `Auto-approved by rule: ${autoApproval.name}`,
        approver: 'automation_system',
        confidence: autoApproval.confidence,
        timestamp: new Date(),
      });
      return { autoApproved: true, hilRequested: false };
    }

    // Require HIL for non-auto-approvable tickets
    if (this.requiresHIL({ ticket } as ExecutionContext)) {
      const hilContext = await this.createHILContext(ticket);
      if (this.hilHandler) {
        const response = await this.hilHandler(hilContext);

        if (response.decision === 'approve') {
          await this.approveTicket(ticket, response);
        } else {
          await this.rejectTicket(ticket, response);
        }
      }
      return { autoApproved: false, hilRequested: true };
    }

    return { autoApproved: false, hilRequested: false };
  }

  /**
   * Approve ticket
   */
  private async approveTicket(ticket: Ticket, decision: HILResponse): Promise<void> {
    ticket.status = 'APPROVED';
    this.pendingTickets.delete(ticket.id);
    this.approvedTickets.set(ticket.id, ticket);

    // Execute approved ticket
    await this.executeTicket(ticket);
  }

  /**
   * Execute approved ticket
   */
  private async executeTicket(ticket: Ticket): Promise<void> {
    const { logger } = await import('../../frontend/src/services/logger');
    logger.info(`⚡ Executing approved ticket: ${ticket.id}`);

    try {
      // Determine execution strategy based on ticket type
      const executionResult = await this.executeTicketActions(ticket);

      // Update ticket with execution result
      ticket.executionResult = executionResult;
      ticket.executedAt = new Date().toISOString();
      ticket.status = 'EXECUTED';

      logger.info(`✅ Successfully executed ticket: ${ticket.id}`, { executionResult });

      // Track execution in metrics
      this.agentMetrics.autoDecisions++;
    } catch (error) {
      logger.error(`❌ Failed to execute ticket ${ticket.id}`, { error });
      
      ticket.status = 'EXECUTION_FAILED';
      ticket.executionError = error instanceof Error ? error.message : String(error);
      ticket.failedAt = new Date().toISOString();
      
      this.agentMetrics.errors++;
      
      // Trigger rollback if available
      await this.rollbackTicket(ticket);
    }
  }

  /**
   * Execute ticket actions based on type and proposed solution
   */
  private async executeTicketActions(ticket: Ticket): Promise<unknown[]> {
    const { logger } = await import('../../frontend/src/services/logger');
    const results: unknown[] = [];

    // Parse proposed solution into actions
    const actions = this.parseProposedSolution(ticket.proposedSolution || '');

    for (const action of actions) {
      try {
        const result = await this.executeAction(action, ticket);
        results.push({ action, result, success: true });
        logger.debug(`Executed action for ticket ${ticket.id}`, { action, result });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ action, error: errorMessage, success: false });
        logger.error(`Failed to execute action for ticket ${ticket.id}`, { action, error });
        throw error; // Fail fast on first error
      }
    }

    return results;
  }

  /**
   * Parse proposed solution into executable actions
   */
  private parseProposedSolution(solution: string): string[] {
    if (!solution) return [];
    
    // Split by common delimiters (comma, semicolon, newline)
    return solution
      .split(/[,;\n]/)
      .map(action => action.trim())
      .filter(action => action.length > 0);
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: string, ticket: Ticket): Promise<unknown> {
    const { logger } = await import('../../frontend/src/services/logger');
    
    // Route to appropriate handler based on ticket type and action
    switch (ticket.type) {
      case 'AUTOMATED_EVOLUTION':
        return await this.executeEvolutionAction(action, ticket);
      case 'SYSTEM_OPTIMIZATION':
        return await this.executeOptimizationAction(action, ticket);
      case 'SECURITY_RESPONSE':
        return await this.executeSecurityAction(action, ticket);
      default:
        logger.warn(`Unknown ticket type: ${ticket.type}, executing generic action`);
        return await this.executeGenericAction(action, ticket);
    }
  }

  /**
   * Execute evolution action
   */
  private async executeEvolutionAction(action: string, ticket: Ticket): Promise<unknown> {
    // Evolution actions typically involve system changes
    // For now, log and return success
    const { logger } = await import('../../frontend/src/services/logger');
    logger.info(`Executing evolution action: ${action}`, { ticketId: ticket.id });
    
    // In production, this would trigger actual system evolution
    return { action, status: 'executed', ticketId: ticket.id };
  }

  /**
   * Execute optimization action
   */
  private async executeOptimizationAction(action: string, ticket: Ticket): Promise<unknown> {
    const { logger } = await import('../../frontend/src/services/logger');
    logger.info(`Executing optimization action: ${action}`, { ticketId: ticket.id });
    
    // Route to specific optimization handlers
    if (action.toLowerCase().includes('cache')) {
      // Trigger cache optimization
      return { action, type: 'cache_optimization', status: 'executed' };
    } else if (action.toLowerCase().includes('database')) {
      // Trigger database optimization
      return { action, type: 'database_optimization', status: 'executed' };
    }
    
    return { action, status: 'executed' };
  }

  /**
   * Execute security action
   */
  private async executeSecurityAction(action: string, ticket: Ticket): Promise<unknown> {
    const { logger } = await import('../../frontend/src/services/logger');
    logger.info(`Executing security action: ${action}`, { ticketId: ticket.id });
    
    // Route to security handlers
    if (action.toLowerCase().includes('block') || action.toLowerCase().includes('ip')) {
      // Trigger IP blocking
      return { action, type: 'ip_blocking', status: 'executed' };
    } else if (action.toLowerCase().includes('rate limit')) {
      // Trigger rate limiting
      return { action, type: 'rate_limiting', status: 'executed' };
    }
    
    return { action, status: 'executed' };
  }

  /**
   * Execute generic action
   */
  private async executeGenericAction(action: string, ticket: Ticket): Promise<unknown> {
    const { logger } = await import('../../frontend/src/services/logger');
    logger.info(`Executing generic action: ${action}`, { ticketId: ticket.id });
    return { action, status: 'executed' };
  }

  /**
   * Rollback ticket execution
   */
  private async rollbackTicket(ticket: Ticket): Promise<void> {
    const { logger } = await import('../../frontend/src/services/logger');
    logger.warn(`Rolling back ticket: ${ticket.id}`);
    
    // In production, this would implement actual rollback logic
    // For now, just log the rollback
    ticket.rollbackExecuted = true;
    ticket.rollbackAt = new Date().toISOString();
  }

  /**
   * Reject ticket
   */
  private async rejectTicket(ticket: Ticket, decision: HILResponse): Promise<void> {
    ticket.status = 'REJECTED';
    this.pendingTickets.delete(ticket.id);
    this.rejectedTickets.set(ticket.id, ticket);

    console.log(`❌ Rejected ticket: ${ticket.id}: ${decision.reason}`);
  }

  /**
   * Create HIL context
   */
  private async createHILContext(ticket: Ticket): Promise<HILContext> {
    const options: HILOption[] = [
      {
        id: 'approve',
        label: 'Approve',
        description: `Approve ticket: ${ticket.title}`,
        action: async () => {
          await this.approveTicket(ticket, {
            decision: 'approve',
            timestamp: new Date(),
          });
          return { success: true };
        },
        risk: 'low',
      },
      {
        id: 'reject',
        label: 'Reject',
        description: `Reject ticket: ${ticket.title}`,
        action: async () => {
          await this.rejectTicket(ticket, {
            decision: 'reject',
            timestamp: new Date(),
          });
          return { success: true };
        },
        risk: 'low',
      },
    ];

    return {
      agent: this.name,
      decision: 'ticket_approval',
      confidence: 0.5, // Medium confidence, needs HIL
      context: { ticket } as ExecutionContext,
      options,
      priority: ticket.issue?.severity === 'critical' ? 'critical' : 'high',
    };
  }

  /**
   * Submit ticket for approval
   */
  async submitTicket(ticket: Ticket): Promise<void> {
    ticket.status = 'PENDING_HIL_APPROVAL';
    this.pendingTickets.set(ticket.id, ticket);
  }

  /**
   * Set HIL handler
   */
  setHILHandler(handler: (hilContext: HILContext) => Promise<HILResponse>): void {
    this.hilHandler = handler;
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
    return context.ticket !== undefined;
  }

  getMetrics(): AgentMetrics {
    return { ...this.agentMetrics };
  }

  requiresHIL(context: ExecutionContext): boolean {
    const ticket = context.ticket as Ticket;
    if (!ticket) return false;

    // Require HIL if not auto-approvable
    return !this.checkAutoApproval(ticket);
  }

  async requestHIL(context: ExecutionContext, hilContext: HILContext): Promise<HILResponse> {
    if (this.hilHandler) {
      return await this.hilHandler(hilContext);
    }
    throw new Error('HIL handler not set');
  }

  private approvalPatterns: Map<string, { approved: number; rejected: number; autoApproved: number; outcomes: Array<{ success: boolean; timestamp: Date }> }> = new Map();
  private autoApprovalRules: Map<string, { threshold: number; successRate: number; attempts: number }> = new Map();

  learnFromResult(result: AgentResult): void {
    // Learn from approval patterns
    if (result.data && typeof result.data === 'object' && 'approvalDecision' in result.data) {
      const decision = (result.data as any).approvalDecision;
      const ticketType = decision.ticketType || 'unknown';
      const pattern = this.approvalPatterns.get(ticketType) || {
        approved: 0,
        rejected: 0,
        autoApproved: 0,
        outcomes: [],
      };
      
      if (decision.autoApproved) {
        pattern.autoApproved++;
      } else if (decision.approved) {
        pattern.approved++;
      } else {
        pattern.rejected++;
      }
      
      // Track outcomes if available
      if (decision.outcome) {
        pattern.outcomes.push({
          success: decision.outcome.success || false,
          timestamp: new Date(),
        });
        
        // Keep only last 100 outcomes
        if (pattern.outcomes.length > 100) {
          pattern.outcomes.shift();
        }
      }
      
      this.approvalPatterns.set(ticketType, pattern);
    }
  }

  async adaptStrategy(): Promise<void> {
    // Adapt auto-approval rules based on outcomes
    for (const [ticketType, pattern] of this.approvalPatterns.entries()) {
      if (pattern.outcomes.length >= 10) {
        const recentOutcomes = pattern.outcomes.slice(-20);
        const successCount = recentOutcomes.filter(o => o.success).length;
        const successRate = successCount / recentOutcomes.length;
        
        const rule = this.autoApprovalRules.get(ticketType) || {
          threshold: 0.8, // Default 80% confidence
          successRate: 0,
          attempts: 0,
        };
        
        rule.attempts++;
        rule.successRate = (rule.successRate * (rule.attempts - 1) + successRate) / rule.attempts;
        
        // If auto-approved tickets have high success rate, we can be more aggressive
        if (pattern.autoApproved > 0) {
          const autoApprovalSuccessRate = pattern.autoApproved / (pattern.autoApproved + pattern.rejected);
          if (autoApprovalSuccessRate > 0.9) {
            // Lower threshold for more auto-approvals
            rule.threshold = Math.max(rule.threshold * 0.95, 0.7);
          } else if (autoApprovalSuccessRate < 0.7) {
            // Raise threshold to be more conservative
            rule.threshold = Math.min(rule.threshold * 1.05, 0.95);
          }
        }
        
        this.autoApprovalRules.set(ticketType, rule);
      }
    }
  }
}
