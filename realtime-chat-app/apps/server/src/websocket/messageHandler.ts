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
 * Validate that an object is a valid ClientToServerEvent
 */
function isValidClientEvent(obj: unknown): obj is ClientToServerEvent {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const event = obj as Record<string, unknown>;
  
  // Must have type field
  if (typeof event.type !== 'string') {
    return false;
  }
  
  // Must have payload field
  if (!event.payload || typeof event.payload !== 'object') {
    return false;
  }
  
  // Validate based on event type
  switch (event.type) {
    case 'send_message': {
      const payload = event.payload as Record<string, unknown>;
      return (
        typeof payload.user === 'string' &&
        typeof payload.content === 'string'
      );
    }
    case 'read_messages': {
      const payload = event.payload as Record<string, unknown>;
      return (
        Array.isArray(payload.messageIds) &&
        payload.messageIds.every((id: unknown) => typeof id === 'string') &&
        typeof payload.userId === 'string'
      );
    }
    case 'join_room':
    case 'leave_room': {
      const payload = event.payload as Record<string, unknown>;
      return typeof payload.userId === 'string';
    }
    case 'ping': {
      const payload = event.payload as Record<string, unknown>;
      return typeof payload.timestamp === 'number';
    }
    default:
      return false;
  }
}

/**
 * Parse incoming message data into ClientToServerEvent
 */
function parseMessageData(data: unknown): ClientToServerEvent | null {
  try {
    let parsed: unknown = data;
    
    // Parse string to object
    if (typeof data === 'string') {
      parsed = JSON.parse(data);
    }
    
    // Validate structure
    if (isValidClientEvent(parsed)) {
      return parsed;
    }
    
    return null;
  } catch {
    return null;
  }
}

export async function handleMessage(
  socket: Socket,
  io: SocketIOServer,
  data: unknown
): Promise<void> {
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

    // Validate message (includes type check)
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

    // At this point, event.type is guaranteed to be 'send_message' by validateMessage
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
    await messageStore.addMessage(message);
    const totalMessages = await messageStore.getMessageCount();
    logInfo('Message stored', {
      messageId: message.id,
      user: message.user,
      totalMessages,
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
