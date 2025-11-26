// Security Monitoring Components
import React, { useState, useEffect } from 'react';
import { securityService, SecurityEvent, SecuritySeverity, SecurityEventType } from '../../services/security';
import { Shield } from 'lucide-react'
import { AlertTriangle } from 'lucide-react'
import { Lock } from 'lucide-react'
import { Eye } from 'lucide-react'
import { EyeOff } from 'lucide-react'
import { CheckCircle } from 'lucide-react'
import { XCircle } from 'lucide-react';

// Security Dashboard Component
export const SecurityDashboard: React.FC = () => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [cspViolations, setCspViolations] = useState<string[]>([]);
  interface SessionInfo {
    id?: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt?: Date;
    expiresAt?: Date;
    [key: string]: unknown;
  }
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isMonitoring, _setIsMonitoring] = useState(false);

  useEffect(() => {
    const handleSecurityEvent = (event: SecurityEvent) => {
      setSecurityEvents((prev) => [event, ...prev.slice(0, 99)]); // Keep last 100 events
    };

    securityService.on('security_event', handleSecurityEvent);

    // Load initial data
    setSecurityEvents(securityService.getSecurityEvents());
    setCspViolations(securityService.getCSPViolations());
    setSessionInfo(securityService.getSessionInfo());

    return () => {
      securityService.off('security_event', handleSecurityEvent);
    };
  }, []);

  const getSeverityColor = (severity: SecuritySeverity) => {
    switch (severity) {
      case SecuritySeverity.LOW:
        return 'text-green-500 bg-green-100';
      case SecuritySeverity.MEDIUM:
        return 'text-yellow-500 bg-yellow-100';
      case SecuritySeverity.HIGH:
        return 'text-orange-500 bg-orange-100';
      case SecuritySeverity.CRITICAL:
        return 'text-red-500 bg-red-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: SecuritySeverity) => {
    switch (severity) {
      case SecuritySeverity.LOW:
        return <CheckCircle className="w-4 h-4" />;
      case SecuritySeverity.MEDIUM:
        return <AlertTriangle className="w-4 h-4" />;
      case SecuritySeverity.HIGH:
        return <AlertTriangle className="w-4 h-4" />;
      case SecuritySeverity.CRITICAL:
        return <XCircle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getEventTypeLabel = (type: SecurityEventType) => {
    switch (type) {
      case SecurityEventType.XSS_ATTEMPT:
        return 'XSS Attempt';
      case SecurityEventType.CSRF_VIOLATION:
        return 'CSRF Violation';
      case SecurityEventType.UNAUTHORIZED_ACCESS:
        return 'Unauthorized Access';
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        return 'Suspicious Activity';
      case SecurityEventType.PASSWORD_WEAK:
        return 'Weak Password';
      case SecurityEventType.SESSION_TIMEOUT:
        return 'Session Timeout';
      case SecurityEventType.INVALID_INPUT:
        return 'Invalid Input';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Security Dashboard
        </h3>
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`}
          />
          <span className="text-sm text-gray-600">{isMonitoring ? 'Monitoring' : 'Stopped'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Security Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Security Status</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">CSP Protection</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">XSS Protection</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">CSRF Protection</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Input Sanitization</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          </div>
        </div>

        {/* Session Info */}
        {sessionInfo && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Session Info</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Duration</span>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round(Number(sessionInfo.duration) / 1000 / 60)} min
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Activity</span>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round((Date.now() - Number(sessionInfo.lastActivity)) / 1000 / 60)} min ago
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* CSP Violations */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">CSP Violations</h4>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{cspViolations.length}</div>
            <div className="text-sm text-gray-600">Total violations</div>
          </div>
        </div>
      </div>

      {/* Security Events */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Recent Security Events</h4>
        {securityEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No security events detected</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {securityEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${getSeverityColor(event.severity)}`}>
                    {getSeverityIcon(event.severity)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {getEventTypeLabel(event.type)}
                    </div>
                    <div className="text-sm text-gray-600">{event.description}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Password Strength Indicator Component
export const PasswordStrengthIndicator: React.FC<{
  password: string;
  onStrengthChange?: (strength: number) => void;
}> = ({ password, onStrengthChange }) => {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);

  useEffect(() => {
    const result = securityService.validatePasswordStrength(password);
    setStrength(result.score);
    setFeedback(result.feedback);
    onStrengthChange?.(result.score);
  }, [password, onStrengthChange]);

  const getStrengthColor = (score: number) => {
    if (score < 2) return 'bg-red-500';
    if (score < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = (score: number) => {
    if (score < 2) return 'Weak';
    if (score < 4) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Password Strength</span>
        <span
          className={`text-sm font-medium ${
            strength < 2 ? 'text-red-500' : strength < 4 ? 'text-yellow-500' : 'text-green-500'
          }`}
        >
          {getStrengthLabel(strength)}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strength)}`}
          style={{ width: `${(strength / 5) * 100}%` }}
        />
      </div>

      {feedback.length > 0 && (
        <div className="text-xs text-gray-600">
          <ul className="list-disc list-inside space-y-1">
            {feedback.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Secure Input Component
export const SecureInput: React.FC<{
  type: 'text' | 'password' | 'email';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showStrength?: boolean;
}> = ({ type, value, onChange, placeholder, className, showStrength }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSecure, setIsSecure] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const sanitized = securityService.sanitizeInput(inputValue);

    if (sanitized !== inputValue) {
      setIsSecure(false);
      setTimeout(() => setIsSecure(true), 2000);
    }

    onChange(sanitized);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type={type === 'password' && showPassword ? 'text' : type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`${className} ${!isSecure ? 'border-red-500' : ''}`}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {!isSecure && (
        <div className="text-xs text-red-600 flex items-center">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Input sanitized for security
        </div>
      )}

      {showStrength && type === 'password' && <PasswordStrengthIndicator password={value} />}
    </div>
  );
};

// File Upload Security Component
export const SecureFileUpload: React.FC<{
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}> = ({ onFileSelect, accept, maxSize = 10 * 1024 * 1024, className }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): { valid: boolean; reason?: string } => {
    if (file.size > maxSize) {
      return {
        valid: false,
        reason: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
      };
    }

    const validation = securityService.validateFileUpload(file);
    return validation;
  };

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);
    if (validation.valid) {
      setError(null);
      onFileSelect(file);
    } else {
      setError(validation.reason || 'Invalid file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : error
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-gray-50'
        } ${className}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Lock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 mb-2">Drop files here or click to select</p>
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Choose File
        </label>
      </div>

      {error && (
        <div className="text-xs text-red-600 flex items-center">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {error}
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>Allowed formats: CSV, JSON, Excel</p>
        <p>Maximum size: {Math.round(maxSize / 1024 / 1024)}MB</p>
      </div>
    </div>
  );
};

// Security Alert Component
export const SecurityAlert: React.FC<{
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  onClose?: () => void;
}> = ({ type, title, message, onClose }) => {
  const getAlertColor = () => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIcon = () => {
    switch (type) {
      case 'info':
        return <Shield className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getAlertColor()}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">{getAlertIcon()}</div>
        <div className="flex-1">
          <h4 className="text-sm font-medium">{title}</h4>
          <p className="text-sm mt-1">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
