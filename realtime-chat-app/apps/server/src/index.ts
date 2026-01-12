import { Server } from './server.js';
import { logInfo, logError, sanitizeError } from './utils/logger.js';
import { config } from './config/env.js';

/**
 * Handle and log errors with production-safe sanitization
 */
function handleError(error: unknown, context: string): void {
  const isProduction = config.nodeEnv === 'production';
  const sanitized = sanitizeError(error, isProduction);
  logError(context, {
    error: sanitized.message,
    ...(sanitized.stack && { stack: sanitized.stack }),
  });
  process.exit(1);
}

/**
 * Server entry point
 * Starts the HTTP and WebSocket servers
 */
async function main(): Promise<void> {
  const server = new Server();

  try {
    await server.start();
    logInfo('Server is running and ready to accept connections');
  } catch (error) {
    handleError(error, 'Failed to start server');
  }
}

// Start the server
// Note: The .catch() is a safety net for any unhandled promise rejections
// that might occur outside the try/catch block, though the try/catch should
// handle all errors from server.start(). This provides defense in depth.
main().catch((error) => {
  handleError(error, 'Unhandled error');
});
