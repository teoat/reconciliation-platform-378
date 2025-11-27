/**
 * Message Queue Utilities
 * 
 * Message queue management for WebSocket service
 */

import type { WebSocketMessage } from '../types';

export class MessageQueue {
  private queue: WebSocketMessage[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  enqueue(message: WebSocketMessage): void {
    this.queue.push(message);

    // Keep queue size manageable
    if (this.queue.length > this.maxSize) {
      this.queue.shift();
    }
  }

  dequeue(): WebSocketMessage | undefined {
    return this.queue.shift();
  }

  clear(): void {
    this.queue = [];
  }

  get size(): number {
    return this.queue.length;
  }

  get all(): WebSocketMessage[] {
    return [...this.queue];
  }

  process(processor: (message: WebSocketMessage) => void): void {
    while (this.queue.length > 0) {
      const message = this.dequeue();
      if (message) {
        processor(message);
      }
    }
  }
}

