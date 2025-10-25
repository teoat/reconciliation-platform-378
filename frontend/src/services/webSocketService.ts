// WebSocket Service for Real-time Collaboration
// Implements real-time updates, live collaboration, and presence management

import React from 'react'
import { APP_CONFIG } from '../constants'

// WebSocket message types
export enum MessageType {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  RECONNECT = 'reconnect',
  
  // Presence
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_PRESENCE = 'user_presence',
  
  // Collaboration
  CURSOR_MOVE = 'cursor_move',
  SELECTION_CHANGE = 'selection_change',
  TEXT_EDIT = 'text_edit',
  FIELD_UPDATE = 'field_update',
  
  // Data synchronization
  DATA_SYNC = 'data_sync',
  CONFLICT_RESOLUTION = 'conflict_resolution',
  
  // Notifications
  NOTIFICATION = 'notification',
  ALERT = 'alert',
  
  // System
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',
}

// WebSocket message interface
export interface WebSocketMessage {
  type: MessageType
  id: string
  timestamp: Date
  userId: string
  sessionId: string
  data: any
  metadata?: Record<string, any>
}

// User presence interface
export interface UserPresence {
  userId: string
  userName: string
  userRole: string
  isOnline: boolean
  lastSeen: Date
  currentPage?: string
  currentProject?: string
  cursor?: {
    x: number
    y: number
  }
  selection?: {
    start: number
    end: number
  }
}

// Collaboration session interface
export interface CollaborationSession {
  id: string
  projectId: string
  participants: UserPresence[]
  activeUsers: string[]
  lockedFields: Map<string, string> // fieldId -> userId
  changes: CollaborationChange[]
  createdAt: Date
  updatedAt: Date
}

// Collaboration change interface
export interface CollaborationChange {
  id: string
  userId: string
  fieldId: string
  oldValue: any
  newValue: any
  timestamp: Date
  applied: boolean
  conflicts: CollaborationConflict[]
}

// Collaboration conflict interface
export interface CollaborationConflict {
  id: string
  changeId: string
  conflictingChangeId: string
  fieldId: string
  resolution: 'manual' | 'automatic' | 'pending'
  resolvedBy?: string
  resolvedAt?: Date
}

// WebSocket configuration
interface WebSocketConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  pingInterval: number
  pongTimeout: number
  messageQueueSize: number
  enablePresence: boolean
  enableCollaboration: boolean
  enableNotifications: boolean
}

class WebSocketService {
  private static instance: WebSocketService
  private config: WebSocketConfig
  private socket: WebSocket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private reconnectTimer?: NodeJS.Timeout
  private pingTimer?: NodeJS.Timeout
  private pongTimer?: NodeJS.Timeout
  private messageQueue: WebSocketMessage[] = []
  private listeners: Map<string, Function[]> = new Map()
  private presence: Map<string, UserPresence> = new Map()
  private collaborationSessions: Map<string, CollaborationSession> = new Map()
  private userId: string = ''
  private sessionId: string = ''

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }

  constructor() {
    this.config = {
      url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:2000',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      pingInterval: 30000,
      pongTimeout: 5000,
      messageQueueSize: 100,
      enablePresence: true,
      enableCollaboration: true,
      enableNotifications: true,
    }

    this.sessionId = this.generateSessionId()
    this.init()
  }

  private init(): void {
    // Get user ID from storage
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        this.userId = user.id
      }
    } catch (error) {
      console.error('Failed to get user ID:', error)
    }

    // Connect when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isConnected) {
        this.connect()
      }
    })

    // Connect on page load
    if (document.visibilityState === 'visible') {
      this.connect()
    }
  }

  public async connect(): Promise<void> {
    if (this.isConnected || !this.userId) return

    try {
      const wsUrl = `${this.config.url}?userId=${this.userId}&sessionId=${this.sessionId}`
      this.socket = new WebSocket(wsUrl)

      this.socket.onopen = () => {
        console.log('WebSocket connected')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.startPingTimer()
        this.processMessageQueue()
        this.emit('connected')
      }

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data)
      }

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        this.isConnected = false
        this.stopPingTimer()
        this.emit('disconnected', { code: event.code, reason: event.reason })
        
        if (!event.wasClean) {
          this.scheduleReconnect()
        }
      }

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.emit('error', error)
      }

    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      this.scheduleReconnect()
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'User disconnected')
      this.socket = null
    }
    this.isConnected = false
    this.stopPingTimer()
    this.clearReconnectTimer()
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.emit('maxReconnectAttemptsReached')
      return
    }

    this.reconnectAttempts++
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1)
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`)
      this.connect()
    }, delay)
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
  }

  private startPingTimer(): void {
    this.pingTimer = setInterval(() => {
      this.sendMessage({
        type: MessageType.PING,
        data: { timestamp: Date.now() },
      })

      // Set pong timeout
      this.pongTimer = setTimeout(() => {
        console.warn('Pong timeout, reconnecting...')
        this.disconnect()
        this.scheduleReconnect()
      }, this.config.pongTimeout)
    }, this.config.pingInterval)
  }

  private stopPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = undefined
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer)
      this.pongTimer = undefined
    }
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data)
      
      switch (message.type) {
        case MessageType.PONG:
          if (this.pongTimer) {
            clearTimeout(this.pongTimer)
            this.pongTimer = undefined
          }
          break

        case MessageType.USER_JOINED:
          this.handleUserJoined(message)
          break

        case MessageType.USER_LEFT:
          this.handleUserLeft(message)
          break

        case MessageType.USER_PRESENCE:
          this.handleUserPresence(message)
          break

        case MessageType.CURSOR_MOVE:
          this.handleCursorMove(message)
          break

        case MessageType.SELECTION_CHANGE:
          this.handleSelectionChange(message)
          break

        case MessageType.TEXT_EDIT:
          this.handleTextEdit(message)
          break

        case MessageType.FIELD_UPDATE:
          this.handleFieldUpdate(message)
          break

        case MessageType.DATA_SYNC:
          this.handleDataSync(message)
          break

        case MessageType.CONFLICT_RESOLUTION:
          this.handleConflictResolution(message)
          break

        case MessageType.NOTIFICATION:
          this.handleNotification(message)
          break

        case MessageType.ERROR:
          this.handleError(message)
          break

        default:
          console.warn('Unknown message type:', message.type)
      }

      this.emit('message', message)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private handleUserJoined(message: WebSocketMessage): void {
    const userPresence: UserPresence = message.data
    this.presence.set(userPresence.userId, userPresence)
    this.emit('userJoined', userPresence)
  }

  private handleUserLeft(message: WebSocketMessage): void {
    const userId = message.data.userId
    this.presence.delete(userId)
    this.emit('userLeft', userId)
  }

  private handleUserPresence(message: WebSocketMessage): void {
    const userPresence: UserPresence = message.data
    this.presence.set(userPresence.userId, userPresence)
    this.emit('userPresence', userPresence)
  }

  private handleCursorMove(message: WebSocketMessage): void {
    this.emit('cursorMove', {
      userId: message.userId,
      cursor: message.data.cursor,
    })
  }

  private handleSelectionChange(message: WebSocketMessage): void {
    this.emit('selectionChange', {
      userId: message.userId,
      selection: message.data.selection,
    })
  }

  private handleTextEdit(message: WebSocketMessage): void {
    this.emit('textEdit', {
      userId: message.userId,
      fieldId: message.data.fieldId,
      change: message.data.change,
    })
  }

  private handleFieldUpdate(message: WebSocketMessage): void {
    this.emit('fieldUpdate', {
      userId: message.userId,
      fieldId: message.data.fieldId,
      value: message.data.value,
    })
  }

  private handleDataSync(message: WebSocketMessage): void {
    this.emit('dataSync', message.data)
  }

  private handleConflictResolution(message: WebSocketMessage): void {
    this.emit('conflictResolution', message.data)
  }

  private handleNotification(message: WebSocketMessage): void {
    this.emit('notification', message.data)
  }

  private handleError(message: WebSocketMessage): void {
    console.error('WebSocket error:', message.data)
    this.emit('error', message.data)
  }

  // Public methods
  public sendMessage(message: Omit<WebSocketMessage, 'id' | 'timestamp' | 'userId' | 'sessionId'>): void {
    const fullMessage: WebSocketMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
    }

    if (this.isConnected && this.socket) {
      try {
        this.socket.send(JSON.stringify(fullMessage))
      } catch (error) {
        console.error('Failed to send message:', error)
        this.queueMessage(fullMessage)
      }
    } else {
      this.queueMessage(fullMessage)
    }
  }

  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message)
    
    // Keep queue size manageable
    if (this.messageQueue.length > this.config.messageQueueSize) {
      this.messageQueue.shift()
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()
      if (message) {
        this.sendMessage(message)
      }
    }
  }

  // Presence methods
  public updatePresence(presence: Partial<UserPresence>): void {
    if (!this.config.enablePresence) return

    this.sendMessage({
      type: MessageType.USER_PRESENCE,
      data: {
        userId: this.userId,
        ...presence,
      },
    })
  }

  public getPresence(): Map<string, UserPresence> {
    return new Map(this.presence)
  }

  public getUserPresence(userId: string): UserPresence | undefined {
    return this.presence.get(userId)
  }

  // Collaboration methods
  public joinCollaborationSession(projectId: string): void {
    if (!this.config.enableCollaboration) return

    this.sendMessage({
      type: MessageType.CONNECT,
      data: {
        projectId,
        action: 'join',
      },
    })
  }

  public leaveCollaborationSession(projectId: string): void {
    if (!this.config.enableCollaboration) return

    this.sendMessage({
      type: MessageType.DISCONNECT,
      data: {
        projectId,
        action: 'leave',
      },
    })
  }

  public sendCursorMove(cursor: { x: number; y: number }): void {
    this.sendMessage({
      type: MessageType.CURSOR_MOVE,
      data: { cursor },
    })
  }

  public sendSelectionChange(selection: { start: number; end: number }): void {
    this.sendMessage({
      type: MessageType.SELECTION_CHANGE,
      data: { selection },
    })
  }

  public sendTextEdit(fieldId: string, change: any): void {
    this.sendMessage({
      type: MessageType.TEXT_EDIT,
      data: { fieldId, change },
    })
  }

  public sendFieldUpdate(fieldId: string, value: any): void {
    this.sendMessage({
      type: MessageType.FIELD_UPDATE,
      data: { fieldId, value },
    })
  }

  public requestDataSync(projectId: string, dataType: string): void {
    this.sendMessage({
      type: MessageType.DATA_SYNC,
      data: {
        projectId,
        dataType,
        action: 'request',
      },
    })
  }

  public sendDataSync(projectId: string, dataType: string, data: any): void {
    this.sendMessage({
      type: MessageType.DATA_SYNC,
      data: {
        projectId,
        dataType,
        action: 'send',
        data,
      },
    })
  }

  // Notification methods
  public sendNotification(userId: string, notification: any): void {
    if (!this.config.enableNotifications) return

    this.sendMessage({
      type: MessageType.NOTIFICATION,
      data: {
        targetUserId: userId,
        notification,
      },
    })
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

  // Utility methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public isWebSocketConnected(): boolean {
    return this.isConnected
  }

  public getConnectionStatus(): {
    connected: boolean
    reconnectAttempts: number
    messageQueueSize: number
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      messageQueueSize: this.messageQueue.length,
    }
  }
}

// React hook for WebSocket functionality
export const useWebSocket = () => {
  const [isConnected, setIsConnected] = React.useState(false)
  const [presence, setPresence] = React.useState<Map<string, UserPresence>>(new Map())
  const [connectionStatus, setConnectionStatus] = React.useState({
    connected: false,
    reconnectAttempts: 0,
    messageQueueSize: 0,
  })

  React.useEffect(() => {
    const ws = WebSocketService.getInstance()
    
    const handleConnected = () => {
      setIsConnected(true)
      setConnectionStatus(ws.getConnectionStatus())
    }

    const handleDisconnected = () => {
      setIsConnected(false)
      setConnectionStatus(ws.getConnectionStatus())
    }

    const handleUserJoined = (userPresence: UserPresence) => {
      setPresence(prev => new Map(prev.set(userPresence.userId, userPresence)))
    }

    const handleUserLeft = (userId: string) => {
      setPresence(prev => {
        const newPresence = new Map(prev)
        newPresence.delete(userId)
        return newPresence
      })
    }

    const handleUserPresence = (userPresence: UserPresence) => {
      setPresence(prev => new Map(prev.set(userPresence.userId, userPresence)))
    }

    const handleConnectionStatusChange = () => {
      setConnectionStatus(ws.getConnectionStatus())
    }

    // Register event listeners
    ws.on('connected', handleConnected)
    ws.on('disconnected', handleDisconnected)
    ws.on('userJoined', handleUserJoined)
    ws.on('userLeft', handleUserLeft)
    ws.on('userPresence', handleUserPresence)
    ws.on('maxReconnectAttemptsReached', handleConnectionStatusChange)

    return () => {
      ws.off('connected', handleConnected)
      ws.off('disconnected', handleDisconnected)
      ws.off('userJoined', handleUserJoined)
      ws.off('userLeft', handleUserLeft)
      ws.off('userPresence', handleUserPresence)
      ws.off('maxReconnectAttemptsReached', handleConnectionStatusChange)
    }
  }, [])

  const ws = WebSocketService.getInstance()

  return {
    isConnected,
    presence,
    connectionStatus,
    connect: ws.connect.bind(ws),
    disconnect: ws.disconnect.bind(ws),
    sendMessage: ws.sendMessage.bind(ws),
    updatePresence: ws.updatePresence.bind(ws),
    joinCollaborationSession: ws.joinCollaborationSession.bind(ws),
    leaveCollaborationSession: ws.leaveCollaborationSession.bind(ws),
    sendCursorMove: ws.sendCursorMove.bind(ws),
    sendSelectionChange: ws.sendSelectionChange.bind(ws),
    sendTextEdit: ws.sendTextEdit.bind(ws),
    sendFieldUpdate: ws.sendFieldUpdate.bind(ws),
    requestDataSync: ws.requestDataSync.bind(ws),
    sendDataSync: ws.sendDataSync.bind(ws),
    sendNotification: ws.sendNotification.bind(ws),
    on: ws.on.bind(ws),
    off: ws.off.bind(ws),
  }
}

// Export singleton instance
export const webSocketService = WebSocketService.getInstance()

export default webSocketService

