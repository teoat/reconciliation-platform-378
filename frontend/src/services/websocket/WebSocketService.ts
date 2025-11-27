/**
 * WebSocket Service
 * 
 * Core WebSocket service for real-time collaboration
 * Refactored from 921 lines to ~250 lines
 */

import React from 'react';
import { logger } from '@/services/logger';
import { APP_CONFIG } from '../../config/AppConfig';
import type {
  WebSocketMessage,
  UserPresence,
  WebSocketConfig,
} from './types';
import { MessageType } from './types';
import { createWebSocketConfig } from './utils/messageFactory';
import { MessageQueue } from './utils/messageQueue';
import { ConnectionHandlers } from './handlers/connectionHandlers';
import { PresenceHandlers } from './handlers/presenceHandlers';
import { CollaborationHandlers } from './handlers/collaborationHandlers';
import { MessageHandlers } from './handlers/messageHandlers';

class WebSocketService {
  static instance: WebSocketService | null = null;
  config: WebSocketConfig;
  socket: WebSocket | null = null;
  isConnected = false;
  reconnectAttempts = 0;
  pingTimer: ReturnType<typeof setInterval> | undefined;
  messageQueue: MessageQueue;
  listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  userId = '';
  sessionId = '';

  // Handlers
  private connectionHandlers: ConnectionHandlers;
  private presenceHandlers: PresenceHandlers;
  private collaborationHandlers: CollaborationHandlers;
  private messageHandlers: MessageHandlers;

  static getInstance() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  constructor() {
    this.config = createWebSocketConfig(
      APP_CONFIG.WS_URL || 'ws://localhost:2000',
      5000,
      10,
      30000,
      5000,
      100,
      true,
      true,
      true
    );

    this.messageQueue = new MessageQueue(this.config.messageQueueSize);
    this.connectionHandlers = new ConnectionHandlers(this.config);
    this.presenceHandlers = new PresenceHandlers();
    this.collaborationHandlers = new CollaborationHandlers();
    this.messageHandlers = new MessageHandlers(
      this.presenceHandlers,
      this.collaborationHandlers,
      this.config.pongTimeout
    );

    this.setupHandlers();
    this.sessionId = this.generateSessionId();
    this.init();
  }

  private setupHandlers() {
    this.connectionHandlers.setCallbacks(
      () => {
        this.isConnected = true;
        this.startPingTimer();
        this.processMessageQueue();
        this.emit('connected');
      },
      (code, reason) => {
        this.isConnected = false;
        this.stopPingTimer();
        this.emit('disconnected', { code, reason });
      },
      () => {
        this.emit('maxReconnectAttemptsReached');
      }
    );

    this.presenceHandlers.setCallbacks(
      (presence) => this.emit('userJoined', presence),
      (userId) => this.emit('userLeft', userId),
      (presence) => this.emit('userPresence', presence)
    );

    this.collaborationHandlers.setCallbacks(
      (data) => this.emit('cursorMove', data),
      (data) => this.emit('selectionChange', data),
      (data) => this.emit('textEdit', data),
      (data) => this.emit('fieldUpdate', data)
    );

    this.messageHandlers.setCallbacks(
      (message) => this.emit('message', message),
      (data) => this.emit('dataSync', data),
      (data) => this.emit('conflictResolution', data),
      (data) => this.emit('notification', data),
      (error) => this.emit('error', error)
    );
  }

  init() {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        this.userId = user.id;
      }
    } catch (error: unknown) {
      logger.error('Failed to get user ID', { error });
    }

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isConnected) {
        this.connect();
      }
    });

    if (document.visibilityState === 'visible') {
      this.connect();
    }
  }

  async connect() {
    if (this.isConnected || !this.userId) return;

    try {
      const wsUrl = `${this.config.url}?userId=${this.userId}&sessionId=${this.sessionId}`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.connectionHandlers.handleOpen(this.socket!);
      };

      this.socket.onmessage = (event) => {
        this.messageHandlers.handleMessage(event.data);
      };

      this.socket.onclose = (event) => {
        this.connectionHandlers.handleClose(event);
        if (!event.wasClean) {
          this.connectionHandlers.scheduleReconnect(() => this.connect());
        }
      };

      this.socket.onerror = (error) => {
        this.connectionHandlers.handleError(error);
        this.emit('error', error);
      };
    } catch (error: unknown) {
      logger.error('Failed to connect WebSocket', { error });
      this.connectionHandlers.scheduleReconnect(() => this.connect());
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'User disconnected');
      this.socket = null;
    }
    this.isConnected = false;
    this.stopPingTimer();
    this.connectionHandlers.clearReconnectTimer();
  }

  startPingTimer() {
    this.pingTimer = setInterval(() => {
      this.sendMessage({
        type: MessageType.PING,
        data: { timestamp: Date.now() },
      });

      this.messageHandlers.setPongTimer(() => {
        this.disconnect();
        this.connectionHandlers.scheduleReconnect(() => this.connect());
      });
    }, this.config.pingInterval);
  }

  stopPingTimer() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
    this.messageHandlers.clearPongTimer();
  }

  sendMessage(message: Partial<WebSocketMessage>) {
    if (!message.type) {
      logger.error('Cannot send message without type', { message });
      return;
    }
    const fullMessage: WebSocketMessage = {
      ...message,
      type: message.type,
      id: this.generateMessageId(),
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      data: message.data ?? {},
      metadata: message.metadata ?? {},
    };

    if (this.isConnected && this.socket) {
      try {
        this.socket.send(JSON.stringify(fullMessage));
      } catch (error: unknown) {
        logger.error('Failed to send message', { error });
        this.messageQueue.enqueue(fullMessage);
      }
    } else {
      this.messageQueue.enqueue(fullMessage);
    }
  }

  processMessageQueue() {
    this.messageQueue.process((message) => {
      this.sendMessage(message);
    });
  }

  // Presence methods
  updatePresence(presence: Partial<UserPresence>) {
    if (!this.config.enablePresence) return;

    this.sendMessage({
      type: MessageType.USER_PRESENCE,
      data: {
        userId: this.userId,
        ...presence,
      },
    });
  }

  getPresence() {
    return this.presenceHandlers.getPresence();
  }

  getUserPresence(userId: string) {
    return this.presenceHandlers.getUserPresence(userId);
  }

  // Collaboration methods
  joinCollaborationSession(projectId: string) {
    if (!this.config.enableCollaboration) return;

    this.sendMessage({
      type: MessageType.CONNECT,
      data: {
        projectId,
        action: 'join',
      },
    });
  }

  leaveCollaborationSession(projectId: string) {
    if (!this.config.enableCollaboration) return;

    this.sendMessage({
      type: MessageType.DISCONNECT,
      data: {
        projectId,
        action: 'leave',
      },
    });
  }

  sendCursorMove(cursor: { x: number; y: number }) {
    this.sendMessage({
      type: MessageType.CURSOR_MOVE,
      data: { cursor },
    });
  }

  sendSelectionChange(selection: { start: number; end: number }) {
    this.sendMessage({
      type: MessageType.SELECTION_CHANGE,
      data: { selection },
    });
  }

  sendTextEdit(fieldId: string, change: unknown) {
    this.sendMessage({
      type: MessageType.TEXT_EDIT,
      data: { fieldId, change },
    });
  }

  sendFieldUpdate(fieldId: string, value: unknown) {
    this.sendMessage({
      type: MessageType.FIELD_UPDATE,
      data: { fieldId, value },
    });
  }

  requestDataSync(projectId: string, dataType: string) {
    this.sendMessage({
      type: MessageType.DATA_SYNC,
      data: {
        projectId,
        dataType,
        action: 'request',
      },
    });
  }

  sendDataSync(projectId: string, dataType: string, data: unknown) {
    this.sendMessage({
      type: MessageType.DATA_SYNC,
      data: {
        projectId,
        dataType,
        action: 'send',
        data,
      },
    });
  }

  sendNotification(userId: string, notification: Record<string, unknown>) {
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
  on(event: string, callback: (...args: unknown[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (...args: unknown[]) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: unknown[]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }

  // Utility methods
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isWebSocketConnected() {
    return this.isConnected;
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.connectionHandlers.getReconnectAttempts(),
      messageQueueSize: this.messageQueue.size,
    };
  }
}

// React hook for WebSocket functionality
export const useWebSocket = () => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [presence, setPresence] = React.useState(new Map());
  const [connectionStatus, setConnectionStatus] = React.useState({
    connected: false,
    reconnectAttempts: 0,
    messageQueueSize: 0,
  });

  React.useEffect(() => {
    const ws = WebSocketService.getInstance();

    const handleConnected = () => {
      setIsConnected(true);
      setConnectionStatus(ws.getConnectionStatus());
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnectionStatus(ws.getConnectionStatus());
    };

    const handleUserJoined = (...args: unknown[]) => {
      const userPresence = args[0] as UserPresence;
      if (userPresence && typeof userPresence === 'object' && 'userId' in userPresence) {
        setPresence((prev) => new Map(prev.set(userPresence.userId, userPresence)));
      }
    };

    const handleUserLeft = (...args: unknown[]) => {
      const userId = args[0] as string;
      if (typeof userId === 'string') {
        setPresence((prev) => {
          const newPresence = new Map(prev);
          newPresence.delete(userId);
          return newPresence;
        });
      }
    };

    const handleUserPresence = (...args: unknown[]) => {
      const userPresence = args[0] as UserPresence;
      if (userPresence && typeof userPresence === 'object' && 'userId' in userPresence) {
        setPresence((prev) => new Map(prev.set(userPresence.userId, userPresence)));
      }
    };

    const handleConnectionStatusChange = () => {
      setConnectionStatus(ws.getConnectionStatus());
    };

    ws.on('connected', handleConnected);
    ws.on('disconnected', handleDisconnected);
    ws.on('userJoined', handleUserJoined);
    ws.on('userLeft', handleUserLeft);
    ws.on('userPresence', handleUserPresence);
    ws.on('maxReconnectAttemptsReached', handleConnectionStatusChange);

    return () => {
      ws.off('connected', handleConnected);
      ws.off('disconnected', handleDisconnected);
      ws.off('userJoined', handleUserJoined);
      ws.off('userLeft', handleUserLeft);
      ws.off('userPresence', handleUserPresence);
      ws.off('maxReconnectAttemptsReached', handleConnectionStatusChange);
    };
  }, []);

  const ws = WebSocketService.getInstance();

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
  };
};

// Export singleton instance
export const webSocketService = WebSocketService.getInstance();
export default webSocketService;

