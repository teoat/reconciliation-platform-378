// PWA Service for Offline Support and Progressive Web App Features
// Manages service worker registration, offline data, and PWA functionality

import React from 'react'
import { APP_CONFIG } from '../constants'

// PWA configuration
interface PWAConfig {
  enabled: boolean
  serviceWorkerPath: string
  updateCheckInterval: number
  offlineDataRetention: number
  syncInterval: number
  notificationPermission: boolean
  installPrompt: boolean
}

// Offline data interface
interface OfflineData {
  id: string
  type: 'create' | 'update' | 'delete'
  endpoint: string
  data: any
  timestamp: Date
  retryCount: number
  maxRetries: number
}

// PWA status interface
interface PWAStatus {
  isOnline: boolean
  isInstalled: boolean
  canInstall: boolean
  hasUpdate: boolean
  serviceWorkerReady: boolean
  offlineDataCount: number
  lastSync: Date | null
}

class PWAService {
  private static instance: PWAService
  private config: PWAConfig
  private status: PWAStatus
  private offlineData: OfflineData[] = []
  private updateAvailable = false
  private installPrompt: any = null
  private listeners: Map<string, Function[]> = new Map()

  public static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService()
    }
    return PWAService.instance
  }

  constructor() {
    this.config = {
      enabled: true,
      serviceWorkerPath: '/sw.js',
      updateCheckInterval: 30000, // 30 seconds
      offlineDataRetention: 7 * 24 * 60 * 60 * 1000, // 7 days
      syncInterval: 60000, // 1 minute
      notificationPermission: false,
      installPrompt: true,
    }

    this.status = {
      isOnline: navigator.onLine,
      isInstalled: this.checkIfInstalled(),
      canInstall: false,
      hasUpdate: false,
      serviceWorkerReady: false,
      offlineDataCount: 0,
      lastSync: null,
    }

    this.init()
  }

  private async init(): Promise<void> {
    if (!this.config.enabled) return

    try {
      // Register service worker
      await this.registerServiceWorker()
      
      // Setup event listeners
      this.setupEventListeners()
      
      // Load offline data
      await this.loadOfflineData()
      
      // Setup periodic sync
      this.setupPeriodicSync()
      
      // Check for updates
      this.checkForUpdates()
      
      console.log('PWA Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize PWA Service:', error)
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported')
      return
    }

    try {
      const registration = await navigator.serviceWorker.register(this.config.serviceWorkerPath)
      
      console.log('Service Worker registered:', registration.scope)
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true
              this.status.hasUpdate = true
              this.emit('updateAvailable')
            }
          })
        }
      })

      // Handle service worker ready
      if (registration.active) {
        this.status.serviceWorkerReady = true
        this.emit('serviceWorkerReady')
      }

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data)
      })

    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }

  private setupEventListeners(): void {
    // Online/offline status
    window.addEventListener('online', () => {
      this.status.isOnline = true
      this.emit('online')
      this.syncOfflineData()
    })

    window.addEventListener('offline', () => {
      this.status.isOnline = false
      this.emit('offline')
    })

    // Install prompt
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault()
      this.installPrompt = event
      this.status.canInstall = true
      this.emit('canInstall')
    })

    // App installed
    window.addEventListener('appinstalled', () => {
      this.status.isInstalled = true
      this.status.canInstall = false
      this.installPrompt = null
      this.emit('installed')
    })

    // Visibility change (for background sync)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.status.isOnline) {
        this.syncOfflineData()
      }
    })
  }

  private async loadOfflineData(): Promise<void> {
    try {
      const data = localStorage.getItem('pwa_offline_data')
      if (data) {
        this.offlineData = JSON.parse(data).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
        this.status.offlineDataCount = this.offlineData.length
      }
    } catch (error) {
      console.error('Failed to load offline data:', error)
      this.offlineData = []
    }
  }

  private async saveOfflineData(): Promise<void> {
    try {
      localStorage.setItem('pwa_offline_data', JSON.stringify(this.offlineData))
      this.status.offlineDataCount = this.offlineData.length
    } catch (error) {
      console.error('Failed to save offline data:', error)
    }
  }

  private setupPeriodicSync(): void {
    setInterval(() => {
      if (this.status.isOnline) {
        this.syncOfflineData()
      }
    }, this.config.syncInterval)
  }

  private checkForUpdates(): void {
    setInterval(() => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' })
      }
    }, this.config.updateCheckInterval)
  }

  private handleServiceWorkerMessage(data: any): void {
    switch (data.type) {
      case 'CACHE_SIZE':
        this.emit('cacheSize', data.size)
        break
      case 'UPDATE_AVAILABLE':
        this.updateAvailable = true
        this.status.hasUpdate = true
        this.emit('updateAvailable')
        break
      default:
        console.log('Unknown service worker message:', data.type)
    }
  }

  // Public methods
  public async install(): Promise<boolean> {
    if (!this.installPrompt) return false

    try {
      const result = await this.installPrompt.prompt()
      const choiceResult = await result.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        this.status.isInstalled = true
        this.status.canInstall = false
        this.installPrompt = null
        this.emit('installed')
        return true
      }
      
      return false
    } catch (error) {
      console.error('Install prompt failed:', error)
      return false
    }
  }

  public async update(): Promise<void> {
    if (!this.updateAvailable) return

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
        
        // Reload page after update
        window.location.reload()
      }
    } catch (error) {
      console.error('Update failed:', error)
    }
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported')
      return false
    }

    if (Notification.permission === 'granted') {
      this.config.notificationPermission = true
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      this.config.notificationPermission = permission === 'granted'
      return this.config.notificationPermission
    } catch (error) {
      console.error('Notification permission request failed:', error)
      return false
    }
  }

  public async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.config.notificationPermission) {
      const hasPermission = await this.requestNotificationPermission()
      if (!hasPermission) return
    }

    try {
      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        ...options,
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }

  public async cacheUrl(url: string): Promise<void> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_URLS',
        urls: [url],
      })
    }
  }

  public async clearCache(cacheName?: string): Promise<void> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE',
        cacheName,
      })
    }
  }

  public async getCacheSize(): Promise<number> {
    return new Promise((resolve) => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel()
        
        messageChannel.port1.onmessage = (event) => {
          if (event.data.type === 'CACHE_SIZE') {
            resolve(event.data.size)
          }
        }
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_SIZE' },
          [messageChannel.port2]
        )
      } else {
        resolve(0)
      }
    })
  }

  public addOfflineAction(type: 'create' | 'update' | 'delete', endpoint: string, data: any): void {
    const offlineAction: OfflineData = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      endpoint,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3,
    }

    this.offlineData.push(offlineAction)
    this.saveOfflineData()
    this.emit('offlineActionAdded', offlineAction)

    // Try to sync immediately if online
    if (this.status.isOnline) {
      this.syncOfflineData()
    }
  }

  public async syncOfflineData(): Promise<void> {
    if (!this.status.isOnline || this.offlineData.length === 0) return

    const actionsToSync = [...this.offlineData]
    const syncedActions: string[] = []

    for (const action of actionsToSync) {
      try {
        await this.syncAction(action)
        syncedActions.push(action.id)
      } catch (error) {
        console.error('Failed to sync action:', error)
        action.retryCount++
        
        if (action.retryCount >= action.maxRetries) {
          syncedActions.push(action.id)
          this.emit('offlineActionFailed', action)
        }
      }
    }

    // Remove synced actions
    this.offlineData = this.offlineData.filter(action => !syncedActions.includes(action.id))
    this.saveOfflineData()
    this.status.lastSync = new Date()
    this.emit('offlineDataSynced', syncedActions.length)
  }

  private async syncAction(action: OfflineData): Promise<void> {
    const options: RequestInit = {
      method: action.type === 'create' ? 'POST' : action.type === 'update' ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (action.data) {
      options.body = JSON.stringify(action.data)
    }

    const response = await fetch(action.endpoint, options)
    
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`)
    }
  }

  public getStatus(): PWAStatus {
    return { ...this.status }
  }

  public getOfflineDataCount(): number {
    return this.offlineData.length
  }

  public clearOfflineData(): void {
    this.offlineData = []
    this.saveOfflineData()
    this.emit('offlineDataCleared')
  }

  // Event system
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  public off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(...args))
    }
  }

  private checkIfInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://')
  }
}

// React hook for PWA functionality
export const usePWA = () => {
  const [status, setStatus] = React.useState<PWAStatus>(() => {
    const pwa = PWAService.getInstance()
    return pwa.getStatus()
  })

  React.useEffect(() => {
    const pwa = PWAService.getInstance()
    
    const updateStatus = () => {
      setStatus(pwa.getStatus())
    }

    // Listen for status changes
    pwa.on('online', updateStatus)
    pwa.on('offline', updateStatus)
    pwa.on('canInstall', updateStatus)
    pwa.on('installed', updateStatus)
    pwa.on('updateAvailable', updateStatus)
    pwa.on('serviceWorkerReady', updateStatus)
    pwa.on('offlineDataSynced', updateStatus)

    return () => {
      pwa.off('online', updateStatus)
      pwa.off('offline', updateStatus)
      pwa.off('canInstall', updateStatus)
      pwa.off('installed', updateStatus)
      pwa.off('updateAvailable', updateStatus)
      pwa.off('serviceWorkerReady', updateStatus)
      pwa.off('offlineDataSynced', updateStatus)
    }
  }, [])

  const pwa = PWAService.getInstance()

  return {
    status,
    install: pwa.install.bind(pwa),
    update: pwa.update.bind(pwa),
    requestNotificationPermission: pwa.requestNotificationPermission.bind(pwa),
    sendNotification: pwa.sendNotification.bind(pwa),
    cacheUrl: pwa.cacheUrl.bind(pwa),
    clearCache: pwa.clearCache.bind(pwa),
    getCacheSize: pwa.getCacheSize.bind(pwa),
    addOfflineAction: pwa.addOfflineAction.bind(pwa),
    syncOfflineData: pwa.syncOfflineData.bind(pwa),
    getOfflineDataCount: pwa.getOfflineDataCount.bind(pwa),
    clearOfflineData: pwa.clearOfflineData.bind(pwa),
  }
}

// Export singleton instance
export const pwaService = PWAService.getInstance()

export default pwaService

