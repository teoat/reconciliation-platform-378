import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ServiceWorkerConfig {
  enabled: boolean;
  scope: string;
  updateInterval: number;
  cacheStrategy:
    | 'cacheFirst'
    | 'networkFirst'
    | 'staleWhileRevalidate'
    | 'networkOnly'
    | 'cacheOnly';
  cacheName: string;
  maxCacheSize: number;
  maxCacheAge: number;
  offlineFallback: boolean;
  backgroundSync: boolean;
  pushNotifications: boolean;
}

export interface ServiceWorkerState {
  registered: boolean;
  updated: boolean;
  offline: boolean;
  error: string | null;
}

export interface ServiceWorkerProviderProps {
  config?: Partial<ServiceWorkerConfig>;
  children: React.ReactNode;
}

export interface ServiceWorkerContextType {
  state: ServiceWorkerState;
  updateServiceWorker: () => void;
  unregisterServiceWorker: () => void;
}

// ============================================================================
// SERVICE WORKER CONFIGURATION
// ============================================================================

export const defaultServiceWorkerConfig: ServiceWorkerConfig = {
  enabled: true,
  scope: '/',
  updateInterval: 60000, // 1 minute
  cacheStrategy: 'staleWhileRevalidate',
  cacheName: 'reconciliation-app-cache',
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  offlineFallback: true,
  backgroundSync: true,
  pushNotifications: false,
};

// ============================================================================
// SERVICE WORKER UTILITIES
// ============================================================================

export const registerServiceWorker = async (
  scriptURL: string,
  config: Partial<ServiceWorkerConfig> = {}
): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }

  const finalConfig = { ...defaultServiceWorkerConfig, ...config };

  if (!finalConfig.enabled) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(scriptURL, {
      scope: finalConfig.scope,
    });

    console.log('Service worker registered successfully:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('New service worker version available');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
};

export const unregisterServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    await registration.unregister();
  }

  console.log('Service workers unregistered');
};

export const updateServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
};

// ============================================================================
// CACHE STRATEGIES
// ============================================================================

export const cacheStrategies = {
  cacheFirst: async (request: Request): Promise<Response> => {
    const cache = await caches.open(defaultServiceWorkerConfig.cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      throw error;
    }
  },

  networkFirst: async (request: Request): Promise<Response> => {
    const cache = await caches.open(defaultServiceWorkerConfig.cacheName);

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  },

  staleWhileRevalidate: async (request: Request): Promise<Response> => {
    const cache = await caches.open(defaultServiceWorkerConfig.cacheName);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    });

    return cachedResponse || fetchPromise;
  },

  networkOnly: async (request: Request): Promise<Response> => {
    return fetch(request);
  },

  cacheOnly: async (request: Request): Promise<Response> => {
    const cache = await caches.open(defaultServiceWorkerConfig.cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw new Error('Not found in cache');
  },
};

// ============================================================================
// REACT CONTEXT AND PROVIDER
// ============================================================================

const ServiceWorkerContext = createContext<ServiceWorkerContextType | null>(null);

export const ServiceWorkerProvider: React.FC<ServiceWorkerProviderProps> = ({
  config = {},
  children,
}) => {
  const [state, setState] = useState<ServiceWorkerState>({
    registered: false,
    updated: false,
    offline: !navigator.onLine,
    error: null,
  });

  const finalConfig = { ...defaultServiceWorkerConfig, ...config };

  // Register service worker
  useEffect(() => {
    if (!finalConfig.enabled) return;

    registerServiceWorker('/sw.js', finalConfig)
      .then((registration) => {
        if (registration) {
          setState((prev) => ({ ...prev, registered: true, error: null }));

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setState((prev) => ({ ...prev, updated: true }));
                }
              });
            }
          });

          // Listen for controller change (update activated)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          });
        }
      })
      .catch((error) => {
        setState((prev) => ({ ...prev, error: error.message }));
      });
  }, [finalConfig]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setState((prev) => ({ ...prev, offline: false }));
    const handleOffline = () => setState((prev) => ({ ...prev, offline: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for updates periodically
  useEffect(() => {
    if (!finalConfig.enabled || finalConfig.updateInterval <= 0) return;

    const interval = setInterval(async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      } catch (error) {
        console.error('Failed to check for service worker updates:', error);
      }
    }, finalConfig.updateInterval);

    return () => clearInterval(interval);
  }, [finalConfig.enabled, finalConfig.updateInterval]);

  const updateServiceWorkerHandler = useCallback(async () => {
    try {
      await updateServiceWorker();
    } catch (error) {
      setState((prev) => ({ ...prev, error: 'Failed to update service worker' }));
    }
  }, []);

  const unregisterServiceWorkerHandler = useCallback(async () => {
    try {
      await unregisterServiceWorker();
      setState({
        registered: false,
        updated: false,
        offline: !navigator.onLine,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, error: 'Failed to unregister service worker' }));
    }
  }, []);

  const contextValue: ServiceWorkerContextType = {
    state,
    updateServiceWorker: updateServiceWorkerHandler,
    unregisterServiceWorker: unregisterServiceWorkerHandler,
  };

  return (
    <ServiceWorkerContext.Provider value={contextValue}>
      {children}

      {/* Update notification */}
      {state.updated && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-3">
            <div>
              <p className="font-semibold">App Update Available</p>
              <p className="text-sm">A new version is ready to install.</p>
            </div>
            <button
              onClick={updateServiceWorkerHandler}
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100"
            >
              Update
            </button>
          </div>
        </div>
      )}

      {/* Offline notification */}
      {state.offline && (
        <div className="fixed bottom-4 left-4 bg-yellow-600 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-3">
            <div>
              <p className="font-semibold">You're Offline</p>
              <p className="text-sm">Some features may not be available.</p>
            </div>
          </div>
        </div>
      )}
    </ServiceWorkerContext.Provider>
  );
};

// ============================================================================
// HOOKS
// ============================================================================

export const useServiceWorker = (): ServiceWorkerContextType => {
  const context = useContext(ServiceWorkerContext);
  if (!context) {
    throw new Error('useServiceWorker must be used within a ServiceWorkerProvider');
  }
  return context;
};

export const useOfflineStatus = (): boolean => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
};

// ============================================================================
// BACKGROUND SYNC UTILITIES
// ============================================================================

export const requestBackgroundSync = async (tag: string): Promise<void> => {
  if (
    'serviceWorker' in navigator &&
    'sync' in (window as any).ServiceWorkerRegistration.prototype
  ) {
    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register(tag);
  }
};

export const getBackgroundSyncTags = async (): Promise<string[]> => {
  if (
    'serviceWorker' in navigator &&
    'sync' in (window as any).ServiceWorkerRegistration.prototype
  ) {
    const registration = await navigator.serviceWorker.ready;
    const tags = await (registration as any).sync.getTags();
    return tags;
  }
  return [];
};

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  const permission = await Notification.requestPermission();
  return permission;
};

export const subscribeToPushNotifications = async (
  vapidPublicKey: string
): Promise<PushSubscription | null> => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
  });

  return subscription;
};

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};
