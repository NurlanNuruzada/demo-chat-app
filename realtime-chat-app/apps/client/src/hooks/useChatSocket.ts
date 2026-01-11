import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { IMessage, ServerToClientEvent, IErrorMessage, ClientToServerEvent } from '@chat-app/shared';
import { ConnectionStatus } from '../types/index.js';

interface UseChatSocketOptions {
  url?: string;
  enabled?: boolean; // Control whether socket should connect
  onMessage?: (message: IMessage) => void;
  onHistory?: (messages: IMessage[]) => void;
  onError?: (error: IErrorMessage) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

interface UseChatSocketReturn {
  socket: Socket | null;
  status: ConnectionStatus;
  connected: boolean;
  error: IErrorMessage | null;
  sendMessage: (user: string, content: string) => void;
  disconnect: () => void;
}

/**
 * Hook for managing WebSocket connection using Socket.IO
 * Simplified and reliable implementation
 */
export function useChatSocket(options: UseChatSocketOptions = {}): UseChatSocketReturn {
  const {
    url = import.meta.env.VITE_SERVER_URL || (typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : 'http://localhost:3001'),
    enabled = true,
    onMessage,
    onHistory,
    onError,
    onStatusChange,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<IErrorMessage | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isManualDisconnectRef = useRef<boolean>(false);

  // Update status helper
  const updateStatus = useCallback(
    (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    },
    [onStatusChange]
  );

  // Send message function
  const sendMessage = useCallback(
    (user: string, content: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('send_message', {
          type: 'send_message',
          payload: { user, content },
        } as ClientToServerEvent);
      } else {
        const errorMessage: IErrorMessage = {
          type: 'error',
          code: 'NOT_CONNECTED',
          message: 'Cannot send message: not connected to server',
        };
        setError(errorMessage);
        onError?.(errorMessage);
      }
    },
    [onError]
  );

  // Disconnect function
  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    updateStatus('disconnected');
  }, [updateStatus]);

  // Setup connection
  useEffect(() => {
    // Don't connect if disabled
    if (!enabled) {
      if (socketRef.current) {
        isManualDisconnectRef.current = true;
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      updateStatus('disconnected');
      return;
    }

    isManualDisconnectRef.current = false;
    updateStatus('connecting');

    // Create socket connection
    const socket = io(url, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
    });

    socketRef.current = socket;

    // Connection event
    socket.on('connect', () => {
      console.log('Socket connected');
      setError(null); // Clear any previous errors
      updateStatus('connected');
    });

    // Disconnect event
    socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
      if (!isManualDisconnectRef.current) {
        // Server disconnected or connection lost - will auto-reconnect
        updateStatus('reconnecting');
        // Clear error on disconnect - Socket.IO will handle reconnection
        setError(null);
      } else {
        updateStatus('disconnected');
      }
    });

    // Connection error
    socket.on('connect_error', (err: Error) => {
      console.error('Connection error:', err);
      // Don't show technical errors like "xhr poll error" to users
      // Socket.IO will automatically retry reconnection
      updateStatus('reconnecting');
      // Only show error if it's not a connection retry error
      if (!err.message.includes('xhr poll error') && !err.message.includes('websocket error')) {
        const errorMessage: IErrorMessage = {
          type: 'error',
          code: 'CONNECTION_ERROR',
          message: 'Connection lost. Reconnecting...',
        };
        setError(errorMessage);
        onError?.(errorMessage);
      }
    });

    // History event
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

    // New message event
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

    // Error event
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

    // Cleanup on unmount or when disabled
    return () => {
      isManualDisconnectRef.current = true;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [url, enabled, onHistory, onMessage, onError, updateStatus]);

  return {
    socket: socketRef.current,
    status,
    connected: socketRef.current?.connected ?? false,
    error,
    sendMessage,
    disconnect,
  };
}
