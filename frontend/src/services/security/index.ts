// Main Security Service Orchestrator
import { EventEmitter } from 'events';
import { SecurityConfig, SecurityEvent, SecurityEventType, SecuritySeverity } from './types';
import { CSPManager } from './csp';
import { XSSProtectionManager } from './xss';
import { CSRFProtectionManager } from './csrf';
import { SessionManager } from './session';
import { ValidationManager } from './validation';
import { SecurityEventLogger } from './events';
import { AnomalyDetector } from './anomalies';
import { SecurityAlertManager } from './alerts';
import { logger } from '../logger';

class SecurityService extends EventEmitter {
  private static instance: SecurityService;
  private config: SecurityConfig;
  private sessionStartTime: number;
  private lastActivity: number;

  private cspManager: CSPManager;
  private xssManager: XSSProtectionManager;
  private csrfManager: CSRFProtectionManager;
  private sessionManager: SessionManager;
  private validationManager: ValidationManager;
  private eventLogger: SecurityEventLogger;
  private anomalyDetector: AnomalyDetector;
  private alertManager: SecurityAlertManager;

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    await this.eventLogger.logSecurityEvent(event);
    this.emit('security_event', event);
  }

  private logout(): void {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('csrf_token');
    window.location.href = '/login';
  }

  constructor(config: Partial<SecurityConfig> = {}) {
    super();
    this.config = {
      enableCSP: true,
      enableXSSProtection: true,
      enableCSRFProtection: true,
      enableContentSecurityPolicy: true,
      enableStrictTransportSecurity: true,
      maxSessionDuration: 8 * 60 * 60 * 1000,
      enableAutoLogout: true,
      enableInputSanitization: true,
      enablePasswordStrengthValidation: true,
      ...config,
    };

    this.sessionStartTime = Date.now();
    this.lastActivity = Date.now();

    this.eventLogger = new SecurityEventLogger(
      this.generateId.bind(this),
      this.getSessionId.bind(this)
    );
    this.cspManager = new CSPManager(this.logSecurityEvent.bind(this), this.generateId.bind(this));
    this.xssManager = new XSSProtectionManager(
      this.logSecurityEvent.bind(this),
      this.generateId.bind(this),
      () => this.validationManager.sanitizeInput('')
    );
    this.csrfManager = new CSRFProtectionManager(
      this.logSecurityEvent.bind(this),
      this.generateId.bind(this)
    );
    this.sessionManager = new SessionManager(
      this.sessionStartTime,
      this.config.maxSessionDuration,
      this.logSecurityEvent.bind(this),
      this.generateId.bind(this),
      this.logout.bind(this)
    );
    this.validationManager = new ValidationManager(
      this.logSecurityEvent.bind(this),
      this.generateId.bind(this)
    );
    this.anomalyDetector = new AnomalyDetector();
    this.alertManager = new SecurityAlertManager(
      this.logSecurityEvent.bind(this),
      this.generateId.bind(this)
    );

    this.initializeSecurity();
  }

  public static getInstance(config?: Partial<SecurityConfig>): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService(config);
    }
    return SecurityService.instance;
  }

  private initializeSecurity(): void {
    if (typeof window !== 'undefined') {
      if (this.config.enableCSP) {
        this.cspManager.setupCSP();
      }
      if (this.config.enableXSSProtection) {
        this.xssManager.setupXSSProtection();
      }
      if (this.config.enableCSRFProtection) {
        this.csrfManager.setupCSRFProtection();
      }
      if (this.config.enableAutoLogout) {
        this.sessionManager.setupSessionMonitoring();
      }
      if (this.config.enableInputSanitization) {
        this.validationManager.setupInputSanitization();
      }
      if (this.config.enablePasswordStrengthValidation) {
        this.validationManager.setupPasswordValidation();
      }

      this.setupActivityMonitoring();
      this.alertManager.setupAutomatedAlerts(this.eventLogger.getSecurityEvents());
    }
  }

  private setupActivityMonitoring(): void {
    const updateActivity = () => {
      this.lastActivity = Date.now();
      this.sessionManager.updateActivity();
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach((event) => {
      document.addEventListener(event, updateActivity, true);
    });
  }

  // Public API methods
  public getSecurityEvents(filters?: {
    type?: SecurityEventType;
    severity?: SecuritySeverity;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): SecurityEvent[] {
    return this.eventLogger.getSecurityEvents(filters);
  }

  public async logAuthenticationEvent(
    type: SecurityEventType,
    success: boolean,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.eventLogger.logAuthenticationEvent(type, success, userId, metadata);
  }

  public async logAuthorizationEvent(
    type: SecurityEventType,
    resource: string,
    action: string,
    userId?: string,
    allowed: boolean = false,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.eventLogger.logAuthorizationEvent(type, resource, action, userId, allowed, metadata);
  }

  public async logInputValidationEvent(
    type: SecurityEventType,
    field: string,
    value: string,
    reason: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.eventLogger.logInputValidationEvent(type, field, value, reason, userId, metadata);
  }

  public async logFileUploadEvent(
    type: SecurityEventType,
    fileName: string,
    fileSize: number,
    mimeType: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.eventLogger.logFileUploadEvent(type, fileName, fileSize, mimeType, userId, metadata);
  }

  public async logSessionEvent(
    type: SecurityEventType,
    userId?: string,
    sessionId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.eventLogger.logSessionEvent(type, userId, sessionId, metadata);
  }

  public async logDataAccessEvent(
    type: SecurityEventType,
    resource: string,
    operation: string,
    recordCount?: number,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.eventLogger.logDataAccessEvent(
      type,
      resource,
      operation,
      recordCount,
      userId,
      metadata
    );
  }

  public sanitizeInput(input: string): string {
    return this.validationManager.sanitizeInput(input);
  }

  public validatePasswordStrength(password: string): { score: number; feedback: string[] } {
    return this.validationManager.validatePasswordStrength(password);
  }

  public validateFileUpload(file: File): { valid: boolean; reason?: string } {
    return this.validationManager.validateFileUpload(file);
  }

  public generateSecureToken(length: number = 32): string {
    return this.validationManager.generateSecureToken(length);
  }

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
    const events = this.eventLogger.getSecurityEvents();
    return this.anomalyDetector.detectAnomalies(events, userId, eventType, timeWindowMinutes);
  }

  public getCSPViolations(): string[] {
    return this.cspManager.getCSPViolations();
  }

  public getSessionInfo(): { startTime: number; lastActivity: number; duration: number } {
    return this.sessionManager.getSessionInfo();
  }

  public async triggerManualAlert(
    message: string,
    severity: SecuritySeverity,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.alertManager.triggerManualAlert(message, severity, metadata);
  }

  public async retryFailedEvents(): Promise<void> {
    await this.eventLogger.retryFailedEvents();
  }

  public destroy(): void {
    this.sessionManager.destroy();
    this.alertManager.destroy();
    this.removeAllListeners();
  }
}

export const securityService = SecurityService.getInstance();
export default securityService;
export * from './types';
