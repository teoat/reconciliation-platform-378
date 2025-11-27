/**
 * Connection Handlers
 * 
 * WebSocket connection, disconnection, and reconnection logic
 */

import { logger } from '@/services/logger';
import type { WebSocketConfig } from '../types';

export class ConnectionHandlers {
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private onConnectedCallback?: () => void;
  private onDisconnectedCallback?: (code: number, reason: string) => void;
  private onMaxReconnectCallback?: () => void;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  setCallbacks(
    onConnected?: () => void,
    onDisconnected?: (code: number, reason: string) => void,
    onMaxReconnect?: () => void
  ) {
    this.onConnectedCallback = onConnected;
    this.onDisconnectedCallback = onDisconnected;
    this.onMaxReconnectCallback = onMaxReconnect;
  }

  handleOpen(socket: WebSocket): void {
    logger.info('WebSocket connected');
    this.reconnectAttempts = 0;
    this.onConnectedCallback?.();
  }

  handleClose(event: CloseEvent): void {
    logger.info('WebSocket disconnected', { code: event.code, reason: event.reason });
    this.onDisconnectedCallback?.(event.code, event.reason);

    if (!event.wasClean) {
      this.scheduleReconnect();
    }
  }

  handleError(error: Event): void {
    logger.error('WebSocket error', { error: error.type });
  }

  scheduleReconnect(connectFn: () => void): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      this.onMaxReconnectCallback?.();
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      logger.info(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`
      );
      connectFn();
    }, delay);
  }

  clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}

