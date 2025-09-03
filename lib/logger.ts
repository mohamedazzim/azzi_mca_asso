/**
 * Production-ready logging utility
 * Replaces console statements with structured logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = 'API' | 'CLIENT' | 'SYSTEM' | 'AUTH' | 'STORAGE' | 'SECURITY';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: LogContext;
  message: string;
  data?: any;
  error?: Error;
  userId?: string;
  requestId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[level] >= levels[this.logLevel];
  }

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, context, message, data, error } = entry;
    let formatted = `[${timestamp}] ${level.toUpperCase()} [${context}] ${message}`;
    
    if (data && Object.keys(data).length > 0) {
      formatted += ` | Data: ${JSON.stringify(data)}`;
    }
    
    if (error) {
      formatted += ` | Error: ${error.message}`;
      if (this.isDevelopment && error.stack) {
        formatted += `\nStack: ${error.stack}`;
      }
    }
    
    return formatted;
  }

  private log(level: LogLevel, context: LogContext, message: string, data?: any, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
      error
    };

    const formatted = this.formatMessage(entry);

    // In production, only log errors and warnings
    if (!this.isDevelopment) {
      if (level === 'error' || level === 'warn') {
        // In production, we could send to external logging service
        // For now, we'll use console but this would be replaced
        if (level === 'error') {
          
        } else {
          
        }
      }
      return;
    }

    // Development logging
    switch (level) {
      case 'debug':
        
        break;
      case 'info':
        
        break;
      case 'warn':
        
        break;
      case 'error':
        
        break;
    }
  }

  debug(context: LogContext, message: string, data?: any): void {
    this.log('debug', context, message, data);
  }

  info(context: LogContext, message: string, data?: any): void {
    this.log('info', context, message, data);
  }

  warn(context: LogContext, message: string, data?: any, error?: Error): void {
    this.log('warn', context, message, data, error);
  }

  error(context: LogContext, message: string, data?: any, error?: Error): void {
    this.log('error', context, message, data, error);
  }

  // API-specific logging methods
  apiRequest(method: string, path: string, userId?: string): void {
    this.info('API', `${method} ${path}`, { userId });
  }

  apiError(method: string, path: string, error: Error, data?: any): void {
    this.error('API', `${method} ${path} failed`, data, error);
  }

  apiSuccess(method: string, path: string, responseData?: any): void {
    this.debug('API', `${method} ${path} success`, responseData);
  }

  // Client-side logging
  clientError(component: string, error: Error, context?: any): void {
    this.error('CLIENT', `Error in ${component}`, context, error);
  }

  clientWarning(component: string, message: string, context?: any): void {
    this.warn('CLIENT', `Warning in ${component}: ${message}`, context);
  }

  // Storage operations
  storageOperation(operation: string, success: boolean, data?: any, error?: Error): void {
    if (success) {
      this.debug('STORAGE', `${operation} completed`, data);
    } else {
      this.error('STORAGE', `${operation} failed`, data, error);
    }
  }

  // Security events
  securityEvent(event: string, severity: 'low' | 'medium' | 'high', data?: any): void {
    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    this.log(level, 'SECURITY', `Security event: ${event}`, data);
  }

  // Authentication events
  authEvent(event: string, userId?: string, success: boolean = true, error?: Error): void {
    if (success) {
      this.info('AUTH', event, { userId });
    } else {
      this.warn('AUTH', `${event} failed`, { userId }, error);
    }
  }
}

export const logger = new Logger();

// Helper functions for common logging patterns
export const logError = (context: LogContext, message: string, error: Error, data?: any) => {
  logger.error(context, message, data, error);
};

export const logWarning = (context: LogContext, message: string, data?: any) => {
  logger.warn(context, message, data);
};

export const logInfo = (context: LogContext, message: string, data?: any) => {
  logger.info(context, message, data);
};

export const logDebug = (context: LogContext, message: string, data?: any) => {
  logger.debug(context, message, data);
};