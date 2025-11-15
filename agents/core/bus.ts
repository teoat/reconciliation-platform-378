/**
 * Agent Communication Bus - Event-Driven Communication System
 * 
 * Provides event-driven communication between agents and other system components.
 */

import { AgentEvent, AgentEventType } from './types';

type EventListener = (event: AgentEvent) => void | Promise<void>;

export class AgentBus {
  private listeners: Map<AgentEventType, Set<EventListener>> = new Map();
  private eventHistory: AgentEvent[] = [];
  private maxHistorySize = 1000;

  /**
   * Subscribe to agent events
   */
  subscribe(eventType: AgentEventType, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(eventType, listener);
    };
  }

  /**
   * Unsubscribe from agent events
   */
  unsubscribe(eventType: AgentEventType, listener: EventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit agent event
   */
  async emit(event: AgentEvent): Promise<void> {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify listeners
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      const promises = Array.from(listeners).map(async (listener) => {
        try {
          await listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      });
      await Promise.all(promises);
    }

    // Also notify wildcard listeners
    const wildcardListeners = this.listeners.get('*' as AgentEventType);
    if (wildcardListeners) {
      const promises = Array.from(wildcardListeners).map(async (listener) => {
        try {
          await listener(event);
        } catch (error) {
          console.error(`Error in wildcard event listener:`, error);
        }
      });
      await Promise.all(promises);
    }
  }

  /**
   * Get event history
   */
  getEventHistory(agentName?: string, limit?: number): AgentEvent[] {
    let events = this.eventHistory;

    if (agentName) {
      events = events.filter((e) => e.agent === agentName);
    }

    if (limit) {
      events = events.slice(-limit);
    }

    return events;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }
}

// Singleton instance
export const agentBus = new AgentBus();

