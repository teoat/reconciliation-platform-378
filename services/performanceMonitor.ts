// Performance Monitoring Service
// Implements Web Vitals tracking and performance optimization

import React from 'react'
import { onCLS, onFCP, onLCP, onTTFB } from 'web-vitals'
import { APP_CONFIG } from '../constants'

// Performance metrics factory function
export function createPerformanceMetrics(data = {}) {
  return {
    // Core Web Vitals
    CLS: 0, // Cumulative Layout Shift
    FID: 0, // First Input Delay
    LCP: 0, // Largest Contentful Paint
    
    // Additional metrics
    FCP: 0, // First Contentful Paint
    TTFB: 0, // Time to First Byte
    
    // Custom metrics
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0,
    memoryUsage: 0,
    
    // User experience metrics
    bounceRate: 0,
    sessionDuration: 0,
    pageViews: 0,
    
    // Performance scores
    performanceScore: 0,
    accessibilityScore: 0,
    bestPracticesScore: 0,
    seoScore: 0,
    
    // Timestamp
    timestamp: new Date(),
    ...data
  }
}

// Performance configuration factory function
function createPerformanceConfig(data = {}) {
  return {
    enabled: true,
    sampleRate: 1.0,
    reportInterval: 30000, // 30 seconds
    maxRetries: 3,
    endpoint: '/api/analytics/performance',
    debug: false,
    ...data
  }
}

// Default configuration
const defaultConfig = createPerformanceConfig()
  enabled: true,
  sampleRate: 1.0,
  reportInterval: 30000, // 30 seconds
  maxRetries: 3,
  endpoint: '/api/analytics/performance',
  debug: false,
}

class PerformanceMonitor {
  config
  metrics = {}
  observers = []
  reportTimer
  isInitialized = false

  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config }
    this.init()
  }

  init() {
    if (!this.config.enabled || this.isInitialized) return

    try {
      this.setupWebVitals()
      this.setupCustomMetrics()
      this.setupPerformanceObserver()
      this.startReporting()
      this.isInitialized = true

      if (this.config.debug) {
        console.log('Performance monitoring initialized')
      }
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error)
    }
  }

  setupWebVitals() {
    // Core Web Vitals
    onCLS((metric) => {
      this.metrics.CLS = metric.value
      this.reportMetric('CLS', metric.value)
    })

    onLCP((metric) => {
      this.metrics.LCP = metric.value
      this.reportMetric('LCP', metric.value)
    })

    // Additional metrics
    onFCP((metric) => {
      this.metrics.FCP = metric.value
      this.reportMetric('FCP', metric.value)
    })

    onTTFB((metric) => {
      this.metrics.TTFB = metric.value
      this.reportMetric('TTFB', metric.value)
    })
  }

  setupCustomMetrics() {
    // Page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now()
      this.metrics.loadTime = loadTime
      this.reportMetric('loadTime', loadTime)
    })

    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
    }

    // User interaction tracking
    this.trackUserInteractions()
  }

  setupPerformanceObserver() {
    // Long task observer
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.reportMetric('longTask', entry.duration)
          }
        }
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
      this.observers.push(longTaskObserver)

      // Navigation observer
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.metrics.renderTime = navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart
            this.reportMetric('renderTime', this.metrics.renderTime)
          }
        }
      })
      navigationObserver.observe({ entryTypes: ['navigation'] })
      this.observers.push(navigationObserver)
    }
  }

  trackUserInteractions() {
    let interactionStart = 0
    let interactionCount = 0

    const trackInteraction = () => {
      if (interactionStart === 0) {
        interactionStart = performance.now()
      }
      interactionCount++
    }

    // Track various user interactions
    const events = ['click', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, trackInteraction, { passive: true })
    })

    // Calculate interaction time
    window.addEventListener('beforeunload', () => {
      if (interactionStart > 0) {
        this.metrics.interactionTime = performance.now() - interactionStart
        this.reportMetric('interactionTime', this.metrics.interactionTime)
      }
    })
  }

  startReporting() {
    this.reportTimer = setInterval(() => {
      this.reportMetrics()
    }, this.config.reportInterval)
  }

  reportMetric(name, value) {
    if (this.config.debug) {
      console.log(`Performance metric ${name}:`, value)
    }

    // Store metric
    this.metrics[name] = value
    this.metrics.timestamp = new Date()

    // Send to analytics endpoint
    this.sendMetric(name, value)
  }

  async sendMetric(name, value) {
    try {
      const payload = {
        metric: name,
        value,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      }

      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to send performance metric:', error)
      }
    }
  }

  async reportMetrics() {
    if (Object.keys(this.metrics).length === 0) return

    try {
      const payload = {
        ...this.metrics,
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        connection: this.getConnectionInfo(),
        device: this.getDeviceInfo(),
      }

      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      // Clear metrics after reporting
      this.metrics = {}
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to report performance metrics:', error)
      }
    }
  }

  getConnectionInfo() {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData,
      }
    }
    return null
  }

  getDeviceInfo() {
    return {
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
    }
  }

  // Public methods
  getMetrics() {
    return { ...this.metrics }
  }

  getPerformanceScore() {
    const metrics = this.metrics
    let score = 100

    // CLS scoring (0-0.1 is good, 0.1-0.25 needs improvement, >0.25 is poor)
    if (metrics.CLS !== undefined) {
      if (metrics.CLS > 0.25) score -= 30
      else if (metrics.CLS > 0.1) score -= 15
    }

    // FID scoring (0-100ms is good, 100-300ms needs improvement, >300ms is poor)
    if (metrics.FID !== undefined) {
      if (metrics.FID > 300) score -= 30
      else if (metrics.FID > 100) score -= 15
    }

    // LCP scoring (<2.5s is good, 2.5-4s needs improvement, >4s is poor)
    if (metrics.LCP !== undefined) {
      if (metrics.LCP > 4000) score -= 30
      else if (metrics.LCP > 2500) score -= 15
    }

    return Math.max(0, score)
  }

  markCustomMetric(name, value) {
    this.reportMetric(name, value)
  }

  measureCustomFunction(name, fn) {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    
    this.markCustomMetric(name, duration)
    return result
  }

  async measureAsyncFunction(name, fn) {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    
    this.markCustomMetric(name, duration)
    return result
  }

  destroy() {
    if (this.reportTimer) {
      clearInterval(this.reportTimer)
    }

    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.isInitialized = false
  }
}

// Performance optimization utilities
export class PerformanceOptimizer {
  static instance
  optimizations = new Map()

  static getInstance() {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }

  // Image optimization
  optimizeImages() {
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      // Lazy loading
      if (!img.loading) {
        img.loading = 'lazy'
      }

      // WebP support
      if (img.src && !img.src.includes('.webp')) {
        const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/i, '.webp')
        const webpImg = new Image()
        webpImg.onload = () => {
          img.src = webpSrc
        }
        webpImg.src = webpSrc
      }
    })
  }

  // Resource hints
  addResourceHints(urls) {
    urls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = url
      document.head.appendChild(link)
    })
  }

  // Critical CSS inlining
  inlineCriticalCSS(css) {
    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)
  }

  // Bundle splitting
  loadChunk(chunkName) {
    return import(/* webpackChunkName: "[request]" */ `../chunks/${chunkName}`)
  }

  // Memory optimization
  optimizeMemory() {
    // Clear unused event listeners
    if (window.gc) {
      window.gc()
    }

    // Clear unused timers
    const highestTimeoutId = setTimeout(() => {}, 0)
    clearTimeout(highestTimeoutId)
    // Note: In browser environment, we can't iterate through timeout IDs
    // This is a simplified cleanup approach
  }

  // Debounced scroll handler
  addOptimizedScrollHandler(handler, delay = 16) {
    let ticking = false
    
    const optimizedHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handler()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', optimizedHandler, { passive: true })
  }

  // Virtual scrolling for large lists
  createVirtualScroller(container, itemHeight, totalItems, renderItem) {
    const visibleItems = Math.ceil(container.clientHeight / itemHeight)
    let scrollTop = 0

    const updateVisibleItems = () => {
      const startIndex = Math.floor(scrollTop / itemHeight)
      const endIndex = Math.min(startIndex + visibleItems, totalItems)

      // Clear container
      container.innerHTML = ''

      // Render visible items
      for (let i = startIndex; i < endIndex; i++) {
        const item = renderItem(i)
        item.style.position = 'absolute'
        item.style.top = `${i * itemHeight}px`
        container.appendChild(item)
      }

      // Set container height
      container.style.height = `${totalItems * itemHeight}px`
    }

    container.addEventListener('scroll', () => {
      scrollTop = container.scrollTop
      updateVisibleItems()
    })

    updateVisibleItems()
  }
}

// Export singleton instances
export const performanceMonitor = new PerformanceMonitor({
  enabled: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
})

export const performanceOptimizer = PerformanceOptimizer.getInstance()

// React performance hooks
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState({})

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics())
    }

    const interval = setInterval(updateMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  return {
    metrics,
    getPerformanceScore: () => performanceMonitor.getPerformanceScore(),
    markMetric: (name, value) => performanceMonitor.markCustomMetric(name, value),
    measureFunction: (name, fn) => performanceMonitor.measureCustomFunction(name, fn),
    measureAsyncFunction: (name, fn) => performanceMonitor.measureAsyncFunction(name, fn),
  }
}

// Performance middleware for API calls
export const performanceMiddleware = (store) => (next) => (action) => {
  const start = performance.now()
  const result = next(action)
  const duration = performance.now() - start

  if (duration > 100) { // Log slow actions
    console.warn(`Slow action: ${action.type} took ${duration.toFixed(2)}ms`)
  }

  performanceMonitor.markCustomMetric(`action_${action.type}`, duration)
  return result
}

export default performanceMonitor

