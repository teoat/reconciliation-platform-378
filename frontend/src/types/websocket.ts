// types/websocket.ts

/**
 * WebSocket message structure
 * 
 * @property event - Event type identifier
 * @property data - Event payload (unknown type for flexibility)
 */
export interface WebSocketMessage {
  event: string;
  data: unknown;
}
