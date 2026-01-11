import { Socket } from 'socket.io';
import { ClientToServerEvent } from '@chat-app/shared';

/**
 * Handle heartbeat (ping/pong) mechanism
 * Server responds immediately with pong when ping is received
 */
export function handleHeartbeat(socket: Socket): void {
  socket.on('ping', (data: unknown) => {
    try {
      const event = data as ClientToServerEvent;
      if (event && event.type === 'ping') {
        // Respond immediately with pong
        socket.emit('pong', {
          type: 'pong',
          payload: {
            timestamp: event.payload.timestamp || Date.now(),
          },
        } as const);
      }
    } catch (error) {
      // Ignore ping errors - don't crash on malformed ping
      console.error('Error handling ping:', error);
    }
  });
}
