/**
 * React Hook for WebSocket
 * 
 * Provides React hook interface for WebSocket functionality
 */

import React from 'react';
import WebSocketService from '../WebSocketService';
import type { UserPresence, ConnectionStatus } from '../types';

export interface UseWebSocketReturn {
  isConnected: boolean;
  presence: Map<string, UserPresence>;
  connectionStatus: ConnectionStatus;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (message: Partial<import('../types').WebSocketMessage>) => void;
  updatePresence: (presence: Partial<UserPresence>) => void;
  joinCollaborationSession: (projectId: string) => void;
  leaveCollaborationSession: (projectId: string) => void;
  sendCursorMove: (cursor: { x: number; y: number }) => void;
  sendSelectionChange: (selection: { start: number; end: number }) => void;
  sendTextEdit: (fieldId: string, change: unknown) => void;
  sendFieldUpdate: (fieldId: string, value: unknown) => void;
  requestDataSync: (projectId: string, dataType: string) => void;
  sendDataSync: (projectId: string, dataType: string, data: unknown) => void;
  sendNotification: (userId: string, notification: Record<string, unknown>) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback: (...args: unknown[]) => void) => void;
}

/**
 * React hook for WebSocket functionality
 */
export const useWebSocket = (): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [presence, setPresence] = React.useState(new Map<string, UserPresence>());
  const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatus>({
    connected: false,
    reconnectAttempts: 0,
    messageQueueSize: 0,
  });

  React.useEffect(() => {
    const ws = WebSocketService.getInstance();

    const handleConnected = () => {
      setIsConnected(true);
      setConnectionStatus(ws.getConnectionStatus());
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnectionStatus(ws.getConnectionStatus());
    };

    const handleUserJoined = (...args: unknown[]) => {
      const userPresence = args[0] as UserPresence;
      if (userPresence && typeof userPresence === 'object' && 'userId' in userPresence) {
        setPresence((prev) => new Map(prev.set(userPresence.userId, userPresence)));
      }
    };

    const handleUserLeft = (...args: unknown[]) => {
      const userId = args[0] as string;
      if (typeof userId === 'string') {
        setPresence((prev) => {
          const newPresence = new Map(prev);
          newPresence.delete(userId);
          return newPresence;
        });
      }
    };

    const handleUserPresence = (...args: unknown[]) => {
      const userPresence = args[0] as UserPresence;
      if (userPresence && typeof userPresence === 'object' && 'userId' in userPresence) {
        setPresence((prev) => new Map(prev.set(userPresence.userId, userPresence)));
      }
    };

    const handleConnectionStatusChange = () => {
      setConnectionStatus(ws.getConnectionStatus());
    };

    // Register event listeners
    ws.on('connected', handleConnected);
    ws.on('disconnected', handleDisconnected);
    ws.on('userJoined', handleUserJoined);
    ws.on('userLeft', handleUserLeft);
    ws.on('userPresence', handleUserPresence);
    ws.on('maxReconnectAttemptsReached', handleConnectionStatusChange);

    return () => {
      ws.off('connected', handleConnected);
      ws.off('disconnected', handleDisconnected);
      ws.off('userJoined', handleUserJoined);
      ws.off('userLeft', handleUserLeft);
      ws.off('userPresence', handleUserPresence);
      ws.off('maxReconnectAttemptsReached', handleConnectionStatusChange);
    };
  }, []);

  const ws = WebSocketService.getInstance();

  return {
    isConnected,
    presence,
    connectionStatus,
    connect: ws.connect.bind(ws),
    disconnect: ws.disconnect.bind(ws),
    sendMessage: ws.sendMessage.bind(ws),
    updatePresence: ws.updatePresence.bind(ws),
    joinCollaborationSession: ws.joinCollaborationSession.bind(ws),
    leaveCollaborationSession: ws.leaveCollaborationSession.bind(ws),
    sendCursorMove: ws.sendCursorMove.bind(ws),
    sendSelectionChange: ws.sendSelectionChange.bind(ws),
    sendTextEdit: ws.sendTextEdit.bind(ws),
    sendFieldUpdate: ws.sendFieldUpdate.bind(ws),
    requestDataSync: ws.requestDataSync.bind(ws),
    sendDataSync: ws.sendDataSync.bind(ws),
    sendNotification: ws.sendNotification.bind(ws),
    on: ws.on.bind(ws),
    off: ws.off.bind(ws),
  };
};

