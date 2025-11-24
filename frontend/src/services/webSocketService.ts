// WebSocket Service for Real-time Collaboration
import { logger } from '@/services/logger';
// Implements real-time updates, live collaboration, and presence management

import React from 'react';
import { APP_CONFIG } from '../config/AppConfig';

// WebSocket message interfaces
export interface WebSocketMessage {
  type: string;
  id: string;
  timestamp: number;
  userId: string;
  sessionId: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UserPresence {
  userId: string;
  userName: string;
  userRole: string;
  isOnline: boolean;
  lastSeen: number;
  currentPage: string;
  currentProject: string;
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number };
}

export interface CollaborationSession {
  id: string;
  projectId: string;
  participants: string[];
  activeUsers: UserPresence[];
  lockedFields: string[];
  changes: Array<{
    id: string;
    userId: string;
    fieldId: string;
    oldValue: unknown;
    newValue: unknown;
    timestamp: number;
  }>;
  createdAt: number;
  updatedAt: number;
}

// WebSocket message types
export const MessageType = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',

  // Presence
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  USER_PRESENCE: 'user_presence',

  // Collaboration
  CURSOR_MOVE: 'cursor_move',
  SELECTION_CHANGE: 'selection_change',
  TEXT_EDIT: 'text_edit',
  FIELD_UPDATE: 'field_update',

  // Data synchronization
  DATA_SYNC: 'data_sync',
  CONFLICT_RESOLUTION: 'conflict_resolution',

  // Notifications
  NOTIFICATION: 'notification',
  ALERT: 'alert',

  // System
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error',
};

// WebSocket message structure
export const createWebSocketMessage = (
  type: string,
  id: string,
  timestamp: number,
  userId: string,
  sessionId: string,
  data?: Record<string, unknown>,
  metadata?: Record<string, unknown>
): WebSocketMessage => ({
  type,
  id,
  timestamp,
  userId,
  sessionId,
  data,
  metadata,
});

// User presence structure
export const createUserPresence = (
  userId: string,
  userName: string,
  userRole: string,
  isOnline: boolean,
  lastSeen: number,
  currentPage: string,
  currentProject: string,
  cursor?: { x: number; y: number },
  selection?: { start: number; end: number }
): UserPresence => ({
  userId,
  userName,
  userRole,
  isOnline,
  lastSeen,
  currentPage,
  currentProject,
  cursor,
  selection,
});

// Collaboration session structure
export const createCollaborationSession = (
  id: string,
  projectId: string,
  participants: string[],
  activeUsers: UserPresence[],
  lockedFields: string[],
  changes: Array<{
    id: string;
    userId: string;
    fieldId: string;
    oldValue: unknown;
    newValue: unknown;
    timestamp: number;
  }>,
  createdAt: number,
  updatedAt: number
): CollaborationSession => ({
  id,
  projectId,
  participants,
  activeUsers,
  lockedFields,
  changes,
  createdAt,
  updatedAt,
});

// Collaboration change structure
export const createCollaborationChange = (
  id: string,
  userId: string,
  fieldId: string,
  oldValue: unknown,
  newValue: unknown,
  timestamp: number,
  applied: boolean,
  conflicts: unknown[]
) => ({
  id,
  userId,
  fieldId,
  oldValue,
  newValue,
  timestamp,
  applied,
  conflicts,
});

// Collaboration conflict structure
export const createCollaborationConflict = (
  id: string,
  changeId: string,
  conflictingChangeId: string,
  fieldId: string,
  resolution: string,
  resolvedBy: string | null,
  resolvedAt: number | null
) => ({
  id,
  changeId,
  conflictingChangeId,
  fieldId,
  resolution,
  resolvedBy,
  resolvedAt,
});

// WebSocket configuration
export const createWebSocketConfig = (
  url: string,
  reconnectInterval: number,
  maxReconnectAttempts: number,
  pingInterval: number,
  pongTimeout: number,
  messageQueueSize: number,
  enablePresence: boolean,
  enableCollaboration: boolean,
  enableNotifications: boolean
) => ({
  url,
  reconnectInterval,
  maxReconnectAttempts,
  pingInterval,
  pongTimeout,
  messageQueueSize,
  enablePresence,
  enableCollaboration,
  enableNotifications,
});

class WebSocketService {
  static instance: WebSocketService | null = null;
  config: {
    url: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    pingInterval: number;
    pongTimeout: number;
    messageQueueSize: number;
    enablePresence: boolean;
    enableCollaboration: boolean;
    enableNotifications: boolean;
  };
  socket: WebSocket | null = null;
  isConnected = false;
  reconnectAttempts = 0;
  reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  pingTimer: ReturnType<typeof setInterval> | undefined;
  pongTimer: ReturnType<typeof setTimeout> | undefined;
  messageQueue: WebSocketMessage[] = [];
  listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  presence = new Map<string, UserPresence>();
  collaborationSessions = new Map<string, CollaborationSession>();
  userId = '';
  sessionId = '';

  static getInstance() {
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

    this.sessionId = this.generateSessionId();
    this.init();
  }

  init() {
    // Get user ID from storage
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        this.userId = user.id;
      }
    } catch (error: unknown) {
      logger.error('Failed to get user ID', { error });
    }

    // Connect when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isConnected) {
        this.connect();
      }
    });

    // Connect on page load
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
        logger.info('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startPingTimer();
        this.processMessageQueue();
        this.emit('connected');
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onclose = (event) => {
        logger.info('WebSocket disconnected', { code: event.code, reason: event.reason });
        this.isConnected = false;
        this.stopPingTimer();
        this.emit('disconnected', { code: event.code, reason: event.reason });

        if (!event.wasClean) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (error: Event) => {
        logger.error('WebSocket error', { error: error.type });
        this.emit('error', error);
      };
    } catch (error: unknown) {
      logger.error('Failed to connect WebSocket', { error });
      this.scheduleReconnect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'User disconnected');
      this.socket = null;
    }
    this.isConnected = false;
    this.stopPingTimer();
    this.clearReconnectTimer();
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      logger.info(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`
      );
      this.connect();
    }, delay);
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  startPingTimer() {
    this.pingTimer = setInterval(() => {
      this.sendMessage({
        type: MessageType.PING,
        data: { timestamp: Date.now() },
      });

      // Set pong timeout
      this.pongTimer = setTimeout(() => {
        logger.warning('Pong timeout, reconnecting...');
        this.disconnect();
        this.scheduleReconnect();
      }, this.config.pongTimeout);
    }, this.config.pingInterval);
  }

  stopPingTimer() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = undefined;
    }
  }

  handleMessage(data: string | Blob) {
    try {
      // Handle Blob data by converting to string
      let dataString: string;
      if (typeof data === 'string') {
        dataString = data;
      } else if (data instanceof Blob) {
        // For Blob, we need to read it asynchronously
        // This is a limitation - we'll log and return early
        logger.warning('Received Blob data in WebSocket message - async conversion not supported in sync handler', {
          blobSize: data.size,
          blobType: data.type,
        });
        return;
      } else {
        logger.warning('Received unknown data type in WebSocket message', { dataType: typeof data });
        return;
      }

      // Validate data is not empty
      if (!dataString || dataString.trim().length === 0) {
        logger.warning('Received empty WebSocket message');
        return;
      }

      // Parse JSON with proper error handling
      let message: WebSocketMessage;
      try {
        message = JSON.parse(dataString);
      } catch (parseError) {
        logger.error('Failed to parse WebSocket message JSON', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          dataPreview: dataString.substring(0, 100), // Log first 100 chars for debugging
          dataLength: dataString.length,
        });
        // Emit error event for error handling system
        this.emit('error', {
          type: 'parse_error',
          message: 'Failed to parse WebSocket message',
          originalError: parseError,
        });
        return;
      }

      // Validate message structure
      if (!message || typeof message !== 'object') {
        logger.error('Invalid WebSocket message structure - not an object', { message });
        return;
      }

      if (!message.type || typeof message.type !== 'string') {
        logger.error('Invalid WebSocket message - missing or invalid type field', { message });
        return;
      }

      // Handle message based on type
      try {
        switch (message.type) {
          case MessageType.PONG:
            if (this.pongTimer) {
              clearTimeout(this.pongTimer);
              this.pongTimer = undefined;
            }
            break;

          case MessageType.USER_JOINED:
            this.handleUserJoined(message);
            break;

          case MessageType.USER_LEFT:
            this.handleUserLeft(message);
            break;

          case MessageType.USER_PRESENCE:
            this.handleUserPresence(message);
            break;

          case MessageType.CURSOR_MOVE:
            this.handleCursorMove(message);
            break;

          case MessageType.SELECTION_CHANGE:
            this.handleSelectionChange(message);
            break;

          case MessageType.TEXT_EDIT:
            this.handleTextEdit(message);
            break;

          case MessageType.FIELD_UPDATE:
            this.handleFieldUpdate(message);
            break;

          case MessageType.DATA_SYNC:
            this.handleDataSync(message);
            break;

          case MessageType.CONFLICT_RESOLUTION:
            this.handleConflictResolution(message);
            break;

          case MessageType.NOTIFICATION:
            this.handleNotification(message);
            break;

          case MessageType.ERROR:
            this.handleError(message);
            break;

          default:
            logger.warning('Unknown message type', { messageType: message.type });
        }

        this.emit('message', message);
      } catch (handlerError) {
        // Error in message handler - log and emit error event
        logger.error('Error handling WebSocket message', {
          error: handlerError instanceof Error ? handlerError.message : String(handlerError),
          messageType: message.type,
          messageId: message.id,
        });
        this.emit('error', {
          type: 'handler_error',
          message: `Error handling ${message.type} message`,
          originalError: handlerError,
          messageType: message.type,
        });
      }
    } catch (error: unknown) {
      // Catch-all for any unexpected errors
      logger.error('Unexpected error in WebSocket message handler', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      this.emit('error', {
        type: 'unexpected_error',
        message: 'Unexpected error processing WebSocket message',
        originalError: error,
      });
    }
  }

  handleUserJoined(message: WebSocketMessage) {
    const data = message.data as unknown;
    if (data && typeof data === 'object' && 'userId' in data) {
      const userPresence = data as UserPresence;
      this.presence.set(userPresence.userId, userPresence);
      this.emit('userJoined', userPresence);
    }
  }

  handleUserLeft(message: WebSocketMessage) {
    const data = message.data as { userId?: string };
    if (data && typeof data === 'object' && 'userId' in data && typeof data.userId === 'string') {
      this.presence.delete(data.userId);
      this.emit('userLeft', data.userId);
    }
  }

  handleUserPresence(message: WebSocketMessage) {
    const data = message.data as unknown;
    if (data && typeof data === 'object' && 'userId' in data) {
      const userPresence = data as UserPresence;
      this.presence.set(userPresence.userId, userPresence);
      this.emit('userPresence', userPresence);
    }
  }

  handleCursorMove(message: WebSocketMessage) {
    const data = message.data as { cursor?: { x: number; y: number } };
    if (data && typeof data === 'object' && 'cursor' in data) {
      this.emit('cursorMove', {
        userId: message.userId,
        cursor: data.cursor,
      });
    }
  }

  handleSelectionChange(message: WebSocketMessage) {
    const data = message.data as { selection?: { start: number; end: number } };
    if (data && typeof data === 'object' && 'selection' in data) {
      this.emit('selectionChange', {
        userId: message.userId,
        selection: data.selection,
      });
    }
  }

  handleTextEdit(message: WebSocketMessage) {
    const data = message.data as { fieldId?: string; change?: unknown };
    if (data && typeof data === 'object' && 'fieldId' in data) {
      this.emit('textEdit', {
        userId: message.userId,
        fieldId: data.fieldId,
        change: data.change,
      });
    }
  }

  handleFieldUpdate(message: WebSocketMessage) {
    const data = message.data as { fieldId?: string; value?: unknown };
    if (data && typeof data === 'object' && 'fieldId' in data) {
      this.emit('fieldUpdate', {
        userId: message.userId,
        fieldId: data.fieldId,
        value: data.value,
      });
    }
  }

  handleDataSync(message: WebSocketMessage) {
    this.emit('dataSync', message.data);
  }

  handleConflictResolution(message: WebSocketMessage) {
    this.emit('conflictResolution', message.data);
  }

  handleNotification(message: WebSocketMessage) {
    this.emit('notification', message.data);
  }

  handleError(message: WebSocketMessage) {
    logger.error('WebSocket error', { data: message.data });
    this.emit('error', message.data);
  }

  // Public methods
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
        this.queueMessage(fullMessage);
      }
    } else {
      this.queueMessage(fullMessage);
    }
  }

  queueMessage(message: WebSocketMessage) {
    this.messageQueue.push(message);

    // Keep queue size manageable
    if (this.messageQueue.length > this.config.messageQueueSize) {
      this.messageQueue.shift();
    }
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
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
    return new Map(this.presence);
  }

  getUserPresence(userId: string) {
    return this.presence.get(userId);
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

  // Notification methods
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
      reconnectAttempts: this.reconnectAttempts,
      messageQueueSize: this.messageQueue.length,
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

    // Register event listeners
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
