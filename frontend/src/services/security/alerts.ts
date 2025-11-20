// Automated Security Alerts Module
import { SecurityEvent, SecurityEventType, SecuritySeverity, AlertRule } from './types';
import { logger } from '../logger';
import { EventEmitter } from 'events';

export class SecurityAlertManager extends EventEmitter {
  private alertRules: AlertRule[] = [];
  private alertCooldowns: Map<string, number> = new Map();
  private logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>;
  private generateId: () => string;
  private alertMonitoringInterval?: NodeJS.Timeout;

  constructor(
    logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>,
    generateId: () => string
  ) {
    super();
    this.logSecurityEvent = logSecurityEvent;
    this.generateId = generateId;
  }

  setupAutomatedAlerts(events: SecurityEvent[]): void {
    this.alertRules = [
      {
        id: 'brute_force_alert',
        condition: (evts) => {
          const failedLogins = evts.filter(
            (e) =>
              e.type === SecurityEventType.LOGIN_FAILURE &&
              new Date(e.timestamp) > new Date(Date.now() - 15 * 60 * 1000)
          );
          return failedLogins.length >= 10;
        },
        severity: SecuritySeverity.CRITICAL,
        message: 'Potential brute force attack detected',
        cooldownMinutes: 30,
      },
      {
        id: 'multiple_ip_alert',
        condition: (evts) => {
          const recentLogins = evts.filter(
            (e) =>
              e.type === SecurityEventType.LOGIN_SUCCESS &&
              new Date(e.timestamp) > new Date(Date.now() - 5 * 60 * 1000)
          );
          const uniqueIPs = new Set(recentLogins.map((e) => e.metadata?.ipAddress).filter(Boolean));
          return uniqueIPs.size >= 3;
        },
        severity: SecuritySeverity.HIGH,
        message: 'Multiple IP addresses used for login',
        cooldownMinutes: 15,
      },
      {
        id: 'suspicious_file_alert',
        condition: (evts) => {
          const maliciousFiles = evts.filter(
            (e) =>
              e.type === SecurityEventType.MALICIOUS_FILE_DETECTED &&
              new Date(e.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
          );
          return maliciousFiles.length >= 3;
        },
        severity: SecuritySeverity.HIGH,
        message: 'Multiple malicious file uploads detected',
        cooldownMinutes: 60,
      },
      {
        id: 'privilege_escalation_alert',
        condition: (evts) => {
          const privilegeEvents = evts.filter(
            (e) =>
              e.type === SecurityEventType.ELEVATED_PRIVILEGES &&
              new Date(e.timestamp) > new Date(Date.now() - 30 * 60 * 1000)
          );
          return privilegeEvents.length >= 2;
        },
        severity: SecuritySeverity.HIGH,
        message: 'Multiple privilege escalation attempts detected',
        cooldownMinutes: 30,
      },
      {
        id: 'unusual_access_pattern',
        condition: (evts) => {
          const accessEvents = evts.filter(
            (e) =>
              [SecurityEventType.UNAUTHORIZED_ACCESS, SecurityEventType.PERMISSION_DENIED].includes(
                e.type
              ) && new Date(e.timestamp) > new Date(Date.now() - 10 * 60 * 1000)
          );
          return accessEvents.length >= 20;
        },
        severity: SecuritySeverity.MEDIUM,
        message: 'Unusual access pattern detected',
        cooldownMinutes: 10,
      },
    ];

    this.startAlertMonitoring(events);
  }

  private startAlertMonitoring(events: SecurityEvent[]): void {
    this.alertMonitoringInterval = setInterval(() => {
      this.checkAndTriggerAlerts(events);
    }, 60 * 1000) as unknown as NodeJS.Timeout;
  }

  private async checkAndTriggerAlerts(events: SecurityEvent[]): Promise<void> {
    for (const rule of this.alertRules) {
      const lastTriggered = this.alertCooldowns.get(rule.id);
      if (lastTriggered && Date.now() - lastTriggered < rule.cooldownMinutes * 60 * 1000) {
        continue;
      }

      if (rule.condition(events)) {
        await this.triggerSecurityAlert(rule);
        this.alertCooldowns.set(rule.id, Date.now());
      }
    }
  }

  private async triggerSecurityAlert(rule: {
    id: string;
    severity: SecuritySeverity;
    message: string;
  }): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity: rule.severity,
      description: `Security Alert: ${rule.message}`,
      metadata: {
        alertId: rule.id,
        alertType: 'automated',
        triggeredAt: new Date().toISOString(),
      },
    });

    this.emit('security_alert', {
      id: rule.id,
      severity: rule.severity,
      message: rule.message,
      timestamp: new Date().toISOString(),
    });

    logger.warn(`🚨 SECURITY ALERT: ${rule.message} (Severity: ${rule.severity})`);
  }

  async triggerManualAlert(
    message: string,
    severity: SecuritySeverity,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity,
      description: `Manual Alert: ${message}`,
      metadata: {
        alertType: 'manual',
        ...metadata,
      },
    });

    this.emit('security_alert', {
      id: this.generateId(),
      severity,
      message,
      timestamp: new Date().toISOString(),
      manual: true,
    });
  }

  destroy(): void {
    if (this.alertMonitoringInterval) {
      clearInterval(this.alertMonitoringInterval);
      this.alertMonitoringInterval = undefined;
    }
    this.removeAllListeners();
  }
}
