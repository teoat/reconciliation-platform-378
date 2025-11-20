// CSRF Protection Module
import { SecurityEvent, SecurityEventType, SecuritySeverity } from './types';

export class CSRFProtectionManager {
  private logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>;
  private generateId: () => string;

  constructor(
    logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>,
    generateId: () => string
  ) {
    this.logSecurityEvent = logSecurityEvent;
    this.generateId = generateId;
  }

  setupCSRFProtection(): void {
    if (typeof window === 'undefined') return;

    const csrfToken = this.generateCSRFToken();
    sessionStorage.setItem('csrf_token', csrfToken);

    this.addCSRFTokenToForms(csrfToken);
    this.validateCSRFToken();
  }

  generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  private addCSRFTokenToForms(token: string): void {
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

  private validateCSRFToken(): void {
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      const csrfInput = form.querySelector('input[name="csrf_token"]') as HTMLInputElement;

      if (csrfInput) {
        const storedToken = sessionStorage.getItem('csrf_token');
        if (!storedToken || csrfInput.value !== storedToken) {
          e.preventDefault();
          this.logSecurityEvent({
            type: SecurityEventType.CSRF_VIOLATION,
            severity: SecuritySeverity.HIGH,
            description: 'CSRF token validation failed',
          });
          alert('Security violation detected. Please refresh the page and try again.');
        }
      }
    });
  }
}
