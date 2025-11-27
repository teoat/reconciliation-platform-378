/**
 * Collaboration Handlers
 * 
 * Real-time collaboration features for WebSocket service
 */

import type { WebSocketMessage } from '../types';

export class CollaborationHandlers {
  private onCursorMoveCallback?: (data: { userId: string; cursor?: { x: number; y: number } }) => void;
  private onSelectionChangeCallback?: (data: {
    userId: string;
    selection?: { start: number; end: number };
  }) => void;
  private onTextEditCallback?: (data: {
    userId: string;
    fieldId?: string;
    change?: unknown;
  }) => void;
  private onFieldUpdateCallback?: (data: {
    userId: string;
    fieldId?: string;
    value?: unknown;
  }) => void;

  setCallbacks(
    onCursorMove?: (data: { userId: string; cursor?: { x: number; y: number } }) => void,
    onSelectionChange?: (data: { userId: string; selection?: { start: number; end: number } }) => void,
    onTextEdit?: (data: { userId: string; fieldId?: string; change?: unknown }) => void,
    onFieldUpdate?: (data: { userId: string; fieldId?: string; value?: unknown }) => void
  ) {
    this.onCursorMoveCallback = onCursorMove;
    this.onSelectionChangeCallback = onSelectionChange;
    this.onTextEditCallback = onTextEdit;
    this.onFieldUpdateCallback = onFieldUpdate;
  }

  handleCursorMove(message: WebSocketMessage): void {
    const data = message.data as { cursor?: { x: number; y: number } };
    if (data && typeof data === 'object' && 'cursor' in data) {
      this.onCursorMoveCallback?.({
        userId: message.userId,
        cursor: data.cursor,
      });
    }
  }

  handleSelectionChange(message: WebSocketMessage): void {
    const data = message.data as { selection?: { start: number; end: number } };
    if (data && typeof data === 'object' && 'selection' in data) {
      this.onSelectionChangeCallback?.({
        userId: message.userId,
        selection: data.selection,
      });
    }
  }

  handleTextEdit(message: WebSocketMessage): void {
    const data = message.data as { fieldId?: string; change?: unknown };
    if (data && typeof data === 'object' && 'fieldId' in data) {
      this.onTextEditCallback?.({
        userId: message.userId,
        fieldId: data.fieldId,
        change: data.change,
      });
    }
  }

  handleFieldUpdate(message: WebSocketMessage): void {
    const data = message.data as { fieldId?: string; value?: unknown };
    if (data && typeof data === 'object' && 'fieldId' in data) {
      this.onFieldUpdateCallback?.({
        userId: message.userId,
        fieldId: data.fieldId,
        value: data.value,
      });
    }
  }
}

