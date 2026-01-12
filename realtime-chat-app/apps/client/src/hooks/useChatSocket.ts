import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { IMessage, ServerToClientEvent, IErrorMessage, ClientToServerEvent } from '@chat-app/shared';
import { ConnectionStatus } from '../types/index.ts';
import { getDefaultServerUrl, shouldFilterError } from '../utils/socketHelpers';
import { SOCKET_CONFIG, ERROR_MESSAGES, CONNECTION_STATUS } from '../utils/constants';

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

  const [status, setStatus] = useState<ConnectionStatus>(CONNECTION_STATUS.DISCONNECTED);
  const [error, setError] = useState<IErrorMessage | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isManualDisconnectRef = useRef<boolean>(false);
  
  // Use refs for callbacks to avoid reconnections when callbacks change
  const onMessageRef = useRef(onMessage);
  const onHistoryRef = useRef(onHistory);
  const onErrorRef = useRef(onError);
  
  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onHistoryRef.current = onHistory;
    onErrorRef.current = onError;
  }, [onMessage, onHistory, onError]);

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
        onErrorRef.current?.(errorMessage);
      }
    },
    []
  );

  // Disconnect function
  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    updateStatus(CONNECTION_STATUS.DISCONNECTED);
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
      updateStatus(CONNECTION_STATUS.DISCONNECTED);
      return;
    }

    isManualDisconnectRef.current = false;
    updateStatus(CONNECTION_STATUS.CONNECTING);

    // Debug: Log connection URL
    if (import.meta.env.DEV) {
      console.log('[Socket] Connecting to:', url);
    }

    // Create socket connection
    // Try WebSocket first for better performance, fallback to polling
    const socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: SOCKET_CONFIG.RECONNECTION_DELAY,
      reconnectionDelayMax: SOCKET_CONFIG.RECONNECTION_DELAY_MAX,
      reconnectionAttempts: SOCKET_CONFIG.RECONNECTION_ATTEMPTS,
    });

    socketRef.current = socket;

    // Connection event
    socket.on('connect', () => {
      if (import.meta.env.DEV) {
        console.log('[Socket] Connected successfully');
      }
      setError(null);
      updateStatus(CONNECTION_STATUS.CONNECTED);
    });

    // Disconnect event
    socket.on('disconnect', () => {
      if (!isManualDisconnectRef.current) {
        updateStatus(CONNECTION_STATUS.RECONNECTING);
        setError(null);
      } else {
        updateStatus(CONNECTION_STATUS.DISCONNECTED);
      }
    });

    // Connection error
    socket.on('connect_error', (err: Error) => {
      if (import.meta.env.DEV) {
        console.error('[Socket] Connection error:', err.message, err);
      }
      updateStatus(CONNECTION_STATUS.RECONNECTING);
      // Only show error if it's not a technical connection retry error
      if (!shouldFilterError(err.message)) {
        const errorMessage: IErrorMessage = {
          type: 'error',
          code: 'CONNECTION_ERROR',
          message: ERROR_MESSAGES.CONNECTION_LOST,
        };
        setError(errorMessage);
        onErrorRef.current?.(errorMessage);
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
        onErrorRef.current?.(errorMessage);
        // Log in development for debugging
        if (import.meta.env.DEV) {
          console.warn(`Failed to parse server event (${eventType}):`, error);
        }
      }
    };

    // History event
    socket.on('history', (data: unknown) => {
      handleServerEvent<Extract<ServerToClientEvent, { type: 'history' }>>(
        data,
        'history',
        (payload) => {
          onHistoryRef.current?.(payload.messages);
        }
      );
    });

    // New message event
    socket.on('new_message', (data: unknown) => {
      handleServerEvent<Extract<ServerToClientEvent, { type: 'new_message' }>>(
        data,
        'new_message',
        (payload) => {
          onMessageRef.current?.(payload.message);
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
          onErrorRef.current?.(payload);
        }
      );
    });

    // Cleanup on unmount or when disabled
    return () => {
      isManualDisconnectRef.current = true;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [url, enabled, updateStatus]);

  return {
    socket: socketRef.current,
    status,
    connected: socketRef.current?.connected ?? false,
    error,
    sendMessage,
    disconnect,
  };
}
