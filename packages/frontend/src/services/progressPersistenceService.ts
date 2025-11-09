// Progress Persistence + Automatic Resume Service
// Handles browser refresh during long-running reconciliation with automatic resume

export interface ProgressSnapshot {
  id: string
  operationId: string
  operationType: 'reconciliation' | 'data_processing' | 'file_upload' | 'export' | 'import'
  stage: string
  progress: number // 0-100
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  startTime: Date
  lastUpdateTime: Date
  estimatedTimeRemaining: number // seconds
  data: {
    processed: number
    total: number
    errors: number
    warnings: number
  }
  context: {
    userId: string
    projectId: string
    sessionId: string
    userAgent: string
  }
  checkpoint: {
    stage: string
    data: any
    metadata: Record<string, any>
  }
  resumeData: {
    canResume: boolean
    resumePoint: string
    dependencies: string[]
    state: any
  }
}

export interface ResumeConfig {
  enableAutoResume: boolean
  maxResumeAge: number // milliseconds
  checkpointInterval: number // milliseconds
  enableProgressTracking: boolean
  enableStatePersistence: boolean
  enableDependencyTracking: boolean
}

export interface OperationContext {
  operationId: string
  operationType: ProgressSnapshot['operationType']
  userId: string
  projectId: string
  metadata?: Record<string, any>
}

class ProgressPersistenceService {
  private static instance: ProgressPersistenceService
  private snapshots: Map<string, ProgressSnapshot> = new Map()
  private activeOperations: Map<string, ProgressSnapshot> = new Map()
  private config: ResumeConfig
  private listeners: Map<string, Function[]> = new Map()
  private checkpointTimer?: NodeJS.Timeout

  public static getInstance(): ProgressPersistenceService {
    if (!ProgressPersistenceService.instance) {
      ProgressPersistenceService.instance = new ProgressPersistenceService()
    }
    return ProgressPersistenceService.instance
  }

  constructor() {
    this.config = {
      enableAutoResume: true,
      maxResumeAge: 24 * 60 * 60 * 1000, // 24 hours
      checkpointInterval: 30 * 1000, // 30 seconds
      enableProgressTracking: true,
      enableStatePersistence: true,
      enableDependencyTracking: true
    }

    this.loadPersistedSnapshots()
    this.startCheckpointTimer()
    this.initializeEventListeners()
  }

  private loadPersistedSnapshots(): void {
    try {
      const stored = localStorage.getItem('progress_snapshots')
      if (stored) {
        const data = JSON.parse(stored)
        data.snapshots.forEach((snapshotData: any) => {
          const snapshot: ProgressSnapshot = {
            ...snapshotData,
            startTime: new Date(snapshotData.startTime),
            lastUpdateTime: new Date(snapshotData.lastUpdateTime)
          }
          this.snapshots.set(snapshot.id, snapshot)
        })
      }
    } catch (error) {
      console.error('Failed to load persisted snapshots:', error)
    }
  }

  private savePersistedSnapshots(): void {
    try {
      const data = {
        snapshots: Array.from(this.snapshots.values())
      }
      localStorage.setItem('progress_snapshots', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save snapshots:', error)
    }
  }

  private startCheckpointTimer(): void {
    this.checkpointTimer = setInterval(() => {
      this.createCheckpoints()
    }, this.config.checkpointInterval)
  }

  private initializeEventListeners(): void {
    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.createEmergencyCheckpoints()
    })

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.createCheckpoints()
      } else {
        this.checkForResumableOperations()
      }
    })

    // Handle online/offline events
    window.addEventListener('online', () => {
      this.handleReconnection()
    })

    window.addEventListener('offline', () => {
      this.handleDisconnection()
    })
  }

  public startOperation(context: OperationContext): ProgressSnapshot {
    const snapshot: ProgressSnapshot = {
      id: this.generateSnapshotId(),
      operationId: context.operationId,
      operationType: context.operationType,
      stage: 'initializing',
      progress: 0,
      status: 'running',
      startTime: new Date(),
      lastUpdateTime: new Date(),
      estimatedTimeRemaining: 0,
      data: {
        processed: 0,
        total: 0,
        errors: 0,
        warnings: 0
      },
      context: {
        userId: context.userId,
        projectId: context.projectId,
        sessionId: this.getSessionId(),
        userAgent: navigator.userAgent
      },
      checkpoint: {
        stage: 'initializing',
        data: null,
        metadata: context.metadata || {}
      },
      resumeData: {
        canResume: true,
        resumePoint: 'start',
        dependencies: [],
        state: {}
      }
    }

    this.snapshots.set(snapshot.id, snapshot)
    this.activeOperations.set(context.operationId, snapshot)
    this.savePersistedSnapshots()

    this.emit('operationStarted', snapshot)
    return snapshot
  }

  public updateProgress(
    operationId: string,
    updates: {
      stage?: string
      progress?: number
      status?: ProgressSnapshot['status']
      data?: Partial<ProgressSnapshot['data']>
      estimatedTimeRemaining?: number
      checkpoint?: Partial<ProgressSnapshot['checkpoint']>
      resumeData?: Partial<ProgressSnapshot['resumeData']>
    }
  ): boolean {
    const snapshot = this.activeOperations.get(operationId)
    if (!snapshot) return false

    // Update snapshot
    Object.assign(snapshot, updates)
    snapshot.lastUpdateTime = new Date()

    // Update in maps
    this.snapshots.set(snapshot.id, snapshot)
    this.activeOperations.set(operationId, snapshot)
    this.savePersistedSnapshots()

    this.emit('progressUpdated', snapshot)
    return true
  }

  public completeOperation(operationId: string, finalData?: any): boolean {
    const snapshot = this.activeOperations.get(operationId)
    if (!snapshot) return false

    snapshot.status = 'completed'
    snapshot.progress = 100
    snapshot.lastUpdateTime = new Date()
    if (finalData) {
      snapshot.checkpoint.data = finalData
    }

    this.snapshots.set(snapshot.id, snapshot)
    this.activeOperations.delete(operationId)
    this.savePersistedSnapshots()

    this.emit('operationCompleted', snapshot)
    return true
  }

  public failOperation(operationId: string, error: Error): boolean {
    const snapshot = this.activeOperations.get(operationId)
    if (!snapshot) return false

    snapshot.status = 'failed'
    snapshot.lastUpdateTime = new Date()
    snapshot.checkpoint.metadata.error = error.message

    this.snapshots.set(snapshot.id, snapshot)
    this.activeOperations.delete(operationId)
    this.savePersistedSnapshots()

    this.emit('operationFailed', { snapshot, error })
    return true
  }

  public pauseOperation(operationId: string): boolean {
    const snapshot = this.activeOperations.get(operationId)
    if (!snapshot) return false

    snapshot.status = 'paused'
    snapshot.lastUpdateTime = new Date()

    this.snapshots.set(snapshot.id, snapshot)
    this.savePersistedSnapshots()

    this.emit('operationPaused', snapshot)
    return true
  }

  public resumeOperation(operationId: string): boolean {
    const snapshot = this.snapshots.get(operationId)
    if (!snapshot || snapshot.status !== 'paused') return false

    // Check if operation is still resumable
    if (!this.isOperationResumable(snapshot)) {
      return false
    }

    snapshot.status = 'running'
    snapshot.lastUpdateTime = new Date()

    this.activeOperations.set(operationId, snapshot)
    this.savePersistedSnapshots()

    this.emit('operationResumed', snapshot)
    return true
  }

  public cancelOperation(operationId: string): boolean {
    const snapshot = this.activeOperations.get(operationId)
    if (!snapshot) return false

    snapshot.status = 'cancelled'
    snapshot.lastUpdateTime = new Date()

    this.snapshots.set(snapshot.id, snapshot)
    this.activeOperations.delete(operationId)
    this.savePersistedSnapshots()

    this.emit('operationCancelled', snapshot)
    return true
  }

  private createCheckpoints(): void {
    this.activeOperations.forEach(snapshot => {
      this.createCheckpoint(snapshot)
    })
  }

  private createEmergencyCheckpoints(): void {
    this.activeOperations.forEach(snapshot => {
      snapshot.checkpoint.metadata.emergency = true
      this.createCheckpoint(snapshot)
    })
  }

  private createCheckpoint(snapshot: ProgressSnapshot): void {
    snapshot.checkpoint.stage = snapshot.stage
    snapshot.checkpoint.metadata.lastCheckpoint = new Date()
    snapshot.resumeData.state = this.captureOperationState(snapshot)

    this.snapshots.set(snapshot.id, snapshot)
    this.savePersistedSnapshots()

    this.emit('checkpointCreated', snapshot)
  }

  private captureOperationState(snapshot: ProgressSnapshot): any {
    // Capture current operation state for resume
    return {
      stage: snapshot.stage,
      progress: snapshot.progress,
      data: snapshot.data,
      timestamp: new Date(),
      dependencies: snapshot.resumeData.dependencies
    }
  }

  private checkForResumableOperations(): void {
    if (!this.config.enableAutoResume) return

    const resumableOperations = Array.from(this.snapshots.values())
      .filter(snapshot => this.isOperationResumable(snapshot))

    resumableOperations.forEach(snapshot => {
      this.emit('resumableOperationDetected', snapshot)
    })
  }

  private isOperationResumable(snapshot: ProgressSnapshot): boolean {
    // Check if operation is within resume age limit
    const age = Date.now() - snapshot.lastUpdateTime.getTime()
    if (age > this.config.maxResumeAge) {
      return false
    }

    // Check if operation can be resumed
    if (!snapshot.resumeData.canResume) {
      return false
    }

    // Check dependencies
    if (snapshot.resumeData.dependencies.length > 0) {
      const allDependenciesMet = snapshot.resumeData.dependencies.every(depId => {
        const depSnapshot = this.snapshots.get(depId)
        return depSnapshot && depSnapshot.status === 'completed'
      })
      if (!allDependenciesMet) {
        return false
      }
    }

    return true
  }

  private handleReconnection(): void {
    this.checkForResumableOperations()
    this.emit('reconnectionDetected')
  }

  private handleDisconnection(): void {
    this.createEmergencyCheckpoints()
    this.emit('disconnectionDetected')
  }

  public getResumableOperations(): ProgressSnapshot[] {
    return Array.from(this.snapshots.values())
      .filter(snapshot => this.isOperationResumable(snapshot))
  }

  public getOperationHistory(operationId: string): ProgressSnapshot[] {
    return Array.from(this.snapshots.values())
      .filter(snapshot => snapshot.operationId === operationId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  public getActiveOperations(): ProgressSnapshot[] {
    return Array.from(this.activeOperations.values())
  }

  public getOperationSnapshot(operationId: string): ProgressSnapshot | undefined {
    return this.activeOperations.get(operationId)
  }

  public cleanupOldSnapshots(): void {
    const cutoff = new Date(Date.now() - this.config.maxResumeAge)
    const oldSnapshots: string[] = []

    this.snapshots.forEach((snapshot, id) => {
      if (snapshot.lastUpdateTime < cutoff && snapshot.status !== 'running') {
        oldSnapshots.push(id)
      }
    })

    oldSnapshots.forEach(id => {
      this.snapshots.delete(id)
    })

    this.savePersistedSnapshots()
    this.emit('snapshotsCleanedUp', oldSnapshots.length)
  }

  public exportOperationData(operationId: string): string {
    const snapshots = this.getOperationHistory(operationId)
    const data = {
      operationId,
      snapshots,
      exportTimestamp: new Date(),
      version: '1.0'
    }
    return JSON.stringify(data, null, 2)
  }

  public importOperationData(data: string): boolean {
    try {
      const imported = JSON.parse(data)
      if (imported.operationId && imported.snapshots) {
        imported.snapshots.forEach((snapshotData: any) => {
          const snapshot: ProgressSnapshot = {
            ...snapshotData,
            startTime: new Date(snapshotData.startTime),
            lastUpdateTime: new Date(snapshotData.lastUpdateTime)
          }
          this.snapshots.set(snapshot.id, snapshot)
        })
        this.savePersistedSnapshots()
        this.emit('operationDataImported', imported.operationId)
        return true
      }
    } catch (error) {
      console.error('Failed to import operation data:', error)
    }
    return false
  }

  private generateSnapshotId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('progress_persistence_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('progress_persistence_session_id', sessionId)
    }
    return sessionId
  }

  public updateConfig(newConfig: Partial<ResumeConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.emit('configUpdated', this.config)
  }

  public getConfig(): ResumeConfig {
    return { ...this.config }
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
    if (this.checkpointTimer) {
      clearInterval(this.checkpointTimer)
    }
    this.snapshots.clear()
    this.activeOperations.clear()
    this.listeners.clear()
  }
}

// React hook for progress persistence
export const useProgressPersistence = () => {
  const service = ProgressPersistenceService.getInstance()

  const startOperation = (context: OperationContext) => {
    return service.startOperation(context)
  }

  const updateProgress = (operationId: string, updates: any) => {
    return service.updateProgress(operationId, updates)
  }

  const completeOperation = (operationId: string, finalData?: any) => {
    return service.completeOperation(operationId, finalData)
  }

  const failOperation = (operationId: string, error: Error) => {
    return service.failOperation(operationId, error)
  }

  const pauseOperation = (operationId: string) => {
    return service.pauseOperation(operationId)
  }

  const resumeOperation = (operationId: string) => {
    return service.resumeOperation(operationId)
  }

  const cancelOperation = (operationId: string) => {
    return service.cancelOperation(operationId)
  }

  const getResumableOperations = () => {
    return service.getResumableOperations()
  }

  const getOperationHistory = (operationId: string) => {
    return service.getOperationHistory(operationId)
  }

  const getActiveOperations = () => {
    return service.getActiveOperations()
  }

  const getOperationSnapshot = (operationId: string) => {
    return service.getOperationSnapshot(operationId)
  }

  const cleanupOldSnapshots = () => {
    service.cleanupOldSnapshots()
  }

  const exportOperationData = (operationId: string) => {
    return service.exportOperationData(operationId)
  }

  const importOperationData = (data: string) => {
    return service.importOperationData(data)
  }

  return {
    startOperation,
    updateProgress,
    completeOperation,
    failOperation,
    pauseOperation,
    resumeOperation,
    cancelOperation,
    getResumableOperations,
    getOperationHistory,
    getActiveOperations,
    getOperationSnapshot,
    cleanupOldSnapshots,
    exportOperationData,
    importOperationData
  }
}

// Export singleton instance
export const progressPersistenceService = ProgressPersistenceService.getInstance()

