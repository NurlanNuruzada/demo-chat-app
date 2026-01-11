import { ClientToServerEvent, IErrorMessage } from '@chat-app/shared';

const MAX_CONTENT_LENGTH = 700;

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: IErrorMessage;
}

/**
 * Validate incoming message event
 * Required: content not empty
 * Bonus: max length 700, user not empty, trim whitespace
 */
export function validateMessage(event: ClientToServerEvent): ValidationResult {
  // Check event type
  if (event.type !== 'send_message') {
    return {
      valid: false,
      error: {
        type: 'error',
        code: 'INVALID_EVENT_TYPE',
        message: `Expected 'send_message' event, got '${event.type}'`,
      },
    };
  }

  const { user, content } = event.payload;

  // Required: user not empty
  if (!user || typeof user !== 'string' || user.trim().length === 0) {
    return {
      valid: false,
      error: {
        type: 'error',
        code: 'INVALID_USER',
        message: 'Username is required and cannot be empty',
        field: 'user',
      },
    };
  }

  // Required: content not empty
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return {
      valid: false,
      error: {
        type: 'error',
        code: 'INVALID_CONTENT',
        message: 'Message content is required and cannot be empty',
        field: 'content',
      },
    };
  }

  // Bonus: max length check
  if (content.length > MAX_CONTENT_LENGTH) {
    return {
      valid: false,
      error: {
        type: 'error',
        code: 'CONTENT_TOO_LONG',
        message: `Message content cannot exceed ${MAX_CONTENT_LENGTH} characters`,
        field: 'content',
      },
    };
  }

  return { valid: true };
}

/**
 * Sanitize message content (trim whitespace)
 */
export function sanitizeMessage(event: ClientToServerEvent): ClientToServerEvent {
  if (event.type === 'send_message') {
    return {
      ...event,
      payload: {
        user: event.payload.user.trim(),
        content: event.payload.content.trim(),
      },
    };
  }
  return event;
}
