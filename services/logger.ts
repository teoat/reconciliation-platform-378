// Comprehensive Logging Service
// Implements structured logging with multiple outputs and levels

import { APP_CONFIG } from '../constants';

// Types and interfaces
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  category?: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface LogDestination {
  name: string;
  enabled: boolean;
  write: (entry: LogEntry) => Promise<void>;
  flush?: () => Promise<void>;
  close?: () => Promise<void>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'trace';

// Factory functions for creating objects
export const createLogEntry = (config: Partial<LogEntry> = {}): LogEntry => ({
  id: '',
  timestamp: new Date(),
  level: 'info',
  message: '',
  category: '',
  context: {},
  userId: '',
  sessionId: '',
  component: '',
  action: '',
  duration: 0,
  metadata: {},
  ...config,
});

export const createLogDestination = (config: Partial<LogDestination> = {}): LogDestination => ({
  name: '',
  enabled: true,
  write: async (entry: LogEntry) => {},
  flush: async () => {},
  close: async () => {},
  ...config,
});

// Console destination
export class ConsoleDestination implements LogDestination {
  name = 'console';
  enabled = true;

  async write(entry: LogEntry): Promise<void> {
    const logMethod = this.getLogMethod(entry.level);
    const formattedMessage = this.formatMessage(entry);

    if (entry.context && Object.keys(entry.context).length > 0) {
      logMethod(formattedMessage, entry.context);
    } else {
      logMethod(formattedMessage);
    }
  }

  private getLogMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case 'debug':
        return console.debug;
      case 'info':
        return console.info;
      case 'warn':
        return console.warn;
      case 'error':
        return console.error;
      case 'trace':
        return console.trace;
      default:
        return console.log;
    }
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
export class LocalStorageDestination implements LogDestination {
  name = 'localStorage';
  enabled = true;
  maxEntries = 1000;
  storageKey = 'app_logs';

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
      console.error('Failed to write log to localStorage:', error);
    }
  }

  private getLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      return parsed.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
    } catch (error) {
      console.error('Failed to parse logs from localStorage:', error);
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

// Main logger class
export class Logger {
  private destinations: LogDestination[] = [];
  private batch: LogEntry[] = [];
  private batchSize = 10;
  private batchTimer: NodeJS.Timeout | null = null;
  private batchInterval = 5000; // 5 seconds

  constructor(destinations: LogDestination[] = []) {
    this.destinations = destinations;

    // Add console destination by default if none provided
    if (this.destinations.length === 0) {
      this.destinations.push(new ConsoleDestination());
    }

    // Start batch processing
    this.startBatchProcessing();
  }

  log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = createLogEntry({
      level,
      message,
      context,
      id: this.generateId(),
    });

    this.addToBatch(entry);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  trace(message: string, context?: Record<string, any>): void {
    this.log('trace', message, context);
  }

  private addToBatch(entry: LogEntry): void {
    this.batch.push(entry);

    // Flush if batch is full
    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const batchToSend = [...this.batch];
    this.batch = [];

    // Clear batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Send to all destinations
    const promises = this.destinations
      .filter((dest) => dest.enabled)
      .map((dest) => {
        return Promise.all(batchToSend.map((entry) => dest.write(entry)));
      });

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  private startBatchProcessing(): void {
    this.batchTimer = setInterval(() => {
      this.flush();
    }, this.batchInterval);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Public methods for management
  addDestination(destination: LogDestination): void {
    this.destinations.push(destination);
  }

  removeDestination(name: string): void {
    this.destinations = this.destinations.filter((dest) => dest.name !== name);
  }

  async exportLogs(logs: LogEntry[], format: 'json' | 'csv' = 'json'): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      const dataStr = JSON.stringify(logs, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      this.downloadBlob(dataBlob, `logs-${timestamp}.json`);
    } else {
      const csvContent = this.convertToCSV(logs);
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      this.downloadBlob(dataBlob, `logs-${timestamp}.csv`);
    }
  }

  private convertToCSV(logs: LogEntry[]): string {
    if (logs.length === 0) return '';

    const headers = Object.keys(logs[0]);
    const csvRows = [
      headers.join(','),
      ...logs.map((log) =>
        headers
          .map((header) => {
            const value = (log as any)[header];
            return typeof value === 'object' ? JSON.stringify(value) : value;
          })
          .join(',')
      ),
    ];

    return csvRows.join('\n');
  }

  private downloadBlob(blob: Blob, filename: string): void {
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

// Create default logger instance
export const logger = new Logger([new ConsoleDestination(), new LocalStorageDestination()]);

// Utility functions
export const createChildLogger = (category: string, component?: string): Logger => {
  const childLogger = new Logger();

  // Override log method to add category/component
  const originalLog = childLogger.log.bind(childLogger);
  childLogger.log = (level: LogLevel, message: string, context?: Record<string, any>) => {
    const entry = createLogEntry({
      level,
      message,
      category,
      component,
      context,
      id: childLogger['generateId'](),
    });

    childLogger['addToBatch'](entry);
  };

  return childLogger;
};
