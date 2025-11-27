/**
 * Message Queue Utilities
 * 
 * Utilities for managing WebSocket message queues
 */

import type { WebSocketMessage } from '../types';

/**
 * Message queue manager
 */
export class MessageQueue {
  private queue: WebSocketMessage[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Add message to queue
   */
  enqueue(message: WebSocketMessage): void {
    this.queue.push(message);

    // Keep queue size manageable
    if (this.queue.length > this.maxSize) {
      this.queue.shift();
    }
  }

  /**
   * Remove and return next message from queue
   */
  dequeue(): WebSocketMessage | undefined {
    return this.queue.shift();
  }

  /**
   * Get current queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clear all messages from queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get all messages (for debugging)
   */
  getAll(): WebSocketMessage[] {
    return [...this.queue];
  }
}
