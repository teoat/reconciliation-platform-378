import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { logger } from '@/services/logger';
import WebSocketClient, { WebSocketConfig, WebSocketStatus, WebSocketMessage } from './websocket';

interface WebSocketContextType {
  client: WebSocketClient | null;
  status: WebSocketStatus;
  connect: () => Promise<void>;
  disconnect: () => void;
  emit: (event: string, data?: unknown) => void;
  subscribe: (event: string, handler: (data: unknown) => void) => string;
  unsubscribe: (event: string, subscriptionId: string) => void;
  isConnected: () => boolean;
  waitForConnection: (timeout?: number) => Promise<void>;
  sendMessage: (message: WebSocketMessage) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  updatePresence: (status: 'online' | 'away' | 'busy' | 'offline') => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
  config: WebSocketConfig;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, config }) => {
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    connecting: false,
    reconnecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0,
  });

  useEffect(() => {
    const wsClient = new WebSocketClient(config);
    setClient(wsClient);

    // Subscribe to status changes
    const statusSubscriptionId = wsClient.subscribe('status-change', (newStatus: unknown) => {
      setStatus(newStatus as WebSocketStatus);
    });

    // Subscribe to common events
    const messageSubscriptionId = wsClient.subscribe('message', (_data: unknown) => {
      // Handle incoming messages
    });

    // Subscribe to errors
    const errorSubscriptionId = wsClient.subscribe('error', (error: Error | unknown) => {
      logger.error('WebSocket error:', error as Record<string, unknown>);
    });

    // Subscribe to auth errors
    const authErrorSubscriptionId = wsClient.subscribe('auth-error', (error: Error | unknown) => {
      logger.error('WebSocket auth error:', error as Record<string, unknown>);
      // Handle authentication errors (e.g., redirect to login)
    });

    return () => {
      wsClient.unsubscribe('status-change', statusSubscriptionId);
      wsClient.unsubscribe('message', messageSubscriptionId);
      wsClient.unsubscribe('error', errorSubscriptionId);
      wsClient.unsubscribe('auth-error', authErrorSubscriptionId);
      wsClient.destroy();
    };
  }, [config]);

  const connect = async () => {
    if (client) {
      await client.connect();
    }
  };

  const disconnect = () => {
    if (client) {
      client.disconnect();
    }
  };

  const emit = (event: string, data?: unknown) => {
    if (client) {
      client.emit(event, data);
    }
  };

  const subscribe = (event: string, handler: (data: unknown) => void) => {
    if (client) {
      return client.subscribe(event, handler);
    }
    return '';
  };

  const unsubscribe = (event: string, subscriptionId: string) => {
    if (client) {
      client.unsubscribe(event, subscriptionId);
    }
  };

  const isConnected = () => {
    return client ? client.isConnected() : false;
  };

  const waitForConnection = async (timeout?: number) => {
    if (client) {
      return client.waitForConnection(timeout);
    }
    throw new Error('WebSocket client not initialized');
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (client) {
      client.send(message.event, message.data);
    }
  };

  const joinRoom = (room: string) => {
    if (client) {
      client.joinRoom(room);
    }
  };

  const leaveRoom = (room: string) => {
    if (client) {
      client.leaveRoom(room);
    }
  };

  const updatePresence = (status: 'online' | 'away' | 'busy' | 'offline') => {
    if (client) {
      client.updatePresence(status);
    }
  };

  const value: WebSocketContextType = {
    client,
    status,
    connect,
    disconnect,
    emit,
    subscribe,
    unsubscribe,
    isConnected,
    waitForConnection,
    sendMessage,
    joinRoom,
    leaveRoom,
    updatePresence,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

// Hook for real-time reconciliation updates
export const useReconciliationUpdates = () => {
  const { subscribe, unsubscribe, isConnected } = useWebSocketContext();
  const [updates, setUpdates] = useState<Array<Record<string, unknown> & { timestamp: Date }>>([]);

  useEffect(() => {
    if (!isConnected()) return;

    const subscriptionId = subscribe('reconciliation-update', (data) => {
      setUpdates((prev) => [
        ...prev,
        { ...(data as Record<string, unknown>), timestamp: new Date() },
      ]);
    });

    return () => {
      unsubscribe('reconciliation-update', subscriptionId);
    };
  }, [subscribe, unsubscribe, isConnected]);

  return updates;
};

// Hook for real-time notifications
export const useRealtimeNotifications = () => {
  const { subscribe, unsubscribe, isConnected } = useWebSocketContext();
  const [notifications, setNotifications] = useState<
    Array<Record<string, unknown> & { timestamp: Date }>
  >([]);

  useEffect(() => {
    if (!isConnected()) return;

    const subscriptionId = subscribe('notification', (data) => {
      setNotifications((prev) => [
        ...prev,
        { ...(data as Record<string, unknown>), timestamp: new Date() },
      ]);
    });

    return () => {
      unsubscribe('notification', subscriptionId);
    };
  }, [subscribe, unsubscribe, isConnected]);

  return notifications;
};

// Hook for real-time collaboration
export const useCollaboration = (roomId: string) => {
  const { joinRoom, leaveRoom, subscribe, unsubscribe, emit, isConnected } = useWebSocketContext();
  const [collaborators, setCollaborators] = useState<Array<Record<string, unknown>>>([]);
  const [activities, setActivities] = useState<
    Array<Record<string, unknown> & { timestamp: Date }>
  >([]);

  useEffect(() => {
    if (!isConnected() || !roomId) return;

    // Join the collaboration room
    joinRoom(roomId);

    // Subscribe to room events
    const collaboratorsSubscriptionId = subscribe('collaborators-update', (data) => {
      const collabData = data as { collaborators?: unknown[] };
      setCollaborators((collabData.collaborators || []) as unknown as Record<string, unknown>[]);
    });

    const activitiesSubscriptionId = subscribe('activity-update', (data) => {
      setActivities((prev) => [
        ...prev,
        { ...(data as Record<string, unknown>), timestamp: new Date() },
      ]);
    });

    return () => {
      unsubscribe('collaborators-update', collaboratorsSubscriptionId);
      unsubscribe('activity-update', activitiesSubscriptionId);
      leaveRoom(roomId);
    };
  }, [roomId, joinRoom, leaveRoom, subscribe, unsubscribe, isConnected]);

  const sendActivity = (activity: Record<string, unknown>) => {
    emit('activity', { roomId, activity });
  };

  const updateCursor = (position: { x: number; y: number }) => {
    emit('cursor-update', { roomId, position });
  };

  return {
    collaborators,
    activities,
    sendActivity,
    updateCursor,
  };
};

export default WebSocketProvider;
