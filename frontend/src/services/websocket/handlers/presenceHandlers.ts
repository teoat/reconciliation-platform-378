/**
 * Presence Handlers
 * 
 * User presence management for WebSocket service
 */

import type { WebSocketMessage, UserPresence } from '../types';

export class PresenceHandlers {
  private presence = new Map<string, UserPresence>();
  private onUserJoinedCallback?: (presence: UserPresence) => void;
  private onUserLeftCallback?: (userId: string) => void;
  private onUserPresenceCallback?: (presence: UserPresence) => void;

  setCallbacks(
    onUserJoined?: (presence: UserPresence) => void,
    onUserLeft?: (userId: string) => void,
    onUserPresence?: (presence: UserPresence) => void
  ) {
    this.onUserJoinedCallback = onUserJoined;
    this.onUserLeftCallback = onUserLeft;
    this.onUserPresenceCallback = onUserPresence;
  }

  handleUserJoined(message: WebSocketMessage): void {
    const data = message.data as unknown;
    if (data && typeof data === 'object' && 'userId' in data) {
      const userPresence = data as UserPresence;
      this.presence.set(userPresence.userId, userPresence);
      this.onUserJoinedCallback?.(userPresence);
    }
  }

  handleUserLeft(message: WebSocketMessage): void {
    const data = message.data as { userId?: string };
    if (data && typeof data === 'object' && 'userId' in data && typeof data.userId === 'string') {
      this.presence.delete(data.userId);
      this.onUserLeftCallback?.(data.userId);
    }
  }

  handleUserPresence(message: WebSocketMessage): void {
    const data = message.data as unknown;
    if (data && typeof data === 'object' && 'userId' in data) {
      const userPresence = data as UserPresence;
      this.presence.set(userPresence.userId, userPresence);
      this.onUserPresenceCallback?.(userPresence);
    }
  }

  getPresence(): Map<string, UserPresence> {
    return new Map(this.presence);
  }

  getUserPresence(userId: string): UserPresence | undefined {
    return this.presence.get(userId);
  }

  clear(): void {
    this.presence.clear();
  }
}

