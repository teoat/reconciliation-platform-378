// ============================================================================
// SERVICE WORKER UTILITIES - SINGLE SOURCE OF TRUTH
// ============================================================================

import React, { useState, useEffect, createContext, useContext } from 'react'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ServiceWorkerConfig {
  enabled: boolean
  scope: string
  updateInterval: number
  cacheStrategy: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate' | 'networkOnly' | 'cacheOnly'
  cacheName: string
  maxCacheSize: number
  maxCacheAge: number
  offlineFallback: boolean
  backgroundSync: boolean
  pushNotifications: boolean
}

export interface ServiceWorkerState {
  registered: boolean
  updated: boolean
  offline: boolean
  error: string | null
}

export interface CacheStrategy {
  name: string
  handler: (request: Request) => Promise<Response>
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
}

// ============================================================================
// SERVICE WORKER UTILITIES
// ============================================================================

// Register service worker
export const registerServiceWorker = async (
  config: Partial<ServiceWorkerConfig> = {}
): Promise<ServiceWorkerRegistration | null> => {
  const finalConfig = { ...defaultServiceWorkerConfig, ...config }
  
  if (!finalConfig.enabled || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: finalConfig.scope,
    })

    console.log('Service Worker registered successfully:', registration)
    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

// Unregister service worker
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    
    for (const registration of registrations) {
      await registration.unregister()
    }
    
    console.log('Service Worker unregistered successfully')
    return true
  } catch (error) {
    console.error('Service Worker unregistration failed:', error)
    return false
  }
}

// Check if service worker is supported
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator
}

// Get service worker registration
export const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    return null
  }

  try {
    return await navigator.serviceWorker.ready
  } catch (error) {
    console.error('Failed to get service worker registration:', error)
    return null
  }
}

// Send message to service worker
export const sendMessageToServiceWorker = async (
  message: any
): Promise<any> => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker not supported')
  }

  const registration = await navigator.serviceWorker.ready
  
  if (!registration.active) {
    throw new Error('Service Worker not active')
  }

  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel()
    
    messageChannel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(new Error(event.data.error))
      } else {
        resolve(event.data)
      }
    }
    
    registration.active!.postMessage(message, [messageChannel.port2])
  })
}

// ============================================================================
// CACHE STRATEGIES
// ============================================================================

export const cacheStrategies: Record<string, CacheStrategy> = {
  cacheFirst: {
    name: 'cacheFirst',
    handler: async (request: Request) => {
      const cache = await caches.open(defaultServiceWorkerConfig.cacheName)
      const cachedResponse = await cache.match(request)
      
      if (cachedResponse) {
        return cachedResponse
      }
      
      const networkResponse = await fetch(request)
      cache.put(request, networkResponse.clone())
      return networkResponse
    },
  },
  
  networkFirst: {
    name: 'networkFirst',
    handler: async (request: Request) => {
      try {
        const networkResponse = await fetch(request)
        const cache = await caches.open(defaultServiceWorkerConfig.cacheName)
        cache.put(request, networkResponse.clone())
        return networkResponse
      } catch (error) {
        const cache = await caches.open(defaultServiceWorkerConfig.cacheName)
        const cachedResponse = await cache.match(request)
        
        if (cachedResponse) {
          return cachedResponse
        }
        
        throw error
      }
    },
  },
  
  staleWhileRevalidate: {
    name: 'staleWhileRevalidate',
    handler: async (request: Request) => {
      const cache = await caches.open(defaultServiceWorkerConfig.cacheName)
      const cachedResponse = await cache.match(request)
      
      const fetchPromise = fetch(request).then((networkResponse) => {
        cache.put(request, networkResponse.clone())
        return networkResponse
      })
      
      return cachedResponse || fetchPromise
    },
  },
  
  networkOnly: {
    name: 'networkOnly',
    handler: async (request: Request) => {
      return fetch(request)
    },
  },
  
  cacheOnly: {
    name: 'cacheOnly',
    handler: async (request: Request) => {
      const cache = await caches.open(defaultServiceWorkerConfig.cacheName)
      const cachedResponse = await cache.match(request)
      
      if (cachedResponse) {
        return cachedResponse
      }
      
      throw new Error('No cached response available')
    },
  },
}

// ============================================================================
// SERVICE WORKER HOOK
// ============================================================================

export const useServiceWorker = (
  config: Partial<ServiceWorkerConfig> = {}
) => {
  const [state, setState] = useState<ServiceWorkerState>({
    registered: false,
    updated: false,
    offline: false,
    error: null,
  })

  const finalConfig = { ...defaultServiceWorkerConfig, ...config }

  // Register service worker
  useEffect(() => {
    if (!finalConfig.enabled) return

    const registerSW = async () => {
      try {
        const registration = await registerServiceWorker(finalConfig)
        
        if (registration) {
          setState(prev => ({ ...prev, registered: true }))
          
          // Check for updates
          if (registration.waiting) {
            setState(prev => ({ ...prev, updated: true }))
          }
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setState(prev => ({ ...prev, updated: true }))
                }
              })
            }
          })
        }
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }))
      }
    }

    registerSW()
  }, [finalConfig])

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, offline: false }))
    const handleOffline = () => setState(prev => ({ ...prev, offline: true }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Update service worker
  const updateServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return

    try {
      const registration = await navigator.serviceWorker.ready
      
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Update failed' 
      }))
    }
  }, [])

  // Skip waiting
  const skipWaiting = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return

    try {
      const registration = await navigator.serviceWorker.ready
      
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Skip waiting failed' 
      }))
    }
  }, [])

  return {
    ...state,
    updateServiceWorker,
    skipWaiting,
  }
}

// ============================================================================
// SERVICE WORKER COMPONENT
// ============================================================================

export interface ServiceWorkerComponentProps {
  config?: Partial<ServiceWorkerConfig>
  onUpdate?: () => void
  onError?: (error: string) => void
  children?: React.ReactNode
}

export const ServiceWorkerComponent: React.FC<ServiceWorkerComponentProps> = ({
  config = {},
  onUpdate,
  onError,
  children,
}) => {
  const { registered, updated, offline, error, updateServiceWorker } = useServiceWorker(config)

  // Handle update callback
  useEffect(() => {
    if (updated) {
      onUpdate?.()
    }
  }, [updated, onUpdate])

  // Handle error callback
  useEffect(() => {
    if (error) {
      onError?.(error)
    }
  }, [error, onError])

  return (
    <>
      {children}
      
      {/* Update notification */}
      {updated && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-3">
            <div>
              <p className="font-semibold">App Update Available</p>
              <p className="text-sm">A new version is ready to install.</p>
            </div>
            <button
              onClick={updateServiceWorker}
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100"
            >
              Update
            </button>
          </div>
        </div>
      )}
      
      {/* Offline notification */}
      {offline && (
        <div className="fixed top-4 right-4 bg-yellow-600 text-white p-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold">You're offline</span>
          </div>
        </div>
      )}
    </>
  )
}

// ============================================================================
// SERVICE WORKER PROVIDER
// ============================================================================

export interface ServiceWorkerProviderProps {
  config?: Partial<ServiceWorkerConfig>
  children: React.ReactNode
}

export const ServiceWorkerProvider: React.FC<ServiceWorkerProviderProps> = ({
  config = {},
  children,
}) => {
  const { registered, updated, offline, error, updateServiceWorker } = useServiceWorker(config)

  return (
    <ServiceWorkerContext.Provider value={{
      registered,
      updated,
      offline,
      error,
      updateServiceWorker,
    }}>
      {children}
    </ServiceWorkerContext.Provider>
  )
}

// ============================================================================
// SERVICE WORKER CONTEXT
// ============================================================================

export interface ServiceWorkerContextType {
  registered: boolean
  updated: boolean
  offline: boolean
  error: string | null
  updateServiceWorker: () => Promise<void>
}

export const ServiceWorkerContext = React.createContext<ServiceWorkerContextType>({
  registered: false,
  updated: false,
  offline: false,
  error: null,
  updateServiceWorker: async () => {},
})

// ============================================================================
// SERVICE WORKER HOOK
// ============================================================================

export const useServiceWorkerContext = (): ServiceWorkerContextType => {
  const context = React.useContext(ServiceWorkerContext)
  
  if (!context) {
    throw new Error('useServiceWorkerContext must be used within ServiceWorkerProvider')
  }
  
  return context
}

// ============================================================================
// EXPORT ALL SERVICE WORKER UTILITIES
// ============================================================================

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  isServiceWorkerSupported,
  getServiceWorkerRegistration,
  sendMessageToServiceWorker,
  cacheStrategies,
  useServiceWorker,
  ServiceWorkerComponent,
  ServiceWorkerProvider,
  useServiceWorkerContext,
  defaultServiceWorkerConfig,
}
