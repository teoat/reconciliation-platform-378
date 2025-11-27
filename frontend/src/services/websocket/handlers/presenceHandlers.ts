/**
 * Presence Handlers
 * 
 * Handles user presence management (join, leave, presence updates)
 */

import { logger } from '@/services/logger';
import type { WebSocketMessage, UserPresence } from '../types';
import { MessageType } from '../types';

export interface PresenceHandlers {
  handle: (message: WebSocketMessage) => void;
  updatePresence: (presence: Partial<UserPresence>) => void;
  getPresence: () => Map<string, UserPresence>;
  getUserPresence: (userId: string) => UserPresence | undefined;
}

export interface PresenceState {
  presence: Map<string, UserPresence>;
  userId: string;
}

export interface PresenceCallbacks {
  emit: (event: string, ...args: unknown[]) => void;
  sendMessage: (message: { type: string; data?: Record<string, unknown> }) => void;
  config: { enablePresence: boolean };
}

/**
 * Handle presence-related messages
 */
export function handlePresenceMessage(
  state: PresenceState,
  callbacks: PresenceCallbacks
): PresenceHandlers {
  const handle = (message: WebSocketMessage): void => {
    switch (message.type) {
      case MessageType.USER_JOINED:
        handleUserJoined(message);
        break;
      case MessageType.USER_LEFT:
        handleUserLeft(message);
        break;
      case MessageType.USER_PRESENCE:
        handleUserPresence(message);
        break;
    }
  };

  const handleUserJoined = (message: WebSocketMessage): void => {
    const data = message.data as unknown;
    if (data && typeof data === 'object' && 'userId' in data) {
      const userPresence = data as UserPresence;
      state.presence.set(userPresence.userId, userPresence);
      callbacks.emit('userJoined', userPresence);
    }
  };

  const handleUserLeft = (message: WebSocketMessage): void => {
    const data = message.data as { userId?: string };
    if (data && typeof data === 'object' && 'userId' in data && typeof data.userId === 'string') {
      state.presence.delete(data.userId);
      callbacks.emit('userLeft', data.userId);
    }
  };

  const handleUserPresence = (message: WebSocketMessage): void => {
    const data = message.data as unknown;
    if (data && typeof data === 'object' && 'userId' in data) {
      const userPresence = data as UserPresence;
      state.presence.set(userPresence.userId, userPresence);
      callbacks.emit('userPresence', userPresence);
    }
  };

  const updatePresence = (presence: Partial<UserPresence>): void => {
    if (!callbacks.config.enablePresence) return;

    callbacks.sendMessage({
      type: MessageType.USER_PRESENCE,
      data: {
        userId: state.userId,
        ...presence,
      },
    });
  };

  const getPresence = (): Map<string, UserPresence> => {
    return new Map(state.presence);
  };

  const getUserPresence = (userId: string): UserPresence | undefined => {
    return state.presence.get(userId);
  };

  return {
    handle,
    updatePresence,
    getPresence,
    getUserPresence,
  };
}
