import { ERROR_MESSAGES } from './constants';

/**
 * Check if an error message is a validation error
 */
export function isValidationError(message: string | null | undefined): boolean {
  if (!message) return false;
  return (
    message.includes(ERROR_MESSAGES.MESSAGE_TOO_LONG) ||
    message.includes(ERROR_MESSAGES.MESSAGE_CANNOT_EXCEED)
  );
}

/**
 * Check if an error message is a connection error
 */
export function isConnectionError(message: string | null | undefined): boolean {
  if (!message) return false;
  return (
    message.includes(ERROR_MESSAGES.CONNECTION_LOST) ||
    message.includes(ERROR_MESSAGES.DISCONNECTED)
  );
}
