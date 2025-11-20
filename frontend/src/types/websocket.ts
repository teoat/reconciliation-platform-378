// ============================================================================
// WEBSOCKET TYPES
// ============================================================================

import type { ID, Timestamp } from './backend-aligned';

export interface WebSocketMessage {
  type: string;
  payload: Record<string, unknown>;
  timestamp: Timestamp;
  id?: ID;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}
