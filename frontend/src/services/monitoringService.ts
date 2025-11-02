// Comprehensive Monitoring Service
import { logger } from '@/services/logger'
import { apiClient } from '../apiClient';

export interface SystemMetrics {
  timestamp: string;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  activeConnections: number;
  databaseConnections: number;
  redisConnections: number;
  websocketConnections: number;
  errorRate: number;
  responseTimeP50: number;
  responseTimeP95: number;
  responseTimeP99: number;
  throughput: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  description: string;
  triggeredAt: string;
  resolvedAt?: string;
  status: 'firing' | 'resolved' | 'suppressed';
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  source: string;
  context: Record<string, string>;
  traceId?: string;
  spanId?: string;
}

export interface PerformanceMetrics {
  timestamp: string;
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  memoryUsage: number;
  jsHeapSizeUsed: number;
  jsHeapSizeLimit: number;
}

export interface ErrorMetrics {
  timestamp: string;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface UserMetrics {
  timestamp: string;
  userId: string;
  sessionId: string;
  pageViews: number;
  timeOnSite: number;
  bounceRate: number;
  conversionRate: number;
  deviceType: string;
  browserType: string;
  osType: string;
  location: string;
}

export interface ApiMetrics {
  timestamp: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  errorRate: number;
  throughput: number;
}

export interface DatabaseMetrics {
  timestamp: string;
  connectionCount: number;
  activeQueries: number;
  slowQueries: number;
  queryTime: number;
  lockWaitTime: number;
  deadlocks: number;
  cacheHitRate: number;
  indexUsage: number;
}

export interface CacheMetrics {
  timestamp: string;
  hitRate: number;
  missRate: number;
  evictionRate: number;
  memoryUsage: number;
  keyCount: number;
  expirationRate: number;
  connectionCount: number;
}

export interface WebSocketMetrics {
  timestamp: string;
  activeConnections: number;
  messagesPerSecond: number;
  averageMessageSize: number;
  errorRate: number;
  connectionDuration: number;
  reconnectionRate: number;
  messageQueueSize: number;
}

export interface MonitoringConfig {
  enablePerformanceMonitoring: boolean;
  enableErrorTracking: boolean;
  enableUserAnalytics: boolean;
  enableApiMonitoring: boolean;
  enableDatabaseMonitoring: boolean;
  enableCacheMonitoring: boolean;
  enableWebSocketMonitoring: boolean;
  samplingRate: number;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  retryDelay: number;
}

export class MonitoringService {
  private config: MonitoringConfig;
  private metricsBuffer: Map<string, any[]> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enablePerformanceMonitoring: true,
      enableErrorTracking: true,
      enableUserAnalytics: true,
      enableApiMonitoring: true,
      enableDatabaseMonitoring: true,
      enableCacheMonitoring: true,
      enableWebSocketMonitoring: true,
      samplingRate: 1.0,
      batchSize: 100,
      flushInterval: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        this.initializePerformanceMonitoring();
      }

      // Initialize error tracking
      if (this.config.enableErrorTracking) {
        this.initializeErrorTracking();
      }

      // Initialize user analytics
      if (this.config.enableUserAnalytics) {
        this.initializeUserAnalytics();
      }

      // Initialize API monitoring
      if (this.config.enableApiMonitoring) {
        this.initializeApiMonitoring();
      }

      // Start flush timer
      this.startFlushTimer();

      this.isInitialized = true;
      logger.log('Monitoring service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize monitoring service:', error);
      throw error;
    }
  }

  private initializePerformanceMonitoring(): void {
    // Monitor page load performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paintEntries = performance.getEntriesByType('paint');
        
        const metrics: PerformanceMetrics = {
          timestamp: new Date().toISOString(),
          pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
          largestContentfulPaint: 0, // Will be updated by LCP observer
          firstInputDelay: 0, // Will be updated by FID observer
          cumulativeLayoutShift: 0, // Will be updated by CLS observer
          totalBlockingTime: 0, // Will be calculated from long tasks
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          jsHeapSizeUsed: (performance as any).memory?.usedJSHeapSize || 0,
          jsHeapSizeLimit: (performance as any).memory?.jsHeapSizeLimit || 0,
        };

        this.collectMetric('performance', metrics);
      });

      // Monitor Core Web Vitals
      this.observeCoreWebVitals();
    }
  }

  private observeCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.collectMetric('performance', {
          timestamp: new Date().toISOString(),
          largestContentfulPaint: lastEntry.startTime,
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.collectMetric('performance', {
            timestamp: new Date().toISOString(),
            firstInputDelay: entry.processingStart - entry.startTime,
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.collectMetric('performance', {
          timestamp: new Date().toISOString(),
          cumulativeLayoutShift: clsValue,
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Total Blocking Time (TBT)
      const tbtObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let totalBlockingTime = 0;
        entries.forEach((entry: any) => {
          totalBlockingTime += entry.duration - 50; // Tasks longer than 50ms
        });
        this.collectMetric('performance', {
          timestamp: new Date().toISOString(),
          totalBlockingTime,
        });
      });
      tbtObserver.observe({ entryTypes: ['longtask'] });
    }
  }

  private initializeErrorTracking(): void {
    if (typeof window !== 'undefined') {
      // Global error handler
      window.addEventListener('error', (event) => {
        const error: ErrorMetrics = {
          timestamp: new Date().toISOString(),
          errorType: 'javascript',
          errorMessage: event.message,
          stackTrace: event.error?.stack,
          url: event.filename,
          userAgent: navigator.userAgent,
          userId: this.getCurrentUserId(),
          sessionId: this.getCurrentSessionId(),
          severity: this.determineErrorSeverity(event.error),
        };
        this.collectMetric('errors', error);
      });

      // Unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        const error: ErrorMetrics = {
          timestamp: new Date().toISOString(),
          errorType: 'promise',
          errorMessage: event.reason?.message || 'Unhandled promise rejection',
          stackTrace: event.reason?.stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          userId: this.getCurrentUserId(),
          sessionId: this.getCurrentSessionId(),
          severity: 'medium',
        };
        this.collectMetric('errors', error);
      });
    }
  }

  private initializeUserAnalytics(): void {
    if (typeof window !== 'undefined') {
      let pageViews = 0;
      let startTime = Date.now();

      // Track page views
      const trackPageView = () => {
        pageViews++;
        const timeOnSite = Date.now() - startTime;
        
        const userMetrics: UserMetrics = {
          timestamp: new Date().toISOString(),
          userId: this.getCurrentUserId() || 'anonymous',
          sessionId: this.getCurrentSessionId(),
          pageViews,
          timeOnSite,
          bounceRate: pageViews === 1 ? 1 : 0,
          conversionRate: 0, // Will be updated based on business logic
          deviceType: this.getDeviceType(),
          browserType: this.getBrowserType(),
          osType: this.getOSType(),
          location: this.getLocation(),
        };
        this.collectMetric('users', userMetrics);
      };

      // Track initial page view
      trackPageView();

      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          startTime = Date.now();
        } else {
          const timeOnSite = Date.now() - startTime;
          this.collectMetric('users', {
            timestamp: new Date().toISOString(),
            userId: this.getCurrentUserId() || 'anonymous',
            sessionId: this.getCurrentSessionId(),
            timeOnSite,
          });
        }
      });

      // Track before unload
      window.addEventListener('beforeunload', () => {
        const timeOnSite = Date.now() - startTime;
        this.collectMetric('users', {
          timestamp: new Date().toISOString(),
          userId: this.getCurrentUserId() || 'anonymous',
          sessionId: this.getCurrentSessionId(),
          timeOnSite,
        });
      });
    }
  }

  private initializeApiMonitoring(): void {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = args[0] as string;
      const method = args[1]?.method || 'GET';
      
      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const apiMetrics: ApiMetrics = {
          timestamp: new Date().toISOString(),
          endpoint: url,
          method,
          statusCode: response.status,
          responseTime,
          requestSize: JSON.stringify(args[1]?.body || '').length,
          responseSize: 0, // Will be updated when response is consumed
          errorRate: response.ok ? 0 : 1,
          throughput: 1,
        };
        this.collectMetric('api', apiMetrics);
        
        return response;
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const apiMetrics: ApiMetrics = {
          timestamp: new Date().toISOString(),
          endpoint: url,
          method,
          statusCode: 0,
          responseTime,
          requestSize: JSON.stringify(args[1]?.body || '').length,
          responseSize: 0,
          errorRate: 1,
          throughput: 1,
        };
        this.collectMetric('api', apiMetrics);
        
        throw error;
      }
    };
  }

  private collectMetric(type: string, metric: any): void {
    if (Math.random() > this.config.samplingRate) return;

    if (!this.metricsBuffer.has(type)) {
      this.metricsBuffer.set(type, []);
    }

    const buffer = this.metricsBuffer.get(type)!;
    buffer.push(metric);

    if (buffer.length >= this.config.batchSize) {
      this.flushMetrics(type);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.metricsBuffer.forEach((_, type) => {
        this.flushMetrics(type);
      });
    }, this.config.flushInterval);
  }

  private async flushMetrics(type: string): Promise<void> {
    const buffer = this.metricsBuffer.get(type);
    if (!buffer || buffer.length === 0) return;

    const metrics = buffer.splice(0, this.config.batchSize);
    
    try {
      await this.sendMetrics(type, metrics);
    } catch (error) {
      logger.error(`Failed to send ${type} metrics:`, error);
      // Re-add metrics to buffer for retry
      buffer.unshift(...metrics);
    }
  }

  private async sendMetrics(type: string, metrics: any[]): Promise<void> {
    const endpoint = `/api/monitoring/metrics/${type}`;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await apiClient.post(endpoint, { metrics });
        return;
      } catch (error) {
        if (attempt === this.config.maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
      }
    }
  }

  // Public API methods
  async getSystemMetrics(): Promise<SystemMetrics> {
    const response = await apiClient.get('/api/monitoring/metrics/system');
    return response.data;
  }

  async getAlerts(): Promise<Alert[]> {
    const response = await apiClient.get('/api/monitoring/alerts');
    return response.data;
  }

  async getLogs(level?: string, limit = 100): Promise<LogEntry[]> {
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    params.append('limit', limit.toString());
    
    const response = await apiClient.get(`/api/monitoring/logs?${params}`);
    return response.data;
  }

  async getPerformanceMetrics(timeRange = '1h'): Promise<PerformanceMetrics[]> {
    const response = await apiClient.get(`/api/monitoring/metrics/performance?timeRange=${timeRange}`);
    return response.data;
  }

  async getErrorMetrics(timeRange = '1h'): Promise<ErrorMetrics[]> {
    const response = await apiClient.get(`/api/monitoring/metrics/errors?timeRange=${timeRange}`);
    return response.data;
  }

  async getUserMetrics(timeRange = '1h'): Promise<UserMetrics[]> {
    const response = await apiClient.get(`/api/monitoring/metrics/users?timeRange=${timeRange}`);
    return response.data;
  }

  async getApiMetrics(timeRange = '1h'): Promise<ApiMetrics[]> {
    const response = await apiClient.get(`/api/monitoring/metrics/api?timeRange=${timeRange}`);
    return response.data;
  }

  async getDatabaseMetrics(timeRange = '1h'): Promise<DatabaseMetrics[]> {
    const response = await apiClient.get(`/api/monitoring/metrics/database?timeRange=${timeRange}`);
    return response.data;
  }

  async getCacheMetrics(timeRange = '1h'): Promise<CacheMetrics[]> {
    const response = await apiClient.get(`/api/monitoring/metrics/cache?timeRange=${timeRange}`);
    return response.data;
  }

  async getWebSocketMetrics(timeRange = '1h'): Promise<WebSocketMetrics[]> {
    const response = await apiClient.get(`/api/monitoring/metrics/websocket?timeRange=${timeRange}`);
    return response.data;
  }

  async resolveAlert(alertId: string): Promise<void> {
    await apiClient.post(`/api/monitoring/alerts/${alertId}/resolve`);
  }

  async suppressAlert(alertId: string): Promise<void> {
    await apiClient.post(`/api/monitoring/alerts/${alertId}/suppress`);
  }

  async createAlert(alert: Partial<Alert>): Promise<Alert> {
    const response = await apiClient.post('/api/monitoring/alerts', alert);
    return response.data;
  }

  async updateAlert(alertId: string, alert: Partial<Alert>): Promise<Alert> {
    const response = await apiClient.put(`/api/monitoring/alerts/${alertId}`, alert);
    return response.data;
  }

  async deleteAlert(alertId: string): Promise<void> {
    await apiClient.delete(`/api/monitoring/alerts/${alertId}`);
  }

  // Utility methods
  private getCurrentUserId(): string | null {
    return localStorage.getItem('userId');
  }

  private getCurrentSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'mobile';
    } else if (/Tablet|iPad/.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  private getBrowserType(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSType(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getLocation(): string {
    // This would typically use a geolocation service
    return 'Unknown';
  }

  private determineErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'high';
    }
    if (error.name === 'NetworkError' || error.name === 'TimeoutError') {
      return 'medium';
    }
    return 'low';
  }

  // Cleanup method
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.metricsBuffer.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();
