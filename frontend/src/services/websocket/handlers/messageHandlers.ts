/**
 * Message Handlers
 * 
 * Core message processing logic for WebSocket service
 */

import { logger } from '@/services/logger';
import { MessageType } from '../types';
import { PresenceHandlers } from './presenceHandlers';
import { CollaborationHandlers } from './collaborationHandlers';
import type { WebSocketMessage } from '../types';

export class MessageHandlers {
  private presenceHandlers: PresenceHandlers;
  private collaborationHandlers: CollaborationHandlers;
  private onMessageCallback?: (message: WebSocketMessage) => void;
  private onDataSyncCallback?: (data: unknown) => void;
  private onConflictResolutionCallback?: (data: unknown) => void;
  private onNotificationCallback?: (data: unknown) => void;
  private onErrorCallback?: (error: unknown) => void;
  private pongTimer?: ReturnType<typeof setTimeout>;
  private pongTimeout: number;

  constructor(
    presenceHandlers: PresenceHandlers,
    collaborationHandlers: CollaborationHandlers,
    pongTimeout: number = 5000
  ) {
    this.presenceHandlers = presenceHandlers;
    this.collaborationHandlers = collaborationHandlers;
    this.pongTimeout = pongTimeout;
  }

  setCallbacks(
    onMessage?: (message: WebSocketMessage) => void,
    onDataSync?: (data: unknown) => void,
    onConflictResolution?: (data: unknown) => void,
    onNotification?: (data: unknown) => void,
    onError?: (error: unknown) => void
  ) {
    this.onMessageCallback = onMessage;
    this.onDataSyncCallback = onDataSync;
    this.onConflictResolutionCallback = onConflictResolution;
    this.onNotificationCallback = onNotification;
    this.onErrorCallback = onError;
  }

  handleMessage(data: string | Blob): void {
    try {
      let dataString: string;
      if (typeof data === 'string') {
        dataString = data;
      } else if (data instanceof Blob) {
        logger.warning('Received Blob data in WebSocket message - async conversion not supported', {
          blobSize: data.size,
          blobType: data.type,
        });
        return;
      } else {
        logger.warning('Received unknown data type in WebSocket message', { dataType: typeof data });
        return;
      }

      if (!dataString || dataString.trim().length === 0) {
        logger.warning('Received empty WebSocket message');
        return;
      }

      let message: WebSocketMessage;
      try {
        message = JSON.parse(dataString);
      } catch (parseError) {
        logger.error('Failed to parse WebSocket message JSON', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          dataPreview: dataString.substring(0, 100),
          dataLength: dataString.length,
        });
        this.onErrorCallback?.({
          type: 'parse_error',
          message: 'Failed to parse WebSocket message',
          originalError: parseError,
        });
        return;
      }

      if (!message || typeof message !== 'object' || !message.type || typeof message.type !== 'string') {
        logger.error('Invalid WebSocket message structure', { message });
        return;
      }

      try {
        switch (message.type) {
          case MessageType.PONG:
            if (this.pongTimer) {
              clearTimeout(this.pongTimer);
              this.pongTimer = undefined;
            }
            break;

          case MessageType.USER_JOINED:
            this.presenceHandlers.handleUserJoined(message);
            break;

          case MessageType.USER_LEFT:
            this.presenceHandlers.handleUserLeft(message);
            break;

          case MessageType.USER_PRESENCE:
            this.presenceHandlers.handleUserPresence(message);
            break;

          case MessageType.CURSOR_MOVE:
            this.collaborationHandlers.handleCursorMove(message);
            break;

          case MessageType.SELECTION_CHANGE:
            this.collaborationHandlers.handleSelectionChange(message);
            break;

          case MessageType.TEXT_EDIT:
            this.collaborationHandlers.handleTextEdit(message);
            break;

          case MessageType.FIELD_UPDATE:
            this.collaborationHandlers.handleFieldUpdate(message);
            break;

          case MessageType.DATA_SYNC:
            this.onDataSyncCallback?.(message.data);
            break;

          case MessageType.CONFLICT_RESOLUTION:
            this.onConflictResolutionCallback?.(message.data);
            break;

          case MessageType.NOTIFICATION:
            this.onNotificationCallback?.(message.data);
            break;

          case MessageType.ERROR:
            logger.error('WebSocket error', { data: message.data });
            this.onErrorCallback?.(message.data);
            break;

          default:
            logger.warning('Unknown message type', { messageType: message.type });
        }

        this.onMessageCallback?.(message);
      } catch (handlerError) {
        logger.error('Error handling WebSocket message', {
          error: handlerError instanceof Error ? handlerError.message : String(handlerError),
          messageType: message.type,
          messageId: message.id,
        });
        this.onErrorCallback?.({
          type: 'handler_error',
          message: `Error handling ${message.type} message`,
          originalError: handlerError,
          messageType: message.type,
        });
      }
    } catch (error: unknown) {
      logger.error('Unexpected error in WebSocket message handler', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      this.onErrorCallback?.({
        type: 'unexpected_error',
        message: 'Unexpected error processing WebSocket message',
        originalError: error,
      });
    }
  }

  setPongTimer(timeoutCallback: () => void): void {
    this.pongTimer = setTimeout(() => {
      logger.warning('Pong timeout, reconnecting...');
      timeoutCallback();
    }, this.pongTimeout);
  }

  clearPongTimer(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = undefined;
    }
  }
}

