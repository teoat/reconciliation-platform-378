// Simple logger service for the application
// In production, this should be replaced with a proper logging service like Winston or similar

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogEntry['level'], message: string, data?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
    };

    if (this.isDevelopment) {
      const prefix = `[${level.toUpperCase()}]`;
      const dataStr = data ? ` ${JSON.stringify(data)}` : '';
      console.log(`${prefix} ${message}${dataStr}`);
    } else {
      // In production, send to logging service
      // this.sendToLoggingService(entry);
    }
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log('warn', message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, unknown>) {
    this.log('error', message, data);
  }

  // Performance logging
  logPerformance(name: string, duration: number, data?: Record<string, unknown>) {
    this.info(`Performance: ${name}`, { duration, ...data });
  }

  // User action logging
  logUserAction(action: string, component: string, data?: Record<string, unknown>) {
    this.info(`User Action: ${action}`, { component, ...data });
  }

  // Error tracking
  logError(error: Error, context?: Record<string, unknown>) {
    this.error(error.message, {
      stack: error.stack,
      ...context,
    });
  }
}

export const logger = new Logger();
