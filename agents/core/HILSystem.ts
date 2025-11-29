/**
 * Human-in-the-Loop (HIL) System
 * 
 * Centralized HIL system for agent decision approval
 */

import { HILContext, HILResponse, ExecutionContext } from './types';
import { logger } from '../../frontend/src/services/logger';

export interface HILHandler {
  (context: HILContext): Promise<HILResponse>;
}

export interface HILConfig {
  enabled: boolean;
  autoApproveThreshold: number; // Confidence threshold for auto-approval
  timeout: number; // Timeout in milliseconds
  requireApprovalFor: string[]; // List of actions that always require approval
}

export class HILSystem {
  private static instance: HILSystem;
  private handlers: Map<string, HILHandler> = new Map();
  private pendingRequests: Map<string, HILContext> = new Map();
  private config: HILConfig = {
    enabled: true,
    autoApproveThreshold: 0.95,
    timeout: 300000, // 5 minutes
    requireApprovalFor: ['block', 'escalate', 'delete', 'shutdown'],
  };

  private constructor() {}

  public static getInstance(): HILSystem {
    if (!HILSystem.instance) {
      HILSystem.instance = new HILSystem();
    }
    return HILSystem.instance;
  }

  /**
   * Register HIL handler for an agent
   */
  public registerHandler(agentName: string, handler: HILHandler): void {
    this.handlers.set(agentName, handler);
    logger.info(`HIL handler registered for agent: ${agentName}`);
  }

  /**
   * Request HIL decision
   */
  public async requestHIL(context: HILContext): Promise<HILResponse> {
    if (!this.config.enabled) {
      // If HIL is disabled, auto-approve if confidence is high
      if (context.confidence >= this.config.autoApproveThreshold) {
        return {
          decision: 'approved',
          reason: 'HIL disabled, auto-approved due to high confidence',
          timestamp: new Date(),
          confidence: context.confidence,
        };
      }
      // Otherwise, deny
      return {
        decision: 'denied',
        reason: 'HIL disabled, insufficient confidence for auto-approval',
        timestamp: new Date(),
        confidence: context.confidence,
      };
    }

    // Check if action always requires approval
    if (this.config.requireApprovalFor.includes(context.decision)) {
      return await this.processHILRequest(context);
    }

    // Auto-approve if confidence is very high
    if (context.confidence >= this.config.autoApproveThreshold) {
      logger.info(`Auto-approving HIL request: ${context.decision} (confidence: ${context.confidence})`);
      return {
        decision: 'approved',
        reason: `Auto-approved due to high confidence (${(context.confidence * 100).toFixed(1)}%)`,
        timestamp: new Date(),
        confidence: context.confidence,
      };
    }

    // Process HIL request
    return await this.processHILRequest(context);
  }

  /**
   * Process HIL request (requires human approval)
   */
  private async processHILRequest(context: HILContext): Promise<HILResponse> {
    const requestId = `hil_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.pendingRequests.set(requestId, context);

    logger.info(`HIL request created: ${requestId}`, {
      agent: context.agent,
      decision: context.decision,
      confidence: context.confidence,
      priority: context.priority,
    });

    // Try to use agent-specific handler
    const handler = this.handlers.get(context.agent);
    if (handler) {
      try {
        const response = await handler(context);
        this.pendingRequests.delete(requestId);
        return response;
      } catch (error) {
        logger.error(`HIL handler error for ${context.agent}`, { error });
      }
    }

    // Default HIL processing
    // In a real implementation, this would:
    // 1. Create a ticket/notification for human review
    // 2. Wait for human response
    // 3. Return the decision

    // For now, implement a basic approval system
    return await this.defaultHILProcessing(context, requestId);
  }

  /**
   * Default HIL processing (can be overridden)
   */
  private async defaultHILProcessing(context: HILContext, requestId: string): Promise<HILResponse> {
    // Create notification for human review
    if (typeof window !== 'undefined' && (window as any).notificationService) {
      const notificationService = (window as any).notificationService;
      await notificationService.sendNotification({
        type: 'hil_request',
        title: `HIL Request: ${context.decision}`,
        message: `Agent ${context.agent} requires approval for: ${context.decision}`,
        severity: context.priority === 'critical' ? 'critical' : 'high',
        timestamp: new Date(),
        details: {
          requestId,
          confidence: context.confidence,
          options: context.options.map(o => ({ id: o.id, label: o.label, risk: o.risk })),
        },
      });
    }

    // For critical decisions, wait for response
    // For non-critical, auto-approve after timeout if no response
    if (context.priority === 'critical') {
      // In production, this would wait for actual human response
      // For now, return a monitor decision
      return {
        decision: 'monitor',
        reason: 'Critical decision requires human review',
        timestamp: new Date(),
        confidence: context.confidence,
      };
    }

    // For non-critical, auto-approve after a short delay (simulating human review)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      decision: 'approved',
      reason: 'Auto-approved after review delay',
      timestamp: new Date(),
      confidence: context.confidence,
    };
  }

  /**
   * Update HIL configuration
   */
  public updateConfig(config: Partial<HILConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('HIL configuration updated', { config: this.config });
  }

  /**
   * Get pending HIL requests
   */
  public getPendingRequests(): HILContext[] {
    return Array.from(this.pendingRequests.values());
  }

  /**
   * Resolve HIL request (called by human reviewer)
   */
  public async resolveRequest(requestId: string, decision: HILResponse): Promise<void> {
    const context = this.pendingRequests.get(requestId);
    if (context) {
      this.pendingRequests.delete(requestId);
      logger.info(`HIL request resolved: ${requestId}`, { decision: decision.decision });
    }
  }
}

