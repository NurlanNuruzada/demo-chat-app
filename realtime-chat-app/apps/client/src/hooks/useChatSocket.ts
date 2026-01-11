import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { IMessage, ServerToClientEvent, IErrorMessage } from '@chat-app/shared';

interface UseChatSocketOptions {
  url?: string;
  onMessage?: (message: IMessage) => void;
  onHistory?: (messages: IMessage[]) => void;
  onError?: (error: IErrorMessage) => void;
  onStatusChange?: (connected: boolean) => void;
}

interface UseChatSocketReturn {
  socket: Socket | null;
  connected: boolean;
  error: IErrorMessage | null;
  sendMessage: (user: string, content: string) => void;
  disconnect: () => void;
}

/**
 * Hook for managing WebSocket connection using Socket.IO
 */
export function useChatSocket(options: UseChatSocketOptions = {}): UseChatSocketReturn {
  const {
    url = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001',
    onMessage,
    onHistory,
    onError,
    onStatusChange,
  } = options;

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<IErrorMessage | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Send message function
  const sendMessage = useCallback(
    (user: string, content: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('send_message', {
          type: 'send_message',
          payload: { user, content },
        } as const);
      }
    },
    []
  );

  // Disconnect function
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  }, []);

  // Setup connection on mount
  useEffect(() => {
    // Create socket connection
    const socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      onStatusChange?.(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      onStatusChange?.(false);
    });

    socket.on('connect_error', (err: Error) => {
      setError({
        type: 'error',
        code: 'CONNECTION_ERROR',
        message: err.message || 'Failed to connect to server',
      });
      setConnected(false);
      onStatusChange?.(false);
    });

    // Event handlers (Socket.IO receives the full event object)
    socket.on('history', (data: unknown) => {
      try {
        const event = data as ServerToClientEvent;
        if (event && event.type === 'history') {
          onHistory?.(event.payload.messages);
        }
      } catch (err) {
        console.error('Error handling history event:', err);
      }
    });

    socket.on('new_message', (data: unknown) => {
      try {
        const event = data as ServerToClientEvent;
        if (event && event.type === 'new_message') {
          onMessage?.(event.payload.message);
        }
      } catch (err) {
        console.error('Error handling new_message event:', err);
      }
    });

    socket.on('error', (data: unknown) => {
      try {
        const event = data as ServerToClientEvent;
        if (event && event.type === 'error') {
          setError(event.payload);
          onError?.(event.payload);
        }
      } catch (err) {
        console.error('Error handling error event:', err);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('history');
      socket.off('new_message');
      socket.off('error');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [url, onHistory, onMessage, onError, onStatusChange]);

  return {
    socket: socketRef.current,
    connected,
    error,
    sendMessage,
    disconnect,
  };
}
