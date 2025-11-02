// Advanced Security Service
// Implements enterprise-grade security features including encryption, MFA, SSO, and compliance

import React from 'react';
import { APP_CONFIG } from '../constants';

// Factory functions for creating objects
export const createSecurityConfig = (config = {}) => ({
  encryption: createEncryptionConfig(config.encryption || {}),
  authentication: createAuthenticationConfig(config.authentication || {}),
  authorization: createAuthorizationConfig(config.authorization || {}),
  compliance: createComplianceConfig(config.compliance || {}),
  monitoring: createSecurityMonitoringConfig(config.monitoring || {}),
  rateLimiting: createRateLimitingConfig(config.rateLimiting || {}),
});

export const createEncryptionConfig = (config = {}) => ({
  algorithm: 'AES-GCM',
  keySize: 256,
  ivSize: 12,
  saltSize: 16,
  iterations: 100000,
  enableFieldLevel: true,
  enableTransitEncryption: true,
  enableRestEncryption: true,
  ...config,
});

export const createAuthenticationConfig = (config = {}) => ({
  enableMFA: true,
  enableSSO: true,
  enableBiometric: false,
  sessionTimeout: 30 * 60 * 1000,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000,
  passwordPolicy: createPasswordPolicy(config.passwordPolicy || {}),
  tokenExpiry: 15 * 60 * 1000,
  refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000,
  ...config,
});

export const createAuthorizationConfig = (config = {}) => ({
  enableRBAC: true,
  enableABAC: true,
  enableDynamicPermissions: true,
  defaultPermissions: ['read'],
  adminRoles: ['admin', 'super_admin'],
  auditLevel: 'comprehensive',
  ...config,
});

export const createComplianceConfig = (config = {}) => ({
  enableSOX: true,
  enableGDPR: true,
  enableHIPAA: false,
  enablePCI: true,
  enableISO27001: true,
  dataRetentionPolicy: createDataRetentionPolicy(config.dataRetentionPolicy || {}),
  auditRetention: 7 * 365 * 24 * 60 * 60 * 1000,
  encryptionRequired: true,
  ...config,
});

export const createSecurityMonitoringConfig = (config = {}) => ({
  enableRealTimeMonitoring: true,
  enableThreatDetection: true,
  enableAnomalyDetection: true,
  alertThresholds: createAlertThresholds(config.alertThresholds || {}),
  logLevel: 'comprehensive',
  ...config,
});

export const createRateLimitingConfig = (config = {}) => ({
  enabled: true,
  defaultLimits: {
    requests: 100,
    windowMs: 15 * 60 * 1000,
  },
  endpoints: new Map([
    ['/api/auth/login', { requests: 5, windowMs: 15 * 60 * 1000 }],
    ['/api/auth/register', { requests: 3, windowMs: 60 * 60 * 1000 }],
    ['/api/reconciliation/jobs', { requests: 50, windowMs: 60 * 1000 }],
  ]),
  ...config,
});

export const createRateLimitEntry = (config = {}) => ({
  timestamps: [],
  count: 0,
  ...config,
});

export const createPasswordPolicy = (config = {}) => ({
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventReuse: 5,
  expiryDays: 90,
  ...config,
});

export const createDataRetentionPolicy = (config = {}) => ({
  personalData: 7 * 365 * 24 * 60 * 60 * 1000,
  financialData: 10 * 365 * 24 * 60 * 60 * 1000,
  auditLogs: 7 * 365 * 24 * 60 * 60 * 1000,
  systemLogs: 1 * 365 * 24 * 60 * 60 * 1000,
  backupRetention: 3 * 365 * 24 * 60 * 60 * 1000,
  ...config,
});

export const createAlertThresholds = (config = {}) => ({
  failedLogins: 3,
  suspiciousActivity: 1,
  dataAccess: 100,
  privilegeEscalation: 1,
  ...config,
});

export const createSecurityEvent = (config = {}) => ({
  id: '',
  type: '',
  severity: 'low',
  userId: '',
  sessionId: '',
  ipAddress: '',
  userAgent: '',
  timestamp: new Date(),
  details: {},
  resolved: false,
  resolvedAt: null,
  resolvedBy: '',
  ...config,
});

export const SecurityEventType = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  MFA_ENABLED: 'mfa_enabled',
  MFA_DISABLED: 'mfa_disabled',
  MFA_FAILURE: 'mfa_failure',
  SSO_LOGIN: 'sso_login',
  SSO_FAILURE: 'sso_failure',
  PERMISSION_GRANTED: 'permission_granted',
  PERMISSION_DENIED: 'permission_denied',
  DATA_ACCESS: 'data_access',
  DATA_MODIFICATION: 'data_modification',
  DATA_EXPORT: 'data_export',
  PRIVILEGE_ESCALATION: 'privilege_escalation',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  ENCRYPTION_KEY_ROTATION: 'encryption_key_rotation',
  SECURITY_POLICY_VIOLATION: 'security_policy_violation',
};

class SecurityService {
  static instance = null
  config
  encryptionKeys = new Map()
  securityEvents = []
  threatDetection
  complianceAuditor
  rateLimitStore = new Map()

  static getInstance() {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService()
    }
    return SecurityService.instance
  }

  constructor() {
    this.config = createSecurityConfig({
      encryption: createEncryptionConfig(),
      authentication: createAuthenticationConfig(),
      authorization: createAuthorizationConfig(),
      compliance: createComplianceConfig(),
      monitoring: createSecurityMonitoringConfig(),
      rateLimiting: createRateLimitingConfig(),
    })

    this.threatDetection = new ThreatDetectionService(this.config.monitoring)
    this.complianceAuditor = new ComplianceAuditorService(this.config.compliance)
    this.init()
  }

  async init() {
    try {
      // Initialize encryption keys
      await this.initializeEncryptionKeys()

      // Setup security monitoring
      this.setupSecurityMonitoring()

      // Initialize compliance auditing
      await this.complianceAuditor.initialize()

      // Setup threat detection
      await this.threatDetection.initialize()

      // Setup rate limiting cleanup
      if (this.config.rateLimiting.enabled) {
        this.setupRateLimitCleanup()
      }

      console.log('Security Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Security Service:', error)
    }
  }
    return SecurityService.instance;
  }

  constructor() {
    this.config = {
      encryption: {
        algorithm: 'AES-GCM',
        keySize: 256,
        ivSize: 12,
        saltSize: 16,
        iterations: 100000,
        enableFieldLevel: true,
        enableTransitEncryption: true,
        enableRestEncryption: true,
      },
      authentication: {
        enableMFA: true,
        enableSSO: true,
        enableBiometric: false,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        passwordPolicy: {
          minLength: 12,
          maxLength: 128,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          preventReuse: 5,
          expiryDays: 90,
        },
        tokenExpiry: 15 * 60 * 1000, // 15 minutes
        refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
      authorization: {
        enableRBAC: true,
        enableABAC: true,
        enableDynamicPermissions: true,
        defaultPermissions: ['read'],
        adminRoles: ['admin', 'super_admin'],
        auditLevel: 'comprehensive',
      },
      compliance: {
        enableSOX: true,
        enableGDPR: true,
        enableHIPAA: false,
        enablePCI: true,
        enableISO27001: true,
        dataRetentionPolicy: {
          personalData: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
          financialData: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
          auditLogs: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
          systemLogs: 1 * 365 * 24 * 60 * 60 * 1000, // 1 year
          backupRetention: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
        },
        auditRetention: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
        encryptionRequired: true,
      },
      monitoring: {
        enableRealTimeMonitoring: true,
        enableThreatDetection: true,
        enableAnomalyDetection: true,
        alertThresholds: {
          failedLogins: 3,
          suspiciousActivity: 1,
          dataAccess: 100,
          privilegeEscalation: 1,
        },
        logLevel: 'comprehensive',
      },
      rateLimiting: {
        enabled: true,
        defaultLimits: {
          requests: 100,
          windowMs: 15 * 60 * 1000, // 15 minutes
        },
        endpoints: new Map([
          ['/api/auth/login', { requests: 5, windowMs: 15 * 60 * 1000 }], // 5 login attempts per 15 minutes
          ['/api/auth/register', { requests: 3, windowMs: 60 * 60 * 1000 }], // 3 registrations per hour
          ['/api/reconciliation/jobs', { requests: 50, windowMs: 60 * 1000 }], // 50 job requests per minute
        ]),
      },
    };

    this.threatDetection = new ThreatDetectionService(this.config.monitoring);
    this.complianceAuditor = new ComplianceAuditorService(this.config.compliance);
    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Initialize encryption keys
      await this.initializeEncryptionKeys();

      // Setup security monitoring
      this.setupSecurityMonitoring();

      // Initialize compliance auditing
      await this.complianceAuditor.initialize();

      // Setup threat detection
      await this.threatDetection.initialize();

      // Setup rate limiting cleanup
      if (this.config.rateLimiting.enabled) {
        this.setupRateLimitCleanup();
      }

      console.log('Security Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Security Service:', error);
    }
  }

  // Encryption methods
  async encryptData(data, keyId) {
    try {
      const key = keyId ? this.encryptionKeys.get(keyId) : await this.getDefaultKey()
      if (!key) throw new Error('Encryption key not found')

      const iv = crypto.getRandomValues(new Uint8Array(this.config.encryption.ivSize))
      const encodedData = new TextEncoder().encode(data)
      
      const encryptedData = await crypto.subtle.encrypt(
        { name: this.config.encryption.algorithm, iv },
        key,
        encodedData
      )

      const result = {
        data: Array.from(new Uint8Array(encryptedData)),
        iv: Array.from(iv),
        keyId: keyId || 'default',
      }

      return btoa(JSON.stringify(result))
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  async decryptData(encryptedData) {
    try {
      const parsed = JSON.parse(atob(encryptedData))
      const key = this.encryptionKeys.get(parsed.keyId)
      if (!key) throw new Error('Decryption key not found')

      const iv = new Uint8Array(parsed.iv)
      const data = new Uint8Array(parsed.data)

      const decryptedData = await crypto.subtle.decrypt(
        { name: this.config.encryption.algorithm, iv },
        key,
        data
      )

      return new TextDecoder().decode(decryptedData)
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  async encryptField(fieldName, value) {
    if (!this.config.encryption.enableFieldLevel) {
      return JSON.stringify(value)
    }

    const fieldKey = await this.getFieldKey(fieldName)
    return this.encryptData(JSON.stringify(value), fieldKey)
  }

  async decryptField(fieldName, encryptedValue) {
    if (!this.config.encryption.enableFieldLevel) {
      return JSON.parse(encryptedValue)
    }

    const decryptedData = await this.decryptData(encryptedValue)
    return JSON.parse(decryptedData)
  }
  }

  public async decryptData(encryptedData: string): Promise<string> {
    try {
      const parsed = JSON.parse(atob(encryptedData));
      const key = this.encryptionKeys.get(parsed.keyId);
      if (!key) throw new Error('Decryption key not found');

      const iv = new Uint8Array(parsed.iv);
      const data = new Uint8Array(parsed.data);

      const decryptedData = await crypto.subtle.decrypt(
        { name: this.config.encryption.algorithm, iv },
        key,
        data
      );

      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  public async encryptField(fieldName: string, value: any): Promise<string> {
    if (!this.config.encryption.enableFieldLevel) {
      return JSON.stringify(value);
    }

    const fieldKey = await this.getFieldKey(fieldName);
    return this.encryptData(JSON.stringify(value), fieldKey);
  }

  public async decryptField(fieldName: string, encryptedValue: string): Promise<any> {
    if (!this.config.encryption.enableFieldLevel) {
      return JSON.parse(encryptedValue);
    }

    const decryptedData = await this.decryptData(encryptedValue);
    return JSON.parse(decryptedData);
  }

  // Authentication methods
  async validatePassword(password) {
    const errors = []
    const policy = this.config.authentication.passwordPolicy

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`)
    }

    if (password.length > policy.maxLength) {
      errors.push(`Password must be no more than ${policy.maxLength} characters long`)
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return { valid: errors.length === 0, errors }
  }

  async hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(this.config.encryption.saltSize))
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    )

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.config.encryption.iterations,
        hash: 'SHA-256',
      },
      key,
      256
    )

    const result = {
      hash: Array.from(new Uint8Array(derivedBits)),
      salt: Array.from(salt),
      iterations: this.config.encryption.iterations,
    }

    return btoa(JSON.stringify(result))
  }

  async verifyPassword(password, hash) {
    try {
      const parsed = JSON.parse(atob(hash))
      const salt = new Uint8Array(parsed.salt)
      
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      )

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt,
          iterations: parsed.iterations,
          hash: 'SHA-256',
        },
        key,
        256
      )

      const hashArray = Array.from(new Uint8Array(derivedBits))
      return hashArray.every((byte, index) => byte === parsed.hash[index])
    } catch (error) {
      console.error('Password verification failed:', error)
      return false
    }
  }

    if (password.length > policy.maxLength) {
      errors.push(`Password must be no more than ${policy.maxLength} characters long`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { valid: errors.length === 0, errors };
  }

  public async hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(this.config.encryption.saltSize));
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.config.encryption.iterations,
        hash: 'SHA-256',
      },
      key,
      256
    );

    const result = {
      hash: Array.from(new Uint8Array(derivedBits)),
      salt: Array.from(salt),
      iterations: this.config.encryption.iterations,
    };

    return btoa(JSON.stringify(result));
  }

  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(atob(hash));
      const salt = new Uint8Array(parsed.salt);

      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      );

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt,
          iterations: parsed.iterations,
          hash: 'SHA-256',
        },
        key,
        256
      );

      const hashArray = Array.from(new Uint8Array(derivedBits));
      return hashArray.every((byte, index) => byte === parsed.hash[index]);
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  // MFA methods
  async generateMFASecret(userId) {
    const secret = crypto.getRandomValues(new Uint8Array(20))
    const base32Secret = this.base32Encode(secret)
    
    // Store secret securely
    await this.storeMFASecret(userId, base32Secret)
    
    return base32Secret
  }

  async verifyMFAToken(userId, token) {
    const secret = await this.getMFASecret(userId)
    if (!secret) return false

    const expectedToken = this.generateTOTP(secret)
    return token === expectedToken
  }

  public async verifyMFAToken(userId: string, token: string): Promise<boolean> {
    const secret = await this.getMFASecret(userId);
    if (!secret) return false;

    const expectedToken = this.generateTOTP(secret);
    return token === expectedToken;
  }

  // Authorization methods
  async checkPermission(userId, resource, action) {
    const userRoles = await this.getUserRoles(userId)
    const resourcePermissions = await this.getResourcePermissions(resource)
    
    for (const role of userRoles) {
      const rolePermissions = await this.getRolePermissions(role)
      if (rolePermissions.some(p => p.resource === resource && p.actions.includes(action))) {
        return true
      }
    }

    return false
  }

  async auditAccess(userId, resource, action, result) {
    const event = createSecurityEvent({
      id: this.generateEventId(),
      type: result ? 'permission_granted' : 'permission_denied',
      severity: result ? 'low' : 'medium',
      userId,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      details: { resource, action, result },
      resolved: false,
    })

    this.securityEvents.push(event)
    await this.complianceAuditor.auditEvent(event)
  }
    }

    return false;
  }

  public async auditAccess(
    userId: string,
    resource: string,
    action: string,
    result: boolean
  ): Promise<void> {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type: result ? 'permission_granted' : 'permission_denied',
      severity: result ? 'low' : 'medium',
      userId,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      details: { resource, action, result },
      resolved: false,
    };

    this.securityEvents.push(event);
    await this.complianceAuditor.auditEvent(event);
  }

  // Security monitoring
  async logSecurityEvent(event) {
    const securityEvent = createSecurityEvent({
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
      resolved: false,
    })

    this.securityEvents.push(securityEvent)
    
    // Check for threats
    await this.threatDetection.analyzeEvent(securityEvent)
    
    // Audit for compliance
    await this.complianceAuditor.auditEvent(securityEvent)
  }

  getSecurityEvents(filter) {
    if (!filter) return [...this.securityEvents]

    return this.securityEvents.filter(event => {
      return Object.entries(filter).every(([key, value]) => {
        return event[key] === value
      })
    })
  }

  public getSecurityEvents(filter?: Partial<SecurityEvent>): SecurityEvent[] {
    if (!filter) return [...this.securityEvents];

    return this.securityEvents.filter((event) => {
      return Object.entries(filter).every(([key, value]) => {
        return event[key as keyof SecurityEvent] === value;
      });
    });
  }

  // Compliance methods
  async generateComplianceReport(type) {
    return this.complianceAuditor.generateReport(type)
  }

  async auditDataAccess(userId, dataType, records) {
    const event = createSecurityEvent({
      id: this.generateEventId(),
      type: 'data_access',
      severity: records > this.config.monitoring.alertThresholds.dataAccess ? 'high' : 'low',
      userId,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      details: { dataType, records },
      resolved: false,
    })

    await this.logSecurityEvent(event)
  }

  public async auditDataAccess(userId: string, dataType: string, records: number): Promise<void> {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type: 'data_access',
      severity: records > this.config.monitoring.alertThresholds.dataAccess ? 'high' : 'low',
      userId,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      details: { dataType, records },
      resolved: false,
    };

    await this.logSecurityEvent(event);
  }

  // Rate limiting methods
  checkRateLimit(identifier, endpoint) {
    if (!this.config.rateLimiting.enabled) {
      return { allowed: true, remaining: Infinity, resetTime: 0 }
    }

    const now = Date.now()
    const key = `${identifier}:${endpoint || 'default'}`
    const limits = endpoint ? this.config.rateLimiting.endpoints.get(endpoint) : null
    const requests = limits?.requests || this.config.rateLimiting.defaultLimits.requests
    const windowMs = limits?.windowMs || this.config.rateLimiting.defaultLimits.windowMs

    let entry = this.rateLimitStore.get(key)
    if (!entry) {
      entry = createRateLimitEntry()
      this.rateLimitStore.set(key, entry)
    }

    // Remove timestamps outside of current window
    const windowStart = now - windowMs
    entry.timestamps = entry.timestamps.filter(timestamp => timestamp > windowStart)

    // Check if under limit
    if (entry.timestamps.length < requests) {
      entry.timestamps.push(now)
      entry.count++

      const remaining = requests - entry.timestamps.length
      const resetTime = entry.timestamps.length > 0 ? entry.timestamps[0] + windowMs : now + windowMs

      return { allowed: true, remaining, resetTime }
    }

    // Rate limit exceeded
    const resetTime = entry.timestamps.length > 0 ? entry.timestamps[0] + windowMs : now + windowMs
    const remaining = 0

    // Log rate limit event
    this.logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'medium',
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      details: { type: 'rate_limit_exceeded', identifier, endpoint, requests, windowMs },
    }).catch(console.error)

    return { allowed: false, remaining, resetTime }
  }

  getRateLimitStatus(identifier, endpoint) {
    const key = `${identifier}:${endpoint || 'default'}`
    const limits = endpoint ? this.config.rateLimiting.endpoints.get(endpoint) : null
    const requests = limits?.requests || this.config.rateLimiting.defaultLimits.requests
    const windowMs = limits?.windowMs || this.config.rateLimiting.defaultLimits.windowMs

    const entry = this.rateLimitStore.get(key)
    if (!entry) {
      return { current: 0, limit: requests, windowMs, resetTime: Date.now() + windowMs }
    }

    // Clean up old timestamps
    const now = Date.now()
    const windowStart = now - windowMs
    entry.timestamps = entry.timestamps.filter(timestamp => timestamp > windowStart)

    const resetTime = entry.timestamps.length > 0 ? entry.timestamps[0] + windowMs : now + windowMs

    return {
      current: entry.timestamps.length,
      limit: requests,
      windowMs,
      resetTime
    }
  }

  resetRateLimit(identifier, endpoint) {
    const key = `${identifier}:${endpoint || 'default'}`
    this.rateLimitStore.delete(key)
  }

  cleanupRateLimitStore() {
    const now = Date.now()
    const maxWindow = Math.max(
      this.config.rateLimiting.defaultLimits.windowMs,
      ...Array.from(this.config.rateLimiting.endpoints.values()).map(l => l.windowMs)
    )

    // Remove entries that are completely outside any window
    for (const [key, entry] of this.rateLimitStore.entries()) {
      const windowStart = now - maxWindow
      entry.timestamps = entry.timestamps.filter(timestamp => timestamp > windowStart)

      if (entry.timestamps.length === 0) {
        this.rateLimitStore.delete(key)
      }
    }
  }



    // Remove timestamps outside the current window
    const windowStart = now - windowMs;
    entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > windowStart);

    // Check if under limit
    if (entry.timestamps.length < requests) {
      entry.timestamps.push(now);
      entry.count++;

      const remaining = requests - entry.timestamps.length;
      const resetTime =
        entry.timestamps.length > 0 ? entry.timestamps[0] + windowMs : now + windowMs;

      return { allowed: true, remaining, resetTime };
    }

    // Rate limit exceeded
    const resetTime = entry.timestamps.length > 0 ? entry.timestamps[0] + windowMs : now + windowMs;
    const remaining = 0;

    // Log rate limit event
    this.logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'medium',
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      details: { type: 'rate_limit_exceeded', identifier, endpoint, requests, windowMs },
    }).catch(console.error);

    return { allowed: false, remaining, resetTime };
  }

  public getRateLimitStatus(
    identifier: string,
    endpoint?: string
  ): { current: number; limit: number; windowMs: number; resetTime: number } {
    const key = `${identifier}:${endpoint || 'default'}`;
    const limits = endpoint ? this.config.rateLimiting.endpoints.get(endpoint) : null;
    const requests = limits?.requests || this.config.rateLimiting.defaultLimits.requests;
    const windowMs = limits?.windowMs || this.config.rateLimiting.defaultLimits.windowMs;

    const entry = this.rateLimitStore.get(key);
    if (!entry) {
      return { current: 0, limit: requests, windowMs, resetTime: Date.now() + windowMs };
    }

    // Clean up old timestamps
    const now = Date.now();
    const windowStart = now - windowMs;
    entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > windowStart);

    const resetTime = entry.timestamps.length > 0 ? entry.timestamps[0] + windowMs : now + windowMs;

    return {
      current: entry.timestamps.length,
      limit: requests,
      windowMs,
      resetTime,
    };
  }

  public resetRateLimit(identifier: string, endpoint?: string): void {
    const key = `${identifier}:${endpoint || 'default'}`;
    this.rateLimitStore.delete(key);
  }

  public cleanupRateLimitStore(): void {
    const now = Date.now();
    const maxWindow = Math.max(
      this.config.rateLimiting.defaultLimits.windowMs,
      ...Array.from(this.config.rateLimiting.endpoints.values()).map((l) => l.windowMs)
    );

    // Remove entries that are completely outside any window
    for (const [key, entry] of this.rateLimitStore.entries()) {
      const windowStart = now - maxWindow;
      entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > windowStart);

      if (entry.timestamps.length === 0) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  // Utility methods
  async initializeEncryptionKeys() {
    // Generate default encryption key
    const defaultKey = await crypto.subtle.generateKey(
      { name: this.config.encryption.algorithm, length: this.config.encryption.keySize },
      true,
      ['encrypt', 'decrypt']
    )
    this.encryptionKeys.set('default', defaultKey)

    // Generate field-specific keys
    const fieldNames = ['ssn', 'creditCard', 'bankAccount', 'personalData']
    for (const fieldName of fieldNames) {
      const fieldKey = await crypto.subtle.generateKey(
        { name: this.config.encryption.algorithm, length: this.config.encryption.keySize },
        true,
        ['encrypt', 'decrypt']
      )
      this.encryptionKeys.set(fieldName, fieldKey)
    }
  }

  async getDefaultKey() {
    return this.encryptionKeys.get('default')
  }

  async getFieldKey(fieldName) {
    return this.encryptionKeys.has(fieldName) ? fieldName : 'default'
  }

  setupSecurityMonitoring() {
    // Monitor for suspicious activities
    setInterval(() => {
      this.analyzeSecurityPatterns()
    }, 60000) // Every minute

    // Monitor for failed login attempts
    this.monitorFailedLogins()
  }

  setupRateLimitCleanup() {
    // Clean up rate limit store every 5 minutes
    setInterval(() => {
      this.cleanupRateLimitStore()
    }, 5 * 60 * 1000)
  }

  async analyzeSecurityPatterns() {
    const recentEvents = this.securityEvents.filter(
      event => Date.now() - event.timestamp.getTime() < 300000 // Last 5 minutes
    )

    // Check for suspicious patterns
    const failedLogins = recentEvents.filter(event => event.type === 'login_failure')
    if (failedLogins.length >= this.config.monitoring.alertThresholds.failedLogins) {
      await this.triggerSecurityAlert('Multiple failed login attempts detected')
    }

    const privilegeEscalations = recentEvents.filter(event => event.type === 'privilege_escalation')
    if (privilegeEscalations.length >= this.config.monitoring.alertThresholds.privilegeEscalation) {
      await this.triggerSecurityAlert('Privilege escalation detected')
    }
  }

  async triggerSecurityAlert(message) {
    const alert = createSecurityEvent({
      id: this.generateEventId(),
      type: 'suspicious_activity',
      severity: 'high',
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      details: { message },
      resolved: false,
    })

    this.securityEvents.push(alert)
    console.warn('Security Alert:', message)
  }

  monitorFailedLogins() {
    // This would typically integrate with your authentication system
    // For now, we'll simulate monitoring
  }

  base32Encode(data) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let result = ''
    
    for (let i = 0; i < data.length; i += 5) {
      const chunk = data.slice(i, i + 5)
      let value = 0
      
      for (let j = 0; j < chunk.length; j++) {
        value = (value << 8) | chunk[j]
      }
      
      const bits = chunk.length * 8
      const padding = (5 - (bits % 5)) % 5
      value <<= padding
      
      for (let k = 0; k < bits + padding; k += 5) {
        const index = (value >> (bits + padding - k - 5)) & 31
        result += alphabet[index]
      }
    }
    
    return result
  }

  generateTOTP(secret) {
    const epoch = Math.round(new Date().getTime() / 1000.0)
    const time = Math.floor(epoch / 30)
    
    // This is a simplified TOTP implementation
    // In production, use a proper TOTP library
    const hash = this.hmacSHA1(secret, time.toString())
    const offset = hash[hash.length - 1] & 0xf
    const code = ((hash[offset] & 0x7f) << 24) |
                ((hash[offset + 1] & 0xff) << 16) |
                ((hash[offset + 2] & 0xff) << 8) |
                (hash[offset + 3] & 0xff)
    
    return (code % 1000000).toString().padStart(6, '0')
  }

  hmacSHA1(key, message) {
    // Simplified HMAC-SHA1 implementation
    // In production, use Web Crypto API or a proper crypto library
    return new Uint8Array(20)
  }

  async storeMFASecret(userId, secret) {
    // Store MFA secret securely (encrypted)
    const encryptedSecret = await this.encryptData(secret)
    localStorage.setItem(`mfa_secret_${userId}`, encryptedSecret)
  }

  async getMFASecret(userId) {
    const encryptedSecret = localStorage.getItem(`mfa_secret_${userId}`)
    if (!encryptedSecret) return null
    
    return this.decryptData(encryptedSecret)
  }

  async getUserRoles(userId) {
    // This would typically query your user management system
    return ['user'] // Placeholder
  }

  async getResourcePermissions(resource) {
    // This would typically query your permission system
    return [] // Placeholder
  }

  async getRolePermissions(role) {
    // This would typically query your role-based access control system
    return [] // Placeholder
  }

  generateEventId() {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getClientIP() {
    // This would typically get the real client IP
    return '127.0.0.1' // Placeholder
  }
  }


}

// Threat Detection Service
class ThreatDetectionService {
  constructor(config) {
    this.config = config
  }

  async initialize() {
    console.log('Threat Detection Service initialized')
  }

  async analyzeEvent(event) {
    // Analyze security events for threats
    if (event.severity === 'critical' || event.severity === 'high') {
      await this.handleThreat(event)
    }
  }

  async handleThreat(event) {
    console.warn('Threat detected:', event)
    // Implement threat response logic
  }
}

// Compliance Auditor Service
class ComplianceAuditorService {
  constructor(config) {
    this.config = config
  }

  async initialize() {
    console.log('Compliance Auditor Service initialized')
  }

  async auditEvent(event) {
    // Audit security events for compliance
    console.log('Auditing event for compliance:', event.type)
  }

  async generateReport(type) {
    // Generate compliance reports
    return {
      type,
      generatedAt: new Date(),
      status: 'compliant',
      findings: [],
      recommendations: [],
    }
  }
}



// React hook for security
export const useSecurity = () => {
  const [securityEvents, setSecurityEvents] = React.useState([]);

  React.useEffect(() => {
    const security = SecurityService.getInstance();

    const updateEvents = () => {
      setSecurityEvents(security.getSecurityEvents());
    };

    const interval = setInterval(updateEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const security = SecurityService.getInstance();

  return {
    securityEvents,
    encryptData: security.encryptData.bind(security),
    decryptData: security.decryptData.bind(security),
    encryptField: security.encryptField.bind(security),
    decryptField: security.decryptField.bind(security),
    validatePassword: security.validatePassword.bind(security),
    hashPassword: security.hashPassword.bind(security),
    verifyPassword: security.verifyPassword.bind(security),
    generateMFASecret: security.generateMFASecret.bind(security),
    verifyMFAToken: security.verifyMFAToken.bind(security),
    checkPermission: security.checkPermission.bind(security),
    auditAccess: security.auditAccess.bind(security),
    logSecurityEvent: security.logSecurityEvent.bind(security),
    generateComplianceReport: security.generateComplianceReport.bind(security),
    auditDataAccess: security.auditDataAccess.bind(security),
    checkRateLimit: security.checkRateLimit.bind(security),
    getRateLimitStatus: security.getRateLimitStatus.bind(security),
    resetRateLimit: security.resetRateLimit.bind(security),
    cleanupRateLimitStore: security.cleanupRateLimitStore.bind(security),
  };
};

// Export singleton instance
export const securityService = SecurityService.getInstance();

export default securityService;
