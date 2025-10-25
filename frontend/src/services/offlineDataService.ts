// Offline Data Persistence Service - Handles offline data storage and recovery
// Implements comprehensive offline data management with auto-save and recovery

export interface OfflineData {
  id: string
  type: 'form' | 'upload' | 'reconciliation' | 'workflow' | 'settings'
  data: any
  timestamp: Date
  version: number
  projectId?: string
  userId?: string
  component?: string
  isDirty: boolean
  lastSaved?: Date
}

export interface OfflineConfig {
  enableAutoSave: boolean
  autoSaveInterval: number // milliseconds
  maxStorageSize: number // bytes
  enableRecovery: boolean
  recoveryPromptDelay: number // milliseconds
  enableSync: boolean
  syncOnReconnect: boolean
}

export interface RecoveryPrompt {
  id: string
  type: 'data_recovery' | 'sync_conflict' | 'offline_changes'
  title: string
  message: string
  data: OfflineData[]
  actions: {
    accept: () => void
    reject: () => void
    review: () => void
  }
  timestamp: Date
}

class OfflineDataService {
  private static instance: OfflineDataService
  private config: OfflineConfig
  private storage: Map<string, OfflineData> = new Map()
  private recoveryPrompts: RecoveryPrompt[] = []
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map()
  private onlineStatus: boolean = navigator.onLine
  private listeners: Map<string, Function[]> = new Map()

  public static getInstance(): OfflineDataService {
    if (!OfflineDataService.instance) {
      OfflineDataService.instance = new OfflineDataService()
    }
    return OfflineDataService.instance
  }

  constructor() {
    this.config = {
      enableAutoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      maxStorageSize: 50 * 1024 * 1024, // 50MB
      enableRecovery: true,
      recoveryPromptDelay: 2000, // 2 seconds
      enableSync: true,
      syncOnReconnect: true
    }

    this.initializeEventListeners()
    this.loadStoredData()
  }

  private initializeEventListeners(): void {
    // Network status listeners
    window.addEventListener('online', () => {
      this.onlineStatus = true
      this.handleReconnection()
    })

    window.addEventListener('offline', () => {
      this.onlineStatus = false
      this.handleDisconnection()
    })

    // Before unload listener for emergency save
    window.addEventListener('beforeunload', (event) => {
      this.emergencySave()
    })

    // Visibility change listener for auto-save
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.autoSaveAll()
      }
    })
  }

  private loadStoredData(): void {
    try {
      const stored = localStorage.getItem('offline_data')
      if (stored) {
        const data = JSON.parse(stored)
        this.storage = new Map(data)
      }
    } catch (error) {
      console.error('Failed to load offline data:', error)
    }
  }

  private saveStoredData(): void {
    try {
      const data = Array.from(this.storage.entries())
      localStorage.setItem('offline_data', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save offline data:', error)
    }
  }

  public saveData(
    id: string,
    type: OfflineData['type'],
    data: any,
    options: {
      projectId?: string
      userId?: string
      component?: string
      enableAutoSave?: boolean
    } = {}
  ): OfflineData {
    const existingData = this.storage.get(id)
    const version = existingData ? existingData.version + 1 : 1

    const offlineData: OfflineData = {
      id,
      type,
      data,
      timestamp: new Date(),
      version,
      projectId: options.projectId,
      userId: options.userId,
      component: options.component,
      isDirty: true,
      lastSaved: new Date()
    }

    this.storage.set(id, offlineData)
    this.saveStoredData()

    // Set up auto-save if enabled
    if (options.enableAutoSave !== false && this.config.enableAutoSave) {
      this.setupAutoSave(id)
    }

    this.emit('dataSaved', offlineData)
    return offlineData
  }

  public getData(id: string): OfflineData | undefined {
    return this.storage.get(id)
  }

  public getAllData(type?: OfflineData['type']): OfflineData[] {
    const data = Array.from(this.storage.values())
    return type ? data.filter(item => item.type === type) : data
  }

  public updateData(id: string, updates: Partial<OfflineData>): OfflineData | undefined {
    const existing = this.storage.get(id)
    if (!existing) return undefined

    const updated: OfflineData = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      timestamp: new Date(),
      isDirty: true
    }

    this.storage.set(id, updated)
    this.saveStoredData()
    this.emit('dataUpdated', updated)
    return updated
  }

  public deleteData(id: string): boolean {
    const deleted = this.storage.delete(id)
    if (deleted) {
      this.saveStoredData()
      this.clearAutoSave(id)
      this.emit('dataDeleted', id)
    }
    return deleted
  }

  public clearData(type?: OfflineData['type']): void {
    if (type) {
      const keysToDelete = Array.from(this.storage.keys()).filter(
        key => this.storage.get(key)?.type === type
      )
      keysToDelete.forEach(key => this.storage.delete(key))
    } else {
      this.storage.clear()
    }
    this.saveStoredData()
    this.emit('dataCleared', type)
  }

  private setupAutoSave(id: string): void {
    this.clearAutoSave(id)
    
    const timer = setInterval(() => {
      const data = this.storage.get(id)
      if (data && data.isDirty) {
        this.autoSaveData(id)
      }
    }, this.config.autoSaveInterval)

    this.autoSaveTimers.set(id, timer)
  }

  private clearAutoSave(id: string): void {
    const timer = this.autoSaveTimers.get(id)
    if (timer) {
      clearInterval(timer)
      this.autoSaveTimers.delete(id)
    }
  }

  private autoSaveData(id: string): void {
    const data = this.storage.get(id)
    if (!data || !data.isDirty) return

    const updated: OfflineData = {
      ...data,
      lastSaved: new Date(),
      isDirty: false
    }

    this.storage.set(id, updated)
    this.saveStoredData()
    this.emit('autoSaved', updated)
  }

  private autoSaveAll(): void {
    this.storage.forEach((data, id) => {
      if (data.isDirty) {
        this.autoSaveData(id)
      }
    })
  }

  private emergencySave(): void {
    this.autoSaveAll()
  }

  private handleDisconnection(): void {
    this.emit('offline', { timestamp: new Date() })
    
    // Show offline indicator
    this.showOfflineIndicator()
  }

  private handleReconnection(): void {
    this.emit('online', { timestamp: new Date() })
    
    // Hide offline indicator
    this.hideOfflineIndicator()
    
    // Handle recovery prompts
    if (this.config.enableRecovery) {
      setTimeout(() => {
        this.showRecoveryPrompts()
      }, this.config.recoveryPromptDelay)
    }

    // Sync data if enabled
    if (this.config.syncOnReconnect) {
      this.syncOfflineData()
    }
  }

  private showOfflineIndicator(): void {
    // Create or update offline indicator
    let indicator = document.getElementById('offline-indicator')
    if (!indicator) {
      indicator = document.createElement('div')
      indicator.id = 'offline-indicator'
      indicator.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      indicator.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          <span>Working offline</span>
        </div>
      `
      document.body.appendChild(indicator)
    }
  }

  private hideOfflineIndicator(): void {
    const indicator = document.getElementById('offline-indicator')
    if (indicator) {
      indicator.remove()
    }
  }

  private showRecoveryPrompts(): void {
    const dirtyData = this.getAllData().filter(data => data.isDirty)
    
    if (dirtyData.length > 0) {
      const prompt: RecoveryPrompt = {
        id: `recovery_${Date.now()}`,
        type: 'data_recovery',
        title: 'Recover Unsaved Changes',
        message: `You have ${dirtyData.length} unsaved changes from when you were offline. Would you like to recover them?`,
        data: dirtyData,
        actions: {
          accept: () => this.acceptRecovery(dirtyData),
          reject: () => this.rejectRecovery(dirtyData),
          review: () => this.reviewRecovery(dirtyData)
        },
        timestamp: new Date()
      }

      this.recoveryPrompts.push(prompt)
      this.emit('recoveryPrompt', prompt)
    }
  }

  private acceptRecovery(data: OfflineData[]): void {
    data.forEach(item => {
      this.emit('recoveryAccepted', item)
    })
    this.clearRecoveryPrompts()
  }

  private rejectRecovery(data: OfflineData[]): void {
    data.forEach(item => {
      this.deleteData(item.id)
    })
    this.clearRecoveryPrompts()
  }

  private reviewRecovery(data: OfflineData[]): void {
    this.emit('recoveryReview', data)
  }

  private clearRecoveryPrompts(): void {
    this.recoveryPrompts = []
  }

  private async syncOfflineData(): Promise<void> {
    const dirtyData = this.getAllData().filter(data => data.isDirty)
    
    for (const data of dirtyData) {
      try {
        await this.syncDataItem(data)
      } catch (error) {
        console.error(`Failed to sync data ${data.id}:`, error)
        this.emit('syncError', { data, error })
      }
    }
  }

  private async syncDataItem(data: OfflineData): Promise<void> {
    // This would integrate with your API service
    // For now, we'll just mark as synced
    const updated = this.updateData(data.id, { isDirty: false })
    if (updated) {
      this.emit('dataSynced', updated)
    }
  }

  public getStorageSize(): number {
    const data = Array.from(this.storage.values())
    return JSON.stringify(data).length
  }

  public isStorageFull(): boolean {
    return this.getStorageSize() >= this.config.maxStorageSize
  }

  public cleanupOldData(maxAge: number = 7 * 24 * 60 * 60 * 1000): void { // 7 days
    const cutoff = new Date(Date.now() - maxAge)
    const keysToDelete: string[] = []

    this.storage.forEach((data, key) => {
      if (data.timestamp < cutoff) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.deleteData(key))
  }

  public updateConfig(newConfig: Partial<OfflineConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.emit('configUpdated', this.config)
  }

  public getConfig(): OfflineConfig {
    return { ...this.config }
  }

  public isOnline(): boolean {
    return this.onlineStatus
  }

  public getRecoveryPrompts(): RecoveryPrompt[] {
    return [...this.recoveryPrompts]
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

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  public destroy(): void {
    this.autoSaveTimers.forEach(timer => clearInterval(timer))
    this.autoSaveTimers.clear()
    this.listeners.clear()
  }
}

// React hook for offline data management
export const useOfflineData = () => {
  const service = OfflineDataService.getInstance()

  const saveData = (id: string, type: OfflineData['type'], data: any, options?: any) => {
    return service.saveData(id, type, data, options)
  }

  const getData = (id: string) => {
    return service.getData(id)
  }

  const getAllData = (type?: OfflineData['type']) => {
    return service.getAllData(type)
  }

  const updateData = (id: string, updates: Partial<OfflineData>) => {
    return service.updateData(id, updates)
  }

  const deleteData = (id: string) => {
    return service.deleteData(id)
  }

  const clearData = (type?: OfflineData['type']) => {
    service.clearData(type)
  }

  const isOnline = () => {
    return service.isOnline()
  }

  const getStorageSize = () => {
    return service.getStorageSize()
  }

  const cleanupOldData = (maxAge?: number) => {
    service.cleanupOldData(maxAge)
  }

  return {
    saveData,
    getData,
    getAllData,
    updateData,
    deleteData,
    clearData,
    isOnline,
    getStorageSize,
    cleanupOldData
  }
}

// Export singleton instance
export const offlineDataService = OfflineDataService.getInstance()
