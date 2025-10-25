// ============================================================================
// FRONTEND CONFIGURATION
// ============================================================================

export const config = {
  // Backend API Configuration
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
  
  // Frontend Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Reconciliation Platform',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Development Configuration
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
  
  // Feature Flags
  FEATURES: {
    REAL_TIME_COLLABORATION: true,
    ADVANCED_ANALYTICS: true,
    FILE_UPLOAD: true,
    WEBHOOK_INTEGRATION: true,
    API_RATE_LIMITING: true,
  },
  
  // UI Configuration
  UI: {
    THEME: 'light',
    SIDEBAR_COLLAPSED: false,
    ANIMATIONS_ENABLED: true,
    SOUND_ENABLED: false,
  },
  
  // Performance Configuration
  PERFORMANCE: {
    CACHE_TTL: 300000, // 5 minutes
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 1000,
    MAX_RETRIES: 3,
    REQUEST_TIMEOUT: 30000,
  },
  
  // Security Configuration
  SECURITY: {
    TOKEN_REFRESH_THRESHOLD: 300000, // 5 minutes before expiry
    MAX_LOGIN_ATTEMPTS: 5,
    SESSION_TIMEOUT: 3600000, // 1 hour
    CSP_ENABLED: true,
  },
}

export default config
