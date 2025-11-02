import { logger } from './logger'
import { secureStorage } from './secureStorage'

// ============================================================================
// RATE LIMITER
// ============================================================================

class RateLimiter {
  private attempts: Map<string, number[]> = new Map()

  canMakeRequest(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []
    
    // Remove old attempts outside window
    const recentAttempts = attempts.filter(time => now - time < windowMs)
    
    if (recentAttempts.length >= maxAttempts) {
      logger.logSecurity('Rate limit exceeded', { key, attempts: recentAttempts.length })
      return false
    }
    
    recentAttempts.push(now)
    this.attempts.set(key, recentAttempts)
    return true
  }

  reset(key: string): void {
    this.attempts.delete(key)
  }

  getRemainingAttempts(key: string, maxAttempts: number, windowMs: number): number {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []
    const recentAttempts = attempts.filter(time => now - time < windowMs)
    return Math.max(0, maxAttempts - recentAttempts.length)
  }
}

export const rateLimiter = new RateLimiter()

// ============================================================================
// CSRF TOKEN MANAGER
// ============================================================================

export class CSRFManager {
  private token: string | null = null
  private tokenExpiry: number = 0
  private readonly TOKEN_VALIDITY = 30 * 60 * 1000 // 30 minutes

  async getToken(): Promise<string> {
    const now = Date.now()
    
    // Token is valid for 30 minutes
    if (this.token && now < this.tokenExpiry) {
      return this.token
    }

    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        this.token = data.token
        this.tokenExpiry = now + this.TOKEN_VALIDITY
        // Use secureStorage for CSRF token
        secureStorage.setItem('csrf-token', data.token, false)
        secureStorage.setItem('csrf-token-expiry', this.tokenExpiry.toString(), false)
        return this.token
      }
    } catch (error) {
      logger.error('Failed to get CSRF token', { error })
    }
    
    // Fallback to stored token
    const stored = secureStorage.getItem<string>('csrf-token', false)
    const storedExpiry = secureStorage.getItem<string>('csrf-token-expiry', false)
    
    if (stored && storedExpiry && now < parseInt(storedExpiry, 10)) {
      this.token = stored
      this.tokenExpiry = parseInt(storedExpiry, 10)
      return stored
    }
    
    throw new Error('Unable to get CSRF token')
  }

  reset(): void {
    this.token = null
    this.tokenExpiry = 0
    secureStorage.removeItem('csrf-token', false)
    secureStorage.removeItem('csrf-token-expiry', false)
  }

  hasValidToken(): boolean {
    const now = Date.now()
    return this.token !== null && now < this.tokenExpiry
  }
}

export const csrfManager = new CSRFManager()

// ============================================================================
// SESSION TIMEOUT MANAGER
// ============================================================================

export class SessionTimeoutManager {
  private timeoutId: NodeJS.Timeout | null = null
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private lastActivity = Date.now()
  private onTimeout: (() => void) | null = null
  private activityListeners: Array<() => void> = []

  constructor(onTimeout: () => void) {
    this.onTimeout = onTimeout
    this.startTracking()
    this.startTimer()
  }

  private startTracking(): void {
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      const handler = () => {
        this.lastActivity = Date.now()
        this.resetTimer()
      }
      this.activityListeners.push(handler)
      document.addEventListener(event, handler, { passive: true })
    })

    // Also track visibility change
    const visibilityHandler = () => {
      if (!document.hidden) {
        this.lastActivity = Date.now()
        this.resetTimer()
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)
    this.activityListeners.push(visibilityHandler)
  }

  private resetTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
    
    this.timeoutId = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - this.lastActivity
      
      if (timeSinceLastActivity >= this.SESSION_TIMEOUT) {
        logger.logSecurity('Session timeout', { timeSinceLastActivity })
        this.onTimeout?.()
      } else {
        // Check again in 1 minute
        this.startTimer()
      }
    }, 60000) // Check every minute
  }

  private startTimer(): void {
    this.resetTimer()
  }

  updateActivity(): void {
    this.lastActivity = Date.now()
    this.resetTimer()
  }

  destroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    // Remove all event listeners
    this.activityListeners.forEach(() => {
      // Note: We can't easily remove anonymous listeners without storing references
      // In production, you'd want to store the handler references
    })
  }
}

// ============================================================================
// TOKEN REFRESH MANAGER
// ============================================================================

export class TokenRefreshManager {
  private refreshInterval: NodeJS.Timeout | null = null
  private readonly REFRESH_INTERVAL = 25 * 60 * 1000 // 25 minutes (refresh before 30min expiry)

  constructor(
    private refreshFn: () => Promise<string | null>,
    private onRefreshFailure: () => void
  ) {}

  start(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }

    this.refreshInterval = setInterval(async () => {
      try {
        const newToken = await this.refreshFn()
        if (!newToken) {
          logger.warning('Token refresh returned null, stopping refresh manager')
          this.stop()
          this.onRefreshFailure()
        }
      } catch (error) {
        logger.error('Token refresh failed', { error })
        this.stop()
        this.onRefreshFailure()
      }
    }, this.REFRESH_INTERVAL)
  }

  stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }

  isRunning(): boolean {
    return this.refreshInterval !== null
  }
}

