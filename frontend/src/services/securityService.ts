// Frontend Security Service
// This service handles client-side security measures and validation

import { EventEmitter } from 'events';
import { logger } from './logger';

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
  metadata?: Record<string, unknown>;
}

export enum SecurityEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_SUCCESS = 'password_reset_success',
  PASSWORD_RESET_FAILURE = 'password_reset_failure',

  // Authorization Events
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PERMISSION_DENIED = 'permission_denied',
  ROLE_CHANGE = 'role_change',
  ELEVATED_PRIVILEGES = 'elevated_privileges',

  // Session Events
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  SESSION_TIMEOUT = 'session_timeout',
  SESSION_RENEWAL = 'session_renewal',
  CONCURRENT_SESSION = 'concurrent_session',

  // Input Validation Events
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  INVALID_INPUT = 'invalid_input',
  MALFORMED_REQUEST = 'malformed_request',

  // File Upload Events
  FILE_UPLOAD_SUCCESS = 'file_upload_success',
  FILE_UPLOAD_FAILURE = 'file_upload_failure',
  MALICIOUS_FILE_DETECTED = 'malicious_file_detected',
  LARGE_FILE_UPLOAD = 'large_file_upload',

  // Network Events
  CSRF_VIOLATION = 'csrf_violation',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_IP = 'suspicious_ip',
  GEO_BLOCKED_ACCESS = 'geo_blocked_access',

  // System Events
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ANOMALOUS_BEHAVIOR = 'anomalous_behavior',
  PASSWORD_WEAK = 'password_weak',
  ACCOUNT_LOCKOUT = 'account_lockout',
  ACCOUNT_UNLOCK = 'account_unlock',

  // Data Protection Events
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  DATA_EXPORT = 'data_export',
  BULK_DATA_OPERATION = 'bulk_data_operation',

  // Audit Events
  CONFIG_CHANGE = 'config_change',
  SECURITY_POLICY_UPDATE = 'security_policy_update',
  USER_CREATED = 'user_created',
  USER_DELETED = 'user_deleted',
  USER_UPDATED = 'user_updated',
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

  private handleCSPViolation(event: SecurityPolicyViolationEvent) {
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

      inputs.forEach((input: Element) => {
        const htmlInput = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if (htmlInput.value) {
          const sanitized = this.sanitizeInput(htmlInput.value);
          if (sanitized !== htmlInput.value) {
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
        set: function (value) {
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
      // Store CSRF token in sessionStorage instead of localStorage for better security
      // Note: For production, consider using HttpOnly cookies set by the server
      sessionStorage.setItem('csrf_token', csrfToken);

      // Add CSRF token to all forms
      this.addCSRFTokenToForms(csrfToken);

      // Validate CSRF token on form submissions
      this.validateCSRFToken();
    }
  }

  private generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  private addCSRFTokenToForms(token: string) {
    const forms = document.querySelectorAll('form');
    forms.forEach((form) => {
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
        const storedToken = sessionStorage.getItem('csrf_token');
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
      } else if (timeSinceActivity > 30 * 60 * 1000) {
        // 30 minutes inactivity
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
    sessionStorage.removeItem('csrf_token');
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

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach((event) => {
      document.addEventListener(event, updateActivity, true);
    });
  }

  // Enhanced Security Event Logging
  private async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: SecurityEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    // Store in memory (for immediate access)
    this.securityEvents.push(fullEvent);

    // Keep only last 1000 events in memory
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Emit event for real-time handling
    this.emit('security_event', fullEvent);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Security Event:', fullEvent);
    }

    // Send to server for persistent logging (async, don't block)
    try {
      await this.sendSecurityEventToServer(fullEvent);
    } catch (error) {
      logger.error('Failed to send security event to server:', error);
      // Store failed events for retry
      this.storeFailedEvent(fullEvent);
    }
  }

  private async sendSecurityEventToServer(event: SecurityEvent): Promise<void> {
    // Import apiClient dynamically to avoid circular dependencies
    const { apiClient } = await import('../services/apiClient');

    try {
      await apiClient.post('/api/security/events', {
        event: event,
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
        sessionId: this.getSessionId(),
      });
    } catch (error) {
      throw error;
    }
  }

  private storeFailedEvent(event: SecurityEvent): void {
    const failedEvents = JSON.parse(localStorage.getItem('failedSecurityEvents') || '[]');
    failedEvents.push({
      ...event,
      retryCount: 0,
      storedAt: new Date().toISOString(),
    });

    // Keep only last 50 failed events
    if (failedEvents.length > 50) {
      failedEvents.splice(0, failedEvents.length - 50);
    }

    localStorage.setItem('failedSecurityEvents', JSON.stringify(failedEvents));
  }

  private async retryFailedEvents(): Promise<void> {
    const failedEvents = JSON.parse(localStorage.getItem('failedSecurityEvents') || '[]');
    if (failedEvents.length === 0) return;

    const remainingEvents: SecurityEvent[] = [];

    for (const failedEvent of failedEvents) {
      try {
        await this.sendSecurityEventToServer(failedEvent);
      } catch (error) {
        failedEvent.retryCount = (failedEvent.retryCount || 0) + 1;

        // Keep events that haven't exceeded max retries (3 attempts)
        if (failedEvent.retryCount < 3) {
          remainingEvents.push(failedEvent);
        }
      }
    }

    localStorage.setItem('failedSecurityEvents', JSON.stringify(remainingEvents));
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Public Methods
  public getSecurityEvents(filters?: {
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

  // Enhanced Security Event Logging Methods
  public async logAuthenticationEvent(
    type: SecurityEventType,
    success: boolean,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logSecurityEvent({
      type,
      severity: success ? SecuritySeverity.LOW : SecuritySeverity.MEDIUM,
      description: `${type.replace('_', ' ').toUpperCase()}: ${success ? 'Success' : 'Failed'}`,
      metadata: {
        userId,
        success,
        ...metadata,
      },
    });
  }

  public async logAuthorizationEvent(
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
      metadata: {
        userId,
        resource,
        action,
        allowed,
        ...metadata,
      },
    });
  }

  public async logInputValidationEvent(
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
      metadata: {
        userId,
        field,
        value: this.sanitizeForLogging(value),
        reason,
        ...metadata,
      },
    });
  }

  public async logFileUploadEvent(
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
      metadata: {
        userId,
        fileName,
        fileSize,
        mimeType,
        ...metadata,
      },
    });
  }

  public async logSessionEvent(
    type: SecurityEventType,
    userId?: string,
    sessionId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logSecurityEvent({
      type,
      severity: SecuritySeverity.LOW,
      description: `Session event: ${type.replace('_', ' ')}`,
      metadata: {
        userId,
        sessionId: sessionId || this.getSessionId(),
        ...metadata,
      },
    });
  }

  public async logDataAccessEvent(
    type: SecurityEventType,
    resource: string,
    operation: string,
    recordCount?: number,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logSecurityEvent({
      type,
      severity: SecuritySeverity.MEDIUM,
      description: `Data access: ${operation} on ${resource}`,
      metadata: {
        userId,
        resource,
        operation,
        recordCount,
        ...metadata,
      },
    });
  }

  // Utility Methods
  private sanitizeForLogging(value: string): string {
    // Remove sensitive data and limit length
    if (value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return value.replace(/password|token|key|secret/gi, '[REDACTED]');
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // Anomaly Detection
  public async detectAnomalies(
    userId: string,
    eventType: string,
    timeWindowMinutes: number = 60
  ): Promise<
    Array<{
      type: string;
      severity: SecuritySeverity;
      description: string;
      confidence: number;
      metadata: Record<string, unknown>;
    }>
  > {
    const anomalies: Array<{
      type: string;
      severity: SecuritySeverity;
      description: string;
      confidence: number;
      metadata: Record<string, unknown>;
    }> = [];

    const now = new Date();
    const timeWindowStart = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);

    // Get events for the user within the time window
    const userEvents = this.securityEvents.filter(
      (event) => event.metadata?.userId === userId && new Date(event.timestamp) >= timeWindowStart
    );

    // Analyze different types of anomalies
    switch (eventType) {
      case 'login':
        anomalies.push(...this.detectLoginAnomalies(userEvents, userId));
        break;
      case 'failed_login':
        anomalies.push(...this.detectFailedLoginAnomalies(userEvents, userId));
        break;
      case 'access_pattern':
        anomalies.push(...this.detectAccessPatternAnomalies(userEvents, userId));
        break;
      case 'file_upload':
        anomalies.push(...this.detectFileUploadAnomalies(userEvents, userId));
        break;
      case 'data_access':
        anomalies.push(...this.detectDataAccessAnomalies(userEvents, userId));
        break;
    }

    return anomalies;
  }

  private detectLoginAnomalies(
    events: SecurityEvent[],
    userId: string
  ): Array<{
    type: string;
    severity: SecuritySeverity;
    description: string;
    confidence: number;
    metadata: Record<string, unknown>;
  }> {
    const anomalies = [];
    const loginEvents = events.filter((e) => e.type === SecurityEventType.LOGIN_SUCCESS);
    const failedLoginEvents = events.filter((e) => e.type === SecurityEventType.LOGIN_FAILURE);

    // Check for rapid successive logins from different IPs
    const recentLogins = loginEvents.filter(
      (e) => new Date(e.timestamp) > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    );

    const uniqueIPs = new Set(recentLogins.map((e) => e.metadata?.ipAddress).filter(Boolean));

    if (uniqueIPs.size > 2) {
      anomalies.push({
        type: 'multiple_ip_logins',
        severity: SecuritySeverity.HIGH,
        description: `Multiple IP addresses used for login in short time: ${Array.from(uniqueIPs).join(', ')}`,
        confidence: 0.85,
        metadata: { userId, ipAddresses: Array.from(uniqueIPs), loginCount: recentLogins.length },
      });
    }

    // Check for unusual login times
    const unusualHours = loginEvents.filter((e) => {
      const hour = new Date(e.timestamp).getHours();
      return hour < 6 || hour > 22; // Outside 6 AM - 10 PM
    });

    if (unusualHours.length > loginEvents.length * 0.3) {
      anomalies.push({
        type: 'unusual_login_hours',
        severity: SecuritySeverity.MEDIUM,
        description: 'Unusual login hours detected',
        confidence: 0.7,
        metadata: { userId, unusualLogins: unusualHours.length, totalLogins: loginEvents.length },
      });
    }

    return anomalies;
  }

  private detectFailedLoginAnomalies(
    events: SecurityEvent[],
    userId: string
  ): Array<{
    type: string;
    severity: SecuritySeverity;
    description: string;
    confidence: number;
    metadata: Record<string, unknown>;
  }> {
    const anomalies = [];
    const failedLogins = events.filter((e) => e.type === SecurityEventType.LOGIN_FAILURE);

    // Check for brute force attempts
    if (failedLogins.length >= 5) {
      const recentFailedLogins = failedLogins.filter(
        (e) => new Date(e.timestamp) > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
      );

      if (recentFailedLogins.length >= 5) {
        anomalies.push({
          type: 'brute_force_attempt',
          severity: SecuritySeverity.CRITICAL,
          description: `Potential brute force attack: ${recentFailedLogins.length} failed login attempts`,
          confidence: 0.95,
          metadata: {
            userId,
            failedAttempts: recentFailedLogins.length,
            timeWindow: '15 minutes',
            ipAddresses: [
              ...new Set(recentFailedLogins.map((e) => e.metadata?.ipAddress).filter(Boolean)),
            ],
          },
        });
      }
    }

    // Check for distributed attacks (same password tried from multiple IPs)
    const passwordAttempts = new Map<string, string[]>();
    failedLogins.forEach((event) => {
      const password = event.metadata?.passwordAttempt;
      const ip = event.metadata?.ipAddress;
      if (password && ip) {
        if (!passwordAttempts.has(password)) {
          passwordAttempts.set(password, []);
        }
        passwordAttempts.get(password)!.push(ip);
      }
    });

    for (const [password, ips] of passwordAttempts) {
      if (ips.length >= 3) {
        anomalies.push({
          type: 'distributed_attack',
          severity: SecuritySeverity.HIGH,
          description: `Same password attempted from multiple IPs: ${ips.length} different addresses`,
          confidence: 0.9,
          metadata: {
            userId,
            password: this.sanitizeForLogging(password),
            ipCount: ips.length,
            ips,
          },
        });
      }
    }

    return anomalies;
  }

  private detectAccessPatternAnomalies(
    events: SecurityEvent[],
    userId: string
  ): Array<{
    type: string;
    severity: SecuritySeverity;
    description: string;
    confidence: number;
    metadata: Record<string, unknown>;
  }> {
    const anomalies = [];
    const accessEvents = events.filter((e) =>
      [SecurityEventType.UNAUTHORIZED_ACCESS, SecurityEventType.PERMISSION_DENIED].includes(e.type)
    );

    // Check for privilege escalation attempts
    const privilegeEvents = events.filter((e) => e.type === SecurityEventType.ELEVATED_PRIVILEGES);
    if (privilegeEvents.length > 0) {
      anomalies.push({
        type: 'privilege_escalation',
        severity: SecuritySeverity.HIGH,
        description: 'Attempted privilege escalation detected',
        confidence: 0.8,
        metadata: { userId, attempts: privilegeEvents.length },
      });
    }

    // Check for unusual resource access patterns
    const resourceAccess = new Map<string, number>();
    accessEvents.forEach((event) => {
      const resource = event.metadata?.resource;
      if (resource) {
        resourceAccess.set(resource, (resourceAccess.get(resource) || 0) + 1);
      }
    });

    for (const [resource, count] of resourceAccess) {
      if (count >= 10) {
        anomalies.push({
          type: 'resource_access_anomaly',
          severity: SecuritySeverity.MEDIUM,
          description: `Unusual access pattern to resource: ${resource} (${count} attempts)`,
          confidence: 0.75,
          metadata: { userId, resource, accessCount: count },
        });
      }
    }

    return anomalies;
  }

  private detectFileUploadAnomalies(
    events: SecurityEvent[],
    userId: string
  ): Array<{
    type: string;
    severity: SecuritySeverity;
    description: string;
    confidence: number;
    metadata: Record<string, unknown>;
  }> {
    const anomalies = [];
    const uploadEvents = events.filter((e) => e.type === SecurityEventType.FILE_UPLOAD_SUCCESS);
    const maliciousEvents = events.filter(
      (e) => e.type === SecurityEventType.MALICIOUS_FILE_DETECTED
    );

    // Check for large number of uploads in short time
    const recentUploads = uploadEvents.filter(
      (e) => new Date(e.timestamp) > new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
    );

    if (recentUploads.length >= 10) {
      anomalies.push({
        type: 'bulk_file_upload',
        severity: SecuritySeverity.MEDIUM,
        description: `Bulk file upload detected: ${recentUploads.length} files in 10 minutes`,
        confidence: 0.7,
        metadata: { userId, uploadCount: recentUploads.length, timeWindow: '10 minutes' },
      });
    }

    // Check for malicious file patterns
    if (maliciousEvents.length > 0) {
      anomalies.push({
        type: 'malicious_file_pattern',
        severity: SecuritySeverity.HIGH,
        description: `Malicious file upload attempts detected: ${maliciousEvents.length}`,
        confidence: 0.95,
        metadata: { userId, maliciousAttempts: maliciousEvents.length },
      });
    }

    return anomalies;
  }

  private detectDataAccessAnomalies(
    events: SecurityEvent[],
    userId: string
  ): Array<{
    type: string;
    severity: SecuritySeverity;
    description: string;
    confidence: number;
    metadata: Record<string, unknown>;
  }> {
    const anomalies = [];
    const dataAccessEvents = events.filter(
      (e) => e.type === SecurityEventType.SENSITIVE_DATA_ACCESS
    );

    // Check for bulk data operations
    const bulkOperations = events.filter((e) => e.type === SecurityEventType.BULK_DATA_OPERATION);
    if (bulkOperations.length > 0) {
      const totalRecords = bulkOperations.reduce(
        (sum, e) => sum + (e.metadata?.recordCount || 0),
        0
      );
      if (totalRecords > 10000) {
        anomalies.push({
          type: 'large_data_export',
          severity: SecuritySeverity.MEDIUM,
          description: `Large data export detected: ${totalRecords.toLocaleString()} records`,
          confidence: 0.8,
          metadata: { userId, totalRecords, operations: bulkOperations.length },
        });
      }
    }

    // Check for unusual data access patterns
    const resourceAccess = new Map<string, number>();
    dataAccessEvents.forEach((event) => {
      const resource = event.metadata?.resource;
      if (resource) {
        resourceAccess.set(resource, (resourceAccess.get(resource) || 0) + 1);
      }
    });

    for (const [resource, count] of resourceAccess) {
      if (count >= 20) {
        anomalies.push({
          type: 'frequent_sensitive_access',
          severity: SecuritySeverity.MEDIUM,
          description: `Frequent access to sensitive resource: ${resource} (${count} times)`,
          confidence: 0.75,
          metadata: { userId, resource, accessCount: count },
        });
      }
    }

    return anomalies;
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
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  public hashPassword(password: string): Promise<string> {
    // This would integrate with a proper password hashing library
    // For now, return a placeholder
    return Promise.resolve('hashed_password_placeholder');
  }

  // Automated Security Alerts
  private alertRules: Array<{
    id: string;
    condition: (events: SecurityEvent[]) => boolean;
    severity: SecuritySeverity;
    message: string;
    cooldownMinutes: number;
    lastTriggered?: number;
  }> = [];

  private alertCooldowns: Map<string, number> = new Map();

  public setupAutomatedAlerts(): void {
    // Define alert rules
    this.alertRules = [
      {
        id: 'brute_force_alert',
        condition: (events) => {
          const failedLogins = events.filter(
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
        condition: (events) => {
          const recentLogins = events.filter(
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
        condition: (events) => {
          const maliciousFiles = events.filter(
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
        condition: (events) => {
          const privilegeEvents = events.filter(
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
        condition: (events) => {
          const accessEvents = events.filter(
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

    // Start monitoring for alerts
    this.startAlertMonitoring();
  }

  private startAlertMonitoring(): void {
    // Check for alerts every minute
    setInterval(() => {
      this.checkAndTriggerAlerts();
    }, 60 * 1000);
  }

  private async checkAndTriggerAlerts(): Promise<void> {
    for (const rule of this.alertRules) {
      // Check cooldown
      const lastTriggered = this.alertCooldowns.get(rule.id);
      if (lastTriggered && Date.now() - lastTriggered < rule.cooldownMinutes * 60 * 1000) {
        continue;
      }

      // Check condition
      if (rule.condition(this.securityEvents)) {
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
    // Log the alert
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

    // Send alert notification (could integrate with external systems)
    this.emit('security_alert', {
      id: rule.id,
      severity: rule.severity,
      message: rule.message,
      timestamp: new Date().toISOString(),
    });

    // In a real implementation, this could send emails, SMS, or integrate with SIEM systems
    logger.warn(`🚨 SECURITY ALERT: ${rule.message} (Severity: ${rule.severity})`);
  }

  // Public method to manually trigger alerts
  public async triggerManualAlert(
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
