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
export function handleMessage(
  socket: Socket,
  io: SocketIOServer,
  data: unknown
): void {
  try {
    // Parse incoming message
    let event: ClientToServerEvent;
    try {
      // If data is already an object, use it directly
      if (typeof data === 'object' && data !== null) {
        event = data as ClientToServerEvent;
      } else if (typeof data === 'string') {
        // If data is a string, parse it
        event = JSON.parse(data) as ClientToServerEvent;
      } else {
        throw new Error('Invalid message format');
      }
    } catch (parseError) {
      logWarn('Failed to parse message', {
        socketId: socket.id,
        error: parseError instanceof Error ? parseError.message : 'Unknown error',
      });

      // Send error back to sender only
      const errorMessage: IErrorMessage = {
        type: 'error',
        code: 'PARSE_ERROR',
        message: 'Failed to parse message. Invalid JSON format.',
      };
      sendError(socket, errorMessage);
      return;
    }

    // Validate message
    const validation = validateMessage(event);
    if (!validation.valid) {
      logWarn('Message validation failed', {
        socketId: socket.id,
        error: validation.error,
      });

      // Send error back to sender only
      if (validation.error) {
        sendError(socket, validation.error);
      }
      return;
    }

    // Sanitize message (trim whitespace)
    const sanitizedEvent = sanitizeMessage(event);

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

    // Send generic error back to sender
    const errorMessage: IErrorMessage = {
      type: 'error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    };
    sendError(socket, errorMessage);
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
    // Check if socket is ready/open
    if (socket.connected && socket.disconnected === false) {
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
    } else {
      errorCount++;
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
  if (socket.connected && socket.disconnected === false) {
    try {
      socket.emit('error', {
        type: 'error',
        payload: error,
      } as const);
    } catch (error) {
      logError('Failed to send error to client', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
