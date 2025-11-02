// Unified Base Service Architecture
import { logger } from '@/services/logger'
export interface ServiceConfig {
  persistence?: boolean
  caching?: boolean
  retries?: number
  timeout?: number
}

export abstract class BaseService<T> {
  protected data: Map<string, T>
  protected config: ServiceConfig
  protected listeners: Map<string, Function[]>
  
  constructor(config: ServiceConfig = {}) {
    this.data = new Map()
    this.config = config
    this.listeners = new Map()
  }
  
  public get(id: string): T | undefined {
    return this.data.get(id)
  }
  
  public set(id: string, value: T): void {
    this.data.set(id, value)
    this.emit('change', { id, value })
  }
  
  public delete(id: string): void {
    this.data.delete(id)
    this.emit('delete', { id })
  }
  
  public subscribe(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }
  
  public unsubscribe(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }
  
  public emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }
  
  public cleanup(): void {
    this.data.clear()
    this.listeners.clear()
  }
}

export abstract class PersistenceService<T> extends BaseService<T> {
  protected storageKey: string

  constructor(storageKey: string, config: ServiceConfig = {}) {
    super({ ...config, persistence: true })
    this.storageKey = storageKey
    this.load()
  }

  public save(): void {
    try {
      const data = Array.from(this.data.entries())
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      logger.error(`Failed to save ${this.storageKey}:`, error)
    }
  }

  public load(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        this.data = new Map(data)
      }
    } catch (error) {
      logger.error(`Failed to load ${this.storageKey}:`, error)
    }
  }
}

export abstract class CachingService<T> extends BaseService<T> {
  private cache: Map<string, { value: T; timestamp: number; ttl: number }>

  constructor(config: ServiceConfig = {}) {
    super({ ...config, caching: true })
    this.cache = new Map()
  }

  public getCached(key: string): T | undefined {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.value
    }
    this.cache.delete(key)
    return undefined
  }

  public setCached(key: string, value: T, ttl: number = 300000): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    })
  }
}
