/**
 * WebSocket Service Exports
 * 
 * Main entry point for WebSocket service
 */

export { default as WebSocketService } from './WebSocketService';
export { useWebSocket } from './hooks/useWebSocket';
export * from './types';
export { MessageQueue } from './utils/messageQueue';

// Export singleton instance
import WebSocketService from './WebSocketService';
export const webSocketService = WebSocketService.getInstance();
export default webSocketService;

