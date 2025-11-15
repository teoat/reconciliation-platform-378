// Security Service Types and Interfaces
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

export interface AlertRule {
  id: string;
  condition: (events: SecurityEvent[]) => boolean;
  severity: SecuritySeverity;
  message: string;
  cooldownMinutes: number;
  lastTriggered?: number;
}

