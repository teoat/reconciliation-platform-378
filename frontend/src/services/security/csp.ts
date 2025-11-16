// Content Security Policy Module
import { SecurityEvent, SecurityEventType, SecuritySeverity } from './types';

export class CSPManager {
  private cspViolations: string[] = [];
  private logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>;

  constructor(
    logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>,
    _generateId: () => string // Unused but required by interface
  ) {
    this.logSecurityEvent = logSecurityEvent;
  }

  setupCSP(): void {
    if (typeof window === 'undefined') return;

    const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    
    // Remove existing CSP meta tag if present
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) {
      existingCSP.remove();
    }
    
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    
    // Generate nonce for production
    const nonce = this.generateNonce();
    
    // Development: More permissive to allow eval for React dev tools
    // Production: Use nonces instead of unsafe-inline
    if (isDevelopment) {
      meta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' ws: wss: http://localhost:* https://localhost:*",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ');
    } else {
      // Production: Use nonces for better security
      meta.content = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}'`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' ws: wss: https:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ');
      
      // Store nonce for use in inline scripts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as unknown as Record<string, unknown>).__CSP_NONCE__ = nonce;
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
   * Generates a CSP nonce for inline scripts/styles
   */
  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Gets the current CSP nonce (for use in inline scripts)
   */
  getNonce(): string | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nonce = (window as Record<string, unknown>).__CSP_NONCE__;
    return typeof nonce === 'string' ? nonce : null;
  }
}

