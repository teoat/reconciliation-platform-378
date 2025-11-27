/**
 * WebSocket Types
 * 
 * Type definitions for WebSocket messages, presence, and collaboration
 */

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

export interface CollaborationChange {
  id: string;
  userId: string;
  fieldId: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
  applied: boolean;
  conflicts: unknown[];
}

export interface CollaborationConflict {
  id: string;
  changeId: string;
  conflictingChangeId: string;
  fieldId: string;
  resolution: string;
  resolvedBy: string | null;
  resolvedAt: number | null;
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

export interface ConnectionStatus {
  connected: boolean;
  reconnectAttempts: number;
  messageQueueSize: number;
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

// Factory functions for creating WebSocket structures
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

export const createCollaborationChange = (
  id: string,
  userId: string,
  fieldId: string,
  oldValue: unknown,
  newValue: unknown,
  timestamp: number,
  applied: boolean,
  conflicts: unknown[]
): CollaborationChange => ({
  id,
  userId,
  fieldId,
  oldValue,
  newValue,
  timestamp,
  applied,
  conflicts,
});

export const createCollaborationConflict = (
  id: string,
  changeId: string,
  conflictingChangeId: string,
  fieldId: string,
  resolution: string,
  resolvedBy: string | null,
  resolvedAt: number | null
): CollaborationConflict => ({
  id,
  changeId,
  conflictingChangeId,
  fieldId,
  resolution,
  resolvedBy,
  resolvedAt,
});

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
): WebSocketConfig => ({
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
