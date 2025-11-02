/**
 * Security Monitoring Agent - Autonomous Security Threat Detection
 * 
 * Extracts and enhances SecurityMonitor.check_alert_rules() functionality
 * into a meta-agent with learning and adaptation capabilities.
 * 
 * Source: backend/src/services/security_monitor.rs:235-264
 * Priority: HIGH
 */

import { MetaAgent, AgentType, AutonomyLevel, ExecutionContext, AgentResult, AgentMetrics, AgentStatus, HILContext, HILResponse, HILOption } from '../core/types';

interface SecurityEvent {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  source?: string;
  metadata?: Record<string, unknown>;
}

interface AlertRule {
  id: string;
  name: string;
  condition: (event: SecurityEvent, score: number) => boolean;
  action: 'log' | 'notify' | 'block' | 'escalate';
  threshold?: number;
}

export class SecurityMonitoringAgent implements MetaAgent {
  readonly name = 'SecurityMonitoringAgent';
  readonly type: AgentType = 'security';
  readonly autonomyLevel: AutonomyLevel = 'partial';

  private alertRules: Map<string, AlertRule> = new Map();
  private securityEvents: Map<string, SecurityEvent> = new Map();
  private blockedIPs: Set<string> = new Set();
  
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
  private eventStream: SecurityEvent[] = [];

  constructor() {
    this.setupAlertRules();
  }

  /**
   * Set up alert rules
   */
  private setupAlertRules(): void {
    // Rule 1: Failed login threshold
    this.alertRules.set('failed_logins', {
      id: 'failed_logins',
      name: 'Failed Login Threshold',
      condition: (event, score) => {
        return event.type === 'failed_login' && score >= 7.0;
      },
      action: 'notify',
      threshold: 7.0,
    });

    // Rule 2: Suspicious activity
    this.alertRules.set('suspicious_activity', {
      id: 'suspicious_activity',
      name: 'Suspicious Activity Detection',
      condition: (event, score) => {
        return event.type === 'suspicious_activity' && score >= 8.0;
      },
      action: 'escalate',
      threshold: 8.0,
    });

    // Rule 3: Unauthorized access
    this.alertRules.set('unauthorized_access', {
      id: 'unauthorized_access',
      name: 'Unauthorized Access Attempt',
      condition: (event, score) => {
        return event.type === 'unauthorized_access';
      },
      action: 'block',
      threshold: 9.0,
    });
  }

  async initialize(): Promise<void> {
    this.status = 'idle';
  }

  async start(): Promise<void> {
    if (this.status === 'running') return;
    
    this.status = 'running';

    // Start security monitoring loop - processes events continuously
    this.executionInterval = setInterval(() => {
      if (this.status === 'running') {
        this.processSecurityEvents().catch((error) => {
          console.error('SecurityMonitoringAgent execution failed:', error);
          this.agentMetrics.errors++;
        });
      }
    }, 5000); // Check every 5 seconds
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
    this.alertRules.clear();
    this.securityEvents.clear();
    this.blockedIPs.clear();
    this.eventStream = [];
  }

  async execute(context?: ExecutionContext): Promise<AgentResult> {
    return this.processSecurityEvents();
  }

  /**
   * Process security events
   */
  private async processSecurityEvents(): Promise<AgentResult> {
    const startTime = Date.now();
    this.status = 'running';

    try {
      let processed = 0;
      let alertsTriggered = 0;
      let actionsTaken = 0;

      // Process events from stream
      while (this.eventStream.length > 0) {
        const event = this.eventStream.shift();
        if (!event) break;

        processed++;
        const score = await this.calculateAnomalyScore(event);
        
        // Check alert rules
        for (const [ruleId, rule] of this.alertRules) {
          if (rule.condition(event, score)) {
            alertsTriggered++;
            
            // Execute rule action
            const actionResult = await this.executeRuleAction(rule, event, score);
            if (actionResult.success) {
              actionsTaken++;
            }
          }
        }

        // Store event
        this.securityEvents.set(event.id, event);
      }

      const executionTime = Date.now() - startTime;
      this.recordExecution(executionTime, true);
      this.agentMetrics.autoDecisions += actionsTaken;

      return {
        success: true,
        executionTime,
        data: { processed, alertsTriggered, actionsTaken },
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
   * Calculate anomaly score for event
   */
  private async calculateAnomalyScore(event: SecurityEvent): Promise<number> {
    // TODO: Implement actual anomaly detection
    // For now, base score on event type and severity
    const baseScores: Record<string, number> = {
      'failed_login': 5.0,
      'suspicious_activity': 7.0,
      'unauthorized_access': 9.0,
    };

    const baseScore = baseScores[event.type] || 3.0;
    const severityMultiplier: Record<string, number> = {
      'low': 1.0,
      'medium': 1.2,
      'high': 1.5,
      'critical': 2.0,
    };

    return baseScore * (severityMultiplier[event.severity] || 1.0);
  }

  /**
   * Execute rule action
   */
  private async executeRuleAction(rule: AlertRule, event: SecurityEvent, score: number): Promise<{ success: boolean; requiresHIL?: boolean }> {
    switch (rule.action) {
      case 'log':
        console.warn(`Security alert: ${rule.name} - ${event.description} (Score: ${score.toFixed(1)})`);
        return { success: true };

      case 'notify':
        // TODO: Send notification
        console.warn(`Security alert notification: ${rule.name} - ${event.description}`);
        return { success: true };

      case 'block':
        // Require HIL for blocking actions
        if (this.requiresHIL({ event, rule } as ExecutionContext)) {
          this.agentMetrics.hilRequests++;
          return { success: false, requiresHIL: true };
        }
        
        // Auto-block if IP is known bad
        const ip = event.metadata?.ip as string;
        if (ip && this.canAutoBlock(ip)) {
          await this.blockIP(ip, event);
          return { success: true };
        }

        return { success: false, requiresHIL: true };

      case 'escalate':
        // Always require HIL for escalation
        this.agentMetrics.hilRequests++;
        return { success: false, requiresHIL: true };

      default:
        return { success: false };
    }
  }

  /**
   * Block IP address
   */
  private async blockIP(ip: string, event: SecurityEvent): Promise<void> {
    this.blockedIPs.add(ip);
    console.warn(`🚫 Blocked IP: ${ip} due to ${event.type}`);
    // TODO: Implement actual IP blocking
  }

  /**
   * Check if IP can be auto-blocked
   */
  private canAutoBlock(ip: string): boolean {
    // Auto-block if IP has multiple violations
    const violations = Array.from(this.securityEvents.values())
      .filter((e) => e.metadata?.ip === ip && e.severity === 'critical').length;
    
    return violations >= 3;
  }

  /**
   * Add security event to stream
   */
  async addSecurityEvent(event: SecurityEvent): Promise<void> {
    this.eventStream.push(event);
  }

  /**
   * Request HIL for blocking decision
   */
  private async requestHILForBlock(event: SecurityEvent, rule: AlertRule, score: number): Promise<HILResponse> {
    const ip = event.metadata?.ip as string;
    
    const options: HILOption[] = [
      {
        id: 'block',
        label: 'Block IP',
        description: `Block IP ${ip} due to ${event.type}`,
        action: async () => {
          await this.blockIP(ip, event);
          return { success: true };
        },
        risk: 'medium',
      },
      {
        id: 'monitor',
        label: 'Monitor Only',
        description: `Monitor IP ${ip} without blocking`,
        action: async () => {
          // Just monitor
          return { success: true };
        },
        risk: 'low',
      },
      {
        id: 'ignore',
        label: 'Ignore',
        description: `Ignore this event`,
        action: async () => {
          return { success: true };
        },
        risk: 'low',
      },
    ];

    const hilContext: HILContext = {
      agent: this.name,
      decision: 'ip_blocking',
      confidence: score / 10,
      context: { event, rule } as ExecutionContext,
      options,
      priority: event.severity === 'critical' ? 'critical' : 'high',
    };

    // TODO: Call actual HIL handler
    return {
      decision: 'monitor',
      timestamp: new Date(),
    };
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
    return context.event !== undefined;
  }

  getMetrics(): AgentMetrics {
    return { ...this.agentMetrics };
  }

  requiresHIL(context: ExecutionContext): boolean {
    const rule = context.rule as AlertRule;
    const event = context.event as SecurityEvent;
    
    if (!rule || !event) return false;
    
    // Require HIL for blocking and escalation actions
    return rule.action === 'block' || rule.action === 'escalate';
  }

  async requestHIL(context: ExecutionContext, hilContext: HILContext): Promise<HILResponse> {
    // TODO: Implement HIL request
    return {
      decision: 'monitor',
      timestamp: new Date(),
    };
  }

  learnFromResult(result: AgentResult): void {
    // TODO: Learn from security event patterns
  }

  async adaptStrategy(): Promise<void> {
    // TODO: Adapt alert rules based on false positives
  }
}

