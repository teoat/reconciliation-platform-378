// ============================================================================
// WEBSOCKET API HOOK (Enhanced with Redux)
// ============================================================================

import { useCallback, useState } from 'react';
import ApiService from '../../services/ApiService';
import { useNotificationHelpers } from '../../store/hooks';

export const useWebSocketAPI = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected');
  const { showSuccess, showError } = useNotificationHelpers();

  const connect = useCallback(
    async (token?: string) => {
      try {
        setConnectionStatus('connecting');
        await ApiService.connectWebSocket(token);
        setIsConnected(true);
        setConnectionStatus('connected');
        showSuccess('WebSocket Connected', 'Real-time updates enabled');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'WebSocket connection failed';
        setIsConnected(false);
        setConnectionStatus('error');
        showError('WebSocket Connection Failed', errorMessage);
      }
    },
    [showSuccess, showError]
  );

  const disconnect = useCallback(() => {
    ApiService.disconnectWebSocket();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((type: string, data: Record<string, unknown>) => {
    ApiService.sendWebSocketMessage(type, data);
  }, []);

  const onMessage = useCallback((eventType: string, handler: (data: unknown) => void) => {
    ApiService.onWebSocketMessage(eventType, handler);
  }, []);

  const offMessage = useCallback((eventType: string, handler: (data: unknown) => void) => {
    ApiService.offWebSocketMessage(eventType, handler);
  }, []);

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

