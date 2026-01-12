import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { IMessage, ServerToClientEvent, IErrorMessage, ClientToServerEvent } from '@chat-app/shared';
import { ConnectionStatus } from '../types/index.ts';
import { getDefaultServerUrl, shouldFilterError } from '../utils/socketHelpers';
import { SOCKET_CONFIG, ERROR_MESSAGES } from '../utils/constants';

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
    url = getDefaultServerUrl(),
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
          message: ERROR_MESSAGES.NOT_CONNECTED,
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
      reconnectionDelay: SOCKET_CONFIG.RECONNECTION_DELAY,
      reconnectionDelayMax: SOCKET_CONFIG.RECONNECTION_DELAY_MAX,
      reconnectionAttempts: SOCKET_CONFIG.RECONNECTION_ATTEMPTS,
    });

    socketRef.current = socket;

    // Connection event
    socket.on('connect', () => {
      setError(null);
      updateStatus('connected');
    });

    // Disconnect event
    socket.on('disconnect', () => {
      if (!isManualDisconnectRef.current) {
        updateStatus('reconnecting');
        setError(null);
      } else {
        updateStatus('disconnected');
      }
    });

    // Connection error
    socket.on('connect_error', (err: Error) => {
      updateStatus('reconnecting');
      // Only show error if it's not a technical connection retry error
      if (!shouldFilterError(err.message)) {
        const errorMessage: IErrorMessage = {
          type: 'error',
          code: 'CONNECTION_ERROR',
          message: ERROR_MESSAGES.CONNECTION_LOST,
        };
        setError(errorMessage);
        onError?.(errorMessage);
      }
    });

    /**
     * Handle server event with type safety
     */
    const handleServerEvent = <T extends ServerToClientEvent>(
      data: unknown,
      eventType: T['type'],
      handler?: (payload: T['payload']) => void
    ): void => {
      try {
        const event = data as T;
        if (event?.type === eventType) {
          handler?.(event.payload);
        }
      } catch (error) {
        const errorMessage: IErrorMessage = {
          type: 'error',
          code: 'PARSE_ERROR',
          message: `Failed to parse ${eventType} event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
        setError(errorMessage);
        onError?.(errorMessage);
        console.warn(`Failed to parse server event (${eventType}):`, error);
      }
    };

    // History event
    socket.on('history', (data: unknown) => {
      handleServerEvent<Extract<ServerToClientEvent, { type: 'history' }>>(
        data,
        'history',
        (payload) => {
          onHistory?.(payload.messages);
        }
      );
    });

    // New message event
    socket.on('new_message', (data: unknown) => {
      handleServerEvent<Extract<ServerToClientEvent, { type: 'new_message' }>>(
        data,
        'new_message',
        (payload) => {
          onMessage?.(payload.message);
        }
      );
    });

    // Error event
    socket.on('error', (data: unknown) => {
      handleServerEvent<Extract<ServerToClientEvent, { type: 'error' }>>(
        data,
        'error',
        (payload) => {
          setError(payload);
          onError?.(payload);
        }
      );
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
