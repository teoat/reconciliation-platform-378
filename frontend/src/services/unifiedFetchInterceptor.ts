// ============================================================================
// UNIFIED FETCH INTERCEPTOR - SINGLE SOURCE OF TRUTH
// ============================================================================

interface InterceptorConfig {
  enablePerformanceTracking?: boolean
  enableMonitoring?: boolean
  enableErrorTracking?: boolean
  samplingRate?: number
}

/**
 * Unified fetch interceptor service
 * Consolidates fetch interception from:
 * - services/performanceService.ts
 * - services/monitoringService.ts
 * - services/monitoring.ts
 */
export class UnifiedFetchInterceptor {
  private static instance: UnifiedFetchInterceptor | null = null
  private originalFetch: typeof fetch
  private config: Required<InterceptorConfig>
  private initialized = false

  private constructor(config: InterceptorConfig = {}) {
    this.config = {
      enablePerformanceTracking: config.enablePerformanceTracking ?? true,
      enableMonitoring: config.enableMonitoring ?? true,
      enableErrorTracking: config.enableErrorTracking ?? true,
      samplingRate: config.samplingRate ?? 1.0
    }

    this.originalFetch = window.fetch
  }

  static getInstance(config?: InterceptorConfig): UnifiedFetchInterceptor {
    if (!UnifiedFetchInterceptor.instance) {
      UnifiedFetchInterceptor.instance = new UnifiedFetchInterceptor(config)
    }
    return UnifiedFetchInterceptor.instance
  }

  /**
   * Initialize the interceptor (call once in app initialization)
   */
  initialize(): void {
    if (this.initialized) {
      console.warn('Fetch interceptor already initialized')
      return
    }

    window.fetch = async (...args) => {
      const startTime = performance.now()
      const url = args[0] as string
      const options = args[1] || {}
      const method = options.method || 'GET'

      try {
        // Call original fetch with proper context binding to prevent "Illegal invocation" error
        const response = await this.originalFetch.call(window, ...args)
        const duration = performance.now() - startTime

        // Track metrics if sampling
        if (Math.random() <= this.config.samplingRate) {
          this.trackMetrics(url, method, response.status, duration, false, response)
        }

        return response
      } catch (error) {
        const duration = performance.now() - startTime

        // Track error if sampling
        if (Math.random() <= this.config.samplingRate) {
          this.trackMetrics(url, method, 0, duration, true, null, error as Error)
        }

        throw error
      }
    }

    this.initialized = true
    console.log('✅ Unified fetch interceptor initialized')
  }

  /**
   * Track metrics to all configured services
   */
  private trackMetrics(
    url: string,
    method: string,
    statusCode: number,
    duration: number,
    isError: boolean,
    _response: Response | null,
    error?: Error
  ): void {
    const metrics = {
      url,
      method,
      statusCode,
      duration,
      isError,
      timestamp: new Date().toISOString()
    }

    // Performance tracking
    if (this.config.enablePerformanceTracking && typeof window !== 'undefined') {
      const win = window as unknown as Record<string, unknown>
      const monitor = win.performanceMonitor as { recordMetric?: (name: string, value: number, tags: Record<string, string>) => void } | undefined
      monitor?.recordMetric?.('apiResponseTime', duration, {
        url,
        method,
        status: statusCode.toString()
      })
    }

    // Monitoring
    if (this.config.enableMonitoring && typeof window !== 'undefined') {
      const win = window as unknown as Record<string, unknown>
      const monitoring = win.monitoring as { collectMetric?: (type: string, metrics: Record<string, unknown>) => void } | undefined
      monitoring?.collectMetric?.('api', metrics)
    }

    // Error tracking
    if (this.config.enableErrorTracking && isError) {
      console.error('API Error:', metrics, error)
      
      if (typeof window !== 'undefined') {
        const win = window as unknown as Record<string, unknown>
        const tracker = win.errorTracker as { trackError?: (error: Error, metrics: Record<string, unknown>) => void } | undefined
        tracker?.trackError?.(error || new Error('API Request Failed'), metrics)
      }
    }
  }

  /**
   * Restore original fetch
   */
  restore(): void {
    if (!this.initialized) return

    window.fetch = this.originalFetch
    this.initialized = false
    console.log('🔄 Original fetch restored')
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<InterceptorConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

export default UnifiedFetchInterceptor

