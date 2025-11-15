// Content Security Policy Module
import { SecurityEvent, SecurityEventType, SecuritySeverity } from './types';
import { logger } from '../logger';

export class CSPManager {
  private cspViolations: string[] = [];
  private logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>;
  private generateId: () => string;

  constructor(
    logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>,
    generateId: () => string
  ) {
    this.logSecurityEvent = logSecurityEvent;
    this.generateId = generateId;
  }

  setupCSP(): void {
    if (typeof window === 'undefined') return;

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https:",
      "connect-src 'self' ws: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
    document.head.appendChild(meta);

    // Monitor CSP violations
    document.addEventListener('securitypolicyviolation', (e) => {
      this.handleCSPViolation(e);
    });
  }

  private handleCSPViolation(event: SecurityPolicyViolationEvent): void {
    const violation = {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      timestamp: new Date().toISOString(),
    };

    this.cspViolations.push(JSON.stringify(violation));
    this.logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity: SecuritySeverity.MEDIUM,
      description: 'CSP violation detected',
      metadata: violation,
    });
  }

  getCSPViolations(): string[] {
    return [...this.cspViolations];
  }
}

