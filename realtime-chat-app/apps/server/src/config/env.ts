import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { logInfo, logWarn } from '../utils/logger.js';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve path to project root (go up from apps/server/src/config to root)
const projectRoot = resolve(__dirname, '../../../..');

// Load .env from project root
const envPath = join(projectRoot, '.env');
const result = dotenv.config({ 
  path: envPath,
  override: false 
});

if (result.error) {
  logWarn('Could not load .env file', {
    path: envPath,
    error: result.error.message,
  });
} else {
  logInfo('Loaded .env file', { path: envPath });
}

/**
 * Environment configuration
 */
const parsedPort = parseInt(process.env.SERVER_PORT || '3001', 10);
const parsedShutdownTimeout = parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT || '10000', 10);
const parsedMaxMessages = parseInt(process.env.MAX_MESSAGES || '10', 10);

export const config = {
  port: isNaN(parsedPort) ? 3001 : parsedPort,
  corsOrigin: process.env.CORS_ORIGIN === '*' 
    ? true 
    : process.env.CORS_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  gracefulShutdownTimeout: isNaN(parsedShutdownTimeout) ? 10000 : parsedShutdownTimeout,
  maxMessages: isNaN(parsedMaxMessages) || parsedMaxMessages < 1 ? 10 : parsedMaxMessages,
  fileEncoding: process.env.FILE_ENCODING || 'utf-8',
};
