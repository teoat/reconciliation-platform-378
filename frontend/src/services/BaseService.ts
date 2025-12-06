// Base service providing common functionality for services
// Provides data storage, events, and persistence

export interface ServiceConfig {
  enabled: boolean;
  persistence: boolean;
  events: boolean;
  caching: boolean;
  retries: number;
  timeout?: number;
}

export function createServiceConfig(config: Partial<ServiceConfig> = {}): ServiceConfig {
  return {
    enabled: config.enabled ?? true,
    persistence: config.persistence ?? false,
    events: config.events ?? false,
    caching: config.caching ?? false,
    retries: config.retries ?? 0,
    timeout: config.timeout,
  };
}

// Event handler type
type EventHandler<T = unknown> = (data: T) => void;

export class BaseService<T> {
  protected data: Map<string, T> = new Map();
  protected eventHandlers: Map<string, Set<EventHandler>> = new Map();
  protected config: ServiceConfig;

  constructor(config: Partial<ServiceConfig> = {}) {
    this.config = createServiceConfig(config);
  }

  // Data management
  protected get(id: string): T | undefined {
    return this.data.get(id);
  }

  protected set(id: string, value: T): void {
    this.data.set(id, value);
  }

  protected delete(id: string): boolean {
    return this.data.delete(id);
  }

  protected getAll(): T[] {
    return Array.from(this.data.values());
  }

  protected clear(): void {
    this.data.clear();
  }

  // Event management
  protected emit(event: string, data: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  protected on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(handler);
  }

  protected off(event: string, handler: EventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  // Cleanup method for services
  cleanup(): void {
    this.clear();
    this.eventHandlers.clear();
  }
}

// Persistence service with additional functionality
export class PersistenceService<T> extends BaseService<T> {
  constructor(config: Partial<ServiceConfig> = {}) {
    super({ ...config, persistence: true });
  }

  // Save data (stub implementation)
  save(): void {
    // In a real implementation, this would persist data to localStorage or backend
    // For now, it's a no-op
  }
}
