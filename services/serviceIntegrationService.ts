// Integration Service - Ties all critical services together
// Implements comprehensive service integration with unified error handling and state management

import { errorTranslationService, ErrorTranslation, ErrorContext } from './errorTranslationService'
import { offlineDataService, OfflineData } from './offlineDataService'
import { optimisticUIService, OptimisticUpdate } from './optimisticUIService'
import { retryService, RetryResult } from './retryService'
import { errorContextService, ErrorContextEvent } from './errorContextService'

export interface ServiceIntegrationConfig {
  enableErrorTranslation: boolean
  enableOfflinePersistence: boolean
  enableOptimisticUI: boolean
  enableRetryLogic: boolean
  enableErrorContext: boolean
  enableAutoRecovery: boolean
  enablePerformanceMonitoring: boolean
}

export interface UnifiedError {
  id: string
  code: string
  message: string
  userMessage: string
  technicalMessage: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  retryable: boolean
  context: ErrorContext
  timestamp: Date
  retryCount: number
  maxRetries: number
  actionRequired: string
}

export interface ServiceStatus {
  errorTranslation: boolean
  offlinePersistence: boolean
  optimisticUI: boolean
  retryLogic: boolean
  errorContext: boolean
  overall: boolean
}

class ServiceIntegrationService {
  private static instance: ServiceIntegrationService
  private config: ServiceIntegrationConfig
  private listeners: Map<string, Function[]> = new Map()
  private performanceMetrics: Map<string, number> = new Map()

  public static getInstance(): ServiceIntegrationService {
    if (!ServiceIntegrationService.instance) {
      ServiceIntegrationService.instance = new ServiceIntegrationService()
    }
    return ServiceIntegrationService.instance
  }

  constructor() {
    this.config = {
      enableErrorTranslation: true,
      enableOfflinePersistence: true,
      enableOptimisticUI: true,
      enableRetryLogic: true,
      enableErrorContext: true,
      enableAutoRecovery: true,
      enablePerformanceMonitoring: true
    }

    this.initializeServices()
    this.setupServiceListeners()
  }

  private initializeServices(): void {
    // Initialize all services
    if (this.config.enableErrorTranslation) {
      errorTranslationService
    }
    
    if (this.config.enableOfflinePersistence) {
      offlineDataService
    }
    
    if (this.config.enableOptimisticUI) {
      optimisticUIService
    }
    
    if (this.config.enableRetryLogic) {
      retryService
    }
    
    if (this.config.enableErrorContext) {
      errorContextService
    }
  }

  private setupServiceListeners(): void {
    // Listen to offline data service events
    if (this.config.enableOfflinePersistence) {
      offlineDataService.on('dataSaved', (data: OfflineData) => {
        this.emit('offlineDataSaved', data)
      })

      offlineDataService.on('recoveryPrompt', (prompt: any) => {
        this.emit('recoveryPrompt', prompt)
      })
    }

    // Listen to optimistic UI service events
    if (this.config.enableOptimisticUI) {
      optimisticUIService.on('updateCreated', (update: OptimisticUpdate) => {
        this.emit('optimisticUpdateCreated', update)
      })

      optimisticUIService.on('updateSuccess', (update: OptimisticUpdate) => {
        this.emit('optimisticUpdateSuccess', update)
      })

      optimisticUIService.on('updateRolledBack', (data: any) => {
        this.emit('optimisticUpdateRolledBack', data)
      })

      optimisticUIService.on('conflictDetected', (conflict: any) => {
        this.emit('conflictDetected', conflict)
      })
    }

    // Listen to error context service events
    if (this.config.enableErrorContext) {
      errorContextService.on('errorEvent', (event: ErrorContextEvent) => {
        this.emit('errorEvent', event)
      })
    }
  }

  // Unified Error Handling
  public async handleError(
    error: any,
    options: {
      component?: string
      action?: string
      projectId?: string
      userId?: string
      workflowStage?: string
      data?: any
      retryable?: boolean
      maxRetries?: number
    } = {}
  ): Promise<UnifiedError> {
    const startTime = performance.now()

    try {
      // Extract error code and message
      const errorCode = error.code || error.status || 'UNKNOWN_ERROR'
      const errorMessage = error.message || 'An unknown error occurred'

      // Set error context
      if (this.config.enableErrorContext) {
        errorContextService.setContext({
          component: options.component,
          action: options.action,
          projectId: options.projectId,
          userId: options.userId,
          workflowStage: options.workflowStage
        })
      }

      // Translate error if enabled
      let translation: ErrorTranslation | undefined
      if (this.config.enableErrorTranslation) {
        translation = errorTranslationService.translateError(
          errorCode,
          {
            projectId: options.projectId,
            userId: options.userId,
            workflowStage: options.workflowStage,
            component: options.component,
            action: options.action,
            data: options.data
          }
        )
      }

      // Create unified error
      const unifiedError: UnifiedError = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        code: errorCode,
        message: errorMessage,
        userMessage: translation?.userMessage || errorMessage,
        technicalMessage: translation?.technicalMessage || errorMessage,
        severity: translation?.severity || 'medium',
        retryable: translation?.retryable || options.retryable || false,
        context: errorContextService.getCurrentContext() || {
          id: 'unknown',
          timestamp: new Date()
        },
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: options.maxRetries || 3,
        actionRequired: translation?.actionRequired || 'Please try again or contact support'
      }

      // Track error in context service
      if (this.config.enableErrorContext) {
        errorContextService.trackError(error, {
          component: options.component,
          action: options.action,
          data: options.data
        })
      }

      // Save error to offline storage if enabled
      if (this.config.enableOfflinePersistence) {
        offlineDataService.saveData(
          unifiedError.id,
          'form',
          unifiedError,
          {
            projectId: options.projectId,
            userId: options.userId,
            component: options.component
          }
        )
      }

      this.emit('errorHandled', unifiedError)

      // Record performance metric
      if (this.config.enablePerformanceMonitoring) {
        const duration = performance.now() - startTime
        this.recordPerformanceMetric('error_handling_duration', duration)
      }

      return unifiedError

    } catch (handlingError) {
      console.error('Error in error handling:', handlingError)
      
      // Fallback error
      return {
        id: `fallback_error_${Date.now()}`,
        code: 'ERROR_HANDLING_FAILED',
        message: 'Error handling failed',
        userMessage: 'An error occurred while processing your request',
        technicalMessage: handlingError instanceof Error ? handlingError.message : String(handlingError),
        severity: 'high',
        retryable: false,
        context: {
          component: 'serviceIntegration'
        },
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 0,
        actionRequired: 'Please refresh the page and try again'
      }
    }
  }

  // Unified Retry with All Services
  public async executeWithFullRetry<T>(
    operation: () => Promise<T>,
    options: {
      component?: string
      action?: string
      projectId?: string
      userId?: string
      workflowStage?: string
      maxRetries?: number
      enableOptimisticUI?: boolean
      optimisticData?: any
      entityType?: string
      entityId?: string
    } = {}
  ): Promise<RetryResult<T>> {
    const startTime = performance.now()

    try {
      // Create optimistic update if enabled
      let optimisticUpdate: OptimisticUpdate | undefined
      if (this.config.enableOptimisticUI && options.enableOptimisticUI && options.optimisticData) {
        optimisticUpdate = optimisticUIService.createOptimisticUpdate(
          'update',
          options.entityType as any || 'data',
          options.entityId || 'unknown',
          null, // original data
          options.optimisticData,
          {
            userId: options.userId || 'unknown',
            projectId: options.projectId,
            component: options.component || 'unknown'
          }
        )
      }

      // Execute with retry logic
      const result = await retryService.executeWithRetry(
        operation,
        {
          maxRetries: options.maxRetries || 3,
          onRetry: (attempt, error) => {
            this.emit('retryAttempt', { attempt, error, options })
          },
          onMaxRetriesReached: (error) => {
            this.emit('maxRetriesReached', { error, options })
          }
        }
      )

      // Record performance metric
      if (this.config.enablePerformanceMonitoring) {
        const duration = performance.now() - startTime
        this.recordPerformanceMetric('retry_operation_duration', duration)
      }

      return result

    } catch (error) {
      // Handle error through unified error handling
      const unifiedError = await this.handleError(error, options)
      
      return {
        success: false,
        error: unifiedError,
        attempts: 1,
        totalTime: performance.now() - startTime
      }
    }
  }

  // Unified Data Persistence
  public async saveDataWithPersistence<T>(
    data: T,
    options: {
      id: string
      type: OfflineData['type']
      projectId?: string
      userId?: string
      component?: string
      enableAutoSave?: boolean
    }
  ): Promise<T> {
    try {
      // Save to offline storage
      if (this.config.enableOfflinePersistence) {
        offlineDataService.saveData(
          options.id,
          options.type,
          data,
          {
            projectId: options.projectId,
            userId: options.userId,
            component: options.component,
            enableAutoSave: options.enableAutoSave
          }
        )
      }

      this.emit('dataSaved', { data, options })
      return data

    } catch (error) {
      await this.handleError(error, {
        component: options.component,
        action: 'saveData',
        projectId: options.projectId,
        userId: options.userId
      })
      throw error
    }
  }

  // Service Status Monitoring
  public getServiceStatus(): ServiceStatus {
    return {
      errorTranslation: this.config.enableErrorTranslation,
      offlinePersistence: this.config.enableOfflinePersistence,
      optimisticUI: this.config.enableOptimisticUI,
      retryLogic: this.config.enableRetryLogic,
      errorContext: this.config.enableErrorContext,
      overall: Object.values(this.config).every(Boolean)
    }
  }

  public getPerformanceMetrics(): Record<string, number> {
    return Object.fromEntries(this.performanceMetrics)
  }

  private recordPerformanceMetric(name: string, value: number): void {
    this.performanceMetrics.set(name, value)
    
    // Keep only last 100 metrics
    if (this.performanceMetrics.size > 100) {
      const firstKey = this.performanceMetrics.keys().next().value
      if (firstKey !== undefined) {
        this.performanceMetrics.delete(firstKey)
      }
    }
  }

  // Configuration Management
  public updateConfig(newConfig: Partial<ServiceIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.emit('configUpdated', this.config)
  }

  public getConfig(): ServiceIntegrationConfig {
    return { ...this.config }
  }

  // Recovery and Cleanup
  public async performRecovery(): Promise<void> {
    try {
      // Clear completed optimistic updates
      if (this.config.enableOptimisticUI) {
        optimisticUIService.clearCompletedUpdates()
      }

      // Cleanup old offline data
      if (this.config.enableOfflinePersistence) {
        offlineDataService.cleanupOldData()
      }

      // Clear old error contexts
      if (this.config.enableErrorContext) {
        errorContextService.clearContexts()
      }

      this.emit('recoveryCompleted')

    } catch (error) {
      await this.handleError(error, {
        component: 'ServiceIntegration',
        action: 'performRecovery'
      })
    }
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
    this.listeners.clear()
    this.performanceMetrics.clear()
  }
}

// React hook for service integration
export const useServiceIntegration = () => {
  const service = ServiceIntegrationService.getInstance()

  const handleError = (error: any, options?: any) => {
    return service.handleError(error, options)
  }

  const executeWithFullRetry = <T>(operation: () => Promise<T>, options?: any) => {
    return service.executeWithFullRetry(operation, options)
  }

  const saveDataWithPersistence = <T>(data: T, options: any) => {
    return service.saveDataWithPersistence(data, options)
  }

  const getServiceStatus = () => {
    return service.getServiceStatus()
  }

  const getPerformanceMetrics = () => {
    return service.getPerformanceMetrics()
  }

  const performRecovery = () => {
    return service.performRecovery()
  }

  return {
    handleError,
    executeWithFullRetry,
    saveDataWithPersistence,
    getServiceStatus,
    getPerformanceMetrics,
    performRecovery
  }
}

// Export singleton instance
export const serviceIntegrationService = ServiceIntegrationService.getInstance()
