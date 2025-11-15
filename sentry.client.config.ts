// Sentry configuration for Next.js
// This file configures Sentry for error tracking and performance monitoring

import * as Sentry from '@sentry/nextjs'

// Sentry configuration
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Release version
  release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || 'development',
  
  // Debug mode
  debug: process.env.NODE_ENV === 'development',
  
  // Sample rates
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Performance monitoring
  integrations: [
    new Sentry.BrowserTracing({
      // Set sampling rate for performance monitoring
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/.*\.vercel\.app\/api/,
        /^https:\/\/.*\.reconciliation\.com\/api/,
      ],
    }),
    new Sentry.Replay({
      // Capture 10% of all sessions in production
      sessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
      // Capture 100% of sessions with an error
      errorSampleRate: 1.0,
      // Mask sensitive data
      maskAllText: false,
      maskAllInputs: true,
      blockAllMedia: false,
    }),
  ],
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out non-critical errors in production
    if (process.env.NODE_ENV === 'production') {
      const error = hint.originalException
      
      // Filter out common browser errors
      if (error instanceof Error) {
        // ResizeObserver loop limit exceeded
        if (error.message.includes('ResizeObserver loop limit exceeded')) {
          return null
        }
        
        // Non-Error promise rejection
        if (error.message.includes('Non-Error promise rejection')) {
          return null
        }
        
        // Network errors that are not critical
        if (error.message.includes('NetworkError') && !error.message.includes('critical')) {
          return null
        }
        
        // Chunk load errors (usually due to code splitting)
        if (error.message.includes('Loading chunk') || error.message.includes('Loading CSS chunk')) {
          return null
        }
      }
      
      // Filter out events with low severity
      if (event.level === 'info' || event.level === 'debug') {
        return null
      }
    }
    
    return event
  },
  
  // Breadcrumb filtering
  beforeBreadcrumb(breadcrumb) {
    // Filter out sensitive data
    if (breadcrumb.data) {
      const sensitiveKeys = [
        'password',
        'token',
        'secret',
        'key',
        'authorization',
        'cookie',
        'session',
        'csrf',
        'api_key',
        'access_token',
        'refresh_token',
      ]
      
      sensitiveKeys.forEach(key => {
        if (breadcrumb.data![key]) {
          breadcrumb.data![key] = '[REDACTED]'
        }
      })
    }
    
    // Filter out navigation breadcrumbs in production
    if (process.env.NODE_ENV === 'production' && breadcrumb.category === 'navigation') {
      return null
    }
    
    return breadcrumb
  },
  
  // User context
  beforeSendTransaction(event) {
    // Add custom tags
    event.tags = {
      ...event.tags,
      component: 'reconciliation-app',
      version: process.env.npm_package_version || '1.0.0',
    }
    
    return event
  },
  
  // Custom error grouping
  fingerprint: ['{{ default }}'],
  
  // Server-side configuration
  serverName: process.env.SENTRY_SERVER_NAME || 'reconciliation-app',
  
  // Additional options
  maxBreadcrumbs: 50,
  attachStacktrace: true,
  sendDefaultPii: false,
  
  // Custom transport for development
  transport: process.env.NODE_ENV === 'development' ? undefined : undefined,
})

// Custom error reporting functions
export const reportError = (error: Error, context?: Record<string, unknown>) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('errorContext', context)
    }
    Sentry.captureException(error)
  })
}

export const reportMessage = (message: string, level: 'info' | 'warning' | 'error' = 'error') => {
  Sentry.withScope((scope) => {
    scope.setLevel(level)
    Sentry.captureMessage(message)
  })
}

export const addBreadcrumb = (message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  })
}

export const setUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user)
}

export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value)
}

export const setContext = (key: string, context: Record<string, unknown>) => {
  Sentry.setContext(key, context)
}

// Performance monitoring helpers
export const startTransaction = (name: string, op: string) => {
  return Sentry.startTransaction({ name, op })
}

export const startSpan = (name: string, op: string) => {
  return Sentry.startSpan({ name, op })
}

// React integration
export const withSentry = Sentry.withSentry

// Next.js specific configurations
export const sentryWebpackPluginOptions = {
  // Additional webpack plugin options
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Upload source maps
  release: process.env.SENTRY_RELEASE,
  
  // Webpack plugin options
  webpack: {
    ignore: ['node_modules'],
    include: ['./app'],
    exclude: ['./app/**/*.test.*', './app/**/*.spec.*'],
  },
}

export default Sentry

