/**
 * WebSocket Message Factory
 * 
 * Utility functions for creating WebSocket messages and related structures
 */

import type {
  WebSocketMessage,
  UserPresence,
  CollaborationSession,
  CollaborationChange,
  CollaborationConflict,
  WebSocketConfig,
} from '../types';

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
): CollaborationChange & { applied: boolean; conflicts: unknown[] } => ({
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
): CollaborationConflict & {
  changeId: string;
  conflictingChangeId: string;
  resolution: string;
  resolvedBy: string | null;
  resolvedAt: number | null;
} => ({
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

