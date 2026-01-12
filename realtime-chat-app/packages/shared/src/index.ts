/**
 * Shared types and interfaces for the chat application
 * Ensures type safety between client and server
 */

// Core message interface
export type { IMessage } from './types/IMessage';

// Event types
export type { ClientToServerEvent } from './types/ClientEvents';

// Constants
export { MAX_CONTENT_LENGTH, HISTORY_MESSAGE_COUNT } from './constants.js';
export type { ServerToClientEvent } from './types/ServerEvents';

// Error types
export type { IErrorMessage } from './types/ErrorMessage';
