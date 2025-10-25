import { io, Socket } from 'socket.io-client'
import React from 'react'

export interface WebSocketConfig {
  url: string
  options?: {
    autoConnect?: boolean
    reconnection?: boolean
    reconnectionAttempts?: number
    reconnectionDelay?: number
    timeout?: number
    auth?: {
      token?: string
    }
  }
}

export interface WebSocketEvent {
  type: string
  data: any
  timestamp: Date
  id: string
}

export interface WebSocketMessage {
  event: string
  data: any
  id?: string
  timestamp?: Date
}

export interface WebSocketStatus {
  connected: boolean
  connecting: boolean
  reconnecting: boolean
  error: string | null
  lastConnected: Date | null
  reconnectAttempts: number
}

export interface WebSocketSubscription {
  event: string
  handler: (data: any) => void
  id: string
}

class WebSocketClient {
  private socket: Socket | null = null
  private config: WebSocketConfig
  private status: WebSocketStatus
  private subscriptions: Map<string, WebSocketSubscription[]> = new Map()
  private eventHandlers: Map<string, (data: any) => void> = new Map()
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isDestroyed = false

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      options: {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        ...config.options
      }
    }

    this.status = {
      connected: false,
      connecting: false,
      reconnecting: false,
      error: null,
      lastConnected: null,
      reconnectAttempts: 0
    }

    if (this.config.options?.autoConnect) {
      this.connect()
    }
  }

  // Connection management
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve()
        return
      }

      this.status.connecting = true
      this.status.error = null

      try {
        this.socket = io(this.config.url, {
          ...this.config.options,
          auth: {
            token: this.getAuthToken()
          }
        })

        this.setupEventListeners()

        this.socket.on('connect', () => {
          this.status.connected = true
          this.status.connecting = false
          this.status.reconnecting = false
          this.status.error = null
          this.status.lastConnected = new Date()
          this.status.reconnectAttempts = 0

          this.startHeartbeat()
          this.emit('status-change', this.status)
          resolve()
        })

        this.socket.on('connect_error', (error) => {
          this.status.connecting = false
          this.status.error = error.message
          this.emit('status-change', this.status)
          reject(error)
        })

        this.socket.on('disconnect', (reason) => {
          this.status.connected = false
          this.status.connecting = false
          this.stopHeartbeat()
          this.emit('status-change', this.status)
          
          if (reason === 'io server disconnect') {
            // Server disconnected, try to reconnect
            this.handleReconnection()
          }
        })

      } catch (error) {
        this.status.connecting = false
        this.status.error = error instanceof Error ? error.message : 'Connection failed'
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    this.status.connected = false
    this.status.connecting = false
    this.status.reconnecting = false
    this.stopHeartbeat()
    this.clearReconnectTimer()
  }

  destroy(): void {
    this.isDestroyed = true
    this.disconnect()
    this.subscriptions.clear()
    this.eventHandlers.clear()
  }

  // Event subscription
  subscribe(event: string, handler: (data: any) => void): string {
    const subscriptionId = Math.random().toString(36).substr(2, 9)
    
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, [])
    }
    
    this.subscriptions.get(event)!.push({
      event,
      handler,
      id: subscriptionId
    })

    // If socket is connected, subscribe to the event
    if (this.socket?.connected) {
      this.socket.on(event, handler)
    }

    return subscriptionId
  }

  unsubscribe(event: string, subscriptionId: string): void {
    const subscriptions = this.subscriptions.get(event)
    if (subscriptions) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId)
      if (index !== -1) {
        const subscription = subscriptions[index]
        this.socket?.off(event, subscription.handler)
        subscriptions.splice(index, 1)
        
        if (subscriptions.length === 0) {
          this.subscriptions.delete(event)
        }
      }
    }
  }

  // Event emission
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn(`Cannot emit event '${event}': WebSocket not connected`)
    }
  }

  // Message handling
  send(message: WebSocketMessage): void {
    if (this.socket?.connected) {
      this.socket.emit('message', {
        ...message,
        timestamp: new Date()
      })
    }
  }

  // Status and connection info
  getStatus(): WebSocketStatus {
    return { ...this.status }
  }

  isConnected(): boolean {
    return this.status.connected && this.socket?.connected === true
  }

  // Authentication
  private getAuthToken(): string | undefined {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken') || undefined
    }
    return undefined
  }

  updateAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token)
    }
    
    // Reconnect with new token if connected
    if (this.isConnected()) {
      this.disconnect()
      this.connect()
    }
  }

  // Heartbeat mechanism
  private startHeartbeat(): void {
    this.stopHeartbeat()
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.emit('ping')
      }
    }, 30000) // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Reconnection handling
  private handleReconnection(): void {
    if (this.isDestroyed || !this.config.options?.reconnection) {
      return
    }

    this.status.reconnecting = true
    this.status.reconnectAttempts++

    if (this.status.reconnectAttempts <= (this.config.options.reconnectionAttempts || 5)) {
      const delay = (this.config.options.reconnectionDelay || 1000) * this.status.reconnectAttempts
      
      this.reconnectTimer = setTimeout(() => {
        this.connect().catch(() => {
          // Reconnection failed, will be handled by connect_error event
        })
      }, delay)
    } else {
      this.status.reconnecting = false
      this.status.error = 'Max reconnection attempts reached'
      this.emit('status-change', this.status)
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  // Event listener setup
  private setupEventListeners(): void {
    if (!this.socket) return

    // Handle pong responses
    this.socket.on('pong', () => {
      // Heartbeat received
    })

    // Handle authentication errors
    this.socket.on('auth_error', (error) => {
      this.status.error = error.message
      this.emit('auth-error', error)
    })

    // Handle general errors
    this.socket.on('error', (error) => {
      this.status.error = error.message
      this.emit('error', error)
    })

    // Handle custom events
    this.socket.onAny((event, data) => {
      this.emit('message', { event, data, timestamp: new Date() })
    })
  }

  // Re-subscribe to events after reconnection
  private resubscribeToEvents(): void {
    for (const [event, subscriptions] of this.subscriptions) {
      for (const subscription of subscriptions) {
        this.socket?.on(event, subscription.handler)
      }
    }
  }

  // Utility methods
  waitForConnection(timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        resolve()
        return
      }

      const timer = setTimeout(() => {
        reject(new Error('Connection timeout'))
      }, timeout)

      const checkConnection = () => {
        if (this.isConnected()) {
          clearTimeout(timer)
          resolve()
        } else if (this.status.error) {
          clearTimeout(timer)
          reject(new Error(this.status.error))
        } else {
          setTimeout(checkConnection, 100)
        }
      }

      checkConnection()
    })
  }

  // Batch operations
  batchEmit(events: Array<{ event: string; data?: any }>): void {
    if (this.isConnected()) {
      this.emit('batch', events)
    }
  }

  // Room management
  joinRoom(room: string): void {
    this.emit('join-room', { room })
  }

  leaveRoom(room: string): void {
    this.emit('leave-room', { room })
  }

  // Presence management
  updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): void {
    this.emit('presence-update', { status })
  }
}

// WebSocket hook for React components
export const useWebSocket = (config: WebSocketConfig) => {
  const [client] = React.useState(() => new WebSocketClient(config))
  const [status, setStatus] = React.useState<WebSocketStatus>(client.getStatus())

  React.useEffect(() => {
    const handleStatusChange = (newStatus: WebSocketStatus) => {
      setStatus(newStatus)
    }

    client.subscribe('status-change', handleStatusChange)

    return () => {
      client.unsubscribe('status-change', handleStatusChange)
      client.destroy()
    }
  }, [client])

  return {
    client,
    status,
    connect: () => client.connect(),
    disconnect: () => client.disconnect(),
    emit: (event: string, data?: any) => client.emit(event, data),
    subscribe: (event: string, handler: (data: any) => void) => client.subscribe(event, handler),
    unsubscribe: (event: string, subscriptionId: string) => client.unsubscribe(event, subscriptionId),
    isConnected: () => client.isConnected(),
    waitForConnection: (timeout?: number) => client.waitForConnection(timeout)
  }
}

export default WebSocketClient
