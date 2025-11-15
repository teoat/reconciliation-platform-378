// Frontend Security Service
// This service handles client-side security measures and validation

import { EventEmitter } from 'events';

export interface SecurityConfig {
  enableCSP: boolean;
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  enableContentSecurityPolicy: boolean;
  enableStrictTransportSecurity: boolean;
  maxSessionDuration: number;
  enableAutoLogout: boolean;
  enableInputSanitization: boolean;
  enablePasswordStrengthValidation: boolean;
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export enum SecurityEventType {
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_VIOLATION = 'csrf_violation',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  PASSWORD_WEAK = 'password_weak',
  SESSION_TIMEOUT = 'session_timeout',
  INVALID_INPUT = 'invalid_input',
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

class SecurityService extends EventEmitter {
  private config: SecurityConfig;
  private securityEvents: SecurityEvent[] = [];
  private sessionStartTime: number = Date.now();
  private lastActivity: number = Date.now();
  private inactivityTimer: NodeJS.Timeout | null = null;
  private cspViolations: string[] = [];

  constructor(config: Partial<SecurityConfig> = {}) {
    super();
    this.config = {
      enableCSP: true,
      enableXSSProtection: true,
      enableCSRFProtection: true,
      enableContentSecurityPolicy: true,
      enableStrictTransportSecurity: true,
      maxSessionDuration: 8 * 60 * 60 * 1000, // 8 hours
      enableAutoLogout: true,
      enableInputSanitization: true,
      enablePasswordStrengthValidation: true,
      ...config,
    };

    this.initializeSecurity();
  }

  private initializeSecurity() {
    if (typeof window !== 'undefined') {
      this.setupCSP();
      this.setupXSSProtection();
      this.setupCSRFProtection();
      this.setupSessionMonitoring();
      this.setupInputSanitization();
      this.setupPasswordValidation();
      this.setupActivityMonitoring();
    }
  }

  // Content Security Policy
  private setupCSP() {
    if (this.config.enableCSP) {
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
  }

  private handleCSPViolation(event: any) {
    const violation = {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      timestamp: new Date().toISOString(),
    };

    this.cspViolations.push(JSON.stringify(violation));
    this.logSecurityEvent({
      id: this.generateId(),
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity: SecuritySeverity.MEDIUM,
      description: 'CSP violation detected',
      timestamp: new Date().toISOString(),
      metadata: violation,
    });
  }

  // XSS Protection
  private setupXSSProtection() {
    if (this.config.enableXSSProtection) {
      // Sanitize all user inputs
      this.interceptFormSubmissions();
      this.interceptInnerHTML();
      this.interceptEval();
    }
  }

  private interceptFormSubmissions() {
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      const inputs = form.querySelectorAll('input, textarea, select');
      
      inputs.forEach((input: any) => {
        if (input.value) {
          const sanitized = this.sanitizeInput(input.value);
          if (sanitized !== input.value) {
            this.logSecurityEvent({
              id: this.generateId(),
              type: SecurityEventType.XSS_ATTEMPT,
              severity: SecuritySeverity.HIGH,
              description: 'Potential XSS attempt detected in form submission',
              timestamp: new Date().toISOString(),
              metadata: { field: input.name, originalValue: input.value },
            });
            input.value = sanitized;
          }
        }
      });
    });
  }

  private interceptInnerHTML() {
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (originalInnerHTML) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value) {
          const sanitized = this.sanitizeInput(value);
          if (sanitized !== value) {
            this.logSecurityEvent({
              id: this.generateId(),
              type: SecurityEventType.XSS_ATTEMPT,
              severity: SecuritySeverity.HIGH,
              description: 'Potential XSS attempt detected in innerHTML',
              timestamp: new Date().toISOString(),
              metadata: { originalValue: value },
            });
          }
          originalInnerHTML.set?.call(this, sanitized);
        },
        get: originalInnerHTML.get,
      });
    }
  }

  private interceptEval() {
    const originalEval = window.eval;
    window.eval = (code: string) => {
      this.logSecurityEvent({
        id: this.generateId(),
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecuritySeverity.CRITICAL,
        description: 'eval() usage detected',
        timestamp: new Date().toISOString(),
        metadata: { code },
      });
      return originalEval(code);
    };
  }

  // CSRF Protection
  private setupCSRFProtection() {
    if (this.config.enableCSRFProtection) {
      // Generate CSRF token
      const csrfToken = this.generateCSRFToken();
      localStorage.setItem('csrf_token', csrfToken);

      // Add CSRF token to all forms
      this.addCSRFTokenToForms(csrfToken);

      // Validate CSRF token on form submissions
      this.validateCSRFToken();
    }
  }

  private generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private addCSRFTokenToForms(token: string) {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (!form.querySelector('input[name="csrf_token"]')) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'csrf_token';
        input.value = token;
        form.appendChild(input);
      }
    });
  }

  private validateCSRFToken() {
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      const csrfInput = form.querySelector('input[name="csrf_token"]') as HTMLInputElement;
      
      if (csrfInput) {
        const storedToken = localStorage.getItem('csrf_token');
        if (!storedToken || csrfInput.value !== storedToken) {
          e.preventDefault();
          this.logSecurityEvent({
            id: this.generateId(),
            type: SecurityEventType.CSRF_VIOLATION,
            severity: SecuritySeverity.HIGH,
            description: 'CSRF token validation failed',
            timestamp: new Date().toISOString(),
          });
          alert('Security violation detected. Please refresh the page and try again.');
        }
      }
    });
  }

  // Session Monitoring
  private setupSessionMonitoring() {
    if (this.config.enableAutoLogout) {
      this.startSessionTimer();
    }
  }

  private startSessionTimer() {
    const checkSession = () => {
      const now = Date.now();
      const sessionDuration = now - this.sessionStartTime;
      const timeSinceActivity = now - this.lastActivity;

      if (sessionDuration > this.config.maxSessionDuration) {
        this.logSecurityEvent({
          id: this.generateId(),
          type: SecurityEventType.SESSION_TIMEOUT,
          severity: SecuritySeverity.MEDIUM,
          description: 'Session expired due to maximum duration',
          timestamp: new Date().toISOString(),
        });
        this.logout();
      } else if (timeSinceActivity > 30 * 60 * 1000) { // 30 minutes inactivity
        this.logSecurityEvent({
          id: this.generateId(),
          type: SecurityEventType.SESSION_TIMEOUT,
          severity: SecuritySeverity.MEDIUM,
          description: 'Session expired due to inactivity',
          timestamp: new Date().toISOString(),
        });
        this.logout();
      }
    };

    setInterval(checkSession, 60000); // Check every minute
  }

  private logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('csrf_token');
    window.location.href = '/login';
  }

  // Input Sanitization
  private setupInputSanitization() {
    if (this.config.enableInputSanitization) {
      // Sanitize all text inputs
      document.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.type === 'text' || target.type === 'textarea') {
          const sanitized = this.sanitizeInput(target.value);
          if (sanitized !== target.value) {
            target.value = sanitized;
            this.logSecurityEvent({
              id: this.generateId(),
              type: SecurityEventType.INVALID_INPUT,
              severity: SecuritySeverity.LOW,
              description: 'Input sanitized',
              timestamp: new Date().toISOString(),
              metadata: { field: target.name, originalValue: target.value },
            });
          }
        }
      });
    }
  }

  public sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/script/gi, '') // Remove script tags
      .replace(/iframe/gi, '') // Remove iframe tags
      .replace(/object/gi, '') // Remove object tags
      .replace(/embed/gi, '') // Remove embed tags
      .replace(/link/gi, '') // Remove link tags
      .replace(/meta/gi, '') // Remove meta tags
      .trim();
  }

  // Password Validation
  private setupPasswordValidation() {
    if (this.config.enablePasswordStrengthValidation) {
      document.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.type === 'password') {
          const strength = this.validatePasswordStrength(target.value);
          if (strength.score < 3) {
            this.logSecurityEvent({
              id: this.generateId(),
              type: SecurityEventType.PASSWORD_WEAK,
              severity: SecuritySeverity.LOW,
              description: 'Weak password detected',
              timestamp: new Date().toISOString(),
              metadata: { score: strength.score, feedback: strength.feedback },
            });
          }
        }
      });
    }
  }

  public validatePasswordStrength(password: string): { score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push('Password should be at least 8 characters long');

    if (/[a-z]/.test(password)) score++;
    else feedback.push('Password should contain lowercase letters');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Password should contain uppercase letters');

    if (/[0-9]/.test(password)) score++;
    else feedback.push('Password should contain numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score++;
    else feedback.push('Password should contain special characters');

    return { score, feedback };
  }

  // Activity Monitoring
  private setupActivityMonitoring() {
    const updateActivity = () => {
      this.lastActivity = Date.now();
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });
  }

  // Security Event Logging
  private logSecurityEvent(event: SecurityEvent) {
    this.securityEvents.push(event);
    
    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    this.emit('security_event', event);

    // Log to console in development
    if (import.meta.env.MODE === 'development') {
      console.warn('Security Event:', event);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Public Methods
  public getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  public getCSPViolations(): string[] {
    return [...this.cspViolations];
  }

  public getSessionInfo(): { startTime: number; lastActivity: number; duration: number } {
    return {
      startTime: this.sessionStartTime,
      lastActivity: this.lastActivity,
      duration: Date.now() - this.sessionStartTime,
    };
  }

  public validateFileUpload(file: File): { valid: boolean; reason?: string } {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, reason: 'File size exceeds 10MB limit' };
    }

    // Check file type
    const allowedTypes = [
      'text/csv',
      'application/json',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, reason: 'File type not allowed' };
    }

    // Check file name for suspicious patterns
    const suspiciousPatterns = /[<>:"|?*]/;
    if (suspiciousPatterns.test(file.name)) {
      return { valid: false, reason: 'File name contains invalid characters' };
    }

    return { valid: true };
  }

  public generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  public hashPassword(password: string): Promise<string> {
    // This would integrate with a proper password hashing library
    // For now, return a placeholder
    return Promise.resolve('hashed_password_placeholder');
  }

  public destroy() {
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
    }
    this.removeAllListeners();
  }
}

// Export singleton instance
export const securityService = new SecurityService();
export default securityService;