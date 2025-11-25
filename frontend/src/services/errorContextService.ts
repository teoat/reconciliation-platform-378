// Error Context Preservation Service - Enhanced error context preservation
import { logger } from '@/services/logger';
import { toRecord } from '../utils/typeHelpers';
// Implements comprehensive error context tracking with project ID, user ID, workflow stage

export interface ErrorContext {
  id: string;
  timestamp: Date;
  userId?: string;
  projectId?: string;
  workflowStage?: string;
  component?: string;
  action?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  referrer?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ErrorContextConfig {
  enableTracking: boolean;
  maxContexts: number;
  retentionPeriod: number; // milliseconds
  enablePersistence: boolean;
  enableAnalytics: boolean;
}

export interface ErrorContextEvent {
  type: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  context: ErrorContext;
  stack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorContextService {
  private static instance: ErrorContextService;
  private contexts: Map<string, ErrorContext> = new Map();
  private events: ErrorContextEvent[] = [];
  private config: ErrorContextConfig;
  private currentContext: ErrorContext | null = null;
  private listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  private cleanupTimer?: NodeJS.Timeout;

  public static getInstance(): ErrorContextService {
    if (!ErrorContextService.instance) {
      ErrorContextService.instance = new ErrorContextService();
    }
    return ErrorContextService.instance;
  }

  constructor() {
    this.config = {
      enableTracking: true,
      maxContexts: 1000,
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      enablePersistence: true,
      enableAnalytics: true,
    };

    this.initializeContext();
    this.loadPersistedContexts();
    this.startCleanupTimer();
  }

  private initializeContext(): void {
    this.currentContext = {
      id: this.generateContextId(),
      timestamp: new Date(),
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
    };
  }

  private generateContextId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('error_context_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('error_context_session_id', sessionId);
    }
    return sessionId;
  }

  private loadPersistedContexts(): void {
    if (!this.config.enablePersistence) return;

    try {
      const stored = localStorage.getItem('error_contexts');
      if (stored) {
        const data = JSON.parse(stored);
        this.contexts = new Map(data.contexts);
        this.events = data.events || [];
      }
    } catch (error) {
      logger.error('Failed to load persisted error contexts:', toRecord(error));
    }
  }

  private savePersistedContexts(): void {
    if (!this.config.enablePersistence) return;

    try {
      const data = {
        contexts: Array.from(this.contexts.entries()),
        events: this.events,
      };
      localStorage.setItem('error_contexts', JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save error contexts:', toRecord(error));
    }
  }

  private startCleanupTimer(): void {
    // Clear existing timer if any
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Start new cleanup timer
    this.cleanupTimer = setInterval(
      () => {
        this.cleanupOldContexts();
      },
      60 * 60 * 1000
    ); // Clean up every hour
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  private cleanupOldContexts(): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod);

    // Clean up old contexts
    const keysToDelete: string[] = [];
    this.contexts.forEach((context, key) => {
      if (context.timestamp < cutoff) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.contexts.delete(key));

    // Clean up old events
    this.events = this.events.filter((event) => event.context.timestamp >= cutoff);

    // Limit contexts to maxContexts
    if (this.contexts.size > this.config.maxContexts) {
      const sortedContexts = Array.from(this.contexts.entries()).sort(
        (a, b) => b[1].timestamp.getTime() - a[1].timestamp.getTime()
      );

      this.contexts.clear();
      sortedContexts.slice(0, this.config.maxContexts).forEach(([key, context]) => {
        this.contexts.set(key, context);
      });
    }

    this.savePersistedContexts();
  }

  public setContext(updates: Partial<ErrorContext>): ErrorContext {
    if (!this.currentContext) {
      this.initializeContext();
    }

    this.currentContext = {
      ...this.currentContext!,
      ...updates,
      timestamp: new Date(),
    };

    this.contexts.set(this.currentContext.id, this.currentContext);
    this.savePersistedContexts();

    this.emit('contextUpdated', toRecord(this.currentContext));
    return this.currentContext;
  }

  public getCurrentContext(): ErrorContext | null {
    return this.currentContext;
  }

  public createErrorContext(
    type: ErrorContextEvent['type'],
    message: string,
    severity: ErrorContextEvent['severity'],
    options: {
      stack?: string;
      data?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    } = {}
  ): ErrorContextEvent {
    const context = this.currentContext || this.initializeContext();
    if (!context) {
      // Fallback context if initialization fails
      const fallbackContext: ErrorContext = {
        id: `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };
      this.currentContext = fallbackContext;
    }

    const event: ErrorContextEvent = {
      type,
      message,
      context: (this.currentContext || this.initializeContext()!) as ErrorContext,
      stack: options.stack,
      severity,
      ...options,
    };

    this.events.push(event);
    this.emit('errorEvent', toRecord(event));

    // Send to analytics if enabled
    if (this.config.enableAnalytics) {
      this.sendToAnalytics(event);
    }

    return event;
  }

  private sendToAnalytics(event: ErrorContextEvent): void {
    // This would integrate with your analytics service
    // For now, we'll just log it
    logger.info('Analytics Event:', {
      type: event.type,
      message: event.message,
      severity: event.severity,
      context: event.context,
      timestamp: event.context.timestamp,
    });
  }

  public trackError(
    error: Error,
    options: {
      component?: string;
      action?: string;
      data?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    } = {}
  ): ErrorContextEvent {
    return this.createErrorContext('error', error.message, this.determineSeverity(error), {
      stack: error.stack,
      data: options.data,
      metadata: {
        ...options.metadata,
        component: options.component,
        action: options.action,
        errorName: error.name,
      },
    });
  }

  public trackWarning(
    message: string,
    options: {
      component?: string;
      action?: string;
      data?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    } = {}
  ): ErrorContextEvent {
    return this.createErrorContext('warning', message, 'medium', {
      data: options.data,
      metadata: {
        ...options.metadata,
        component: options.component,
        action: options.action,
      },
    });
  }

  public trackInfo(
    message: string,
    options: {
      component?: string;
      action?: string;
      data?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    } = {}
  ): ErrorContextEvent {
    return this.createErrorContext('info', message, 'low', {
      data: options.data,
      metadata: {
        ...options.metadata,
        component: options.component,
        action: options.action,
      },
    });
  }

  private determineSeverity(error: Error): ErrorContextEvent['severity'] {
    // Determine severity based on error type and message
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('critical') || errorMessage.includes('fatal')) {
      return 'critical';
    }

    if (errorMessage.includes('error') || errorMessage.includes('failed')) {
      return 'high';
    }

    if (errorMessage.includes('warning') || errorMessage.includes('caution')) {
      return 'medium';
    }

    return 'low';
  }

  public getContextsByProject(projectId: string): ErrorContext[] {
    return Array.from(this.contexts.values()).filter((context) => context.projectId === projectId);
  }

  public getContextsByUser(userId: string): ErrorContext[] {
    return Array.from(this.contexts.values()).filter((context) => context.userId === userId);
  }

  public getContextsByWorkflowStage(workflowStage: string): ErrorContext[] {
    return Array.from(this.contexts.values()).filter(
      (context) => context.workflowStage === workflowStage
    );
  }

  public getEventsBySeverity(severity: ErrorContextEvent['severity']): ErrorContextEvent[] {
    return this.events.filter((event) => event.severity === severity);
  }

  public getRecentEvents(limit: number = 50): ErrorContextEvent[] {
    return this.events
      .sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime())
      .slice(0, limit);
  }

  public getErrorStats(): {
    totalErrors: number;
    errorsBySeverity: Record<string, number>;
    errorsByComponent: Record<string, number>;
    errorsByProject: Record<string, number>;
    recentErrorRate: number;
  } {
    const totalErrors = this.events.length;
    const errorsBySeverity: Record<string, number> = {};
    const errorsByComponent: Record<string, number> = {};
    const errorsByProject: Record<string, number> = {};

    this.events.forEach((event) => {
      // Count by severity
      errorsBySeverity[event.severity] = (errorsBySeverity[event.severity] || 0) + 1;

      // Count by component
      const component = event.context.component || 'unknown';
      errorsByComponent[component] = (errorsByComponent[component] || 0) + 1;

      // Count by project
      const project = event.context.projectId || 'unknown';
      errorsByProject[project] = (errorsByProject[project] || 0) + 1;
    });

    // Calculate recent error rate (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = this.events.filter(
      (event) => event.context.timestamp >= oneHourAgo
    ).length;
    const recentErrorRate = recentErrors / 60; // errors per minute

    return {
      totalErrors,
      errorsBySeverity,
      errorsByComponent,
      errorsByProject,
      recentErrorRate,
    };
  }

  public updateConfig(newConfig: Partial<ErrorContextConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', toRecord(this.config));
  }

  public getConfig(): ErrorContextConfig {
    return { ...this.config };
  }

  public clearContexts(): void {
    this.contexts.clear();
    this.events = [];
    this.savePersistedContexts();
    this.emit('contextsCleared');
  }

  public exportContexts(): string {
    const data = {
      contexts: Array.from(this.contexts.entries()),
      events: this.events,
      config: this.config,
      exportTimestamp: new Date(),
    };
    return JSON.stringify(data, null, 2);
  }

  public importContexts(data: string): boolean {
    try {
      const imported = JSON.parse(data);
      this.contexts = new Map(imported.contexts);
      this.events = imported.events || [];
      this.savePersistedContexts();
      this.emit('contextsImported', { count: this.contexts.size });
      return true;
    } catch (error) {
      logger.error('Failed to import contexts:', toRecord(error));
      return false;
    }
  }

  // Event system
  public on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (...args: unknown[]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: Record<string, unknown>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  public destroy(): void {
    this.stopCleanupTimer();
    this.contexts.clear();
    this.events = [];
    this.listeners.clear();
  }
}

// React hook for error context
export const useErrorContext = () => {
  const service = ErrorContextService.getInstance();

  const setContext = (updates: Partial<ErrorContext>) => {
    return service.setContext(updates);
  };

  const getCurrentContext = () => {
    return service.getCurrentContext();
  };

  const trackError = (
    error: Error,
    options?: {
      component?: string;
      action?: string;
      data?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }
  ) => {
    return service.trackError(error, options);
  };

  const trackWarning = (
    message: string,
    options?: {
      component?: string;
      action?: string;
      data?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }
  ) => {
    return service.trackWarning(message, options);
  };

  const trackInfo = (
    message: string,
    options?: {
      component?: string;
      action?: string;
      data?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }
  ) => {
    return service.trackInfo(message, options);
  };

  const getErrorStats = () => {
    return service.getErrorStats();
  };

  const getRecentEvents = (limit?: number) => {
    return service.getRecentEvents(limit);
  };

  return {
    setContext,
    getCurrentContext,
    trackError,
    trackWarning,
    trackInfo,
    getErrorStats,
    getRecentEvents,
  };
};

// Export singleton instance
export const errorContextService = ErrorContextService.getInstance();
