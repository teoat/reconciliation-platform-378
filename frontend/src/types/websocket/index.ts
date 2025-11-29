// WebSocket Message Types

import { User } from '../user';

export interface ReconciliationProgressMessage {
  jobId: string;
  progress: number;
  stage: string;
  status?: 'running' | 'completed' | 'failed' | 'paused';
  message?: string;
  recordsProcessed?: number;
  totalRecords?: number;
  matchesFound?: number;
  errors?: string[];
}

export interface ReconciliationCompletedMessage {
  jobId: string;
  success: boolean;
  duration: number;
  recordsProcessed: number;
  matchesFound: number;
  errors?: string[];
  result?: {
    matchedRecords: number;
    unmatchedRecords: number;
    conflictsResolved: number;
  };
}

export interface ReconciliationErrorMessage {
  jobId: string;
  error: string;
  stage?: string;
  details?: unknown;
}

export interface UserPresenceMessage {
  userId: string;
  action: 'join' | 'leave' | 'update';
  projectId?: string;
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number };
  isOnline?: boolean;
}

export interface ProjectUpdateMessage {
  projectId: string;
  action: 'created' | 'updated' | 'deleted';
  data?: unknown;
}

export interface NotificationMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  userId?: string;
}

export interface ConnectionStatusMessage {
  status: 'connected' | 'disconnected' | 'reconnecting';
  timestamp: string;
  reason?: string;
}

export interface CollaborationUsersMessage {
  projectId: string;
  users: UserPresenceMessage[];
}

export interface CollaborationCommentMessage {
  projectId: string;
  comment: unknown;
}

export type WebSocketMessage =
  | { type: 'reconciliation:progress'; data: ReconciliationProgressMessage; id?: string; timestamp?: string; payload?: unknown }
  | { type: 'reconciliation:completed'; data: ReconciliationCompletedMessage; id?: string; timestamp?: string; payload?: unknown }
  | { type: 'reconciliation:error'; data: ReconciliationErrorMessage; id?: string; timestamp?: string; payload?: unknown }
  | { type: 'user:presence'; data: UserPresenceMessage; id?: string; timestamp?: string; payload?: unknown }
  | { type: 'project:updated'; data: ProjectUpdateMessage; id?: string; timestamp?: string; payload?: unknown }
  | { type: 'notification:new'; data: NotificationMessage; id?: string; timestamp?: string; payload?: unknown }
  | { type: 'connection:status'; data: ConnectionStatusMessage; id?: string; timestamp?: string; payload?: unknown }
  | { type: 'collaboration:users'; data: CollaborationUsersMessage; id?: string; timestamp?: string; payload?: unknown }
  | { type: 'collaboration:comment'; data: CollaborationCommentMessage; id?: string; timestamp?: string; payload?: unknown }
  | { type: 'collaboration:cursor'; data: UserPresenceMessage; id?: string; timestamp?: string; payload?: unknown }
  | { type: 'collaboration:selection'; data: UserPresenceMessage; id?: string; timestamp?: string; payload?: unknown }
  | { type: 'system:alert'; data: NotificationMessage; id?: string; timestamp?: string; payload?: unknown };

