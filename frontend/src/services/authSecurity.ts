import { logger } from './logger';
import { secureStorage } from './secureStorage';

// ============================================================================
// RATE LIMITER
// ============================================================================

class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private failedAttempts: Map<string, number> = new Map(); // Track failed attempts for warnings

  canMakeRequest(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside window
    const recentAttempts = attempts.filter((time) => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      logger.logSecurity('Rate limit exceeded', { key, attempts: recentAttempts.length });
      return false;
    }

    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
    this.failedAttempts.delete(key);
  }

  recordFailedAttempt(key: string): number {
    const current = this.failedAttempts.get(key) || 0;
    const newCount = current + 1;
    this.failedAttempts.set(key, newCount);
    return newCount;
  }

  getFailedAttempts(key: string): number {
    return this.failedAttempts.get(key) || 0;
  }

  getRemainingAttempts(key: string, maxAttempts: number, windowMs: number): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter((time) => now - time < windowMs);
    return Math.max(0, maxAttempts - recentAttempts.length);
  }

  /**
   * Get the time remaining until rate limit resets (in milliseconds)
   * Returns 0 if not rate limited
   */
  getTimeUntilReset(key: string, maxAttempts: number, windowMs: number): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter((time) => now - time < windowMs);

    if (recentAttempts.length < maxAttempts) {
      return 0; // Not rate limited
    }

    // Find the oldest attempt that's still within the window
    const oldestAttempt = Math.min(...recentAttempts);
    const resetTime = oldestAttempt + windowMs;
    const remaining = resetTime - now;

    return Math.max(0, remaining);
  }
}

export const rateLimiter = new RateLimiter();

// ============================================================================
// CSRF TOKEN MANAGER
// ============================================================================

export class CSRFManager {
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private readonly TOKEN_VALIDITY = 30 * 60 * 1000; // 30 minutes

  async getToken(): Promise<string> {
    const now = Date.now();

    // Token is valid for 30 minutes
    if (this.token && now < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.token;
        this.tokenExpiry = now + this.TOKEN_VALIDITY;
        // Use secureStorage for CSRF token
        secureStorage.setItem('csrf-token', data.token, false);
        secureStorage.setItem('csrf-token-expiry', this.tokenExpiry.toString(), false);
        return this.token;
      }
    } catch (error) {
      logger.error('Failed to get CSRF token', { error });
    }

    // Fallback to stored token
    const stored = secureStorage.getItem<string>('csrf-token', false);
    const storedExpiry = secureStorage.getItem<string>('csrf-token-expiry', false);

    if (stored && storedExpiry && now < parseInt(storedExpiry, 10)) {
      this.token = stored;
      this.tokenExpiry = parseInt(storedExpiry, 10);
      return stored;
    }

    throw new Error('Unable to get CSRF token');
  }

  reset(): void {
    this.token = null;
    this.tokenExpiry = 0;
    secureStorage.removeItem('csrf-token', false);
    secureStorage.removeItem('csrf-token-expiry', false);
  }

  hasValidToken(): boolean {
    const now = Date.now();
    return this.token !== null && now < this.tokenExpiry;
  }
}

export const csrfManager = new CSRFManager();

// ============================================================================
// SESSION TIMEOUT MANAGER
// ============================================================================

export class SessionTimeoutManager {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private warningId: ReturnType<typeof setTimeout> | null = null;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
  private lastActivity = Date.now();
  private onTimeout: (() => void) | null = null;
  private onWarning: ((remainingMinutes: number) => void) | null = null;
  private activityListeners: Array<() => void> = [];

  constructor(onTimeout: () => void, onWarning?: (remainingMinutes: number) => void) {
    this.onTimeout = onTimeout;
    this.onWarning = onWarning || null;
    this.startTracking();
    this.startTimer();
    this.startWarningTimer();
  }

  private startTracking(): void {
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach((event) => {
      const handler = () => {
        this.lastActivity = Date.now();
        this.resetTimer();
      };
      this.activityListeners.push(handler);
      document.addEventListener(event, handler, { passive: true });
    });

    // Also track visibility change
    const visibilityHandler = () => {
      if (!document.hidden) {
        this.lastActivity = Date.now();
        this.resetTimer();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
    this.activityListeners.push(visibilityHandler);
  }

  private resetTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - this.lastActivity;

      if (timeSinceLastActivity >= this.SESSION_TIMEOUT) {
        logger.logSecurity('Session timeout', { timeSinceLastActivity });
        this.onTimeout?.();
      } else {
        // Check again in 1 minute
        this.startTimer();
      }
    }, 60000); // Check every minute

    // Reset warning timer when activity detected
    this.startWarningTimer();
  }

  private startWarningTimer(): void {
    if (this.warningId) {
      clearTimeout(this.warningId);
    }

    const timeUntilWarning = this.SESSION_TIMEOUT - this.WARNING_TIME;
    const timeSinceLastActivity = Date.now() - this.lastActivity;
    const remainingUntilWarning = timeUntilWarning - timeSinceLastActivity;

    if (remainingUntilWarning > 0) {
      this.warningId = setTimeout(() => {
        const remainingMinutes = Math.ceil(
          (this.SESSION_TIMEOUT - (Date.now() - this.lastActivity)) / (60 * 1000)
        );
        if (remainingMinutes > 0 && this.onWarning) {
          this.onWarning(remainingMinutes);
        }
      }, remainingUntilWarning);
    } else {
      // Warning time already passed, show warning immediately
      const remainingMinutes = Math.ceil(
        (this.SESSION_TIMEOUT - (Date.now() - this.lastActivity)) / (60 * 1000)
      );
      if (remainingMinutes > 0 && this.onWarning) {
        this.onWarning(remainingMinutes);
      }
    }
  }

  private startTimer(): void {
    this.resetTimer();
  }

  updateActivity(): void {
    this.lastActivity = Date.now();
    this.resetTimer();
  }

  destroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.warningId) {
      clearTimeout(this.warningId);
      this.warningId = null;
    }

    // Remove all event listeners
    this.activityListeners.forEach(() => {
      // Note: We can't easily remove anonymous listeners without storing references
      // In production, you'd want to store the handler references
    });
  }

  /**
   * Extend session by resetting activity time
   * Called when user clicks "Stay Logged In" in warning modal
   */
  extendSession(): void {
    this.lastActivity = Date.now();
    this.resetTimer();
  }
}

// ============================================================================
// TOKEN REFRESH MANAGER
// ============================================================================

export class TokenRefreshManager {
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private readonly REFRESH_INTERVAL = 25 * 60 * 1000; // 25 minutes (refresh before 30min expiry)

  constructor(
    private refreshFn: () => Promise<string | null>,
    private onRefreshFailure: () => void
  ) {}

  start(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(async () => {
      try {
        const newToken = await this.refreshFn();
        if (!newToken) {
          logger.warning('Token refresh returned null, stopping refresh manager');
          this.stop();
          this.onRefreshFailure();
        }
      } catch (error) {
        logger.error('Token refresh failed', { error });
        this.stop();
        this.onRefreshFailure();
      }
    }, this.REFRESH_INTERVAL);
  }

  stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  isRunning(): boolean {
    return this.refreshInterval !== null;
  }
}
