/**
 * PWA Utilities for Service Worker Registration and Management
 * 
 * Provides comprehensive PWA functionality including:
 * - Service worker registration and update management
 * - Cache management and performance monitoring
 * - PWA installation and display mode detection
 * - Offline analytics queuing
 * 
 * @module pwaUtils
 */

import { logger } from '@/services/logger';

interface ServiceWorkerMessage {
  type: string;
  data?: unknown;
}

interface CacheInfo {
  cacheNames: string[];
  cacheInfos: Array<{ name: string; entries: number }>;
}

interface PerformanceStats {
  cacheHits: number;
  cacheMisses: number;
  networkRequests: number;
  errors: number;
  hitRate: string;
  totalRequests: number;
}

class PWAUtils {
  private static instance: PWAUtils;
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;
  private updateCallbacks: Array<(registration: ServiceWorkerRegistration) => void> = [];

  static getInstance(): PWAUtils {
    if (!PWAUtils.instance) {
      PWAUtils.instance = new PWAUtils();
    }
    return PWAUtils.instance;
  }

  /**
   * Register service worker
   */
  /**
   * Register service worker for PWA functionality
   * 
   * Registers the service worker, sets up update listeners, and handles
   * controller changes. Automatically reloads the page when a new service
   * worker takes control.
   * 
   * @throws {Error} If service worker registration fails
   * 
   * @example
   * ```typescript
   * await pwaUtils.registerServiceWorker();
   * ```
   */
  async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      logger.warn('Service Worker not supported in this browser');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              this.notifyUpdateCallbacks(this.registration!);
            }
          });
        }
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });
    } catch (error) {
      logger.error('Service Worker registration failed', { error });
      throw error;
    }
  }

  /**
   * Handle messages from service worker
   * 
   * Processes messages received from the service worker, including
   * cache information, performance stats, and other service worker events.
   * 
   * @param message - Message received from service worker
   * 
   * @private
   */
  private handleServiceWorkerMessage(message: ServiceWorkerMessage): void {
    switch (message.type) {
      case 'CACHE_INFO':
        logger.debug('Cache info received from service worker', { data: message.data });
        break;
      case 'PERFORMANCE_STATS':
        logger.debug('Performance stats received from service worker', { data: message.data });
        break;
      case 'CACHE_SIZE':
        logger.debug('Cache size received from service worker', { data: message.data });
        break;
      default:
        logger.debug('Unknown message type from service worker', { type: message.type });
    }
  }

  /**
   * Send message to service worker using MessageChannel for response
   * 
   * Creates a MessageChannel to communicate with the service worker
   * and receive a response. The promise resolves with the response data
   * or rejects with an error if the service worker returns an error.
   * 
   * @param message - Message to send to service worker
   * @returns Promise resolving to the service worker's response
   * @throws {Error} If service worker is not active
   * 
   * @private
   */
  private async sendMessageToSW(message: ServiceWorkerMessage): Promise<unknown> {
    const registration = this.registration;
    if (!registration?.active) {
      throw new Error('Service Worker not active');
    }

    const activeWorker = registration.active;
    if (!activeWorker) {
      throw new Error('Service Worker not active');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      const timeout = setTimeout(() => {
        reject(new Error('Service worker message timeout'));
      }, 5000); // 5 second timeout

      messageChannel.port1.onmessage = (event) => {
        clearTimeout(timeout);
        if (event.data?.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };

      try {
        activeWorker.postMessage(message, [messageChannel.port2]);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Get cache information from service worker
   * 
   * Retrieves information about all caches including cache names
   * and entry counts for each cache.
   * 
   * @returns Promise resolving to cache information
   * @throws {Error} If service worker is not active or request fails
   * 
   * @example
   * ```typescript
   * const cacheInfo = await pwaUtils.getCacheInfo();
   * logger.info(`Found ${cacheInfo.cacheNames.length} caches`, { cacheCount: cacheInfo.cacheNames.length });
   * ```
   */
  async getCacheInfo(): Promise<CacheInfo> {
    const result = await this.sendMessageToSW({ type: 'GET_CACHE_INFO' });
    return result as CacheInfo;
  }

  /**
   * Get performance statistics from service worker
   * 
   * Retrieves performance metrics including cache hit/miss rates,
   * network request counts, and error statistics.
   * 
   * @returns Promise resolving to performance statistics
   * @throws {Error} If service worker is not active or request fails
   * 
   * @example
   * ```typescript
   * const stats = await pwaUtils.getPerformanceStats();
   * logger.info(`Cache hit rate: ${stats.hitRate}`);
   * ```
   */
  async getPerformanceStats(): Promise<PerformanceStats> {
    const result = await this.sendMessageToSW({ type: 'GET_PERFORMANCE_STATS' });
    return result as PerformanceStats;
  }

  /**
   * Clear specific cache by name
   * 
   * Sends a message to the service worker to clear a specific cache.
   * 
   * @param cacheName - Name of the cache to clear
   * @returns Promise that resolves when cache is cleared
   * @throws {Error} If service worker is not active or request fails
   * 
   * @example
   * ```typescript
   * await pwaUtils.clearCache('my-cache');
   * ```
   */
  async clearCache(cacheName: string): Promise<void> {
    await this.sendMessageToSW({ type: 'CLEAR_CACHE', data: { cacheName } });
  }

  /**
   * Clear all caches managed by the service worker
   * 
   * Removes all cached data. Use with caution as this will
   * force all resources to be re-downloaded.
   * 
   * @returns Promise that resolves when all caches are cleared
   * @throws {Error} If service worker is not active or request fails
   * 
   * @example
   * ```typescript
   * await pwaUtils.clearAllCaches();
   * ```
   */
  async clearAllCaches(): Promise<void> {
    await this.clearCache('all');
  }

  /**
   * Get total cache size in bytes
   * 
   * Retrieves the total size of all caches managed by the service worker.
   * 
   * @returns Promise resolving to cache size in bytes
   * @throws {Error} If service worker is not active or request fails
   * 
   * @example
   * ```typescript
   * const size = await pwaUtils.getCacheSize();
   * logger.info(`Cache size: ${(size / 1024 / 1024).toFixed(2)} MB`);
   * ```
   */
  async getCacheSize(): Promise<number> {
    const result = await this.sendMessageToSW({ type: 'GET_CACHE_SIZE' });
    if (typeof result === 'object' && result !== null && 'size' in result) {
      return (result as { size: number }).size;
    }
    throw new Error('Invalid cache size response');
  }

  /**
   * Cache additional URLs for offline access
   * 
   * Instructs the service worker to cache the specified URLs
   * for offline access.
   * 
   * @param urls - Array of URLs to cache
   * @returns Promise that resolves when URLs are queued for caching
   * @throws {Error} If service worker is not active or request fails
   * 
   * @example
   * ```typescript
   * await pwaUtils.cacheUrls(['/api/data', '/images/logo.png']);
   * ```
   */
  async cacheUrls(urls: string[]): Promise<void> {
    await this.sendMessageToSW({ type: 'CACHE_URLS', data: { urls } });
  }

  /**
   * Queue analytics event for offline sending
   * 
   * Queues an analytics event to be sent when the connection
   * is restored. Events are stored in IndexedDB and sent in batch.
   * 
   * @param event - Analytics event data to queue
   * @returns Promise that resolves when event is queued
   * @throws {Error} If service worker is not active or request fails
   * 
   * @example
   * ```typescript
   * await pwaUtils.queueAnalyticsEvent({
   *   action: 'button_click',
   *   page: '/dashboard'
   * });
   * ```
   */
  async queueAnalyticsEvent(event: Record<string, unknown>): Promise<void> {
    await this.sendMessageToSW({ type: 'QUEUE_ANALYTICS', data: event });
  }

  /**
   * Send all queued analytics events
   * 
   * Instructs the service worker to send all queued analytics
   * events that were stored while offline.
   * 
   * @returns Promise that resolves when send is initiated
   * @throws {Error} If service worker is not active or request fails
   * 
   * @example
   * ```typescript
   * // When connection is restored
   * await pwaUtils.sendQueuedAnalytics();
   * ```
   */
  async sendQueuedAnalytics(): Promise<void> {
    await this.sendMessageToSW({ type: 'SEND_QUEUED_ANALYTICS' });
  }

  /**
   * Check if app can be installed
   */
  canInstall(): boolean {
    return 'beforeinstallprompt' in window;
  }

  /**
   * Listen for install prompt
   */
  onInstallPrompt(callback: (event: Event) => void): void {
    window.addEventListener('beforeinstallprompt', callback);
  }

  /**
   * Trigger app installation
   */
  async installApp(): Promise<boolean> {
    if (!this.canInstall()) {
      return false;
    }

    // This would typically be called from a beforeinstallprompt event handler
    // For now, return false as we don't have the event
    return false;
  }

  /**
   * Check if the app is running as a PWA (installed app)
   * 
   * Detects if the app is running in standalone mode (installed as PWA)
   * by checking CSS media queries and iOS-specific navigator properties.
   * 
   * @returns True if running as PWA, false otherwise
   * 
   * @example
   * ```typescript
   * if (pwaUtils.isPWA()) {
   *   logger.info('Running as installed PWA');
   * }
   * ```
   */
  isPWA(): boolean {
    // Check for standalone display mode (standard PWA detection)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    
    // Check for iOS Safari standalone mode (legacy support)
    interface NavigatorWithStandalone extends Navigator {
      standalone?: boolean;
    }
    const nav = window.navigator as NavigatorWithStandalone;
    if (nav.standalone === true) {
      return true;
    }
    
    return false;
  }

  /**
   * Get the current PWA display mode
   * 
   * Determines how the app is being displayed:
   * - 'standalone': Running as installed PWA (no browser UI)
   * - 'minimal-ui': Minimal browser UI (address bar only)
   * - 'browser': Full browser experience
   * - 'unknown': Unable to determine
   * 
   * @returns Display mode string
   * 
   * @example
   * ```typescript
   * const mode = pwaUtils.getDisplayMode();
   * if (mode === 'standalone') {
   *   // Adjust UI for standalone mode
   * }
   * ```
   */
  getDisplayMode(): 'standalone' | 'minimal-ui' | 'browser' | 'unknown' {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'standalone';
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui';
    }
    if (window.matchMedia('(display-mode: browser)').matches) {
      return 'browser';
    }
    return 'unknown';
  }

  /**
   * Register for updates
   */
  onUpdate(callback: (registration: ServiceWorkerRegistration) => void): void {
    this.updateCallbacks.push(callback);
    if (this.updateAvailable && this.registration) {
      callback(this.registration);
    }
  }

  /**
   * Apply service worker update
   */
  async applyUpdate(): Promise<void> {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  /**
   * Get service worker state
   */
  getServiceWorkerState(): string {
    if (!this.registration) return 'not-registered';

    const state =
      this.registration.active?.state ||
      this.registration.waiting?.state ||
      this.registration.installing?.state;

    return state || 'unknown';
  }

  /**
   * Unregister service worker
   * 
   * Removes the service worker registration. This will disable
   * all PWA functionality including offline support and caching.
   * 
   * @returns Promise that resolves when service worker is unregistered
   * 
   * @example
   * ```typescript
   * await pwaUtils.unregister();
   * ```
   */
  async unregister(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister();
      this.registration = null;
    }
  }

  private notifyUpdateCallbacks(registration: ServiceWorkerRegistration): void {
    this.updateCallbacks.forEach((callback) => callback(registration));
  }
}

// Export singleton instance
export const pwaUtils = PWAUtils.getInstance();

// Export types
export type { CacheInfo, PerformanceStats, ServiceWorkerMessage };

// Export utility functions
export const registerServiceWorker = () => pwaUtils.registerServiceWorker();
export const getCacheInfo = () => pwaUtils.getCacheInfo();
export const getPerformanceStats = () => pwaUtils.getPerformanceStats();
export const clearCache = (cacheName: string) => pwaUtils.clearCache(cacheName);
export const clearAllCaches = () => pwaUtils.clearAllCaches();
export const canInstall = () => pwaUtils.canInstall();
export const isPWA = () => pwaUtils.isPWA();
export const getDisplayMode = () => pwaUtils.getDisplayMode();
