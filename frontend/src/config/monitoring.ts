// ============================================================================
// MONITORING CONFIGURATION
// ============================================================================

export const monitoringConfig = {
  // Performance Monitoring
  performance: {
    enabled: true,
    sampleRate: 0.1, // 10% of users
    metrics: {
      // Core Web Vitals
      LCP: { threshold: 2500 }, // Largest Contentful Paint
      FID: { threshold: 100 },  // First Input Delay
      CLS: { threshold: 0.1 }, // Cumulative Layout Shift
      
      // Custom metrics
      pageLoadTime: { threshold: 3000 },
      apiResponseTime: { threshold: 2000 },
      errorRate: { threshold: 0.05 }, // 5%
    },
    reporting: {
      endpoint: '/api/analytics/performance',
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
    }
  },

  // Error Monitoring
  errors: {
    enabled: true,
    captureUnhandledRejections: true,
    captureUncaughtExceptions: true,
    filters: [
      // Filter out common non-critical errors
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection',
    ],
    reporting: {
      endpoint: '/api/analytics/errors',
      maxErrors: 100,
      flushInterval: 60000, // 1 minute
    }
  },

  // User Analytics
  analytics: {
    enabled: true,
    trackPageViews: true,
    trackUserInteractions: true,
    trackCustomEvents: true,
    privacy: {
      anonymizeIP: true,
      respectDoNotTrack: true,
      cookieConsent: true,
    },
    reporting: {
      endpoint: '/api/analytics/events',
      batchSize: 20,
      flushInterval: 60000, // 1 minute
    }
  },

  // Real-time Monitoring
  realtime: {
    enabled: true,
    websocket: {
      url: 'ws://localhost:8080/ws/monitoring',
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
    },
    metrics: {
      connectionStatus: true,
      messageLatency: true,
      errorRate: true,
    }
  },

  // Health Checks
  healthChecks: {
    enabled: true,
    endpoints: [
      '/api/health',
      '/api/auth/health',
      '/api/projects/health',
    ],
    interval: 30000, // 30 seconds
    timeout: 5000,   // 5 seconds
    retries: 3,
  },

  // Alerts
  alerts: {
    enabled: true,
    channels: ['email', 'slack', 'webhook'],
    thresholds: {
      errorRate: 0.1,        // 10%
      responseTime: 5000,    // 5 seconds
      availability: 0.99,    // 99%
      memoryUsage: 0.8,      // 80%
    },
    recipients: [
      'dev-team@company.com',
      'ops-team@company.com',
    ],
  },

  // Logging
  logging: {
    enabled: true,
    level: 'info',
    format: 'json',
    transports: ['console', 'file', 'remote'],
    remote: {
      endpoint: '/api/logs',
      batchSize: 50,
      flushInterval: 10000, // 10 seconds
    },
    filters: {
      exclude: ['password', 'token', 'secret'],
      include: ['userId', 'sessionId', 'requestId'],
    }
  }
}

export default monitoringConfig

