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
 * Log a message with optional context
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...context,
  };
  console.log(JSON.stringify(logEntry));
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
