// Input Validation and Sanitization Module
import { SecurityEvent, SecurityEventType, SecuritySeverity } from './types';

export class ValidationManager {
  private logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>;
  private generateId: () => string;

  constructor(
    logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>,
    generateId: () => string
  ) {
    this.logSecurityEvent = logSecurityEvent;
    this.generateId = generateId;
  }

  setupInputSanitization(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'text' || target.type === 'textarea') {
        const sanitized = this.sanitizeInput(target.value);
        if (sanitized !== target.value) {
          target.value = sanitized;
          this.logSecurityEvent({
            type: SecurityEventType.INVALID_INPUT,
            severity: SecuritySeverity.LOW,
            description: 'Input sanitized',
            metadata: { field: target.name || '', originalValue: target.value },
          });
        }
      }
    });
  }

  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .replace(/script/gi, '')
      .replace(/iframe/gi, '')
      .replace(/object/gi, '')
      .replace(/embed/gi, '')
      .replace(/link/gi, '')
      .replace(/meta/gi, '')
      .trim();
  }

  setupPasswordValidation(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'password') {
        const strength = this.validatePasswordStrength(target.value);
        if (strength.score < 3) {
          this.logSecurityEvent({
            type: SecurityEventType.PASSWORD_WEAK,
            severity: SecuritySeverity.LOW,
            description: 'Weak password detected',
            metadata: { score: strength.score, feedback: strength.feedback },
          });
        }
      }
    });
  }

  validatePasswordStrength(password: string): { score: number; feedback: string[] } {
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

  validateFileUpload(file: File): { valid: boolean; reason?: string } {
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, reason: 'File size exceeds 10MB limit' };
    }

    const allowedTypes = [
      'text/csv',
      'application/json',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, reason: 'File type not allowed' };
    }

    const suspiciousPatterns = /[<>:"|?*]/;
    if (suspiciousPatterns.test(file.name)) {
      return { valid: false, reason: 'File name contains invalid characters' };
    }

    return { valid: true };
  }

  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
}
