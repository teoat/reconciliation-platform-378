// Lightweight logger utility with environment-aware behavior

import { LogLevel } from '../types';
import { ErrorType, ErrorSeverity } from '../utils/errorHandler';
import { Metadata } from '@/types/metadata';
import { APP_CONFIG } from '../config/AppConfig';

// Log entry interface
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  category: string;
  context?: Metadata;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  duration?: number;
  metadata?: Metadata;
}

// Log destination interface
export interface LogDestination {
  name: string;
  enabled: boolean;
  write(entry: LogEntry): Promise<void>;
  flush?(): Promise<void>;
  close?(): Promise<void>;
}

// Console destination - production-safe
class ConsoleDestination implements LogDestination {
  name = 'console';
  enabled = true;
  private readonly isDevelopment = process.env.NODE_ENV === 'development';

  async write(entry: LogEntry): Promise<void> {
    // Only log to console in development
    if (!this.isDevelopment) {
      // In production, only log errors
      if (entry.level === 'error') {
        // Use // console.error but format for production
        // console.error(`[Error] ${entry.message}`, this.sanitizeForProduction(entry.context))
      }
      return;
    }

    // Development: log everything
    const logMethod = this.getLogMethod(entry.level);
    const formattedMessage = this.formatMessage(entry);

    if (entry.context) {
      logMethod(formattedMessage, entry.context);
    } else {
      logMethod(formattedMessage);
    }
  }

  private getLogMethod(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
      case 'debug':
        return;
      case 'info':
        return;
      case 'warn':
        return; // console.warn
      case 'error':
        return; // console.error
      case 'trace':
        return;
      default:
        return;
    }
  }

  private sanitizeForProduction(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie', 'auth'];

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(8);
    const category = entry.category ? `[${entry.category}]` : '';
    const component = entry.component ? `[${entry.component}]` : '';

    return `${timestamp} ${level} ${category}${component} ${entry.message}`;
  }
}

// Local storage destination
class LocalStorageDestination implements LogDestination {
  name = 'localStorage';
  enabled = true;
  private maxEntries = 1000;
  private storageKey = 'app_logs';

  async write(entry: LogEntry): Promise<void> {
    try {
      const logs = this.getLogs();
      logs.push(entry);

      // Keep only recent logs
      if (logs.length > this.maxEntries) {
        logs.splice(0, logs.length - this.maxEntries);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(logs));
    } catch (error) {
      // console.error('Failed to write to localStorage:', error)
    }
  }

  private getLogs(): LogEntry[] {
    try {
      const logs = localStorage.getItem(this.storageKey);
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  public getRecentLogs(count: number = 100): LogEntry[] {
    const logs = this.getLogs();
    return logs.slice(-count);
  }

  public clearLogs(): void {
    localStorage.removeItem(this.storageKey);
  }
}

// API destination
class ApiDestination implements LogDestination {
  name = 'api';
  enabled = true;
  private endpoint = '/api/logs';
  private batchSize = 10;
  private batchTimeout = 5000;
  private batch: LogEntry[] = [];
  private batchTimer?: NodeJS.Timeout;

  async write(entry: LogEntry): Promise<void> {
    this.batch.push(entry);

    if (this.batch.length >= this.batchSize) {
      await this.flush();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flush(), this.batchTimeout);
    }
  }

  async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const batchToSend = [...this.batch];
    this.batch = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: batchToSend,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      // console.error('Failed to send logs to API:', error)
      // Re-add failed logs to batch
      this.batch.unshift(...batchToSend);
    }
  }
}

// File download destination
class FileDownloadDestination implements LogDestination {
  name = 'fileDownload';
  enabled = false;

  async write(entry: LogEntry): Promise<void> {
    // This destination is used for exporting logs
    // Individual writes are not supported
  }

  async exportLogs(logs: LogEntry[], format: 'json' | 'csv' = 'json'): Promise<void> {
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify(logs, null, 2);
      filename = `logs_${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    } else {
      const headers = ['timestamp', 'level', 'category', 'message', 'component', 'action'];
      const csvContent = [
        headers.join(','),
        ...logs.map((log) =>
          [
            log.timestamp.toISOString(),
            log.level,
            log.category,
            `"${log.message.replace(/"/g, '""')}"`,
            log.component || '',
            log.action || '',
          ].join(',')
        ),
      ].join('\n');

      content = csvContent;
      filename = `logs_${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }
}

// Main Logger class
class Logger {
  private static instance: Logger;
  private destinations: Map<string, LogDestination> = new Map();
  private isInitialized = false;
  private sessionId: string;

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeDestinations();
  }

  private initializeDestinations(): void {
    // Add default destinations
    this.addDestination(new ConsoleDestination());
    this.addDestination(new LocalStorageDestination());
    this.addDestination(new ApiDestination());
    this.addDestination(new FileDownloadDestination());

    this.isInitialized = true;
  }

  public addDestination(destination: LogDestination): void {
    this.destinations.set(destination.name, destination);
  }

  public removeDestination(name: string): void {
    this.destinations.delete(name);
  }

  public enableDestination(name: string): void {
    const destination = this.destinations.get(name);
    if (destination) {
      destination.enabled = true;
    }
  }

  public disableDestination(name: string): void {
    const destination = this.destinations.get(name);
    if (destination) {
      destination.enabled = false;
    }
  }

  // Public logging methods
  public debug(
    message: string,
    context?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): void {
    this.log('debug', message, 'debug', context, metadata);
  }

  public info(
    message: string,
    context?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): void {
    this.log('info', message, 'info', context, metadata);
  }

  public warning(
    message: string,
    context?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): void {
    this.log('warn', message, 'warning', context, metadata);
  }

  public warn(
    message: string,
    context?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): void {
    this.log('warn', message, 'warning', context, metadata);
  }

  public error(
    message: string,
    context?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): void {
    this.log('error', message, 'error', context, metadata);
  }

  public critical(
    message: string,
    context?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): void {
    this.log('error', message, 'critical', context, metadata);
  }

  // Structured logging methods
  public logUserAction(action: string, component: string, context?: Record<string, unknown>): void {
    this.log('info', `User action: ${action}`, 'user_action', {
      ...context,
      action,
      component,
    });
  }

  public logApiCall(
    method: string,
    url: string,
    status: number,
    duration: number,
    context?: Record<string, unknown>
  ): void {
    const level = status >= 400 ? 'error' : 'info';
    this.log(level, `API ${method} ${url} - ${status}`, 'api_call', {
      ...context,
      method,
      url,
      status,
      duration,
    });
  }

  public logPerformance(operation: string, duration: number, context?: Record<string, unknown>): void {
    const level = duration > 1000 ? 'warn' : 'info';
    this.log(level, `Performance: ${operation} took ${duration}ms`, 'performance', {
      ...context,
      operation,
      duration,
    });
  }

  public logSecurity(event: string, context?: Record<string, unknown>): void {
    this.log('warn', `Security event: ${event}`, 'security', context);
  }

  public logBusinessEvent(event: string, context?: Record<string, unknown>): void {
    this.log('info', `Business event: ${event}`, 'business', context);
  }

  // Core logging method
  private log(
    level: LogLevel,
    message: string,
    category: string,
    context?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      message,
      category,
      context: this.sanitizeContext(context),
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      metadata: this.sanitizeContext(metadata),
    };

    // Write to all enabled destinations
    this.destinations.forEach((destination) => {
      if (destination.enabled) {
        destination.write(entry).catch((error) => {
          // console.error(`Failed to write to destination ${destination.name}:`, error)
        });
      }
    });
  }

  // Utility methods
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    let sessionId = sessionStorage.getItem('logger_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('logger_session_id', sessionId);
    }
    return sessionId;
  }

  private getCurrentUserId(): string | undefined {
    try {
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      return user?.id;
    } catch {
      return undefined;
    }
  }

  private sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // Export methods
  public async exportLogs(format: 'json' | 'csv' = 'json'): Promise<void> {
    const localStorageDestination = this.destinations.get(
      'localStorage'
    ) as LocalStorageDestination;
    if (localStorageDestination) {
      const logs = localStorageDestination.getRecentLogs();
      const fileDestination = this.destinations.get('fileDownload') as FileDownloadDestination;
      if (fileDestination) {
        await fileDestination.exportLogs(logs, format);
      }
    }
  }

  public getRecentLogs(count: number = 100): LogEntry[] {
    const localStorageDestination = this.destinations.get(
      'localStorage'
    ) as LocalStorageDestination;
    if (localStorageDestination) {
      return localStorageDestination.getRecentLogs(count);
    }
    return [];
  }

  public clearLogs(): void {
    const localStorageDestination = this.destinations.get(
      'localStorage'
    ) as LocalStorageDestination;
    if (localStorageDestination) {
      localStorageDestination.clearLogs();
    }
  }

  public async flush(): Promise<void> {
    const promises = Array.from(this.destinations.values())
      .filter((dest) => dest.flush)
      .map((dest) => dest.flush!());

    await Promise.all(promises);
  }

  // Performance monitoring
  public measurePerformance<T>(operation: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.logPerformance(operation, duration);
    return result;
  }

  public async measureAsyncPerformance<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.logPerformance(operation, duration);
    return result;
  }
}

// React hooks for logging
export const useLogger = () => {
  const logger = Logger.getInstance();

  return {
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    warning: logger.warning.bind(logger),
    error: logger.error.bind(logger),
    critical: logger.critical.bind(logger),
    logUserAction: logger.logUserAction.bind(logger),
    logApiCall: logger.logApiCall.bind(logger),
    logPerformance: logger.logPerformance.bind(logger),
    logSecurity: logger.logSecurity.bind(logger),
    logBusinessEvent: logger.logBusinessEvent.bind(logger),
    measurePerformance: logger.measurePerformance.bind(logger),
    measureAsyncPerformance: logger.measureAsyncPerformance.bind(logger),
    exportLogs: logger.exportLogs.bind(logger),
    getRecentLogs: logger.getRecentLogs.bind(logger),
    clearLogs: logger.clearLogs.bind(logger),
  };
};

// Performance logging decorator
export const logPerformance = (operation: string) => {
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const logger = Logger.getInstance();

    descriptor.value = function (...args: unknown[]) {
      return logger.measureAsyncPerformance(operation, () => method.apply(this, args));
    };

    return descriptor;
  };
};

// Export singleton instance
export const logger = Logger.getInstance();

export default logger;
