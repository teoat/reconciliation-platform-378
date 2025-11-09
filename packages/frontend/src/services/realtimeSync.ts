import React, { useState, useEffect } from 'react'
import { useWebSocketContext } from './WebSocketProvider'

export interface SyncConfig {
  enabled: boolean
  interval: number
  batchSize: number
  retryAttempts: number
}

export interface SyncData {
  id: string
  type: string
  data: any
  timestamp: Date
  version: number
}

export interface SyncStatus {
  syncing: boolean
  lastSync: Date | null
  pendingChanges: number
  error: string | null
}

class RealTimeSyncService {
  private config: SyncConfig
  private status: SyncStatus
  private pendingChanges: Map<string, SyncData> = new Map()
  private syncTimer: NodeJS.Timeout | null = null
  private listeners: Set<(status: SyncStatus) => void> = new Set()

  constructor(config: SyncConfig) {
    this.config = config
    this.status = {
      syncing: false,
      lastSync: null,
      pendingChanges: 0,
      error: null
    }
  }

  // Start synchronization
  start(): void {
    if (!this.config.enabled) return

    this.syncTimer = setInterval(() => {
      this.syncPendingChanges()
    }, this.config.interval)

    // Initial sync
    this.syncPendingChanges()
  }

  // Stop synchronization
  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }

  // Add data to sync queue
  queueChange(data: SyncData): void {
    this.pendingChanges.set(data.id, data)
    this.updateStatus()
  }

  // Remove data from sync queue
  removeChange(id: string): void {
    this.pendingChanges.delete(id)
    this.updateStatus()
  }

  // Get sync status
  getStatus(): SyncStatus {
    return { ...this.status }
  }

  // Subscribe to status changes
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Sync pending changes
  private async syncPendingChanges(): Promise<void> {
    if (this.pendingChanges.size === 0) return

    this.status.syncing = true
    this.status.error = null
    this.updateStatus()

    try {
      const changes = Array.from(this.pendingChanges.values())
      const batches = this.createBatches(changes, this.config.batchSize)

      for (const batch of batches) {
        await this.syncBatch(batch)
      }

      this.status.lastSync = new Date()
      this.status.syncing = false
      this.updateStatus()

    } catch (error) {
      this.status.syncing = false
      this.status.error = error instanceof Error ? error.message : 'Sync failed'
      this.updateStatus()
    }
  }

  // Create batches from changes
  private createBatches(changes: SyncData[], batchSize: number): SyncData[][] {
    const batches: SyncData[][] = []
    for (let i = 0; i < changes.length; i += batchSize) {
      batches.push(changes.slice(i, i + batchSize))
    }
    return batches
  }

  // Sync a batch of changes
  private async syncBatch(batch: SyncData[]): Promise<void> {
    // This would integrate with your WebSocket client
    // For now, we'll simulate the sync
    return new Promise((resolve) => {
      setTimeout(() => {
        // Remove synced changes from pending
        batch.forEach(change => {
          this.pendingChanges.delete(change.id)
        })
        resolve()
      }, 100)
    })
  }

  // Update status and notify listeners
  private updateStatus(): void {
    this.status.pendingChanges = this.pendingChanges.size
    this.listeners.forEach(listener => listener(this.status))
  }
}

// React hook for real-time sync
export const useRealTimeSync = (config: SyncConfig) => {
  const [status, setStatus] = useState<SyncStatus>({
    syncing: false,
    lastSync: null,
    pendingChanges: 0,
    error: null
  })

  const [syncService] = useState(() => new RealTimeSyncService(config))

  useEffect(() => {
    const unsubscribe = syncService.subscribe(setStatus)
    syncService.start()

    return () => {
      unsubscribe()
      syncService.stop()
    }
  }, [syncService])

  const queueChange = (data: SyncData) => {
    syncService.queueChange(data)
  }

  const removeChange = (id: string) => {
    syncService.removeChange(id)
  }

  return {
    status,
    queueChange,
    removeChange
  }
}

// Hook for reconciliation real-time updates
export const useReconciliationSync = () => {
  const { subscribe, unsubscribe, emit, isConnected } = useWebSocketContext()
  const [records, setRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isConnected()) return

    // Subscribe to reconciliation updates
    const updateSubscriptionId = subscribe('reconciliation-update', (data) => {
      if (data.type === 'record-updated') {
        setRecords(prev => prev.map(record => 
          record.id === data.recordId 
            ? { ...record, ...data.changes }
            : record
        ))
      } else if (data.type === 'record-added') {
        setRecords(prev => [...prev, data.record])
      } else if (data.type === 'record-removed') {
        setRecords(prev => prev.filter(record => record.id !== data.recordId))
      }
    })

    // Subscribe to batch updates
    const batchSubscriptionId = subscribe('reconciliation-batch-update', (data) => {
      setRecords(data.records)
    })

    return () => {
      unsubscribe('reconciliation-update', updateSubscriptionId)
      unsubscribe('reconciliation-batch-update', batchSubscriptionId)
    }
  }, [subscribe, unsubscribe, isConnected])

  const updateRecord = (recordId: string, changes: any) => {
    emit('update-record', { recordId, changes })
  }

  const addRecord = (record: any) => {
    emit('add-record', { record })
  }

  const removeRecord = (recordId: string) => {
    emit('remove-record', { recordId })
  }

  const refreshRecords = () => {
    setIsLoading(true)
    emit('refresh-records')
    
    // Listen for refresh response
    const refreshSubscriptionId = subscribe('records-refreshed', (data) => {
      setRecords(data.records)
      setIsLoading(false)
    })

    // Cleanup after 5 seconds
    setTimeout(() => {
      unsubscribe('records-refreshed', refreshSubscriptionId)
      setIsLoading(false)
    }, 5000)
  }

  return {
    records,
    isLoading,
    updateRecord,
    addRecord,
    removeRecord,
    refreshRecords
  }
}

// Hook for real-time notifications
export const useRealtimeNotifications = () => {
  const { subscribe, unsubscribe, isConnected } = useWebSocketContext()
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (!isConnected()) return

    const subscriptionId = subscribe('notification', (data) => {
      setNotifications(prev => [...prev, { ...data, timestamp: new Date() }])
    })

    return () => {
      unsubscribe('notification', subscriptionId)
    }
  }, [subscribe, unsubscribe, isConnected])

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    ))
  }

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  return {
    notifications,
    markAsRead,
    clearNotification,
    clearAllNotifications
  }
}

// Hook for real-time collaboration
export const useRealtimeCollaboration = (roomId: string) => {
  const { joinRoom, leaveRoom, subscribe, unsubscribe, emit, isConnected } = useWebSocketContext()
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    if (!isConnected() || !roomId) return

    // Join the collaboration room
    joinRoom(roomId)

    // Subscribe to collaboration events
    const collaboratorsSubscriptionId = subscribe('collaborators-update', (data) => {
      setCollaborators(data.collaborators || [])
    })

    const activitiesSubscriptionId = subscribe('activity-update', (data) => {
      setActivities(prev => [...prev, { ...data, timestamp: new Date() }])
    })

    const cursorSubscriptionId = subscribe('cursor-update', (data) => {
      // Handle cursor updates
      console.log('Cursor update:', data)
    })

    return () => {
      unsubscribe('collaborators-update', collaboratorsSubscriptionId)
      unsubscribe('activity-update', activitiesSubscriptionId)
      unsubscribe('cursor-update', cursorSubscriptionId)
      leaveRoom(roomId)
    }
  }, [roomId, joinRoom, leaveRoom, subscribe, unsubscribe, isConnected])

  const sendActivity = (activity: any) => {
    emit('activity', { roomId, activity })
  }

  const updateCursor = (position: any) => {
    emit('cursor-update', { roomId, position })
  }

  const sendMessage = (message: string) => {
    emit('chat-message', { roomId, message })
  }

  return {
    collaborators,
    activities,
    sendActivity,
    updateCursor,
    sendMessage
  }
}

export default RealTimeSyncService
