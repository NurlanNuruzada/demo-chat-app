import { MAX_CONTENT_LENGTH } from '@chat-app/shared';

/**
 * Application constants
 */

export const STORAGE_KEYS = {
  USERNAME: 'chat-app-username',
} as const;

export const SOCKET_CONFIG = {
  DEFAULT_PORT: 3001,
  RECONNECTION_DELAY: 1000,
  RECONNECTION_DELAY_MAX: 5000,
  RECONNECTION_ATTEMPTS: Infinity,
} as const;

export const VALIDATION = {
  MAX_USERNAME_LENGTH: 50,
  MAX_MESSAGE_LENGTH: MAX_CONTENT_LENGTH,
  ERROR_TIMEOUT_SHORT: 2000,
  ERROR_TIMEOUT_LONG: 5000,
} as const;

export const TEXTAREA_CONFIG = {
  LINE_HEIGHT: 22,
  MIN_LINES: 1,
  MAX_LINES: 6,
  HEIGHT_BUFFER: 2,
} as const;

export const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  DISCONNECTED: 'disconnected',
} as const;

export const CONNECTION_STATUS_TEXT = {
  CONNECTING: 'Connecting...',
  CONNECTED: 'Connected',
  RECONNECTING: 'Reconnecting...',
  DISCONNECTED: 'Not Connected',
  UNKNOWN: 'Unknown',
} as const;

export const ERROR_MESSAGES = {
  NOT_CONNECTED: 'Cannot send message: not connected to server',
  CONNECTION_LOST: 'Connection lost. Reconnecting...',
  DISCONNECTED: 'Disconnected from server',
  USERNAME_REQUIRED: 'Please enter your name',
  USERNAME_TOO_LONG: 'Name must be 50 characters or less',
  MESSAGE_TOO_LONG: '700 characters',
  MESSAGE_CANNOT_EXCEED: 'cannot exceed',
} as const;
