// ============================================================================
import { logger } from '@/services/logger'
// CONTENT SECURITY POLICY CONFIGURATION
// ============================================================================

export const cspConfig = {
  // Default CSP policy
  default: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'nonce-{nonce}'", // Use nonces for inline scripts
    ],
    'style-src': [
      "'self'",
      "'nonce-{nonce}'", // Use nonces for inline styles
      'https://fonts.googleapis.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
    ],
    'connect-src': [
      "'self'",
      'ws://localhost:*', // WebSocket for development
      'wss://*', // WebSocket for production
      'https://api.*', // API endpoints
      'http://localhost:8200', // APM monitoring (Elastic APM)
    ],
    'media-src': [
      "'self'",
      'data:',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  },

  // Development CSP policy (more permissive)
  development: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      'localhost:*',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'localhost:*',
    ],
    'connect-src': [
      "'self'",
      'ws://localhost:*',
      'wss://localhost:*',
      'http://localhost:*',
      'https://localhost:*',
      'http://localhost:8200', // APM monitoring (Elastic APM)
    ],
    'media-src': [
      "'self'",
      'data:',
      'localhost:*',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  },

  // Production CSP policy (strict)
  production: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'nonce-{nonce}'", // Use nonces for inline scripts (replaces unsafe-inline)
    ],
    'style-src': [
      "'self'",
      "'nonce-{nonce}'", // Use nonces for inline styles
      'https://fonts.googleapis.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'https://cdn.example.com', // Replace with your CDN
    ],
    'connect-src': [
      "'self'",
      'wss://api.example.com', // Replace with your WebSocket endpoint
      'https://api.example.com', // Replace with your API endpoint
    ],
    'media-src': [
      "'self'",
      'data:',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
    'block-all-mixed-content': [],
  },
}

// ============================================================================
// CSP UTILITIES
// ============================================================================

/**
 * Generates a CSP nonce
 */
export function generateCSPNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Builds CSP header string
 */
export function buildCSPHeader(policy: Record<string, string[]>, nonce?: string): string {
  const directives = Object.entries(policy).map(([directive, sources]) => {
    const processedSources = sources.map(source => {
      if (source === "'nonce-{nonce}'" && nonce) {
        return `'nonce-${nonce}'`
      }
      return source
    })
    return `${directive} ${processedSources.join(' ')}`
  })

  return directives.join('; ')
}

/**
 * Gets CSP policy based on environment
 */
export function getCSPPolicy(environment: 'development' | 'production' = 'production'): Record<string, string[]> {
  return cspConfig[environment] || cspConfig.default
}

/**
 * Validates CSP policy
 */
export function validateCSPPolicy(policy: Record<string, string[]>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const requiredDirectives = [
    'default-src',
    'script-src',
    'style-src',
    'img-src',
    'connect-src',
  ]

  // Check required directives
  requiredDirectives.forEach(directive => {
    if (!policy[directive]) {
      errors.push(`Missing required directive: ${directive}`)
    }
  })

  // Check for unsafe directives
  if (policy['script-src']?.includes("'unsafe-inline'")) {
    errors.push("'unsafe-inline' in script-src reduces security")
  }

  if (policy['script-src']?.includes("'unsafe-eval'")) {
    errors.push("'unsafe-eval' in script-src reduces security")
  }

  // Check for wildcard sources
  Object.entries(policy).forEach(([directive, sources]) => {
    if (sources.includes('*')) {
      errors.push(`Wildcard source (*) in ${directive} reduces security`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// SECURITY HEADERS CONFIGURATION
// ============================================================================

export const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': buildCSPHeader(getCSPPolicy()),
  
  // X-Frame-Options
  'X-Frame-Options': 'DENY',
  
  // X-Content-Type-Options
  'X-Content-Type-Options': 'nosniff',
  
  // X-XSS-Protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer-Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions-Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'usb=()',
    'bluetooth=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()',
  ].join(', '),
  
  // Strict-Transport-Security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Cross-Origin-Embedder-Policy
  'Cross-Origin-Embedder-Policy': 'require-corp',
  
  // Cross-Origin-Opener-Policy
  'Cross-Origin-Opener-Policy': 'same-origin',
  
  // Cross-Origin-Resource-Policy
  'Cross-Origin-Resource-Policy': 'same-origin',
}

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

/**
 * Security middleware for Express.js
 */
export function securityMiddleware(_req: unknown, res: unknown, next: unknown) {
  // Set security headers
  Object.entries(securityHeaders).forEach(([header, value]) => {
    res.setHeader(header, value)
  })

  // Generate and set CSP nonce
  const nonce = generateCSPNonce()
  res.locals.cspNonce = nonce
  
  // Update CSP header with nonce
  const cspPolicy = getCSPPolicy(import.meta.env.DEV ? 'development' : 'production')
  const cspHeader = buildCSPHeader(cspPolicy, nonce)
  res.setHeader('Content-Security-Policy', cspHeader)

  next()
}

// ============================================================================
// SECURITY VALIDATION
// ============================================================================

/**
 * Validates security configuration
 */
export function validateSecurityConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate CSP policy
  const cspValidation = validateCSPPolicy(getCSPPolicy())
  if (!cspValidation.isValid) {
    errors.push(...cspValidation.errors)
  }

  // Validate security headers
  const requiredHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'X-XSS-Protection',
    'Referrer-Policy',
  ]

  requiredHeaders.forEach(header => {
    if (!securityHeaders[header as keyof typeof securityHeaders]) {
      errors.push(`Missing required security header: ${header}`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// SECURITY MONITORING
// ============================================================================

/**
 * Monitors security events
 */
export class SecurityMonitor {
  private events: Array<{
    type: string
    message: string
    timestamp: Date
    severity: 'low' | 'medium' | 'high' | 'critical'
  }> = []

  logEvent(type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    this.events.push({
      type,
      message,
      timestamp: new Date(),
      severity,
    })

    // Log critical events immediately
    if (severity === 'critical') {
      logger.error(`[SECURITY CRITICAL] ${type}: ${message}`)
    }
  }

  getEvents(severity?: 'low' | 'medium' | 'high' | 'critical') {
    if (severity) {
      return this.events.filter(event => event.severity === severity)
    }
    return this.events
  }

  clearEvents() {
    this.events = []
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  cspConfig,
  generateCSPNonce,
  buildCSPHeader,
  getCSPPolicy,
  validateCSPPolicy,
  securityHeaders,
  securityMiddleware,
  validateSecurityConfig,
  SecurityMonitor,
}
