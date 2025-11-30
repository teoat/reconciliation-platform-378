import { SERVER_NAME } from './config.js';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info'; // Default to info
const JSON_LOGGING = process.env.JSON_LOGGING === 'true';

const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

function log(level: keyof typeof LEVELS, message: string, data?: object) {
  if (LEVELS[level] <= LEVELS[LOG_LEVEL]) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      server: SERVER_NAME,
      message,
      ...(data && { data }),
    };

    if (JSON_LOGGING) {
      console[level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'info'](JSON.stringify(logEntry));
    } else {
      const dataString = data ? ` ${JSON.stringify(data)}` : '';
      console[level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'info'](
        `[${timestamp}] [${level.toUpperCase()}] [${SERVER_NAME}] ${message}${dataString}`
      );
    }
  }
}

export const logger = {
  error: (message: string, data?: object) => log('error', message, data),
  warn: (message: string, data?: object) => log('warn', message, data),
  info: (message: string, data?: object) => log('info', message, data),
  debug: (message: string, data?: object) => log('debug', message, data),
  trace: (message: string, data?: object) => log('trace', message, data),
};
