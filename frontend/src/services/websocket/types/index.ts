/**
 * WebSocket Types
 * 
 * Type definitions for WebSocket messages, presence, and collaboration
 */

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

export interface CollaborationChange {
  id: string;
  userId: string;
  fieldId: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
}

export interface CollaborationConflict {
  id: string;
  fieldId: string;
  userId: string;
  localValue: unknown;
  remoteValue: unknown;
  timestamp: number;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  pingInterval: number;
  pongTimeout: number;
  messageQueueSize: number;
  enablePresence: boolean;
  enableCollaboration: boolean;
  enableNotifications: boolean;
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
} as const;
