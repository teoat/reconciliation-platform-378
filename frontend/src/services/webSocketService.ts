/**
 * @deprecated This file has been refactored. Import from '@/services/websocket' instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 * 
 * Migration guide:
 * - Import from '@/services/websocket' instead of '@/services/webSocketService'
 * - All types are now in '@/services/websocket/types'
 * - React hook is in '@/services/websocket/hooks/useWebSocket'
 */

// Re-export from new location
export {
  WebSocketService,
  useWebSocket,
  webSocketService,
  default,
} from './websocket';

export type {
  WebSocketMessage,
  UserPresence,
  CollaborationSession,
  WebSocketConfig,
  ConnectionStatus,
} from './websocket/types';

// Legacy exports for backward compatibility
import WebSocketService from './websocket/WebSocketService';
import { useWebSocket } from './websocket/hooks/useWebSocket';
import { MessageType } from './websocket/types';

export { MessageType };
export { useWebSocket };
export default WebSocketService.getInstance();
