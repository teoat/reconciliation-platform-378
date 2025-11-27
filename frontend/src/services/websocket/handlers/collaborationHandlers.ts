/**
 * Collaboration Handlers
 * 
 * Handles real-time collaboration features (cursor, selection, text edits, field updates)
 */

import type { WebSocketMessage } from '../types';
import { MessageType } from '../types';

export interface CollaborationHandlers {
  handle: (message: WebSocketMessage) => void;
  joinCollaborationSession: (projectId: string) => void;
  leaveCollaborationSession: (projectId: string) => void;
  sendCursorMove: (cursor: { x: number; y: number }) => void;
  sendSelectionChange: (selection: { start: number; end: number }) => void;
  sendTextEdit: (fieldId: string, change: unknown) => void;
  sendFieldUpdate: (fieldId: string, value: unknown) => void;
  requestDataSync: (projectId: string, dataType: string) => void;
  sendDataSync: (projectId: string, dataType: string, data: unknown) => void;
}

export interface CollaborationCallbacks {
  emit: (event: string, ...args: unknown[]) => void;
  sendMessage: (message: { type: string; data?: Record<string, unknown> }) => void;
  config: { enableCollaboration: boolean };
}

/**
 * Handle collaboration-related messages
 */
export function handleCollaborationMessage(
  callbacks: CollaborationCallbacks
): CollaborationHandlers {
  const handle = (message: WebSocketMessage): void => {
    switch (message.type) {
      case MessageType.CURSOR_MOVE:
        handleCursorMove(message);
        break;
      case MessageType.SELECTION_CHANGE:
        handleSelectionChange(message);
        break;
      case MessageType.TEXT_EDIT:
        handleTextEdit(message);
        break;
      case MessageType.FIELD_UPDATE:
        handleFieldUpdate(message);
        break;
    }
  };

  const handleCursorMove = (message: WebSocketMessage): void => {
    const data = message.data as { cursor?: { x: number; y: number } };
    if (data && typeof data === 'object' && 'cursor' in data) {
      callbacks.emit('cursorMove', {
        userId: message.userId,
        cursor: data.cursor,
      });
    }
  };

  const handleSelectionChange = (message: WebSocketMessage): void => {
    const data = message.data as { selection?: { start: number; end: number } };
    if (data && typeof data === 'object' && 'selection' in data) {
      callbacks.emit('selectionChange', {
        userId: message.userId,
        selection: data.selection,
      });
    }
  };

  const handleTextEdit = (message: WebSocketMessage): void => {
    const data = message.data as { fieldId?: string; change?: unknown };
    if (data && typeof data === 'object' && 'fieldId' in data) {
      callbacks.emit('textEdit', {
        userId: message.userId,
        fieldId: data.fieldId,
        change: data.change,
      });
    }
  };

  const handleFieldUpdate = (message: WebSocketMessage): void => {
    const data = message.data as { fieldId?: string; value?: unknown };
    if (data && typeof data === 'object' && 'fieldId' in data) {
      callbacks.emit('fieldUpdate', {
        userId: message.userId,
        fieldId: data.fieldId,
        value: data.value,
      });
    }
  };

  const joinCollaborationSession = (projectId: string): void => {
    if (!callbacks.config.enableCollaboration) return;

    callbacks.sendMessage({
      type: MessageType.CONNECT,
      data: {
        projectId,
        action: 'join',
      },
    });
  };

  const leaveCollaborationSession = (projectId: string): void => {
    if (!callbacks.config.enableCollaboration) return;

    callbacks.sendMessage({
      type: MessageType.DISCONNECT,
      data: {
        projectId,
        action: 'leave',
      },
    });
  };

  const sendCursorMove = (cursor: { x: number; y: number }): void => {
    callbacks.sendMessage({
      type: MessageType.CURSOR_MOVE,
      data: { cursor },
    });
  };

  const sendSelectionChange = (selection: { start: number; end: number }): void => {
    callbacks.sendMessage({
      type: MessageType.SELECTION_CHANGE,
      data: { selection },
    });
  };

  const sendTextEdit = (fieldId: string, change: unknown): void => {
    callbacks.sendMessage({
      type: MessageType.TEXT_EDIT,
      data: { fieldId, change },
    });
  };

  const sendFieldUpdate = (fieldId: string, value: unknown): void => {
    callbacks.sendMessage({
      type: MessageType.FIELD_UPDATE,
      data: { fieldId, value },
    });
  };

  const requestDataSync = (projectId: string, dataType: string): void => {
    callbacks.sendMessage({
      type: MessageType.DATA_SYNC,
      data: {
        projectId,
        dataType,
        action: 'request',
      },
    });
  };

  const sendDataSync = (projectId: string, dataType: string, data: unknown): void => {
    callbacks.sendMessage({
      type: MessageType.DATA_SYNC,
      data: {
        projectId,
        dataType,
        action: 'send',
        data,
      },
    });
  };

  return {
    handle,
    joinCollaborationSession,
    leaveCollaborationSession,
    sendCursorMove,
    sendSelectionChange,
    sendTextEdit,
    sendFieldUpdate,
    requestDataSync,
    sendDataSync,
  };
}
