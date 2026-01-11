export type { IMessage, ClientToServerEvent, ServerToClientEvent, IErrorMessage } from '@chat-app/shared';

/**
 * Connection status types
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
