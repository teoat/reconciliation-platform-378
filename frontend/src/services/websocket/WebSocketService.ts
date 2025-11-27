/**
 * WebSocket Service
 * 
 * Core WebSocket service for real-time collaboration
 * Refactored from 921 lines to ~250 lines by extracting handlers and utilities
 */

import { logger } from '@/services/logger';
import { APP_CONFIG } from '../../config/AppConfig';
import type { WebSocketMessage, WebSocketConfig, ConnectionStatus } from './types';
import { MessageQueue } from './utils/messageQueue';
import { createConnectionHandlers, type ConnectionState } from './handlers/connectionHandlers';
import { createMessageHandlers } from './handlers/messageHandlers';
import { handlePresenceMessage } from './handlers/presenceHandlers';
import { handleCollaborationMessage } from './handlers/collaborationHandlers';
import { MessageType } from './types';

class WebSocketService {
  static instance: WebSocketService | null = null;

  private config: WebSocketConfig;
  private connectionState: ConnectionState;
  private messageQueue: MessageQueue;
  private listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  private presenceState = { presence: new Map(), userId: '' };
  private collaborationSessions = new Map();

  // Handlers
  private connectionHandlers: ReturnType<typeof createConnectionHandlers>;
  private presenceHandlers: ReturnType<typeof handlePresenceMessage>;
  private collaborationHandlers: ReturnType<typeof handleCollaborationMessage>;
  private messageHandlers: ReturnType<typeof createMessageHandlers>;

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  constructor() {
    // Use unified config from AppConfig (SSOT)
    this.config = {
      url: APP_CONFIG.WS_URL || 'ws://localhost:2000',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      pingInterval: 30000,
      pongTimeout: 5000,
      messageQueueSize: 100,
      enablePresence: true,
      enableCollaboration: true,
      enableNotifications: true,
    };

    this.messageQueue = new MessageQueue(this.config.messageQueueSize);
    this.connectionState = {
      socket: null,
      isConnected: false,
      reconnectAttempts: 0,
      reconnectTimer: undefined,
      pingTimer: undefined,
      pongTimer: undefined,
      userId: '',
      sessionId: this.generateSessionId(),
      config: this.config,
    };

    // Initialize handlers
    this.presenceHandlers = handlePresenceMessage(this.presenceState, {
      emit: this.emit.bind(this),
      sendMessage: this.sendMessage.bind(this),
      config: this.config,
    });

    this.collaborationHandlers = handleCollaborationMessage({
      emit: this.emit.bind(this),
      sendMessage: this.sendMessage.bind(this),
      config: this.config,
    });

    // Create message handlers first (needed for connection callbacks)
    this.messageHandlers = createMessageHandlers(
      {
        emit: this.emit.bind(this),
        handlePong: () => {
          if (this.connectionState.pongTimer) {
            clearTimeout(this.connectionState.pongTimer);
            this.connectionState.pongTimer = undefined;
          }
        },
      },
      this.presenceHandlers,
      this.collaborationHandlers
    );

    this.connectionHandlers = createConnectionHandlers(this.connectionState, {
      onConnected: () => {
        this.connectionHandlers.startPingTimer();
        this.processMessageQueue();
        this.emit('connected');
      },
      onMessage: (data) => {
        this.messageHandlers.handleMessage(data);
      },
      onDisconnected: (code, reason) => {
        this.emit('disconnected', { code, reason });
      },
      onError: (error) => {
        this.emit('error', error);
      },
      onMaxReconnectAttemptsReached: () => {
        this.emit('maxReconnectAttemptsReached');
      },
      sendMessage: this.sendMessage.bind(this),
    });

    this.init();
  }

  private init(): void {
    // Get user ID from storage
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        this.connectionState.userId = user.id;
        this.presenceState.userId = user.id;
      }
    } catch (error: unknown) {
      logger.error('Failed to get user ID', { error });
    }

    // Connect when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.connectionState.isConnected) {
        this.connectionHandlers.connect();
      }
    });

    // Connect on page load
    if (document.visibilityState === 'visible') {
      this.connectionHandlers.connect();
    }
  }

  // Public connection methods
  async connect(): Promise<void> {
    return this.connectionHandlers.connect();
  }

  disconnect(): void {
    this.connectionHandlers.disconnect();
  }

  // Public message methods
  sendMessage(message: Partial<WebSocketMessage>): void {
    if (!message.type) {
      logger.error('Cannot send message without type', { message });
      return;
    }

    const fullMessage: WebSocketMessage = {
      ...message,
      type: message.type,
      id: this.generateMessageId(),
      timestamp: Date.now(),
      userId: this.connectionState.userId,
      sessionId: this.connectionState.sessionId,
      data: message.data ?? {},
      metadata: message.metadata ?? {},
    };

    if (this.connectionState.isConnected && this.connectionState.socket) {
      try {
        this.connectionState.socket.send(JSON.stringify(fullMessage));
      } catch (error: unknown) {
        logger.error('Failed to send message', { error });
        this.messageQueue.enqueue(fullMessage);
      }
    } else {
      this.messageQueue.enqueue(fullMessage);
    }
  }

  private processMessageQueue(): void {
    while (!this.messageQueue.isEmpty() && this.connectionState.isConnected) {
      const message = this.messageQueue.dequeue();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  // Presence methods
  updatePresence(presence: Partial<import('./types').UserPresence>): void {
    this.presenceHandlers.updatePresence(presence);
  }

  getPresence(): Map<string, import('./types').UserPresence> {
    return this.presenceHandlers.getPresence();
  }

  getUserPresence(userId: string): import('./types').UserPresence | undefined {
    return this.presenceHandlers.getUserPresence(userId);
  }

  // Collaboration methods
  joinCollaborationSession(projectId: string): void {
    this.collaborationHandlers.joinCollaborationSession(projectId);
  }

  leaveCollaborationSession(projectId: string): void {
    this.collaborationHandlers.leaveCollaborationSession(projectId);
  }

  sendCursorMove(cursor: { x: number; y: number }): void {
    this.collaborationHandlers.sendCursorMove(cursor);
  }

  sendSelectionChange(selection: { start: number; end: number }): void {
    this.collaborationHandlers.sendSelectionChange(selection);
  }

  sendTextEdit(fieldId: string, change: unknown): void {
    this.collaborationHandlers.sendTextEdit(fieldId, change);
  }

  sendFieldUpdate(fieldId: string, value: unknown): void {
    this.collaborationHandlers.sendFieldUpdate(fieldId, value);
  }

  requestDataSync(projectId: string, dataType: string): void {
    this.collaborationHandlers.requestDataSync(projectId, dataType);
  }

  sendDataSync(projectId: string, dataType: string, data: unknown): void {
    this.collaborationHandlers.sendDataSync(projectId, dataType, data);
  }

  // Notification methods
  sendNotification(userId: string, notification: Record<string, unknown>): void {
    if (!this.config.enableNotifications) return;

    this.sendMessage({
      type: MessageType.NOTIFICATION,
      data: {
        targetUserId: userId,
        notification,
      },
    });
  }

  // Event system
  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (...args: unknown[]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: unknown[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }

  // Utility methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isWebSocketConnected(): boolean {
    return this.connectionHandlers.isWebSocketConnected();
  }

  getConnectionStatus(): ConnectionStatus {
    const status = this.connectionHandlers.getConnectionStatus();
    return {
      ...status,
      messageQueueSize: this.messageQueue.size(),
    };
  }
}

export default WebSocketService;
