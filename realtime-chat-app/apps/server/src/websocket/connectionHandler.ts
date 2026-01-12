import { Socket } from 'socket.io';
import { Server as SocketIOServer } from 'socket.io';
import { IMessage } from '@chat-app/shared';
import { messageStore } from '../store/messageStore.ts';
import { logInfo, logError } from '../utils/logger.ts';

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
  sendHistory(socket);
}

const HISTORY_MESSAGE_COUNT = 10;

/**
 * Send message history to a specific socket
 */
function sendHistory(socket: Socket): void {
  if (!socket.connected || socket.disconnected) {
    return;
  }

  try {
    const messages: IMessage[] = messageStore.getLastMessages(HISTORY_MESSAGE_COUNT);
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
