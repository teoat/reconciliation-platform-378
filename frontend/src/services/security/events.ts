// Security Event Logging Module
import { SecurityEvent, SecurityEventType, SecuritySeverity } from './types';
import { logger } from '../logger';

interface FailedEvent extends SecurityEvent {
  retryCount?: number;
  storedAt?: string;
}

export class SecurityEventLogger {
  private securityEvents: SecurityEvent[] = [];
  private generateId: () => string;
  private getSessionId: () => string;

  constructor(generateId: () => string, getSessionId: () => string) {
    this.generateId = generateId;
    this.getSessionId = getSessionId;
  }

  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: SecurityEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    this.securityEvents.push(fullEvent);

    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    if (import.meta.env.DEV) {
      logger.warn('Security Event:', fullEvent);
    }

    try {
      await this.sendSecurityEventToServer(fullEvent);
    } catch (error) {
      logger.error('Failed to send security event to server:', error);
      this.storeFailedEvent(fullEvent);
    }
  }

  private async sendSecurityEventToServer(event: SecurityEvent): Promise<void> {
    const { apiClient } = await import('../apiClient');

    await apiClient.post('/api/security/events', {
      event: event,
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      sessionId: this.getSessionId(),
    });
  }

  private storeFailedEvent(event: SecurityEvent): void {
    const failedEvents = JSON.parse(localStorage.getItem('failedSecurityEvents') || '[]');
    failedEvents.push({
      ...event,
      retryCount: 0,
      storedAt: new Date().toISOString(),
    });

    if (failedEvents.length > 50) {
      failedEvents.splice(0, failedEvents.length - 50);
    }

    localStorage.setItem('failedSecurityEvents', JSON.stringify(failedEvents));
  }

  async retryFailedEvents(): Promise<void> {
    const failedEvents: FailedEvent[] = JSON.parse(
      localStorage.getItem('failedSecurityEvents') || '[]'
    );
    if (failedEvents.length === 0) return;

    const remainingEvents: FailedEvent[] = [];

    for (const failedEvent of failedEvents) {
      try {
        await this.sendSecurityEventToServer(failedEvent);
      } catch (error) {
        failedEvent.retryCount = (failedEvent.retryCount || 0) + 1;
        if (failedEvent.retryCount < 3) {
          remainingEvents.push(failedEvent);
        }
      }
    }

    localStorage.setItem('failedSecurityEvents', JSON.stringify(remainingEvents));
  }

  getSecurityEvents(filters?: {
    type?: SecurityEventType;
    severity?: SecuritySeverity;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): SecurityEvent[] {
    let events = [...this.securityEvents];

    if (filters) {
      if (filters.type) {
        events = events.filter((event) => event.type === filters.type);
      }
      if (filters.severity) {
        events = events.filter((event) => event.severity === filters.severity);
      }
      if (filters.userId) {
        events = events.filter((event) => event.metadata?.userId === filters.userId);
      }
      if (filters.startDate) {
        events = events.filter((event) => event.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        events = events.filter((event) => event.timestamp <= filters.endDate!);
      }
      if (filters.limit) {
        events = events.slice(-filters.limit);
      }
    }

    return events;
  }

  async logAuthenticationEvent(
    type: SecurityEventType,
    success: boolean,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logSecurityEvent({
      type,
      severity: success ? SecuritySeverity.LOW : SecuritySeverity.MEDIUM,
      description: `${type.replace('_', ' ').toUpperCase()}: ${success ? 'Success' : 'Failed'}`,
      metadata: { userId, success, ...metadata },
    });
  }

  async logAuthorizationEvent(
    type: SecurityEventType,
    resource: string,
    action: string,
    userId?: string,
    allowed: boolean = false,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logSecurityEvent({
      type,
      severity: allowed ? SecuritySeverity.LOW : SecuritySeverity.MEDIUM,
      description: `Authorization ${allowed ? 'granted' : 'denied'}: ${action} on ${resource}`,
      metadata: { userId, resource, action, allowed, ...metadata },
    });
  }

  async logInputValidationEvent(
    type: SecurityEventType,
    field: string,
    value: string,
    reason: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logSecurityEvent({
      type,
      severity: SecuritySeverity.MEDIUM,
      description: `Input validation failed: ${reason}`,
      metadata: { userId, field, value: this.sanitizeForLogging(value), reason, ...metadata },
    });
  }

  async logFileUploadEvent(
    type: SecurityEventType,
    fileName: string,
    fileSize: number,
    mimeType: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const severity =
      type === SecurityEventType.MALICIOUS_FILE_DETECTED
        ? SecuritySeverity.HIGH
        : SecuritySeverity.LOW;

    await this.logSecurityEvent({
      type,
      severity,
      description: `File upload: ${fileName} (${this.formatFileSize(fileSize)})`,
      metadata: { userId, fileName, fileSize, mimeType, ...metadata },
    });
  }

  async logSessionEvent(
    type: SecurityEventType,
    userId?: string,
    sessionId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logSecurityEvent({
      type,
      severity: SecuritySeverity.LOW,
      description: `Session event: ${type.replace('_', ' ')}`,
      metadata: { userId, sessionId: sessionId || this.getSessionId(), ...metadata },
    });
  }

  async logDataAccessEvent(
    type: SecurityEventType,
    resource: string,
    operation: string,
    recordCount?: number,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logSecurityEvent({
      type,
      severity: recordCount && recordCount > 1000 ? SecuritySeverity.MEDIUM : SecuritySeverity.LOW,
      description: `Data access: ${operation} on ${resource}${recordCount ? ` (${recordCount} records)` : ''}`,
      metadata: { userId, resource, operation, recordCount, ...metadata },
    });
  }

  private sanitizeForLogging(value: string): string {
    return value.substring(0, 100);
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
