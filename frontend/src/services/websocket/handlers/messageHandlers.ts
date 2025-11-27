/**
 * Message Handlers
 * 
 * Handles WebSocket message parsing, validation, and routing
 */

import { logger } from '@/services/logger';
import type { WebSocketMessage } from '../types';
import { MessageType } from '../types';
import { handlePresenceMessage } from './presenceHandlers';
import { handleCollaborationMessage } from './collaborationHandlers';

export interface MessageHandlers {
  handleMessage: (data: string | Blob) => void;
}

export interface MessageHandlerCallbacks {
  emit: (event: string, ...args: unknown[]) => void;
  handlePong: () => void;
}

/**
 * Parse and validate WebSocket message
 */
function parseMessage(data: string | Blob): WebSocketMessage | null {
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
      return null;
    } else {
      logger.warning('Received unknown data type in WebSocket message', { dataType: typeof data });
      return null;
    }

    // Validate data is not empty
    if (!dataString || dataString.trim().length === 0) {
      logger.warning('Received empty WebSocket message');
      return null;
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
      return null;
    }

    // Validate message structure
    if (!message || typeof message !== 'object') {
      logger.error('Invalid WebSocket message structure - not an object', { message });
      return null;
    }

    if (!message.type || typeof message.type !== 'string') {
      logger.error('Invalid WebSocket message - missing or invalid type field', { message });
      return null;
    }

    return message;
  } catch (error: unknown) {
    logger.error('Unexpected error parsing WebSocket message', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Route message to appropriate handler
 */
function routeMessage(
  message: WebSocketMessage,
  callbacks: MessageHandlerCallbacks,
  presenceHandlers: ReturnType<typeof handlePresenceMessage>,
  collaborationHandlers: ReturnType<typeof handleCollaborationMessage>
): void {
  try {
    switch (message.type) {
      case MessageType.PONG:
        callbacks.handlePong();
        break;

      case MessageType.USER_JOINED:
      case MessageType.USER_LEFT:
      case MessageType.USER_PRESENCE:
        presenceHandlers.handle(message);
        break;

      case MessageType.CURSOR_MOVE:
      case MessageType.SELECTION_CHANGE:
      case MessageType.TEXT_EDIT:
      case MessageType.FIELD_UPDATE:
        collaborationHandlers.handle(message);
        break;

      case MessageType.DATA_SYNC:
        callbacks.emit('dataSync', message.data);
        break;

      case MessageType.CONFLICT_RESOLUTION:
        callbacks.emit('conflictResolution', message.data);
        break;

      case MessageType.NOTIFICATION:
        callbacks.emit('notification', message.data);
        break;

      case MessageType.ERROR:
        logger.error('WebSocket error', { data: message.data });
        callbacks.emit('error', message.data);
        break;

      default:
        logger.warning('Unknown message type', { messageType: message.type });
    }

    callbacks.emit('message', message);
  } catch (handlerError) {
    // Error in message handler - log and emit error event
    logger.error('Error handling WebSocket message', {
      error: handlerError instanceof Error ? handlerError.message : String(handlerError),
      messageType: message.type,
      messageId: message.id,
    });
    callbacks.emit('error', {
      type: 'handler_error',
      message: `Error handling ${message.type} message`,
      originalError: handlerError,
      messageType: message.type,
    });
  }
}

/**
 * Create message handlers
 */
export function createMessageHandlers(
  callbacks: MessageHandlerCallbacks,
  presenceHandlers: ReturnType<typeof handlePresenceMessage>,
  collaborationHandlers: ReturnType<typeof handleCollaborationMessage>
): MessageHandlers {
  const handleMessage = (data: string | Blob): void => {
    const message = parseMessage(data);
    if (!message) {
      // Parse error already logged
      callbacks.emit('error', {
        type: 'parse_error',
        message: 'Failed to parse WebSocket message',
      });
      return;
    }

    routeMessage(message, callbacks, presenceHandlers, collaborationHandlers);
  };

  return {
    handleMessage,
  };
}
