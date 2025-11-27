/**
 * Connection Handlers
 * 
 * Handles WebSocket connection, reconnection, and ping/pong logic
 */

import { logger } from '@/services/logger';
import type { WebSocketConfig, ConnectionStatus } from '../types';
import { MessageType } from '../types';

export interface ConnectionHandlers {
  connect: () => Promise<void>;
  disconnect: () => void;
  scheduleReconnect: () => void;
  clearReconnectTimer: () => void;
  startPingTimer: () => void;
  stopPingTimer: () => void;
  isWebSocketConnected: () => boolean;
  getConnectionStatus: () => ConnectionStatus;
}

export interface ConnectionState {
  socket: WebSocket | null;
  isConnected: boolean;
  reconnectAttempts: number;
  reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  pingTimer: ReturnType<typeof setInterval> | undefined;
  pongTimer: ReturnType<typeof setTimeout> | undefined;
  userId: string;
  sessionId: string;
  config: WebSocketConfig;
}

export interface ConnectionCallbacks {
  onConnected: () => void;
  onDisconnected: (code: number, reason: string) => void;
  onError: (error: Event) => void;
  onMaxReconnectAttemptsReached: () => void;
  sendMessage: (message: { type: string; data?: Record<string, unknown> }) => void;
  onMessage?: (data: string | Blob) => void;
}

/**
 * Create connection handlers
 */
export function createConnectionHandlers(
  state: ConnectionState,
  callbacks: ConnectionCallbacks
): ConnectionHandlers {
  const connect = async (): Promise<void> => {
    if (state.isConnected || !state.userId) return;

    try {
      const wsUrl = `${state.config.url}?userId=${state.userId}&sessionId=${state.sessionId}`;
      state.socket = new WebSocket(wsUrl);

      state.socket.onopen = () => {
        logger.info('WebSocket connected');
        state.isConnected = true;
        state.reconnectAttempts = 0;
        callbacks.onConnected();
      };

      if (callbacks.onMessage) {
        state.socket.onmessage = (event) => {
          callbacks.onMessage!(event.data);
        };
      }

      state.socket.onclose = (event) => {
        logger.info('WebSocket disconnected', { code: event.code, reason: event.reason });
        state.isConnected = false;
        stopPingTimer();
        callbacks.onDisconnected(event.code, event.reason);

        if (!event.wasClean) {
          scheduleReconnect();
        }
      };

      state.socket.onerror = (error: Event) => {
        logger.error('WebSocket error', { error: error.type });
        callbacks.onError(error);
      };
    } catch (error: unknown) {
      logger.error('Failed to connect WebSocket', { error });
      scheduleReconnect();
    }
  };

  const disconnect = (): void => {
    if (state.socket) {
      state.socket.close(1000, 'User disconnected');
      state.socket = null;
    }
    state.isConnected = false;
    stopPingTimer();
    clearReconnectTimer();
  };

  const scheduleReconnect = (): void => {
    if (state.reconnectAttempts >= state.config.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      callbacks.onMaxReconnectAttemptsReached();
      return;
    }

    state.reconnectAttempts++;
    const delay = state.config.reconnectInterval * Math.pow(2, state.reconnectAttempts - 1);

    state.reconnectTimer = setTimeout(() => {
      logger.info(
        `Attempting to reconnect (${state.reconnectAttempts}/${state.config.maxReconnectAttempts})`
      );
      connect();
    }, delay);
  };

  const clearReconnectTimer = (): void => {
    if (state.reconnectTimer) {
      clearTimeout(state.reconnectTimer);
      state.reconnectTimer = undefined;
    }
  };

  const startPingTimer = (): void => {
    state.pingTimer = setInterval(() => {
      callbacks.sendMessage({
        type: MessageType.PING,
        data: { timestamp: Date.now() },
      });

      // Set pong timeout
      state.pongTimer = setTimeout(() => {
        logger.warning('Pong timeout, reconnecting...');
        disconnect();
        scheduleReconnect();
      }, state.config.pongTimeout);
    }, state.config.pingInterval);
  };

  const stopPingTimer = (): void => {
    if (state.pingTimer) {
      clearInterval(state.pingTimer);
      state.pingTimer = undefined;
    }
    if (state.pongTimer) {
      clearTimeout(state.pongTimer);
      state.pongTimer = undefined;
    }
  };

  const isWebSocketConnected = (): boolean => {
    return state.isConnected;
  };

  const getConnectionStatus = (): ConnectionStatus => {
    return {
      connected: state.isConnected,
      reconnectAttempts: state.reconnectAttempts,
      messageQueueSize: 0, // Will be set by service
    };
  };

  return {
    connect,
    disconnect,
    scheduleReconnect,
    clearReconnectTimer,
    startPingTimer,
    stopPingTimer,
    isWebSocketConnected,
    getConnectionStatus,
  };
}
