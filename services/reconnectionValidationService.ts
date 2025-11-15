// Reconnection State Validation Service
// Handles inconsistent state after reconnection and data refresh

import React from 'react'

export interface ConnectionState {
  isOnline: boolean
  lastConnected: number | null
  lastDisconnected: number | null
  reconnectionAttempts: number
  maxReconnectionAttempts: number
  reconnectionDelay: number
}

export interface DataValidationResult {
  isValid: boolean
  inconsistencies: DataInconsistency[]
  recommendations: string[]
  requiresRefresh: boolean
}

export interface DataInconsistency {
  type: 'timestamp' | 'version' | 'state' | 'permission' | 'data'
  field: string
  expected: any
  actual: any
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
}

export interface ValidationConfig {
  enabled: boolean
  checkInterval: number
  maxInconsistencies: number
  autoRefresh: boolean
  showNotifications: boolean
  validationTimeout: number
}

class ReconnectionValidationService {
  private static instance: ReconnectionValidationService
  private connectionState: ConnectionState
  private config: ValidationConfig
  private validationTimers: Map<string, NodeJS.Timeout> = new Map()
  private listeners: Map<string, (result: DataValidationResult) => void> = new Map()
  private cachedData: Map<string, { data: any; timestamp: number; version: number }> = new Map()

  private constructor() {
    this.connectionState = {
      isOnline: navigator.onLine,
      lastConnected: navigator.onLine ? Date.now() : null,
      lastDisconnected: navigator.onLine ? null : Date.now(),
      reconnectionAttempts: 0,
      maxReconnectionAttempts: 5,
      reconnectionDelay: 1000
    }

    this.config = {
      enabled: true,
      checkInterval: 30000, // 30 seconds
      maxInconsistencies: 10,
      autoRefresh: true,
      showNotifications: true,
      validationTimeout: 10000 // 10 seconds
    }

    this.loadConfig()
    this.setupNetworkListeners()
  }

  public static getInstance(): ReconnectionValidationService {
    if (!ReconnectionValidationService.instance) {
      ReconnectionValidationService.instance = new ReconnectionValidationService()
    }
    return ReconnectionValidationService.instance
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('reconnectionValidationConfig')
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.warn('Failed to load reconnection validation config:', error)
    }
  }

  public updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig }
    try {
      localStorage.setItem('reconnectionValidationConfig', JSON.stringify(this.config))
    } catch (error) {
      console.warn('Failed to save reconnection validation config:', error)
    }
  }

  public getConfig(): ValidationConfig {
    return { ...this.config }
  }

  // ============================================================================
  // NETWORK MONITORING
  // ============================================================================

  private setupNetworkListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }

  private handleOnline(): void {
    this.connectionState.isOnline = true
    this.connectionState.lastConnected = Date.now()
    this.connectionState.reconnectionAttempts = 0

    console.log('Network reconnected, starting validation...')
    
    // Start validation for all cached data
    this.validateAllCachedData()
  }

  private handleOffline(): void {
    this.connectionState.isOnline = false
    this.connectionState.lastDisconnected = Date.now()

    console.log('Network disconnected, pausing validation...')
    
    // Clear validation timers
    this.clearAllValidationTimers()
  }

  public getConnectionState(): ConnectionState {
    return { ...this.connectionState }
  }

  // ============================================================================
  // DATA VALIDATION
  // ============================================================================

  public startValidation(
    key: string,
    getCurrentData: () => any,
    getServerData: () => Promise<any>,
    metadata: {
      userId?: string
      projectId?: string
      workflowStage?: string
      dataType: string
    }
  ): void {
    if (!this.config.enabled || !this.connectionState.isOnline) return

    // Clear existing timer
    this.stopValidation(key)

    // Set up new timer
    const timer = setInterval(async () => {
      try {
        await this.validateData(key, getCurrentData, getServerData, metadata)
      } catch (error) {
        console.warn(`Validation failed for ${key}:`, error)
      }
    }, this.config.checkInterval)

    this.validationTimers.set(key, timer)
  }

  public stopValidation(key: string): void {
    const timer = this.validationTimers.get(key)
    if (timer) {
      clearInterval(timer)
      this.validationTimers.delete(key)
    }
  }

  public async validateData(
    key: string,
    getCurrentData: () => any,
    getServerData: () => Promise<any>,
    metadata: {
      userId?: string
      projectId?: string
      workflowStage?: string
      dataType: string
    }
  ): Promise<DataValidationResult> {
    const currentData = getCurrentData()
    const cached = this.cachedData.get(key)

    try {
      // Get server data with timeout
      const serverData = await Promise.race([
        getServerData(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Validation timeout')), this.config.validationTimeout)
        )
      ]) as any

      const inconsistencies: DataInconsistency[] = []
      const recommendations: string[] = []

      // Check timestamp consistency
      if (serverData.timestamp && currentData.timestamp) {
        const timeDiff = Math.abs(serverData.timestamp - currentData.timestamp)
        if (timeDiff > 300000) { // 5 minutes
          inconsistencies.push({
            type: 'timestamp',
            field: 'timestamp',
            expected: serverData.timestamp,
            actual: currentData.timestamp,
            severity: 'medium',
            description: `Data is ${Math.floor(timeDiff / 60000)} minutes out of sync`
          })
          recommendations.push('Refresh data to get latest changes')
        }
      }

      // Check version consistency
      if (serverData.version && currentData.version) {
        if (serverData.version !== currentData.version) {
          inconsistencies.push({
            type: 'version',
            field: 'version',
            expected: serverData.version,
            actual: currentData.version,
            severity: 'high',
            description: 'Data version mismatch detected'
          })
          recommendations.push('Data has been updated by another user')
        }
      }

      // Check state consistency
      if (serverData.state && currentData.state) {
        if (serverData.state !== currentData.state) {
          inconsistencies.push({
            type: 'state',
            field: 'state',
            expected: serverData.state,
            actual: currentData.state,
            severity: 'high',
            description: 'Workflow state has changed'
          })
          recommendations.push('Workflow state has been updated')
        }
      }

      // Check data consistency
      const dataInconsistencies = this.checkDataConsistency(currentData, serverData)
      inconsistencies.push(...dataInconsistencies)

      // Check permission consistency
      if (serverData.permissions && currentData.permissions) {
        const permissionInconsistencies = this.checkPermissionConsistency(
          currentData.permissions,
          serverData.permissions
        )
        inconsistencies.push(...permissionInconsistencies)
      }

      const result: DataValidationResult = {
        isValid: inconsistencies.length === 0,
        inconsistencies,
        recommendations,
        requiresRefresh: inconsistencies.some(i => i.severity === 'high' || i.severity === 'critical')
      }

      // Update cached data
      this.cachedData.set(key, {
        data: serverData,
        timestamp: Date.now(),
        version: serverData.version || 1
      })

      // Notify listeners
      this.notifyListeners(key, result)

      // Auto-refresh if configured
      if (this.config.autoRefresh && result.requiresRefresh) {
        this.handleAutoRefresh(key, result)
      }

      return result
    } catch (error) {
      console.warn(`Validation failed for ${key}:`, error)
      
      const result: DataValidationResult = {
        isValid: false,
        inconsistencies: [{
          type: 'data',
          field: 'connection',
          expected: 'connected',
          actual: 'disconnected',
          severity: 'critical',
          description: 'Unable to validate data due to connection issues'
        }],
        recommendations: ['Check your internet connection and try again'],
        requiresRefresh: true
      }

      this.notifyListeners(key, result)
      return result
    }
  }

  private checkDataConsistency(currentData: any, serverData: any): DataInconsistency[] {
    const inconsistencies: DataInconsistency[] = []

    // Check for missing fields
    for (const [key, value] of Object.entries(serverData)) {
      if (currentData[key] === undefined) {
        inconsistencies.push({
          type: 'data',
          field: key,
          expected: value,
          actual: undefined,
          severity: 'medium',
          description: `Field '${key}' is missing from current data`
        })
      }
    }

    // Check for extra fields
    for (const [key, value] of Object.entries(currentData)) {
      if (serverData[key] === undefined) {
        inconsistencies.push({
          type: 'data',
          field: key,
          expected: undefined,
          actual: value,
          severity: 'low',
          description: `Field '${key}' exists in current data but not on server`
        })
      }
    }

    // Check for value differences
    for (const [key, serverValue] of Object.entries(serverData)) {
      const currentValue = currentData[key]
      if (currentValue !== undefined && JSON.stringify(currentValue) !== JSON.stringify(serverValue)) {
        inconsistencies.push({
          type: 'data',
          field: key,
          expected: serverValue,
          actual: currentValue,
          severity: 'medium',
          description: `Field '${key}' has different values`
        })
      }
    }

    return inconsistencies
  }

  private checkPermissionConsistency(currentPermissions: any, serverPermissions: any): DataInconsistency[] {
    const inconsistencies: DataInconsistency[] = []

    for (const [permission, currentValue] of Object.entries(currentPermissions)) {
      const serverValue = serverPermissions[permission]
      if (currentValue !== serverValue) {
        inconsistencies.push({
          type: 'permission',
          field: permission,
          expected: serverValue,
          actual: currentValue,
          severity: 'high',
          description: `Permission '${permission}' has changed`
        })
      }
    }

    return inconsistencies
  }

  private async validateAllCachedData(): Promise<void> {
    const keys = Array.from(this.cachedData.keys())
    for (const key of keys) {
      try {
        // This would need to be implemented by the calling code
        // as we don't have access to the original validation functions
        console.log(`Validating cached data for ${key}`)
      } catch (error) {
        console.warn(`Failed to validate cached data for ${key}:`, error)
      }
    }
  }

  private handleAutoRefresh(key: string, result: DataValidationResult): void {
    if (result.requiresRefresh) {
      console.log(`Auto-refreshing data for ${key}`)
      // This would trigger a data refresh in the calling component
      this.notifyListeners(key, { ...result, requiresRefresh: true })
    }
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  private notifyListeners(key: string, result: DataValidationResult): void {
    const listener = this.listeners.get(key)
    if (listener) {
      listener(result)
    }
  }

  public addListener(key: string, listener: (result: DataValidationResult) => void): void {
    this.listeners.set(key, listener)
  }

  public removeListener(key: string): void {
    this.listeners.delete(key)
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private clearAllValidationTimers(): void {
    for (const timer of this.validationTimers.values()) {
      clearInterval(timer)
    }
    this.validationTimers.clear()
  }

  public clearCachedData(key?: string): void {
    if (key) {
      this.cachedData.delete(key)
    } else {
      this.cachedData.clear()
    }
  }

  public getCachedData(key: string): { data: any; timestamp: number; version: number } | null {
    return this.cachedData.get(key) || null
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  public cleanup(): void {
    this.clearAllValidationTimers()
    this.listeners.clear()
    this.cachedData.clear()
    
    window.removeEventListener('online', this.handleOnline.bind(this))
    window.removeEventListener('offline', this.handleOffline.bind(this))
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  public getStatistics(): {
    totalValidations: number
    activeValidations: number
    cachedDataCount: number
    connectionState: ConnectionState
  } {
    return {
      totalValidations: this.validationTimers.size,
      activeValidations: this.validationTimers.size,
      cachedDataCount: this.cachedData.size,
      connectionState: this.getConnectionState()
    }
  }
}

// ============================================================================
// REACT HOOK
// ============================================================================

export const useReconnectionValidation = (
  key: string,
  getCurrentData: () => any,
  getServerData: () => Promise<any>,
  metadata: {
    userId?: string
    projectId?: string
    workflowStage?: string
    dataType: string
  },
  enabled: boolean = true
) => {
  const [validationResult, setValidationResult] = React.useState<DataValidationResult | null>(null)
  const [isValidating, setIsValidating] = React.useState(false)
  const [lastValidation, setLastValidation] = React.useState<Date | null>(null)

  React.useEffect(() => {
    if (!enabled) return

    const service = ReconnectionValidationService.getInstance()
    
    // Set up validation
    service.startValidation(key, getCurrentData, getServerData, metadata)

    // Add listener
    const listener = (result: DataValidationResult) => {
      setValidationResult(result)
      setIsValidating(false)
      setLastValidation(new Date())
    }

    service.addListener(key, listener)

    // Cleanup
    return () => {
      service.removeListener(key)
      service.stopValidation(key)
    }
  }, [key, enabled])

  const manualValidation = React.useCallback(async () => {
    setIsValidating(true)
    const service = ReconnectionValidationService.getInstance()
    const result = await service.validateData(key, getCurrentData, getServerData, metadata)
    setValidationResult(result)
    setIsValidating(false)
    setLastValidation(new Date())
    return result
  }, [key, getCurrentData, getServerData, metadata])

  const clearValidation = React.useCallback(() => {
    setValidationResult(null)
    const service = ReconnectionValidationService.getInstance()
    service.clearCachedData(key)
  }, [key])

  return {
    validationResult,
    isValidating,
    lastValidation,
    manualValidation,
    clearValidation,
    connectionState: ReconnectionValidationService.getInstance().getConnectionState()
  }
}

export default ReconnectionValidationService
