// WebSocket Hooks
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { wsClient } from '../../services/apiClient';

// WebSocket Hook
export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<typeof wsClient | null>(null);

  const connect = useCallback(async (token?: string) => {
    try {
      setConnectionStatus('connecting');
      await wsClient.connect(token);
      setIsConnected(true);
      setConnectionStatus('connected');
      wsRef.current = wsClient;
    } catch (error) {
      // Error is handled by setting connection status to 'error'
      // For production, consider integrating with error tracking service
      setIsConnected(false);
      setConnectionStatus('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    wsClient.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    wsRef.current = null;
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current) {
      wsRef.current.send(type, data);
    }
  }, []);

  const onMessage = useCallback((eventType: string, handler: Function) => {
    if (wsRef.current) {
      wsRef.current.on(eventType, handler);
    }
  }, []);

  const offMessage = useCallback((eventType: string, handler: Function) => {
    if (wsRef.current) {
      wsRef.current.off(eventType, handler);
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    onMessage,
    offMessage,
  };
};

// Real-time Collaboration Hook
export const useRealtimeCollaboration = (page: string) => {
  const { isConnected, sendMessage, onMessage, offMessage } = useWebSocket();
  const [activeUsers, setActiveUsers] = useState<Array<{
    id: string;
    name: string;
    page: string;
    lastSeen: string;
  }>>([]);
  const [liveComments, setLiveComments] = useState<Array<{
    id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: string;
    page: string;
  }>>([]);

  // Send user presence updates
  const updatePresence = useCallback((userId: string, userName: string) => {
    sendMessage('user:join', {
      page,
      userId,
      userName,
    });
  }, [sendMessage, page]);

  // Send live comments
  const sendComment = useCallback((userId: string, userName: string, message: string) => {
    sendMessage('comment:add', {
      page,
      userId,
      userName,
      message,
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage, page]);

  // Handle incoming messages
  useEffect(() => {
    const handlePresenceUpdate = (data: any) => {
      setActiveUsers(prev => {
        const existing = prev.find(u => u.id === data.userId);
        if (existing) {
          return prev.map(u => 
            u.id === data.userId 
              ? { ...u, lastSeen: data.timestamp }
              : u
          );
        } else {
          return [...prev, {
            id: data.userId,
            name: data.userName,
            page: data.page,
            lastSeen: data.timestamp,
          }];
        }
      });
    };

    const handleCommentAdded = (data: any) => {
      if (data.page === page) {
        setLiveComments(prev => {
          const exists = prev.find(c => c.id === data.id);
          if (!exists) {
            return [...prev, data];
          }
          return prev;
        });
      }
    };

    const handleUserLeft = (data: any) => {
      setActiveUsers(prev => prev.filter(u => u.id !== data.userId));
    };

    if (isConnected) {
      onMessage('user:presence', handlePresenceUpdate);
      onMessage('comment:added', handleCommentAdded);
      onMessage('user:left', handleUserLeft);
    }

    return () => {
      offMessage('user:presence', handlePresenceUpdate);
      offMessage('comment:added', handleCommentAdded);
      offMessage('user:left', handleUserLeft);
    };
  }, [isConnected, page, onMessage, offMessage]);

  // Send periodic presence updates
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        updatePresence('current-user', 'Current User');
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, updatePresence]);

  return {
    isConnected,
    activeUsers: activeUsers.filter(u => u.page === page),
    liveComments: liveComments.filter(c => c.page === page),
    sendComment,
    updatePresence,
  };
};

