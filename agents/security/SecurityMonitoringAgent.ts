/**
 * Security Monitoring Agent - Autonomous Security Threat Detection
 *
 * Extracts and enhances SecurityMonitor.check_alert_rules() functionality
 * into a meta-agent with learning and adaptation capabilities.
 *
 * Source: backend/src/services/security_monitor.rs:235-264
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
import { HILSystem } from '../core/HILSystem';
import { logger } from '../../frontend/src/services/logger';

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
  private adaptiveThresholds: Map<string, number> = new Map();

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
        const threshold = this.adaptiveThresholds.get('failed_logins') || 7.0;
        return event.type === 'failed_login' && score >= threshold;
      },
      action: 'notify',
      threshold: 7.0,
    });

    // Rule 2: Suspicious activity
    this.alertRules.set('suspicious_activity', {
      id: 'suspicious_activity',
      name: 'Suspicious Activity Detection',
      condition: (event, score) => {
        const threshold = this.adaptiveThresholds.get('suspicious_activity') || 8.0;
        return event.type === 'suspicious_activity' && score >= threshold;
      },
      action: 'escalate',
      threshold: 8.0,
    });

    // Rule 3: Unauthorized access
    this.alertRules.set('unauthorized_access', {
      id: 'unauthorized_access',
      name: 'Unauthorized Access Attempt',
      condition: (event, score) => {
        const threshold = this.adaptiveThresholds.get('unauthorized_access') || 9.0;
        return event.type === 'unauthorized_access' && score >= threshold;
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
    // Base scores on event type and severity
    const baseScores: Record<string, number> = {
      failed_login: 5.0,
      suspicious_activity: 7.0,
      unauthorized_access: 9.0,
    };

    let baseScore = baseScores[event.type] || 3.0;
    
    // Adjust base score based on learned patterns
    const patterns = this.eventPatterns.get(event.type);
    if (patterns && patterns.length >= 5) {
      const recentScores = patterns.slice(-10).map(p => p.score);
      const avgScore = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
      // If recent events of this type have higher scores, adjust base
      if (avgScore > baseScore) {
        baseScore = avgScore * 0.9; // Slightly lower than average to avoid over-alerting
      }
    }
    
    const severityMultiplier: Record<string, number> = {
      low: 1.0,
      medium: 1.2,
      high: 1.5,
      critical: 2.0,
    };

    return baseScore * (severityMultiplier[event.severity] || 1.0);
  }

  /**
   * Execute rule action
   */
  private async executeRuleAction(
    rule: AlertRule,
    event: SecurityEvent,
    score: number
  ): Promise<{ success: boolean; requiresHIL?: boolean }> {
    switch (rule.action) {
      case 'log':
        console.warn(
          `Security alert: ${rule.name} - ${event.description} (Score: ${score.toFixed(1)})`
        );
        return { success: true };

      case 'notify':
        // Send notification via available services
        await this.sendSecurityNotification(rule, event, score);
        return { success: true };

      case 'block':
        // Require HIL for blocking actions
        if (this.requiresHIL({ timestamp: new Date(), event, rule } as ExecutionContext)) {
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
    const { logger } = await import('../../frontend/src/services/logger');
    
    // Add to in-memory set
    this.blockedIPs.add(ip);
    logger.warn(`🚫 Blocked IP: ${ip} due to ${event.type}`);

    // Persist to backend security service
    try {
      // Call backend API to block IP
      const response = await fetch('/api/v1/security/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip_address: ip,
          reason: event.type,
          severity: event.severity,
          duration_seconds: this.getBlockDuration(event.severity),
          metadata: {
            event_id: event.id,
            description: event.description,
            timestamp: event.timestamp.toISOString(),
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        logger.info(`IP ${ip} blocked successfully`, { result });
      } else {
        logger.warn(`Failed to block IP ${ip} via backend API`, { 
          status: response.status,
          statusText: response.statusText,
        });
        // Continue with in-memory blocking even if backend fails
      }
    } catch (error) {
      logger.error(`Error blocking IP ${ip} via backend API`, { error });
      // Continue with in-memory blocking even if backend fails
    }

    // Store in localStorage as backup persistence
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const blockedIPs = JSON.parse(
          window.localStorage.getItem('blocked_ips') || '[]'
        ) as string[];
        if (!blockedIPs.includes(ip)) {
          blockedIPs.push(ip);
          window.localStorage.setItem('blocked_ips', JSON.stringify(blockedIPs));
        }
      }
    } catch (error) {
      logger.warn('Failed to persist blocked IP to localStorage', { error });
    }

    // Send notification about IP blocking
    await this.sendSecurityNotification(
      {
        id: 'ip_block_rule',
        name: 'IP Blocking Rule',
        condition: () => true,
        action: 'block',
      } as AlertRule,
      event,
      10.0
    );
  }

  /**
   * Get block duration based on severity
   */
  private getBlockDuration(severity: string): number {
    switch (severity) {
      case 'critical':
        return 86400; // 24 hours
      case 'high':
        return 3600; // 1 hour
      case 'medium':
        return 1800; // 30 minutes
      case 'low':
        return 600; // 10 minutes
      default:
        return 3600; // Default 1 hour
    }
  }

  /**
   * Check if IP is blocked (checks in-memory, backend, and localStorage)
   */
  private async isIPBlocked(ip: string): Promise<boolean> {
    // Check in-memory set
    if (this.blockedIPs.has(ip)) {
      return true;
    }

    // Check localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const blockedIPs = JSON.parse(
          window.localStorage.getItem('blocked_ips') || '[]'
        ) as string[];
        if (blockedIPs.includes(ip)) {
          return true;
        }
      }
    } catch {
      // localStorage check failed, continue
    }

    // Check backend
    try {
      const response = await fetch(`/api/v1/security/check-ip/${encodeURIComponent(ip)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const result = await response.json();
        return result.blocked === true;
      }
    } catch {
      // Backend check failed, continue
    }

    return false;
  }

  /**
   * Check if IP can be auto-blocked
   */
  private canAutoBlock(ip: string): boolean {
    // Auto-block if IP has multiple violations
    const violations = Array.from(this.securityEvents.values()).filter(
      (e) => e.metadata?.ip === ip && e.severity === 'critical'
    ).length;

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
  private async requestHILForBlock(
    event: SecurityEvent,
    rule: AlertRule,
    score: number
  ): Promise<HILResponse> {
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
      context: { 
        timestamp: new Date(),
        event, 
        rule 
      } as ExecutionContext,
      options,
      priority: event.severity === 'critical' ? 'critical' : 'high',
    };

    // Use centralized HIL system
    const hilSystem = HILSystem.getInstance();
    return await hilSystem.requestHIL(hilContext);
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

  /**
   * Send security notification via available services
   */
  private async sendSecurityNotification(
    rule: AlertRule,
    event: SecurityEvent,
    score: number
  ): Promise<void> {
    const { logger } = await import('../../frontend/src/services/logger');
    
    try {
      // Try to send via notification service if available
      if (typeof window !== 'undefined' && (window as any).notificationService) {
        const notificationService = (window as any).notificationService;
        await notificationService.sendNotification({
          type: 'security',
          title: `Security Alert: ${rule.name}`,
          message: `${event.description} (Score: ${score.toFixed(1)})`,
          severity: event.severity,
          timestamp: new Date(),
          details: {
            eventType: event.type,
            ruleName: rule.name,
            score,
          },
        });
        logger.info('Security notification sent via notification service');
        return;
      }

      // Try to send via email service if available
      if (typeof window !== 'undefined' && (window as any).emailService) {
        const emailService = (window as any).emailService;
        await emailService.send({
          to: 'security@example.com', // Should come from config
          subject: `Security Alert: ${rule.name}`,
          body: `Security Event: ${event.description}\nScore: ${score.toFixed(1)}\nSeverity: ${event.severity}`,
        });
        logger.info('Security notification sent via email service');
        return;
      }

      // Fallback: log to console and logger
      logger.warn(`Security alert notification: ${rule.name} - ${event.description} (Score: ${score.toFixed(1)})`);
      console.warn(`Security alert notification: ${rule.name} - ${event.description}`);
    } catch (error) {
      logger.error('Failed to send security notification', { error, rule: rule.name, event: event.type });
      // Fallback to console
      console.error('Failed to send security notification:', error);
    }
  }

  async requestHIL(_context: ExecutionContext, hilContext: HILContext): Promise<HILResponse> {
    // Use centralized HIL system
    const hilSystem = HILSystem.getInstance();
    return await hilSystem.requestHIL(hilContext);
  }

  private eventPatterns: Map<string, Array<{ timestamp: Date; score: number; severity: string; action: string }>> = new Map();
  private ruleEffectiveness: Map<string, { falsePositives: number; truePositives: number; averageScore: number }> = new Map();

  learnFromResult(result: AgentResult): void {
    // Learn from security event patterns
    if (result.data && typeof result.data === 'object' && 'events' in result.data) {
      const events = (result.data as any).events || [];
      events.forEach((event: any) => {
        const patternKey = event.type || 'unknown';
        if (!this.eventPatterns.has(patternKey)) {
          this.eventPatterns.set(patternKey, []);
        }
        const pattern = this.eventPatterns.get(patternKey)!;
        pattern.push({
          timestamp: new Date(),
          score: event.score || 0,
          severity: event.severity || 'medium',
          action: event.action || 'log',
        });
        
        // Keep only last 100 patterns per event type
        if (pattern.length > 100) {
          pattern.shift();
        }
      });
    }
    
    // Learn rule effectiveness
    if (result.data && typeof result.data === 'object' && 'ruleResults' in result.data) {
      const ruleResults = (result.data as any).ruleResults || [];
      ruleResults.forEach((ruleResult: any) => {
        const ruleName = ruleResult.ruleName || 'unknown';
        const learning = this.ruleEffectiveness.get(ruleName) || {
          falsePositives: 0,
          truePositives: 0,
          averageScore: 0,
        };
        
        if (ruleResult.wasFalsePositive) {
          learning.falsePositives++;
        } else {
          learning.truePositives++;
        }
        
        // Update average score
        const total = learning.falsePositives + learning.truePositives;
        learning.averageScore = (learning.averageScore * (total - 1) + (ruleResult.score || 0)) / total;
        
        this.ruleEffectiveness.set(ruleName, learning);
      });
    }
  }

  async adaptStrategy(): Promise<void> {
    // Adapt alert rules based on false positives and effectiveness
    for (const [ruleName, learning] of this.ruleEffectiveness.entries()) {
      const total = learning.falsePositives + learning.truePositives;
      if (total >= 5) {
        const falsePositiveRate = learning.falsePositives / total;
        
        // Get current threshold for this rule
        const rule = this.alertRules.get(ruleName);
        if (rule && rule.threshold) {
          const currentThreshold = this.adaptiveThresholds.get(ruleName) || rule.threshold;
          
          if (falsePositiveRate > 0.4) {
            // High false positive rate - increase threshold (less sensitive)
            const newThreshold = Math.min(currentThreshold * 1.1, currentThreshold * 1.5);
            this.adaptiveThresholds.set(ruleName, newThreshold);
            rule.threshold = newThreshold;
            logger.warn(`Rule ${ruleName} threshold increased to ${newThreshold.toFixed(1)} due to high false positive rate (${(falsePositiveRate * 100).toFixed(1)}%)`);
          } else if (falsePositiveRate < 0.1 && learning.truePositives > 0) {
            // Low false positive rate - can lower threshold slightly (more sensitive)
            const newThreshold = Math.max(currentThreshold * 0.95, currentThreshold * 0.9);
            this.adaptiveThresholds.set(ruleName, newThreshold);
            rule.threshold = newThreshold;
            logger.info(`Rule ${ruleName} threshold adjusted to ${newThreshold.toFixed(1)} (effective with ${(learning.averageScore).toFixed(1)} avg score)`);
          }
        }
      }
    }
    
    // Learn optimal anomaly score thresholds from patterns
    for (const [eventType, patterns] of this.eventPatterns.entries()) {
      if (patterns.length >= 10) {
        const recentScores = patterns.slice(-20).map(p => p.score);
        const avgScore = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
        const maxScore = Math.max(...recentScores);
        
        // Store learned threshold for this event type
        this.adaptiveThresholds.set(`anomaly_${eventType}`, avgScore);
        
        logger.debug(`Event type ${eventType}: avg score ${avgScore.toFixed(1)}, max ${maxScore.toFixed(1)}`);
      }
    }
  }
}
