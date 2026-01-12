export type { IMessage, ClientToServerEvent, ServerToClientEvent, IErrorMessage } from '@chat-app/shared';
import { CONNECTION_STATUS } from '../utils/constants';

/**
 * Connection status types
 * Uses constants to ensure type safety and avoid hardcoded strings
 */
export type ConnectionStatus =
  | typeof CONNECTION_STATUS.CONNECTING
  | typeof CONNECTION_STATUS.CONNECTED
  | typeof CONNECTION_STATUS.RECONNECTING
  | typeof CONNECTION_STATUS.DISCONNECTED;
