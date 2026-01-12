import { Socket } from 'socket.io';
import { Server as SocketIOServer } from 'socket.io';
import { IMessage, HISTORY_MESSAGE_COUNT } from '@chat-app/shared';
import { messageStore } from '../store/messageStore.js';
import { logInfo, logError } from '../utils/logger.js';

/**
 * Handle new client connection
 * Sends message history (last 10 messages) to the new client
 */
export function handleConnection(socket: Socket, io: SocketIOServer): void {
  logInfo('Client connected', {
    socketId: socket.id,
    totalClients: io.sockets.sockets.size,
  });

  // Send connection hydration (last 10 messages)
  // Fire and forget - errors are handled in sendHistory
  sendHistory(socket).catch((error) => {
    logError('Failed to send history in handleConnection', {
      socketId: socket.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  });
}

/**
 * Send message history to a specific socket
 */
async function sendHistory(socket: Socket): Promise<void> {
  if (!socket.connected || socket.disconnected) {
    return;
  }

  try {
    const messages: IMessage[] = await messageStore.getLastMessages(HISTORY_MESSAGE_COUNT);
    socket.emit('history', {
      type: 'history',
      payload: { messages },
    } as const);

    logInfo('History sent to client', {
      socketId: socket.id,
      messageCount: messages.length,
    });
  } catch (error) {
    logError('Failed to send history to client', {
      socketId: socket.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
