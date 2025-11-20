// XSS Protection Module
import { SecurityEvent, SecurityEventType, SecuritySeverity } from './types';
import { logger } from '../logger';

export class XSSProtectionManager {
  private logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>;
  private generateId: () => string;
  private sanitizeInput: (input: string) => string;

  constructor(
    logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>,
    generateId: () => string,
    sanitizeInput: (input: string) => string
  ) {
    this.logSecurityEvent = logSecurityEvent;
    this.generateId = generateId;
    this.sanitizeInput = sanitizeInput;
  }

  setupXSSProtection(): void {
    if (typeof window === 'undefined') return;

    this.interceptFormSubmissions();
    this.interceptInnerHTML();
    this.interceptEval();
  }

  private interceptFormSubmissions(): void {
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      const inputs = form.querySelectorAll('input, textarea, select');

      inputs.forEach((input: Element) => {
        const htmlInput = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if (htmlInput.value) {
          const sanitized = this.sanitizeInputFn(htmlInput.value);
          if (sanitized !== htmlInput.value) {
            this.logSecurityEvent({
              type: SecurityEventType.XSS_ATTEMPT,
              severity: SecuritySeverity.HIGH,
              description: 'Potential XSS attempt detected in form submission',
              metadata: { field: input.getAttribute('name') || '', originalValue: htmlInput.value },
            });
            htmlInput.value = sanitized;
          }
        }
      });
    });
  }

  private interceptInnerHTML(): void {
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (originalInnerHTML) {
      const self = this;
      Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function (value: string) {
          const sanitized = self.sanitizeInputFn(value);
          if (sanitized !== value) {
            self.logSecurityEvent({
              type: SecurityEventType.XSS_ATTEMPT,
              severity: SecuritySeverity.HIGH,
              description: 'Potential XSS attempt detected in innerHTML',
              metadata: { originalValue: value },
            });
          }
          originalInnerHTML.set?.call(this, sanitized);
        },
        get: originalInnerHTML.get,
      });
    }
  }

  private interceptEval(): void {
    const originalEval = window.eval;
    window.eval = (code: string) => {
      this.logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecuritySeverity.CRITICAL,
        description: 'eval() usage detected',
        metadata: { code },
      });
      return originalEval(code);
    };
  }
}
