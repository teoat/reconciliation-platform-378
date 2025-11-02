// Comprehensive Logging Service
// Implements structured logging with multiple outputs and levels

import { APP_CONFIG } from '../constants';

// Factory functions for creating objects
export const createLogEntry = (config = {}) => ({
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

export const createLogDestination = (config = {}) => ({
  name: '',
  enabled: true,
  write: async (entry) => {},
  flush: async () => {},
  close: async () => {},
  ...config,
});

export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  TRACE: 'trace',
};

// Console destination
class ConsoleDestination {
  constructor() {
    this.name = 'console'
    this.enabled = true
  }

  async write(entry) {
    const logMethod = this.getLogMethod(entry.level)
    const formattedMessage = this.formatMessage(entry)
    
    if (entry.context) {
      logMethod(formattedMessage, entry.context)
    } else {
      logMethod(formattedMessage)
    }
  }

  getLogMethod(level) {
    switch (level) {
      case 'debug': return console.debug
      case 'info': return console.info
      case 'warn': return console.warn
      case 'error': return console.error
      case 'trace': return console.trace
      default: return console.log
    }
  }

  formatMessage(entry) {
    const timestamp = entry.timestamp.toISOString()
    const level = entry.level.toUpperCase().padEnd(8)
    const category = entry.category ? `[${entry.category}]` : ''
    const component = entry.component ? `[${entry.component}]` : ''
    
    return `${timestamp} ${level} ${category}${component} ${entry.message}`
  }
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
class LocalStorageDestination {
  constructor() {
    this.name = 'localStorage'
    this.enabled = true
    this.maxEntries = 1000
    this.storageKey = 'app_logs'
  }

  async write(entry) {
    try {
      const logs = this.getLogs()
      logs.push(entry)
      
      // Keep only recent logs
      if (logs.length > this.maxEntries) {
        logs.splice(0, logs.length - this.maxEntries)
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(logs))
    } catch (error) {
      console.error('Failed to write to localStorage:', error)
    }
  }

  getLogs() {
    try {
      const logs = localStorage.getItem(this.storageKey)
      return logs ? JSON.parse(logs) : []
    } catch {
      return []
    }
  }

  getRecentLogs(count = 100) {
    const logs = this.getLogs()
    return logs.slice(-count)
  }

  clearLogs() {
    localStorage.removeItem(this.storageKey)
  }
}

      localStorage.setItem(this.storageKey, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to write to localStorage:', error);
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
class ApiDestination {
  constructor() {
    this.name = 'api'
    this.enabled = true
    this.endpoint = '/api/logs'
    this.batchSize = 10
    this.batchTimeout = 5000
    this.batch = []
    this.batchTimer = null
  }

  async write(entry) {
    this.batch.push(entry)
    
    if (this.batch.length >= this.batchSize) {
      await this.flush()
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flush(), this.batchTimeout)
    }
  }

  async flush() {
    if (this.batch.length === 0) return

    const batchToSend = [...this.batch]
    this.batch = []
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
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
      })
    } catch (error) {
      console.error('Failed to send logs to API:', error)
      // Re-add failed logs to batch
      this.batch.unshift(...batchToSend)
    }
  }
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
      console.error('Failed to send logs to API:', error);
      // Re-add failed logs to batch
      this.batch.unshift(...batchToSend);
    }
  }
}

// File download destination
class FileDownloadDestination {
  constructor() {
    this.name = 'fileDownload'
    this.enabled = false
  }

  async write(entry) {
    // This destination is used for exporting logs
    // Individual writes are not supported
  }

  async exportLogs(logs, format = 'json') {
    let content
    let filename
    let mimeType

    if (format === 'json') {
      content = JSON.stringify(logs, null, 2)
      filename = `logs_${new Date().toISOString().split('T')[0]}.json`
      mimeType = 'application/json'
    } else {
      const headers = ['timestamp', 'level', 'category', 'message', 'component', 'action']
      const csvContent = [
        headers.join(','),
        ...logs.map(log => [
          log.timestamp.toISOString(),
          log.level,
          log.category,
          `"${log.message.replace(/"/g, '""')}"`,
          log.component || '',
          log.action || '',
        ].join(','))
      ].join('\n')
      
      content = csvContent
      filename = `logs_${new Date().toISOString().split('T')[0]}.csv`
      mimeType = 'text/csv'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
  }
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
  static instance = null
  destinations = new Map()
  isInitialized = false
  sessionId

  static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeDestinations()
  }

  initializeDestinations() {
    // Add default destinations
    this.addDestination(new ConsoleDestination())
    this.addDestination(new LocalStorageDestination())
    this.addDestination(new ApiDestination())
    this.addDestination(new FileDownloadDestination())
    
    this.isInitialized = true
  }

  addDestination(destination) {
    this.destinations.set(destination.name, destination)
  }

  removeDestination(name) {
    this.destinations.delete(name)
  }

  enableDestination(name) {
    const destination = this.destinations.get(name)
    if (destination) {
      destination.enabled = true
    }
  }

  disableDestination(name) {
    const destination = this.destinations.get(name)
    if (destination) {
      destination.enabled = false
    }
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
  debug(message, context, metadata) {
    this.log('debug', message, 'debug', context, metadata)
  }

  info(message, context, metadata) {
    this.log('info', message, 'info', context, metadata)
  }

  warning(message, context, metadata) {
    this.log('warn', message, 'warning', context, metadata)
  }

  error(message, context, metadata) {
    this.log('error', message, 'error', context, metadata)
  }

  critical(message, context, metadata) {
    this.log('error', message, 'critical', context, metadata)
  }

  // Structured logging methods
  logUserAction(action, component, context) {
    this.log('info', `User action: ${action}`, 'user_action', {
      ...context,
      action,
      component,
    })
  }

  logApiCall(method, url, status, duration, context) {
    const level = status >= 400 ? 'error' : 'info'
    this.log(level, `API ${method} ${url} - ${status}`, 'api_call', {
      ...context,
      method,
      url,
      status,
      duration,
    })
  }

  logPerformance(operation, duration, context) {
    const level = duration > 1000 ? 'warn' : 'info'
    this.log(level, `Performance: ${operation} took ${duration}ms`, 'performance', {
      ...context,
      operation,
      duration,
    })
  }

  logSecurity(event, context) {
    this.log('warn', `Security event: ${event}`, 'security', context)
  }

  logAudit(event, context) {
    this.log('info', `Audit event: ${event}`, 'audit', context)
  }

  logAuthFailure(reason, context) {
    this.logAudit(`Authentication denied: ${reason}`, {
      ...context,
      event_type: 'auth_denied',
      timestamp: new Date().toISOString(),
    })
  }

  logBusinessEvent(event, context) {
    this.log('info', `Business event: ${event}`, 'business', context)
  }



  // Core logging method
  log(
    level,
    message,
    category,
    context,
    metadata
  ) {
    const entry = createLogEntry({
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      message,
      category,
      context: this.sanitizeContext(context),
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      metadata: this.sanitizeContext(metadata),
    })

    // Write to all enabled destinations
    this.destinations.forEach(destination => {
      if (destination.enabled) {
        destination.write(entry).catch(error => {
          console.error(`Failed to write to destination ${destination.name}:`, error)
        })
      }
    })
  }
    });
  }

  // Utility methods
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  generateSessionId() {
    let sessionId = sessionStorage.getItem('logger_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('logger_session_id', sessionId)
    }
    return sessionId
  }

  getCurrentUserId() {
    try {
      const userData = localStorage.getItem('user')
      const user = userData ? JSON.parse(userData) : null
      return user?.id
    } catch {
      return undefined
    }
  }

  sanitizeContext(context) {
    if (!context) return undefined

    const sanitized = { ...context }
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'authorization', 'cookie',
      'email', 'phone', 'ssn', 'social_security', 'credit_card', 'card_number',
      'bank_account', 'account_number', 'personal_data', 'pii', 'sensitive'
    ]

    const maskValue = (value) => {
      if (typeof value === 'string') {
        // Mask emails
        if (value.includes('@') && value.includes('.')) {
          const [local, domain] = value.split('@')
          return `${local.substring(0, 2)}***@${domain}`
        }
        // Mask phone numbers (basic pattern)
        if (/^\+?[\d\s\-\(\)]{10,}$/.test(value.replace(/\s/g, ''))) {
          return value.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')
        }
        // Mask SSNs
        if (/^\d{3}-\d{2}-\d{4}$/.test(value)) {
          return '***-**-****'
        }
        // Mask credit cards
        if (/^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/.test(value)) {
          return value.replace(/(\d{4})[\s\-]?(\d{4})[\s\-]?(\d{4})[\s\-]?(\d{4})/, '$1-****-****-$4')
        }
        // For other sensitive strings, show first 2 and last 2 chars
        if (value.length > 4) {
          return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`
        }
        return '***'
      }
      return value
    }

    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase()
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = maskValue(sanitized[key])
      }
    })

    return sanitized
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

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
      'email',
      'phone',
      'ssn',
      'social_security',
      'credit_card',
      'card_number',
      'bank_account',
      'account_number',
      'personal_data',
      'pii',
      'sensitive',
    ];

    const maskValue = (value: any): any => {
      if (typeof value === 'string') {
        // Mask emails
        if (value.includes('@') && value.includes('.')) {
          const [local, domain] = value.split('@');
          return `${local.substring(0, 2)}***@${domain}`;
        }
        // Mask phone numbers (basic pattern)
        if (/^\+?[\d\s\-\(\)]{10,}$/.test(value.replace(/\s/g, ''))) {
          return value.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
        }
        // Mask SSNs
        if (/^\d{3}-\d{2}-\d{4}$/.test(value)) {
          return '***-**-****';
        }
        // Mask credit cards
        if (/^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/.test(value)) {
          return value.replace(
            /(\d{4})[\s\-]?(\d{4})[\s\-]?(\d{4})[\s\-]?(\d{4})/,
            '$1-****-****-$4'
          );
        }
        // For other sensitive strings, show first 2 and last 2 chars
        if (value.length > 4) {
          return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
        }
        return '***';
      }
      return value;
    };

    Object.keys(sanitized).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = maskValue(sanitized[key]);
      }
    });

    return sanitized;
  }

  // Export methods
  async exportLogs(format = 'json') {
    const localStorageDestination = this.destinations.get('localStorage')
    if (localStorageDestination) {
      const logs = localStorageDestination.getRecentLogs()
      const fileDestination = this.destinations.get('fileDownload')
      if (fileDestination) {
        await fileDestination.exportLogs(logs, format)
      }
    }
  }

  getRecentLogs(count = 100) {
    const localStorageDestination = this.destinations.get('localStorage')
    if (localStorageDestination) {
      return localStorageDestination.getRecentLogs(count)
    }
    return []
  }

  clearLogs() {
    const localStorageDestination = this.destinations.get('localStorage')
    if (localStorageDestination) {
      localStorageDestination.clearLogs()
    }
  }

  async flush() {
    const promises = Array.from(this.destinations.values())
      .filter(dest => dest.flush)
      .map(dest => dest.flush())
    
    await Promise.all(promises)
  }

  // Performance monitoring
  measurePerformance(operation, fn) {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    
    this.logPerformance(operation, duration)
    return result
  }

  async measureAsyncPerformance(operation, fn) {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    
    this.logPerformance(operation, duration)
    return result
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
    logAudit: logger.logAudit.bind(logger),
    logAuthFailure: logger.logAuthFailure.bind(logger),
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
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const logger = Logger.getInstance();

    descriptor.value = function (...args: any[]) {
      return logger.measureAsyncPerformance(operation, () => method.apply(this, args));
    };

    return descriptor;
  };
};

// Export singleton instance
export const logger = Logger.getInstance();

export default logger;
