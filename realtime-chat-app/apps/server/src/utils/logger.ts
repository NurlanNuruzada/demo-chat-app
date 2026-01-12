/**
 * Simple logger utility
 * Provides structured logging with levels
 */
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

interface LogContext {
  [key: string]: unknown;
}

/**
 * Sanitize error for logging
 * In production, removes stack traces and sensitive details
 */
export function sanitizeError(error: unknown, isProduction: boolean): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: isProduction ? undefined : error.stack,
    };
  }
  return {
    message: String(error),
  };
}

/**
 * Log a message with optional context
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // Human-readable format for development
    const contextStr = context && Object.keys(context).length > 0 
      ? ' ' + JSON.stringify(context, null, 2)
      : '';
    console.log(`[${level}] ${timestamp} - ${message}${contextStr}`);
  } else {
    // JSON format for production (better for log aggregators)
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * Log info message
 */
export function logInfo(message: string, context?: LogContext): void {
  log(LogLevel.INFO, message, context);
}

/**
 * Log warning message
 */
export function logWarn(message: string, context?: LogContext): void {
  log(LogLevel.WARN, message, context);
}

/**
 * Log error message
 */
export function logError(message: string, context?: LogContext): void {
  log(LogLevel.ERROR, message, context);
}

/**
 * Log debug message
 */
export function logDebug(message: string, context?: LogContext): void {
  log(LogLevel.DEBUG, message, context);
}
