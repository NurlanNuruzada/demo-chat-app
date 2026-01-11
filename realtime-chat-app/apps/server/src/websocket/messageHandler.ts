import { Socket } from 'socket.io';
import { Server as SocketIOServer } from 'socket.io';
import { IMessage, ClientToServerEvent, IErrorMessage } from '@chat-app/shared';
import { v4 as uuidv4 } from 'uuid';
import { messageStore } from '../store/messageStore.js';
import { validateMessage, sanitizeMessage } from '../validators/messageValidator.js';
import { logInfo, logError, logWarn } from '../utils/logger.js';

/**
 * Handle incoming message from client
 * Flow: Parse -> Validate -> Store -> Broadcast
 */

/**
 * Parse incoming message data into ClientToServerEvent
 */
function parseMessageData(data: unknown): ClientToServerEvent | null {
  try {
    if (typeof data === 'object' && data !== null) {
      return data as ClientToServerEvent;
    }
    if (typeof data === 'string') {
      return JSON.parse(data) as ClientToServerEvent;
    }
    return null;
  } catch {
    return null;
  }
}

export function handleMessage(
  socket: Socket,
  io: SocketIOServer,
  data: unknown
): void {
  try {
    // Parse incoming message
    const event = parseMessageData(data);
    if (!event) {
      logWarn('Failed to parse message', {
        socketId: socket.id,
      });
      sendError(socket, {
        type: 'error',
        code: 'PARSE_ERROR',
        message: 'Failed to parse message. Invalid JSON format.',
      });
      return;
    }

    // Validate message
    const validation = validateMessage(event);
    if (!validation.valid) {
      logWarn('Message validation failed', {
        socketId: socket.id,
        error: validation.error,
      });
      if (validation.error) {
        sendError(socket, validation.error);
      }
      return;
    }

    // Type guard: ensure this is a send_message event
    if (event.type !== 'send_message') {
      sendError(socket, {
        type: 'error',
        code: 'INVALID_EVENT_TYPE',
        message: `Expected 'send_message' event, got '${event.type}'`,
      });
      return;
    }

    // Sanitize message (trim whitespace)
    const sanitizedEvent = sanitizeMessage(event);
    if (sanitizedEvent.type !== 'send_message') {
      sendError(socket, {
        type: 'error',
        code: 'INVALID_EVENT_TYPE',
        message: 'Invalid event type after sanitization',
      });
      return;
    }

    // Create server-side message object
    const message: IMessage = {
      id: uuidv4(),
      user: sanitizedEvent.payload.user,
      content: sanitizedEvent.payload.content,
      timestamp: Date.now(),
    };

    // Store message (automatically trims to last 10)
    messageStore.addMessage(message);
    logInfo('Message stored', {
      messageId: message.id,
      user: message.user,
      totalMessages: messageStore.getMessageCount(),
    });

    // Broadcast to all connected clients
    broadcastMessage(io, message);
  } catch (error) {
    logError('Unexpected error handling message', {
      socketId: socket.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    sendError(socket, {
      type: 'error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  }
}

/**
 * Broadcast message to all connected clients
 * Safely handles closed sockets and send errors
 */
function broadcastMessage(io: SocketIOServer, message: IMessage): void {
  let successCount = 0;
  let errorCount = 0;

  io.sockets.sockets.forEach((socket) => {
    if (!socket.connected || socket.disconnected) {
      errorCount++;
      return;
    }

    try {
      socket.emit('new_message', {
        type: 'new_message',
        payload: { message },
      } as const);
      successCount++;
    } catch (error) {
      errorCount++;
      logWarn('Failed to send message to client', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  logInfo('Message broadcasted', {
    messageId: message.id,
    successCount,
    errorCount,
    totalClients: io.sockets.sockets.size,
  });
}

/**
 * Send error message to a specific socket
 */
function sendError(socket: Socket, error: IErrorMessage): void {
  if (!socket.connected || socket.disconnected) {
    return;
  }

  try {
    socket.emit('error', {
      type: 'error',
      payload: error,
    } as const);
  } catch (err) {
    logError('Failed to send error to client', {
      socketId: socket.id,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
