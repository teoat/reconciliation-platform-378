// Content Security Policy Module
import { SecurityEvent, SecurityEventType, SecuritySeverity } from './types';
import { logger } from '../logger';
import { initializeNonceCSP, buildCSPHeader, getNonce } from '../../utils/cspNonce';
import { getCSPPolicy } from '../../utils/securityConfig';

export class CSPManager {
  private cspViolations: string[] = [];
  private logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>;
  private nonce: string | null = null;

  constructor(
    logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _generateId: () => string // Required by interface but not used in this class
  ) {
    this.logSecurityEvent = logSecurityEvent;
  }

  setupCSP(): void {
    if (typeof window === 'undefined') return;

    const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

    // Initialize nonce early for production
    if (!isDevelopment) {
      this.nonce = initializeNonceCSP();
    }

    // Remove existing CSP meta tag if present
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) {
      existingCSP.remove();
    }

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';

    // Development: More permissive to allow eval for React dev tools
    // Production: Use nonces instead of unsafe-inline
    if (isDevelopment) {
      meta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' ws: wss: http://localhost:* https://localhost:* http://localhost:8200 ws://localhost:8200 https://accounts.google.com https://oauth2.googleapis.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ');
    } else {
      // Production: Use nonce-based CSP from securityConfig
      const productionPolicy = getCSPPolicy('production');
      meta.content = buildCSPHeader(productionPolicy);

      logger.info('CSP initialized with nonce-based policy', {
        noncePrefix: this.nonce?.substring(0, 8) + '...',
      });
    }

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

  /**
   * Gets the current CSP nonce (for use in dynamically created scripts/styles)
   */
  getNonce(): string | null {
    return this.nonce || getNonce();
  }
}
