import { Socket } from 'socket.io';
import { ClientToServerEvent } from '@chat-app/shared';
import { logError, sanitizeError } from '../utils/logger.js';
import { config } from '../config/env.js';

/**
 * Handle heartbeat (ping/pong) mechanism
 * Server responds immediately with pong when ping is received
 */
/**
 * Validate ping event structure
 */
function isValidPingEvent(obj: unknown): obj is ClientToServerEvent & { type: 'ping' } {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const event = obj as Record<string, unknown>;
  return (
    event.type === 'ping' &&
    Boolean(event.payload) &&
    typeof event.payload === 'object' &&
    typeof (event.payload as Record<string, unknown>).timestamp === 'number'
  );
}

export function handleHeartbeat(socket: Socket): void {
  socket.on('ping', (data: unknown) => {
    try {
      if (isValidPingEvent(data)) {
        // Respond immediately with pong
        socket.emit('pong', {
          type: 'pong',
          payload: {
            timestamp: data.payload.timestamp || Date.now(),
          },
        } as const);
      }
    } catch (error) {
      // Ignore ping errors - don't crash on malformed ping
      const isProduction = config.nodeEnv === 'production';
      const sanitized = sanitizeError(error, isProduction);
      logError('Error handling ping', {
        error: sanitized.message,
        ...(sanitized.stack && { stack: sanitized.stack }),
      });
    }
  });
}
