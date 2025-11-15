// Session Monitoring Module
import { SecurityEvent, SecurityEventType, SecuritySeverity } from './types';

export class SessionManager {
  private sessionStartTime: number;
  private lastActivity: number;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private maxSessionDuration: number;
  private logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>;
  private generateId: () => string;
  private logoutCallback: () => void;

  constructor(
    sessionStartTime: number,
    maxSessionDuration: number,
    logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>,
    generateId: () => string,
    logoutCallback: () => void
  ) {
    this.sessionStartTime = sessionStartTime;
    this.lastActivity = Date.now();
    this.maxSessionDuration = maxSessionDuration;
    this.logSecurityEvent = logSecurityEvent;
    this.generateId = generateId;
    this.logoutCallback = logoutCallback;
  }

  setupSessionMonitoring(): void {
    this.startSessionTimer();
  }

  private startSessionTimer(): void {
    const checkSession = () => {
      const now = Date.now();
      const sessionDuration = now - this.sessionStartTime;
      const timeSinceActivity = now - this.lastActivity;

      if (sessionDuration > this.maxSessionDuration) {
        this.logSecurityEvent({
          type: SecurityEventType.SESSION_TIMEOUT,
          severity: SecuritySeverity.MEDIUM,
          description: 'Session expired due to maximum duration',
        });
        this.logoutCallback();
      } else if (timeSinceActivity > 30 * 60 * 1000) {
        this.logSecurityEvent({
          type: SecurityEventType.SESSION_TIMEOUT,
          severity: SecuritySeverity.MEDIUM,
          description: 'Session expired due to inactivity',
        });
        this.logoutCallback();
      }
    };

    this.inactivityTimer = setInterval(checkSession, 60000) as unknown as NodeJS.Timeout;
  }

  updateActivity(): void {
    this.lastActivity = Date.now();
  }

  getSessionInfo(): { startTime: number; lastActivity: number; duration: number } {
    return {
      startTime: this.sessionStartTime,
      lastActivity: this.lastActivity,
      duration: Date.now() - this.sessionStartTime,
    };
  }

  destroy(): void {
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }
}

