// Sentry configuration for Next.js server-side
// This file configures Sentry for server-side error tracking

import * as Sentry from '@sentry/nextjs'

// Sentry server configuration
const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

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
  
  // Server-side integrations
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app: undefined }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out non-critical errors in production
    if (process.env.NODE_ENV === 'production') {
      const error = hint.originalException
      
      // Filter out common server errors
      if (error instanceof Error) {
        // ENOENT errors (file not found)
        if (error.message.includes('ENOENT')) {
          return null
        }
        
        // ECONNRESET errors (connection reset)
        if (error.message.includes('ECONNRESET')) {
          return null
        }
        
        // EPIPE errors (broken pipe)
        if (error.message.includes('EPIPE')) {
          return null
        }
        
        // Validation errors that are not critical
        if (error.message.includes('ValidationError') && !error.message.includes('critical')) {
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
        'database_url',
        'connection_string',
      ]
      
      sensitiveKeys.forEach(key => {
        if (breadcrumb.data![key]) {
          breadcrumb.data![key] = '[REDACTED]'
        }
      })
    }
    
    return breadcrumb
  },
  
  // Server context
  serverName: process.env.SENTRY_SERVER_NAME || '378-data-evidence-reconciliation-app-server',
  
  // Additional options
  maxBreadcrumbs: 50,
  attachStacktrace: true,
  sendDefaultPii: false,
  
  // Custom tags
  initialScope: {
    tags: {
      component: '378-data-evidence-reconciliation-app-server',
      version: process.env.npm_package_version || '1.0.0',
      node_version: process.version,
    },
  },
})

// Server-side error reporting functions
export const reportServerError = (error: Error, context?: Record<string, unknown>) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('serverErrorContext', context)
    }
    scope.setTag('errorType', 'server')
    Sentry.captureException(error)
  })
}

export const reportServerMessage = (message: string, level: 'info' | 'warning' | 'error' = 'error') => {
  Sentry.withScope((scope) => {
    scope.setLevel(level)
    scope.setTag('messageType', 'server')
    Sentry.captureMessage(message)
  })
}

export const addServerBreadcrumb = (message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
    data: {
      server: true,
    },
  })
}

export const setServerUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user)
}

export const setServerTag = (key: string, value: string) => {
  Sentry.setTag(key, value)
}

export const setServerContext = (key: string, context: Record<string, unknown>) => {
  Sentry.setContext(key, context)
}

// Performance monitoring for server
export const startServerTransaction = (name: string, op: string) => {
  return Sentry.startTransaction({ name, op })
}

export const startServerSpan = (name: string, op: string) => {
  return Sentry.startSpan({ name, op })
}

// API route error handler
export const withApiErrorHandler = (handler: any) => {
  return async (req: any, res: any) => {
    try {
      await handler(req, res)
    } catch (error) {
      reportServerError(error as Error, {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
      })
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong',
      })
    }
  }
}

// Database error handler
export const handleDatabaseError = (error: Error, operation: string, context?: Record<string, unknown>) => {
  reportServerError(error, {
    operation,
    errorType: 'database',
    ...context,
  })
}

// External API error handler
export const handleExternalApiError = (error: Error, api: string, endpoint: string, context?: Record<string, unknown>) => {
  reportServerError(error, {
    api,
    endpoint,
    errorType: 'external_api',
    ...context,
  })
}

// File system error handler
export const handleFileSystemError = (error: Error, operation: string, filePath: string, context?: Record<string, unknown>) => {
  reportServerError(error, {
    operation,
    filePath,
    errorType: 'file_system',
    ...context,
  })
}

// Validation error handler
export const handleValidationError = (error: Error, field: string, value: any, context?: Record<string, unknown>) => {
  reportServerError(error, {
    field,
    value: typeof value === 'string' ? value.substring(0, 100) : value,
    errorType: 'validation',
    ...context,
  })
}

// Authentication error handler
export const handleAuthError = (error: Error, userId?: string, context?: Record<string, unknown>) => {
  reportServerError(error, {
    userId,
    errorType: 'authentication',
    ...context,
  })
}

// Authorization error handler
export const handleAuthorizationError = (error: Error, userId: string, resource: string, action: string, context?: Record<string, unknown>) => {
  reportServerError(error, {
    userId,
    resource,
    action,
    errorType: 'authorization',
    ...context,
  })
}

// Rate limiting error handler
export const handleRateLimitError = (error: Error, userId: string, endpoint: string, context?: Record<string, unknown>) => {
  reportServerError(error, {
    userId,
    endpoint,
    errorType: 'rate_limit',
    ...context,
  })
}

// Business logic error handler
export const handleBusinessLogicError = (error: Error, operation: string, data: any, context?: Record<string, unknown>) => {
  reportServerError(error, {
    operation,
    data: typeof data === 'string' ? data.substring(0, 100) : data,
    errorType: 'business_logic',
    ...context,
  })
}

export default Sentry

