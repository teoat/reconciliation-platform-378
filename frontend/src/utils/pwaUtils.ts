/**
import { logger } from '../services/logger'; * PWA Utilities for Service Worker Registration and Management
 */

interface ServiceWorkerMessage {
  type: string;
  data?: any;
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
  private serviceWorker: ServiceWorker | null = null;
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
  async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      // logger.warn('Service Worker not supported');
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
      // logger.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(message: ServiceWorkerMessage): void {
    switch (message.type) {
      case 'CACHE_INFO':
        
        break;
      case 'PERFORMANCE_STATS':
        
        break;
      case 'CACHE_SIZE':
        
        break;
      default:
        
    }
  }

  /**
   * Send message to service worker
   */
  private async sendMessageToSW(message: ServiceWorkerMessage): Promise<any> {
    if (!this.registration?.active) {
      throw new Error('Service Worker not active');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(event.data.error);
        } else {
          resolve(event.data);
        }
      };

      this.registration!.active!.postMessage(message, [messageChannel.port2]);
    });
  }

  /**
   * Get cache information
   */
  async getCacheInfo(): Promise<CacheInfo> {
    return this.sendMessageToSW({ type: 'GET_CACHE_INFO' });
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(): Promise<PerformanceStats> {
    return this.sendMessageToSW({ type: 'GET_PERFORMANCE_STATS' });
  }

  /**
   * Clear specific cache
   */
  async clearCache(cacheName: string): Promise<void> {
    return this.sendMessageToSW({ type: 'CLEAR_CACHE', data: { cacheName } });
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    return this.clearCache('all');
  }

  /**
   * Get cache size
   */
  async getCacheSize(): Promise<number> {
    const result = await this.sendMessageToSW({ type: 'GET_CACHE_SIZE' });
    return result.size;
  }

  /**
   * Cache additional URLs
   */
  async cacheUrls(urls: string[]): Promise<void> {
    return this.sendMessageToSW({ type: 'CACHE_URLS', data: { urls } });
  }

  /**
   * Queue analytics event for offline sending
   */
  async queueAnalyticsEvent(event: any): Promise<void> {
    return this.sendMessageToSW({ type: 'QUEUE_ANALYTICS', data: event });
  }

  /**
   * Send queued analytics
   */
  async sendQueuedAnalytics(): Promise<void> {
    return this.sendMessageToSW({ type: 'SEND_QUEUED_ANALYTICS' });
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
   * Check if running as PWA
   */
  isPWA(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  /**
   * Get PWA display mode
   */
  getDisplayMode(): string {
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
   */
  async unregister(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister();
      this.registration = null;
      this.serviceWorker = null;
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
