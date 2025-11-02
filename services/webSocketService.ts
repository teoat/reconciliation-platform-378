// WebSocket Service for Real-time Collaboration
// Implements real-time updates, live collaboration, and presence management

import React from 'react';
import { APP_CONFIG } from '../constants';

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
export const createWebSocketMessage = (type, id, timestamp, userId, sessionId, data, metadata) => ({
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
  userId,
  userName,
  userRole,
  isOnline,
  lastSeen,
  currentPage,
  currentProject,
  cursor,
  selection
) => ({
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
  id,
  projectId,
  participants,
  activeUsers,
  lockedFields,
  changes,
  createdAt,
  updatedAt
) => ({
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
  id,
  userId,
  fieldId,
  oldValue,
  newValue,
  timestamp,
  applied,
  conflicts
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
  id,
  changeId,
  conflictingChangeId,
  fieldId,
  resolution,
  resolvedBy,
  resolvedAt
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
const createWebSocketConfig = (
  url,
  reconnectInterval,
  maxReconnectAttempts,
  pingInterval,
  pongTimeout,
  messageQueueSize,
  enablePresence,
  enableCollaboration,
  enableNotifications
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
  static instance;
  config;
  socket = null;
  isConnected = false;
  reconnectAttempts = 0;
  reconnectTimer;
  pingTimer;
  pongTimer;
  messageQueue = [];
  listeners = new Map();
  presence = new Map();
  collaborationSessions = new Map();
  userId = '';
  sessionId = '';

  static getInstance() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
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
    } catch (error) {
      console.error('Failed to get user ID:', error);
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
        console.log('WebSocket connected');
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
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.stopPingTimer();
        this.emit('disconnected', { code: event.code, reason: event.reason });

        if (!event.wasClean) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
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
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      console.log(
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
        console.warn('Pong timeout, reconnecting...');
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

  handleMessage(data) {
    try {
      const message: WebSocketMessage = JSON.parse(data);

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
          console.warn('Unknown message type:', message.type);
      }

      this.emit('message', message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  handleUserJoined(message) {
    const userPresence: UserPresence = message.data;
    this.presence.set(userPresence.userId, userPresence);
    this.emit('userJoined', userPresence);
  }

  handleUserLeft(message) {
    const userId = message.data.userId;
    this.presence.delete(userId);
    this.emit('userLeft', userId);
  }

  handleUserPresence(message) {
    const userPresence: UserPresence = message.data;
    this.presence.set(userPresence.userId, userPresence);
    this.emit('userPresence', userPresence);
  }

  handleCursorMove(message) {
    this.emit('cursorMove', {
      userId: message.userId,
      cursor: message.data.cursor,
    });
  }

  handleSelectionChange(message) {
    this.emit('selectionChange', {
      userId: message.userId,
      selection: message.data.selection,
    });
  }

  handleTextEdit(message) {
    this.emit('textEdit', {
      userId: message.userId,
      fieldId: message.data.fieldId,
      change: message.data.change,
    });
  }

  handleFieldUpdate(message) {
    this.emit('fieldUpdate', {
      userId: message.userId,
      fieldId: message.data.fieldId,
      value: message.data.value,
    });
  }

  handleDataSync(message) {
    this.emit('dataSync', message.data);
  }

  handleConflictResolution(message) {
    this.emit('conflictResolution', message.data);
  }

  handleNotification(message) {
    this.emit('notification', message.data);
  }

  handleError(message) {
    console.error('WebSocket error:', message.data);
    this.emit('error', message.data);
  }

  // Public methods
  sendMessage(message) {
    const fullMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    if (this.isConnected && this.socket) {
      try {
        this.socket.send(JSON.stringify(fullMessage));
      } catch (error) {
        console.error('Failed to send message:', error);
        this.queueMessage(fullMessage);
      }
    } else {
      this.queueMessage(fullMessage);
    }
  }

  queueMessage(message) {
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
  updatePresence(presence) {
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

  getUserPresence(userId) {
    return this.presence.get(userId);
  }

  // Collaboration methods
  joinCollaborationSession(projectId) {
    if (!this.config.enableCollaboration) return;

    this.sendMessage({
      type: MessageType.CONNECT,
      data: {
        projectId,
        action: 'join',
      },
    });
  }

  leaveCollaborationSession(projectId) {
    if (!this.config.enableCollaboration) return;

    this.sendMessage({
      type: MessageType.DISCONNECT,
      data: {
        projectId,
        action: 'leave',
      },
    });
  }

  sendCursorMove(cursor) {
    this.sendMessage({
      type: MessageType.CURSOR_MOVE,
      data: { cursor },
    });
  }

  sendSelectionChange(selection) {
    this.sendMessage({
      type: MessageType.SELECTION_CHANGE,
      data: { selection },
    });
  }

  sendTextEdit(fieldId, change) {
    this.sendMessage({
      type: MessageType.TEXT_EDIT,
      data: { fieldId, change },
    });
  }

  sendFieldUpdate(fieldId, value) {
    this.sendMessage({
      type: MessageType.FIELD_UPDATE,
      data: { fieldId, value },
    });
  }

  requestDataSync(projectId, dataType) {
    this.sendMessage({
      type: MessageType.DATA_SYNC,
      data: {
        projectId,
        dataType,
        action: 'request',
      },
    });
  }

  sendDataSync(projectId, dataType, data) {
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
  sendNotification(userId, notification) {
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
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, ...args) {
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

    const handleUserJoined = (userPresence) => {
      setPresence((prev) => new Map(prev.set(userPresence.userId, userPresence)));
    };

    const handleUserLeft = (userId) => {
      setPresence((prev) => {
        const newPresence = new Map(prev);
        newPresence.delete(userId);
        return newPresence;
      });
    };

    const handleUserPresence = (userPresence) => {
      setPresence((prev) => new Map(prev.set(userPresence.userId, userPresence)));
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
